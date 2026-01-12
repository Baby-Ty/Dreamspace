/**
 * Azure Function: Get Past Weeks
 * Gets the past weeks history document for a user
 * 
 * Route: GET /api/getPastWeeks/{userId}
 * Returns: Past weeks document with historical summaries
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

  context.log(`📊 Getting past weeks history for user: ${userId}`);
  
  // Get past weeks document
  const pastWeeksDoc = await provider.getPastWeeksDocument(userId);

  if (!pastWeeksDoc) {
    // No history yet - this is OK, return empty structure
    context.log(`ℹ️ No past weeks history found for user ${userId}`);
    return {
      success: true,
      data: {
        userId: userId,
        weekHistory: {},
        totalWeeksTracked: 0
      },
      message: 'No past weeks history found yet.'
    };
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
  
  return {
    success: true,
    data: responseData
  };
});

