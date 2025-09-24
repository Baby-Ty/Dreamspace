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
  const managerId = context.bindingData.managerId;

  // Set CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

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
    // Find the team relationship for this manager
    const teamQuery = {
      query: 'SELECT * FROM c WHERE c.type = @type AND c.managerId = @managerId',
      parameters: [
        { name: '@type', value: 'team_relationship' },
        { name: '@managerId', value: parseInt(managerId) }
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

    // Get team members' data
    const memberIds = team.teamMembers || [];
    const teamMembers = [];
    
    if (memberIds.length > 0) {
      const usersQuery = {
        query: `SELECT * FROM c WHERE c.userId IN (${memberIds.map((_, i) => `@userId${i}`).join(', ')})`,
        parameters: memberIds.map((id, i) => ({ name: `@userId${i}`, value: id.toString() }))
      };

      const { resources: users } = await usersContainer.items.query(usersQuery).fetchAll();
      
      // Transform user data
      users.forEach(user => {
        teamMembers.push({
          id: user.userId || user.id,
          name: user.name || user.displayName || 'Unknown User',
          email: user.email || user.userPrincipalName || '',
          office: user.office || user.officeLocation || 'Unknown',
          avatar: user.avatar || user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=6366f1&color=fff&size=100`,
          score: user.score || 0,
          dreamsCount: (user.dreamBook && user.dreamBook.length) || 0,
          connectsCount: user.connectsCount || 0,
          lastActiveAt: user.lastActiveAt || user.lastModified || new Date().toISOString()
        });
      });
    }

    // Calculate metrics
    const totalDreams = teamMembers.reduce((sum, member) => sum + (member.dreamsCount || 0), 0);
    const totalConnects = teamMembers.reduce((sum, member) => sum + (member.connectsCount || 0), 0);
    const totalScore = teamMembers.reduce((sum, member) => sum + (member.score || 0), 0);
    const averageScore = teamMembers.length > 0 ? Math.round(totalScore / teamMembers.length) : 0;
    
    // Calculate engagement rate (members with score > 0)
    const activeMembersCount = teamMembers.filter(member => member.score > 0).length;
    const engagementRate = teamMembers.length > 0 ? Math.round((activeMembersCount / teamMembers.length) * 100) : 0;

    const metrics = {
      teamSize: teamMembers.length,
      totalDreams,
      totalConnects,
      averageScore,
      engagementRate,
      activeMembersCount,
      teamMembers,
      teamName: team.teamName,
      lastUpdated: new Date().toISOString()
    };

    context.log(`Successfully calculated team metrics for manager ${managerId}`);

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        metrics,
        managerId: parseInt(managerId),
        timestamp: new Date().toISOString()
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error calculating team metrics:', error);
    
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to calculate team metrics',
        details: error.message,
        managerId: managerId,
        timestamp: new Date().toISOString()
      }),
      headers
    };
  }
};
