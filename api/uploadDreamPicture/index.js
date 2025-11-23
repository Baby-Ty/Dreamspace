const { BlobServiceClient } = require('@azure/storage-blob');

// Initialize Blob Service Client
let blobServiceClient;
if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
  blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );
}

const CONTAINER_NAME = 'dreams-pictures';

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
    // Get the image data from the request body
    // Body should be the raw image data (blob)
    const imageBuffer = req.body;

    if (!imageBuffer || imageBuffer.length === 0) {
      context.res = {
        status: 400,
        body: JSON.stringify({ error: 'Image data is required' }),
        headers
      };
      return;
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
    const blobName = `${safeUserId}/${safeDreamId}_${timestamp}.jpg`;

    // Get blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Detect content type from the buffer (basic detection)
    let contentType = 'image/jpeg';
    if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50) {
      contentType = 'image/png';
    } else if (imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49) {
      contentType = 'image/gif';
    } else if (imageBuffer[0] === 0x52 && imageBuffer[1] === 0x49) {
      contentType = 'image/webp';
    }

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












