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
    context.log(`Unassigning user ${userId} from coach ${coachId}`);

    // Find the coach's team
    const teamQuery = {
      query: 'SELECT * FROM c WHERE c.type = @type AND c.managerId = @managerId',
      parameters: [
        { name: '@type', value: 'team_relationship' },
        { name: '@managerId', value: coachId }
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

    // Check if user is in the team
    if (!team.teamMembers.includes(userId)) {
      context.res = {
        status: 409,
        body: JSON.stringify({ 
          error: 'User is not assigned to this coach',
          userId,
          coachId,
          teamName: team.teamName
        }),
        headers
      };
      return;
    }

    // Remove user from team
    const updatedTeam = {
      ...team,
      teamMembers: team.teamMembers.filter(memberId => memberId !== userId),
      lastModified: new Date().toISOString()
    };

    await teamsContainer.item(team.id, team.managerId).replace(updatedTeam);

    // Update user's assignment info (remove assignment)
    const userQuery = {
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [
        { name: '@userId', value: userId }
      ]
    };

    const { resources: users } = await usersContainer.items.query(userQuery).fetchAll();
    
    if (users.length > 0) {
      const user = users[0];
      const updatedUser = {
        ...user,
        assignedCoachId: null,
        assignedTeamName: null,
        unassignedAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };

      await usersContainer.item(user.id, user.userId).replace(updatedUser);
    }

    context.log(`Successfully unassigned user ${userId} from coach ${coachId}`);

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        message: 'User successfully unassigned from coach',
        userId: userId,
        coachId: coachId,
        teamName: team.teamName,
        unassignedAt: new Date().toISOString(),
        newTeamSize: updatedTeam.teamMembers.length,
        timestamp: new Date().toISOString()
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error unassigning user from coach:', error);
    
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to unassign user from coach',
        details: error.message,
        userId,
        coachId,
        timestamp: new Date().toISOString()
      }),
      headers
    };
  }
};
