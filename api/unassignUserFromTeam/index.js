const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'admin'
}, async (context, req, { provider }) => {
  const { userId, coachId } = req.body;

  if (!userId || !coachId) {
    throw { status: 400, message: 'User ID and coach ID are required' };
  }

  const usersContainer = provider.getContainer('users');
  const teamsContainer = provider.getContainer('teams');

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
    throw { status: 404, message: 'Coach team not found', details: coachId };
  }

  const team = teams[0];

  // Check if user is in the team
  if (!team.teamMembers.includes(userId)) {
    throw { 
      status: 409, 
      message: 'User is not assigned to this coach',
      details: `userId: ${userId}, coachId: ${coachId}, teamName: ${team.teamName}`
    };
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

  return {
    success: true,
    message: 'User successfully unassigned from coach',
    userId: userId,
    coachId: coachId,
    teamName: team.teamName,
    unassignedAt: new Date().toISOString(),
    newTeamSize: updatedTeam.teamMembers.length,
    timestamp: new Date().toISOString()
  };
});
