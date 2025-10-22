const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos client only if environment variables are present
let client, database, usersContainer, itemsContainer;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  usersContainer = database.container('users');
  itemsContainer = database.container('items');
}

// Helper to check if user is using new 3-container structure
function isNewStructure(profile) {
  return profile && profile.dataStructureVersion === 2;
}

// Helper to migrate old weekLog pattern to new week-specific instances
async function migrateWeekLogGoals(userId, items, context) {
  const goalsToMigrate = items.filter(item => 
    item.type === 'weekly_goal' && item.weekLog && Object.keys(item.weekLog).length > 0
  );
  
  if (goalsToMigrate.length === 0) {
    return items; // No migration needed
  }
  
  context.log(`Migrating ${goalsToMigrate.length} goals with weekLog pattern`);
  
  const newItems = [...items.filter(item => !goalsToMigrate.includes(item))];
  
  for (const goal of goalsToMigrate) {
    // Create template for recurring goals
    if (goal.recurrence === 'weekly') {
      const template = {
        id: `${goal.id}_template`,
        userId: userId,
        type: 'weekly_goal_template',
        title: goal.title,
        description: goal.description || '',
        dreamId: goal.dreamId,
        dreamTitle: goal.dreamTitle,
        dreamCategory: goal.dreamCategory,
        milestoneId: goal.milestoneId,
        recurrence: 'weekly',
        active: goal.active !== false,
        durationType: goal.durationType || 'unlimited',
        durationWeeks: goal.durationWeeks,
        startDate: goal.createdAt || new Date().toISOString(),
        createdAt: goal.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save template
      await itemsContainer.items.upsert(template);
      newItems.push(template);
      
      // Create instances for each week in weekLog
      for (const [weekId, completed] of Object.entries(goal.weekLog)) {
        const instance = {
          id: `${goal.id}_${weekId}`,
          userId: userId,
          type: 'weekly_goal',
          title: goal.title,
          description: goal.description || '',
          weekId: weekId,
          completed: completed || false,
          dreamId: goal.dreamId,
          dreamTitle: goal.dreamTitle,
          dreamCategory: goal.dreamCategory,
          milestoneId: goal.milestoneId,
          recurrence: 'weekly',
          templateId: template.id,
          createdAt: goal.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await itemsContainer.items.upsert(instance);
        newItems.push(instance);
      }
    } else {
      // One-time goal with weekLog (unusual, but handle it)
      // Just pick the first week from weekLog
      const weekId = Object.keys(goal.weekLog)[0];
      const instance = {
        id: goal.id,
        userId: userId,
        type: 'weekly_goal',
        title: goal.title,
        description: goal.description || '',
        weekId: weekId,
        completed: goal.weekLog[weekId] || goal.completed || false,
        dreamId: goal.dreamId,
        dreamTitle: goal.dreamTitle,
        dreamCategory: goal.dreamCategory,
        milestoneId: goal.milestoneId,
        recurrence: 'once',
        createdAt: goal.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await itemsContainer.items.upsert(instance);
      newItems.push(instance);
    }
    
    // Delete old goal with weekLog
    try {
      await itemsContainer.item(goal.id, userId).delete();
      context.log(`Deleted old weekLog goal: ${goal.id}`);
    } catch (err) {
      context.log.warn(`Could not delete old goal ${goal.id}:`, err.message);
    }
  }
  
  context.log(`Migration complete: created ${newItems.length - items.length + goalsToMigrate.length} new items`);
  return newItems;
}

// Helper to group items by type
function groupItemsByType(items) {
  const grouped = {
    dreamBook: [],
    weeklyGoals: [],
    scoringHistory: [],
    connects: [],
    careerGoals: [],
    developmentPlan: []
  };
  
  items.forEach(item => {
    // Remove Cosmos metadata
    const { _rid, _self, _etag, _attachments, _ts, userId, type, createdAt, updatedAt, ...cleanItem } = item;
    
    switch (item.type) {
      case 'dream':
        grouped.dreamBook.push(cleanItem);
        break;
      case 'weekly_goal':
        // Only include goals with weekId (new format)
        if (cleanItem.weekId) {
          grouped.weeklyGoals.push(cleanItem);
        }
        break;
      case 'weekly_goal_template':
        // Templates are not included in the grouped output
        // They're used internally for creating instances
        break;
      case 'scoring_entry':
        grouped.scoringHistory.push(cleanItem);
        break;
      case 'connect':
        grouped.connects.push(cleanItem);
        break;
      case 'career_goal':
        grouped.careerGoals.push(cleanItem);
        break;
      case 'development_plan':
        grouped.developmentPlan.push(cleanItem);
        break;
    }
  });
  
  return grouped;
}

module.exports = async function (context, req) {
  const userId = context.bindingData.userId;

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'User ID is required' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
    return;
  }

  // Check if Cosmos DB is configured
  if (!usersContainer || !itemsContainer) {
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        error: 'Database not configured', 
        details: 'COSMOS_ENDPOINT and COSMOS_KEY environment variables are required' 
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
    return;
  }

  try {
    // Try to load user profile
    let profile;
    try {
      const { resource } = await usersContainer.item(userId, userId).read();
      profile = resource;
    } catch (error) {
      if (error.code === 404) {
        context.log('User profile not found');
        context.res = {
          status: 404,
          body: JSON.stringify({ error: 'User not found' }),
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        };
        return;
      }
      throw error;
    }
    
    // Check if user is using new structure
    if (isNewStructure(profile)) {
      context.log('User is using new 3-container structure, loading items');
      
      // Load all items for this user
      const { resources: items } = await itemsContainer.items
        .query({
          query: 'SELECT * FROM c WHERE c.userId = @userId',
          parameters: [{ name: '@userId', value: userId }]
        })
        .fetchAll();
      
      context.log(`Loaded ${items.length} items for user`);
      
      // Migrate old weekLog pattern if found
      const migratedItems = await migrateWeekLogGoals(userId, items, context);
      
      // Group items by type
      const grouped = groupItemsByType(migratedItems);
      
      // Combine profile and items into expected format
      const { _rid, _self, _etag, _attachments, _ts, lastUpdated, dataStructureVersion, ...cleanProfile } = profile;
      
      const userData = {
        ...cleanProfile,
        ...grouped,
        // Preserve arrays as empty if no items
        dreamBook: grouped.dreamBook,
        weeklyGoals: grouped.weeklyGoals,
        scoringHistory: grouped.scoringHistory,
        connects: grouped.connects,
        careerGoals: grouped.careerGoals,
        developmentPlan: grouped.developmentPlan
      };
      
      context.res = {
        status: 200,
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    } else {
      // Old monolithic format - return as-is
      context.log('User is using old monolithic format');
      
      const { _rid, _self, _etag, _attachments, _ts, lastUpdated, ...userData } = profile;
      
      context.res = {
        status: 200,
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }
  } catch (error) {
    context.log.error('Error loading user data:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
};
