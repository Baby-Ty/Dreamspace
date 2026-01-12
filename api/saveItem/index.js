const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'body.userId',
  containerName: 'dreams'
}, async (context, req, { container }) => {
  const { userId, type, itemData } = req.body || {};

  context.log('Saving item:', { userId, type, itemId: itemData?.id });

  if (!userId) {
    throw { status: 400, message: 'userId is required' };
  }

  if (!type) {
    throw { status: 400, message: 'type is required' };
  }

  if (!itemData) {
    throw { status: 400, message: 'itemData is required' };
  }

  // Validate type - this endpoint is deprecated for 6-container architecture
  // All dreams and templates should be saved via saveDreams endpoint
  if (type === 'dream' || type === 'weekly_goal_template') {
    throw { 
      status: 400, 
      message: 'Invalid endpoint for saving dreams/templates',
      details: `Dreams and weekly goal templates must be saved together using the saveDreams endpoint (one document per user). Use POST /saveDreams with { userId, dreams: [...], weeklyGoalTemplates: [...] }. This ensures proper 6-container architecture where dreams container has one document per user.`
    };
  }
  
  // For other types, reject with proper routing information
  const validEndpoints = {
    'connect': 'saveConnect',
    'weekly_goal': 'saveWeekGoals (for week instances)',
    'scoring_entry': 'saveScoring'
  };
  
  throw { 
    status: 400, 
    message: 'Invalid type for saveItem endpoint',
    details: `Type '${type}' is not supported by this endpoint. Use dedicated endpoints: ${JSON.stringify(validEndpoints, null, 2)}`
  };

  // Note: Code below is unreachable - this endpoint is fully deprecated
  // Keeping for reference in case endpoint needs to be reactivated
  
  // Create the item document
  // Ensure id is always a string (Cosmos DB requirement)
  const itemId = itemData.id 
    ? String(itemData.id) 
    : `${type}_${userId}_${Date.now()}`;
  
  const document = {
    id: itemId,
    userId: userId,
    type: type,
    ...itemData,
    createdAt: itemData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Upsert the item to dreams container
  context.log('💾 WRITE:', {
    container: 'dreams',
    partitionKey: userId,
    id: document.id,
    operation: 'upsert',
    type: type
  });
  
  const { resource } = await container.items.upsert(document);
  
  context.log('Successfully saved item:', resource.id);
  
  return { 
    success: true, 
    id: resource.id,
    type: resource.type
  };
});


