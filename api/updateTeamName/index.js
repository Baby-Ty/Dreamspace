const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'coach'
}, async (context, req, { provider, user }) => {
  const managerId = context.bindingData.managerId;

  if (!managerId) {
    throw { status: 400, message: 'Manager ID is required' };
  }

  // SECURITY: Verify the authenticated coach is modifying their own team (or is admin)
  if (user.userId !== managerId && !user.isAdmin) {
    throw { status: 403, message: 'You can only modify your own team' };
  }

  const { teamName } = req.body || {};

  if (teamName === undefined || teamName === null) {
    throw { status: 400, message: 'Team name is required' };
  }

  const trimmedTeamName = teamName.trim();

  if (!trimmedTeamName) {
    throw { status: 400, message: 'Team name cannot be empty' };
  }

  const teamsContainer = provider.getContainer('teams');
  const usersContainer = provider.getContainer('users');

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
    throw { status: 404, message: 'No team found for this manager', details: managerId };
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

  return {
    success: true,
    data: {
      managerId: managerId,
      teamName: updatedTeam.teamName,
      lastModified: updatedTeam.lastModified
    }
  };
});
