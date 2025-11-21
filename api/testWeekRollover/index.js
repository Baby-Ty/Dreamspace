/**
 * Azure Function: Test Week Rollover
 * HTTP endpoint to manually trigger week rollover for testing
 * 
 * Route: POST /api/testWeekRollover/{userId}
 * Body: (optional) { force: true } - Parameter accepted but not required (kept for backward compatibility)
 * 
 * Note: Forces simulation mode (simulate=true) to always use nextWeekId, ensuring proper forward
 * week progression during testing (W46 → W47 → W48 → W49...) without rollback issues.
 * 
 * Returns: Rollover result
 */

const { rolloverWeekForUser, getCurrentIsoWeek } = require('../utils/weekRollover');

module.exports = async function (context, req) {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  const userId = context.bindingData.userId || req.body?.userId;
  const force = req.body?.force === true;

  context.log('🧪 Test Week Rollover triggered:', { userId, force });

  // Validate userId
  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({
        success: false,
        error: 'userId is required (in URL path or body)'
      }),
      headers
    };
    return;
  }

  try {
    // Perform rollover in simulation mode
    // Force simulation mode to always use nextWeekId, ensuring proper week progression during testing
    // This prevents rollback when current week is ahead of system week
    const result = await rolloverWeekForUser(userId, context, true);

    context.log('✅ Test rollover complete:', result);

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        ...result,
        currentWeek: getCurrentIsoWeek(),
        timestamp: new Date().toISOString()
      }),
      headers
    };

  } catch (error) {
    context.log.error('❌ Test rollover failed:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({
        success: false,
        error: 'Rollover failed',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
      headers
    };
  }
};

