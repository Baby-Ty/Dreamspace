/**
 * Azure Function: Sync Current Week
 * 
 * Syncs the current week's goals for a user. Handles two scenarios:
 * 1. Week mismatch: Triggers full rollover (archive old week, create new week)
 * 2. Same week: Creates any missing goal instances (new templates/goals added mid-week)
 * 
 * This endpoint consolidates all goal instance creation to the backend,
 * ensuring consistent weeksRemaining logic and avoiding frontend/backend drift.
 * 
 * Route: GET /api/syncCurrentWeek/{userId}
 * Returns: Current week document with synced goals
 */

const { createApiHandler } = require('../utils/apiWrapper');
const { getCurrentIsoWeek } = require('../utils/weekDateUtils');
const { rolloverWeekForUser, createMissingGoalInstances } = require('../utils/weekRollover');

module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'bindingData.userId'
}, async (context, req, { provider }) => {
  const userId = context.bindingData.userId;

  // Validate userId
  if (!userId) {
    throw { status: 400, message: 'userId is required' };
  }

  context.log(`🔄 Syncing current week for user: ${userId}`);
  
  // Get current week document and system week
  const currentWeekDoc = await provider.getCurrentWeekDocument(userId);
  const systemWeekId = getCurrentIsoWeek();
  
  context.log(`📅 System week: ${systemWeekId}, User's current week: ${currentWeekDoc?.weekId || 'none'}`);
  
  // Case 1: Week mismatch - need full rollover
  if (currentWeekDoc && currentWeekDoc.weekId !== systemWeekId) {
    context.log(`🔄 Week mismatch detected. Triggering rollover from ${currentWeekDoc.weekId} to ${systemWeekId}`);
    
    const rolloverResult = await rolloverWeekForUser(userId, context);
    
    if (!rolloverResult.success) {
      throw { status: 500, message: `Rollover failed: ${rolloverResult.message}` };
    }
    
    // Fetch the updated week document after rollover
    const updatedWeekDoc = await provider.getCurrentWeekDocument(userId);
    
    context.log(`✅ Rollover complete. New week: ${updatedWeekDoc?.weekId} with ${updatedWeekDoc?.goals?.length || 0} goals`);
    
    return {
      success: true,
      data: updatedWeekDoc,
      message: rolloverResult.message
    };
  }
  
  // Case 2: Same week or no doc - ensure all instances exist
  context.log(`📋 Same week or no doc. Creating any missing goal instances...`);
  
  const result = await createMissingGoalInstances(userId, systemWeekId, currentWeekDoc, context);
  
  context.log(`✅ Sync complete. Week: ${result.weekId} with ${result.goals?.length || 0} goals (${result.created || 0} new)`);
  
  return {
    success: true,
    data: {
      id: userId,
      userId: userId,
      weekId: result.weekId,
      goals: result.goals,
      stats: result.stats
    },
    message: result.created > 0 ? `Created ${result.created} new goal instance(s)` : 'All goals synced'
  };
});
