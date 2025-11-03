/**
 * Migration Script: Move items from old 'items' container to new 'dreams' container
 * 
 * Usage: Run this script manually via Azure Function or Node.js
 * 
 * This script:
 * 1. Queries all documents from 'items' container
 * 2. Filters by type: 'dream' and 'weekly_goal_template'
 * 3. Copies each document to 'dreams' container
 * 4. Verifies successful copy
 * 5. Optionally deletes from old container (commented out for safety)
 * 
 * Run in Azure Portal Function Console or deploy as Azure Function
 */

const { CosmosClient } = require('@azure/cosmos');

// Configuration - set these environment variables
const COSMOS_ENDPOINT = process.env.COSMOS_ENDPOINT;
const COSMOS_KEY = process.env.COSMOS_KEY;
const DATABASE_NAME = 'dreamspace';
const OLD_CONTAINER_NAME = 'items';
const NEW_CONTAINER_NAME = 'dreams';

// Types to migrate (others go to dedicated containers)
const TYPES_TO_MIGRATE = ['dream', 'weekly_goal_template'];

async function migrateItemsToDreams() {
  console.log('🚀 Starting migration from items → dreams');
  console.log('================================================');

  if (!COSMOS_ENDPOINT || !COSMOS_KEY) {
    console.error('❌ Missing COSMOS_ENDPOINT or COSMOS_KEY environment variables');
    return;
  }

  // Initialize Cosmos client
  const client = new CosmosClient({
    endpoint: COSMOS_ENDPOINT,
    key: COSMOS_KEY
  });

  const database = client.database(DATABASE_NAME);
  const oldContainer = database.container(OLD_CONTAINER_NAME);
  const newContainer = database.container(NEW_CONTAINER_NAME);

  try {
    // Query all documents from old container
    console.log(`📂 Querying all documents from ${OLD_CONTAINER_NAME} container...`);
    
    const { resources: allItems } = await oldContainer.items
      .query('SELECT * FROM c')
      .fetchAll();

    console.log(`✅ Found ${allItems.length} total documents in ${OLD_CONTAINER_NAME} container`);

    // Filter items to migrate
    const itemsToMigrate = allItems.filter(item => 
      TYPES_TO_MIGRATE.includes(item.type)
    );

    console.log(`📋 Filtered ${itemsToMigrate.length} items to migrate (types: ${TYPES_TO_MIGRATE.join(', ')})`);

    // Statistics
    const stats = {
      total: itemsToMigrate.length,
      migrated: 0,
      failed: 0,
      skipped: 0,
      byType: {}
    };

    // Migrate each item
    for (const item of itemsToMigrate) {
      try {
        const { userId, type, id } = item;

        // Update stats by type
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        console.log(`📤 Migrating ${type}: ${id} (user: ${userId})`);

        // Check if already exists in new container
        try {
          const { resource: existingItem } = await newContainer.item(id, userId).read();
          if (existingItem) {
            console.log(`⏭️  Skipping ${id} - already exists in ${NEW_CONTAINER_NAME}`);
            stats.skipped++;
            continue;
          }
        } catch (error) {
          if (error.code !== 404) {
            throw error; // Re-throw if it's not a "not found" error
          }
          // Item doesn't exist, proceed with migration
        }

        // Remove Cosmos metadata
        const { _rid, _self, _etag, _attachments, _ts, ...cleanItem } = item;

        // Add migration metadata
        const documentToMigrate = {
          ...cleanItem,
          migratedAt: new Date().toISOString(),
          migratedFrom: OLD_CONTAINER_NAME,
          updatedAt: new Date().toISOString()
        };

        // Copy to new container
        const { resource: migratedItem } = await newContainer.items.upsert(documentToMigrate);

        console.log(`✅ Migrated ${type}: ${migratedItem.id}`);
        stats.migrated++;

        // OPTIONAL: Delete from old container (commented out for safety)
        // Uncomment the lines below to delete items after successful migration
        /*
        await oldContainer.item(id, userId).delete();
        console.log(`🗑️  Deleted ${id} from ${OLD_CONTAINER_NAME}`);
        */

      } catch (error) {
        console.error(`❌ Failed to migrate ${item.type}: ${item.id}`, error.message);
        stats.failed++;
      }
    }

    // Print summary
    console.log('\n================================================');
    console.log('✅ MIGRATION COMPLETE');
    console.log('================================================');
    console.log(`Total items to migrate: ${stats.total}`);
    console.log(`Successfully migrated:  ${stats.migrated}`);
    console.log(`Skipped (already exist): ${stats.skipped}`);
    console.log(`Failed:                 ${stats.failed}`);
    console.log('\nBy Type:');
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });
    console.log('================================================\n');

    // Print next steps
    console.log('📝 Next Steps:');
    console.log('1. Verify migrated data in Azure Portal');
    console.log('2. Test application with new container');
    console.log('3. If successful, uncomment delete logic and re-run to clean up old container');
    console.log('4. Archive or delete old "items" container after validation period\n');

    return stats;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Export for Azure Function or run directly
module.exports = async function (context, req) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const stats = await migrateItemsToDreams();
    
    context.res = {
      status: 200,
      body: JSON.stringify({ 
        success: true,
        message: 'Migration completed',
        stats
      }),
      headers
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        success: false,
        error: 'Migration failed', 
        details: error.message 
      }),
      headers
    };
  }
};

// Run directly if not in Azure Function context
if (require.main === module) {
  migrateItemsToDreams()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

