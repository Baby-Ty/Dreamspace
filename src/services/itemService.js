// Item service for individual item CRUD operations in the 3-container architecture
import { ok, fail } from '../utils/errorHandling.js';
import { ERR, ErrorCodes } from '../constants/errors.js';

class ItemService {
  constructor() {
    this.apiBase = '/api';
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

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Item saved:', result.id);
        return ok(result);
      } else {
        const error = await response.json();
        console.error('❌ Error saving item:', error);
        return fail(ErrorCodes.SAVE_ERROR, error.error || 'Failed to save item');
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
      const url = type 
        ? `${this.apiBase}/getItems/${userId}?type=${type}`
        : `${this.apiBase}/getItems/${userId}`;

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

      const response = await fetch(`${this.apiBase}/deleteItem/${itemId}?userId=${userId}`, {
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

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Batch saved: ${result.savedCount} items`);
        if (result.errorCount > 0) {
          console.warn(`⚠️ ${result.errorCount} items failed to save`);
        }
        return ok(result);
      } else {
        const error = await response.json();
        console.error('❌ Error batch saving items:', error);
        return fail(ErrorCodes.SAVE_ERROR, error.error || 'Failed to batch save items');
      }
    } catch (error) {
      console.error('❌ Error batch saving items:', error);
      return fail(ErrorCodes.SAVE_ERROR, error.message || 'Failed to batch save items');
    }
  }
}

// Create singleton instance
const itemService = new ItemService();
export default itemService;


