const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos client only if environment variables are present
let client, database;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
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

  const { userId, year, weekId, goals } = req.body || {};

  context.log('Saving week goals:', { userId, year, weekId, goalsCount: goals?.length });

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'userId is required' }),
      headers
    };
    return;
  }

  if (!year) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'year is required' }),
      headers
    };
    return;
  }

  if (!weekId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'weekId is required (e.g., "2025-W43")' }),
      headers
    };
    return;
  }

  if (!goals || !Array.isArray(goals)) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'goals array is required' }),
      headers
    };
    return;
  }

  // Check if Cosmos DB is configured
  if (!database) {
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
    // Get the appropriate year container (e.g., weeks2025, weeks2026)
    const containerName = `weeks${year}`;
    
    context.log(`Looking for container: ${containerName}`);
    
    const weeksContainer = database.container(containerName);
    
    const documentId = `${userId}_${year}`;
    
    context.log(`Document ID: ${documentId}, Partition Key: ${userId}`);
    
    // Try to read existing document
    let existingDoc;
    try {
      const { resource } = await weeksContainer.item(documentId, userId).read();
      if (resource) {
        existingDoc = resource;
        context.log(`Found existing document for ${userId}`);
      } else {
        context.log(`Document exists but resource is null for ${userId}, creating new`);
      }
    } catch (error) {
      if (error.code !== 404) {
        context.log.error(`Error reading document: ${error.code} - ${error.message}`);
        throw error;
      }
      // Document doesn't exist yet, will create new one
      context.log(`Creating new week document for ${userId} year ${year}`);
    }

    // Prepare the week data
    const weekData = {
      goals: goals.map(goal => ({
        id: goal.id || `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: goal.type || 'weekly_goal', // Ensure type is always set
        templateId: goal.templateId,
        dreamId: goal.dreamId,
        milestoneId: goal.milestoneId,
        title: goal.title,
        description: goal.description,
        dreamTitle: goal.dreamTitle,
        dreamCategory: goal.dreamCategory,
        completed: goal.completed || false,
        completedAt: goal.completedAt,
        recurrence: goal.recurrence, // Can be 'weekly', 'monthly', or 'once'
        targetMonths: goal.targetMonths, // For monthly goals
        monthId: goal.monthId, // Track which month this belongs to
        weekId: goal.weekId, // Include weekId in saved data
        createdAt: goal.createdAt || new Date().toISOString()
      }))
    };
    
    context.log(`Prepared week data for ${weekId}:`, {
      goalsCount: weekData.goals.length,
      goalIds: weekData.goals.map(g => g.id)
    });

    let document;
    if (existingDoc) {
      // Update existing document - merge the week data
      document = {
        ...existingDoc,
        weeks: {
          ...existingDoc.weeks,
          [weekId]: weekData
        },
        updatedAt: new Date().toISOString()
      };
    } else {
      // Create new document
      document = {
        id: documentId,
        userId: userId,
        year: year,
        weeks: {
          [weekId]: weekData
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // Upsert the document
    context.log('💾 WRITE:', {
      container: containerName,
      partitionKey: userId,
      id: document.id,
      operation: 'upsert',
      weekId: weekId,
      goalsCount: goals.length
    });
    
    const { resource } = await weeksContainer.items.upsert(document);
    
    context.log(`✅ Successfully saved week goals for ${weekId}:`, {
      resourceId: resource.id,
      weekId: weekId,
      goalsCount: goals.length
    });
    
    context.res = {
      status: 200,
      body: JSON.stringify({ 
        success: true, 
        id: resource.id,
        weekId: weekId,
        goalsCount: goals.length
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error saving week goals:', error);
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

