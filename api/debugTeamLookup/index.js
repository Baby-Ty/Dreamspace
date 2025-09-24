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

  const coachId = context.bindingData.coachId;

  if (!coachId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'Coach ID is required' }),
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
    context.log(`🔍 Debug: Looking for team with coach ID: ${coachId} (type: ${typeof coachId})`);
    
    // Try different query approaches
    const queries = [
      {
        name: 'Exact string match',
        query: 'SELECT * FROM c WHERE c.type = @type AND c.managerId = @managerId',
        parameters: [
          { name: '@type', value: 'team_relationship' },
          { name: '@managerId', value: coachId }
        ]
      },
      {
        name: 'All team relationships',
        query: 'SELECT * FROM c WHERE c.type = @type',
        parameters: [
          { name: '@type', value: 'team_relationship' }
        ]
      }
    ];

    const results = {};

    for (const queryInfo of queries) {
      const { resources } = await teamsContainer.items.query(queryInfo).fetchAll();
      results[queryInfo.name] = {
        count: resources.length,
        teams: resources.map(team => ({
          id: team.id,
          managerId: team.managerId,
          managerIdType: typeof team.managerId,
          teamName: team.teamName,
          isMatch: team.managerId === coachId,
          strictEqual: team.managerId === coachId,
          looseEqual: team.managerId == coachId
        }))
      };
    }

    context.log('Debug results:', JSON.stringify(results, null, 2));

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        searchCoachId: coachId,
        searchCoachIdType: typeof coachId,
        results
      }),
      headers
    };

  } catch (error) {
    context.log.error('Error in debug lookup:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
      headers
    };
  }
};
