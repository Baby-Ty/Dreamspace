const { CosmosClient } = require('@azure/cosmos');
const { requireCoach, isAuthRequired, getCorsHeaders } = require('../utils/authMiddleware');

// Initialize Cosmos client only if environment variables are present
let client, database, teamsContainer, usersContainer;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  teamsContainer = database.container('teams');
  usersContainer = database.container('users');
}

module.exports = async function (context, req) {
  const managerId = context.bindingData.managerId;

  // Set CORS headers
  const headers = getCorsHeaders();

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

  // AUTH CHECK: Only coaches can update team names
  if (isAuthRequired()) {
    const user = await requireCoach(context, req);
    if (!user) return; // 401/403 already sent
  }

  const { teamName } = req.body || {};

  if (teamName === undefined || teamName === null) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'Team name is required' }),
      headers
    };
    return;
  }

  const trimmedTeamName = teamName.trim();

  if (!trimmedTeamName) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'Team name cannot be empty' }),
      headers
    };
    return;
  }

  // Check if Cosmos DB is configured
  if (!teamsContainer || !usersContainer) {
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

    // Update team with new name
    const updatedTeam = {
      ...team,
      teamName: trimmedTeamName,
      lastModified: new Date().toISOString()
    };

    await teamsContainer.item(team.id, team.managerId).replace(updatedTeam);

    // Update all team members' assignedTeamName
    if (team.teamMembers && team.teamMembers.length > 0) {
      const updatePromises = team.teamMembers.map(async (memberId) => {
        try {
          const memberQuery = {
            query: 'SELECT * FROM c WHERE c.userId = @userId',
            parameters: [{ name: '@userId', value: memberId }]
          };
          const { resources: members } = await usersContainer.items.query(memberQuery).fetchAll();
          
          if (members.length > 0) {
            const member = members[0];
            const updatedMember = {
              ...member,
              assignedTeamName: trimmedTeamName,
              lastModified: new Date().toISOString()
            };
            await usersContainer.item(member.id, member.userId).replace(updatedMember);
          }
        } catch (error) {
          context.log.warn(`Failed to update team name for member ${memberId}:`, error.message);
          // Continue with other members even if one fails
        }
      });

      await Promise.all(updatePromises);
    }

    // Update coach's teamName in their user record
    try {
      const coachQuery = {
        query: 'SELECT * FROM c WHERE c.userId = @userId',
        parameters: [{ name: '@userId', value: managerId }]
      };
      const { resources: coaches } = await usersContainer.items.query(coachQuery).fetchAll();
      
      if (coaches.length > 0) {
        const coach = coaches[0];
        const updatedCoach = {
          ...coach,
          teamName: trimmedTeamName,
          lastModified: new Date().toISOString()
        };
        await usersContainer.item(coach.id, coach.userId).replace(updatedCoach);
      }
    } catch (error) {
      context.log.warn(`Failed to update team name for coach ${managerId}:`, error.message);
      // Continue even if coach update fails
    }

    context.log(`✅ Successfully updated team name for manager ${managerId} to "${trimmedTeamName}"`);

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        data: {
          managerId: managerId,
          teamName: updatedTeam.teamName,
          lastModified: updatedTeam.lastModified
        }
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error updating team name:', error);
    
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to update team name',
        details: error.message,
        managerId: managerId,
        timestamp: new Date().toISOString()
      }),
      headers
    };
  }
};

