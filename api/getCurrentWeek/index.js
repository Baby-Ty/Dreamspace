/**
 * Azure Function: Get Current Week
 * Gets the current week document for a user containing active weekly goals
 * 
 * Route: GET /api/getCurrentWeek/{userId}
 * Returns: Current week document with goals and stats
 */

const { getCosmosProvider } = require('../utils/cosmosProvider');
const { requireUserAccess, isAuthRequired, getCorsHeaders } = require('../utils/authMiddleware');

module.exports = async function (context, req) {
  // CORS headers
  const headers = getCorsHeaders();

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

  // AUTH CHECK: User can only access their own week data
  if (isAuthRequired()) {
    const user = await requireUserAccess(context, req, userId);
    if (!user) return; // 401/403 already sent
  }

  try {
    context.log(`📅 Getting current week for user: ${userId}`);
    
    const cosmosProvider = getCosmosProvider();
    if (!cosmosProvider) {
      throw new Error('Cosmos DB not configured');
    }

    // Get current week document
    const currentWeekDoc = await cosmosProvider.getCurrentWeekDocument(userId);

    if (!currentWeekDoc) {
      // No current week exists yet - this is OK, return empty structure
      context.log(`ℹ️ No current week found for user ${userId}`);
      context.res = {
        status: 200,
        body: JSON.stringify({
          success: true,
          data: null,
          message: 'No current week document found. Create one with saveCurrentWeek.'
        }),
        headers
      };
      return;
    }

    // Return current week document
    context.log(`✅ Current week retrieved: ${currentWeekDoc.weekId} (${currentWeekDoc.goals?.length || 0} goals)`);
    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        data: currentWeekDoc
      }),
      headers
    };

  } catch (error) {
    context.log.error('❌ Error getting current week:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({
        success: false,
        error: 'Failed to get current week',
        details: error.message
      }),
      headers
    };
  }
};

