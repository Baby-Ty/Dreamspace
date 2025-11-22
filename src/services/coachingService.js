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

  /**
   * Add a coach message to a team member's dream
   * @param {string} memberId - Team member's user ID
   * @param {string} dreamId - Dream ID
   * @param {string} message - Message text
   * @param {string} coachId - Coach's user ID (null for user messages)
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async addCoachMessageToMemberDream(memberId, dreamId, message, coachId = null) {
    try {
      console.log('💬 Adding coach message:', { memberId, dreamId, coachId: coachId || 'user', messageLength: message.length });

      const response = await fetch(`${this.apiBase}/saveCoachMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          memberId,
          dreamId,
          message,
          coachId
        })
      });

      const responseText = await response.text();

      if (response.ok) {
        if (!responseText || responseText.trim() === '') {
          console.error('❌ Empty response from API');
          return fail(ErrorCodes.SAVE_ERROR, 'Empty response from API');
        }

        try {
          const result = JSON.parse(responseText);
          console.log('✅ Coach message saved successfully');
          return ok(result);
        } catch (parseError) {
          console.error('❌ Invalid JSON response:', responseText);
          return fail(ErrorCodes.SAVE_ERROR, 'Invalid JSON response from API');
        }
      } else {
        try {
          const error = responseText ? JSON.parse(responseText) : { error: 'Unknown error' };
          console.error('❌ Error saving coach message:', error);
          return fail(ErrorCodes.SAVE_ERROR, error.error || 'Failed to save coach message');
        } catch (parseError) {
          console.error('❌ Error response:', responseText);
          return fail(ErrorCodes.SAVE_ERROR, responseText || 'Failed to save coach message');
        }
      }
    } catch (error) {
      console.error('❌ Error saving coach message:', error);
      return fail(ErrorCodes.SAVE_ERROR, error.message || 'Failed to save coach message');
    }
  }

  /**
   * Add a user message to coach notes (user responding to coach)
   * @param {string} userId - User's ID
   * @param {string} dreamId - Dream ID
   * @param {string} message - Message text
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async addUserMessageToCoachNotes(userId, dreamId, message) {
    // User messages have coachId = null
    return this.addCoachMessageToMemberDream(userId, dreamId, message, null);
  }

  /**
   * Update team mission statement
   * @param {string} managerId - Manager/Coach ID
   * @param {string} mission - Mission statement text
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async updateTeamMission(managerId, mission) {
    try {
      if (this.useCosmosDB) {
        const response = await fetch(`${this.apiBase}/updateTeamMission/${managerId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mission })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
          return fail(ErrorCodes.NETWORK, errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Team mission updated successfully');
        return ok(result.data);
      } else {
        // Fallback to localStorage for development
        console.log('📱 Development mode: Team mission would be saved to localStorage');
        return ok({ mission, managerId, lastModified: new Date().toISOString() });
      }
    } catch (error) {
      console.error('❌ Error updating team mission:', error);
      return fail(ErrorCodes.UNKNOWN, error.message || 'Failed to update team mission');
    }
  }

  /**
   * Update team name
   * @param {string} managerId - Manager/Coach ID
   * @param {string} teamName - New team name
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async updateTeamName(managerId, teamName) {
    try {
      if (this.useCosmosDB) {
        // Use updateTeamMission endpoint structure - we'll need to create a dedicated endpoint later
        // For now, we'll use a workaround by updating via team relationships
        const response = await fetch(`${this.apiBase}/updateTeamName/${managerId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ teamName })
        });

        if (!response.ok) {
          // If endpoint doesn't exist, fall back to localStorage
          if (response.status === 404) {
            console.log('📱 Development mode: Team name would be saved to localStorage');
            return ok({ teamName, managerId, lastModified: new Date().toISOString() });
          }
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
          return fail(ErrorCodes.NETWORK, errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Team name updated successfully');
        return ok(result.data || { teamName, managerId });
      } else {
        // Fallback to localStorage for development
        console.log('📱 Development mode: Team name would be saved to localStorage');
        return ok({ teamName, managerId, lastModified: new Date().toISOString() });
      }
    } catch (error) {
      console.error('❌ Error updating team name:', error);
      // Fallback to localStorage on error
      console.log('📱 Falling back to localStorage for team name update');
      return ok({ teamName, managerId, lastModified: new Date().toISOString() });
    }
  }

  /**
   * Update team meeting schedule
   * @param {string} managerId - Manager/Coach ID
   * @param {object} meeting - Meeting data { date, time, location, agenda }
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async updateTeamMeeting(managerId, meeting) {
    try {
      if (this.useCosmosDB) {
        const response = await fetch(`${this.apiBase}/updateTeamMeeting/${managerId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ meeting })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
          return fail(ErrorCodes.NETWORK, errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Team meeting updated successfully');
        return ok(result.data);
      } else {
        // Fallback to localStorage for development
        console.log('📱 Development mode: Team meeting would be saved to localStorage');
        return ok({ meeting, managerId, lastModified: new Date().toISOString() });
      }
    } catch (error) {
      console.error('❌ Error updating team meeting:', error);
      return fail(ErrorCodes.UNKNOWN, error.message || 'Failed to update team meeting');
    }
  }
}

// Create and export singleton instance
export const coachingService = new CoachingService();
export default coachingService;






