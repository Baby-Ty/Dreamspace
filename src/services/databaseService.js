// Database service for DreamSpace - handles both localStorage and Azure Cosmos DB via API
class DatabaseService {
  constructor() {
    this.isProduction = import.meta.env.VITE_APP_ENV === 'production';
    this.cosmosEndpoint = import.meta.env.VITE_COSMOS_ENDPOINT;
    this.cosmosKey = import.meta.env.VITE_COSMOS_KEY;
    
    // Environment variables configured successfully
    
    // Use Cosmos DB via API functions in production
    this.useCosmosDB = this.isProduction && this.cosmosEndpoint && this.cosmosKey;
    
    if (this.useCosmosDB) {
      console.log('🌟 Using Azure Cosmos DB via API functions for data persistence');
      this.apiBase = '/api'; // Azure Static Web Apps API base path
    } else {
      console.log('💾 Using localStorage for data persistence');
      if (this.isProduction) {
        console.log('⚠️ In production mode but missing Cosmos DB configuration');
      }
    }
  }

  // Get user-specific storage key for localStorage
  getUserStorageKey(userId) {
    return `dreamspace_user_${userId}_data`;
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
      return { success: false, error: error.message };
    }
  }

  // Load user data
  async loadUserData(userId) {
    console.log('📂 Loading data for user ID:', userId);
    try {
      if (this.useCosmosDB) {
        // For production, load from Cosmos DB (fresh start for new users)
        const cosmosData = await this.loadFromCosmosDB(userId);
        console.log('📂 Cosmos DB data loaded:', cosmosData ? 'Found data' : 'No data found');
        return cosmosData; // Returns null if user doesn't exist - that's fine for fresh start
      } else {
        // For development, use localStorage (includes mock data for demos)
        const localData = this.loadFromLocalStorage(userId);
        console.log('📂 LocalStorage data loaded:', localData ? 'Found data' : 'No data found');
        return localData;
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Fallback to localStorage if Cosmos DB fails
      if (this.useCosmosDB) {
        console.log('🔄 Falling back to localStorage');
        return this.loadFromLocalStorage(userId);
      }
      return null;
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
        return { success: true };
      }
      return { success: false, error: 'No user ID provided' };
    } catch (error) {
      console.warn('❌ Could not save to localStorage:', error);
      return { success: false, error: error.message };
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

  // Cosmos DB methods (using API functions)
  async saveToCosmosDB(userId, userData) {
    try {
      const response = await fetch(`${this.apiBase}/users/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Data saved to Cosmos DB for user:', userId);
        return { success: true, result };
      } else {
        const error = await response.json();
        console.error('❌ Cosmos DB save error:', error);
        return { success: false, error: error.error || 'Unknown error' };
      }
    } catch (error) {
      console.error('❌ Cosmos DB save error:', error);
      return { success: false, error: error.message };
    }
  }

  async loadFromCosmosDB(userId) {
    try {
      const response = await fetch(`${this.apiBase}/users/${userId}`);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Data loaded from Cosmos DB for user:', userId);
        return userData;
      } else if (response.status === 404) {
        console.log('ℹ️ No data found in Cosmos DB for user:', userId);
        return null; // User not found
      } else {
        const error = await response.json();
        console.error('❌ Cosmos DB load error:', error);
        throw new Error(error.error || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ Cosmos DB load error:', error);
      throw error;
    }
  }

  // Utility methods
  async clearUserData(userId) {
    try {
      if (this.useCosmosDB) {
        const response = await fetch(`${this.apiBase}/users/${userId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          console.log(`✅ Cleared Cosmos DB data for user ${userId}`);
          return { success: true };
        } else {
          const error = await response.json();
          return { success: false, error: error.error || 'Unknown error' };
        }
      } else {
        const storageKey = this.getUserStorageKey(userId);
        localStorage.removeItem(storageKey);
        console.log(`✅ Cleared localStorage data for user ${userId}`);
        return { success: true };
      }
    } catch (error) {
      console.error('Error clearing user data:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const databaseService = new DatabaseService();
export default databaseService;
