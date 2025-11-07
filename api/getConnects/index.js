const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos client only if environment variables are present
let client, database, connectsContainer;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  connectsContainer = database.container('connects');
}

module.exports = async function (context, req) {
  const userId = context.bindingData.userId;

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

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'User ID is required' }),
      headers
    };
    return;
  }

  // Check if Cosmos DB is configured
  if (!connectsContainer) {
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
    // Query all connects for this user
    const { resources: connects } = await connectsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.when DESC',
        parameters: [{ name: '@userId', value: userId }]
      })
      .fetchAll();
    
    context.log(`Loaded ${connects.length} connects for user ${userId}`);
    
    // Clean up Cosmos metadata
    const cleanConnects = connects.map(connect => {
      const { _rid, _self, _etag, _attachments, _ts, ...cleanConnect } = connect;
      return cleanConnect;
    });
    
    context.res = {
      status: 200,
      body: JSON.stringify(cleanConnects),
      headers
    };
  } catch (error) {
    context.log.error('Error loading connects:', error);
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





