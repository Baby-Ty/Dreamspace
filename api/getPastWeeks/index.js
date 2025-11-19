/**
 * Azure Function: Get Past Weeks
 * Gets the past weeks history document for a user
 * 
 * Route: GET /api/getPastWeeks/{userId}
 * Returns: Past weeks document with historical summaries
 */

const { getCosmosProvider } = require('../utils/cosmosProvider');

module.exports = async function (context, req) {
  // CORS headers
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

  const userId = context.bindingData.userId;

  // Validate userId
  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ 
        success: false,
        error: 'userId is required' 
      }),
      headers
    };
    return;
  }

  try {
    context.log(`📊 Getting past weeks history for user: ${userId}`);
    
    const cosmosProvider = getCosmosProvider();
    if (!cosmosProvider) {
      throw new Error('Cosmos DB not configured');
    }

    // Get past weeks document
    const pastWeeksDoc = await cosmosProvider.getPastWeeksDocument(userId);

    if (!pastWeeksDoc) {
      // No history yet - this is OK, return empty structure
      context.log(`ℹ️ No past weeks history found for user ${userId}`);
      context.res = {
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            userId: userId,
            weekHistory: {},
            totalWeeksTracked: 0
          },
          message: 'No past weeks history found yet.'
        }),
        headers
      };
      return;
    }

    // Debug: Log the document structure
    context.log(`📊 Past weeks document retrieved:`, {
      userId: pastWeeksDoc.userId,
      hasWeekHistory: !!pastWeeksDoc.weekHistory,
      weekHistoryType: typeof pastWeeksDoc.weekHistory,
      weekHistoryKeys: pastWeeksDoc.weekHistory ? Object.keys(pastWeeksDoc.weekHistory) : [],
      weekHistoryCount: pastWeeksDoc.weekHistory ? Object.keys(pastWeeksDoc.weekHistory).length : 0,
      sampleWeek: pastWeeksDoc.weekHistory ? Object.values(pastWeeksDoc.weekHistory)[0] : null,
      totalWeeksTracked: pastWeeksDoc.totalWeeksTracked
    });

    // Return past weeks document
    const weeksCount = Object.keys(pastWeeksDoc.weekHistory || {}).length;
    context.log(`✅ Past weeks retrieved: ${weeksCount} weeks tracked`);
    
    // Ensure weekHistory is an object (not null/undefined)
    const responseData = {
      ...pastWeeksDoc,
      weekHistory: pastWeeksDoc.weekHistory || {}
    };
    
    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        data: responseData
      }),
      headers
    };

  } catch (error) {
    context.log.error('❌ Error getting past weeks:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({
        success: false,
        error: 'Failed to get past weeks',
        details: error.message
      }),
      headers
    };
  }
};

