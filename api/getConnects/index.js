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
    
    // Query all connects for this user
    const { resources: connects } = await connectsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.when DESC',
        parameters: [{ name: '@userId', value: userId }]
      })
      .fetchAll();
    
    context.log(`Loaded ${connects.length} connects for user ${userId}`);
    
    // If no connects found with email format, try GUID format (for migration compatibility)
    if (connects.length === 0 && userId.includes('@')) {
      context.log(`No connects found with email format, checking if user has GUID-based connects...`);
      // This is a fallback - we won't query GUID format here as it requires knowing the GUID
      // Instead, we'll return empty array and let the migration handle it
    }
    
    // Clean up Cosmos metadata and enrich with current user avatars
    const cleanConnects = await Promise.all(connects.map(async (connect) => {
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
                
                context.log(`Enriched connect ${cleanConnect.id} with avatar from user ${userIdToLookup}`);
              }
            } catch (readError) {
              // User not found - use stored avatar
              if (readError.code === 404) {
                context.log(`User ${userIdToLookup} not found in users container, using stored avatar`);
              } else {
                context.log.warn(`Error reading user ${userIdToLookup}:`, readError.message);
              }
            }
          } else {
            // No user ID available for lookup - use stored avatar
            context.log(`No user ID available for connect ${cleanConnect.id}, using stored avatar`);
          }
        } catch (enrichError) {
          context.log.warn(`Could not enrich connect ${cleanConnect.id} with user avatar:`, enrichError.message);
          // Continue with stored avatar
        }
      }
      
      return cleanConnect;
    }));
    
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







