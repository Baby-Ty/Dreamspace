// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.

import databaseService from '../services/databaseService.js';
import { dreamCategories } from '../data/mockData.js';

/**
 * Create empty user template for real users
 * @param {Object} userInfo - User information to initialize with
 * @returns {Object} Empty user template
 */
export const createEmptyUser = (userInfo = {}) => ({
  id: userInfo.id || null,
  userId: userInfo.userId || null, // Preserve userId from Cosmos DB
  name: userInfo.name || '',
  email: userInfo.email || '',
  office: userInfo.office || '',
  avatar: userInfo.avatar || '',
  dreamBook: userInfo.dreamBook || [],
  score: userInfo.score || 0,
  connects: userInfo.connects || [],
  // Use global dreamCategories - don't store per user
  dreamCategories: dreamCategories,
  dreamsCount: userInfo.dreamsCount || 0,
  connectsCount: userInfo.connectsCount || 0
});

/**
 * Save user data to database
 * Supports both localStorage and Azure Cosmos DB
 * @param {Object} data - User data to save
 * @param {string} userId - User ID
 */
export const saveUserData = async (data, userId) => {
  try {
    if (userId) {
      await databaseService.saveUserData(userId, data);
    }
  } catch (error) {
    console.warn('❌ Could not save user data:', error);
  }
};

/**
 * Load user data from database
 * Supports both localStorage and Azure Cosmos DB
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User data or null if not found
 */
export const loadUserData = async (userId) => {
  try {
    if (!userId) return null;
    
    const savedData = await databaseService.loadUserData(userId);
    if (savedData) {
      console.log(`📦 Data loaded for user ${userId}`);
      // Unwrap the { success: true, data: {...} } response from databaseService
      if (savedData.success && savedData.data) {
        return savedData.data;
      }
      return savedData;
    }
    return null;
  } catch (error) {
    console.warn('❌ Could not load user data:', error);
    return null;
  }
};

