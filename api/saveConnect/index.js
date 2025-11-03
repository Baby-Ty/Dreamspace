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

  const { userId, connectData } = req.body || {};

  context.log('Saving connect:', { userId, connectId: connectData?.id });

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'userId is required' }),
      headers
    };
    return;
  }

  if (!connectData) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'connectData is required' }),
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
    // Create the connect document
    const connectId = connectData.id 
      ? String(connectData.id) 
      : `connect_${userId}_${Date.now()}`;
    
    const document = {
      id: connectId,
      userId: userId,
      type: 'connect',
      dreamId: connectData.dreamId || undefined,
      withWhom: connectData.withWhom,
      when: connectData.when,
      notes: connectData.notes || '',
      createdAt: connectData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Upsert the connect
    context.log('💾 WRITE:', {
      container: 'connects',
      partitionKey: userId,
      id: document.id,
      operation: 'upsert'
    });
    
    const { resource } = await connectsContainer.items.upsert(document);
    
    context.log('Successfully saved connect:', resource.id);
    
    context.res = {
      status: 200,
      body: JSON.stringify({ 
        success: true, 
        id: resource.id,
        connect: resource
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error saving connect:', error);
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

