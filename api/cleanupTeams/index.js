const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos client only if environment variables are present
let client, database, teamsContainer;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  teamsContainer = database.container('teams');
}

module.exports = async function (context, req) {
  // Set CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  // Check if Cosmos DB is configured
  if (!teamsContainer) {
    context.res = {
      status: 500,
      body: JSON.stringify({ error: 'Database not configured' }),
      headers
    };
    return;
  }

  try {
    context.log('🧹 Starting team cleanup...');
    
    // Query all team relationships
    const query = {
      query: 'SELECT * FROM c WHERE c.type = @type',
      parameters: [
        { name: '@type', value: 'team_relationship' }
      ]
    };

    const { resources: teams } = await teamsContainer.items.query(query).fetchAll();
    
    context.log(`Found ${teams.length} team relationships to review`);

    const results = [];
    let deletedCount = 0;
    let updatedCount = 0;

    for (const team of teams) {
      try {
        // Delete teams with invalid manager IDs (non-string UUIDs or empty)
        if (!team.managerId || 
            team.managerId === '' || 
            (typeof team.managerId === 'number' && team.managerId < 100) || // Old test data
            team.managerId === 19) { // Specific test data
          
          await teamsContainer.item(team.id, team.managerId || 'empty').delete();
          deletedCount++;
          results.push({
            id: team.id,
            teamName: team.teamName,
            managerId: team.managerId,
            action: 'deleted',
            reason: 'Invalid manager ID'
          });
          context.log(`Deleted team ${team.id} with invalid manager ID: ${team.managerId}`);
        
        } else if (team.managerId === 'af103e6b-2c5d-4d9a-b080-227f08d33e73' && team.teamName === 'Development Team') {
          // This is Tyler's team that was created with the bug - it should be valid now
          results.push({
            id: team.id,
            teamName: team.teamName,
            managerId: team.managerId,
            action: 'kept',
            reason: 'Valid team relationship'
          });
          
        } else if (team.managerId && typeof team.managerId === 'string' && team.managerId.length > 10) {
          // Looks like a valid UUID
          results.push({
            id: team.id,
            teamName: team.teamName,
            managerId: team.managerId,
            action: 'kept',
            reason: 'Valid UUID manager ID'
          });
        } else {
          results.push({
            id: team.id,
            teamName: team.teamName,
            managerId: team.managerId,
            action: 'review_needed',
            reason: 'Uncertain validity'
          });
        }
      } catch (error) {
        context.log.error(`Error processing team ${team.id}:`, error);
        results.push({
          id: team.id,
          action: 'error',
          error: error.message
        });
      }
    }

    context.log(`✅ Team cleanup complete: ${deletedCount} deleted, ${updatedCount} updated`);

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        message: `Team cleanup completed: ${deletedCount} deleted, ${updatedCount} updated`,
        deletedCount,
        updatedCount,
        totalProcessed: teams.length,
        results
      }),
      headers
    };

  } catch (error) {
    context.log.error('Error cleaning up teams:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
      headers
    };
  }
};
