const { CosmosClient } = require('@azure/cosmos');
const { getCosmosClient } = require('../utils/cosmosProvider');
const { requireAdmin, isAuthRequired, getCorsHeaders } = require('../utils/authMiddleware');

/**
 * Azure Function: Upgrade User to V3 6-Container Architecture
 * POST /api/upgradeUserToV3/{userId}
 * 
 * Manually upgrades a user from v1 monolithic to v3 6-container architecture
 */
module.exports = async function (context, req) {
  const headers = getCorsHeaders();

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  // AUTH CHECK: Only admins can upgrade user data structures
  if (isAuthRequired()) {
    const user = await requireAdmin(context, req);
    if (!user) return; // 401/403 already sent
  }

  const userId = context.bindingData.userId;

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'User ID is required' }),
      headers
    };
    return;
  }

  try {
    context.log(`⬆️ Upgrading user ${userId} to v3 architecture`);

    const { database } = getCosmosClient();
    const usersContainer = database.container('users');

    // Load user profile
    const { resource: profile } = await usersContainer.item(userId, userId).read();

    if (!profile) {
      context.res = {
        status: 404,
        body: JSON.stringify({ error: 'User not found' }),
        headers
      };
      return;
    }

    // Check current version
    const currentVersion = profile.dataStructureVersion || 1;
    context.log(`Current data structure version: ${currentVersion}`);

    if (currentVersion >= 3) {
      context.res = {
        status: 200,
        body: JSON.stringify({
          success: true,
          message: `User is already on v${currentVersion}`,
          version: currentVersion
        }),
        headers
      };
      return;
    }

    // Upgrade to v3
    profile.dataStructureVersion = 3;
    profile.updatedAt = new Date().toISOString();

    await usersContainer.items.upsert(profile);
    context.log(`✅ User ${userId} upgraded to v3`);

    // If user has dreams or weeklyGoals in their profile, migrate them
    const dreamsContainer = database.container('dreams');
    const dreams = profile.dreamBook || [];
    const weeklyGoals = profile.weeklyGoals || [];
    const templates = weeklyGoals.filter(g => g.type === 'weekly_goal_template');

    context.log(`Migrating ${dreams.length} dreams and ${templates.length} templates to dreams container`);

    if (dreams.length > 0 || templates.length > 0) {
      // Create aggregated dreams document
      const dreamsDoc = {
        id: userId,
        userId: userId,
        dreamBook: dreams,
        weeklyGoalTemplates: templates,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await dreamsContainer.items.upsert(dreamsDoc);
      context.log(`✅ Migrated ${dreams.length} dreams and ${templates.length} templates to dreams container`);
    }

    // Clean up profile (remove large arrays)
    delete profile.dreamBook;
    delete profile.weeklyGoals;
    delete profile.connects;
    delete profile.scoringHistory;
    
    await usersContainer.items.upsert(profile);
    context.log(`✅ Cleaned up user profile`);

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        message: `User upgraded from v${currentVersion} to v3`,
        version: 3,
        migratedDreams: dreams.length,
        migratedTemplates: templates.length
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error upgrading user:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to upgrade user',
        details: error.message
      }),
      headers
    };
  }
};

