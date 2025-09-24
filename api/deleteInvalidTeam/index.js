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

  const teamName = context.bindingData.teamName;

  if (!teamName) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'Team name is required' }),
      headers
    };
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
    context.log(`🗑️ Looking for team with name: ${teamName}`);
    
    // Query for teams with this name and empty manager ID
    const query = {
      query: 'SELECT * FROM c WHERE c.type = @type AND c.teamName = @teamName AND (c.managerId = @emptyId OR NOT IS_DEFINED(c.managerId))',
      parameters: [
        { name: '@type', value: 'team_relationship' },
        { name: '@teamName', value: teamName },
        { name: '@emptyId', value: '' }
      ]
    };

    const { resources: teams } = await teamsContainer.items.query(query).fetchAll();
    
    if (teams.length === 0) {
      context.res = {
        status: 404,
        body: JSON.stringify({ 
          error: 'No invalid teams found with this name',
          teamName 
        }),
        headers
      };
      return;
    }

    const results = [];
    
    for (const team of teams) {
      try {
        await teamsContainer.item(team.id, team.managerId || 'empty').delete();
        results.push({
          id: team.id,
          teamName: team.teamName,
          managerId: team.managerId,
          status: 'deleted'
        });
        context.log(`Deleted invalid team: ${team.id} - ${team.teamName}`);
      } catch (error) {
        results.push({
          id: team.id,
          teamName: team.teamName,
          status: 'error',
          error: error.message
        });
      }
    }

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        message: `Deleted ${results.filter(r => r.status === 'deleted').length} invalid teams named '${teamName}'`,
        results
      }),
      headers
    };

  } catch (error) {
    context.log.error('Error deleting invalid team:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
      headers
    };
  }
};
