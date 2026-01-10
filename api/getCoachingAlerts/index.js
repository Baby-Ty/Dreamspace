const { CosmosClient } = require('@azure/cosmos');
const { requireAuth, isAuthRequired, getCorsHeaders } = require('../utils/authMiddleware');

// Initialize Cosmos client only if environment variables are present
let client, database, usersContainer, teamsContainer, alertsContainer;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  usersContainer = database.container('users');
  teamsContainer = database.container('teams');
  alertsContainer = database.container('coaching_alerts');
}

module.exports = async function (context, req) {
  const managerId = context.bindingData.managerId;

  // Set CORS headers
  const headers = getCorsHeaders();

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  // AUTH CHECK: Authenticated users only
  if (isAuthRequired()) {
    const user = await requireAuth(context, req);
    if (!user) return; // 401 already sent
    context.log(`User ${user.email} accessing coaching alerts for ${managerId}`);
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
      context.res = {
        status: 200,
        body: JSON.stringify({
          success: true,
          alerts: [],
          count: 0,
          message: 'No team found for this manager',
          managerId: managerId,
          timestamp: new Date().toISOString()
        }),
        headers
      };
      return;
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

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        alerts,
        count: alerts.length,
        managerId: managerId,
        teamName: team.teamName,
        teamSize: memberIds.length,
        timestamp: new Date().toISOString()
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error generating coaching alerts:', error);
    
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to generate coaching alerts',
        details: error.message,
        managerId: managerId,
        timestamp: new Date().toISOString()
      }),
      headers
    };
  }
};
