// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.

import { ok, fail } from '../utils/errorHandling.js';
import { ErrorCodes } from '../constants/errors.js';
import { logger } from '../utils/logger.js';
import { safeParseHealthResponse } from '../schemas/health.js';

/**
 * Health Service for DreamSpace
 * Handles backend health check API calls
 */
class HealthService {
  constructor() {
    const isLiveSite = window.location.hostname === 'dreamspace.tylerstewart.co.za';
    this.apiBase = isLiveSite ? 'https://func-dreamspace-prod.azurewebsites.net/api' : '/api';
    
    logger.debug('health-service', 'Health Service initialized', {
      apiBase: this.apiBase,
      isLiveSite
    });
  }

  /**
   * Get health status from backend API
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async getHealthStatus() {
    try {
      logger.debug('health-service', 'Fetching health status');
      
      const response = await fetch(`${this.apiBase}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-cache'
      });

      if (!response.ok) {
        logger.warn('health-service', 'Health check returned non-OK status', {
          status: response.status,
          statusText: response.statusText
        });
        return fail(ErrorCodes.NETWORK, `HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData = await response.json();
      
      // Validate response with Zod
      const parseResult = safeParseHealthResponse(rawData);
      
      if (!parseResult.success) {
        logger.error('health-service', 'Health response validation failed', {
          errors: parseResult.error.errors,
          rawData
        });
        return fail(ErrorCodes.VALIDATION, 'Invalid health response format');
      }
      
      const data = parseResult.data;
      
      logger.info('health-service', 'Health status fetched successfully', {
        status: data.status,
        service: data.service
      });
      
      return ok(data);
    } catch (error) {
      logger.error('health-service', 'Failed to fetch health status', {
        error: error.message,
        stack: error.stack
      });
      return fail(ErrorCodes.NETWORK, error.message || 'Failed to fetch health status');
    }
  }
}

// Export singleton instance
const healthService = new HealthService();
export default healthService;

