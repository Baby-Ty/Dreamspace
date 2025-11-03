const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos client only if environment variables are present
let client, database, dreamsContainer;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  dreamsContainer = database.container('dreams');
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

  const { userId, dreams, weeklyGoalTemplates } = req.body || {};

  context.log('saveDreams called:', { userId, dreamsCount: dreams?.length, templatesCount: weeklyGoalTemplates?.length });

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'userId is required' }),
      headers
    };
    return;
  }

  if (!Array.isArray(dreams)) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'dreams array is required' }),
      headers
    };
    return;
  }

  // weeklyGoalTemplates is optional - can be empty array
  if (weeklyGoalTemplates && !Array.isArray(weeklyGoalTemplates)) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'weeklyGoalTemplates must be an array if provided' }),
      headers
    };
    return;
  }

  // Check if Cosmos DB is configured
  if (!dreamsContainer) {
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
    const documentId = userId;
    
    context.log(`Saving dreams document for user: ${userId}`);
    
    // Try to read existing document
    let existingDoc;
    try {
      const { resource } = await dreamsContainer.item(documentId, userId).read();
      existingDoc = resource;
      context.log(`Found existing dreams document`);
    } catch (error) {
      if (error.code !== 404) {
        context.log.error(`Error reading dreams document: ${error.code} - ${error.message}`);
        throw error;
      }
      context.log(`Creating new dreams document for ${userId}`);
    }

    // Prepare the document - simplified structure with goals instead of milestones
    const document = {
      id: documentId,
      userId: userId,
      dreams: dreams.map(dream => ({
        id: dream.id,
        title: dream.title,
        description: dream.description || '',
        category: dream.category,
        goals: (dream.goals || []).map(goal => ({
          id: goal.id,
          title: goal.title,
          description: goal.description || '',
          type: goal.type || 'general',
          recurrence: goal.recurrence,
          targetWeeks: goal.targetWeeks,
          targetMonths: goal.targetMonths,
          startDate: goal.startDate,
          targetDate: goal.targetDate,
          active: goal.active !== false,
          completed: goal.completed || false,
          completedAt: goal.completedAt,
          createdAt: goal.createdAt || new Date().toISOString()
        })),
        progress: dream.progress || 0,
        targetDate: dream.targetDate,
        image: dream.image || dream.picture, // Support both image (new) and picture (legacy)
        notes: dream.notes || [],
        history: dream.history || [],
        completed: dream.completed || false,
        createdAt: dream.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })),
      weeklyGoalTemplates: (weeklyGoalTemplates || []).map(template => ({
        id: template.id,
        title: template.title,
        description: template.description,
        dreamId: template.dreamId,
        dreamTitle: template.dreamTitle,
        dreamCategory: template.dreamCategory,
        goalId: template.goalId, // Changed from milestoneId
        recurrence: template.recurrence || 'weekly',
        active: template.active !== false,
        durationType: template.durationType || 'unlimited',
        durationWeeks: template.durationWeeks,
        startDate: template.startDate,
        createdAt: template.createdAt || new Date().toISOString()
      })),
      createdAt: existingDoc?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    context.log('💾 WRITE:', {
      container: 'dreams',
      partitionKey: userId,
      id: document.id,
      operation: 'upsert',
      dreamsCount: dreams.length
    });

    // Upsert the document
    const { resource } = await dreamsContainer.items.upsert(document);
    
    context.log(`✅ Successfully saved dreams document for ${userId}`);
    
    context.res = {
      status: 200,
      body: JSON.stringify({ 
        success: true, 
        id: resource.id,
        dreamsCount: dreams.length,
        templatesCount: weeklyGoalTemplates?.length || 0
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error saving dreams:', error);
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

