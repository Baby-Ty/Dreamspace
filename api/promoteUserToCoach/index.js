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

    context.log(`Found user: id=${user.id}, userId=${user.userId}, currentRole=${user.role}`);

    // Update user role to coach
    const updatedUser = {
      ...user,
      role: 'coach',
      isCoach: true,
      lastModified: new Date().toISOString(),
      promotedAt: new Date().toISOString()
    };

    context.log(`Attempting to update user document with id=${user.id}, partition key=${user.userId}`);
    
    try {
      const replaceResult = await usersContainer.item(user.id, user.userId).replace(updatedUser);
      context.log(`✅ User document updated successfully. Status: ${replaceResult.statusCode}`);
    } catch (replaceError) {
      context.log.error(`❌ Failed to update user document:`, replaceError);
      throw new Error(`Failed to update user document: ${replaceError.message}`);
    }

    // Create new team relationship
    const teamId = `team_${userId}_${Date.now()}`;
    const teamRelationship = {
      id: teamId,
      type: 'team_relationship',
      managerId: userId, // Keep as string to match user ID format
      teamMembers: [],
      teamName: teamName,
      managerRole: 'Dream Coach',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isActive: true,
      createdBy: 'system', // Could be replaced with actual admin user ID
    };

    context.log(`Creating team document with managerId=${userId}`);
    
    try {
      const createResult = await teamsContainer.items.create(teamRelationship);
      context.log(`✅ Team document created successfully. Status: ${createResult.statusCode}`);
    } catch (createError) {
      context.log.error(`❌ Failed to create team document:`, createError);
      throw new Error(`Failed to create team document: ${createError.message}`);
    }

    context.log(`✅ Successfully promoted user ${userId} to coach with team: ${teamName}`);

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        message: 'User successfully promoted to coach',
        userId: userId,
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
