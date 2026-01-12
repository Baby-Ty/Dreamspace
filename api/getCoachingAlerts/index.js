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
  context.log(`🔍 getCoachingAlerts: Looking for team with managerId: "${managerId}" (type: ${typeof managerId})`);
  
  // Find the team relationship for this manager
  const teamQuery = {
    query: 'SELECT * FROM c WHERE c.type = @type AND c.managerId = @managerId',
    parameters: [
      { name: '@type', value: 'team_relationship' },
      { name: '@managerId', value: managerId } // Keep as string UUID to match getTeamMetrics
    ]
  };

  const { resources: teams } = await teamsContainer.items.query(teamQuery).fetchAll();
  
  context.log(`🚨 getCoachingAlerts: Found ${teams.length} teams for managerId: "${managerId}"`);
  if (teams.length > 0) {
    context.log('🚨 Team details:', teams.map(t => ({ managerId: t.managerId, teamName: t.teamName, memberCount: t.teamMembers?.length || 0 })));
  }
  
  if (teams.length === 0) {
    return {
      success: true,
      alerts: [],
      count: 0,
      message: 'No team found for this manager',
      managerId: managerId,
      timestamp: new Date().toISOString()
    };
  }

  const team = teams[0];
  const memberIds = team.teamMembers || [];
  const alerts = [];

  if (memberIds.length > 0) {
    // Get team members' data to generate alerts
    const usersQuery = {
      query: `SELECT * FROM c WHERE c.userId IN (${memberIds.map((_, i) => `@userId${i}`).join(', ')})`,
      parameters: memberIds.map((id, i) => ({ name: `@userId${i}`, value: id.toString() }))
    };

    const { resources: users } = await usersContainer.items.query(usersQuery).fetchAll();
    
    // Generate alerts based on user data
    users.forEach(user => {
      const userId = user.userId || user.id;
      const userName = user.name || user.displayName || 'Unknown User';
      const userScore = user.score || 0;
      const dreamCount = (user.dreamBook && user.dreamBook.length) || 0;
      const lastActiveAt = user.lastActiveAt || user.lastModified;
      
      // Low engagement alert (score < 20)
      if (userScore < 20) {
        alerts.push({
          id: `low-engagement-${userId}`,
          type: 'low_engagement',
          priority: 'medium',
          memberId: userId,
          memberName: userName,
          title: 'Low Engagement',
          message: `${userName} has low engagement (${userScore} points)`,
          actionRequired: true,
          createdAt: new Date().toISOString(),
          score: userScore
        });
      }

      // No dreams alert
      if (dreamCount === 0) {
        alerts.push({
          id: `no-dreams-${userId}`,
          type: 'no_dreams',
          priority: 'high',
          memberId: userId,
          memberName: userName,
          title: 'No Dreams Set',
          message: `${userName} hasn't set any dreams yet`,
          actionRequired: true,
          createdAt: new Date().toISOString(),
          dreamCount
        });
      }

      // Inactive alert (no activity in last 14 days)
      if (lastActiveAt) {
        const daysSinceActive = Math.floor((new Date() - new Date(lastActiveAt)) / (1000 * 60 * 60 * 24));
        if (daysSinceActive > 14) {
          alerts.push({
            id: `inactive-${userId}`,
            type: 'inactive_user',
            priority: 'medium',
            memberId: userId,
            memberName: userName,
            title: 'User Inactive',
            message: `${userName} hasn't been active for ${daysSinceActive} days`,
            actionRequired: true,
            createdAt: new Date().toISOString(),
            daysSinceActive
          });
        }
      }

      // Low dream progress (if they have dreams but low scores)
      if (dreamCount > 0 && userScore < 30) {
        alerts.push({
          id: `low-progress-${userId}`,
          type: 'low_progress',
          priority: 'low',
          memberId: userId,
          memberName: userName,
          title: 'Low Dream Progress',
          message: `${userName} has ${dreamCount} dreams but limited progress (${userScore} points)`,
          actionRequired: false,
          createdAt: new Date().toISOString(),
          dreamCount,
          score: userScore
        });
      }
    });
  }

  // Sort alerts by priority (high -> medium -> low) and creation date
  const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
  alerts.sort((a, b) => {
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  context.log(`Successfully generated ${alerts.length} coaching alerts for manager ${managerId}`);

  return {
    success: true,
    alerts,
    count: alerts.length,
    managerId: managerId,
    teamName: team.teamName,
    teamSize: memberIds.length,
    timestamp: new Date().toISOString()
  };
});
