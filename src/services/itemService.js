// Item service for individual item CRUD operations in the 3-container architecture
import { ok, fail } from '../utils/errorHandling.js';
import { ERR, ErrorCodes } from '../constants/errors.js';

class ItemService {
  constructor() {
    const isLiveSite = window.location.hostname === 'dreamspace.tylerstewart.co.za';
    this.apiBase = isLiveSite ? 'https://func-dreamspace-prod.azurewebsites.net/api' : '/api';
    console.log('📦 Item Service initialized');
  }

  /**
   * Save a single item to the items container
   * @param {string} userId - User ID (partition key)
   * @param {string} type - Item type (dream, weekly_goal, etc.)
   * @param {object} itemData - Item data
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async saveItem(userId, type, itemData) {
    try {
      console.log('💾 Saving item:', { userId, type, itemId: itemData.id });

      const response = await fetch(`${this.apiBase}/saveItem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          type,
          itemData
        })
      });

      // Get the response text first to check if it's empty
      const responseText = await response.text();
      
      if (response.ok) {
        // Check if response has content before parsing
        if (!responseText || responseText.trim() === '') {
          console.error('❌ Empty response from API');
          return fail(ErrorCodes.SAVE_ERROR, 'Empty response from API');
        }
        
        try {
          const result = JSON.parse(responseText);
          console.log('✅ Item saved:', result.id);
          return ok(result);
        } catch (parseError) {
          console.error('❌ Invalid JSON response:', responseText);
          return fail(ErrorCodes.SAVE_ERROR, 'Invalid JSON response from API');
        }
      } else {
        // Try to parse error response
        try {
          const error = responseText ? JSON.parse(responseText) : { error: 'Unknown error' };
          console.error('❌ Error saving item:', error);
          return fail(ErrorCodes.SAVE_ERROR, error.error || 'Failed to save item');
        } catch (parseError) {
          console.error('❌ Error response:', responseText);
          return fail(ErrorCodes.SAVE_ERROR, responseText || 'Failed to save item');
        }
      }
    } catch (error) {
      console.error('❌ Error saving item:', error);
      return fail(ErrorCodes.SAVE_ERROR, error.message || 'Failed to save item');
    }
  }

  /**
   * Get items for a user, optionally filtered by type
   * @param {string} userId - User ID
   * @param {string|null} type - Optional type filter
   * @returns {Promise<{success: boolean, data?: array, error?: string}>}
   */
  async getItems(userId, type = null) {
    try {
      const encodedUserId = encodeURIComponent(userId);
      const url = type 
        ? `${this.apiBase}/getItems/${encodedUserId}?type=${encodeURIComponent(type)}`
        : `${this.apiBase}/getItems/${encodedUserId}`;

      console.log('📂 Loading items:', { userId, type: type || 'all' });

      const response = await fetch(url);

      if (response.ok) {
        const items = await response.json();
        console.log(`✅ Loaded ${items.length} items`);
        return ok(items);
      } else if (response.status === 404) {
        console.log('ℹ️ No items found for user');
        return ok([]);
      } else {
        const error = await response.json();
        console.error('❌ Error loading items:', error);
        return fail(ErrorCodes.LOAD_ERROR, error.error || 'Failed to load items');
      }
    } catch (error) {
      console.error('❌ Error loading items:', error);
      return fail(ErrorCodes.LOAD_ERROR, error.message || 'Failed to load items');
    }
  }

