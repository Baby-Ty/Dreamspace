// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { ok, fail } from '../utils/errorHandling.js';
import { ErrorCodes } from '../constants/errors.js';
import { apiClient } from './apiClient.js';

/**
 * Style modifiers for image generation
 * Each style has a display name and the actual prompt modifier
 */
export const STYLE_MODIFIERS = {
  STYLIZED_DIGITAL: {
    id: 'stylized_digital',
    label: 'Stylized Digital Painting',
    modifier: 'stylized digital painting, soft brush textures, warm lighting, smooth gradients, gentle color exaggeration, clean modern illustration style'
  },
  VIBRANT_COASTAL: {
    id: 'vibrant_coastal',
    label: 'Vibrant Coastal Illustration',
    modifier: 'vibrant illustrated scenery, warm daylight, smooth shading, gentle highlights, slightly stylized natural elements'
  },
  SEMI_REALISTIC: {
    id: 'semi_realistic',
    label: 'Semi-Realistic Landscape Art',
    modifier: 'semi-realistic environment art, crisp edges, vibrant tones, atmospheric depth, painterly highlights, detailed but not photorealistic'
  },
  PHOTOREALISTIC_CINEMATIC: {
    id: 'photorealistic_cinematic',
    label: 'Photorealistic Cinematic',
    modifier: 'photorealistic detail, cinematic lighting, shallow depth of field, soft film grain, high-contrast highlights'
  }
};

/**
 * Image types for generation
 */
export const IMAGE_TYPES = {
  DREAM: 'dream',
  BACKGROUND_CARD: 'background_card'
};

/**
 * DALL-E Service - calls backend API to generate images
 * Uses backend proxy to keep API key server-side and avoid CORS issues
 */
export const dalleService = {
  /**
   * Generate an image using DALL-E 3 via backend API
   * @param {string} userSearchTerm - User's search term/description
   * @param {object} options - Generation options
   * @param {string} options.size - Image size (default: "1024x1024")
   * @param {string} options.quality - Image quality (default: "hd")
   * @param {string} options.model - Model to use (default: "dall-e-3")
   * @param {string} options.imageType - Type of image: 'dream' or 'background_card' (default: 'dream')
   * @param {string} options.styleModifierId - Style modifier ID from STYLE_MODIFIERS (optional)
   * @param {string} options.customStyle - Custom style text entered by user (optional)
   * @returns {Promise<{success: boolean, data?: {url: string, revisedPrompt?: string}, error?: string}>}
   */
  async generate(userSearchTerm, options = {}) {
    if (!userSearchTerm || userSearchTerm.trim() === '') {
      return fail(ErrorCodes.INVALID_INPUT, 'Search term is required');
    }

    try {
      // Debug: Check if token getter is configured
      console.log('🔐 dalleService: Checking authentication before image generation...', {
        hasTokenGetter: !!apiClient._getToken
      });
      
      // Use apiClient for automatic authentication
      const response = await apiClient.post('/generateImage', {
        userSearchTerm: userSearchTerm.trim(),
        options: {
          size: options.size || '1024x1024',
          quality: options.quality || 'hd',
          model: options.model || 'dall-e-3',
          imageType: options.imageType || IMAGE_TYPES.DREAM,
          styleModifierId: options.styleModifierId || null,
          customStyle: options.customStyle || null
        }
      });

      let data;
      try {
        const responseText = await response.text();
        console.log('generateImage API response:', response.status, responseText.substring(0, 200));
        data = JSON.parse(responseText);
      } catch (jsonError) {
        // Response is not valid JSON
        console.error('Failed to parse generateImage response:', jsonError);
        return fail(ErrorCodes.NETWORK, `Server error (${response.status}): ${response.statusText || 'Invalid response'}`);
      }

      if (response.ok && data.success) {
        return ok({
          url: data.url,
          revisedPrompt: data.revisedPrompt
        });
      } else {
        // Extract error message - could be string or object
        console.error('generateImage API error:', data);
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : (data.error?.message || data.details || data.error || 'Failed to generate image');
        return fail(ErrorCodes.NETWORK, errorMessage);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      return fail(ErrorCodes.NETWORK, error.message || 'Failed to generate image');
    }
  }
};

/**
 * Factory function for backward compatibility
 * @deprecated Use dalleService directly instead
 */
export function DalleService() {
  return dalleService;
}

