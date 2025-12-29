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
     * NOTE: This returns a temporary blob URL. Use uploadMyPhotoToStorage() for permanent storage.
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
     * Fetches photo from Microsoft Graph, uploads to blob storage, returns permanent URL
     * @param {string} userId - User ID for the upload endpoint
     * @returns {Promise<{success: boolean, data?: string, error?: string}>}
     */
    async uploadMyPhotoToStorage(userId) {
      if (!getToken) {
        return fail(ErrorCodes.INVALID_CONFIG, 'getToken function is required for photo fetch');
      }

      if (!userId) {
        return fail(ErrorCodes.INVALID_INPUT, 'User ID is required');
      }

      try {
        // Step 1: Fetch photo from Microsoft Graph
        const token = await getToken();
        if (!token) {
          return fail(ErrorCodes.AUTH_ERROR, 'No authentication token available');
        }

        const response = await fetch(`${GRAPH_API_BASE}/me/photo/$value`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          // Photo not available - not an error, just return null
          console.log('No profile photo available from Microsoft Graph');
          return ok(null);
        }

        // Step 2: Convert blob to ArrayBuffer for upload
        const photoBlob = await response.blob();
        const arrayBuffer = await photoBlob.arrayBuffer();
        const imageBuffer = new Uint8Array(arrayBuffer);

        // Step 3: Upload to Azure Blob Storage via Azure Function
        const { config } = await import('../utils/env.js');
        const uploadUrl = `${config.api.baseUrl}/uploadProfilePicture/${encodeURIComponent(userId)}`;
        
        console.log('📤 Uploading profile picture to blob storage...');
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream'
          },
          body: imageBuffer
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          const errorMessage = errorData.error || `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`;
          console.error('❌ Failed to upload profile picture:', errorMessage);
          return fail(ErrorCodes.NETWORK, errorMessage);
        }

        const uploadResult = await uploadResponse.json();
        if (uploadResult.success && uploadResult.url) {
          console.log('✅ Profile picture uploaded successfully:', uploadResult.url);
          return ok(uploadResult.url);
        } else {
          return fail(ErrorCodes.NETWORK, uploadResult.error || 'Upload succeeded but no URL returned');
        }
      } catch (error) {
        console.error('❌ Error uploading profile picture:', error);
        return fail(ErrorCodes.NETWORK, error.message || 'Failed to upload profile picture');
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
    },

    /**
     * Create calendar event via backend API
     * @param {string} teamId - Team ID
     * @param {object} meetingData - Meeting data { title, date, time, teamMembers }
     * @returns {Promise<{success: boolean, data?: object, error?: string}>}
     */
    async createCalendarEvent(teamId, meetingData) {
      if (!getToken) {
        return fail(ErrorCodes.INVALID_CONFIG, 'getToken function is required for calendar operations');
      }

      if (!teamId || !meetingData) {
        return fail(ErrorCodes.INVALID_INPUT, 'Team ID and meeting data are required');
      }

      try {
        const token = await getToken();
        if (!token) {
          return fail(ErrorCodes.AUTH_ERROR, 'No authentication token available');
        }

        const { config } = await import('../utils/env.js');
        const isLiveSite = window.location.hostname === 'dreamspace.tylerstewart.co.za';
        const apiBase = isLiveSite ? 'https://func-dreamspace-prod.azurewebsites.net/api' : '/api';
        const scheduleUrl = `${apiBase}/scheduleMeetingWithCalendar/${encodeURIComponent(teamId)}`;

        const response = await fetch(scheduleUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...meetingData,
            accessToken: token
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ 
            error: `HTTP ${response.status}: ${response.statusText}` 
          }));
          return fail(ErrorCodes.NETWORK, errorData.error || errorData.details || 'Failed to create calendar event');
        }

        const result = await response.json();
        if (result.success) {
          return ok(result.data);
        } else {
          return fail(ErrorCodes.NETWORK, result.error || 'Failed to create calendar event');
        }
      } catch (error) {
        console.error('❌ Error creating calendar event:', error);
        return fail(ErrorCodes.NETWORK, error.message || 'Failed to create calendar event');
      }
    }
  };
}

