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
    
    // STEP 1: Check database FIRST for existing user and avatar
    console.log('🔄 Checking for existing user data in database...');
    const existingData = await databaseService.loadUserData(userId);
    const existingUser = existingData?.success && existingData?.data 
      ? (existingData.data.currentUser || existingData.data)
      : null;
    
    // STEP 2: Determine if we need to upload avatar
    const existingAvatar = existingUser?.avatar;
    const hasValidPermanentAvatar = isValidPermanentAvatarUrl(existingAvatar);
    
    let avatarUrl;
    if (hasValidPermanentAvatar) {
      // Use existing permanent avatar - NO upload needed
      console.log('✅ Using existing permanent avatar from database:', existingAvatar.substring(0, 80));
      avatarUrl = existingAvatar;
    } else {
      // Need to fetch/upload avatar
      console.log('📸 No valid permanent avatar found, fetching from Microsoft Graph...');
      avatarUrl = await fetchAndUploadAvatar(graph, profileData, userId);
    }

    // STEP 3: Build user data
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

    // STEP 4: Merge with existing or create new user
    if (existingUser) {
      console.log('✅ Found existing user data, merging with current profile');
      console.log('📚 Existing dreams count:', existingUser.dreamBook?.length || 0);
      
      userData = {
        ...existingUser,
        name: userData.name,
        email: userData.email,
        office: userData.office,
        avatar: avatarUrl
      };
      
      // Save avatar update if we got a new permanent URL
      if (!hasValidPermanentAvatar && isValidPermanentAvatarUrl(avatarUrl)) {
        await saveAvatarToDatabase(userId, userData, avatarUrl);
      }
    } else {
      // New user - create profile
      console.log('🆕 No existing data found, saving new user profile');
      await createNewUserProfile(userData);
    }
    
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

/**
 * Check if avatar URL is a valid permanent blob storage URL
 */
function isValidPermanentAvatarUrl(avatarUrl) {
  return avatarUrl && 
    typeof avatarUrl === 'string' && 
    avatarUrl.startsWith('https://') &&
    avatarUrl.includes('.blob.core.windows.net') &&
    !avatarUrl.startsWith('blob:') && 
    !avatarUrl.includes('ui-avatars.com');
}

/**
 * Fetch avatar from Microsoft Graph and upload to blob storage
 * Only called when user doesn't have a valid permanent avatar
 */
async function fetchAndUploadAvatar(graph, profileData, userId) {
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.displayName)}&background=EC4B5C&color=fff&size=100`;
  
  try {
    // Try to upload to blob storage
    console.log('📤 Uploading profile picture to blob storage...');
    const uploadResult = await graph.uploadMyPhotoToStorage(userId);
    
    if (uploadResult.success && uploadResult.data) {
      console.log('✅ Profile picture uploaded to blob storage:', uploadResult.data);
      return uploadResult.data;
    }
    
    console.log('ℹ️ Blob storage upload failed:', uploadResult.error?.message || 'Unknown error');
    
    // Fallback: Try to get temporary blob URL (for current session only)
    console.log('📸 Trying temporary blob URL from Microsoft Graph...');
    const photoResult = await graph.getMyPhoto();
    if (photoResult.success && photoResult.data) {
      console.log('⚠️ Using temporary blob URL (will not persist across sessions)');
      return photoResult.data;
    }
    
    console.log('ℹ️ No profile photo available from Microsoft 365, using generated avatar');
    return fallbackAvatar;
  } catch (error) {
    console.error('❌ Error fetching/uploading avatar:', error);
    return fallbackAvatar;
  }
}

/**
 * Save avatar update to database
 */
async function saveAvatarToDatabase(userId, userData, avatarUrl) {
  try {
    console.log('💾 Saving new permanent avatar to database...');
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
      console.log('✅ Avatar saved to database successfully');
    } else {
      console.log('⚠️ Failed to save avatar to database:', saveResult.error);
    }
  } catch (saveError) {
    console.error('❌ Error saving avatar to database:', saveError);
  }
}

/**
 * Create new user profile in database
 */
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
    console.log('✅ New user profile saved successfully (v3 structure)');
    
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
