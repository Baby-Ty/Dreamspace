const { BlobServiceClient } = require('@azure/storage-blob');
const https = require('https');
// SECURITY: HTTP intentionally not imported - only HTTPS allowed for URL fetching
const { createApiHandler } = require('../utils/apiWrapper');
const { compressImage } = require('../utils/imageCompression');

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
    
    // SECURITY: Only HTTPS is allowed (validated by isUrlAllowed)
    https.get(url, (res) => {
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

module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'bindingData.userId',
  skipDbCheck: true
}, async (context, req) => {
  const userId = context.bindingData.userId;
  const dreamId = context.bindingData.dreamId;

  context.log('Uploading dream picture:', { userId, dreamId });

  if (!userId) {
    throw { status: 400, message: 'User ID is required' };
  }

  if (!dreamId) {
    throw { status: 400, message: 'Dream ID is required' };
  }

  // Check if Blob Storage is configured
  if (!blobServiceClient) {
    throw { 
      status: 500, 
      message: 'Blob storage not configured', 
      details: 'AZURE_STORAGE_CONNECTION_STRING environment variable is required' 
    };
  }

  let imageBuffer;
  let contentType = 'image/jpeg';

  // Check if request body is JSON with imageUrl (for DALL-E images)
  if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    if (body.imageUrl) {
      // Handle base64 data URLs (from gpt-image models)
      if (body.imageUrl.startsWith('data:')) {
        context.log('Processing base64 data URL');
        // Parse data URL: data:image/png;base64,<base64data>
        const matches = body.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          throw { status: 400, message: 'Invalid data URL format' };
        }
        contentType = matches[1]; // e.g., 'image/png'
        imageBuffer = Buffer.from(matches[2], 'base64');
        context.log('Decoded base64 image:', { contentType, size: imageBuffer.length });
      } else {
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
      }
    } else {
      throw { status: 400, message: 'imageUrl is required in JSON body' };
    }
  } else {
    // Get the image data from the request body (binary upload)
    imageBuffer = req.body;

    if (!imageBuffer || imageBuffer.length === 0) {
      throw { status: 400, message: 'Image data is required' };
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

  // Compress image to reduce size (target: under 300KB)
  const compressionResult = await compressImage(imageBuffer, { maxSizeKB: 300 });
  imageBuffer = compressionResult.buffer;
  contentType = compressionResult.contentType;

  context.log('Image compression:', {
    original: `${(compressionResult.originalSize / 1024).toFixed(0)}KB`,
    compressed: `${(compressionResult.compressedSize / 1024).toFixed(0)}KB`,
    quality: compressionResult.quality,
    reduction: `${((1 - compressionResult.compressedSize / compressionResult.originalSize) * 100).toFixed(0)}%`
  });

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
  
  // Derive extension from content type
  const extensionMap = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };
  const extension = extensionMap[contentType] || 'jpg';
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

  return {
    success: true,
    url: blobUrl,
    message: 'Dream picture uploaded successfully'
  };
});
