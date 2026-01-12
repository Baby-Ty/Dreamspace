const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'bindingData.userId',
  containerName: 'scoring'
}, async (context, req, { container }) => {
  const userId = context.bindingData.userId;
  const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

  if (!userId) {
    throw { status: 400, message: 'User ID is required' };
  }

  const documentId = `${userId}_${year}_scoring`;
  
  // Try to read the document
  try {
    const { resource } = await container.item(documentId, userId).read();
    
    context.log(`Loaded scoring document for user ${userId} year ${year}`, 'Total score:', resource.totalScore);
    
    // Clean up Cosmos metadata
    const { _rid, _self, _etag, _attachments, _ts, ...cleanDoc } = resource;
    
    return cleanDoc;
  } catch (error) {
    if (error.code === 404) {
      // Document doesn't exist yet - return empty structure
      context.log(`No scoring document found for user ${userId} year ${year}`);
      return {
        id: documentId,
        userId: userId,
        year: year,
        totalScore: 0,
        entries: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else {
      throw error;
    }
  }
});










