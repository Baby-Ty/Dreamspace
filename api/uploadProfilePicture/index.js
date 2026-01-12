const { BlobServiceClient } = require('@azure/storage-blob');
const { createApiHandler } = require('../utils/apiWrapper');

// Initialize Blob Service Client
let blobServiceClient;
if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
  blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );
}

const CONTAINER_NAME = 'profile-pictures';

module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'bindingData.userId',
  skipDbCheck: true
}, async (context, req) => {
  const userId = context.bindingData.userId;

  context.log('Uploading profile picture for user:', userId);

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

  // Get the image data from the request body
  // Body should be the raw image data (blob)
  const imageBuffer = req.body;

  if (!imageBuffer || imageBuffer.length === 0) {
    throw { status: 400, message: 'Image data is required' };
  }

  // Get container client
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

  // Ensure container exists (this is idempotent)
  await containerClient.createIfNotExists({
    access: 'blob' // Public read access for blobs
  });

  // Create a safe filename from userId
  const safeUserId = userId.replace(/[^a-zA-Z0-9-_@.]/g, '_');
  const blobName = `${safeUserId}.jpg`;

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

  context.log('Successfully uploaded profile picture:', blobUrl);

  return {
    success: true,
    url: blobUrl,
    message: 'Profile picture uploaded successfully'
  };
});
