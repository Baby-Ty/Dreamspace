// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { z } from 'zod';
import { ok, fail } from '../utils/errorHandling.js';
import { ERR, ErrorCodes } from '../constants/errors.js';

// Zod schema for Unsplash photo
const UnsplashPhotoSchema = z.object({
  id: z.string(),
  urls: z.object({
    small: z.string().url(),
    regular: z.string().url().optional()
  }),
  alt_description: z.string().nullable().optional(),
  user: z.object({
    name: z.string()
  }).optional()
});

// Zod schema for Unsplash search response
const UnsplashSearchResponseSchema = z.object({
  results: z.array(UnsplashPhotoSchema),
  total: z.number().optional(),
  total_pages: z.number().optional()
});

/**
 * Factory function that creates an Unsplash service
 */
export function UnsplashService(apiKey) {
  const UNSPLASH_API_BASE = 'https://api.unsplash.com';

  return {
    /**
     * Search for photos by query
     */
    async search(query, perPage = 12) {
      if (!query || query.trim() === '') {
        return fail(ErrorCodes.INVALID_INPUT, 'Search query is required');
      }

      if (!apiKey || apiKey === 'your_actual_access_key_here') {
        return fail(ErrorCodes.INVALID_CONFIG, 'Valid Unsplash API key is required');
      }

      try {
        const url = `${UNSPLASH_API_BASE}/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&client_id=${apiKey}`;
        
        const response = await fetch(url);

        if (!response.ok) {
          return fail(
            `HTTP_${response.status}`,
            `Unsplash API error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        // Validate response with Zod
        try {
          const validated = UnsplashSearchResponseSchema.parse(data);
          return ok(validated.results);
        } catch (validationError) {
          return fail(ErrorCodes.VALIDATION, 'Invalid Unsplash API response structure', validationError.errors);
        }
      } catch (error) {
        return fail(ErrorCodes.NETWORK, error.message || 'Failed to search photos');
      }
    }
  };
}

