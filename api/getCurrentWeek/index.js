/**
 * Azure Function: Get Current Week
 * Gets the current week document for a user containing active weekly goals
 * 
 * Route: GET /api/getCurrentWeek/{userId}
 * Returns: Current week document with goals and stats
 */

const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'bindingData.userId'
}, async (context, req, { provider }) => {
  const userId = context.bindingData.userId;

  // Validate userId
  if (!userId) {
    throw { status: 400, message: 'userId is required' };
  }

  context.log(`📅 Getting current week for user: ${userId}`);
  
  // Get current week document
  const currentWeekDoc = await provider.getCurrentWeekDocument(userId);

  if (!currentWeekDoc) {
    // No current week exists yet - this is OK, return empty structure
    context.log(`ℹ️ No current week found for user ${userId}`);
    return {
      success: true,
      data: null,
      message: 'No current week document found. Create one with saveCurrentWeek.'
    };
  }

  // Return current week document
  context.log(`✅ Current week retrieved: ${currentWeekDoc.weekId} (${currentWeekDoc.goals?.length || 0} goals)`);
  return {
    success: true,
    data: currentWeekDoc
  };
});

