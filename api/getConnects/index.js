const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos client only if environment variables are present
let client, database, connectsContainer, usersContainer;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  connectsContainer = database.container('connects');
  usersContainer = database.container('users');
}

module.exports = async function (context, req) {
  // Decode userId from URL (handles email encoding)
  let userId = context.bindingData.userId;
  if (userId) {
    try {
      userId = decodeURIComponent(userId);
    } catch (e) {
      // If decoding fails, use original
      context.log.warn('Failed to decode userId, using as-is:', userId);
    }
  }

  // Set CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'User ID is required' }),
      headers
    };
    return;
  }

  // Check if Cosmos DB is configured
  if (!connectsContainer) {
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
    context.log(`Querying connects for userId: ${userId}`);
    
    let connects = [];
    
    // Query 1: Connects where user is the sender (userId matches)
    try {
      // Simplified query - order by createdAt only (more reliable than when field)
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.userId = @userId',
        parameters: [{ name: '@userId', value: userId }]
      };
      
      // Query connects - Cosmos DB will automatically use partition key from WHERE clause
      const queryResult = await connectsContainer.items
        .query(querySpec)
        .fetchAll();
      
      // Sort in JavaScript after fetching (more reliable than SQL ORDER BY with nullable fields)
      const senderConnects = (queryResult.resources || []).sort((a, b) => {
        // Sort by createdAt first (most reliable), then by when, then by id
        const aCreated = new Date(a.createdAt || 0).getTime();
        const bCreated = new Date(b.createdAt || 0).getTime();
        if (aCreated !== bCreated) return bCreated - aCreated;
        
        const aWhen = a.when ? new Date(a.when).getTime() : 0;
        const bWhen = b.when ? new Date(b.when).getTime() : 0;
        if (aWhen !== bWhen) return bWhen - aWhen;
        
        return (b.id || '').localeCompare(a.id || '');
      });
      
      context.log(`Found ${senderConnects.length} connects where user is sender`);
      
      connects = connects.concat(senderConnects);
    } catch (queryError) {
      context.log.error(`Error querying connects where user is sender:`, {
        message: queryError.message,
        code: queryError.code,
        stack: queryError.stack
      });
    }
    
    // Query 2: Connects where user is the recipient (withWhomId matches)
    // This requires cross-partition query since connects are stored in sender's partition
    // Split into separate queries to avoid OR clause issues with Cosmos DB
    let recipientConnects = [];
    try {
      // Query by withWhomId (the actual user ID/email)
      // Use IS_DEFINED to ensure the field exists and is not null
      const recipientQuerySpec = {
        query: 'SELECT * FROM c WHERE IS_DEFINED(c.withWhomId) AND c.withWhomId = @userId',
        parameters: [{ name: '@userId', value: userId }]
      };
      
      // Cross-partition query (no partitionKey specified) to find connects where user is recipient
      // Must explicitly enable cross-partition queries for this to work
      const queryOptions = { 
        enableCrossPartitionQuery: true,
        maxItemCount: 100
      };
      
      const recipientQueryResult = await connectsContainer.items
        .query(recipientQuerySpec, queryOptions)
        .fetchAll();
      
      recipientConnects = recipientQueryResult.resources || [];
      
      // Sort in JavaScript after fetching
      recipientConnects = recipientConnects.sort((a, b) => {
        const aCreated = new Date(a.createdAt || 0).getTime();
        const bCreated = new Date(b.createdAt || 0).getTime();
        if (aCreated !== bCreated) return bCreated - aCreated;
        
        const aWhen = a.when ? new Date(a.when).getTime() : 0;
        const bWhen = b.when ? new Date(b.when).getTime() : 0;
        if (aWhen !== bWhen) return bWhen - aWhen;
        
        return (b.id || '').localeCompare(a.id || '');
      });
      
      // Add recipient connects that aren't already in the list (deduplicate)
      const existingIds = new Set(connects.map(c => c.id));
      recipientConnects.forEach(rc => {
        if (!existingIds.has(rc.id)) {
          connects.push(rc);
        }
      });
    } catch (queryError) {
      context.log.error(`Error querying connects where user is recipient:`, {
        message: queryError.message,
        code: queryError.code
      });
    }
    
    context.log(`Total connects loaded: ${connects.length}`);
    
    // Clean up Cosmos metadata and enrich with current user avatars
    // Use Promise.allSettled to handle individual enrichment errors gracefully
    const cleanConnectsPromises = connects.map(async (connect) => {
      try {
        const { _rid, _self, _etag, _attachments, _ts, ...cleanConnect } = connect;
        
        // Enrich with current avatar from users container
        // Use withWhomId if available (user's email/ID), otherwise try withWhom if it's an email
        if (usersContainer) {
          try {
            const userIdToLookup = cleanConnect.withWhomId || 
                                   (cleanConnect.withWhom && cleanConnect.withWhom.includes('@') ? cleanConnect.withWhom : null);
            
            if (userIdToLookup) {
              try {
                const { resource: userDoc } = await usersContainer.item(userIdToLookup, userIdToLookup).read();
                if (userDoc) {
                  // Prioritize currentUser.avatar, then user.avatar, then fallback
                  const currentUser = userDoc.currentUser || {};
                  const bestAvatar = currentUser.avatar || userDoc.avatar || userDoc.picture;
                  const bestName = currentUser.name || userDoc.name || userDoc.displayName;
                  const bestOffice = currentUser.office || userDoc.office || userDoc.officeLocation;
                  
                  // Update connect with current user data from blob storage
                  if (bestAvatar) {
                    cleanConnect.avatar = bestAvatar;
                  }
                  if (bestName) {
                    cleanConnect.name = bestName;
                  }
                  if (bestOffice) {
                    cleanConnect.office = bestOffice;
                  }
                }
              } catch (readError) {
                // User not found - use stored avatar (silent fail for 404)
                if (readError.code !== 404) {
                  context.log.warn(`Error reading user ${userIdToLookup}:`, readError.message);
                }
              }
            }
          } catch (enrichError) {
            // Continue with stored avatar (silent fail)
          }
        }
        
        return cleanConnect;
      } catch (error) {
        // If cleaning fails for a single connect, return a minimal version
        context.log.warn(`Error processing connect ${connect.id || 'unknown'}:`, error.message);
        const { _rid, _self, _etag, _attachments, _ts, ...minimalConnect } = connect;
        return minimalConnect;
      }
    });
    
    const cleanConnectsResults = await Promise.allSettled(cleanConnectsPromises);
    const cleanConnects = cleanConnectsResults
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value)
      .filter(Boolean); // Remove any null/undefined values
    
    context.log(`Returning ${cleanConnects.length} connects for user ${userId}`);
    
    context.res = {
      status: 200,
      body: JSON.stringify(cleanConnects),
      headers
    };
  } catch (error) {
    context.log.error('Error loading connects:', {
      userId: userId,
      errorMessage: error.message,
      errorCode: error.code,
      errorStack: error.stack
    });
    
    // Return more detailed error for debugging
    const errorDetails = {
      error: 'Internal server error',
      details: error.message,
      userId: userId,
      code: error.code
    };
    
    context.res = {
      status: 500,
      body: JSON.stringify(errorDetails),
      headers
    };
  }
};







