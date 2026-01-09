/**
 * Centralized API Client with Authentication
 * 
 * All services should use this instead of raw fetch to ensure
 * authentication tokens are properly included in API requests.
 * 
 * Usage:
 *   import { apiClient } from './apiClient';
 *   const response = await apiClient.get('/getUserData/user@example.com');
 *   const response = await apiClient.post('/saveItem', { userId, type, itemData });
 */

class ApiClient {
  constructor() {
    const isLiveSite = typeof window !== 'undefined' && 
      window.location.hostname === 'dreamspace.tylerstewart.co.za';
    
    this.baseUrl = isLiveSite 
      ? 'https://func-dreamspace-prod.azurewebsites.net/api' 
      : '/api';
    
    this._getToken = null;
    
    console.log('🔐 API Client initialized:', { baseUrl: this.baseUrl });
  }

  /**
   * Set the token getter function (called from AuthContext after login)
   * @param {Function} getToken - Async function that returns the ID token
   */
  setTokenGetter(getToken) {
    this._getToken = getToken;
    console.log('🔐 API Client: Token getter configured');
  }

  /**
   * Clear the token getter (called on logout)
   */
  clearTokenGetter() {
    this._getToken = null;
    console.log('🔐 API Client: Token getter cleared');
  }

  /**
   * Get authorization headers with Bearer token
   * @returns {Promise<object>} Headers object with Authorization if token available
   */
  async _getAuthHeaders() {
    if (!this._getToken) {
      return {};
    }
    
    try {
      const token = await this._getToken();
      if (token) {
        return { 'Authorization': `Bearer ${token}` };
      }
    } catch (error) {
      console.warn('🔐 API Client: Failed to get token:', error.message);
    }
    
    return {};
  }

  /**
   * Make an authenticated fetch request
   * @param {string} endpoint - API endpoint (e.g., '/getUserData/user@example.com')
   * @param {object} options - Fetch options (method, body, headers, etc.)
   * @returns {Promise<Response>} Fetch response
   */
  async fetch(endpoint, options = {}) {
    const authHeaders = await this._getAuthHeaders();
    
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(options.headers || {})
      }
    });
    
    // Log auth failures for debugging
    if (response.status === 401) {
      console.warn('🔐 API Client: 401 Unauthorized -', endpoint);
    } else if (response.status === 403) {
      console.warn('🔐 API Client: 403 Forbidden -', endpoint);
    }
    
    return response;
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Response>}
   */
  async get(endpoint) {
    return this.fetch(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {object} body - Request body (will be JSON stringified)
   * @returns {Promise<Response>}
   */
  async post(endpoint, body) {
    return this.fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {object} body - Request body (will be JSON stringified)
   * @returns {Promise<Response>}
   */
  async put(endpoint, body) {
    return this.fetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Response>}
   */
  async delete(endpoint) {
    return this.fetch(endpoint, { method: 'DELETE' });
  }

  /**
   * Get the base URL (for services that need it)
   * @returns {string}
   */
  getBaseUrl() {
    return this.baseUrl;
  }
}

// Singleton instance
export const apiClient = new ApiClient();
export default apiClient;
