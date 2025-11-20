// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

// Connect service for managing dream connects in the 6-container architecture
import { ok, fail } from '../utils/errorHandling.js';
import { ErrorCodes } from '../constants/errors.js';

class ConnectService {
  constructor() {
    const isLiveSite = window.location.hostname === 'dreamspace.tylerstewart.co.za';
    this.apiBase = isLiveSite ? 'https://func-dreamspace-prod.azurewebsites.net/api' : '/api';
    console.log('🔗 Connect Service initialized');
  }

  /**
   * Save a connect to the connects container
   * @param {string} userId - User ID (partition key)
   * @param {object} connectData - Connect data
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async saveConnect(userId, connectData) {
    try {
      console.log('💾 Saving connect:', { userId, connectId: connectData.id });

      const response = await fetch(`${this.apiBase}/saveConnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          connectData
        })
      });

      const responseText = await response.text();
      
      if (response.ok) {
        if (!responseText || responseText.trim() === '') {
          console.error('❌ Empty response from API');
          return fail(ErrorCodes.SAVE_ERROR, 'Empty response from API');
        }
        
        try {
          const result = JSON.parse(responseText);
          console.log('✅ Connect saved:', result.id);
          return ok(result.connect);
        } catch (parseError) {
          console.error('❌ Invalid JSON response:', responseText);
          return fail(ErrorCodes.SAVE_ERROR, 'Invalid JSON response from API');
        }
      } else {
        try {
          const error = responseText ? JSON.parse(responseText) : { error: 'Unknown error' };
          console.error('❌ Error saving connect:', error);
          return fail(ErrorCodes.SAVE_ERROR, error.error || 'Failed to save connect');
        } catch (parseError) {
          console.error('❌ Error response:', responseText);
          return fail(ErrorCodes.SAVE_ERROR, responseText || 'Failed to save connect');
        }
      }
    } catch (error) {
      console.error('❌ Error saving connect:', error);
      return fail(ErrorCodes.SAVE_ERROR, error.message || 'Failed to save connect');
    }
  }

  /**
   * Get all connects for a user
   * @param {string} userId - User ID
   * @returns {Promise<{success: boolean, data?: array, error?: string}>}
   */
  async getConnects(userId) {
    try {
      const encodedUserId = encodeURIComponent(userId);
      const url = `${this.apiBase}/getConnects/${encodedUserId}`;

      console.log('📂 Loading connects for user:', userId);

      const response = await fetch(url);

      if (response.ok) {
        const connects = await response.json();
        console.log(`✅ Loaded ${connects.length} connects`);
        return ok(connects);
      } else if (response.status === 404) {
        console.log('ℹ️ No connects found for user');
        return ok([]);
      } else {
        const error = await response.json();
        console.error('❌ Error loading connects:', error);
        return fail(ErrorCodes.LOAD_ERROR, error.error || 'Failed to load connects');
      }
    } catch (error) {
      console.error('❌ Error loading connects:', error);
      return fail(ErrorCodes.LOAD_ERROR, error.message || 'Failed to load connects');
    }
  }

  /**
   * Delete a connect
   * @param {string} userId - User ID (partition key)
   * @param {string} connectId - Connect ID
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async deleteConnect(userId, connectId) {
    try {
      console.log('🗑️ Deleting connect:', { userId, connectId });

      const response = await fetch(
        `${this.apiBase}/deleteConnect/${encodeURIComponent(connectId)}?userId=${encodeURIComponent(userId)}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Connect deleted:', connectId);
        return ok(result);
      } else if (response.status === 404) {
        console.log('ℹ️ Connect not found');
        return fail(ErrorCodes.NOT_FOUND, 'Connect not found');
      } else {
        const error = await response.json();
        console.error('❌ Error deleting connect:', error);
        return fail(ErrorCodes.DELETE_ERROR, error.error || 'Failed to delete connect');
      }
    } catch (error) {
      console.error('❌ Error deleting connect:', error);
      return fail(ErrorCodes.DELETE_ERROR, error.message || 'Failed to delete connect');
    }
  }

  /**
   * Update connect status (simplified: pending → completed)
   * @param {string} userId - User ID (partition key)
   * @param {string} connectId - Connect ID
   * @param {string} status - New status ('pending' | 'completed')
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async updateConnectStatus(userId, connectId, status) {
    try {
      // First, get the existing connect to update it
      const connectsResult = await this.getConnects(userId);
      if (!connectsResult.success) {
        return fail(ErrorCodes.LOAD_ERROR, 'Failed to load connect for update');
      }

      const existingConnect = connectsResult.data.find(c => c.id === connectId);
      if (!existingConnect) {
        return fail(ErrorCodes.NOT_FOUND, 'Connect not found');
      }

      // Update the connect with new status
      const updatedConnect = {
        ...existingConnect,
        status,
        updatedAt: new Date().toISOString()
      };

      // Save updated connect (Cosmos DB upsert)
      return await this.saveConnect(userId, updatedConnect);
    } catch (error) {
      console.error('❌ Error updating connect status:', error);
      return fail(ErrorCodes.SAVE_ERROR, error.message || 'Failed to update connect status');
    }
  }

  /**
   * Update connect details (generic update method)
   * @param {string} userId - User ID (partition key)
   * @param {string} connectId - Connect ID
   * @param {object} updates - Partial connect object with fields to update
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async updateConnectDetails(userId, connectId, updates) {
    try {
      // First, get the existing connect to update it
      const connectsResult = await this.getConnects(userId);
      if (!connectsResult.success) {
        return fail(ErrorCodes.LOAD_ERROR, 'Failed to load connect for update');
      }

      const existingConnect = connectsResult.data.find(c => c.id === connectId);
      if (!existingConnect) {
        return fail(ErrorCodes.NOT_FOUND, 'Connect not found');
      }

      // Merge updates with existing connect
      const updatedConnect = {
        ...existingConnect,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Save updated connect (Cosmos DB upsert)
      return await this.saveConnect(userId, updatedConnect);
    } catch (error) {
      console.error('❌ Error updating connect details:', error);
      return fail(ErrorCodes.SAVE_ERROR, error.message || 'Failed to update connect details');
    }
  }
}

// Create singleton instance
const connectService = new ConnectService();
export default connectService;



