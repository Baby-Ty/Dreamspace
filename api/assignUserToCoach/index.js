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

  const { userId, coachId } = req.body;

  if (!userId || !coachId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'User ID and coach ID are required' }),
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
    // First, verify user exists
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

    // Find the coach's team
    const teamQuery = {
      query: 'SELECT * FROM c WHERE c.type = @type AND c.managerId = @managerId',
      parameters: [
        { name: '@type', value: 'team_relationship' },
        { name: '@managerId', value: parseInt(coachId) }
      ]
    };

    const { resources: teams } = await teamsContainer.items.query(teamQuery).fetchAll();
    
    if (teams.length === 0) {
      context.res = {
        status: 404,
        body: JSON.stringify({ error: 'Coach team not found', coachId }),
        headers
      };
      return;
    }

    const team = teams[0];

    // Check if user is already in the team
    if (team.teamMembers.includes(parseInt(userId))) {
      context.res = {
        status: 409,
        body: JSON.stringify({ 
          error: 'User is already assigned to this coach',
          userId,
          coachId,
          teamName: team.teamName
        }),
        headers
      };
      return;
    }

    // Add user to team
    const updatedTeam = {
      ...team,
      teamMembers: [...team.teamMembers, parseInt(userId)],
      lastModified: new Date().toISOString()
    };

    await teamsContainer.item(team.id, team.managerId.toString()).replace(updatedTeam);

    // Update user's assignment info
    const user = users[0];
    const updatedUser = {
      ...user,
      assignedCoachId: parseInt(coachId),
      assignedTeamName: team.teamName,
      assignedAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    await usersContainer.item(user.id, user.userId).replace(updatedUser);

    context.log(`Successfully assigned user ${userId} to coach ${coachId}`);

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        message: 'User successfully assigned to coach',
        userId: parseInt(userId),
        coachId: parseInt(coachId),
        teamName: team.teamName,
        assignedAt: updatedUser.assignedAt,
        newTeamSize: updatedTeam.teamMembers.length,
        timestamp: new Date().toISOString()
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error assigning user to coach:', error);
    
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to assign user to coach',
        details: error.message,
        userId,
        coachId,
        timestamp: new Date().toISOString()
      }),
      headers
    };
  }
};
