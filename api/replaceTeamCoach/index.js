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

  const { oldCoachId, newCoachId, teamName } = req.body;

  if (!oldCoachId || !newCoachId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'Both old coach ID and new coach ID are required' }),
      headers
    };
    return;
  }

  if (oldCoachId === newCoachId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'Old coach and new coach cannot be the same' }),
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
    context.log(`Replacing coach ${oldCoachId} with ${newCoachId} for team: ${teamName || 'unnamed'}`);

    // Find the old coach's team
    const oldTeamQuery = {
      query: 'SELECT * FROM c WHERE c.type = @type AND c.managerId = @managerId',
      parameters: [
        { name: '@type', value: 'team_relationship' },
        { name: '@managerId', value: oldCoachId }
      ]
    };

    const { resources: oldTeams } = await teamsContainer.items.query(oldTeamQuery).fetchAll();
    
    if (oldTeams.length === 0) {
      context.res = {
        status: 404,
        body: JSON.stringify({ error: 'Old coach team not found', oldCoachId }),
        headers
      };
      return;
    }

    const oldTeam = oldTeams[0];

    // Check if new coach already has a team
    const newTeamQuery = {
      query: 'SELECT * FROM c WHERE c.type = @type AND c.managerId = @managerId',
      parameters: [
        { name: '@type', value: 'team_relationship' },
        { name: '@managerId', value: newCoachId }
      ]
    };

    const { resources: newTeams } = await teamsContainer.items.query(newTeamQuery).fetchAll();
    
    // Verify new coach exists and get their profile
    const newCoachQuery = {
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [
        { name: '@userId', value: newCoachId }
      ]
    };

    const { resources: newCoaches } = await usersContainer.items.query(newCoachQuery).fetchAll();
    
    if (newCoaches.length === 0) {
      context.res = {
        status: 404,
        body: JSON.stringify({ error: 'New coach not found', newCoachId }),
        headers
      };
      return;
    }

    const newCoach = newCoaches[0];

    // If new coach already has a team, we'll merge the teams
    let mergedTeamMembers = [...oldTeam.teamMembers];
    let teamToDelete = null;
    
    if (newTeams.length > 0) {
      const existingNewTeam = newTeams[0];
      // Merge team members (avoid duplicates)
      const existingMembers = new Set(existingNewTeam.teamMembers);
      mergedTeamMembers = [
        ...existingNewTeam.teamMembers,
        ...oldTeam.teamMembers.filter(member => !existingMembers.has(member))
      ];
      teamToDelete = existingNewTeam; // We'll delete the new coach's old team
    }

    // Create the new team structure
    const updatedTeam = {
      ...oldTeam,
      managerId: newCoachId,
      teamName: teamName || `${newCoach.name || 'New Coach'}'s Team`,
      teamMembers: mergedTeamMembers,
      lastModified: new Date().toISOString(),
      coachReplaced: {
        oldCoachId: oldCoachId,
        newCoachId: newCoachId,
        replacedAt: new Date().toISOString(),
        replacedBy: 'system'
      }
    };

    // Delete the old team
    await teamsContainer.item(oldTeam.id, oldTeam.managerId).delete();

    // If new coach had an existing team, delete that too (we merged it)
    if (teamToDelete) {
      await teamsContainer.item(teamToDelete.id, teamToDelete.managerId).delete();
    }

    // Create the new team with the new coach
    await teamsContainer.items.create(updatedTeam);

    // Update old coach role back to 'user' if they have no other teams
    const oldCoachTeamsQuery = {
      query: 'SELECT * FROM c WHERE c.type = @type AND c.managerId = @managerId',
      parameters: [
        { name: '@type', value: 'team_relationship' },
        { name: '@managerId', value: oldCoachId }
      ]
    };
    
    const { resources: remainingOldCoachTeams } = await teamsContainer.items.query(oldCoachTeamsQuery).fetchAll();
    
    if (remainingOldCoachTeams.length === 0) {
      // Old coach has no more teams, demote them
      const oldCoachUserQuery = {
        query: 'SELECT * FROM c WHERE c.userId = @userId',
        parameters: [
          { name: '@userId', value: oldCoachId }
        ]
      };

      const { resources: oldCoachUsers } = await usersContainer.items.query(oldCoachUserQuery).fetchAll();
      
      if (oldCoachUsers.length > 0) {
        const oldCoachUser = oldCoachUsers[0];
        const updatedOldCoachUser = {
          ...oldCoachUser,
          role: 'user',
          demotedAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        };
        await usersContainer.item(oldCoachUser.id, oldCoachUser.userId).replace(updatedOldCoachUser);
      }
    }

    // Update new coach role to 'coach'
    const updatedNewCoachUser = {
      ...newCoach,
      role: 'coach',
      promotedAt: newCoach.promotedAt || new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    await usersContainer.item(newCoach.id, newCoach.userId).replace(updatedNewCoachUser);

    // Update all team members' assignment info
    for (const memberId of updatedTeam.teamMembers) {
      const memberQuery = {
        query: 'SELECT * FROM c WHERE c.userId = @userId',
        parameters: [
          { name: '@userId', value: memberId }
        ]
      };

      const { resources: members } = await usersContainer.items.query(memberQuery).fetchAll();
      
      if (members.length > 0) {
        const member = members[0];
        const updatedMember = {
          ...member,
          assignedCoachId: newCoachId,
          assignedTeamName: updatedTeam.teamName,
          reassignedAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        };
        await usersContainer.item(member.id, member.userId).replace(updatedMember);
      }
    }

    context.log(`Successfully replaced coach ${oldCoachId} with ${newCoachId} for ${updatedTeam.teamMembers.length} team members`);

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        message: 'Coach successfully replaced',
        oldCoachId: oldCoachId,
        newCoachId: newCoachId,
        teamName: updatedTeam.teamName,
        teamSize: updatedTeam.teamMembers.length,
        replacedAt: updatedTeam.coachReplaced.replacedAt,
        mergedTeams: !!teamToDelete,
        timestamp: new Date().toISOString()
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error replacing team coach:', error);
    
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to replace team coach',
        details: error.message,
        oldCoachId,
        newCoachId,
        timestamp: new Date().toISOString()
      }),
      headers
    };
  }
};
