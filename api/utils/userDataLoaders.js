/**
 * Data loading utilities for getUserData endpoint
 * Keeps main handler clean and focused
 */

// Helper to clean Cosmos metadata from documents
function cleanCosmosMetadata(doc) {
  const { _rid, _self, _etag, _attachments, _ts, userId, ...cleanDoc } = doc;
  // Keep the type field - it's essential for filtering templates vs instances
  return cleanDoc;
}

// Load and validate user profile
async function loadUserProfile(usersContainer, userId, context) {
  try {
    const { resource } = await usersContainer.item(userId, userId).read();
    context.log(`✅ Profile read successfully for userId: ${userId}`, {
      hasCardBackgroundImage: !!resource.cardBackgroundImage,
      cardBackgroundImage: resource.cardBackgroundImage ? resource.cardBackgroundImage.substring(0, 80) : 'undefined',
      profileKeys: Object.keys(resource).filter(k => !k.startsWith('_')).join(', ')
    });
    
    // Validate profile
    if (!resource || !resource.id) {
      throw new Error('Invalid profile data: missing id field');
    }
    
    return resource;
  } catch (error) {
    if (error.code === 404) {
      context.log(`⚠️ User profile not found for userId: ${userId}`);
      return null;
    }
    throw error;
  }
}

// Load connects (both sender and recipient), deduplicate, and sort
async function loadConnects(connectsContainer, userId, context) {
  try {
    // Query 1: Sender connects (in user's partition)
    const senderQuery = await connectsContainer.items.query({
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: userId }]
    }).fetchAll();
    const senderConnects = senderQuery.resources || [];
    context.log(`Found ${senderConnects.length} connects where user is sender`);
    
    // Query 2: Recipient connects (cross-partition query)
    const recipientQuery = await connectsContainer.items.query({
      query: 'SELECT * FROM c WHERE IS_DEFINED(c.withWhomId) AND c.withWhomId = @userId',
      parameters: [{ name: '@userId', value: userId }]
    }, { enableCrossPartitionQuery: true }).fetchAll();
    const recipientConnects = recipientQuery.resources || [];
    context.log(`Found ${recipientConnects.length} connects where user is recipient`);
    
    // Combine and deduplicate
    const seenIds = new Set();
    const connects = [];
    senderConnects.forEach(c => {
      if (!seenIds.has(c.id)) {
        connects.push(c);
        seenIds.add(c.id);
      }
    });
    recipientConnects.forEach(c => {
      if (!seenIds.has(c.id)) {
        connects.push(c);
        seenIds.add(c.id);
      }
    });
    
    // Sort in JavaScript (more reliable than SQL ORDER BY with nullable fields)
    connects.sort((a, b) => {
      const aCreated = new Date(a.createdAt || 0).getTime();
      const bCreated = new Date(b.createdAt || 0).getTime();
      if (aCreated !== bCreated) return bCreated - aCreated;
      
      const aWhen = a.when ? new Date(a.when).getTime() : 0;
      const bWhen = b.when ? new Date(b.when).getTime() : 0;
      if (aWhen !== bWhen) return bWhen - aWhen;
      
      return (b.id || '').localeCompare(a.id || '');
    });
    
    context.log(`Loaded ${connects.length} connects (${senderConnects.length} sent, ${recipientConnects.length} received)`);
    
    // Clean Cosmos metadata
    return connects.map(cleanCosmosMetadata);
  } catch (error) {
    context.log.warn(`⚠️ Failed to load connects: ${error.message}`);
    return [];
  }
}

// Load aggregated dreams document
async function loadDreamsDocument(dreamsContainer, userId, context) {
  try {
    const { resource } = await dreamsContainer.item(userId, userId).read();
    context.log(`✅ Loaded aggregated dreams document for ${userId}`);
    return resource;
  } catch (error) {
    if (error.code === 404) {
      context.log(`No dreams document found for ${userId}`);
      return null;
    }
    throw error;
  }
}

module.exports = {
  cleanCosmosMetadata,
  loadUserProfile,
  loadConnects,
  loadDreamsDocument
};
