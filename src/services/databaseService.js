// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

// Database service for DreamSpace - handles Cosmos DB data persistence
import { ok, fail } from '../utils/errorHandling.js';
import { ERR, ErrorCodes } from '../constants/errors.js';
import itemService from './itemService.js';

class DatabaseService {
  constructor() {
    // Always use Cosmos DB on the live site, regardless of environment variables
    const isLiveSite = window.location.hostname === 'dreamspace.tylerstewart.co.za';
    this.useCosmosDB = isLiveSite || !!(import.meta.env.VITE_COSMOS_ENDPOINT && import.meta.env.VITE_APP_ENV === 'production');
    
    // Set API base URL - use separate Function App
    this.apiBase = isLiveSite ? 'https://func-dreamspace-prod.azurewebsites.net/api' : '/api';
    
    // Debug logging
    console.log('🔍 Environment check:');
    console.log('Hostname:', window.location.hostname);
    console.log('Is live site:', isLiveSite);
    console.log('VITE_COSMOS_ENDPOINT:', import.meta.env.VITE_COSMOS_ENDPOINT ? 'SET' : 'NOT SET');
    console.log('VITE_COSMOS_KEY:', import.meta.env.VITE_COSMOS_KEY ? 'SET' : 'NOT SET');
    console.log('VITE_APP_ENV:', import.meta.env.VITE_APP_ENV);
    console.log('Production mode:', import.meta.env.VITE_APP_ENV === 'production');
    
    if (this.useCosmosDB) {
      console.log('☁️ Using Azure Cosmos DB for data persistence (3-container architecture)');
    } else {
      console.log('💾 Using localStorage for data persistence (development mode)');
    }
  }

  // Get user-specific storage key for localStorage
  getUserStorageKey(userId) {
    return `dreamspace_user_${userId}_data`;
  }

  /**
   * Check if data is in old monolithic format (contains arrays)
   */
  isOldFormat(userData) {
    return !!(
      userData?.dreamBook || 
      userData?.weeklyGoals || 
      userData?.scoringHistory || 
      userData?.connects || 
      userData?.careerGoals || 
      userData?.developmentPlan
    );
  }

  /**
   * Check if user is on new structure (v2+)
   */
  isNewStructure(userData) {
    return userData?.dataStructureVersion >= 2;
  }

  // Save user data
  async saveUserData(userId, userData) {
    console.log('💾 Saving data for user ID:', userId, 'Data keys:', Object.keys(userData));
    try {
      if (this.useCosmosDB) {
        return await this.saveToCosmosDB(userId, userData);
      } else {
        return this.saveToLocalStorage(userId, userData);
      }
    } catch (error) {
      console.error('Error saving user data:', error);
      // Fallback to localStorage if Cosmos DB fails
      if (this.useCosmosDB) {
        console.log('🔄 Falling back to localStorage');
        return this.saveToLocalStorage(userId, userData);
      }
      return fail(ErrorCodes.SAVE_ERROR, error.message || 'Failed to save user data');
    }
  }