  /**
   * Delete a single item
   * @param {string} userId - User ID (partition key)
   * @param {string} itemId - Item ID
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async deleteItem(userId, itemId) {
    try {
      console.log('🗑️ Deleting item:', { userId, itemId });

      const response = await fetch(`${this.apiBase}/deleteItem/${encodeURIComponent(itemId)}?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Item deleted:', itemId);
        return ok(result);
      } else if (response.status === 404) {
        console.log('ℹ️ Item not found');
        return fail(ErrorCodes.NOT_FOUND, 'Item not found');
      } else {
        const error = await response.json();
        console.error('❌ Error deleting item:', error);
        return fail(ErrorCodes.DELETE_ERROR, error.error || 'Failed to delete item');
      }
    } catch (error) {
      console.error('❌ Error deleting item:', error);
      return fail(ErrorCodes.DELETE_ERROR, error.message || 'Failed to delete item');
    }
  }

  /**
   * Batch save multiple items
   * @param {string} userId - User ID
   * @param {Array<{type: string, data: object}>} items - Array of items to save
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async batchSaveItems(userId, items) {
    try {
      console.log('💾 Batch saving items:', { userId, count: items.length });

      const response = await fetch(`${this.apiBase}/batchSaveItems`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          items
        })
      });

      // Get the response text first to check if it's empty
      const responseText = await response.text();
      
      if (response.ok) {
        // Check if response has content before parsing
        if (!responseText || responseText.trim() === '') {
          console.error('❌ Empty response from API');
          return fail(ErrorCodes.SAVE_ERROR, 'Empty response from API');
        }
        
        try {
          const result = JSON.parse(responseText);
          console.log(`✅ Batch saved: ${result.savedCount} items`);
          if (result.errorCount > 0) {
            console.warn(`⚠️ ${result.errorCount} items failed to save`);
          }
          return ok(result);
        } catch (parseError) {
          console.error('❌ Invalid JSON response:', responseText);
          return fail(ErrorCodes.SAVE_ERROR, 'Invalid JSON response from API');
        }
      } else {
        // Try to parse error response
        try {
          const error = responseText ? JSON.parse(responseText) : { error: 'Unknown error' };
          console.error('❌ Error batch saving items:', error);
          return fail(ErrorCodes.SAVE_ERROR, error.error || 'Failed to batch save items');
        } catch (parseError) {
          console.error('❌ Error response:', responseText);
          return fail(ErrorCodes.SAVE_ERROR, responseText || 'Failed to batch save items');
        }
      }
    } catch (error) {
      console.error('❌ Error batch saving items:', error);
      return fail(ErrorCodes.SAVE_ERROR, error.message || 'Failed to batch save items');
    }
  }

  /**
   * Save dreams document (one document per user with dreams array)
   * @param {string} userId - User ID
   * @param {Array} dreams - Array of dreams with goals
   * @param {Array} weeklyGoalTemplates - Array of goal templates (optional)
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async saveDreams(userId, dreams, weeklyGoalTemplates = []) {
    try {
      console.log('💾 Saving dreams document:', { userId, dreamsCount: dreams.length, templatesCount: weeklyGoalTemplates.length });

      const response = await fetch(`${this.apiBase}/saveDreams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          dreams,
          weeklyGoalTemplates
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
          console.log('✅ Dreams document saved');
          return ok(result);
        } catch (parseError) {
          console.error('❌ Invalid JSON response:', responseText);
          return fail(ErrorCodes.SAVE_ERROR, 'Invalid JSON response from API');
        }
      } else {
        try {
          const error = responseText ? JSON.parse(responseText) : { error: 'Unknown error' };
          console.error('❌ Error saving dreams document:', error);
          return fail(ErrorCodes.SAVE_ERROR, error.error || 'Failed to save dreams document');
        } catch (parseError) {
          console.error('❌ Error response:', responseText);
          return fail(ErrorCodes.SAVE_ERROR, responseText || 'Failed to save dreams document');
        }
      }
    } catch (error) {
      console.error('❌ Error saving dreams document:', error);
      return fail(ErrorCodes.SAVE_ERROR, error.message || 'Failed to save dreams document');
    }
  }

  /**
   * Upload a dream picture to blob storage
   * @param {string} userId - User ID
   * @param {string} dreamId - Dream ID
   * @param {File} imageFile - Image file to upload
   * @returns {Promise<{success: boolean, data?: {url: string}, error?: string}>}
   */
  async uploadDreamPicture(userId, dreamId, imageFile) {
    try {
      console.log('📸 Uploading dream picture:', { userId, dreamId, fileName: imageFile.name });

      // Read the file as array buffer
      const arrayBuffer = await imageFile.arrayBuffer();
      
      const response = await fetch(`${this.apiBase}/uploadDreamPicture/${encodeURIComponent(userId)}/${encodeURIComponent(dreamId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        body: arrayBuffer
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Dream picture uploaded:', result.url);
        return ok({ url: result.url });
      } else {
        const error = await response.json();
        console.error('❌ Error uploading dream picture:', error);
        return fail(ErrorCodes.SAVE_ERROR, error.error || 'Failed to upload dream picture');
      }
    } catch (error) {
      console.error('❌ Error uploading dream picture:', error);
      return fail(ErrorCodes.SAVE_ERROR, error.message || 'Failed to upload dream picture');
    }
  }
}

// Create singleton instance
const itemService = new ItemService();
export default itemService;


