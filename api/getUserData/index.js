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
        grouped.weeklyGoals.push(cleanItem);
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
      
      // Group items by type
      const grouped = groupItemsByType(items);
      
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
