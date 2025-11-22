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

  if (!connectData) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'connectData is required' }),
      headers
    };
    return;
  }

  // Use the connect's userId (sender's ID) as partition key, not the request userId
  // This ensures connects stay in the sender's partition even when recipient updates them
  const partitionUserId = connectData.userId || userId;
  
  if (!partitionUserId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'userId is required in connectData' }),
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
      : `connect_${partitionUserId}_${Date.now()}`;
    
    // Save all fields from connectData to preserve complete connect information
    // Use partitionUserId (sender's ID) to keep connect in correct partition
    const document = {
      id: connectId,
      userId: partitionUserId, // Always use sender's userId as partition key
      type: connectData.type || 'connect',
      // Core fields
      withWhom: connectData.withWhom,
      withWhomId: connectData.withWhomId,
      when: connectData.when,
      notes: connectData.notes || '',
      status: connectData.status || 'pending',
      // Scheduling fields
      agenda: connectData.agenda,
      proposedWeeks: connectData.proposedWeeks || [],
      schedulingMethod: connectData.schedulingMethod,
      // Optional fields
      dreamId: connectData.dreamId || undefined,
      // Display metadata (preserved for UI consistency)
      name: connectData.name,
      category: connectData.category,
      avatar: connectData.avatar,
      office: connectData.office,
      // Timestamps
      createdAt: connectData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Upsert the connect using sender's userId as partition key
    context.log('💾 WRITE:', {
      container: 'connects',
      partitionKey: partitionUserId,
      id: document.id,
      operation: 'upsert',
      note: 'Using sender userId as partition key for both sender and recipient updates'
    });
    
    // Upsert using the partition key - Cosmos DB SDK will use document.userId automatically
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

