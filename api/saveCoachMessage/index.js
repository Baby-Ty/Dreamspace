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

  const { memberId, dreamId, message, coachId } = req.body || {};

  context.log('saveCoachMessage called:', { memberId, dreamId, coachId: coachId || 'user', messageLength: message?.length });

  if (!memberId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'memberId is required' }),
      headers
    };
    return;
  }

  if (!dreamId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'dreamId is required' }),
      headers
    };
    return;
  }

  if (!message || !message.trim()) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'message is required' }),
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
        context.res = {
          status: 404,
          body: JSON.stringify({ error: 'User dreams document not found' }),
          headers
        };
        return;
      }
      context.log.error(`Error reading dreams document: ${error.code} - ${error.message}`);
      throw error;
    }

    // Find the dream - try multiple ID comparison strategies
    context.log(`Looking for dream with ID: ${dreamId} (type: ${typeof dreamId})`);
    
    // Use 'dreams' as primary field (matches saveDreams API), fallback to 'dreamBook' for legacy
    // IMPORTANT: Always use the same field that exists to avoid duplicates
    const dreamsArray = existingDoc.dreams || existingDoc.dreamBook || [];
    const fieldName = existingDoc.dreams ? 'dreams' : 'dreamBook';
    
    // Check if dreams array exists
    if (!Array.isArray(dreamsArray) || dreamsArray.length === 0) {
      context.log.error(`Dreams array is missing or empty!`, {
        hasDreamBook: !!existingDoc.dreamBook,
        hasDreams: !!existingDoc.dreams,
        dreamBookType: typeof existingDoc.dreamBook,
        dreamsType: typeof existingDoc.dreams,
        documentKeys: Object.keys(existingDoc),
        dreamsLength: dreamsArray.length
      });
      context.res = {
        status: 404,
        body: JSON.stringify({ 
          error: 'Dream not found',
          details: 'dreams array not found or empty in user document'
        }),
        headers
      };
      return;
    }
    
    context.log(`Using field '${fieldName}' with ${dreamsArray.length} dreams`);
    context.log(`Available dreams (${dreamsArray.length}):`, dreamsArray.map(d => ({ 
      id: d.id, 
      idType: typeof d.id, 
      title: d.title,
      idString: String(d.id),
      idNumber: Number(d.id)
    })));
    
    const dreamIndex = dreamsArray.findIndex(d => {
      // Try exact match first (strict equality)
      if (d.id === dreamId) {
        context.log(`✅ Match found: exact match (${d.id} === ${dreamId})`);
        return true;
      }
      // Try string comparison
      if (String(d.id) === String(dreamId)) {
        context.log(`✅ Match found: string match (${String(d.id)} === ${String(dreamId)})`);
        return true;
      }
      // Try number comparison if both are numbers
      const dIdNum = Number(d.id);
      const dreamIdNum = Number(dreamId);
      if (!isNaN(dIdNum) && !isNaN(dreamIdNum) && dIdNum === dreamIdNum) {
        context.log(`✅ Match found: number match (${dIdNum} === ${dreamIdNum})`);
        return true;
      }
      return false;
    });
    
    if (dreamIndex === -1 || dreamIndex === undefined) {
      context.log.error(`Dream not found!`, {
        dreamId,
        dreamIdType: typeof dreamId,
        dreamIdString: String(dreamId),
        dreamIdNumber: Number(dreamId),
        availableDreamIds: dreamsArray.map(d => ({ 
          id: d.id, 
          type: typeof d.id,
          idString: String(d.id),
          idNumber: Number(d.id)
        })),
        dreamsLength: dreamsArray.length,
        fieldName
      });
      context.res = {
        status: 404,
        body: JSON.stringify({ 
          error: 'Dream not found',
          details: `Dream ID "${dreamId}" (type: ${typeof dreamId}) not found in user's ${fieldName}. Available IDs: ${dreamsArray.map(d => `${d.id}(${typeof d.id})`).join(', ') || 'none'}`
        }),
        headers
      };
      return;
    }
    
    context.log(`✅ Found dream at index ${dreamIndex} in '${fieldName}':`, {
      dreamId: dreamsArray[dreamIndex].id,
      dreamTitle: dreamsArray[dreamIndex].title,
      matchedDreamId: dreamId
    });

    // Create coach note message
    const coachNote = {
      id: `coach_note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      coachId: coachId || null, // null for user messages, coachId for coach messages
      message: message.trim(),
      timestamp: new Date().toISOString()
    };

    // IMPORTANT: Always update the same field that exists (dreams or dreamBook)
    // Never create both fields to avoid duplicates
    const targetArray = existingDoc.dreams || existingDoc.dreamBook;
    
    // Add message to coachNotes array (create array if it doesn't exist)
    if (!targetArray[dreamIndex].coachNotes) {
      targetArray[dreamIndex].coachNotes = [];
    }
    
    targetArray[dreamIndex].coachNotes.push(coachNote);
    targetArray[dreamIndex].updatedAt = new Date().toISOString();
    existingDoc.updatedAt = new Date().toISOString();
    
    // IMPORTANT: Always remove 'dreamBook' field if 'dreams' exists to prevent duplicates
    // Use 'dreams' as the single source of truth
    if (existingDoc.dreams && existingDoc.dreamBook) {
      context.log(`⚠️ Document has both 'dreams' and 'dreamBook' fields. Removing 'dreamBook' to prevent duplicates.`);
      delete existingDoc.dreamBook;
    }
    
    // If we used dreamBook, migrate it to dreams and remove dreamBook
    if (fieldName === 'dreamBook' && !existingDoc.dreams) {
      context.log(`⚠️ Migrating 'dreamBook' to 'dreams' field`);
      existingDoc.dreams = existingDoc.dreamBook;
      delete existingDoc.dreamBook;
    }

    context.log('💾 WRITE:', {
      container: 'dreams',
      partitionKey: memberId,
      id: documentId,
      operation: 'upsert',
      dreamId: dreamId,
      coachNoteId: coachNote.id,
      isCoachMessage: !!coachId
    });

    // Upsert the updated document
    const { resource } = await dreamsContainer.items.upsert(existingDoc);
    
    context.log(`✅ Successfully saved coach message to dream ${dreamId} for user ${memberId}`);
    
    // Get updated dreams array (use same field that was updated)
    const updatedDreamsArray = resource.dreams || resource.dreamBook || [];
    const updatedDream = updatedDreamsArray[dreamIndex];
    
    context.res = {
      status: 200,
      body: JSON.stringify({ 
        success: true, 
        coachNote,
        coachNotes: updatedDream?.coachNotes || []
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error saving coach message:', error);
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

