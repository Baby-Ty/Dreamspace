const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos client only if environment variables are present
let client, database;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
}

module.exports = async function (context, req) {
  const userId = req.query.userId;
  const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
  
  context.log(`getWeekGoals called with userId: ${userId}, year: ${year}`);

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
  if (!database) {
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
    // Get the appropriate year container
    const containerName = `weeks${year}`;
    const weeksContainer = database.container(containerName);
    
    const documentId = `${userId}_${year}`;
    
    // Try to read the document
    try {
      const { resource } = await weeksContainer.item(documentId, userId).read();
      
      // Check if resource exists
      if (!resource) {
        context.log(`Week document exists but resource is null for user ${userId} year ${year}`);
        // Return empty structure
        context.res = {
          status: 200,
          body: JSON.stringify({
            id: documentId,
            userId: userId,
            year: year,
            weeks: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }),
          headers
        };
        return;
      }
      
      context.log(`Loaded week document for user ${userId} year ${year}`);
      
      // Clean up Cosmos metadata
      const { _rid, _self, _etag, _attachments, _ts, ...cleanDoc } = resource;
      
      context.res = {
        status: 200,
        body: JSON.stringify(cleanDoc),
        headers
      };
    } catch (error) {
      if (error.code === 404) {
        // Document doesn't exist yet - create it
        context.log(`No week document found for user ${userId} year ${year}, creating...`);
        
        const newWeekDoc = {
          id: documentId,
          userId: userId,
          year: year,
          weeks: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        try {
          const { resource: newResource } = await weeksContainer.items.create(newWeekDoc);
          context.log(`✅ Created week document for ${userId}`);
          
          // Clean up Cosmos metadata from the newly created document
          const { _rid, _self, _etag, _attachments, _ts, ...cleanDoc } = newResource;
          
          context.res = {
            status: 200,
            body: JSON.stringify(cleanDoc),
            headers
          };
        } catch (createError) {
          context.log.error(`Failed to create week document:`, createError);
          throw createError;
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    context.log.error('Error loading week goals:', error);
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

