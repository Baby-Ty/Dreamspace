const { createApiHandler } = require('../utils/apiWrapper');

// Helper to determine if data is in old monolithic format
function isOldFormat(userData) {
  // Check if data has currentUser wrapper (from AppContext)
  if (userData.currentUser) {
    return !!(userData.currentUser.dreamBook || userData.weeklyGoals || userData.scoringHistory || 
              userData.currentUser.connects);
  }
  
  // Check direct properties (legacy format)
  return !!(userData.dreamBook || userData.weeklyGoals || userData.scoringHistory || 
            userData.connects);
}

// Helper to extract profile data (no arrays, no career fields)
function extractProfile(userData) {
  // If data is wrapped in currentUser, unwrap it
  const userProfile = userData.currentUser || userData;
  
  // Remove all array fields, career-related fields, and yearVision (6-container architecture)
  // yearVision belongs in dreams container, not users container
  const {
    dreamBook, weeklyGoals, scoringHistory, connects,
    careerGoals, developmentPlan, careerProfile, // Career fields removed
    yearVision, // Remove - belongs in dreams container
    isAuthenticated, // Remove this from profile
    ...profile
  } = userProfile;
  
  return {
    ...profile,
    dataStructureVersion: 3, // Use v3 for 6-container architecture
    currentYear: new Date().getFullYear(),
    lastUpdated: new Date().toISOString()
  };
}

// Helper to extract items from arrays
function extractItems(userId, userData) {
  const items = [];
  const timestamp = Date.now();
  
  // Handle wrapped format (currentUser property)
  const userProfile = userData.currentUser || userData;
  const weeklyGoals = userData.weeklyGoals || userProfile.weeklyGoals || [];
  const scoringHistory = userData.scoringHistory || userProfile.scoringHistory || [];
  
  // Extract dreams
  if (userProfile.dreamBook && Array.isArray(userProfile.dreamBook)) {
    userProfile.dreamBook.forEach((dream, index) => {
      items.push({
        type: 'dream',
        data: {
          ...dream,
          id: dream.id ? String(dream.id) : `dream_${userId}_${timestamp}_${index}`
        }
      });
    });
  }
  
  // Extract weekly goals (can be at top level or in currentUser)
  if (Array.isArray(weeklyGoals)) {
    weeklyGoals.forEach((goal, index) => {
      items.push({
        type: 'weekly_goal',
        data: {
          ...goal,
          id: goal.id ? String(goal.id) : `weekly_goal_${userId}_${timestamp}_${index}`
        }
      });
    });
  }
  
  // Extract scoring history (can be at top level or in currentUser)
  if (Array.isArray(scoringHistory)) {
    scoringHistory.forEach((entry, index) => {
      items.push({
        type: 'scoring_entry',
        data: {
          ...entry,
          id: entry.id ? String(entry.id) : `scoring_entry_${userId}_${timestamp}_${index}`
        }
      });
    });
  }
  
  // Extract connects
  if (userProfile.connects && Array.isArray(userProfile.connects)) {
    userProfile.connects.forEach((connect, index) => {
      items.push({
        type: 'connect',
        data: {
          ...connect,
          id: connect.id ? String(connect.id) : `connect_${userId}_${timestamp}_${index}`
        }
      });
    });
  }
  
  // Career goals and development plan removed - not in this version
  // They would go to their own dedicated containers if re-enabled in future
  
  return items;
}

