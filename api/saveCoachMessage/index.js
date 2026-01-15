const { createApiHandler } = require('../utils/apiWrapper');
const { checkTeamMembership, getUserRole } = require('../utils/authMiddleware');

module.exports = createApiHandler({
  auth: 'user',
  containerName: 'dreams'
}, async (context, req, { container: dreamsContainer, user }) => {
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

  // SECURITY: Verify caller is either the dream owner OR their coach (or admin)
  // This allows bidirectional messaging between user and their coach
  if (user.userId !== memberId) {
    // Check if user is admin or coach of this member
    const { isAdmin, isCoach } = await getUserRole(user.userId, context);
    
    if (!isAdmin) {
      // Not admin - must be coach of this specific member
      const isCoachOfMember = isCoach && await checkTeamMembership(user.userId, memberId, context);
      if (!isCoachOfMember) {
        throw { status: 403, message: 'You can only send messages to your own dreams or your team members\' dreams' };
      }
    }
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

  // Initialize coachNotes array if it doesn't exist
  if (!targetDream.coachNotes) {
    targetDream.coachNotes = [];
  }

  // Get sender's name (coach name if coachId provided, otherwise user's name)
  let senderName = null;
  if (coachId) {
    // Coach is sending - use coach's name from authenticated user
    senderName = user.name || user.displayName || null;
    context.log(`Coach message from: ${senderName} (${user.userId})`);
  }

  // Add new message
  const newMessage = {
    id: `msg_${Date.now()}`,
    message: message.trim(),
    coachId: coachId || null,
    coachName: senderName,
    timestamp: new Date().toISOString()
  };

  targetDream.coachNotes.push(newMessage);

  context.log(`Adding message to dream. Total messages: ${targetDream.coachNotes.length}`);

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
    totalMessages: targetDream.coachNotes.length
  };
});
