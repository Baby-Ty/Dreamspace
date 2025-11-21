// Fix connects userId mismatch - migrate connects from GUID to email format
const { CosmosClient } = require('@azure/cosmos');
const fs = require('fs');

// Load settings
let endpoint, key;
if (fs.existsSync('./local.settings.json')) {
  const settings = JSON.parse(fs.readFileSync('./local.settings.json', 'utf8'));
  endpoint = settings.Values?.COSMOS_ENDPOINT || process.env.COSMOS_ENDPOINT;
  key = settings.Values?.COSMOS_KEY || process.env.COSMOS_KEY;
} else {
  endpoint = process.env.COSMOS_ENDPOINT;
  key = process.env.COSMOS_KEY;
}

if (!endpoint || !key) {
  console.error('❌ COSMOS_ENDPOINT and COSMOS_KEY are required');
  console.error('Set them in local.settings.json or environment variables');
  process.exit(1);
}

const GUID_USERID = 'af103e6b-2c5d-4d9a-b080-227f08d33e73';
const EMAIL_USERID = 'Tyler.Stewart@netsurit.com';

async function fixConnectsUserId() {
  console.log('🔧 Fixing connects userId mismatch in Cosmos DB...\n');
  
  const client = new CosmosClient({ endpoint, key });
  const database = client.database('dreamspace');
  const connectsContainer = database.container('connects');
  
  // Find all connects with GUID userId
  console.log(`📦 Looking for connects with userId: ${GUID_USERID}`);
  const { resources: connects } = await connectsContainer.items
    .query({
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: GUID_USERID }]
    })
    .fetchAll();
  
  console.log(`Found ${connects.length} connects to migrate\n`);
  
  if (connects.length === 0) {
    console.log('✅ No connects to migrate!');
    return;
  }
  
  // Update each connect
  for (const connect of connects) {
    console.log(`  Migrating connect: ${connect.id} (with ${connect.withWhom || 'unknown'})`);
    
    // Delete old connect (with GUID partition key)
    try {
      await connectsContainer.item(connect.id, GUID_USERID).delete();
      console.log(`    ✅ Deleted old connect`);
    } catch (err) {
      console.log(`    ⚠️  Could not delete old connect: ${err.message}`);
    }
    
    // Create new connect with email partition key
    const { _rid, _self, _etag, _attachments, _ts, ...cleanConnect } = connect;
    const updatedConnect = {
      ...cleanConnect,
      userId: EMAIL_USERID
    };
    
    try {
      await connectsContainer.items.create(updatedConnect);
      console.log(`    ✅ Created connect with userId: ${EMAIL_USERID}`);
    } catch (err) {
      console.log(`    ❌ Failed to create connect: ${err.message}`);
    }
  }
  
  console.log(`\n✅ Migration complete! ${connects.length} connects migrated`);
}

fixConnectsUserId().catch(console.error);


