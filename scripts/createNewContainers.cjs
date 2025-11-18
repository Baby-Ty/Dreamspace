/**
 * Script to create currentWeek and pastWeeks containers in Cosmos DB
 * Run this ONCE to initialize the new simplified weeks system
 * 
 * Usage:
 *   node scripts/createNewContainers.js
 * 
 * Prerequisites:
 *   - COSMOS_ENDPOINT and COSMOS_KEY must be set in environment
 *   - Run from project root
 */

const { CosmosClient } = require('@azure/cosmos');

async function createContainers() {
  console.log('🚀 Starting container creation...\n');

  // Get connection info from environment
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;

  if (!endpoint || !key) {
    console.error('❌ Error: COSMOS_ENDPOINT and COSMOS_KEY environment variables must be set');
    console.error('   Set them in your environment or use:');
    console.error('   $env:COSMOS_ENDPOINT="your-endpoint" (PowerShell)');
    console.error('   $env:COSMOS_KEY="your-key"');
    process.exit(1);
  }

  try {
    // Initialize client
    const client = new CosmosClient({ endpoint, key });
    const database = client.database('dreamspace');

    console.log(`📦 Connected to database: dreamspace`);
    console.log(`   Endpoint: ${endpoint}\n`);

    // Container definitions
    const containersToCreate = [
      {
        id: 'currentWeek',
        partitionKey: '/userId',
        description: 'Active goals for current week only (one doc per user)'
      },
      {
        id: 'pastWeeks',
        partitionKey: '/userId',
        description: 'Lightweight historical summaries of past weeks (one doc per user)'
      }
    ];

    // Create each container
    for (const containerDef of containersToCreate) {
      console.log(`📝 Creating container: ${containerDef.id}`);
      console.log(`   Partition Key: ${containerDef.partitionKey}`);
      console.log(`   Description: ${containerDef.description}`);

      try {
        const { container } = await database.containers.createIfNotExists({
          id: containerDef.id,
          partitionKey: containerDef.partitionKey,
          throughput: 400 // Minimum RU/s for manual throughput
        });

        console.log(`✅ Container "${containerDef.id}" created successfully!\n`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`ℹ️  Container "${containerDef.id}" already exists\n`);
        } else {
          throw error;
        }
      }
    }

    console.log('✨ All containers created successfully!');
    console.log('\n📊 Summary:');
    console.log('   - currentWeek: Stores active week goals for each user');
    console.log('   - pastWeeks: Stores historical week summaries');
    console.log('\n🎉 You can now use the simplified weeks system!');

  } catch (error) {
    console.error('\n❌ Error creating containers:', error.message);
    console.error('   Details:', error);
    process.exit(1);
  }
}

// Run the script
createContainers();

