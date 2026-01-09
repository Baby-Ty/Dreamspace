const { BlobServiceClient } = require('@azure/storage-blob');
const https = require('https');
const http = require('http');
const { requireUserAccess, isAuthRequired, getCorsHeaders } = require('../utils/authMiddleware');

// Initialize Blob Service Client
let blobServiceClient;
if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
  blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );
}

const CONTAINER_NAME = 'dreams-pictures';

// SSRF Protection: Allowlist of trusted domains for image URLs
const ALLOWED_DOMAINS = [
  'oaidalleapiprodscus.blob.core.windows.net',  // DALL-E generated images
  'dalleprodsec.blob.core.windows.net',          // DALL-E generated images (alternate)
  'images.unsplash.com',                          // Unsplash images
  'plus.unsplash.com',                            // Unsplash plus images
  'source.unsplash.com',                          // Unsplash source
  'storage.googleapis.com',                       // Google Cloud Storage (if needed)
  'blob.core.windows.net',                        // Azure Blob Storage (our own)
];

/**
 * Validate URL against allowlist to prevent SSRF attacks
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is allowed
 */
function isUrlAllowed(url) {
  try {
    const urlObj = new URL(url);
    
    // Only allow HTTPS
    if (urlObj.protocol !== 'https:') {
      return false;
    }
    
    // Check if the hostname matches any allowed domain
    const hostname = urlObj.hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

/**
 * Fetch image from URL (server-side, no CORS issues)
 * Only fetches from allowlisted domains to prevent SSRF
 */
function fetchImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    // SSRF Protection: Validate URL before fetching
    if (!isUrlAllowed(url)) {
      reject(new Error('URL not allowed. Only images from trusted sources (DALL-E, Unsplash, Azure Blob) are permitted.'));
      return;
    }
    
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    client.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch image: ${res.statusCode} ${res.statusMessage}`));
        return;
      }
      
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

module.exports = async function (context, req) {
  // Set CORS headers
  const headers = getCorsHeaders();

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  const userId = context.bindingData.userId;
  const dreamId = context.bindingData.dreamId;

  context.log('Uploading dream picture:', { userId, dreamId });

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'User ID is required' }),
      headers
    };
    return;
  }

  // AUTH CHECK: Users can only upload to their own dreams
  if (isAuthRequired()) {
    const user = await requireUserAccess(context, req, userId);
    if (!user) return; // 401 or 403 already sent
    context.log(`User ${user.email} uploading dream picture for ${userId}`);
  }

  if (!dreamId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'Dream ID is required' }),
      headers
    };
    return;
  }

  // Check if Blob Storage is configured
  if (!blobServiceClient) {
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        error: 'Blob storage not configured', 
        details: 'AZURE_STORAGE_CONNECTION_STRING environment variable is required' 
      }),
      headers
    };
    return;
  }

  try {
    let imageBuffer;
    let contentType = 'image/jpeg';

    // Check if request body is JSON with imageUrl (for DALL-E images)
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      
      if (body.imageUrl) {
        // Fetch image from URL (server-side, no CORS issues)
        context.log('Fetching image from URL:', body.imageUrl);
        imageBuffer = await fetchImageFromUrl(body.imageUrl);
        
        // Detect content type from URL or buffer
        if (body.imageUrl.includes('.png')) {
          contentType = 'image/png';
        } else if (body.imageUrl.includes('.gif')) {
          contentType = 'image/gif';
        } else if (body.imageUrl.includes('.webp')) {
          contentType = 'image/webp';
        } else if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50) {
          contentType = 'image/png';
        } else if (imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49) {
          contentType = 'image/gif';
        } else if (imageBuffer[0] === 0x52 && imageBuffer[1] === 0x49) {
          contentType = 'image/webp';
        }
      } else {
        context.res = {
          status: 400,
          body: JSON.stringify({ error: 'imageUrl is required in JSON body' }),
          headers
        };
        return;
      }
    } else {
      // Get the image data from the request body (binary upload)
      imageBuffer = req.body;

      if (!imageBuffer || imageBuffer.length === 0) {
        context.res = {
          status: 400,
          body: JSON.stringify({ error: 'Image data is required' }),
          headers
        };
        return;
      }

      // Detect content type from the buffer
      if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50) {
        contentType = 'image/png';
      } else if (imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49) {
        contentType = 'image/gif';
      } else if (imageBuffer[0] === 0x52 && imageBuffer[1] === 0x49) {
        contentType = 'image/webp';
      }
    }

    // Get container client
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    // Ensure container exists (this is idempotent)
    await containerClient.createIfNotExists({
      access: 'blob' // Public read access for blobs
    });

    // Create a safe filename from userId and dreamId
    const safeUserId = userId.replace(/[^a-zA-Z0-9-_@.]/g, '_');
    const safeDreamId = dreamId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const timestamp = Date.now();
    
    // Determine file extension from content type
    const extension = contentType === 'image/png' ? 'png' : 
                     contentType === 'image/gif' ? 'gif' : 
                     contentType === 'image/webp' ? 'webp' : 'jpg';
    const blobName = `${safeUserId}/${safeDreamId}_${timestamp}.${extension}`;

    // Get blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload the image
    const uploadOptions = {
      blobHTTPHeaders: {
        blobContentType: contentType
      }
    };

    await blockBlobClient.upload(imageBuffer, imageBuffer.length, uploadOptions);

    // Get the public URL
    const blobUrl = blockBlobClient.url;

    context.log('Successfully uploaded dream picture:', blobUrl);

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        url: blobUrl,
        message: 'Dream picture uploaded successfully'
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error uploading dream picture:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to upload dream picture',
        details: error.message
      }),
      headers
    };
  }
};












