const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'body.userId',
  containerName: 'scoring'
}, async (context, req, { container }) => {
  const { userId, year, entry } = req.body || {};

  context.log('Saving scoring entry:', { userId, year, entry });

  if (!userId) {
    throw { status: 400, message: 'userId is required' };
  }

  if (!year) {
    throw { status: 400, message: 'year is required' };
  }

  if (!entry) {
    throw { status: 400, message: 'entry is required' };
  }
  const documentId = `${userId}_${year}_scoring`;
  
  // Try to read existing document
  let existingDoc;
  try {
    const { resource } = await container.item(documentId, userId).read();
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
  
  const { resource } = await container.items.upsert(document);
  
  context.log(`Successfully saved scoring entry:`, resource.id, 'Total score:', resource.totalScore);
  
  return { 
    success: true, 
    id: resource.id,
    entryId: newEntry.id,
    totalScore: resource.totalScore
  };
});

