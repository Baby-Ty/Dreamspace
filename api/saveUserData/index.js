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

// Helper to determine if data is in old monolithic format
function isOldFormat(userData) {
  return !!(userData.dreamBook || userData.weeklyGoals || userData.scoringHistory || 
            userData.connects || userData.careerGoals || userData.developmentPlan);
}

// Helper to extract profile data (no arrays)
function extractProfile(userData) {
  const {
    dreamBook, weeklyGoals, scoringHistory, connects, careerGoals, developmentPlan,
    ...profile
  } = userData;
  
  return {
    ...profile,
    dataStructureVersion: 2,
    lastUpdated: new Date().toISOString()
  };
}

// Helper to extract items from arrays
function extractItems(userId, userData) {
  const items = [];
  const timestamp = Date.now();
  
  // Extract dreams
  if (userData.dreamBook && Array.isArray(userData.dreamBook)) {
    userData.dreamBook.forEach((dream, index) => {
      items.push({
        type: 'dream',
        data: {
          ...dream,
          id: dream.id || `dream_${userId}_${timestamp}_${index}`
        }
      });
    });
  }
  
  // Extract weekly goals
  if (userData.weeklyGoals && Array.isArray(userData.weeklyGoals)) {
    userData.weeklyGoals.forEach((goal, index) => {
      items.push({
        type: 'weekly_goal',
        data: {
          ...goal,
          id: goal.id || `weekly_goal_${userId}_${timestamp}_${index}`
        }
      });
    });
  }
  
  // Extract scoring history
  if (userData.scoringHistory && Array.isArray(userData.scoringHistory)) {
    userData.scoringHistory.forEach((entry, index) => {
      items.push({
        type: 'scoring_entry',
        data: {
          ...entry,
          id: entry.id || `scoring_entry_${userId}_${timestamp}_${index}`
        }
      });
    });
  }
  
  // Extract connects
  if (userData.connects && Array.isArray(userData.connects)) {
    userData.connects.forEach((connect, index) => {
      items.push({
        type: 'connect',
        data: {
          ...connect,
          id: connect.id || `connect_${userId}_${timestamp}_${index}`
        }
      });
    });
  }
  
  // Extract career goals
  if (userData.careerGoals && Array.isArray(userData.careerGoals)) {
    userData.careerGoals.forEach((goal, index) => {
      items.push({
        type: 'career_goal',
        data: {
          ...goal,
          id: goal.id || `career_goal_${userId}_${timestamp}_${index}`
        }
      });
    });
  }
  
  // Extract development plan
  if (userData.developmentPlan && Array.isArray(userData.developmentPlan)) {
    userData.developmentPlan.forEach((plan, index) => {
      items.push({
        type: 'development_plan',
        data: {
          ...plan,
          id: plan.id || `development_plan_${userId}_${timestamp}_${index}`
        }
      });
    });
  }
  
  return items;
}

module.exports = async function (context, req) {
  // Set CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  const userId = context.bindingData.userId;
  const userData = req.body;

  context.log('Saving user data for userId:', userId);

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'User ID is required' }),
      headers
    };
    return;
  }

  if (!userData) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'User data is required' }),
      headers
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
      headers
    };
    return;
  }

  try {
    // Check if this is old format data that needs to be split
    if (isOldFormat(userData)) {
      context.log('Detected old format data, splitting into profile and items');
      
      // Extract profile without arrays
      const profile = extractProfile(userData);
      profile.id = userId;
      profile.userId = userId;
      
      // Save profile to users container
      const { resource: profileResource } = await usersContainer.items.upsert(profile);
      context.log('Profile saved:', profileResource.id);
      
      // Extract items from arrays
      const items = extractItems(userId, userData);
      context.log(`Extracted ${items.length} items from user data`);
      
      // Save items to items container (batch)
      if (items.length > 0) {
        const savedItems = [];
        for (const item of items) {
          const document = {
            id: item.data.id,
            userId: userId,
            type: item.type,
            ...item.data,
            createdAt: item.data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          const { resource } = await itemsContainer.items.upsert(document);
          savedItems.push(resource.id);
        }
        context.log(`Saved ${savedItems.length} items to items container`);
      }
      
      context.res = {
        status: 200,
        body: JSON.stringify({ 
          success: true, 
          id: profileResource.id,
          format: 'split',
          itemCount: items.length
        }),
        headers
      };
    } else {
      // New format - just save as profile (or handle explicit split format)
      context.log('Saving data in new format');
      
      const document = {
        id: userId,
        userId: userId,
        ...userData,
        dataStructureVersion: userData.dataStructureVersion || 2,
        lastUpdated: new Date().toISOString()
      };

      const { resource } = await usersContainer.items.upsert(document);
      
      context.log('Successfully saved user profile:', resource.id);
      
      context.res = {
        status: 200,
        body: JSON.stringify({ 
          success: true, 
          id: resource.id,
          format: 'profile'
        }),
        headers
      };
    }
  } catch (error) {
    context.log.error('Error saving user data:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      headers
    };
  }
};
