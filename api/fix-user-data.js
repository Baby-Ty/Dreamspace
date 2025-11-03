// Script to fix user data structure in Cosmos DB
// This ensures the user profile is set to v2 so items load properly

const { CosmosClient } = require('@azure/cosmos');
require('dotenv').config({ path: './local.settings.json' });

const endpoint = process.env.COSMOS_ENDPOINT || process.env.Values_COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY || process.env.Values_COSMOS_KEY;

if (!endpoint || !key) {
  console.error('❌ COSMOS_ENDPOINT or COSMOS_KEY not found in environment');
  console.log('Trying to read from local.settings.json...');
  
  const fs = require('fs');
  const settings = JSON.parse(fs.readFileSync('./local.settings.json', 'utf8'));
  const cosmosEndpoint = settings.Values.COSMOS_ENDPOINT;
  const cosmosKey = settings.Values.COSMOS_KEY;
  
  if (!cosmosEndpoint || !cosmosKey) {
    console.error('❌ Could not find Cosmos DB credentials');
    process.exit(1);
  }
  
  fixUserData(cosmosEndpoint, cosmosKey);
} else {
  fixUserData(endpoint, key);
}

async function fixUserData(endpoint, key) {
  const userId = process.argv[2] || 'Tyler.Stewart@netsurit.com';
  
  console.log('🔧 Fixing user data for:', userId);
  console.log('📡 Connecting to:', endpoint);
  
  const client = new CosmosClient({ endpoint, key });
  const database = client.database('dreamspace');
  const usersContainer = database.container('users');
  const itemsContainer = database.container('items');
  
  try {
    // Read current profile
    console.log('\n📖 Reading user profile...');
    const { resource: profile } = await usersContainer.item(userId, userId).read();
    
    console.log('Current profile:');
    console.log('  - ID:', profile.id);
    console.log('  - Name:', profile.name);
    console.log('  - Data Structure Version:', profile.dataStructureVersion || 'not set');
    console.log('  - Has dreamBook array:', !!profile.dreamBook);
    console.log('  - DreamBook length:', profile.dreamBook?.length || 0);
    
    // Check items in items container
    console.log('\n📦 Checking items container...');
    const { resources: items } = await itemsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.userId = @userId',
        parameters: [{ name: '@userId', value: userId }]
      })
      .fetchAll();
    
    console.log(`Found ${items.length} items:`);
    const itemsByType = {};
    items.forEach(item => {
      itemsByType[item.type] = (itemsByType[item.type] || 0) + 1;
    });
    Object.entries(itemsByType).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });
    
    // Fix: Update profile to v2 and remove arrays
    console.log('\n🔧 Updating profile to v2 structure...');
    
    const {
      dreamBook,
      weeklyGoals,
      scoringHistory,
      connects,
      careerGoals,
      developmentPlan,
      _rid,
      _self,
      _etag,
      _attachments,
      _ts,
      ...cleanProfile
    } = profile;
    
    const updatedProfile = {
      ...cleanProfile,
      id: userId,
      userId: userId,
      dataStructureVersion: 2,
      lastUpdated: new Date().toISOString()
    };
    
    await usersContainer.items.upsert(updatedProfile);
    console.log('✅ Profile updated to v2');
    
    // If profile had arrays but items container is empty, migrate them
    if ((dreamBook?.length || weeklyGoals?.length) && items.length === 0) {
      console.log('\n📦 Migrating data from profile arrays to items container...');
      
      const timestamp = Date.now();
      let migratedCount = 0;
      
      // Migrate dreams
      if (dreamBook && Array.isArray(dreamBook)) {
        for (const [index, dream] of dreamBook.entries()) {
          const document = {
            id: dream.id || `dream_${userId}_${timestamp}_${index}`,
            userId: userId,
            type: 'dream',
            ...dream,
            createdAt: dream.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await itemsContainer.items.upsert(document);
          migratedCount++;
        }
        console.log(`  ✅ Migrated ${dreamBook.length} dreams`);
      }
      
      // Migrate weekly goals
      if (weeklyGoals && Array.isArray(weeklyGoals)) {
        for (const [index, goal] of weeklyGoals.entries()) {
          const document = {
            id: goal.id || `goal_${userId}_${timestamp}_${index}`,
            userId: userId,
            type: goal.type || 'weekly_goal',
            ...goal,
            createdAt: goal.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await itemsContainer.items.upsert(document);
          migratedCount++;
        }
        console.log(`  ✅ Migrated ${weeklyGoals.length} weekly goals`);
      }
      
      console.log(`\n✅ Migration complete: ${migratedCount} items migrated`);
    }
    
    // Final verification
    console.log('\n✅ FIX COMPLETE!');
    console.log('\n📊 Summary:');
    console.log('  - Profile: v2 ✓');
    console.log(`  - Items: ${items.length + (dreamBook?.length || 0) + (weeklyGoals?.length || 0)} total`);
    console.log('\n🔄 Now refresh your browser and log in again.');
    console.log('   Your dreams should now appear!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

