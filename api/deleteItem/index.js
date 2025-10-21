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
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  const itemId = context.bindingData.itemId;
  const userId = req.query.userId; // Partition key

  context.log('Deleting item:', itemId, 'for user:', userId);

  if (!itemId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'itemId is required' }),
      headers
    };
    return;
  }

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'userId is required as query parameter' }),
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
    // Delete the item using itemId and partition key (userId)
    await itemsContainer.item(itemId, userId).delete();
    
    context.log('Successfully deleted item:', itemId);
    
    context.res = {
      status: 200,
      body: JSON.stringify({ 
        success: true, 
        deletedId: itemId
      }),
      headers
    };
  } catch (error) {
    if (error.code === 404) {
      context.res = {
        status: 404,
        body: JSON.stringify({ error: 'Item not found' }),
        headers
      };
    } else {
      context.log.error('Error deleting item:', error);
      context.res = {
        status: 500,
        body: JSON.stringify({ 
          error: 'Internal server error', 
          details: error.message 
        }),
        headers
      };
    }
  }
};


