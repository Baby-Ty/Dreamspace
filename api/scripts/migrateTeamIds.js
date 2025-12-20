/**
 * Migration Script: Add stable teamId to existing team documents
 * 
 * This script migrates existing team documents to include a stable teamId
 * that persists across coach changes. This ensures meeting attendance and
 * other team-linked data remains accessible when coaches are replaced.
 * 
 * Usage:
 *   cd api && node scripts/migrateTeamIds.js
 * 
 * Prerequisites:
 *   - Set COSMOS_ENDPOINT and COSMOS_KEY environment variables
 *   - Or have local.settings.json with these values in the api folder
 */

const { CosmosClient } = require('@azure/cosmos');
const { generateTeamId } = require('../utils/idGenerator');
const path = require('path');
const fs = require('fs');

// Try to load from local.settings.json if env vars not set
function loadConfig() {
  let endpoint = process.env.COSMOS_ENDPOINT;
  let key = process.env.COSMOS_KEY;
  
  if (!endpoint || !key) {
    const localSettingsPath = path.join(__dirname, '..', 'local.settings.json');
    if (fs.existsSync(localSettingsPath)) {
      try {
        const settings = JSON.parse(fs.readFileSync(localSettingsPath, 'utf8'));
        endpoint = endpoint || settings.Values?.COSMOS_ENDPOINT;
        key = key || settings.Values?.COSMOS_KEY;
        console.log('📁 Loaded credentials from local.settings.json');
      } catch (err) {
        console.error('⚠️ Failed to parse local.settings.json:', err.message);
      }
    }
  }
  
  return { endpoint, key };
}

async function migrateTeamIds() {
  const { endpoint, key } = loadConfig();
  
  if (!endpoint || !key) {
    console.error('❌ Missing COSMOS_ENDPOINT or COSMOS_KEY');
    console.error('   Set environment variables or create local.settings.json');
    process.exit(1);
  }

  console.log('🔌 Connecting to Cosmos DB...');
  const client = new CosmosClient({ endpoint, key });
  const database = client.database('dreamspace');
  const teamsContainer = database.container('teams');

  try {
    // Query all team documents
    console.log('🔍 Querying team documents...');
    const query = {
      query: 'SELECT * FROM c WHERE c.type = @type',
      parameters: [{ name: '@type', value: 'team_relationship' }]
    };
    
    const { resources: teams } = await teamsContainer.items.query(query).fetchAll();
    console.log(`📊 Found ${teams.length} team documents`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const team of teams) {
      // Check if team already has a short stable teamId (6 chars after team_)
      const hasShortTeamId = team.teamId && team.teamId.startsWith('team_') && 
                              team.teamId.length === 11 && // "team_" + 6 chars
                              !team.teamId.includes('-'); // No dashes (not UUID)
      
      if (hasShortTeamId && team.id === team.teamId) {
        console.log(`⏭️  Skipping ${team.teamName} - already has short teamId: ${team.teamId}`);
        skippedCount++;
        continue;
      }

      try {
        // Generate new short stable teamId
        const newTeamId = generateTeamId(); // e.g., "team_a1b2c3"
        
        console.log(`🔄 Migrating ${team.teamName}:`);
        console.log(`   Old id: ${team.id}`);
        console.log(`   Old teamId: ${team.teamId || '(none)'}`);
        console.log(`   New teamId: ${newTeamId}`);

        // Create new document with stable teamId
        const migratedTeam = {
          ...team,
          id: newTeamId,           // Document ID = teamId
          teamId: newTeamId,       // Stable team identifier
          migratedAt: new Date().toISOString(),
          previousId: team.id,     // Keep reference to old ID for debugging
          previousTeamId: team.teamId || null
        };

        // Delete old document first (different partition key can't just replace)
        await teamsContainer.item(team.id, team.managerId).delete();
        
        // Create new document
        await teamsContainer.items.create(migratedTeam);
        
        console.log(`   ✅ Migrated successfully`);
        migratedCount++;
      } catch (err) {
        console.error(`   ❌ Error migrating ${team.teamName}: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Migrated: ${migratedCount}`);
    console.log(`   ⏭️  Skipped (already migrated): ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total processed: ${teams.length}`);

    if (errorCount > 0) {
      console.log('\n⚠️ Some teams failed to migrate. Please check the errors above.');
      process.exit(1);
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
migrateTeamIds();

