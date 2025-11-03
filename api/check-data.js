// Quick script to check Cosmos DB data
const { CosmosClient } = require('@azure/cosmos');
const fs = require('fs');

const settings = JSON.parse(fs.readFileSync('./local.settings.json', 'utf8'));
const endpoint = settings.Values.COSMOS_ENDPOINT;
const key = settings.Values.COSMOS_KEY;

async function checkData() {
  const client = new CosmosClient({ endpoint, key });
  const database = client.database('dreamspace');
  
  console.log('\n=== USERS CONTAINER ===');
  const usersContainer = database.container('users');
  const { resources: users } = await usersContainer.items
    .query('SELECT c.id, c.name, c.dataStructureVersion FROM c')
    .fetchAll();
  
  console.log(`Found ${users.length} users:`);
  users.forEach(u => console.log(`  - ${u.id} (${u.name}) [v${u.dataStructureVersion || 1}]`));
  
  console.log('\n=== ITEMS CONTAINER ===');
  const itemsContainer = database.container('items');
  const { resources: items } = await itemsContainer.items
    .query('SELECT c.id, c.userId, c.type, c.title FROM c')
    .fetchAll();
  
  console.log(`Found ${items.length} items:`);
  items.forEach(i => console.log(`  - [${i.type}] ${i.title || i.id} (userId: ${i.userId})`));
  
  console.log('\n=== CHECKING SPECIFIC USERS ===');
  const emailUser = 'Tyler.Stewart@netsurit.com';
  const guidUser = 'af103e6b-2c5d-4d9a-b080-227f08d33e73';
  
  const { resources: emailItems } = await itemsContainer.items
    .query({
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: emailUser }]
    })
    .fetchAll();
  console.log(`Items for ${emailUser}: ${emailItems.length}`);
  
  const { resources: guidItems } = await itemsContainer.items
    .query({
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: guidUser }]
    })
    .fetchAll();
  console.log(`Items for ${guidUser}: ${guidItems.length}`);
  guidItems.forEach(i => console.log(`  - [${i.type}] ${i.title || i.id}`));
}

checkData().catch(console.error);

