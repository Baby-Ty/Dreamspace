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
    // Log debug info
    context.log(`🔍 getTeamMetrics: Looking for team with managerId: "${managerId}" (type: ${typeof managerId})`);
    
    // Find the team relationship for this manager
    const teamQuery = {
      query: 'SELECT * FROM c WHERE c.type = @type AND c.managerId = @managerId',
      parameters: [
        { name: '@type', value: 'team_relationship' },
        { name: '@managerId', value: managerId } // Keep as string UUID
      ]
    };

    const { resources: teams } = await teamsContainer.items.query(teamQuery).fetchAll();
    
    context.log(`📊 getTeamMetrics: Found ${teams.length} teams for managerId: "${managerId}"`);
    if (teams.length > 0) {
      context.log('📊 Team details:', teams.map(t => ({ managerId: t.managerId, teamName: t.teamName, memberCount: t.teamMembers?.length || 0 })));
    }
    
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

    // Get team members' data and coach data
    const memberIds = team.teamMembers || [];
    const allMemberIds = [managerId, ...memberIds.filter(id => id !== managerId)]; // Include coach as first member, avoid duplicates
    const teamMembers = [];
    
    if (allMemberIds.length > 0) {
      const usersQuery = {
        query: `SELECT * FROM c WHERE c.userId IN (${allMemberIds.map((_, i) => `@userId${i}`).join(', ')})`,
        parameters: allMemberIds.map((id, i) => ({ name: `@userId${i}`, value: id.toString() }))
      };

      const { resources: users } = await usersContainer.items.query(usersQuery).fetchAll();
      
      // Transform user data - prioritize currentUser data like getAllUsers API
      users.forEach(user => {
        const currentUser = user.currentUser || {};
        const bestName = currentUser.name || user.name || user.displayName || 'Unknown User';
        const bestEmail = currentUser.email || user.email || user.userPrincipalName || user.mail || '';
        const bestOffice = currentUser.office || user.office || user.officeLocation || 'Unknown';
        const bestAvatar = currentUser.avatar || user.avatar || user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(bestName)}&background=6366f1&color=fff&size=100`;
        
        const userId = user.userId || user.id;
        teamMembers.push({
          id: userId,
          userId: userId,
          name: bestName,
          email: bestEmail,
          office: bestOffice,
          avatar: bestAvatar,
          score: currentUser.score || user.score || 0,
          dreamsCount: (currentUser.dreamBook && currentUser.dreamBook.length) || (user.dreamBook && user.dreamBook.length) || currentUser.dreamsCount || user.dreamsCount || 0,
          connectsCount: currentUser.connectsCount || user.connectsCount || 0,
          lastActiveAt: user.lastActiveAt || user.lastModified || new Date().toISOString(),
          isCoach: userId === managerId, // Flag to identify the coach
          // Include complete dream data for Dream Coach modal
          dreamBook: currentUser.dreamBook || user.dreamBook || [],
          sampleDreams: currentUser.sampleDreams || user.sampleDreams || [],
          dreamCategories: currentUser.dreamCategories || user.dreamCategories || [],
          careerGoals: currentUser.careerGoals || user.careerGoals || [],
          skills: currentUser.skills || user.skills || [],
          connects: currentUser.connects || user.connects || []
        });
      });
      
      // Sort team members to put the coach first
      teamMembers.sort((a, b) => {
        if (a.isCoach && !b.isCoach) return -1;
        if (!a.isCoach && b.isCoach) return 1;
        return 0; // Keep original order for non-coaches
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
      mission: team.mission || null,
      nextMeeting: team.nextMeeting || null,
      managerId: team.managerId,
      lastUpdated: new Date().toISOString()
    };

    context.log(`Successfully calculated team metrics for manager ${managerId}`);

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        metrics,
        managerId: managerId,
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
