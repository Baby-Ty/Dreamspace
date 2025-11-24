// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { z } from 'zod';
import { ok, fail } from '../utils/errorHandling.js';
import { ErrorCodes } from '../constants/errors.js';

// Zod schema for DALL-E image generation response
const DalleImageResponseSchema = z.object({
  data: z.array(z.object({
    url: z.string().url(),
    revised_prompt: z.string().optional()
  })).min(1),
  created: z.number().optional()
});

/**
 * Factory function that creates a DALL-E service
 * @param {string} apiKey - OpenAI API key
 */
export function DalleService(apiKey) {
  const OPENAI_API_BASE = 'https://api.openai.com/v1';

  /**
   * Build DreamSpace-style prompt from user search term
   * Combines user input with inspirational, realistic aesthetic
   */
  const buildDreamSpacePrompt = (userSearchTerm) => {
    const baseStyle = 'inspirational and aspirational scene, bright and motivating atmosphere, realistic photographic style, authentic lifestyle imagery, professional quality, uplifting and success-oriented';
    return `A ${userSearchTerm}, ${baseStyle}`;
  };

  return {
    /**
     * Generate an image using DALL-E 3
     * @param {string} userSearchTerm - User's search term/description
     * @param {object} options - Generation options
     * @param {string} options.size - Image size (default: "1024x1024")
     * @param {string} options.quality - Image quality (default: "hd")
     * @param {string} options.model - Model to use (default: "dall-e-3")
     */
    async generate(userSearchTerm, options = {}) {
      if (!userSearchTerm || userSearchTerm.trim() === '') {
        return fail(ErrorCodes.INVALID_INPUT, 'Search term is required');
      }

      if (!apiKey || apiKey.trim() === '') {
        return fail(ErrorCodes.INVALID_CONFIG, 'Valid OpenAI API key is required');
      }

      const {
        size = '1024x1024',
        quality = 'hd',
        model = 'dall-e-3'
      } = options;

      // Build the prompt with DreamSpace aesthetic
      const prompt = buildDreamSpacePrompt(userSearchTerm.trim());

      try {
        const url = `${OPENAI_API_BASE}/images/generations`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            prompt,
            n: 1, // DALL-E 3 only supports n=1
            size,
            quality
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || `OpenAI API error: ${response.status} ${response.statusText}`;
          return fail(
            `HTTP_${response.status}`,
            errorMessage
          );
        }

        const data = await response.json();

        // Validate response with Zod
        try {
          const validated = DalleImageResponseSchema.parse(data);
          // Return the image URL (DALL-E 3 returns 1 image)
          return ok({
            url: validated.data[0].url,
            revisedPrompt: validated.data[0].revised_prompt || prompt
          });
        } catch (validationError) {
          return fail(ErrorCodes.VALIDATION, 'Invalid OpenAI API response structure', validationError.errors);
        }
      } catch (error) {
        return fail(ErrorCodes.NETWORK, error.message || 'Failed to generate image');
      }
    }
  };
}

