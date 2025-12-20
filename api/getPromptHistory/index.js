/**
 * Azure Function: Get Prompt History
 * Returns the version history of AI prompt configurations
 */

const { getCosmosProvider } = require('../utils/cosmosProvider');

module.exports = async function (context, req) {
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

  // Get optional limit parameter
  const limit = parseInt(req.query.limit) || 50;

  context.log('getPromptHistory called:', { limit });

  try {
    const cosmosProvider = getCosmosProvider();
    if (!cosmosProvider) {
      context.res = {
        status: 200,
        body: JSON.stringify({ 
          success: true,
          history: [],
          message: 'Cosmos DB not configured, no history available'
        }),
        headers
      };
      return;
    }

    // Get history entries
    const history = await cosmosProvider.getPromptHistory(limit);
    
    // Clean metadata from each entry
    const cleanHistory = history.map(entry => cosmosProvider.cleanMetadata(entry));

    context.log(`✅ Retrieved ${cleanHistory.length} prompt history entries`);

    context.res = {
      status: 200,
      body: JSON.stringify({ 
        success: true,
        history: cleanHistory
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error getting prompt history:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        success: false,
        error: 'Internal server error', 
        details: error.message 
      }),
      headers
    };
  }
};

