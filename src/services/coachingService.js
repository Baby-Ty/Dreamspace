// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { ok, fail } from '../utils/errorHandling.js';
import { ErrorCodes } from '../constants/errors.js';

/**
 * Coaching Service for DreamSpace
 * Handles team metrics, coaching alerts, and coach-specific data
 */
class CoachingService {
  constructor() {
    const isLiveSite = window.location.hostname === 'dreamspace.tylerstewart.co.za';
    this.apiBase = isLiveSite ? 'https://func-dreamspace-prod.azurewebsites.net/api' : '/api';
    this.useCosmosDB = isLiveSite || !!(import.meta.env.VITE_COSMOS_ENDPOINT && import.meta.env.VITE_APP_ENV === 'production');
    
    console.log('👥🎯 Coaching Service initialized:', {
      useCosmosDB: this.useCosmosDB,
      apiBase: this.apiBase
    });
  }

  /**
   * Get coaching alerts for a specific manager
   * @param {string} managerId - Manager/Coach ID
   * @returns {Promise<{success: boolean, data?: array, error?: object}>}
   */
  async getCoachingAlerts(managerId) {
    try {
      if (this.useCosmosDB) {
        const response = await fetch(`${this.apiBase}/getCoachingAlerts/${managerId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          return fail(ErrorCodes.NETWORK, `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Retrieved coaching alerts from Cosmos DB:', result.alerts?.length || 0);
        return ok(result.alerts || []);
      } else {
        // Fallback to localStorage for development
        const alerts = await this.getLocalStorageCoachingAlerts(managerId);
        console.log('📱 Retrieved coaching alerts from localStorage:', alerts.length);
        return ok(alerts);
      }
    } catch (error) {
      console.error('❌ Error fetching coaching alerts:', error);
      return fail(ErrorCodes.UNKNOWN, error.message || 'Failed to fetch coaching alerts');
    }
  }

  /**
   * Get team metrics for a specific manager
   * @param {string} managerId - Manager/Coach ID
   * @returns {Promise<{success: boolean, data?: object, error?: object}>}
   */
  async getTeamMetrics(managerId) {
    console.log('🔍 getTeamMetrics called:', {
      managerId,
      useCosmosDB: this.useCosmosDB
    });
    
    try {
      if (this.useCosmosDB) {
        const response = await fetch(`${this.apiBase}/getTeamMetrics/${managerId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          return fail(ErrorCodes.NETWORK, `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Retrieved team metrics from Cosmos DB for manager:', managerId);
        console.log('🔍 Team metrics response:', {
          hasResult: !!result,
          hasMetrics: !!result.metrics,
          teamSize: result.metrics?.teamSize,
          teamMembers: result.metrics?.teamMembers?.length
        });
        return ok(result.metrics);
      } else {
        // Fallback to localStorage for development
        const metrics = await this.getLocalStorageTeamMetrics(managerId);
        console.log('📱 Retrieved team metrics from localStorage for manager:', managerId);
        return ok(metrics);
      }
    } catch (error) {
      console.error('❌ Error fetching team metrics:', error);
      return fail(ErrorCodes.UNKNOWN, error.message || 'Failed to fetch team metrics');
    }
  }

  // === LOCAL STORAGE FALLBACK METHODS (Development Mode) ===

  /**
   * Get coaching alerts from localStorage (development mode)
   * @param {string} managerId - Manager/Coach ID
   * @returns {Promise<array>}
   */
  async getLocalStorageCoachingAlerts(managerId) {
    try {
      const { getCoachingAlerts } = await import('../data/mockData.js');
      return getCoachingAlerts(managerId);
    } catch (error) {
      console.error('Error loading coaching alerts:', error);
      return [];
    }
  }

  /**
   * Get team metrics from localStorage (development mode)
   * @param {string} managerId - Manager/Coach ID
   * @returns {Promise<object|null>}
   */
  async getLocalStorageTeamMetrics(managerId) {
    try {
      const { getTeamMetrics } = await import('../data/mockData.js');
      return getTeamMetrics(managerId);
    } catch (error) {
      console.error('Error loading team metrics:', error);
      return null;
    }
  }
}

// Create and export singleton instance
export const coachingService = new CoachingService();
export default coachingService;



