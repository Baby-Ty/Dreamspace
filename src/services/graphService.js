// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { ok, fail } from '../utils/errorHandling.js';
import { ERR, ErrorCodes } from '../constants/errors.js';
import { MeSchema, UserSchema, UserListSchema } from '../schemas/graph.js';

/**
 * Factory function that creates a GraphService with authenticated fetch
 * @param {Function} authedFetch - Authenticated fetch function for JSON responses
 * @param {Function} getToken - Token getter function for custom requests (like blobs)
 */
export function GraphService(authedFetch, getToken = null) {
  const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

  return {
    /**
     * Get current user profile
     */
    async getMe() {
      const result = await authedFetch(`${GRAPH_API_BASE}/me`);
      
      if (!result.success) {
        return result;
      }

      try {
        const validated = MeSchema.parse(result.data);
        return ok(validated);
      } catch (error) {
        return fail(ErrorCodes.VALIDATION, 'Invalid user data structure', error.errors);
      }
    },

    /**
     * Get current user's profile photo
     * Returns a blob URL for the photo, or null if not available
     */
    async getMyPhoto() {
      if (!getToken) {
        return fail(ErrorCodes.INVALID_CONFIG, 'getToken function is required for photo fetch');
      }

      try {
        const token = await getToken();
        if (!token) {
          return ok(null);
        }

        const response = await fetch(`${GRAPH_API_BASE}/me/photo/$value`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          // Photo not available is not an error - return success with null
          console.log('No profile photo available');
          return ok(null);
        }

        const photoBlob = await response.blob();
        const blobUrl = URL.createObjectURL(photoBlob);
        return ok(blobUrl);
      } catch (error) {
        console.log('Error fetching photo, using fallback:', error.message);
        return ok(null);
      }
    },

    /**
     * Upload current user's profile photo to Azure Blob Storage
     * Returns the permanent blob storage URL, or null if not available
     * @param {string} userId - User ID for the blob filename
     */
    async uploadMyPhotoToStorage(userId) {
      if (!getToken) {
        return fail(ErrorCodes.INVALID_CONFIG, 'getToken function is required for photo fetch');
      }

      if (!userId) {
        return fail(ErrorCodes.INVALID_INPUT, 'User ID is required');
      }

      try {
        const token = await getToken();
        if (!token) {
          return ok(null);
        }

        // Fetch the photo from Microsoft Graph
        const response = await fetch(`${GRAPH_API_BASE}/me/photo/$value`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          // Photo not available is not an error - return success with null
          console.log('No profile photo available from Microsoft 365');
          return ok(null);
        }

        const photoBlob = await response.blob();
        
        // Convert blob to buffer for upload
        const arrayBuffer = await photoBlob.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Get API base URL from environment or use default
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
        
        // Upload to Azure Blob Storage via our API
        const uploadResponse = await fetch(`${apiBaseUrl}/uploadProfilePicture/${encodeURIComponent(userId)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'image/jpeg'
          },
          body: buffer
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          console.error('Failed to upload photo to blob storage:', errorData);
          return fail(ErrorCodes.NETWORK, 'Failed to upload profile picture', errorData);
        }

        const result = await uploadResponse.json();
        
        if (result.success && result.url) {
          console.log('Successfully uploaded profile picture to blob storage:', result.url);
          return ok(result.url);
        } else {
          return fail(ErrorCodes.NETWORK, 'Upload succeeded but no URL returned');
        }
      } catch (error) {
        console.log('Error uploading photo to storage, using fallback:', error.message);
        return ok(null); // Return null instead of failing to allow graceful degradation
      }
    },

    /**
     * Get user by ID
     */
    async getUser(userId) {
      if (!userId) {
        return fail(ErrorCodes.INVALID_INPUT, 'User ID is required');
      }

      const result = await authedFetch(`${GRAPH_API_BASE}/users/${userId}`);
      
      if (!result.success) {
        return result;
      }

      try {
        const validated = UserSchema.parse(result.data);
        return ok(validated);
      } catch (error) {
        return fail(ErrorCodes.VALIDATION, 'Invalid user data structure', error.errors);
      }
    },

    /**
     * Search users by query
     */
    async searchUsers(query) {
      if (!query || query.trim() === '') {
        return fail(ErrorCodes.INVALID_INPUT, 'Search query is required');
      }

      const searchUrl = `${GRAPH_API_BASE}/users?$search="displayName:${encodeURIComponent(query)}" OR "mail:${encodeURIComponent(query)}"&$top=10`;
      const result = await authedFetch(searchUrl, {
        headers: {
          'ConsistencyLevel': 'eventual'
        }
      });
      
      if (!result.success) {
        return result;
      }

      try {
        const validated = UserListSchema.parse(result.data);
        return ok(validated.value);
      } catch (error) {
        return fail(ErrorCodes.VALIDATION, 'Invalid users data structure', error.errors);
      }
    }
  };
}

