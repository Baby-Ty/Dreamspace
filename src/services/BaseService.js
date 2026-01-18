
import { ok, fail } from '../utils/errorHandling.js';
import { ErrorCodes } from '../constants/errors.js';
import { apiClient } from './apiClient.js';

/**
 * BaseService - Base class for all API services
 * Provides common patterns for API requests, error handling, and response processing
 * 
 * Usage:
 *   class MyService extends BaseService {
 *     async getItems() {
 *       return this.handleApiRequest('/items', {
 *         method: 'GET',
 *         successMessage: 'Items retrieved',
 *         errorMessage: 'Failed to fetch items'
 *       });
 *     }
 *   }
 */
export class BaseService {
  constructor() {
    const isLiveSite = typeof window !== 'undefined' && 
      window.location.hostname === 'dreamspace.tylerstewart.co.za';
    
    this.useCosmosDB = isLiveSite || !!(
      import.meta.env.VITE_COSMOS_ENDPOINT && 
      import.meta.env.VITE_APP_ENV === 'production'
    );
  }

  /**
   * Handle an API request with consistent error handling
   * @param {string} endpoint - API endpoint (e.g., '/getUserData/user@example.com')
   * @param {object} options - Request options
   * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE)
   * @param {object} options.body - Request body (for POST/PUT)
   * @param {string} options.successMessage - Console log message on success
   * @param {string} options.errorMessage - Error message to return on failure
   * @param {function} options.transform - Transform function for response data
   * @returns {Promise<{success: boolean, data?: any, error?: object}>}
   */
  async handleApiRequest(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      successMessage = null,
      errorMessage = 'Request failed',
      transform = null
    } = options;

    try {
      // Make API request
      let response;
      if (method === 'GET' || method === 'DELETE') {
        response = await apiClient[method.toLowerCase()](endpoint);
      } else {
        response = await apiClient[method.toLowerCase()](endpoint, body);
      }

      // Handle non-OK responses
      if (!response.ok) {
        return this.handleErrorResponse(response, errorMessage);
      }

      // Parse response
      const result = await response.json();

      // Log success
      if (successMessage) {
        console.log(`✅ ${successMessage}`);
      }

      // Transform data if needed
      const data = transform ? transform(result) : result;

      return ok(data);
    } catch (error) {
      console.error(`❌ ${errorMessage}:`, error);
      return fail(ErrorCodes.UNKNOWN, error.message || errorMessage);
    }
  }

  /**
   * Handle error response from API
   * @param {Response} response - Fetch response object
   * @param {string} defaultMessage - Default error message
   * @returns {Promise<{success: boolean, error: object}>}
   */
  async handleErrorResponse(response, defaultMessage) {
    let errorData;
    
    try {
      errorData = await response.json();
    } catch (e) {
      // Response is not JSON, try text
      try {
        const errorText = await response.text();
        errorData = { 
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: errorText || defaultMessage
        };
      } catch (e2) {
        errorData = { 
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: defaultMessage
        };
      }
    }

    // Parse nested error details if it's a JSON string
    let errorDetails = errorData.details;
    if (typeof errorDetails === 'string') {
      try {
        const parsed = JSON.parse(errorDetails);
        if (parsed.Errors && Array.isArray(parsed.Errors)) {
          errorDetails = parsed.Errors[0] || errorDetails;
        }
      } catch (e) {
        // Keep original details if parsing fails
      }
    }

    const errorMessage = errorDetails 
      ? `${errorData.error || defaultMessage}: ${errorDetails}`
      : (errorData.error || `HTTP ${response.status}: ${response.statusText}`);

    return fail(ErrorCodes.NETWORK, errorMessage);
  }

  /**
   * Validate required parameters
   * @param {object} params - Object with parameter values
   * @param {string[]} required - Array of required parameter names
   * @returns {{success: boolean, error?: object}} - Returns fail() if validation fails, null if OK
   */
  validateParams(params, required) {
    for (const param of required) {
      if (!params[param] || (typeof params[param] === 'string' && !params[param].trim())) {
        return fail(ErrorCodes.VALIDATION, `Invalid ${param} provided`);
      }
    }
    return null; // Validation passed
  }

  /**
   * Check if using Cosmos DB or localStorage fallback
   * @returns {boolean}
   */
  isUsingCosmosDB() {
    return this.useCosmosDB;
  }
}

export default BaseService;