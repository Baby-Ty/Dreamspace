const { CosmosClient } = require('@azure/cosmos');
const { getCosmosProvider } = require('../utils/cosmosProvider');

// Initialize Cosmos client only if environment variables are present
let client, database;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
}

// Get cosmosProvider instance for helper methods
const cosmosProvider = getCosmosProvider();

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
    // Ensure the year container exists before accessing it
    if (cosmosProvider) {
      await cosmosProvider.ensureWeeksContainerExists(year, context);
    }
    
    // Get the appropriate year container
    const containerName = `weeks${year}`;
    context.log(`📦 Accessing container: ${containerName}`);
    
    // Check if container exists, if not this will throw
    const weeksContainer = database.container(containerName);
    
    const documentId = `${userId}_${year}`;
    context.log(`📄 Document ID: ${documentId}, Partition Key: ${userId}`);
    
    // Try to read the document
    try {
      context.log(`🔍 Attempting to read document from ${containerName}...`);
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
          context.log(`📝 Upserting week document:`, {
            id: newWeekDoc.id,
            userId: newWeekDoc.userId,
            year: newWeekDoc.year,
            container: containerName
          });
          
          // Use upsert instead of create - more reliable
          const { resource: newResource } = await weeksContainer.items.upsert(newWeekDoc);
          
          if (!newResource) {
            context.log.error(`❌ Upsert returned success but resource is null`);
            throw new Error('Upsert succeeded but returned null resource');
          }
          
          context.log(`✅ Upserted week document for ${userId}:`, {
            id: newResource.id,
            userId: newResource.userId,
            year: newResource.year,
            weeksCount: Object.keys(newResource.weeks || {}).length
          });
          
          // Clean up Cosmos metadata from the newly created document
          const { _rid, _self, _etag, _attachments, _ts, ...cleanDoc } = newResource;
          
          context.res = {
            status: 200,
            body: JSON.stringify(cleanDoc),
            headers
          };
        } catch (upsertError) {
          context.log.error(`❌ Failed to upsert week document:`, {
            error: upsertError.message,
            code: upsertError.code,
            statusCode: upsertError.statusCode,
            userId: userId,
            documentId: documentId,
            container: containerName
          });
          throw upsertError;
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

