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
  const managerId = context.bindingData.managerId;

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

  if (!managerId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'Manager ID is required' }),
      headers
    };
    return;
  }

  const { mission } = req.body || {};

  if (mission === undefined) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'Mission statement is required' }),
      headers
    };
    return;
  }

  // Check if Cosmos DB is configured
  if (!teamsContainer) {
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        error: 'Database not configured', 
        details: 'COSMOS_ENDPOINT and COSMOS_KEY environment variables are required' 
      }),
      headers
    };
    return;
  }

  try {
    // Find the team relationship for this manager
    const teamQuery = {
      query: 'SELECT * FROM c WHERE c.type = @type AND c.managerId = @managerId',
      parameters: [
        { name: '@type', value: 'team_relationship' },
        { name: '@managerId', value: managerId }
      ]
    };

    const { resources: teams } = await teamsContainer.items.query(teamQuery).fetchAll();
    
    if (teams.length === 0) {
      context.res = {
        status: 404,
        body: JSON.stringify({
          error: 'No team found for this manager',
          managerId: managerId
        }),
        headers
      };
      return;
    }

    const team = teams[0];

    // Update team with mission statement
    const updatedTeam = {
      ...team,
      mission: mission.trim(),
      lastModified: new Date().toISOString()
    };

    await teamsContainer.item(team.id, team.managerId).replace(updatedTeam);

    context.log(`✅ Successfully updated team mission for manager ${managerId}`);

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        data: {
          managerId: managerId,
          mission: updatedTeam.mission,
          teamName: updatedTeam.teamName,
          lastModified: updatedTeam.lastModified
        }
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error updating team mission:', error);
    
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to update team mission',
        details: error.message,
        managerId: managerId,
        timestamp: new Date().toISOString()
      }),
      headers
    };
  }
};

