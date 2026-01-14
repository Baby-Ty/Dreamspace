/**
 * Azure Function: Weekly Rollover Timer
 * Runs every Monday at 00:00 UTC
 * Archives previous week and creates new week for all users
 * 
 * Timer: "0 0 0 * * 1" (NCRONTAB 6-field: sec min hour day month weekday)
 */

const { getCosmosProvider } = require('../utils/cosmosProvider');
const { rolloverWeekForUser } = require('../utils/weekRollover');

module.exports = async function (context, timer) {
  context.log('🔄 Weekly Rollover Timer Triggered');
  context.log('Timestamp:', timer.scheduleStatus.last);
  context.log('Next run:', timer.scheduleStatus.next);
  
  try {
    const cosmosProvider = getCosmosProvider();
    
    // 1. Get all users
    context.log('📋 Fetching all users...');
    const usersContainer = cosmosProvider.getContainer('users');
    const { resources: users } = await usersContainer.items
      .query('SELECT c.id FROM c')
      .fetchAll();
    
    context.log(`📋 Found ${users.length} users to process`);
    
    // 2. Process each user
    const results = {
      total: users.length,
      rolled: 0,
      skipped: 0,
      failed: 0,
      details: []
    };
    
    for (const user of users) {
      const result = await rolloverWeekForUser(user.id, context);
      
      if (result.success && result.rolled) {
        results.rolled++;
      } else if (result.success && !result.rolled) {
        results.skipped++;
      } else {
        results.failed++;
      }
      
      results.details.push({
        userId: user.id,
        ...result
      });
    }
    
    // 3. Log summary
    context.log('');
    context.log('📊 Weekly Rollover Complete:');
    context.log(`   Total users: ${results.total}`);
    context.log(`   ✅ Rolled over: ${results.rolled}`);
    context.log(`   ⏭️  Already current: ${results.skipped}`);
    context.log(`   ❌ Failed: ${results.failed}`);
    
    // 4. Log any failures
    if (results.failed > 0) {
      context.log.error('');
      context.log.error('❌ Failed rollovers:');
      results.details
        .filter(d => !d.success)
        .forEach(d => {
          context.log.error(`   - ${d.userId}: ${d.message}`);
        });
    }
    
    // 5. Log rollover details (for debugging)
    if (results.rolled > 0) {
      context.log('');
      context.log('🔄 Rolled over users:');
      results.details
        .filter(d => d.success && d.rolled)
        .forEach(d => {
          context.log(`   - ${d.userId}: ${d.fromWeek} → ${d.toWeek} (${d.goalsCount} goals)`);
        });
    }
    
    return results;
    
  } catch (error) {
    context.log.error('❌ Weekly Rollover Timer Failed:', error);
    throw error;
  }
};

