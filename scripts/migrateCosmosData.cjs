/**
 * Cosmos DB Migration Script
 * Migrates all data from old Cosmos DB to new optimized DB
 * 
 * Usage: node scripts/migrateCosmosData.js
 * 
 * Requires environment variables:
 * - OLD_COSMOS_ENDPOINT: Source Cosmos DB endpoint
 * - OLD_COSMOS_KEY: Source Cosmos DB key
 * - NEW_COSMOS_ENDPOINT: Destination Cosmos DB endpoint
 * - NEW_COSMOS_KEY: Destination Cosmos DB key
 */

const { CosmosClient } = require('@azure/cosmos');
const fs = require('fs');
const path = require('path');

// Container configuration
const CONTAINERS = [
  { name: 'users', partitionKey: '/userId' },
  { name: 'dreams', partitionKey: '/userId' },
  { name: 'connects', partitionKey: '/userId' },
  { name: 'scoring', partitionKey: '/userId' },
  { name: 'teams', partitionKey: '/managerId' },
  { name: 'coaching_alerts', partitionKey: '/managerId' },
  { name: 'currentWeek', partitionKey: '/userId' },
  { name: 'pastWeeks', partitionKey: '/userId' },
  { name: 'meeting_attendance', partitionKey: '/teamId' },
  { name: 'prompts', partitionKey: '/partitionKey' }
];

const DATABASE_NAME = 'dreamspace';
const BATCH_SIZE = 50; // Process documents in batches to avoid throttling

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function migrateContainer(sourceContainer, destContainer, containerName) {
  console.log(`\n📦 Migrating container: ${containerName}`);
  
  try {
    // Read all documents from source
    console.log(`   📖 Reading documents from source...`);
    const { resources: documents } = await sourceContainer.items
      .readAll()
      .fetchAll();

    const totalDocs = documents.length;
    console.log(`   📊 Found ${totalDocs} documents`);

    if (totalDocs === 0) {
      console.log(`   ℹ️  Container is empty, skipping`);
      return { success: true, migrated: 0, failed: 0, skipped: 0 };
    }

    let migrated = 0;
    let failed = 0;
    let skipped = 0;

    // Process in batches
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(documents.length / BATCH_SIZE);

      console.log(`   🔄 Processing batch ${batchNum}/${totalBatches} (${batch.length} docs)...`);

      // Process batch in parallel
      const results = await Promise.allSettled(
        batch.map(async (doc) => {
          try {
            // Remove Cosmos metadata fields
            const cleanDoc = { ...doc };
            delete cleanDoc._rid;
            delete cleanDoc._self;
            delete cleanDoc._etag;
            delete cleanDoc._attachments;
            delete cleanDoc._ts;

            // Upsert to destination
            await destContainer.items.upsert(cleanDoc);
            return { success: true };
          } catch (error) {
            console.error(`      ❌ Failed to migrate document ${doc.id}:`, error.message);
            return { success: false, error, docId: doc.id };
          }
        })
      );

      // Count results
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
          migrated++;
        } else {
          failed++;
        }
      });

      // Add delay between batches to avoid throttling
      if (i + BATCH_SIZE < documents.length) {
        await delay(100);
      }
    }

    console.log(`   ✅ Migration complete: ${migrated} migrated, ${failed} failed, ${skipped} skipped`);

    return { success: failed === 0, migrated, failed, skipped };
  } catch (error) {
    console.error(`   ❌ Error migrating container:`, error.message);
    return { success: false, migrated: 0, failed: 0, skipped: 0, error };
  }
}

