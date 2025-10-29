const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos client only if environment variables are present
let client, database, itemsContainer;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  itemsContainer = database.container('items');
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

  // Check if Cosmos DB is configured
  if (!itemsContainer) {
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

    // Validation for weekly goals - must have weekId
    if (type === 'weekly_goal' && !document.weekId) {
      context.res = {
        status: 400,
        body: JSON.stringify({ 
          error: 'weekId is required for weekly_goal type',
          details: 'Each weekly goal must be associated with a specific week (e.g., "2025-W43")'
        }),
        headers
      };
      return;
    }

    // Upsert the item
    const { resource } = await itemsContainer.items.upsert(document);
    
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


