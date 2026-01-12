/**
 * Azure Function: Save Current Week
 * Saves/updates the current week document with active goals
 * 
 * Route: POST /api/saveCurrentWeek
 * Body: { userId, weekId, goals, stats? }
 * Returns: Saved current week document
 */

const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'body.userId'
}, async (context, req, { provider }) => {
  const { userId, weekId, goals, stats } = req.body || {};

  context.log('💾 Saving current week:', { userId, weekId, goalsCount: goals?.length });

  // Validate required fields
  if (!userId) {
    throw { status: 400, message: 'userId is required' };
  }

  if (!weekId) {
    throw { status: 400, message: 'weekId is required (e.g., "2025-W47")' };
  }

  // Validate weekId format (YYYY-Www)
  const weekIdPattern = /^\d{4}-W\d{2}$/;
  if (!weekIdPattern.test(weekId)) {
    throw { status: 400, message: 'Invalid weekId format. Expected format: YYYY-Www (e.g., "2025-W47")' };
  }

  if (!goals || !Array.isArray(goals)) {
    throw { status: 400, message: 'goals array is required' };
  }

  // Validate goals structure
  for (let i = 0; i < goals.length; i++) {
    const goal = goals[i];
    if (!goal.title) {
      throw { status: 400, message: `Goal at index ${i} missing required field: title` };
    }
    if (typeof goal.completed !== 'boolean') {
      throw { status: 400, message: `Goal at index ${i} missing required boolean field: completed` };
    }
  }

  // Save current week document
  const savedDoc = await provider.upsertCurrentWeek(userId, weekId, goals, stats);

  context.log(`✅ Current week saved: ${weekId} (${goals.length} goals)`);
  return {
    success: true,
    data: savedDoc
  };
});

