import { ok, fail } from '../utils/errorHandling.js';
import { ErrorCodes } from '../constants/errors.js';
import { apiClient } from './apiClient.js';

/**
 * GPT Service - calls backend API to generate/polish vision statements
 * Uses backend proxy to avoid CORS issues with OpenAI API
 */
export const gptService = {
  /**
   * Generate a visionary year statement from user input and dreams
   * @param {string} userInput - User's description of their mindset, goals, hopes
   * @param {Array} dreams - Array of user's dreams with titles and categories
   * @returns {Promise<{success: boolean, data?: {text: string}, error?: string}>}
   */
  async generateVisionStatement(userInput, dreams = []) {
    if (!userInput || userInput.trim() === '') {
      return fail(ErrorCodes.INVALID_INPUT, 'Please describe your vision first');
    }

    try {
      const response = await apiClient.post('/generateVision', {
        userInput: userInput.trim(),
        dreams: dreams.map(d => ({ title: d.title, category: d.category })),
        action: 'generate'
      });

      let data;
      try {
        const responseText = await response.text();
        console.log('generateVision API response:', response.status, responseText.substring(0, 200));
        data = JSON.parse(responseText);
      } catch (jsonError) {
        // Response is not valid JSON
        console.error('Failed to parse generateVision response:', jsonError);
        return fail(ErrorCodes.NETWORK, `Server error (${response.status}): ${response.statusText || 'Invalid response'}`);
      }

      if (response.ok && data.success) {
        return ok({ text: data.text });
      } else {
        // Extract error message - could be string or object
        console.error('generateVision API error:', data);
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : (data.error?.message || data.details || data.error || 'Failed to generate vision');
        return fail(ErrorCodes.NETWORK, errorMessage);
      }
    } catch (error) {
      console.error('Error generating vision:', error);
      return fail(ErrorCodes.NETWORK, error.message || 'Failed to generate vision');
    }
  },

  /**
   * Polish/improve existing vision text
   * @param {string} existingVision - Current vision statement
   * @param {Array} dreams - Array of user's dreams
   * @returns {Promise<{success: boolean, data?: {text: string}, error?: string}>}
   */
  async polishVision(existingVision, dreams = []) {
    if (!existingVision || existingVision.trim() === '') {
      return fail(ErrorCodes.INVALID_INPUT, 'No vision text to polish');
    }

    try {
      const response = await apiClient.post('/generateVision', {
        userInput: existingVision.trim(),
        dreams: dreams.map(d => ({ title: d.title, category: d.category })),
        action: 'polish'
      });

      let data;
      try {
        const responseText = await response.text();
        console.log('polishVision API response:', response.status, responseText.substring(0, 200));
        data = JSON.parse(responseText);
      } catch (jsonError) {
        // Response is not valid JSON
        console.error('Failed to parse polishVision response:', jsonError);
        return fail(ErrorCodes.NETWORK, `Server error (${response.status}): ${response.statusText || 'Invalid response'}`);
      }

      if (response.ok && data.success) {
        return ok({ text: data.text });
      } else {
        // Extract error message - could be string or object
        console.error('polishVision API error:', data);
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : (data.error?.message || data.details || data.error || 'Failed to polish vision');
        return fail(ErrorCodes.NETWORK, errorMessage);
      }
    } catch (error) {
      console.error('Error polishing vision:', error);
      return fail(ErrorCodes.NETWORK, error.message || 'Failed to polish vision');
    }
  }
};

// Legacy factory function for backward compatibility (deprecated)
export function GptService() {
  return gptService;
}
