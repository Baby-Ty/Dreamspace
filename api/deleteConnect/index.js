const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'query.userId',
  containerName: 'connects'
}, async (context, req, { container }) => {
  const connectId = context.bindingData.connectId;
  const userId = req.query.userId;

  if (!connectId) {
    throw { status: 400, message: 'Connect ID is required' };
  }

  if (!userId) {
    throw { status: 400, message: 'User ID is required (partition key)' };
  }

  // Delete the connect
  await container.item(connectId, userId).delete();
  
  context.log(`Successfully deleted connect: ${connectId}`);
  
  return { 
    success: true,
    id: connectId
  };
});