  // Load user data
  async loadUserData(userId) {
    console.log('📂 Loading data for user ID:', userId);
    try {
      if (this.useCosmosDB) {
        // For production, load from Cosmos DB
        const cosmosData = await this.loadFromCosmosDB(userId);
        console.log('📂 Cosmos DB data loaded:', cosmosData ? 'Found data' : 'No data found');
        
        // Unwrap Cosmos DB response - it returns { success: true, data: {...} }
        if (cosmosData && cosmosData.success && cosmosData.data) {
          // Cosmos DB wraps data, so unwrap it
          return ok(cosmosData.data);
        }
        return ok(null); // Returns null if user doesn't exist - that's fine for fresh start
      } else {
        // For development, use localStorage (returns raw data, not wrapped)
        const localData = this.loadFromLocalStorage(userId);
        console.log('📂 LocalStorage data loaded:', localData ? 'Found data' : 'No data found');
        // localStorage returns raw data directly
        return ok(localData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Fallback to localStorage if Cosmos DB fails
      if (this.useCosmosDB) {
        console.log('🔄 Falling back to localStorage');
        const localData = this.loadFromLocalStorage(userId);
        return ok(localData);
      }
      return fail(ErrorCodes.LOAD_ERROR, error.message || 'Failed to load user data');
    }
  }

  // localStorage methods
  saveToLocalStorage(userId, userData) {
    try {
      if (userId) {
        const storageKey = this.getUserStorageKey(userId);
        localStorage.setItem(storageKey, JSON.stringify(userData));
        // Notify listeners that a save occurred
        window.dispatchEvent(new Event('dreamspace:saved'));
        return ok(null);
      }
      return fail(ErrorCodes.INVALID_INPUT, 'No user ID provided');
    } catch (error) {
      console.warn('❌ Could not save to localStorage:', error);
      return fail(ErrorCodes.SAVE_ERROR, error.message || 'Failed to save to localStorage');
    }
  }

  loadFromLocalStorage(userId) {
    try {
      if (!userId) return null;
      
      const storageKey = this.getUserStorageKey(userId);
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('❌ Could not load from localStorage:', error);
      return null;
    }
  }

  // Cosmos DB methods (using Azure Functions API with 3-container support)
  async saveToCosmosDB(userId, userData) {
    try {
      // The saveUserData endpoint now handles splitting data automatically
      // It detects old format and splits into profile + items
      const encodedUserId = encodeURIComponent(userId);
      const url = `${this.apiBase}/saveUserData/${encodedUserId}`;
      console.log('📡 Saving to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      // Get response text first to see what we're actually receiving
      const responseText = await response.text();
      console.log('📥 Save response status:', response.status, response.statusText);
      console.log('📥 Save response content type:', response.headers.get('content-type'));
      console.log('📥 Save response text (first 200 chars):', responseText.substring(0, 200));

      if (response.ok) {
        // Try to parse the response as JSON
        try {
          const result = JSON.parse(responseText);
          console.log('✅ Data saved to Cosmos DB for user:', userId);
          if (result.format === 'split') {
            console.log(`📦 Data migrated to 3-container format: ${result.itemCount} items`);
          }
          // Notify listeners that a save occurred
          window.dispatchEvent(new Event('dreamspace:saved'));
          return ok(result);
        } catch (parseError) {
          console.error('❌ Failed to parse save response as JSON:', parseError);
          console.error('Response was:', responseText);
          return fail(ErrorCodes.SAVE_ERROR, 'API returned invalid JSON response');
        }
      } else {
        // Try to parse error response
        try {
          const error = JSON.parse(responseText);
          console.error('❌ Cosmos DB save error:', error);
          return fail(ErrorCodes.SAVE_ERROR, error.error || 'Unknown error');
        } catch (parseError) {
          console.error('❌ API error (non-JSON response):', responseText);
          return fail(ErrorCodes.SAVE_ERROR, `HTTP ${response.status}: ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('❌ Cosmos DB save error:', error);
      return fail(ErrorCodes.SAVE_ERROR, error.message || 'Failed to save to Cosmos DB');
    }
  }

  async loadFromCosmosDB(userId) {
    try {
      // The getUserData endpoint handles both old and new formats
      // It returns data in the old format (with arrays) regardless of storage format
      const encodedUserId = encodeURIComponent(userId);
      const url = `${this.apiBase}/getUserData/${encodedUserId}`;
      console.log('📡 Fetching from:', url);
      
      const response = await fetch(url);
      
      // Get response text first to see what we're actually receiving
      const responseText = await response.text();
      console.log('📥 Response status:', response.status, response.statusText);
      console.log('📥 Response content type:', response.headers.get('content-type'));
      console.log('📥 Response text (first 200 chars):', responseText.substring(0, 200));
      
      if (response.ok) {
        // Try to parse the response as JSON
        try {
          const userData = JSON.parse(responseText);
          console.log('✅ Data loaded from Cosmos DB for user:', userId);
          console.log('📊 Dreams count:', userData.dreamBook?.length || 0);
          console.log('📋 Weekly goals count:', userData.weeklyGoals?.length || 0);
          console.log('📋 Weekly goals breakdown:', {
            total: userData.weeklyGoals?.length || 0,
            templates: userData.weeklyGoals?.filter(g => g.type === 'weekly_goal_template').length || 0,
            instances: userData.weeklyGoals?.filter(g => g.type !== 'weekly_goal_template').length || 0
          });
          console.log('📋 Raw weeklyGoals sample:', userData.weeklyGoals?.slice(0, 3));
          console.log('🔗 Connects count:', userData.connects?.length || 0);
          
          // Check if data structure version is indicated
          if (userData.dataStructureVersion >= 2) {
            console.log(`📦 User is on modern container structure (v${userData.dataStructureVersion})`);
          } else {
            console.log('📦 User is on monolithic structure (v1)');
          }
          
          // Return in the expected format
          return { success: true, data: userData };
        } catch (parseError) {
          console.error('❌ Failed to parse response as JSON:', parseError);
          console.error('Response was:', responseText);
          return fail(ErrorCodes.LOAD_ERROR, 'API returned invalid JSON response');
        }
      } else if (response.status === 404) {
        console.log('ℹ️ No data found in Cosmos DB for user:', userId);
        return fail(ErrorCodes.NOT_FOUND, 'User not found');
      } else {
        // Try to parse error response
        try {
          const error = JSON.parse(responseText);
          console.error('❌ Cosmos DB load error:', error);
          return fail(ErrorCodes.LOAD_ERROR, error.error || 'Unknown error');
        } catch (parseError) {
          console.error('❌ API error (non-JSON response):', responseText);
          return fail(ErrorCodes.LOAD_ERROR, `HTTP ${response.status}: ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('❌ Cosmos DB load error:', error);
      return fail(ErrorCodes.LOAD_ERROR, error.message || 'Failed to load from Cosmos DB');
    }
  }

  // Utility methods
  async clearUserData(userId) {
    try {
      if (this.useCosmosDB) {
        // For Cosmos DB, we'll save empty user data instead of deleting
        // This preserves the user record but clears their data
        const emptyUserData = {
          dreamBook: [],
          careerGoals: [],
          developmentPlan: [],
          score: 0,
          connects: [],
          dreamCategories: [],
          dreamsCount: 0,
          connectsCount: 0,
          weeklyGoals: [],
          scoringHistory: []
        };
        
        const result = await this.saveToCosmosDB(userId, emptyUserData);
        if (result.success) {
          console.log(`✅ Cleared Cosmos DB data for user ${userId}`);
          return ok(null);
        } else {
          return result;
        }
      } else {
        const storageKey = this.getUserStorageKey(userId);
        localStorage.removeItem(storageKey);
        console.log(`✅ Cleared localStorage data for user ${userId}`);
        return ok(null);
      }
    } catch (error) {
      console.error('Error clearing user data:', error);
      return fail(ErrorCodes.DELETE_ERROR, error.message || 'Failed to clear user data');
    }
  }

  /**
   * Direct access to item service for granular operations
   * These methods are available but not used by default
   * The main save/load methods handle items automatically
   */
  get items() {
    return itemService;
  }
}

// Create singleton instance
const databaseService = new DatabaseService();
export default databaseService;
