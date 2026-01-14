/**
 * Simulate Week Rollover for a Specific User
 * 
 * This script simulates a week rollover for a given user email.
 * It forces the rollover to the next week regardless of the current date.
 * 
 * Usage: node scripts/simulateWeekRollover.cjs <email>
 * Example: node scripts/simulateWeekRollover.cjs tyler.stewart@netsurit.com
 * 
 * Requires: COSMOS_ENDPOINT and COSMOS_KEY environment variables
 * Can be set via:
 *   - Environment variables: $env:COSMOS_ENDPOINT="..." (PowerShell)
 *   - api/local.settings.json: Will try to load from there if variables not set
 */

const fs = require('fs');
const path = require('path');

// Try to load from api/local.settings.json (Azure Functions style) if variables not already set
if (!process.env.COSMOS_ENDPOINT || !process.env.COSMOS_KEY) {
  const localSettingsPath = path.join(__dirname, '..', 'api', 'local.settings.json');
  if (fs.existsSync(localSettingsPath)) {
    try {
      const localSettings = JSON.parse(fs.readFileSync(localSettingsPath, 'utf8'));
      if (localSettings.Values) {
        if (!process.env.COSMOS_ENDPOINT && localSettings.Values.COSMOS_ENDPOINT) {
          process.env.COSMOS_ENDPOINT = localSettings.Values.COSMOS_ENDPOINT;
        }
        if (!process.env.COSMOS_KEY && localSettings.Values.COSMOS_KEY) {
          process.env.COSMOS_KEY = localSettings.Values.COSMOS_KEY;
        }
      }
    } catch (error) {
      console.error('Failed to load local.settings.json:', error.message);
    }
  }
}

// Validate environment variables
if (!process.env.COSMOS_ENDPOINT || !process.env.COSMOS_KEY) {
  console.error('❌ Error: COSMOS_ENDPOINT and COSMOS_KEY environment variables are required');
  console.error('   Set them via:');
  console.error('   - Environment variables: $env:COSMOS_ENDPOINT="..." (PowerShell)');
  console.error('   - Or ensure api/local.settings.json exists with Values.COSMOS_ENDPOINT and Values.COSMOS_KEY');
  process.exit(1);
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Email address is required');
  console.error('   Usage: node scripts/simulateWeekRollover.cjs <email>');
  console.error('   Example: node scripts/simulateWeekRollover.cjs tyler.stewart@netsurit.com');
  process.exit(1);
}

// Import rollover function and cosmos provider
const { rolloverWeekForUser, createGoalsFromTemplates } = require('../api/utils/weekRollover');
const { getCosmosProvider } = require('../api/utils/cosmosProvider');
const { getCurrentIsoWeek, getWeekRange } = require('../api/utils/weekDateUtils');

// Create a simple context object for logging
// The rollover function expects context.log to be a function, not an object
const context = {
  log: (...args) => console.log(...args)
};

async function checkUserExists(userId) {
  try {
    const cosmosProvider = getCosmosProvider();
    const userProfile = await cosmosProvider.getUserProfile(userId);
    return userProfile !== null;
  } catch (error) {
    return false;
  }
}

async function getCurrentWeekInfo(userId) {
  try {
    const cosmosProvider = getCosmosProvider();
    const currentWeekDoc = await cosmosProvider.getCurrentWeekDocument(userId);
    return currentWeekDoc;
  } catch (error) {
    return null;
  }
}

async function simulateRollover() {
  console.log('');
  console.log('🔄 Simulating Week Rollover');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   User: ${email}`);
  console.log(`   Mode: Simulated (force rollover to next week)`);
  console.log('');
  
  // Check if user exists
  console.log('🔍 Checking if user exists...');
  const userExists = await checkUserExists(email);
  
  if (!userExists) {
    console.log('⚠️  User not found in database');
    console.log('   The user may not have logged in yet or may not exist.');
    console.log('   Week rollover requires an existing user with a current week document.');
    console.log('');
    process.exit(1);
  }
  
  console.log('✅ User exists');
  
  // Check current week status
  console.log('🔍 Checking current week status...');
  let currentWeekDoc = await getCurrentWeekInfo(email);
  
  if (!currentWeekDoc) {
    console.log('⚠️  No current week document found');
    console.log('   Creating initial current week document...');
    
    // Create an initial current week document
    const cosmosProvider = getCosmosProvider();
    const currentWeekId = getCurrentIsoWeek();
    const { start, end } = getWeekRange(currentWeekId);
    
    // Create goals from templates for the current week
    const initialGoals = await createGoalsFromTemplates(email, currentWeekId, [], context);
    
    // Create the current week document
    await cosmosProvider.upsertCurrentWeek(email, currentWeekId, initialGoals);
    
    console.log(`✅ Created initial current week: ${currentWeekId}`);
    console.log(`   Goals: ${initialGoals.length}`);
    
    // Reload to get the document
    currentWeekDoc = await getCurrentWeekInfo(email);
    console.log('');
  } else {
    console.log(`✅ Current week: ${currentWeekDoc.weekId}`);
    console.log(`   Goals: ${currentWeekDoc.goals?.length || 0}`);
    console.log('');
  }
  
  // Perform rollover
  try {
    const result = await rolloverWeekForUser(email, context, true); // simulate = true
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (result.success) {
      if (result.rolled) {
        console.log('✅ Week Rollover Successful!');
        console.log(`   From: ${result.fromWeek}`);
        console.log(`   To: ${result.toWeek}`);
        console.log(`   Goals: ${result.goalsCount}`);
        console.log(`   Message: ${result.message}`);
      } else {
        console.log('ℹ️  No rollover needed');
        console.log(`   Message: ${result.message}`);
      }
    } else {
      console.log('❌ Week Rollover Failed');
      console.log(`   Error: ${result.message}`);
      process.exit(1);
    }
    
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ Unexpected Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the simulation
simulateRollover();
