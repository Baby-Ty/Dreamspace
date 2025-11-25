const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos client only if environment variables are present
let client, database, dreamsContainer;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  dreamsContainer = database.container('dreams');
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

  const { userId, yearVision: rawVision } = req.body || {};

  // Ensure yearVision is always a string - sanitize input
  const yearVision = typeof rawVision === 'string' ? rawVision : '';

  context.log('saveYearVision called:', { userId, visionLength: yearVision?.length });

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'userId is required' }),
      headers
    };
    return;
  }

  // Check if Cosmos DB is configured
  if (!dreamsContainer) {
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
    const documentId = userId;
    
    context.log(`Saving year vision for user: ${userId}`);
    
    // Try to read existing document
    let existingDoc;
    try {
      const { resource } = await dreamsContainer.item(documentId, userId).read();
      existingDoc = resource;
      context.log(`Found existing dreams document`);
    } catch (error) {
      if (error.code !== 404) {
        context.log.error(`Error reading dreams document: ${error.code} - ${error.message}`);
        throw error;
      }
      context.log(`Creating new dreams document for ${userId}`);
    }

    // Prepare the document - preserve existing data, add/update yearVision
    const document = {
      ...(existingDoc || {}),
      id: documentId,
      userId: userId,
      yearVision: yearVision,
      // Preserve existing fields or set defaults
      dreams: existingDoc?.dreams || [],
      weeklyGoalTemplates: existingDoc?.weeklyGoalTemplates || [],
      createdAt: existingDoc?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    context.log('💭 WRITE:', {
      container: 'dreams',
      partitionKey: userId,
      id: document.id,
      operation: 'upsert (yearVision)',
      visionLength: yearVision.length
    });

    // Upsert the document
    const { resource } = await dreamsContainer.items.upsert(document);
    
    context.log(`✅ Successfully saved year vision for ${userId}`);
    
    context.res = {
      status: 200,
      body: JSON.stringify({ 
        success: true, 
        id: resource.id
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error saving year vision:', error);
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

