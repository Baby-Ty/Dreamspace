/**
 * Cosmos DB Export Script
 * Exports all data from existing Cosmos DB for backup before migration
 * 
 * Usage: node scripts/exportCosmosData.js
 * 
 * Requires environment variables:
 * - COSMOS_ENDPOINT: Current Cosmos DB endpoint
 * - COSMOS_KEY: Current Cosmos DB key
 */

const { CosmosClient } = require('@azure/cosmos');
const fs = require('fs');
const path = require('path');

// Container configuration from cosmosProvider.js
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

async function exportCosmosData() {
  // Validate environment variables
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;

  if (!endpoint || !key) {
    console.error('❌ Error: COSMOS_ENDPOINT and COSMOS_KEY environment variables are required');
    console.error('   Set them in your environment or use:');
    console.error('   COSMOS_ENDPOINT=https://... COSMOS_KEY=... node scripts/exportCosmosData.js');
    process.exit(1);
  }

  console.log('🚀 Starting Cosmos DB export...');
  console.log(`📍 Endpoint: ${endpoint}`);
  console.log(`📦 Database: ${DATABASE_NAME}`);
  console.log(`📂 Containers: ${CONTAINERS.length}`);
  console.log('');

  // Create backup directory with timestamp
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const backupDir = path.join(process.cwd(), 'backups', `cosmos-${timestamp}`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`📁 Backup directory: ${backupDir}`);
  console.log('');

  // Initialize Cosmos client
  const client = new CosmosClient({ endpoint, key });
  const database = client.database(DATABASE_NAME);

  // Export metadata
  const metadata = {
    exportDate: new Date().toISOString(),
    endpoint: endpoint,
    database: DATABASE_NAME,
    containers: CONTAINERS,
    totalDocuments: 0,
    containerCounts: {}
  };

  // Export each container
  for (const containerConfig of CONTAINERS) {
    try {
      console.log(`📦 Exporting container: ${containerConfig.name}`);
      const container = database.container(containerConfig.name);

      // Query all documents
      const { resources: documents } = await container.items
        .readAll()
        .fetchAll();

      const count = documents.length;
      metadata.containerCounts[containerConfig.name] = count;
      metadata.totalDocuments += count;

      // Save to file
      const filename = path.join(backupDir, `${containerConfig.name}.json`);
      fs.writeFileSync(
        filename,
        JSON.stringify(documents, null, 2),
        'utf8'
      );

      console.log(`   ✅ Exported ${count} documents to ${containerConfig.name}.json`);
    } catch (error) {
      if (error.code === 404) {
        console.log(`   ⚠️  Container '${containerConfig.name}' not found (may not exist yet)`);
        metadata.containerCounts[containerConfig.name] = 0;
      } else {
        console.error(`   ❌ Error exporting ${containerConfig.name}:`, error.message);
        throw error;
      }
    }
  }

  // Save metadata
  const metadataFile = path.join(backupDir, '_metadata.json');
  fs.writeFileSync(
    metadataFile,
    JSON.stringify(metadata, null, 2),
    'utf8'
  );

  console.log('');
  console.log('✅ Export complete!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   Total documents: ${metadata.totalDocuments}`);
  console.log('   Documents per container:');
  Object.entries(metadata.containerCounts).forEach(([name, count]) => {
    console.log(`      - ${name}: ${count}`);
  });
  console.log('');
  console.log(`📁 Backup location: ${backupDir}`);
  console.log('');

  return metadata;
}

// Run the export
if (require.main === module) {
  exportCosmosData()
    .then(() => {
      console.log('🎉 Backup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Export failed:', error);
      process.exit(1);
    });
}

module.exports = { exportCosmosData };
