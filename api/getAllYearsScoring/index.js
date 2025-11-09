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
  
  context.log(`getAllYearsScoring called with userId: ${userId}`);

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
    // Query all scoring documents for this user across all years
    const query = {
      query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.year DESC',
      parameters: [{ name: '@userId', value: userId }]
    };
    
    context.log(`🔍 Querying scoring container for user: ${userId}`);
    
    const { resources } = await scoringContainer.items.query(query).fetchAll();
    
    context.log(`✅ Found ${resources.length} scoring document(s) for user ${userId}`);
    
    // Calculate all-time total
    const allTimeTotal = resources.reduce((sum, doc) => sum + (doc.totalScore || 0), 0);
    
    context.log(`📊 All-time total: ${allTimeTotal} points across ${resources.length} year(s)`);
    
    // Return array of scoring documents sorted by year descending
    context.res = {
      status: 200,
      body: JSON.stringify(resources),
      headers
    };
  } catch (error) {
    context.log.error('Error fetching all years scoring:', error);
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

