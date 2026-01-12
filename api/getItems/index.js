const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'bindingData.userId',
  containerName: 'items'
}, async (context, req, { container }) => {
  const userId = context.bindingData.userId;
  const type = req.query.type; // Optional filter by type
  const weekId = req.query.weekId; // Optional filter by weekId (for weekly_goal type)

  context.log('Getting items for user:', userId, 'type:', type || 'all', 'weekId:', weekId || 'all');

  if (!userId) {
    throw { status: 400, message: 'userId is required' };
  }
  // Build query based on filters provided
  let query, parameters;
  
  if (type && weekId) {
    // Filter by both type and weekId
    query = 'SELECT * FROM c WHERE c.userId = @userId AND c.type = @type AND c.weekId = @weekId';
    parameters = [
      { name: '@userId', value: userId },
      { name: '@type', value: type },
      { name: '@weekId', value: weekId }
    ];
  } else if (type) {
    // Filter by type only
    query = 'SELECT * FROM c WHERE c.userId = @userId AND c.type = @type';
    parameters = [
      { name: '@userId', value: userId },
      { name: '@type', value: type }
    ];
  } else if (weekId) {
    // Filter by weekId only (typically for weekly_goal type)
    query = 'SELECT * FROM c WHERE c.userId = @userId AND c.weekId = @weekId';
    parameters = [
      { name: '@userId', value: userId },
      { name: '@weekId', value: weekId }
    ];
  } else {
    // No filters - return all items
    query = 'SELECT * FROM c WHERE c.userId = @userId';
    parameters = [
      { name: '@userId', value: userId }
    ];
  }

  const { resources } = await container.items
    .query({
      query: query,
      parameters: parameters
    })
    .fetchAll();
  
  context.log(`Found ${resources.length} items for user ${userId}`);
  
  return resources;
});


