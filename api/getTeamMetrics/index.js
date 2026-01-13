const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'user'
}, async (context, req, { provider }) => {
  const managerId = context.bindingData.managerId;

  if (!managerId) {
    throw { status: 400, message: 'Manager ID is required' };
  }

  const usersContainer = provider.getContainer('users');
  const teamsContainer = provider.getContainer('teams');

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
    throw { status: 404, message: 'No team found for this manager', details: managerId };
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
    
    // Load dreams from dreams container (v3 6-container architecture)
    // Dreams are stored separately from user profiles
    // Wrap in try-catch to prevent failures from breaking the whole endpoint
    let dreamsByUser = {};
    try {
      const dreamsContainer = provider.getContainer('dreams');
      if (dreamsContainer) {
        // Only query dreams for team members (more efficient)
        const dreamsQuery = {
          query: `SELECT c.id, c.userId, c.dreams, c.dreamBook FROM c WHERE c.userId IN (${allMemberIds.map((_, i) => `@userId${i}`).join(', ')}) OR c.id IN (${allMemberIds.map((_, i) => `@id${i}`).join(', ')})`,
          parameters: [
            ...allMemberIds.map((id, i) => ({ name: `@userId${i}`, value: id.toString() })),
            ...allMemberIds.map((id, i) => ({ name: `@id${i}`, value: id.toString() }))
          ]
        };
        const { resources: dreamsDocs } = await dreamsContainer.items.query(dreamsQuery).fetchAll();
        
        // Create a map of userId -> dreams for efficient lookup
        for (const doc of dreamsDocs) {
          const docUserId = doc.userId || doc.id;
          dreamsByUser[docUserId] = doc.dreams || doc.dreamBook || [];
        }
        context.log(`📚 Loaded dreams for ${Object.keys(dreamsByUser).length} team members`);
      }
    } catch (dreamsError) {
      context.log.warn('⚠️ Could not load dreams from dreams container:', dreamsError.message);
      // Continue without dreams container data - will use user document fallback
    }
    
    // Transform user data - prioritize currentUser data like getAllUsers API
    users.forEach(user => {
      const currentUser = user.currentUser || {};
      const bestName = currentUser.name || user.name || user.displayName || 'Unknown User';
      const bestEmail = currentUser.email || user.email || user.userPrincipalName || user.mail || '';
      const bestOffice = currentUser.office || user.office || user.officeLocation || 'Unknown';
      const bestAvatar = currentUser.avatar || user.avatar || user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(bestName)}&background=6366f1&color=fff&size=100`;
      
      const userId = user.userId || user.id;
      
      // Get dreams from dreams container (v3) or user document (v1/v2 fallback)
      const dreamsFromContainer = dreamsByUser[userId] || [];
      const allDreams = dreamsFromContainer.length > 0 
        ? dreamsFromContainer 
        : (currentUser.dreamBook || user.dreamBook || []);
      
      // Filter to only public dreams for team view (privacy)
      const publicDreams = allDreams.filter(dream => dream.isPublic === true);
      
      teamMembers.push({
        id: userId,
        userId: userId,
        name: bestName,
        email: bestEmail,
        office: bestOffice,
        avatar: bestAvatar,
        // Include cardBackgroundImage for team member cards
        cardBackgroundImage: currentUser.cardBackgroundImage || user.cardBackgroundImage,
        score: currentUser.score || user.score || 0,
        dreamsCount: allDreams.length || currentUser.dreamsCount || user.dreamsCount || 0,
        connectsCount: currentUser.connectsCount || user.connectsCount || 0,
        lastActiveAt: user.lastActiveAt || user.lastModified || new Date().toISOString(),
        isCoach: userId === managerId, // Flag to identify the coach
        // Include public dreams for team view (all team members can see)
        dreamBook: publicDreams,
        sampleDreams: publicDreams.length > 0 
          ? publicDreams.slice(0, 3).map(d => ({ title: d.title, category: d.category, image: d.image }))
          : (currentUser.sampleDreams || user.sampleDreams || []),
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
    // Include stable teamId for meeting attendance and other team-linked features
    // Falls back to managerId for backwards compatibility with older team documents
    teamId: team.teamId || team.managerId,
    teamInterests: team.teamInterests || null,
    teamRegions: team.teamRegions || null,
    lastUpdated: new Date().toISOString()
  };

  context.log(`Successfully calculated team metrics for manager ${managerId}`);

  return {
    success: true,
    metrics,
    managerId: managerId,
    timestamp: new Date().toISOString()
  };
});
