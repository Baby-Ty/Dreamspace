/**
 * Simulate Week Rollover Script
 * 
 * Usage: node scripts/simulateRollover.js <email>
 * Example: node scripts/simulateRollover.js tyler.stewart@netsurit.com
 * 
 * This script simulates a week rollover for a specific user without waiting for Monday.
 * It will:
 * 1. Archive the current week to pastWeeks
 * 2. Create a new week with all active goals (weeksRemaining decremented)
 */

// Load environment variables from local.settings.json format
const fs = require('fs');
const path = require('path');
const settingsPath = path.join(__dirname, '..', 'local.settings.json');

if (fs.existsSync(settingsPath)) {
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  if (settings.Values) {
    Object.assign(process.env, settings.Values);
  }
} else {
  console.error('❌ local.settings.json not found. Please create it from local.settings.json.example');
  process.exit(1);
}

const { getCosmosProvider } = require('../utils/cosmosProvider');
const { rolloverWeekForUser } = require('../utils/weekRollover');

async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('❌ Usage: node scripts/simulateRollover.js <email>');
    console.error('   Example: node scripts/simulateRollover.js tyler.stewart@netsurit.com');
    process.exit(1);
  }

  console.log(`\n🔍 Looking up user: ${email}\n`);

  try {
    const provider = getCosmosProvider();
    
    // Find user by email
    const usersContainer = provider.getContainer('users');
    const { resources: users } = await usersContainer.items
      .query({
        query: 'SELECT * FROM c WHERE LOWER(c.email) = LOWER(@email)',
        parameters: [{ name: '@email', value: email }]
      })
      .fetchAll();

    if (users.length === 0) {
      console.error(`❌ No user found with email: ${email}`);
      process.exit(1);
    }

    const user = users[0];
    console.log(`✅ Found user: ${user.displayName || user.email}`);
    console.log(`   User ID: ${user.id}`);

    // Get current week info
    const currentWeekDoc = await provider.getCurrentWeekDocument(user.id);
    if (currentWeekDoc) {
      console.log(`\n📅 Current week: ${currentWeekDoc.weekId}`);
      console.log(`   Goals: ${currentWeekDoc.goals?.length || 0}`);
      console.log(`   Completed: ${currentWeekDoc.goals?.filter(g => g.completed).length || 0}`);
    } else {
      console.log(`\n📅 No current week document found`);
    }

    // Confirm before proceeding
    console.log(`\n⚠️  This will SIMULATE a rollover (force move to next week)`);
    console.log(`   - Current week will be archived to pastWeeks`);
    console.log(`   - A new week will be created with decremented weeksRemaining`);
    console.log(`\nProceeding in 3 seconds... (Ctrl+C to cancel)\n`);
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Create a mock context for logging
    const context = {
      log: (...args) => console.log(...args),
      log: Object.assign(
        (...args) => console.log(...args),
        { error: (...args) => console.error(...args) }
      )
    };

    // Run rollover with simulate=true
    console.log(`\n🔄 Starting simulated rollover...\n`);
    const result = await rolloverWeekForUser(user.id, context, true); // simulate=true

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`📊 RESULT:`);
    console.log(`   Success: ${result.success}`);
    console.log(`   Rolled: ${result.rolled}`);
    console.log(`   Message: ${result.message}`);
    if (result.fromWeek) {
      console.log(`   From: ${result.fromWeek} → To: ${result.toWeek}`);
      console.log(`   Goals created: ${result.goalsCount}`);
    }
    console.log(`${'─'.repeat(50)}\n`);

  } catch (error) {
    console.error(`\n❌ Error:`, error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
