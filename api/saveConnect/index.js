const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'user',
  containerName: 'connects'
}, async (context, req, { container, user }) => {
  if (user) {
    context.log(`User ${user.email} saving connect`);
  }

  const { userId, connectData } = req.body || {};

  context.log('Saving connect:', { userId, connectId: connectData?.id });

  if (!connectData) {
    throw { status: 400, message: 'connectData is required' };
  }

  // Use the connect's userId (sender's ID) as partition key, not the request userId
  // This ensures connects stay in the sender's partition even when recipient updates them
  const partitionUserId = connectData.userId || userId;
  
  if (!partitionUserId) {
    throw { status: 400, message: 'userId is required in connectData' };
  }
    // Create the connect document
    const connectId = connectData.id 
      ? String(connectData.id) 
      : `connect_${partitionUserId}_${Date.now()}`;
    
    // Save all fields from connectData to preserve complete connect information
    // Use partitionUserId (sender's ID) to keep connect in correct partition
    const document = {
      id: connectId,
      userId: partitionUserId, // Always use sender's userId as partition key
      type: connectData.type || 'connect',
      // Core fields
      withWhom: connectData.withWhom,
      withWhomId: connectData.withWhomId,
      when: connectData.when,
      notes: connectData.notes || '',
      status: connectData.status || 'pending',
      // Scheduling fields
      agenda: connectData.agenda,
      proposedWeeks: connectData.proposedWeeks || [],
      schedulingMethod: connectData.schedulingMethod,
      // Optional fields
      dreamId: connectData.dreamId || undefined,
      // Display metadata (preserved for UI consistency)
      name: connectData.name,
      category: connectData.category,
      avatar: connectData.avatar,
      office: connectData.office,
      // Timestamps
      createdAt: connectData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

  // Upsert the connect using sender's userId as partition key
  context.log('💾 WRITE:', {
    container: 'connects',
    partitionKey: partitionUserId,
    id: document.id,
    operation: 'upsert',
    note: 'Using sender userId as partition key for both sender and recipient updates'
  });
  
  // Upsert using the partition key - Cosmos DB SDK will use document.userId automatically
  const { resource } = await container.items.upsert(document);
  
  context.log('Successfully saved connect:', resource.id);
  
  return { 
    success: true, 
    id: resource.id,
    connect: resource
  };
});

