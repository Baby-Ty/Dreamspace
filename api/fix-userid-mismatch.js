// Fix userId mismatch - migrate items from GUID to email
const { CosmosClient } = require('@azure/cosmos');
const fs = require('fs');

const settings = JSON.parse(fs.readFileSync('./local.settings.json', 'utf8'));
const endpoint = settings.Values.COSMOS_ENDPOINT;
const key = settings.Values.COSMOS_KEY;

const GUID_USERID = 'af103e6b-2c5d-4d9a-b080-227f08d33e73';
const EMAIL_USERID = 'Tyler.Stewart@netsurit.com';

async function fixUserIdMismatch() {
  console.log('🔧 Fixing userId mismatch in Cosmos DB...\n');
  
  const client = new CosmosClient({ endpoint, key });
  const database = client.database('dreamspace');
  const itemsContainer = database.container('items');
  
  // Find all items with GUID userId
  console.log(`📦 Looking for items with userId: ${GUID_USERID}`);
  const { resources: items } = await itemsContainer.items
    .query({
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: GUID_USERID }]
    })
    .fetchAll();
  
  console.log(`Found ${items.length} items to migrate\n`);
  
  if (items.length === 0) {
    console.log('✅ No items to migrate!');
    return;
  }
  
  // Update each item
  for (const item of items) {
    console.log(`  Updating ${item.type}: ${item.title || item.id}`);
    
    // Delete old item (with GUID partition key)
    try {
      await itemsContainer.item(item.id, GUID_USERID).delete();
    } catch (err) {
      console.log(`    ⚠️  Could not delete old item: ${err.message}`);
    }
    
    // Create new item with email partition key
    const updatedItem = {
      ...item,
      userId: EMAIL_USERID,
      _rid: undefined,
      _self: undefined,
      _etag: undefined,
      _attachments: undefined,
      _ts: undefined
    };
    
    await itemsContainer.items.create(updatedItem);
    console.log(`    ✅ Migrated to userId: ${EMAIL_USERID}`);
  }
  
  console.log(`\n✅ Migration complete! ${items.length} items updated`);
  console.log(`\n🔄 Now refresh your browser and your dreams should appear!`);
}

fixUserIdMismatch().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

