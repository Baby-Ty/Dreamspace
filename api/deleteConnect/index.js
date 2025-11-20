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
  const connectId = context.bindingData.connectId;
  const userId = req.query.userId;

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

  if (!connectId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'Connect ID is required' }),
      headers
    };
    return;
  }

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'User ID is required (partition key)' }),
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
    // Delete the connect
    await connectsContainer.item(connectId, userId).delete();
    
    context.log(`Successfully deleted connect: ${connectId}`);
    
    context.res = {
      status: 200,
      body: JSON.stringify({ 
        success: true,
        id: connectId
      }),
      headers
    };
  } catch (error) {
    if (error.code === 404) {
      context.log.warn(`Connect not found: ${connectId}`);
      context.res = {
        status: 404,
        body: JSON.stringify({ error: 'Connect not found' }),
        headers
      };
    } else {
      context.log.error('Error deleting connect:', error);
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