async function verifyMigration(sourceContainer, destContainer, containerName) {
  try {
    const { resources: sourceDocs } = await sourceContainer.items.readAll().fetchAll();
    const { resources: destDocs } = await destContainer.items.readAll().fetchAll();

    const sourceCount = sourceDocs.length;
    const destCount = destDocs.length;

    if (sourceCount === destCount) {
      console.log(`   ✅ Verification passed: ${destCount} documents in both source and destination`);
      return true;
    } else {
      console.log(`   ⚠️  Count mismatch: Source has ${sourceCount}, Destination has ${destCount}`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Verification failed:`, error.message);
    return false;
  }
}

async function migrateCosmosData() {
  // Validate environment variables
  const oldEndpoint = process.env.OLD_COSMOS_ENDPOINT;
  const oldKey = process.env.OLD_COSMOS_KEY;
  const newEndpoint = process.env.NEW_COSMOS_ENDPOINT;
  const newKey = process.env.NEW_COSMOS_KEY;

  if (!oldEndpoint || !oldKey || !newEndpoint || !newKey) {
    console.error('❌ Error: All environment variables are required:');
    console.error('   - OLD_COSMOS_ENDPOINT');
    console.error('   - OLD_COSMOS_KEY');
    console.error('   - NEW_COSMOS_ENDPOINT');
    console.error('   - NEW_COSMOS_KEY');
    process.exit(1);
  }

  console.log('🚀 Starting Cosmos DB migration...');
  console.log('');
  console.log('📍 Source:');
  console.log(`   Endpoint: ${oldEndpoint}`);
  console.log(`   Database: ${DATABASE_NAME}`);
  console.log('');
  console.log('📍 Destination:');
  console.log(`   Endpoint: ${newEndpoint}`);
  console.log(`   Database: ${DATABASE_NAME}`);
  console.log('');
  console.log(`📂 Containers to migrate: ${CONTAINERS.length}`);
  console.log('');

  // Initialize Cosmos clients
  const oldClient = new CosmosClient({ endpoint: oldEndpoint, key: oldKey });
  const newClient = new CosmosClient({ endpoint: newEndpoint, key: newKey });

  const oldDatabase = oldClient.database(DATABASE_NAME);
  const newDatabase = newClient.database(DATABASE_NAME);

  // Migration report
  const report = {
    startTime: new Date().toISOString(),
    source: oldEndpoint,
    destination: newEndpoint,
    containers: {},
    totalMigrated: 0,
    totalFailed: 0,
    totalSkipped: 0,
    success: true
  };

  // Migrate each container
  for (const containerConfig of CONTAINERS) {
    const containerName = containerConfig.name;
    
    try {
      const sourceContainer = oldDatabase.container(containerName);
      const destContainer = newDatabase.container(containerName);

      // Migrate
      const result = await migrateContainer(sourceContainer, destContainer, containerName);
      report.containers[containerName] = result;
      report.totalMigrated += result.migrated;
      report.totalFailed += result.failed;
      report.totalSkipped += result.skipped;

      if (!result.success) {
        report.success = false;
      }

      // Verify
      if (result.success && result.migrated > 0) {
        console.log(`   🔍 Verifying migration...`);
        const verified = await verifyMigration(sourceContainer, destContainer, containerName);
        report.containers[containerName].verified = verified;
      }

    } catch (error) {
      if (error.code === 404) {
        console.log(`\n📦 Container: ${containerName}`);
        console.log(`   ⚠️  Container not found in source database, skipping`);
        report.containers[containerName] = { 
          success: true, 
          migrated: 0, 
          failed: 0, 
          skipped: 0,
          notFound: true 
        };
      } else {
        console.error(`\n📦 Container: ${containerName}`);
        console.error(`   ❌ Error:`, error.message);
        report.containers[containerName] = { 
          success: false, 
          migrated: 0, 
          failed: 0, 
          skipped: 0,
          error: error.message 
        };
        report.success = false;
      }
    }
  }

  report.endTime = new Date().toISOString();

  // Save migration report
  const timestamp = new Date().toISOString().split('T')[0];
  const reportDir = path.join(process.cwd(), 'backups', `migration-${timestamp}`);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportFile = path.join(reportDir, 'migration-report.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log('');
  console.log(`✅ Total documents migrated: ${report.totalMigrated}`);
  console.log(`❌ Total documents failed: ${report.totalFailed}`);
  console.log(`⏭️  Total documents skipped: ${report.totalSkipped}`);
  console.log('');
  console.log('📋 Per-container results:');
  Object.entries(report.containers).forEach(([name, result]) => {
    if (result.notFound) {
      console.log(`   - ${name}: Not found in source`);
    } else {
      const status = result.success ? '✅' : '❌';
      const verified = result.verified ? '✓ verified' : '';
      console.log(`   ${status} ${name}: ${result.migrated} migrated, ${result.failed} failed ${verified}`);
    }
  });
  console.log('');
  console.log(`📄 Report saved to: ${reportFile}`);
  console.log('');

  if (report.success) {
    console.log('🎉 Migration completed successfully!');
  } else {
    console.log('⚠️  Migration completed with errors. Please review the report.');
  }

  return report;
}

// Run the migration
if (require.main === module) {
  migrateCosmosData()
    .then((report) => {
      process.exit(report.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateCosmosData };
