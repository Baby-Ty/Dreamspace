/**
 * Azure Function: Get Prompt History
 * Returns the version history of AI prompt configurations
 */

const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'admin',
  skipDbCheck: true
}, async (context, req, { provider }) => {
  // Get optional limit parameter
  const limit = parseInt(req.query.limit) || 50;

  context.log('getPromptHistory called:', { limit });

  if (!provider) {
    return { 
      success: true,
      history: [],
      message: 'Cosmos DB not configured, no history available'
    };
  }

  // Get history entries
  const history = await provider.getPromptHistory(limit);
  
  // Clean metadata from each entry
  const cleanHistory = history.map(entry => provider.cleanMetadata(entry));

  context.log(`✅ Retrieved ${cleanHistory.length} prompt history entries`);

  return { success: true, history: cleanHistory };
});
