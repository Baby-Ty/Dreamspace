const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'body.userId',
  containerName: 'dreams'
}, async (context, req, { container: dreamsContainer }) => {
  const { userId, yearVision: rawVision } = req.body || {};

  // Ensure yearVision is always a string - sanitize input
  const yearVision = typeof rawVision === 'string' ? rawVision : '';

  context.log('saveYearVision called:', { userId, visionLength: yearVision?.length });

  if (!userId) {
    throw { status: 400, message: 'userId is required' };
  }

  const documentId = userId;
  
  context.log(`Saving year vision for user: ${userId}`);
  
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

  // Prepare the document - preserve existing data, add/update yearVision
  const document = {
    ...(existingDoc || {}),
    id: documentId,
    userId: userId,
    yearVision: yearVision,
    // Preserve existing fields or set defaults
    dreams: existingDoc?.dreams || [],
    weeklyGoalTemplates: existingDoc?.weeklyGoalTemplates || [],
    createdAt: existingDoc?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  context.log('💭 WRITE:', {
    container: 'dreams',
    partitionKey: userId,
    id: document.id,
    operation: 'upsert (yearVision)',
    visionLength: yearVision.length
  });

  // Upsert the document
  const { resource } = await dreamsContainer.items.upsert(document);
  
  context.log(`✅ Successfully saved year vision for ${userId}`);
  
  return { 
    success: true, 
    id: resource.id
  };
});
