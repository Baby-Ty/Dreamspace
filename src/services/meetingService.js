
import { ok, fail } from '../utils/errorHandling.js';
import { ErrorCodes } from '../constants/errors.js';
import { apiClient } from './apiClient.js';
import { BaseService } from './BaseService.js';

/**
 * Meeting Service for DreamSpace
 * Handles meeting attendance, scheduling, and history
 */
class MeetingService extends BaseService {
  constructor() {
    super();
    console.log('📅 Meeting Service initialized:', { useCosmosDB: this.useCosmosDB });
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
        
        let meetings = result.meetings || (result.success ? result.data : []) || [];
        
        // Sort meetings: scheduled first (by date DESC), then completed (by completedAt DESC)
        meetings = meetings.sort((a, b) => {
          const aStatus = a.status || 'completed';
          const bStatus = b.status || 'completed';
          
          if (aStatus === 'scheduled' && bStatus === 'completed') return -1;
          if (aStatus === 'completed' && bStatus === 'scheduled') return 1;
          
          if (aStatus === 'scheduled' && bStatus === 'scheduled') {
            return new Date(b.date) - new Date(a.date);
          }
          
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
export const meetingService = new MeetingService();
export default meetingService;