const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'user',
  containerName: 'dreams'
}, async (context, req, { container: dreamsContainer }) => {
  const { memberId, dreamId, message, coachId } = req.body || {};

  context.log('saveCoachMessage called:', { memberId, dreamId, coachId: coachId || 'user', messageLength: message?.length });

  if (!memberId) {
    throw { status: 400, message: 'memberId is required' };
  }

  if (!dreamId) {
    throw { status: 400, message: 'dreamId is required' };
  }

  if (!message || !message.trim()) {
    throw { status: 400, message: 'message is required' };
  }

  const documentId = memberId;
  
  context.log(`Loading dreams document for user: ${memberId}`);
  
  // Read existing dreams document
  let existingDoc;
  try {
    const { resource } = await dreamsContainer.item(documentId, memberId).read();
    existingDoc = resource;
    context.log(`Found existing dreams document`);
  } catch (error) {
    if (error.code === 404) {
      throw { status: 404, message: 'User dreams document not found' };
    }
    context.log.error(`Error reading dreams document: ${error.code} - ${error.message}`);
    throw error;
  }

  // Find the dream - try multiple ID comparison strategies
  const dreamIdStr = String(dreamId);
  
  let targetDream = existingDoc.dreams?.find(d => String(d.id) === dreamIdStr);
  
  if (!targetDream && existingDoc.dreams) {
    targetDream = existingDoc.dreams.find(d => 
      d.id === dreamId || 
      Number(d.id) === Number(dreamId)
    );
  }

  if (!targetDream) {
    context.log.error(`Dream not found. dreamId=${dreamId} (${typeof dreamId}), available dreams:`, 
      existingDoc.dreams?.map(d => ({ id: d.id, type: typeof d.id })));
    throw { status: 404, message: 'Dream not found', details: `dreamId: ${dreamId}` };
  }

  context.log(`Found dream: ${targetDream.title}`);

  // Initialize coachMessages array if it doesn't exist
  if (!targetDream.coachMessages) {
    targetDream.coachMessages = [];
  }

  // Add new message
  const newMessage = {
    id: `msg_${Date.now()}`,
    text: message.trim(),
    sender: coachId || 'user',
    timestamp: new Date().toISOString(),
    read: false
  };

  targetDream.coachMessages.push(newMessage);
  targetDream.lastMessageAt = new Date().toISOString();
  targetDream.hasUnreadMessages = true;

  context.log(`Adding message to dream. Total messages: ${targetDream.coachMessages.length}`);

  // Save updated document
  const updatedDoc = {
    ...existingDoc,
    dreams: existingDoc.dreams,
    lastUpdated: new Date().toISOString()
  };

  await dreamsContainer.item(documentId, memberId).replace(updatedDoc);
  
  context.log(`✅ Message saved successfully`);

  return {
    success: true,
    message: newMessage,
    dreamId: targetDream.id,
    totalMessages: targetDream.coachMessages.length
  };
});
