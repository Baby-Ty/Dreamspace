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
  },

  /**
   * Test image generation with current prompts
   * @param {string} userSearchTerm - Test search term
   * @param {string} imageType - 'dream' or 'background_card'
   * @param {string} styleModifierId - Optional style modifier ID
   * @returns {Promise<{success: boolean, data?: {url: string, revisedPrompt: string}, error?: string}>}
   */
  async testImageGeneration(userSearchTerm, imageType = 'dream', styleModifierId = null) {
    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/generateImage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userSearchTerm: userSearchTerm.trim(),
          options: {
            imageType: imageType,
            styleModifierId: styleModifierId || null,
            size: '1024x1024',
            quality: 'hd',
            model: 'dall-e-3'
          }
        })
      });

      let data;
      try {
        const responseText = await response.text();
        data = JSON.parse(responseText);
      } catch (jsonError) {
        return fail(ErrorCodes.NETWORK, `Server error (${response.status}): Invalid response`);
      }

      if (response.ok && data.success) {
        return ok({
          url: data.url,
          revisedPrompt: data.revisedPrompt || ''
        });
      } else {
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : (data.error?.message || data.details || 'Failed to generate image');
        return fail(ErrorCodes.NETWORK, errorMessage);
      }
    } catch (error) {
      return fail(ErrorCodes.NETWORK, error.message || 'Failed to generate image');
    }
  },

  /**
   * Test vision generation with current prompts
   * @param {string} userInput - Test user input
   * @param {string} action - 'generate' or 'polish'
   * @param {Array} dreams - Optional test dreams array
   * @returns {Promise<{success: boolean, data?: {text: string}, error?: string}>}
   */
  async testVisionGeneration(userInput, action = 'generate', dreams = []) {
    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/generateVision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userInput: userInput.trim(),
          dreams: dreams.map(d => ({ title: d.title || d, category: d.category || 'general' })),
          action: action
        })
      });

      let data;
      try {
        const responseText = await response.text();
        data = JSON.parse(responseText);
      } catch (jsonError) {
        return fail(ErrorCodes.NETWORK, `Server error (${response.status}): Invalid response`);
      }

      if (response.ok && data.success) {
        return ok({ text: data.text });
      } else {
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : (data.error?.message || data.details || 'Failed to generate vision');
        return fail(ErrorCodes.NETWORK, errorMessage);
      }
    } catch (error) {
      return fail(ErrorCodes.NETWORK, error.message || 'Failed to generate vision');
    }
  }
};

export default promptService;

