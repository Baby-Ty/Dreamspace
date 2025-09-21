// Database service for DreamSpace - handles both localStorage and Azure Cosmos DB
class DatabaseService {
  constructor() {
    this.isProduction = import.meta.env.VITE_APP_ENV === 'production';
    this.cosmosEndpoint = import.meta.env.VITE_COSMOS_ENDPOINT;
    this.cosmosKey = import.meta.env.VITE_COSMOS_KEY;
    this.useCosmosDB = this.isProduction && this.cosmosEndpoint && this.cosmosKey;
    
    if (this.useCosmosDB) {
      console.log('🌟 Using Azure Cosmos DB for data persistence');
    } else {
      console.log('💾 Using localStorage for data persistence');
    }
  }

  // Get user-specific storage key for localStorage
  getUserStorageKey(userId) {
    return `dreamspace_user_${userId}_data`;
  }

  // Save user data
  async saveUserData(userId, userData) {
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
        console.log('Falling back to localStorage');
        return this.saveToLocalStorage(userId, userData);
      }
      return { success: false, error: error.message };
    }
  }

  // Load user data
  async loadUserData(userId) {
    try {
      if (this.useCosmosDB) {
        const cosmosData = await this.loadFromCosmosDB(userId);
        if (cosmosData) {
          return cosmosData;
        }
        // If no data in Cosmos DB, try to migrate from localStorage
        console.log('No data found in Cosmos DB, checking localStorage for migration...');
        const localData = this.loadFromLocalStorage(userId);
        if (localData) {
          console.log('Migrating data from localStorage to Cosmos DB...');
          await this.saveToCosmosDB(userId, localData);
          return localData;
        }
        return null;
      } else {
        return this.loadFromLocalStorage(userId);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Fallback to localStorage if Cosmos DB fails
      if (this.useCosmosDB) {
        console.log('Falling back to localStorage');
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

  // Cosmos DB methods (using REST API to avoid additional dependencies)
  async saveToCosmosDB(userId, userData) {
    const url = `${this.cosmosEndpoint}/dbs/dreamspace/colls/users/docs`;
    
    const document = {
      id: userId.toString(),
      userId: userId,
      ...userData,
      lastUpdated: new Date().toISOString(),
      _partitionKey: userId.toString()
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': this.getCosmosAuthHeader('POST', 'docs', 'dbs/dreamspace/colls/users'),
        'Content-Type': 'application/json',
        'x-ms-date': new Date().toUTCString(),
        'x-ms-version': '2020-07-15',
        'x-ms-documentdb-is-upsert': 'true'
      },
      body: JSON.stringify(document)
    });

    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.text();
      console.error('Cosmos DB save error:', error);
      return { success: false, error: error };
    }
  }

  async loadFromCosmosDB(userId) {
    const url = `${this.cosmosEndpoint}/dbs/dreamspace/colls/users/docs/${userId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': this.getCosmosAuthHeader('GET', 'docs', `dbs/dreamspace/colls/users/docs/${userId}`),
        'Content-Type': 'application/json',
        'x-ms-date': new Date().toUTCString(),
        'x-ms-version': '2020-07-15',
        'x-ms-documentdb-partitionkey': `["${userId}"]`
      }
    });

    if (response.ok) {
      const data = await response.json();
      // Remove Cosmos DB specific fields
      const { id, _rid, _self, _etag, _attachments, _ts, lastUpdated, _partitionKey, ...userData } = data;
      return userData;
    } else if (response.status === 404) {
      return null; // User not found
    } else {
      const error = await response.text();
      console.error('Cosmos DB load error:', error);
      throw new Error(error);
    }
  }

  // Generate Cosmos DB authorization header
  getCosmosAuthHeader(verb, resourceType, resourceLink) {
    // This is a simplified version - in production, you'd want to implement proper HMAC-SHA256 signing
    // For now, we'll use the master key directly (not recommended for production)
    return `type=master&ver=1.0&sig=${this.cosmosKey}`;
  }

  // Migration utilities
  async migrateAllLocalDataToCosmosDB() {
    if (!this.useCosmosDB) {
      console.log('Not in production mode, skipping migration');
      return;
    }

    console.log('Starting migration of all localStorage data to Cosmos DB...');
    const migrated = [];
    const failed = [];

    // Find all dreamspace user data in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('dreamspace_user_')) {
        try {
          const userId = key.replace('dreamspace_user_', '').replace('_data', '');
          const userData = JSON.parse(localStorage.getItem(key));
          
          const result = await this.saveToCosmosDB(userId, userData);
          if (result.success) {
            migrated.push(userId);
            console.log(`✅ Migrated user ${userId}`);
          } else {
            failed.push({ userId, error: result.error });
            console.error(`❌ Failed to migrate user ${userId}:`, result.error);
          }
        } catch (error) {
          console.error(`❌ Error processing ${key}:`, error);
          failed.push({ key, error: error.message });
        }
      }
    }

    console.log(`Migration complete: ${migrated.length} successful, ${failed.length} failed`);
    return { migrated, failed };
  }
}

// Create singleton instance
const databaseService = new DatabaseService();
export default databaseService;
