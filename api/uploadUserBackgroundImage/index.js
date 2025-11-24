const { BlobServiceClient } = require('@azure/storage-blob');
const https = require('https');
const http = require('http');

// Initialize Blob Service Client
let blobServiceClient;
if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
  blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );
}

const CONTAINER_NAME = 'user-backgrounds';

/**
 * Fetch image from URL (server-side, no CORS issues)
 */
function fetchImageFromUrl(url) {
  return new Promise((resolve, reject) => {
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
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  const userId = context.bindingData.userId;

  context.log('Uploading user background image:', { userId });

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'User ID is required' }),
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

    // Create a safe filename from userId
    const safeUserId = userId.replace(/[^a-zA-Z0-9-_@.]/g, '_');
    const timestamp = Date.now();
    
    // Determine file extension from content type
    const extension = contentType === 'image/png' ? 'png' : 
                     contentType === 'image/gif' ? 'gif' : 
                     contentType === 'image/webp' ? 'webp' : 'jpg';
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

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        url: blobUrl,
        message: 'User background image uploaded successfully'
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error uploading user background image:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to upload user background image',
        details: error.message
      }),
      headers
    };
  }
};

