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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
      body: JSON.stringify({ 
        error: 'Database not configured', 
        details: 'COSMOS_ENDPOINT and COSMOS_KEY environment variables are required' 
      }),
      headers
    };
    return;
  }

  try {
    // Query all team relationships
    const query = {
      query: 'SELECT * FROM c WHERE c.type = @type',
      parameters: [
        { name: '@type', value: 'team_relationship' }
      ]
    };

    const { resources: teams } = await teamsContainer.items.query(query).fetchAll();
    
    // Transform teams to match the expected format
    const formattedTeams = teams.map(team => ({
      managerId: team.managerId,
      teamMembers: team.teamMembers || [],
      teamName: team.teamName,
      managerRole: team.managerRole || 'Dream Coach',
      createdAt: team.createdAt || team._ts ? new Date(team._ts * 1000).toISOString() : new Date().toISOString(),
      lastModified: team.lastModified || new Date().toISOString(),
      isActive: team.isActive !== false
    }));

    context.log(`Successfully retrieved ${formattedTeams.length} team relationships from Cosmos DB`);

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        teams: formattedTeams,
        count: formattedTeams.length,
        timestamp: new Date().toISOString()
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error retrieving team relationships:', error);
    
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to retrieve team relationships',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      headers
    };
  }
};
