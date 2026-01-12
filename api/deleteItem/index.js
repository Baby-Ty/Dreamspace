const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'query.userId',
  containerName: 'items'
}, async (context, req, { container }) => {
  const itemId = context.bindingData.itemId;
  const userId = req.query.userId; // Partition key

  context.log('Deleting item:', itemId, 'for user:', userId);

  if (!itemId) {
    throw { status: 400, message: 'itemId is required' };
  }

  if (!userId) {
    throw { status: 400, message: 'userId is required as query parameter' };
  }

  // Delete the item using itemId and partition key (userId)
  await container.item(itemId, userId).delete();
  
  context.log('Successfully deleted item:', itemId);
  
  return { 
    success: true, 
    deletedId: itemId
  };
});


