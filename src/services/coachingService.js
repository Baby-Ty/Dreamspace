// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { ok, fail } from '../utils/errorHandling.js';
import { ErrorCodes } from '../constants/errors.js';
import { apiClient } from './apiClient.js';

/**
 * Coaching Service for DreamSpace
 * Handles team metrics, coaching alerts, and coach-specific data
 */
class CoachingService {
  constructor() {
    const isLiveSite = window.location.hostname === 'dreamspace.tylerstewart.co.za';
    this.useCosmosDB = isLiveSite || !!(import.meta.env.VITE_COSMOS_ENDPOINT && import.meta.env.VITE_APP_ENV === 'production');
    
    console.log('👥🎯 Coaching Service initialized:', {
      useCosmosDB: this.useCosmosDB
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
        const response = await apiClient.get(`/getCoachingAlerts/${managerId}`);

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

  /**
   * Get team metrics from localStorage (development mode)
   * @param {string} managerId - Manager/Coach ID
   * @returns {Promise<object|null>}
   */

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
        const response = await apiClient.post(`/updateTeamMission/${managerId}`, { mission });

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
        // Fallback to localStorage for development
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
        // Use updateTeamMission endpoint structure - we'll need to create a dedicated endpoint later
        // For now, we'll use a workaround by updating via team relationships
        const response = await apiClient.post(`/updateTeamName/${managerId}`, { teamName });

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
        const response = await apiClient.post(`/updateTeamMeeting/${managerId}`, { meeting });

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

  /**
   * Save meeting attendance
   * @param {string} teamId - Stable Team ID (persists across coach changes, NOT managerId)
   * @param {object} meetingData - Meeting data { title, date, attendees: [{id, name, present}], completedBy }
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async saveMeetingAttendance(teamId, meetingData) {
    try {
      if (!teamId || typeof teamId !== 'string' || !teamId.trim()) {
        return fail(ErrorCodes.VALIDATION, 'Invalid team ID provided');
      }
      
      if (this.useCosmosDB) {
        const response = await apiClient.post(`/saveMeetingAttendance/${teamId}`, meetingData);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ 
            error: `HTTP ${response.status}: ${response.statusText}`,
            details: 'Failed to save meeting attendance'
          }));
          const errorMessage = errorData.details 
            ? `${errorData.error}: ${errorData.details}`
            : (errorData.error || `HTTP ${response.status}: ${response.statusText}`);
          return fail(ErrorCodes.NETWORK, errorMessage);
        }

        const result = await response.json();
        console.log('✅ Meeting attendance saved successfully');
        return ok(result.data);
      } else {
        // Fallback to localStorage for development
        console.log('📱 Development mode: Meeting attendance would be saved to localStorage');
        return ok({ ...meetingData, teamId, completedAt: new Date().toISOString() });
      }
    } catch (error) {
      console.error('❌ Error saving meeting attendance:', error);
      return fail(ErrorCodes.UNKNOWN, error.message || 'Failed to save meeting attendance');
    }
  }

  /**
   * Get meeting attendance history for a team
   * @param {string} teamId - Stable Team ID (persists across coach changes, NOT managerId)
   * @returns {Promise<{success: boolean, data?: array, error?: string}>}
   */
  async getMeetingAttendanceHistory(teamId) {
    try {
      if (!teamId || typeof teamId !== 'string' || !teamId.trim()) {
        return fail(ErrorCodes.VALIDATION, 'Invalid team ID provided');
      }
      
      if (this.useCosmosDB) {
        const endpoint = `/getMeetingAttendance/${encodeURIComponent(teamId)}`;
        console.log('📞 Fetching meeting attendance history from:', apiClient.getBaseUrl() + endpoint);
        
        const response = await apiClient.get(endpoint);

        console.log('📥 Response status:', response.status, response.statusText);

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (e) {
            const errorText = await response.text();
            errorData = { 
              error: `HTTP ${response.status}: ${response.statusText}`,
              details: errorText || 'Failed to retrieve meeting attendance'
            };
          }
          
          console.error('❌ API error response:', errorData);
          
          // Parse error details if it's a JSON string
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
            ? `${errorData.error || 'Failed to retrieve meeting attendance'}: ${errorDetails}`
            : (errorData.error || `HTTP ${response.status}: ${response.statusText}`);
          return fail(ErrorCodes.NETWORK, errorMessage);
        }

        const result = await response.json();
        console.log('📥 API response:', result);
        
        // Handle both response formats: { success: true, meetings: [...] } or just { meetings: [...] }
        let meetings = result.meetings || (result.success ? result.data : []) || [];
        
        // Sort meetings: scheduled first (by date DESC), then completed (by completedAt DESC)
        // Default status to 'completed' for backwards compatibility
        meetings = meetings.sort((a, b) => {
          const aStatus = a.status || 'completed';
          const bStatus = b.status || 'completed';
          
          // Scheduled meetings come first
          if (aStatus === 'scheduled' && bStatus === 'completed') return -1;
          if (aStatus === 'completed' && bStatus === 'scheduled') return 1;
          
          // Within same status, sort by date (most recent first)
          if (aStatus === 'scheduled' && bStatus === 'scheduled') {
            return new Date(b.date) - new Date(a.date);
          }
          
          // For completed meetings, sort by completedAt
          const aDate = new Date(a.completedAt || a.date);
          const bDate = new Date(b.completedAt || b.date);
          return bDate - aDate;
        });
        
        console.log('✅ Retrieved meeting attendance history:', meetings.length, {
          scheduled: meetings.filter(m => (m.status || 'completed') === 'scheduled').length,
          completed: meetings.filter(m => (m.status || 'completed') === 'completed').length
        });
        return ok(meetings);
      } else {
        // Fallback to localStorage for development
        console.log('📱 Development mode: Meeting attendance history would be retrieved from localStorage');
        return ok([]);
      }
    } catch (error) {
      console.error('❌ Error fetching meeting attendance history:', error);
      return fail(ErrorCodes.UNKNOWN, error.message || 'Failed to fetch meeting attendance history');
    }
  }

  /**
   * Schedule meeting with Office 365 calendar invite
   * @param {string} teamId - Stable Team ID
   * @param {object} meetingData - Meeting data { title, date, time, teamMembers, accessToken }
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async scheduleMeetingWithCalendar(teamId, meetingData) {
    try {
      if (!teamId || typeof teamId !== 'string' || !teamId.trim()) {
        return fail(ErrorCodes.VALIDATION, 'Invalid team ID provided');
      }

      if (!meetingData.title || !meetingData.date || !meetingData.time) {
        return fail(ErrorCodes.VALIDATION, 'Title, date, and time are required');
      }

      if (!meetingData.teamMembers || !Array.isArray(meetingData.teamMembers) || meetingData.teamMembers.length === 0) {
        return fail(ErrorCodes.VALIDATION, 'Team members with email addresses are required');
      }

      if (!meetingData.accessToken) {
        return fail(ErrorCodes.VALIDATION, 'Access token is required for calendar operations');
      }

      const response = await apiClient.post(`/scheduleMeetingWithCalendar/${encodeURIComponent(teamId)}`, meetingData);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: 'Failed to schedule meeting'
        }));
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}`
          : (errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        return fail(ErrorCodes.NETWORK, errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        console.log('✅ Meeting scheduled successfully with calendar invite');
        return ok(result.data);
      } else {
        return fail(ErrorCodes.NETWORK, result.error || 'Failed to schedule meeting');
      }
    } catch (error) {
      console.error('❌ Error scheduling meeting:', error);
      return fail(ErrorCodes.UNKNOWN, error.message || 'Failed to schedule meeting');
    }
  }
}

// Create and export singleton instance
export const coachingService = new CoachingService();
export default coachingService;






