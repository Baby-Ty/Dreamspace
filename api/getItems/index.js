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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  const userId = context.bindingData.userId;
  const type = req.query.type; // Optional filter by type

  context.log('Getting items for user:', userId, 'type:', type || 'all');

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'userId is required' }),
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
    // Build query based on whether type filter is provided
    let query, parameters;
    
    if (type) {
      query = 'SELECT * FROM c WHERE c.userId = @userId AND c.type = @type';
      parameters = [
        { name: '@userId', value: userId },
        { name: '@type', value: type }
      ];
    } else {
      query = 'SELECT * FROM c WHERE c.userId = @userId';
      parameters = [
        { name: '@userId', value: userId }
      ];
    }

    const { resources } = await itemsContainer.items
      .query({
        query: query,
        parameters: parameters
      })
      .fetchAll();
    
    context.log(`Found ${resources.length} items for user ${userId}`);
    
    context.res = {
      status: 200,
      body: JSON.stringify(resources),
      headers
    };
  } catch (error) {
    context.log.error('Error getting items:', error);
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


