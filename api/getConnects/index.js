const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'bindingData.userId',
  containerName: 'connects'
}, async (context, req, { container: connectsContainer, provider }) => {
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

  if (!userId) {
    throw { status: 400, message: 'User ID is required' };
  }

  // Get usersContainer for enrichment
  const usersContainer = provider.getContainer('users');
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
          // Try multiple ways to find the user ID for lookup
          let userIdToLookup = cleanConnect.withWhomId || 
                               (cleanConnect.withWhom && cleanConnect.withWhom.includes('@') ? cleanConnect.withWhom : null) ||
                               (cleanConnect.name && cleanConnect.name.includes('@') ? cleanConnect.name : null);
          
          let userDoc = null;
          
          // First try: Lookup by ID/email if available
          if (userIdToLookup) {
            try {
              const { resource } = await usersContainer.item(userIdToLookup, userIdToLookup).read();
              if (resource) {
                userDoc = resource;
                context.log(`✅ Found user ${userIdToLookup} by ID/email for connect ${cleanConnect.id}`);
              }
            } catch (readError) {
              // User not found by ID - will try by name below
              if (readError.code !== 404) {
                context.log.warn(`Error reading user ${userIdToLookup} by ID:`, readError.message);
              }
            }
          }
          
          // Second try: If not found by ID and we have a name, try to find by name
          if (!userDoc && cleanConnect.withWhom && !cleanConnect.withWhom.includes('@')) {
            try {
              const nameToSearch = cleanConnect.withWhom.trim();
              // Extract first name from "FirstName x LastName" format
              const firstName = nameToSearch.split(' x ')[0] || nameToSearch.split(' ')[0];
              
              // Query users by name (check both name and currentUser.name fields)
              const nameQuery = {
                query: 'SELECT * FROM c WHERE (c.name = @name OR c.currentUser.name = @name OR c.displayName = @name)',
                parameters: [{ name: '@name', value: firstName }]
              };
              
              const { resources: nameMatches } = await usersContainer.items
                .query(nameQuery, { enableCrossPartitionQuery: true })
                .fetchAll();
              
              if (nameMatches && nameMatches.length > 0) {
                // Use first match (prefer exact match if available)
                const exactMatch = nameMatches.find(u => 
                  (u.name === nameToSearch || u.currentUser?.name === nameToSearch) ||
                  (u.name === firstName || u.currentUser?.name === firstName)
                );
                userDoc = exactMatch || nameMatches[0];
                userIdToLookup = userDoc.userId || userDoc.id;
                context.log(`✅ Found user by name "${nameToSearch}" (${firstName}) for connect ${cleanConnect.id}`);
                
                // Update connect with withWhomId for future lookups
                if (!cleanConnect.withWhomId && userIdToLookup) {
                  cleanConnect.withWhomId = userIdToLookup;
                }
              }
            } catch (nameQueryError) {
              context.log.warn(`Error querying user by name for connect ${cleanConnect.id}:`, nameQueryError.message);
            }
          }
          
          // Enrich connect with user data if found
          if (userDoc) {
            // Prioritize currentUser.avatar, then user.avatar, then fallback
            const currentUser = userDoc.currentUser || {};
            const bestAvatar = currentUser.avatar || userDoc.avatar || userDoc.picture;
            const bestName = currentUser.name || userDoc.name || userDoc.displayName;
            const bestOffice = currentUser.office || userDoc.office || userDoc.officeLocation;
            
            // Always update connect with current user data if available
            // This ensures profile pictures are always up-to-date
            // Accept http, https, or blob URLs (blob URLs are used for Microsoft Graph photos)
            if (bestAvatar && typeof bestAvatar === 'string' && bestAvatar.trim()) {
              const trimmed = bestAvatar.trim();
              // Accept http, https, or blob URLs
              if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
                cleanConnect.avatar = trimmed;
                context.log(`✅ Enriched connect ${cleanConnect.id} with avatar for user ${userIdToLookup}`);
              } else {
                context.log.warn(`⚠️ Invalid avatar URL format for user ${userIdToLookup}: ${trimmed.substring(0, 50)}`);
              }
            } else {
              context.log.warn(`⚠️ No avatar found for user ${userIdToLookup} in userDoc`);
            }
            if (bestName && bestName.trim()) {
              cleanConnect.name = bestName;
              // Also update withWhom if it was just a name
              if (!cleanConnect.withWhomId && userIdToLookup) {
                cleanConnect.withWhomId = userIdToLookup;
              }
            }
            if (bestOffice && bestOffice.trim()) {
              cleanConnect.office = bestOffice;
            }
          } else {
            // No user found - log for debugging
            context.log.warn(`⚠️ Could not find user for connect ${cleanConnect.id}: withWhom="${cleanConnect.withWhom}", withWhomId="${cleanConnect.withWhomId}"`);
          }
        } catch (enrichError) {
          // Continue with stored avatar (silent fail)
          context.log.warn(`Error enriching connect ${cleanConnect.id}:`, enrichError.message);
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
  
  return cleanConnects;
});







