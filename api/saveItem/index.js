const { CosmosClient } = require('@azure/cosmos');
const { requireUserAccess, isAuthRequired, getCorsHeaders } = require('../utils/authMiddleware');

// Initialize Cosmos client only if environment variables are present
let client, database, dreamsContainer;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  dreamsContainer = database.container('dreams');
}

module.exports = async function (context, req) {
  // Set CORS headers
  const headers = getCorsHeaders();

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  const { userId, type, itemData } = req.body || {};

  context.log('Saving item:', { userId, type, itemId: itemData?.id });

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'userId is required' }),
      headers
    };
    return;
  }

  // AUTH CHECK: Users can only save their own items
  if (isAuthRequired()) {
    const user = await requireUserAccess(context, req, userId);
    if (!user) return; // 401 or 403 already sent
    context.log(`User ${user.email} saving item for ${userId}`);
  }

  if (!type) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'type is required' }),
      headers
    };
    return;
  }

  if (!itemData) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'itemData is required' }),
      headers
    };
    return;
  }

  // Validate type - this endpoint is deprecated for 6-container architecture
  // All dreams and templates should be saved via saveDreams endpoint
  if (type === 'dream' || type === 'weekly_goal_template') {
    context.res = {
      status: 400,
      body: JSON.stringify({ 
        error: 'Invalid endpoint for saving dreams/templates',
        details: `Dreams and weekly goal templates must be saved together using the saveDreams endpoint (one document per user). Use POST /saveDreams with { userId, dreams: [...], weeklyGoalTemplates: [...] }. This ensures proper 6-container architecture where dreams container has one document per user.`
      }),
      headers
    };
    return;
  }
  
  // For other types, reject with proper routing information
  const validEndpoints = {
    'connect': 'saveConnect',
    'weekly_goal': 'saveWeekGoals (for week instances)',
    'scoring_entry': 'saveScoring'
  };
  
  context.res = {
    status: 400,
    body: JSON.stringify({ 
      error: 'Invalid type for saveItem endpoint',
      details: `Type '${type}' is not supported by this endpoint. Use dedicated endpoints: ${JSON.stringify(validEndpoints, null, 2)}`
    }),
    headers
  };
  return;

  // Check if Cosmos DB is configured
  if (!dreamsContainer) {
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        error: 'Database not configured', 
        details: 'COSMOS_ENDPOINT and COSMOS_KEY environment variables are required' 
      }),
      headers
    };
    return;
  }

  try {
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
    
    const { resource } = await dreamsContainer.items.upsert(document);
    
    context.log('Successfully saved item:', resource.id);
    
    context.res = {
      status: 200,
      body: JSON.stringify({ 
        success: true, 
        id: resource.id,
        type: resource.type
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error saving item:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      headers
    };
  }
};