module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'bindingData.userId'
}, async (context, req, { provider }) => {
  const userId = context.bindingData.userId;
  const userData = req.body;

  context.log('Saving user data for userId:', userId);

  if (!userId) {
    throw { status: 400, message: 'User ID is required' };
  }

  if (!userData) {
    throw { status: 400, message: 'User data is required' };
  }

  // Get containers
  const usersContainer = provider.getContainer('users');
  const dreamsContainer = provider.getContainer('dreams');
  // Check if user already exists and what version they're on
  let existingProfile;
  try {
    const { resource } = await usersContainer.item(userId, userId).read();
    existingProfile = resource;
  } catch (error) {
    if (error.code !== 404) {
      throw error;
    }
    // User doesn't exist yet, will create below
  }
  
  // If user is already on v2+ (or v3) OR data has dataStructureVersion >= 2, just update profile
  const isV2Plus = existingProfile?.dataStructureVersion >= 2 || userData.dataStructureVersion >= 2;
  
  if (isV2Plus) {
    context.log('User on v2+ architecture, updating profile only (items managed separately)');
    
    // Extract profile data without arrays (6-container architecture - no career fields)
    // yearVision belongs in dreams container, not users container
    const userProfile = userData.currentUser || userData;
    const {
      dreamBook, weeklyGoals, scoringHistory, connects,
      yearVision, // Remove - belongs in dreams container
      isAuthenticated, // Remove this from profile
      _rid, _self, _etag, _attachments, _ts, // Remove Cosmos metadata
      ...profileData
    } = userProfile;
    
    // Remove yearVision from existing profile if it exists (should be in dreams container, not users)
    const { yearVision: _, ...existingProfileClean } = existingProfile || {};
    
    const updatedProfile = {
      ...existingProfileClean, // Keep existing data (without yearVision)
      ...profileData, // Merge updates
      // Explicitly preserve cardBackgroundImage from existing profile if not in profileData
      cardBackgroundImage: profileData.cardBackgroundImage !== undefined 
        ? profileData.cardBackgroundImage 
        : (existingProfileClean?.cardBackgroundImage || undefined),
      id: userId,
      userId: userId,
      dataStructureVersion: 3, // Use version 3 for 6-container architecture
      currentYear: new Date().getFullYear(),
      lastUpdated: new Date().toISOString()
    };
    
    context.log('💾 WRITE:', {
      container: 'users',
      partitionKey: userId,
      id: updatedProfile.id,
      operation: 'upsert',
      dataStructureVersion: 3,
      cardBackgroundImage: updatedProfile.cardBackgroundImage ? updatedProfile.cardBackgroundImage.substring(0, 80) : 'undefined',
      hadInExisting: !!existingProfile?.cardBackgroundImage,
      hadInProfileData: profileData.cardBackgroundImage !== undefined
    });
    
    await usersContainer.items.upsert(updatedProfile);
    context.log('✅ Profile updated (v3), items managed via dedicated services');
    
    return { 
      success: true, 
      id: userId,
      format: 'v3-profile-only'
    };
  }
  
  // Check if this is old format data that needs to be split
  if (isOldFormat(userData)) {
    context.log('Detected old format data, splitting into profile and items');
    
    // Extract profile without arrays
    const profile = extractProfile(userData);
    profile.id = userId;
    profile.userId = userId;
    profile.dataStructureVersion = 3; // Set to v3 for 6-container architecture
    profile.currentYear = new Date().getFullYear();
    // Preserve cardBackgroundImage from existing profile if not in extracted profile
    if (existingProfile?.cardBackgroundImage && !profile.cardBackgroundImage) {
      profile.cardBackgroundImage = existingProfile.cardBackgroundImage;
    }
    
    // Save profile to users container
    context.log('💾 WRITE:', {
      container: 'users',
      partitionKey: userId,
      id: profile.id,
      operation: 'upsert',
      dataStructureVersion: 3
    });
    
    const { resource: profileResource } = await usersContainer.items.upsert(profile);
    context.log('Profile saved:', profileResource.id);
    
    // Extract items from arrays
    const items = extractItems(userId, userData);
    context.log(`Extracted ${items.length} items from user data`);
    
    // Save items to dreams container (only dreams and templates go here now)
    if (items.length > 0) {
      const savedItems = [];
      for (const item of items) {
        // Only save dreams and templates to dreams container
        // Other types should use their dedicated containers
        if (item.type === 'dream' || item.type === 'weekly_goal_template') {
          // Ensure id is always a string (Cosmos DB requirement)
          const itemId = String(item.data.id);
          
          const document = {
            id: itemId,
            userId: userId,
            type: item.type,
            ...item.data,
            createdAt: item.data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          context.log('💾 WRITE:', {
            container: 'dreams',
            partitionKey: userId,
            id: document.id,
            operation: 'upsert',
            type: item.type
          });
          
          const { resource } = await dreamsContainer.items.upsert(document);
          savedItems.push(resource.id);
        } else {
          context.log(`⚠️ Skipping item type ${item.type} - should use dedicated container`);
        }
      }
      context.log(`Saved ${savedItems.length} items to dreams container`);
    }
    
    return { 
      success: true, 
      id: profileResource.id,
      format: 'split',
      itemCount: items.length
    };
  } else {
    // New format - just save as profile (or handle explicit split format)
    context.log('Saving data in new format');
    
    const document = {
      id: userId,
      userId: userId,
      ...userData,
      dataStructureVersion: userData.dataStructureVersion || 3, // Default to v3 for new saves
      currentYear: new Date().getFullYear(),
      lastUpdated: new Date().toISOString()
    };

    context.log('💾 WRITE:', {
      container: 'users',
      partitionKey: userId,
      id: document.id,
      operation: 'upsert',
      dataStructureVersion: document.dataStructureVersion
    });

    const { resource } = await usersContainer.items.upsert(document);
    
    context.log('Successfully saved user profile:', resource.id);
    
    return { 
      success: true, 
      id: resource.id,
      format: 'profile'
    };
  }
});
