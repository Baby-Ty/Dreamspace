const { CosmosClient } = require('@azure/cosmos');
const { requireUserAccess, isAuthRequired, getCorsHeaders } = require('../utils/authMiddleware');

// Initialize Cosmos client only if environment variables are present
let client, database, scoringContainer;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  scoringContainer = database.container('scoring');
}

module.exports = async function (context, req) {
  // Set CORS headers
  const headers = getCorsHeaders();

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  const { userId, year, entry } = req.body || {};

  context.log('Saving scoring entry:', { userId, year, entry });

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'userId is required' }),
      headers
    };
    return;
  }

  // AUTH CHECK: Users can only save their own scoring data
  if (isAuthRequired()) {
    const user = await requireUserAccess(context, req, userId);
    if (!user) return; // 401 or 403 already sent
    context.log(`User ${user.email} saving scoring for ${userId}`);
  }

  if (!year) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'year is required' }),
      headers
    };
    return;
  }

  if (!entry) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'entry is required' }),
      headers
    };
    return;
  }

  // Check if Cosmos DB is configured
  if (!scoringContainer) {
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
    const documentId = `${userId}_${year}_scoring`;
    
    // Try to read existing document
    let existingDoc;
    try {
      const { resource } = await scoringContainer.item(documentId, userId).read();
      existingDoc = resource;
    } catch (error) {
      if (error.code !== 404) {
        throw error;
      }
      // Document doesn't exist yet, will create new one
      context.log(`Creating new scoring document for ${userId} year ${year}`);
    }

    // Prepare the new entry
    const newEntry = {
      id: entry.id || `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: entry.date || new Date().toISOString().split('T')[0],
      source: entry.source, // 'dream', 'week', 'connect', 'milestone'
      dreamId: entry.dreamId,
      weekId: entry.weekId,
      connectId: entry.connectId,
      points: entry.points,
      activity: entry.activity,
      createdAt: entry.createdAt || new Date().toISOString()
    };

    let document;
    if (existingDoc) {
      // Update existing document - add entry and update total
      document = {
        ...existingDoc,
        totalScore: existingDoc.totalScore + newEntry.points,
        entries: [...existingDoc.entries, newEntry],
        updatedAt: new Date().toISOString()
      };
    } else {
      // Create new document
      document = {
        id: documentId,
        userId: userId,
        year: year,
        totalScore: newEntry.points,
        entries: [newEntry],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // Upsert the document
    context.log('💾 WRITE:', {
      container: 'scoring',
      partitionKey: userId,
      id: document.id,
      operation: 'upsert',
      entryId: newEntry.id,
      points: newEntry.points
    });
    
    const { resource } = await scoringContainer.items.upsert(document);
    
    context.log(`Successfully saved scoring entry:`, resource.id, 'Total score:', resource.totalScore);
    
    context.res = {
      status: 200,
      body: JSON.stringify({ 
        success: true, 
        id: resource.id,
        entryId: newEntry.id,
        totalScore: resource.totalScore
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error saving scoring entry:', error);
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

