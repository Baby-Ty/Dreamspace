#!/usr/bin/env node

/**
 * Cosmos DB Size Checker
 * Reports database size, document counts, and storage estimates
 * 
 * Usage: node scripts/checkCosmosSize.cjs
 * 
 * Requires environment variables:
 * - COSMOS_ENDPOINT: Cosmos DB endpoint
 * - COSMOS_KEY: Cosmos DB key
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

/**
 * Calculate size of a document in bytes (approximate)
 */
function getDocumentSize(doc) {
  return JSON.stringify(doc).length;
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get container statistics
 */
async function getContainerStats(container, containerName) {
  try {
    // Count documents
    const { resources: allDocs } = await container.items.readAll().fetchAll();
    const docCount = allDocs.length;

    if (docCount === 0) {
      return {
        name: containerName,
        docCount: 0,
        estimatedSize: 0,
        avgDocSize: 0
      };
    }

    // Calculate total size and average
    let totalSize = 0;
    const sampleSize = Math.min(100, docCount); // Sample up to 100 docs
    
    for (let i = 0; i < sampleSize; i++) {
      totalSize += getDocumentSize(allDocs[i]);
    }

    const avgDocSize = totalSize / sampleSize;
    const estimatedSize = avgDocSize * docCount;

    return {
      name: containerName,
      docCount,
      estimatedSize,
      avgDocSize
    };
  } catch (error) {
    if (error.code === 404) {
      return {
        name: containerName,
        docCount: 0,
        estimatedSize: 0,
        avgDocSize: 0,
        error: 'Container not found'
      };
    }
    throw error;
  }
}

/**
 * Get database statistics
 */
async function checkCosmosSize() {
  // Validate environment variables
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;

  if (!endpoint || !key) {
    console.error('❌ Error: Environment variables are required:');
    console.error('   - COSMOS_ENDPOINT');
    console.error('   - COSMOS_KEY');
    console.error('');
    console.error('You can set these in your .env file or export them:');
    console.error('   export COSMOS_ENDPOINT="https://your-account.documents.azure.com:443/"');
    console.error('   export COSMOS_KEY="your-key"');
    process.exit(1);
  }

  console.log('🔍 Checking Cosmos DB size...');
  console.log('');
  console.log('📍 Database:', DATABASE_NAME);
  console.log('📍 Endpoint:', endpoint.replace(/https?:\/\/([^.]+)\..*/, '$1'));
  console.log('');

  // Initialize Cosmos client
  const client = new CosmosClient({ endpoint, key });
  const database = client.database(DATABASE_NAME);

  // Verify database exists
  try {
    await database.read();
  } catch (error) {
    if (error.code === 404) {
      console.error('❌ Database not found:', DATABASE_NAME);
      process.exit(1);
    }
    throw error;
  }

  const stats = {
    timestamp: new Date().toISOString(),
    containers: {},
    totalDocs: 0,
    totalSize: 0
  };

  // Get stats for each container
  console.log('📦 Analyzing containers...\n');
  
  for (const containerConfig of CONTAINERS) {
    const containerName = containerConfig.name;
    const container = database.container(containerName);
    
    try {
      const containerStats = await getContainerStats(container, containerName);
      stats.containers[containerName] = containerStats;
      
      if (!containerStats.error) {
        stats.totalDocs += containerStats.docCount;
        stats.totalSize += containerStats.estimatedSize;
      }

      // Print container stats
      const icon = containerStats.error ? '⚠️' : '✓';
      const sizeStr = formatBytes(containerStats.estimatedSize);
      const avgSizeStr = containerStats.docCount > 0 
        ? formatBytes(containerStats.avgDocSize) 
        : 'N/A';
      
      console.log(`${icon} ${containerName.padEnd(25)} ${containerStats.docCount.toString().padStart(6)} docs  ${sizeStr.padStart(10)}  (avg: ${avgSizeStr})`);
      
      if (containerStats.error) {
        console.log(`   ${containerStats.error}`);
      }
    } catch (error) {
      console.error(`❌ Error analyzing ${containerName}:`, error.message);
      stats.containers[containerName] = {
        name: containerName,
        error: error.message
      };
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  console.log('');
  console.log(`Total Documents:     ${stats.totalDocs.toLocaleString()}`);
  console.log(`Estimated Size:      ${formatBytes(stats.totalSize)}`);
  console.log(`Containers:          ${Object.keys(stats.containers).length}`);
  console.log('');
  console.log(`Timestamp:           ${stats.timestamp}`);
  console.log('');

  // Note about accuracy
  console.log('ℹ️  Note: Size is estimated based on document samples.');
  console.log('   For exact storage metrics, check Azure Portal:');
  console.log('   portal.azure.com → cosmos-dreamspace-live → Metrics');
  console.log('');

  return stats;
}

// Run if called directly
if (require.main === module) {
  checkCosmosSize()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to check Cosmos DB size:', error);
      process.exit(1);
    });
}

module.exports = { checkCosmosSize };
