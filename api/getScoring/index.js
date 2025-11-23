const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos client only if environment variables are present
let client, database, scoringContainer;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  scoringContainer = database.container('scoring');
}

module.exports = async function (context, req) {
  const userId = context.bindingData.userId;
  const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

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
  if (!scoringContainer) {
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
    const documentId = `${userId}_${year}_scoring`;
    
    // Try to read the document
    try {
      const { resource } = await scoringContainer.item(documentId, userId).read();
      
      context.log(`Loaded scoring document for user ${userId} year ${year}`, 'Total score:', resource.totalScore);
      
      // Clean up Cosmos metadata
      const { _rid, _self, _etag, _attachments, _ts, ...cleanDoc } = resource;
      
      context.res = {
        status: 200,
        body: JSON.stringify(cleanDoc),
        headers
      };
    } catch (error) {
      if (error.code === 404) {
        // Document doesn't exist yet - return empty structure
        context.log(`No scoring document found for user ${userId} year ${year}`);
        context.res = {
          status: 200,
          body: JSON.stringify({
            id: documentId,
            userId: userId,
            year: year,
            totalScore: 0,
            entries: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }),
          headers
        };
      } else {
        throw error;
      }
    }
  } catch (error) {
    context.log.error('Error loading scoring:', error);
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










