import { useCallback } from 'react';
import databaseService from '../services/databaseService';
import { determineOfficeFromProfile } from './roleUtils';

/**
 * Hook for managing user profile data
 * Handles profile fetching from Graph, database sync, and avatar management
 */
export function useUserProfile(graph) {
  /**
   * Fetch and build user profile from Microsoft Graph and database
   * @param {object} account - MSAL account
   * @returns {Promise<object|null>} User data object or null
   */
  const fetchUserProfile = useCallback(async (account) => {
    console.log('🔄 Fetching user profile for:', account.name);
    
    // Call Microsoft Graph to get user profile
    console.log('📞 Calling Microsoft Graph API...');
    const profileResult = await graph.getMe();

    if (!profileResult.success) {
      console.error('Failed to fetch profile:', profileResult.error);
      throw new Error(profileResult.error.message);
    }

    const profileData = profileResult.data;
    const userId = profileData.userPrincipalName || profileData.mail || account.username;
    
    // Get avatar URL
    let avatarUrl = await fetchAvatarUrl(graph, profileData, userId);

    // Create fresh profile for authenticated users
    let userData = {
      id: userId,
      aadObjectId: account.localAccountId,
      name: profileData.displayName,
      email: profileData.mail || profileData.userPrincipalName,
      office: determineOfficeFromProfile(profileData),
      avatar: avatarUrl,
      dreamBook: [],
      careerGoals: [],
      developmentPlan: [],
      score: 0,
      connects: [],
      dreamsCount: 0,
      connectsCount: 0
    };

    // Check if user data already exists and merge/create
    userData = await syncUserWithDatabase(userData, avatarUrl, graph);
    
    return userData;
  }, [graph]);

  /**
   * Create fallback user data from basic account info
   * @param {object} account - MSAL account
   * @returns {object} Basic user data
   */
  const createFallbackUser = useCallback((account) => {
    console.log('🔄 Using fallback basic user info');
    const emailId = account.username || account.userPrincipalName || account.localAccountId;
    return {
      id: emailId,
      aadObjectId: account.localAccountId,
      name: account.name,
      email: account.username || account.userPrincipalName,
      office: 'Remote',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=EC4B5C&color=fff&size=100`,
      dreamBook: [],
      careerGoals: [],
      developmentPlan: [],
      score: 0,
      connects: [],
      dreamsCount: 0,
      connectsCount: 0
    };
  }, []);

  /**
   * Refresh user data from database
   * @param {string} userId - User ID
   * @param {object} currentUserData - Current user data to merge with
   * @returns {Promise<object|null>} Updated user data
   */
  const refreshFromDatabase = useCallback(async (userId, currentUserData) => {
    try {
      console.log('🔄 Refreshing user data from database...');
      const existingData = await databaseService.loadUserData(userId);
      
      if (existingData && existingData.success && existingData.data) {
        const existingUser = existingData.data.currentUser || existingData.data;
        return {
          ...currentUserData,
          role: existingUser.role,
          isCoach: existingUser.isCoach,
          roles: existingUser.roles
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
      return null;
    }
  }, []);

  return { fetchUserProfile, createFallbackUser, refreshFromDatabase };
}

// Helper: Fetch avatar URL from Graph and upload to blob storage
async function fetchAvatarUrl(graph, profileData, userId) {
  let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.displayName)}&background=EC4B5C&color=fff&size=100`;
  
  console.log('📸 Attempting to fetch and upload profile picture from Microsoft Graph...');
  const uploadResult = await graph.uploadMyPhotoToStorage(userId);
  
  if (uploadResult.success && uploadResult.data) {
    avatarUrl = uploadResult.data;
    console.log('✅ Profile picture uploaded to blob storage:', avatarUrl);
  } else {
    console.log('ℹ️ Blob storage upload failed or no photo available, trying temporary blob URL...');
    const photoResult = await graph.getMyPhoto();
    if (photoResult.success && photoResult.data) {
      avatarUrl = photoResult.data;
      console.log('⚠️ Using temporary blob URL (will expire after session):', avatarUrl);
    } else {
      console.log('ℹ️ No profile photo available from Microsoft 365, using generated avatar');
    }
  }
  
  return avatarUrl;
}

// Helper: Sync user with database (load existing or create new)
async function syncUserWithDatabase(userData, avatarUrl, graph) {
  try {
    console.log('🔄 Checking for existing user data in database...');
    const existingData = await databaseService.loadUserData(userData.id);
    
    if (existingData && existingData.success && existingData.data) {
      // User exists - merge with existing data
      console.log('✅ Found existing user data, merging with current profile');
      const existingUser = existingData.data.currentUser || existingData.data;
      console.log('📚 Existing dreams count:', existingUser.dreamBook?.length || 0);
      
      // Handle avatar URL logic
      const { finalAvatarUrl, shouldSaveAvatar } = await handleAvatarMerge(
        existingUser.avatar, avatarUrl, userData.id, graph
      );
      
      const mergedUser = {
        ...existingUser,
        name: userData.name,
        email: userData.email,
        office: userData.office,
        avatar: finalAvatarUrl
      };
      
      // Save updated avatar if needed
      if (shouldSaveAvatar && finalAvatarUrl.startsWith('https://') && finalAvatarUrl.includes('.blob.core.windows.net')) {
        await saveAvatarToDatabase(userData.id, mergedUser, finalAvatarUrl);
      }
      
      return mergedUser;
    } else {
      // New user - create profile
      console.log('🆕 No existing data found, saving new user profile with 6-container structure');
      await createNewUserProfile(userData);
      return userData;
    }
  } catch (error) {
    console.error('❌ Error checking/updating user profile:', error);
    console.log('ℹ️ Continuing with login despite error');
    return userData;
  }
}

// Helper: Handle avatar merge logic
async function handleAvatarMerge(existingAvatar, newAvatarUrl, userId, graph) {
  const isValidPermanentAvatar = existingAvatar && 
    typeof existingAvatar === 'string' && 
    existingAvatar.startsWith('https://') &&
    existingAvatar.includes('.blob.core.windows.net') &&
    !existingAvatar.startsWith('blob:') && 
    !existingAvatar.includes('ui-avatars.com');
  
  let finalAvatarUrl = newAvatarUrl;
  let shouldSaveAvatar = false;
  
  if (isValidPermanentAvatar) {
    console.log('✅ Using existing permanent avatar URL from database');
    finalAvatarUrl = existingAvatar;
  } else if (existingAvatar && existingAvatar.startsWith('blob:')) {
    console.log('⚠️ Existing avatar is a blob URL, attempting to upload to blob storage...');
    const uploadResult = await graph.uploadMyPhotoToStorage(userId);
    if (uploadResult.success && uploadResult.data) {
      finalAvatarUrl = uploadResult.data;
      shouldSaveAvatar = true;
      console.log('✅ Successfully uploaded existing blob URL to permanent storage');
    } else if (newAvatarUrl && !newAvatarUrl.includes('ui-avatars.com')) {
      shouldSaveAvatar = true;
    }
  } else {
    console.log('⚠️ Existing avatar is not a valid permanent URL, using newly fetched avatar');
    if (newAvatarUrl && newAvatarUrl.startsWith('https://') && newAvatarUrl.includes('.blob.core.windows.net')) {
      shouldSaveAvatar = true;
      console.log('✅ New permanent avatar URL will be saved to database');
    }
  }
  
  return { finalAvatarUrl, shouldSaveAvatar };
}

// Helper: Save avatar update to database
async function saveAvatarToDatabase(userId, userData, avatarUrl) {
  try {
    console.log('💾 Saving updated avatar to database for existing user...');
    const profileUpdate = {
      id: userId,
      userId: userId,
      name: userData.name,
      email: userData.email,
      office: userData.office,
      avatar: avatarUrl,
      lastUpdated: new Date().toISOString()
    };
    const saveResult = await databaseService.saveUserData(userId, profileUpdate);
    if (saveResult.success) {
      console.log('✅ Avatar updated successfully in database');
    } else {
      console.log('⚠️ Failed to save avatar update:', saveResult.error);
    }
  } catch (saveError) {
    console.error('❌ Error saving avatar update:', saveError);
  }
}

// Helper: Create new user profile in database
async function createNewUserProfile(userData) {
  const minimalProfile = {
    id: userData.id,
    userId: userData.id,
    name: userData.name,
    email: userData.email,
    office: userData.office,
    avatar: userData.avatar,
    score: 0,
    dreamsCount: 0,
    connectsCount: 0,
    weeksActiveCount: 0,
    currentYear: new Date().getFullYear(),
    dataStructureVersion: 3,
    role: 'user',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
  
  const saveResult = await databaseService.saveUserData(userData.id, minimalProfile);
  if (saveResult.success) {
    console.log('✅ New user profile saved successfully (6-container, v3)');
    
    // Create empty dreams document for new user
    try {
      const itemService = (await import('../services/itemService.js')).default;
      await itemService.saveDreams(userData.id, [], []);
      console.log('✅ Created empty dreams document for new user');
    } catch (dreamsError) {
      console.error('⚠️ Failed to create initial dreams document:', dreamsError);
    }
  } else {
    console.log('ℹ️ Profile save failed but continuing with login:', saveResult.error);
  }
}
