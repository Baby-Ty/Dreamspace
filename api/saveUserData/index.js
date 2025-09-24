const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos client only if environment variables are present
let client, database, container;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  container = database.container('users');
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

  const userId = context.bindingData.userId;
  const userData = req.body;

  context.log('Saving user data for userId:', userId, 'Data:', JSON.stringify(userData));

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'User ID is required' }),
      headers
    };
    return;
  }

  if (!userData) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'User data is required' }),
      headers
    };
    return;
  }

  // Check if Cosmos DB is configured
  if (!container) {
    context.res = {
      status: 500,
      body: JSON.stringify({ error: 'Database not configured', details: 'COSMOS_ENDPOINT and COSMOS_KEY environment variables are required' }),
      headers
    };
    return;
  }

  try {
    const document = {
      id: userId,
      userId: userId,
      ...userData,
      lastUpdated: new Date().toISOString()
    };

    const { resource } = await container.items.upsert(document);
    
    context.log('Successfully saved user data:', resource.id);
    
    context.res = {
      status: 200,
      body: JSON.stringify({ success: true, id: resource.id }),
      headers
    };
  } catch (error) {
    context.log.error('Error saving user data:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
      headers
    };
  }
};
