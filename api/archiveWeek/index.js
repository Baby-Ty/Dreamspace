/**
 * Azure Function: Archive Week
 * Archives the current week to past weeks history
 * 
 * Route: POST /api/archiveWeek
 * Body: { userId, weekId, weekSummary }
 * Returns: Updated past weeks document
 */

const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'body.userId'
}, async (context, req, { provider }) => {
  const { userId, weekId, weekSummary } = req.body || {};

  context.log('📦 Archiving week:', { userId, weekId });

  // Validate required fields
  if (!userId) {
    throw { status: 400, message: 'userId is required' };
  }

  if (!weekId) {
    throw { status: 400, message: 'weekId is required (e.g., "2025-W47")' };
  }

  if (!weekSummary || typeof weekSummary !== 'object') {
    throw { status: 400, message: 'weekSummary object is required with: totalGoals, completedGoals, score, weekStartDate, weekEndDate' };
  }

  // Archive week to past weeks document
  const pastWeeksDoc = await provider.archiveWeekToPastWeeks(userId, weekId, weekSummary);

  context.log(`✅ Week archived: ${weekId} (${weekSummary.completedGoals}/${weekSummary.totalGoals} goals completed)`);
  return {
    success: true,
    data: pastWeeksDoc,
    message: `Week ${weekId} archived successfully`
  };
});

