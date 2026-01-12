const { generateTeamId } = require('../utils/idGenerator');
const { generateRandomTeamName } = require('../utils/teamNameGenerator');
const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'admin'
}, async (context, req, { provider }) => {
  const { userId, teamName: providedTeamName } = req.body;

  if (!userId) {
    throw { status: 400, message: 'User ID is required' };
  }
  
  // Generate team name if not provided
  const teamName = providedTeamName || generateRandomTeamName();

  const usersContainer = provider.getContainer('users');
  const teamsContainer = provider.getContainer('teams');

  // First, check if user exists
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

  // Create new team relationship with STABLE teamId
  // The teamId is a short unique ID that NEVER changes, even when coaches are replaced
  // This ensures meeting attendance and other team-linked data persists across coach changes
  const teamId = generateTeamId(); // e.g., "team_a1b2c3"
  const teamRelationship = {
    id: teamId,           // Document ID = teamId for simplicity
    teamId: teamId,       // Stable team identifier - NEVER changes
    type: 'team_relationship',
    managerId: userId,    // Current coach - CAN change via replaceTeamCoach
    teamMembers: [],
    teamName: teamName,
    managerRole: 'Dream Coach',
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    isActive: true,
    createdBy: 'system',
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

  return {
    success: true,
    message: 'User successfully promoted to coach',
    userId: userId,
    teamName: teamName,
    teamId: teamId,
    promotedAt: teamRelationship.createdAt,
    timestamp: new Date().toISOString()
  };
});
