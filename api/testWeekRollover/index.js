/**
 * Azure Function: Test Week Rollover
 * HTTP endpoint to manually trigger week rollover for testing
 * 
 * Route: POST /api/testWeekRollover/{userId}
 * Body: (optional) { force: true } to force rollover even if week is current
 * Returns: Rollover result
 */

const { getCosmosProvider } = require('../utils/cosmosProvider');
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
    // If force is true, we need to manually advance the week
    if (force) {
      context.log('⚠️ Force mode: Manually advancing week for testing');
      
      const cosmosProvider = getCosmosProvider();
      const currentWeekDoc = await cosmosProvider.getCurrentWeekDocument(userId);
      
      if (currentWeekDoc) {
        // Manually set weekId to previous week to force rollover
        const currentWeekId = currentWeekDoc.weekId;
        const [year, week] = currentWeekId.split('-W').map(Number);
        let prevWeek = week - 1;
        let prevYear = year;
        
        if (prevWeek < 1) {
          prevWeek = 52;
          prevYear = year - 1;
        }
        
        const prevWeekId = `${prevYear}-W${String(prevWeek).padStart(2, '0')}`;
        
        context.log(`🔄 Forcing rollover: Setting current week from ${currentWeekId} to ${prevWeekId}`);
        
        // Update the weekId using upsertCurrentWeek
        await cosmosProvider.upsertCurrentWeek(
          userId,
          prevWeekId,
          currentWeekDoc.goals || [],
          currentWeekDoc.stats || {}
        );
        
        context.log(`✅ Week set to ${prevWeekId}, now triggering rollover...`);
      }
    }

    // Perform rollover
    const result = await rolloverWeekForUser(userId, context);

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

