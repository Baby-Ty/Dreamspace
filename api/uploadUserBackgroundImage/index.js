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

const CONTAINER_NAME = 'user-backgrounds';

// SSRF Protection: Allowlist of trusted image sources
// Storage domain is derived from connection string to avoid hardcoding
const getStorageDomain = () => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (connectionString) {
    const match = connectionString.match(/AccountName=([^;]+)/);
    if (match) {
      return `${match[1]}.blob.core.windows.net`;
    }
  }
  return null;
};

const ALLOWED_DOMAINS = [
  'oaidalleapiprodscus.blob.core.windows.net', // DALL-E generated images
  'images.unsplash.com',                        // Unsplash images
  getStorageDomain()                            // Our own blob storage (from env)
].filter(Boolean); // Remove null if storage not configured

/**
 * Check if URL is from an allowed domain (SSRF protection)
 */
function isUrlAllowed(url) {
  try {
    const urlObj = new URL(url);
    return ALLOWED_DOMAINS.some(domain => urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
}

/**
 * Fetch image from URL (server-side, no CORS issues)
 */
function fetchImageFromUrl(url) {
  // SSRF Protection: Only allow fetching from trusted domains
  if (!isUrlAllowed(url)) {
    return Promise.reject(new Error(`URL not allowed. Only images from trusted sources (DALL-E, Unsplash, Azure Blob) are permitted.`));
  }

  return new Promise((resolve, reject) => {
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

  context.log('Uploading user background image:', { userId });

  if (!userId) {
    throw { status: 400, message: 'User ID is required' };
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

  // Create a safe filename from userId
  const safeUserId = userId.replace(/[^a-zA-Z0-9-_@.]/g, '_');
  const timestamp = Date.now();
  
  // Derive extension from content type
  const extensionMap = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };
  const extension = extensionMap[contentType] || 'jpg';
  const blobName = `${safeUserId}_${timestamp}.${extension}`;

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

  context.log('Successfully uploaded user background image:', blobUrl);

  return {
    success: true,
    url: blobUrl,
    message: 'User background image uploaded successfully'
  };
});
