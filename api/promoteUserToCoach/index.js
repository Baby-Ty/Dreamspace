const { CosmosClient } = require('@azure/cosmos');
const { generateTeamId } = require('../utils/idGenerator');
const { generateRandomTeamName } = require('../utils/teamNameGenerator');
const { requireAdmin, isAuthRequired, getCorsHeaders } = require('../utils/authMiddleware');

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
  const headers = getCorsHeaders();

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  // AUTH CHECK: Admin only - promoting users is an admin action
  if (isAuthRequired()) {
    const admin = await requireAdmin(context, req);
    if (!admin) return; // 401 or 403 already sent
    context.log(`Admin ${admin.email} promoting user to coach`);
  }

  const { userId, teamName: providedTeamName } = req.body;

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'User ID is required' }),
      headers
    };
    return;
  }
  
  // Generate team name if not provided
  const teamName = providedTeamName || generateRandomTeamName();

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
