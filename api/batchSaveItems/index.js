const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'body.userId'
}, async (context, req, { provider }) => {
  const { userId, items } = req.body || {};

  context.log('Batch saving items for user:', userId, 'count:', items?.length || 0);

  if (!userId) {
    throw { status: 400, message: 'userId is required' };
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw { status: 400, message: 'items array is required and must not be empty' };
  }

  const dreamsContainer = provider.getContainer('dreams');
  const connectsContainer = provider.getContainer('connects');

  const savedItems = [];
  const errors = [];

  // Process items in parallel (but be mindful of RU limits)
  const promises = items.map(async (item) => {
    try {
      const { type, data } = item;
      
      if (!type || !data) {
        throw new Error('Each item must have type and data properties');
      }

      // Route to correct container based on type
      let targetContainer;
      let containerName;
      
      if (type === 'dream' || type === 'weekly_goal_template') {
        targetContainer = dreamsContainer;
        containerName = 'dreams';
      } else if (type === 'connect') {
        targetContainer = connectsContainer;
        containerName = 'connects';
      } else {
        // Other types should use their dedicated endpoints
        throw new Error(`Type "${type}" should use dedicated endpoint (weekly goals → saveWeekGoals, scoring → saveScoring)`);
      }

      // Ensure id is always a string (Cosmos DB requirement)
      const itemId = data.id 
        ? String(data.id) 
        : `${type}_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const document = {
        id: itemId,
        userId: userId,
        type: type,
        ...data,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      context.log('💾 WRITE:', {
        container: containerName,
        partitionKey: userId,
        id: document.id,
        operation: 'upsert',
        type: type
      });

      const { resource } = await targetContainer.items.upsert(document);
      savedItems.push({ id: resource.id, type: resource.type });
    } catch (error) {
      context.log.error('Error saving item:', error);
      errors.push({ 
        type: item.type, 
        id: item.data?.id, 
        error: error.message 
      });
    }
  });

  await Promise.all(promises);
  
  context.log(`Successfully saved ${savedItems.length} items, ${errors.length} errors`);
  
  return { 
    success: true,
    savedCount: savedItems.length,
    errorCount: errors.length,
    savedItems: savedItems,
    errors: errors.length > 0 ? errors : undefined
  };
});
