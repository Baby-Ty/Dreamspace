/**
 * Azure Function: Save Current Week
 * Saves/updates the current week document with active goals
 * 
 * Route: POST /api/saveCurrentWeek
 * Body: { userId, weekId, goals, stats? }
 * Returns: Saved current week document
 */

const { createApiHandler } = require('../utils/apiWrapper');
const { validateRequest, SaveCurrentWeekRequestSchema, createValidationError } = require('../utils/validation');

module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'body.userId'
}, async (context, req, { provider }) => {
  // Validate request body with Zod schema
  const validation = validateRequest(req.body, SaveCurrentWeekRequestSchema);
  if (!validation.success) {
    context.log.warn('saveCurrentWeek validation failed:', validation.errors);
    throw createValidationError(validation.errors);
  }

  const { userId, weekId, goals } = validation.data;
  const stats = req.body?.stats; // Optional, not validated

  context.log('💾 Saving current week:', { userId, weekId, goalsCount: goals?.length });

  // Save current week document
  const savedDoc = await provider.upsertCurrentWeek(userId, weekId, goals, stats);

  context.log(`✅ Current week saved: ${weekId} (${goals.length} goals)`);
  return {
    success: true,
    data: savedDoc
  };
});

