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
    // Query all active weekly goal templates for this user
    const { resources: templates } = await dreamsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.userId = @userId AND c.type = @type AND (c.active = true OR NOT IS_DEFINED(c.active)) ORDER BY c.createdAt DESC',
        parameters: [
          { name: '@userId', value: userId },
          { name: '@type', value: 'weekly_goal_template' }
        ]
      })
      .fetchAll();
    
    context.log(`Loaded ${templates.length} templates for user ${userId}`);
    
    // Clean up Cosmos metadata
    const cleanTemplates = templates.map(template => {
      const { _rid, _self, _etag, _attachments, _ts, ...cleanTemplate } = template;
      return cleanTemplate;
    });
    
    context.res = {
      status: 200,
      body: JSON.stringify(cleanTemplates),
      headers
    };
  } catch (error) {
    context.log.error('Error loading week templates:', error);
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







