/**
 * Script to create meeting_attendance container in Cosmos DB
 * Run this ONCE to initialize the meeting attendance feature
 * 
 * Usage:
 *   node scripts/createMeetingAttendanceContainer.cjs
 * 
 * Prerequisites:
 *   - COSMOS_ENDPOINT and COSMOS_KEY must be set in environment
 *   - Run from project root
 */

const { CosmosClient } = require('@azure/cosmos');

async function createContainer() {
  console.log('🚀 Starting meeting_attendance container creation...\n');

  // Get connection info from environment
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;

  if (!endpoint || !key) {
    console.error('❌ Error: COSMOS_ENDPOINT and COSMOS_KEY environment variables must be set');
    console.error('   Set them in your environment or use:');
    console.error('   $env:COSMOS_ENDPOINT="your-endpoint" (PowerShell)');
    console.error('   $env:COSMOS_KEY="your-key"');
    console.error('   export COSMOS_ENDPOINT="your-endpoint" (Bash)');
    console.error('   export COSMOS_KEY="your-key"');
    process.exit(1);
  }

  try {
    // Initialize client
    const client = new CosmosClient({ endpoint, key });
    const database = client.database('dreamspace');

    console.log(`📦 Connected to database: dreamspace`);
    console.log(`   Endpoint: ${endpoint}\n`);

    // Container definition
    const containerDef = {
      id: 'meeting_attendance',
      partitionKey: '/teamId',
      description: 'Team meeting attendance records'
    };

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
      
      console.log('✨ Meeting Attendance Container Setup Complete!');
      console.log('\n📊 Container Details:');
      console.log('   - Name: meeting_attendance');
      console.log('   - Partition Key: /teamId (uses managerId from team data)');
      console.log('   - Throughput: 400 RU/s');
      console.log('\n📝 Usage:');
      console.log('   - Coaches can track meeting attendance for their teams');
      console.log('   - Each meeting record includes title, date, and attendee list');
      console.log('   - Data is partitioned by teamId for efficient queries');
      console.log('\n🎉 Meeting attendance feature is now ready to use!');

    } catch (error) {
      if (error.code === 409) {
        console.log(`ℹ️  Container "${containerDef.id}" already exists\n`);
        console.log('✅ Container is ready to use!');
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('\n❌ Error creating container:', error.message);
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
    if (error.details) {
      console.error(`   Details: ${error.details}`);
    }
    process.exit(1);
  }
}

// Run the script
createContainer();

