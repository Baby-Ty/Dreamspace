// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { ok, fail } from '../utils/errorHandling.js';
import { ErrorCodes } from '../constants/errors.js';

/**
 * Get API base URL for backend calls
 */
function getApiBase() {
  const isLiveSite = window.location.hostname === 'dreamspace.tylerstewart.co.za';
  return isLiveSite ? 'https://func-dreamspace-prod.azurewebsites.net/api' : '/api';
}

/**
 * Prompt Service - manages AI prompt configurations
 */
export const promptService = {
  /**
   * Get current prompts configuration
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async getPrompts() {
    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/getPrompts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      let result;
      try {
        const responseText = await response.text();
        result = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Failed to parse getPrompts response:', parseError);
        return fail(ErrorCodes.NETWORK, `Invalid response from server (${response.status})`);
      }

      if (!response.ok) {
        const errorMsg = typeof result.error === 'string' 
          ? result.error 
          : (result.error?.message || result.details || `HTTP ${response.status}: ${response.statusText}`);
        return fail(ErrorCodes.NETWORK, errorMsg);
      }
      
      if (result.success && result.prompts) {
        return ok(result.prompts);
      } else {
        const errorMsg = typeof result.error === 'string' 
          ? result.error 
          : (result.error?.message || result.details || 'Failed to fetch prompts');
        return fail(ErrorCodes.NETWORK, errorMsg);
      }
    } catch (error) {
      console.error('Error fetching prompts:', error);
      return fail(ErrorCodes.NETWORK, error.message || 'Failed to fetch prompts');
    }
  },

  /**
   * Save prompts configuration
   * @param {object} prompts - Prompts data to save
   * @param {string} modifiedBy - User email who made the change
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async savePrompts(prompts, modifiedBy) {
    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/savePrompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompts,
          modifiedBy: modifiedBy || 'unknown'
        })
      });

      let result;
      try {
        const responseText = await response.text();
        result = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Failed to parse savePrompts response:', parseError);
        return fail(ErrorCodes.NETWORK, `Invalid response from server (${response.status})`);
      }

      if (!response.ok) {
        const errorMsg = typeof result.error === 'string' 
          ? result.error 
          : (result.error?.message || result.details || `HTTP ${response.status}: ${response.statusText}`);
        return fail(ErrorCodes.NETWORK, errorMsg);
      }
      
      if (result.success && result.prompts) {
        return ok(result.prompts);
      } else {
        const errorMsg = typeof result.error === 'string' 
          ? result.error 
          : (result.error?.message || result.details || 'Failed to save prompts');
        return fail(ErrorCodes.NETWORK, errorMsg);
      }
    } catch (error) {
      console.error('Error saving prompts:', error);
      return fail(ErrorCodes.NETWORK, error.message || 'Failed to save prompts');
    }
  },

  /**
   * Get prompt history
   * @param {number} limit - Maximum number of entries to return (default 50)
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getPromptHistory(limit = 50) {
    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/getPromptHistory?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      let result;
      try {
        const responseText = await response.text();
        result = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Failed to parse getPromptHistory response:', parseError);
        return fail(ErrorCodes.NETWORK, `Invalid response from server (${response.status})`);
      }

      if (!response.ok) {
        const errorMsg = typeof result.error === 'string' 
          ? result.error 
          : (result.error?.message || result.details || `HTTP ${response.status}: ${response.statusText}`);
        return fail(ErrorCodes.NETWORK, errorMsg);
      }
      
      if (result.success) {
        return ok(result.history || []);
      } else {
        const errorMsg = typeof result.error === 'string' 
          ? result.error 
          : (result.error?.message || result.details || 'Failed to fetch prompt history');
        return fail(ErrorCodes.NETWORK, errorMsg);
      }
    } catch (error) {
      console.error('Error fetching prompt history:', error);
      return fail(ErrorCodes.NETWORK, error.message || 'Failed to fetch prompt history');
    }
  },

  /**
   * Restore prompts from a specific version
   * @param {string} version - Version ID to restore
   * @param {string} modifiedBy - User email performing the restore
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async restorePrompt(version, modifiedBy) {
    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/restorePrompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version,
          modifiedBy: modifiedBy || 'unknown'
        })
      });

      let result;
      try {
        const responseText = await response.text();
        result = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Failed to parse restorePrompt response:', parseError);
        return fail(ErrorCodes.NETWORK, `Invalid response from server (${response.status})`);
      }

      if (!response.ok) {
        const errorMsg = typeof result.error === 'string' 
          ? result.error 
          : (result.error?.message || result.details || `HTTP ${response.status}: ${response.statusText}`);
        return fail(ErrorCodes.NETWORK, errorMsg);
      }
      
      if (result.success && result.prompts) {
        return ok({
          prompts: result.prompts,
          restoredFrom: result.restoredFrom
        });
      } else {
        const errorMsg = typeof result.error === 'string' 
          ? result.error 
          : (result.error?.message || result.details || 'Failed to restore prompts');
        return fail(ErrorCodes.NETWORK, errorMsg);
      }
    } catch (error) {
      console.error('Error restoring prompts:', error);
      return fail(ErrorCodes.NETWORK, error.message || 'Failed to restore prompts');
    }
  }
};

export default promptService;

