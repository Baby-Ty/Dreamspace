/**
 * Azure Function: Save Current Week
 * Saves/updates the current week document with active goals
 * 
 * Route: POST /api/saveCurrentWeek
 * Body: { userId, weekId, goals, stats? }
 * Returns: Saved current week document
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

  const { userId, weekId, goals, stats } = req.body || {};

  context.log('💾 Saving current week:', { userId, weekId, goalsCount: goals?.length });

  // Validate required fields
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

  // AUTH CHECK: User can only save their own week data
  if (isAuthRequired()) {
    const user = await requireUserAccess(context, req, userId);
    if (!user) return; // 401/403 already sent
  }

  if (!weekId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ 
        success: false,
        error: 'weekId is required (e.g., "2025-W47")' 
      }),
      headers
    };
    return;
  }

  // Validate weekId format (YYYY-Www)
  const weekIdPattern = /^\d{4}-W\d{2}$/;
  if (!weekIdPattern.test(weekId)) {
    context.res = {
      status: 400,
      body: JSON.stringify({ 
        success: false,
        error: 'Invalid weekId format. Expected format: YYYY-Www (e.g., "2025-W47")' 
      }),
      headers
    };
    return;
  }

  if (!goals || !Array.isArray(goals)) {
    context.res = {
      status: 400,
      body: JSON.stringify({ 
        success: false,
        error: 'goals array is required' 
      }),
      headers
    };
    return;
  }

  // Validate goals structure
  for (let i = 0; i < goals.length; i++) {
    const goal = goals[i];
    if (!goal.title) {
      context.res = {
        status: 400,
        body: JSON.stringify({ 
          success: false,
          error: `Goal at index ${i} missing required field: title` 
        }),
        headers
      };
      return;
    }
    if (typeof goal.completed !== 'boolean') {
      context.res = {
        status: 400,
        body: JSON.stringify({ 
          success: false,
          error: `Goal at index ${i} missing required boolean field: completed` 
        }),
        headers
      };
      return;
    }
  }

  try {
    const cosmosProvider = getCosmosProvider();
    if (!cosmosProvider) {
      throw new Error('Cosmos DB not configured');
    }

    // Save current week document
    const savedDoc = await cosmosProvider.upsertCurrentWeek(userId, weekId, goals, stats);

    context.log(`✅ Current week saved: ${weekId} (${goals.length} goals)`);
    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        data: savedDoc
      }),
      headers
    };

  } catch (error) {
    context.log.error('❌ Error saving current week:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({
        success: false,
        error: 'Failed to save current week',
        details: error.message
      }),
      headers
    };
  }
};

