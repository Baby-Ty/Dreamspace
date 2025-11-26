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
 * Factory function that creates a DALL-E service
 * @param {string} apiKey - OpenAI API key
 */
export function DalleService(apiKey) {
  const OPENAI_API_BASE = 'https://api.openai.com/v1';

  /**
   * System prompts for different image types
   */
  const SYSTEM_PROMPTS = {
    [IMAGE_TYPES.DREAM]: `You generate visually engaging, symbolic images that represent a user's dream or goal. 
The image must NOT contain identifiable people, faces, skin tone details, or personal identity cues.
Use creative symbolism, scenery, environments, objects, silhouettes, distant figures, or hands-only shots to convey the idea. 
Lean into cinematic, inspiring, and emotionally uplifting composition — rich colors, strong mood, and clear focus.
The result should feel motivating, aspirational, and connected to the dream's theme, without depicting a specific real person.`,
    
    [IMAGE_TYPES.BACKGROUND_CARD]: `You generate clean, expressive background images for profile cards. 
Images should reflect the user's personality or interests, but remain subtle and not distract from overlaid text.
Do NOT include identifiable people or faces. 
Use scenery, objects, textures, abstracts, soft landscapes, cityscapes, bokeh, or symbolic imagery. 
Keep the image visually appealing, balanced, and easy for UI text to sit on top of.
Avoid clutter, heavy noise, harsh contrast, or busy compositions.
The final result should feel personal, aesthetic, and modern.`
  };

  /**
   * Build prompt for dream images
   * @param {string} userInput - User's dream description
   * @param {string} styleModifier - Optional style modifier
   */
  const buildDreamPrompt = (userInput, styleModifier = '') => {
    let prompt = `Create an inspiring, symbolic image that represents the dream: ${userInput}

Make the image visually strong, motivating, and emotionally uplifting.  
Use scenery, objects, environments, silhouettes, distant figures, or hands-only shots — no identifiable people or faces.`;
    
    if (styleModifier) {
      prompt += `\n\nStyle: ${styleModifier}`;
    }
    
    return prompt;
  };

  /**
   * Build prompt for background card images
   * @param {string} userInput - User's theme description
   * @param {string} styleModifier - Optional style modifier
   */
  const buildBackgroundCardPrompt = (userInput, styleModifier = '') => {
    let prompt = `Create a clean, visually appealing background image based on the theme: "${userInput}".

Make the image expressive but not distracting, with a subtle composition that works behind UI text.  
Use scenery, objects, abstract shapes, or symbolic visuals — but no identifiable people or faces.`;
    
    if (styleModifier) {
      prompt += `\n\nStyle: ${styleModifier}`;
    }
    
    return prompt;
  };

  /**
   * Build DreamSpace-style prompt from user search term (legacy - kept for backward compatibility)
   * @deprecated Use buildDreamPrompt or buildBackgroundCardPrompt instead
   */
  const buildDreamSpacePrompt = (userSearchTerm, styleModifier = '') => {
    // Default to dream image type for backward compatibility
    return buildDreamPrompt(userSearchTerm, styleModifier);
  };

  return {
    /**
     * Generate an image using DALL-E 3
     * @param {string} userSearchTerm - User's search term/description
     * @param {object} options - Generation options
     * @param {string} options.size - Image size (default: "1024x1024")
     * @param {string} options.quality - Image quality (default: "hd")
     * @param {string} options.model - Model to use (default: "dall-e-3")
     * @param {string} options.imageType - Type of image: 'dream' or 'background_card' (default: 'dream')
     * @param {string} options.styleModifierId - Style modifier ID from STYLE_MODIFIERS (optional)
     * @param {string} options.customStyle - Custom style text entered by user (optional)
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
        model = 'dall-e-3',
        imageType = IMAGE_TYPES.DREAM,
        styleModifierId = null,
        customStyle = null
      } = options;

      // Get style modifier text - prefer custom style if provided
      let styleModifier = '';
      if (customStyle && customStyle.trim()) {
        styleModifier = customStyle.trim();
      } else if (styleModifierId) {
        styleModifier = Object.values(STYLE_MODIFIERS).find(s => s.id === styleModifierId)?.modifier || '';
      }

      // Build the prompt based on image type
      let prompt;
      if (imageType === IMAGE_TYPES.BACKGROUND_CARD) {
        prompt = buildBackgroundCardPrompt(userSearchTerm.trim(), styleModifier);
      } else {
        prompt = buildDreamPrompt(userSearchTerm.trim(), styleModifier);
      }

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

