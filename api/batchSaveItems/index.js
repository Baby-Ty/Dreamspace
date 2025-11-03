const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos client only if environment variables are present
let client, database, dreamsContainer, connectsContainer;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  dreamsContainer = database.container('dreams');
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

  const { userId, items } = req.body || {};

  context.log('Batch saving items for user:', userId, 'count:', items?.length || 0);

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'userId is required' }),
      headers
    };
    return;
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'items array is required and must not be empty' }),
      headers
    };
    return;
  }

  // Check if Cosmos DB is configured
  if (!dreamsContainer || !connectsContainer) {
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
    const savedItems = [];
    const errors = [];

    // Process items in parallel (but be mindful of RU limits)
    const promises = items.map(async (item) => {
      try {
        const { type, data } = item;
        
        if (!type || !data) {
          throw new Error('Each item must have type and data properties');
        }

        // Route to correct container based on type
        let targetContainer;
        let containerName;
        
        if (type === 'dream' || type === 'weekly_goal_template') {
          targetContainer = dreamsContainer;
          containerName = 'dreams';
        } else if (type === 'connect') {
          targetContainer = connectsContainer;
          containerName = 'connects';
        } else {
          // Other types should use their dedicated endpoints
          throw new Error(`Type "${type}" should use dedicated endpoint (weekly goals → saveWeekGoals, scoring → saveScoring)`);
        }

        // Ensure id is always a string (Cosmos DB requirement)
        const itemId = data.id 
          ? String(data.id) 
          : `${type}_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const document = {
          id: itemId,
          userId: userId,
          type: type,
          ...data,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        context.log('💾 WRITE:', {
          container: containerName,
          partitionKey: userId,
          id: document.id,
          operation: 'upsert',
          type: type
        });

        const { resource } = await targetContainer.items.upsert(document);
        savedItems.push({ id: resource.id, type: resource.type });
      } catch (error) {
        context.log.error('Error saving item:', error);
        errors.push({ 
          type: item.type, 
          id: item.data?.id, 
          error: error.message 
        });
      }
    });

    await Promise.all(promises);
    
    context.log(`Successfully saved ${savedItems.length} items, ${errors.length} errors`);
    
    context.res = {
      status: errors.length === items.length ? 500 : 200,
      body: JSON.stringify({ 
        success: true,
        savedCount: savedItems.length,
        errorCount: errors.length,
        savedItems: savedItems,
        errors: errors.length > 0 ? errors : undefined
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error in batch save:', error);
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


