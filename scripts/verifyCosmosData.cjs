/**
 * Cosmos DB Verification Script
 * Verifies data integrity between old and new Cosmos DB after migration
 * 
 * Usage: node scripts/verifyCosmosData.js
 * 
 * Requires environment variables:
 * - OLD_COSMOS_ENDPOINT: Source Cosmos DB endpoint
 * - OLD_COSMOS_KEY: Source Cosmos DB key
 * - NEW_COSMOS_ENDPOINT: Destination Cosmos DB endpoint
 * - NEW_COSMOS_KEY: Destination Cosmos DB key
 */

const { CosmosClient } = require('@azure/cosmos');

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

async function verifyContainer(oldContainer, newContainer, containerName) {
  try {
    console.log(`\n📦 Verifying: ${containerName}`);

    // Get document counts
    const { resources: oldDocs } = await oldContainer.items.readAll().fetchAll();
    const { resources: newDocs } = await newContainer.items.readAll().fetchAll();

    const oldCount = oldDocs.length;
    const newCount = newDocs.length;

    console.log(`   Old DB: ${oldCount} documents`);
    console.log(`   New DB: ${newCount} documents`);

    if (oldCount === newCount) {
      console.log(`   ✅ Document counts match`);

      // Sample check: verify a few document IDs exist in both
      if (oldCount > 0) {
        const sampleSize = Math.min(5, oldCount);
        const oldIds = new Set(oldDocs.map(d => d.id));
        const newIds = new Set(newDocs.map(d => d.id));

        let missingCount = 0;
        for (let i = 0; i < sampleSize; i++) {
          const docId = oldDocs[i].id;
          if (!newIds.has(docId)) {
            console.log(`   ⚠️  Document ${docId} missing in new DB`);
            missingCount++;
          }
        }

        if (missingCount === 0) {
          console.log(`   ✅ Sample verification passed (${sampleSize} documents checked)`);
          return { success: true, oldCount, newCount, match: true };
        } else {
          console.log(`   ⚠️  ${missingCount} sample documents missing`);
          return { success: false, oldCount, newCount, match: false, missing: missingCount };
        }
      }

      return { success: true, oldCount, newCount, match: true };
    } else {
      console.log(`   ❌ Document count mismatch!`);
      const difference = Math.abs(oldCount - newCount);
      console.log(`   Difference: ${difference} documents`);
      return { success: false, oldCount, newCount, match: false, difference };
    }
  } catch (error) {
    console.error(`   ❌ Error verifying container:`, error.message);
    return { success: false, error: error.message };
  }
}

async function verifyCosmosData() {
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

  console.log('🔍 Starting Cosmos DB verification...');
  console.log('');
  console.log('📍 Old DB:', oldEndpoint);
  console.log('📍 New DB:', newEndpoint);
  console.log('');

  // Initialize Cosmos clients
  const oldClient = new CosmosClient({ endpoint: oldEndpoint, key: oldKey });
  const newClient = new CosmosClient({ endpoint: newEndpoint, key: newKey });

  const oldDatabase = oldClient.database(DATABASE_NAME);
  const newDatabase = newClient.database(DATABASE_NAME);

  const results = {
    timestamp: new Date().toISOString(),
    containers: {},
    totalOldDocs: 0,
    totalNewDocs: 0,
    allMatch: true
  };

  // Verify each container
  for (const containerConfig of CONTAINERS) {
    const containerName = containerConfig.name;

    try {
      const oldContainer = oldDatabase.container(containerName);
      const newContainer = newDatabase.container(containerName);

      const result = await verifyContainer(oldContainer, newContainer, containerName);
      results.containers[containerName] = result;

      if (result.oldCount !== undefined) {
        results.totalOldDocs += result.oldCount;
        results.totalNewDocs += result.newCount;
      }

      if (!result.success || !result.match) {
        results.allMatch = false;
      }
    } catch (error) {
      if (error.code === 404) {
        console.log(`\n📦 ${containerName}`);
        console.log(`   ⚠️  Container not found (may not exist in one or both databases)`);
        results.containers[containerName] = { 
          success: false, 
          notFound: true,
          error: 'Container not found'
        };
        results.allMatch = false;
      } else {
        console.error(`\n📦 ${containerName}`);
        console.error(`   ❌ Error:`, error.message);
        results.containers[containerName] = { 
          success: false, 
          error: error.message 
        };
        results.allMatch = false;
      }
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log('');
  console.log(`Total documents in OLD DB: ${results.totalOldDocs}`);
  console.log(`Total documents in NEW DB: ${results.totalNewDocs}`);
  console.log('');

  if (results.allMatch) {
    console.log('✅ ALL CONTAINERS VERIFIED SUCCESSFULLY!');
    console.log('');
    console.log('All document counts match between old and new databases.');
    console.log('Migration appears to be successful.');
  } else {
    console.log('⚠️  VERIFICATION ISSUES FOUND');
    console.log('');
    console.log('Issues detected:');
    Object.entries(results.containers).forEach(([name, result]) => {
      if (!result.success || !result.match) {
        console.log(`   - ${name}: ${result.error || 'Count mismatch'}`);
      }
    });
    console.log('');
    console.log('Please review the issues above and consider re-running the migration.');
  }

  console.log('');

  return results;
}

// Run verification
if (require.main === module) {
  verifyCosmosData()
    .then((results) => {
      process.exit(results.allMatch ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyCosmosData };
