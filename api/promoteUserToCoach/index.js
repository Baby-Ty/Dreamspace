const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos client only if environment variables are present
let client, database, usersContainer, teamsContainer;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  usersContainer = database.container('users');
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

  const { userId, teamName } = req.body;

  if (!userId || !teamName) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'User ID and team name are required' }),
      headers
    };
    return;
  }

  // Check if Cosmos DB is configured
  if (!usersContainer || !teamsContainer) {
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
    // First, check if user exists
    const userQuery = {
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [
        { name: '@userId', value: userId.toString() }
      ]
    };

    const { resources: users } = await usersContainer.items.query(userQuery).fetchAll();
    
    if (users.length === 0) {
      context.res = {
        status: 404,
        body: JSON.stringify({ error: 'User not found', userId }),
        headers
      };
      return;
    }

    const user = users[0];

    // Update user role to coach
    const updatedUser = {
      ...user,
      role: 'coach',
      isCoach: true,
      lastModified: new Date().toISOString(),
      promotedAt: new Date().toISOString()
    };

    await usersContainer.item(user.id, user.userId).replace(updatedUser);

    // Create new team relationship
    const teamId = `team_${userId}_${Date.now()}`;
    const teamRelationship = {
      id: teamId,
      type: 'team_relationship',
      managerId: parseInt(userId),
      teamMembers: [],
      teamName: teamName,
      managerRole: 'Dream Coach',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isActive: true,
      createdBy: 'system', // Could be replaced with actual admin user ID
    };

    await teamsContainer.items.create(teamRelationship);

    context.log(`Successfully promoted user ${userId} to coach with team: ${teamName}`);

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        message: 'User successfully promoted to coach',
        userId: parseInt(userId),
        teamName: teamName,
        teamId: teamId,
        promotedAt: teamRelationship.createdAt,
        timestamp: new Date().toISOString()
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error promoting user to coach:', error);
    
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to promote user to coach',
        details: error.message,
        userId,
        teamName,
        timestamp: new Date().toISOString()
      }),
      headers
    };
  }
};
