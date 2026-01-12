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
  // First, verify user exists
  const userQuery = {
    query: 'SELECT * FROM c WHERE c.userId = @userId',
    parameters: [
      { name: '@userId', value: userId.toString() }
    ]
  };

  const { resources: users } = await usersContainer.items.query(userQuery).fetchAll();
  
  if (users.length === 0) {
    throw { status: 404, message: 'User not found', details: userId };
  }

  // Find the coach's team
  const teamQuery = {
    query: 'SELECT * FROM c WHERE c.type = @type AND c.managerId = @managerId',
    parameters: [
      { name: '@type', value: 'team_relationship' },
      { name: '@managerId', value: coachId } // Keep as string UUID
    ]
  };

  const { resources: teams } = await teamsContainer.items.query(teamQuery).fetchAll();
  
  if (teams.length === 0) {
    throw { status: 404, message: 'Coach team not found', details: coachId };
  }

  const team = teams[0];

  // Check if user is already in the team
  if (team.teamMembers.includes(userId)) { // Keep as string UUID
    throw { 
      status: 409, 
      message: 'User is already assigned to this coach',
      details: `userId: ${userId}, coachId: ${coachId}, teamName: ${team.teamName}`
    };
  }

  // Add user to team
  const updatedTeam = {
    ...team,
    teamMembers: [...team.teamMembers, userId], // Keep as string UUID
    lastModified: new Date().toISOString()
  };

  await teamsContainer.item(team.id, team.managerId).replace(updatedTeam);

  // Update user's assignment info
  const user = users[0];
  const updatedUser = {
    ...user,
    assignedCoachId: coachId, // Keep as string UUID
    assignedTeamName: team.teamName,
    assignedAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  };

  await usersContainer.item(user.id, user.userId).replace(updatedUser);

  context.log(`Successfully assigned user ${userId} to coach ${coachId}`);

  return {
    success: true,
    message: 'User successfully assigned to coach',
    userId: userId,
    coachId: coachId,
    teamName: team.teamName,
    assignedAt: updatedUser.assignedAt,
    newTeamSize: updatedTeam.teamMembers.length,
    timestamp: new Date().toISOString()
  };
});
