/**
 * Check and Restore Dreams Script
 * 
 * Checks current state of cosmos-dreamspace-live and optionally restores from backup
 * 
 * Usage: 
 *   node scripts/checkAndRestoreDreams.cjs check    - Check current state
 *   node scripts/checkAndRestoreDreams.cjs restore  - Restore from backup
 */

const { CosmosClient } = require('@azure/cosmos');
const fs = require('fs');
const path = require('path');

// Configuration - using cosmos-dreamspace-live
const COSMOS_ENDPOINT = 'https://cosmos-dreamspace-live.documents.azure.com:443/';
const COSMOS_KEY = process.env.COSMOS_KEY;
if (!COSMOS_KEY) {
  console.error('❌ Error: COSMOS_KEY environment variable is required');
  process.exit(1);
}
const DATABASE_NAME = 'dreamspace';
const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'cosmos-2026-01-18');

async function checkDatabase() {
  console.log('\n🔍 Checking cosmos-dreamspace-live database state...\n');
  
  const client = new CosmosClient({
    endpoint: COSMOS_ENDPOINT,
    key: COSMOS_KEY
  });
  
  const database = client.database(DATABASE_NAME);
  
  const containers = ['users', 'dreams', 'connects', 'scoring', 'teams', 'currentWeek', 'pastWeeks'];
  
  for (const containerName of containers) {
    try {
      const container = database.container(containerName);
      const { resources } = await container.items.readAll().fetchAll();
      console.log(`📦 ${containerName}: ${resources.length} documents`);
      
      // For dreams, show details
      if (containerName === 'dreams') {
        console.log('   Dreams by user:');
        const byUser = {};
        resources.forEach(doc => {
          const userId = doc.userId || doc.id;
          byUser[userId] = (doc.dreams || []).length;
        });
        Object.entries(byUser).forEach(([user, count]) => {
          console.log(`     - ${user}: ${count} dreams`);
        });
      }
    } catch (error) {
      console.log(`❌ ${containerName}: Error - ${error.message}`);
    }
  }
}

async function restoreFromBackup() {
  console.log('\n🔄 Restoring from backup to cosmos-dreamspace-live...\n');
  
  const client = new CosmosClient({
    endpoint: COSMOS_ENDPOINT,
    key: COSMOS_KEY
  });
  
  const database = client.database(DATABASE_NAME);
  
  // Read backup file
  const dreamsBackupPath = path.join(BACKUP_DIR, 'dreams.json');
  if (!fs.existsSync(dreamsBackupPath)) {
    console.log('❌ Backup file not found:', dreamsBackupPath);
    return;
  }
  
  const backupData = JSON.parse(fs.readFileSync(dreamsBackupPath, 'utf8'));
  console.log(`📂 Found ${backupData.length} dream documents in backup\n`);
  
  const container = database.container('dreams');
  
  let restored = 0;
  let failed = 0;
  
  for (const doc of backupData) {
    try {
      // Remove Cosmos metadata
      const cleanDoc = { ...doc };
      delete cleanDoc._rid;
      delete cleanDoc._self;
      delete cleanDoc._etag;
      delete cleanDoc._attachments;
      delete cleanDoc._ts;
      
      await container.items.upsert(cleanDoc);
      console.log(`✅ Restored: ${doc.userId} (${(doc.dreams || []).length} dreams)`);
      restored++;
    } catch (error) {
      console.log(`❌ Failed: ${doc.userId} - ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Restore complete: ${restored} restored, ${failed} failed`);
}

async function restoreAllContainers() {
  console.log('\n🔄 Restoring ALL containers from backup to cosmos-dreamspace-live...\n');
  
  const client = new CosmosClient({
    endpoint: COSMOS_ENDPOINT,
    key: COSMOS_KEY
  });
  
  const database = client.database(DATABASE_NAME);
  
  const containers = [
    { name: 'users', partitionKey: 'userId' },
    { name: 'dreams', partitionKey: 'userId' },
    { name: 'connects', partitionKey: 'userId' },
    { name: 'scoring', partitionKey: 'userId' },
    { name: 'teams', partitionKey: 'managerId' },
    { name: 'currentWeek', partitionKey: 'userId' },
    { name: 'pastWeeks', partitionKey: 'userId' },
    { name: 'meeting_attendance', partitionKey: 'teamId' },
    { name: 'prompts', partitionKey: 'partitionKey' }
  ];
  
  for (const { name } of containers) {
    const backupPath = path.join(BACKUP_DIR, `${name}.json`);
    if (!fs.existsSync(backupPath)) {
      console.log(`⚠️  No backup for ${name}, skipping`);
      continue;
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    console.log(`\n📦 Restoring ${name}: ${backupData.length} documents`);
    
    const container = database.container(name);
    
    for (const doc of backupData) {
      try {
        const cleanDoc = { ...doc };
        delete cleanDoc._rid;
        delete cleanDoc._self;
        delete cleanDoc._etag;
        delete cleanDoc._attachments;
        delete cleanDoc._ts;
        
        await container.items.upsert(cleanDoc);
        process.stdout.write('.');
      } catch (error) {
        process.stdout.write('x');
      }
    }
    console.log(' Done');
  }
  
  console.log('\n✅ Full restore complete!');
}

// Main
const command = process.argv[2];

if (command === 'check') {
  checkDatabase().catch(console.error);
} else if (command === 'restore') {
  restoreFromBackup().catch(console.error);
} else if (command === 'restore-all') {
  restoreAllContainers().catch(console.error);
} else {
  console.log('Usage:');
  console.log('  node scripts/checkAndRestoreDreams.cjs check       - Check current database state');
  console.log('  node scripts/checkAndRestoreDreams.cjs restore     - Restore dreams only from backup');
  console.log('  node scripts/checkAndRestoreDreams.cjs restore-all - Restore all containers from backup');
}
