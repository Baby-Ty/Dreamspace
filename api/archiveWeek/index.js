/**
 * Azure Function: Archive Week
 * Archives the current week to past weeks history
 * 
 * Route: POST /api/archiveWeek
 * Body: { userId, weekId, weekSummary }
 * Returns: Updated past weeks document
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

  const { userId, weekId, weekSummary } = req.body || {};

  context.log('📦 Archiving week:', { userId, weekId });

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

  // AUTH CHECK: User can only archive their own week data
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

  if (!weekSummary || typeof weekSummary !== 'object') {
    context.res = {
      status: 400,
      body: JSON.stringify({ 
        success: false,
        error: 'weekSummary object is required with: totalGoals, completedGoals, score, weekStartDate, weekEndDate' 
      }),
      headers
    };
    return;
  }

  try {
    const cosmosProvider = getCosmosProvider();
    if (!cosmosProvider) {
      throw new Error('Cosmos DB not configured');
    }

    // Archive week to past weeks document
    const pastWeeksDoc = await cosmosProvider.archiveWeekToPastWeeks(userId, weekId, weekSummary);

    context.log(`✅ Week archived: ${weekId} (${weekSummary.completedGoals}/${weekSummary.totalGoals} goals completed)`);
    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        data: pastWeeksDoc,
        message: `Week ${weekId} archived successfully`
      }),
      headers
    };

  } catch (error) {
    context.log.error('❌ Error archiving week:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({
        success: false,
        error: 'Failed to archive week',
        details: error.message
      }),
      headers
    };
  }
};

