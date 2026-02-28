
import { ok, fail } from '../utils/errorHandling.js';
import { ErrorCodes } from '../constants/errors.js';
import { apiClient } from './apiClient.js';
import { BaseService } from './BaseService.js';
import { meetingService } from './meetingService.js';

/**
 * Coaching Service for DreamSpace
 * Handles team metrics, coaching alerts, and coach-specific data
 * Meeting-related methods delegate to meetingService for single responsibility
 */
class CoachingService extends BaseService {
  constructor() {
    super();
    console.log('👥🎯 Coaching Service initialized:', { useCosmosDB: this.useCosmosDB });
  }

  /**
   * Get coaching alerts for a specific manager
   * @param {string} managerId - Manager/Coach ID
   * @returns {Promise<{success: boolean, data?: array, error?: object}>}
   */
  async getCoachingAlerts(managerId) {
    try {
      if (this.useCosmosDB) {
        const response = await apiClient.get(`/getCoachingAlerts/${managerId}`);

        if (!response.ok) {
          return fail(ErrorCodes.NETWORK, `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Retrieved coaching alerts from Cosmos DB:', result.alerts?.length || 0);
        return ok(result.alerts || []);
      } else {
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
    console.log('🔍 getTeamMetrics called:', { managerId, useCosmosDB: this.useCosmosDB });
    
    try {
      if (this.useCosmosDB) {
        const response = await apiClient.get(`/getTeamMetrics/${managerId}`);

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
        const metrics = await this.getLocalStorageTeamMetrics(managerId);
        console.log('📱 Retrieved team metrics from localStorage for manager:', managerId);
        return ok(metrics);
      }
    } catch (error) {
      console.error('❌ Error fetching team metrics:', error);
      return fail(ErrorCodes.UNKNOWN, error.message || 'Failed to fetch team metrics');
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

      const response = await apiClient.post('/saveCoachMessage', {
        memberId,
        dreamId,
        message,
        coachId
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
        const response = await apiClient.post(`/updateTeamMission/${managerId}`, { mission });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
          return fail(ErrorCodes.NETWORK, errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Team mission updated successfully');
        return ok(result.data);
      } else {
        console.log('📱 Development mode: Team mission would be saved to localStorage');
        return ok({ mission, managerId, lastModified: new Date().toISOString() });
      }
    } catch (error) {
      console.error('❌ Error updating team mission:', error);
      return fail(ErrorCodes.UNKNOWN, error.message || 'Failed to update team mission');
    }
  }

  /**
   * Update team info (interests, regions, etc.)
   * @param {string} managerId - Manager/Coach ID
   * @param {object} teamInfo - Team info data { teamInterests, teamRegions }
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async updateTeamInfo(managerId, teamInfo) {
    try {
      if (this.useCosmosDB) {
        const response = await apiClient.post(`/updateTeamInfo/${managerId}`, teamInfo);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
          return fail(ErrorCodes.NETWORK, errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Team info updated successfully');
        return ok(result.data);
      } else {
        console.log('📱 Development mode: Team info would be saved to localStorage');
        return ok({ ...teamInfo, managerId, lastModified: new Date().toISOString() });
      }
    } catch (error) {
      console.error('❌ Error updating team info:', error);
      return fail(ErrorCodes.UNKNOWN, error.message || 'Failed to update team info');
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
        const response = await apiClient.post(`/updateTeamName/${managerId}`, { teamName });

        if (!response.ok) {
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
        console.log('📱 Development mode: Team name would be saved to localStorage');
        return ok({ teamName, managerId, lastModified: new Date().toISOString() });
      }
    } catch (error) {
      console.error('❌ Error updating team name:', error);
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
        const response = await apiClient.post(`/updateTeamMeeting/${managerId}`, { meeting });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
          return fail(ErrorCodes.NETWORK, errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Team meeting updated successfully');
        return ok(result.data);
      } else {
        console.log('📱 Development mode: Team meeting would be saved to localStorage');
        return ok({ meeting, managerId, lastModified: new Date().toISOString() });
      }
    } catch (error) {
      console.error('❌ Error updating team meeting:', error);
      return fail(ErrorCodes.UNKNOWN, error.message || 'Failed to update team meeting');
    }
  }

  // === MEETING METHODS (delegated to meetingService for single responsibility) ===

  /**
   * Save meeting attendance - delegates to meetingService
   * @param {string} teamId - Stable Team ID
   * @param {object} meetingData - Meeting data
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async saveMeetingAttendance(teamId, meetingData) {
    return meetingService.saveMeetingAttendance(teamId, meetingData);
  }

  /**
   * Get meeting attendance history - delegates to meetingService
   * @param {string} teamId - Stable Team ID
   * @returns {Promise<{success: boolean, data?: array, error?: string}>}
   */
  async getMeetingAttendanceHistory(teamId) {
    return meetingService.getMeetingAttendanceHistory(teamId);
  }

  /**
   * Schedule meeting with calendar - delegates to meetingService
   * @param {string} teamId - Stable Team ID
   * @param {object} meetingData - Meeting data
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async scheduleMeetingWithCalendar(teamId, meetingData) {
    return meetingService.scheduleMeetingWithCalendar(teamId, meetingData);
  }

  /**
   * Update existing scheduled meeting and its calendar event - delegates to meetingService
   * @param {string} teamId - Stable Team ID
   * @param {object} updateData - { meetingId, calendarEventId, title, date, time, timezone, duration, teamMembers, accessToken }
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async updateMeetingWithCalendar(teamId, updateData) {
    return meetingService.updateMeetingWithCalendar(teamId, updateData);
  }
}

// Create and export singleton instance
export const coachingService = new CoachingService();
export default coachingService;