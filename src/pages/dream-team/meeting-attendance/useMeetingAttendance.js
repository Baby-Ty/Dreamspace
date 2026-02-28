import { useState, useEffect, useCallback } from 'react';
import { coachingService } from '../../../services/coachingService';
import { useApp } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import { showToast } from '../../../utils/toast';

/**
 * Get fallback timezone - using Windows format for Microsoft Graph compatibility
 * @returns {string} Windows timezone format (e.g., "Eastern Standard Time")
 */
function getFallbackTimezone() {
  return 'Eastern Standard Time';
}

/**
 * Returns the soonest upcoming scheduled meeting from a list, sorted by date ascending.
 * Filters out cancelled meetings.
 */
function findClosestScheduledMeeting(meetings) {
  const scheduled = (meetings || []).filter(m => m.status === 'scheduled');
  if (scheduled.length === 0) return null;
  scheduled.sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    if (dateA < dateB) return -1;
    if (dateA > dateB) return 1;
    const timeA = a.time || '';
    const timeB = b.time || '';
    return timeA < timeB ? -1 : timeA > timeB ? 1 : 0;
  });
  return scheduled[0];
}

/**
 * Hook for managing meeting attendance state and operations
 */
export function useMeetingAttendance({ teamId, teamMembers, isCoach, onComplete }) {
  const { currentUser } = useApp();
  const { getToken, graph } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [meetingData, setMeetingData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    timezone: getFallbackTimezone(),
    duration: 60, // Default duration in minutes
  });
  const [attendance, setAttendance] = useState({});
  const [isScheduledViaCalendar, setIsScheduledViaCalendar] = useState(false);
  const [calendarEventId, setCalendarEventId] = useState(null);
  const [currentMeetingId, setCurrentMeetingId] = useState(null);
  const [isLoadingScheduled, setIsLoadingScheduled] = useState(false);

  // Fetch user's timezone from Microsoft 365 mailbox settings on mount
  useEffect(() => {
    const fetchUserTimezone = async () => {
      if (!isCoach || !graph) return;
      
      try {
        const result = await graph.getMailboxSettings();
        
        if (result.success && result.data) {
          // Graph API returns Windows timezone format - store directly
          setMeetingData(prev => ({ ...prev, timezone: result.data }));
        }
      } catch (error) {
        console.error('Error fetching user timezone:', error);
      }
    };
    
    fetchUserTimezone();
  }, [isCoach, graph]);

  // Applies a scheduled meeting to the form state
  const applyScheduledMeeting = useCallback((scheduledMeeting) => {
    setMeetingData(prev => ({
      title: scheduledMeeting.title || '',
      date: scheduledMeeting.date || new Date().toISOString().split('T')[0],
      time: scheduledMeeting.time || '',
      timezone: scheduledMeeting.timezone || prev.timezone,
      duration: scheduledMeeting.duration || 60
    }));
    setCurrentMeetingId(scheduledMeeting.id);
    setIsScheduledViaCalendar(scheduledMeeting.isScheduledViaCalendar || false);
    setCalendarEventId(scheduledMeeting.calendarEventId || null);

    if (scheduledMeeting.attendees && Array.isArray(scheduledMeeting.attendees)) {
      const attendanceMap = {};
      scheduledMeeting.attendees.forEach(attendee => {
        attendanceMap[attendee.id] = {
          id: attendee.id,
          name: attendee.name,
          present: attendee.present || false
        };
      });
      setAttendance(attendanceMap);
    }
  }, []);

  // Load closest upcoming scheduled meeting on mount
  useEffect(() => {
    const loadScheduledMeeting = async () => {
      if (!teamId || !isCoach) return;
      
      setIsLoadingScheduled(true);
      try {
        const result = await coachingService.getMeetingAttendanceHistory(teamId);
        if (result.success && result.data && result.data.length > 0) {
          const closest = findClosestScheduledMeeting(result.data);
          if (closest) {
            applyScheduledMeeting(closest);
          }
        }
      } catch (error) {
        console.error('Failed to load scheduled meeting:', error);
      } finally {
        setIsLoadingScheduled(false);
      }
    };
    
    loadScheduledMeeting();
  }, [teamId, isCoach, applyScheduledMeeting]);

  // Initialize attendance state with ALL team members
  useEffect(() => {
    if (Object.keys(attendance).length > 0) return;
    
    const allMembers = teamMembers || [];
    const initialAttendance = {};
    allMembers.forEach(member => {
      initialAttendance[member.id] = {
        id: member.id,
        name: member.name,
        present: false
      };
    });
    setAttendance(initialAttendance);
  }, [teamMembers, attendance]);

  const handleToggleAttendance = useCallback((memberId) => {
    if (!isCoach) return;
    
    setAttendance(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        present: !prev[memberId]?.present
      }
    }));
  }, [isCoach]);

  const handleScheduleMeeting = useCallback(async () => {
    if (!teamId || !isCoach) {
      console.error('❌ Cannot schedule meeting: Missing teamId or not a coach');
      return;
    }

    if (!meetingData.title?.trim()) {
      showToast('Please enter a meeting title', 'error');
      return;
    }

    if (!meetingData.date) {
      showToast('Please select a meeting date', 'error');
      return;
    }

    if (!meetingData.time) {
      showToast('Please enter a meeting time', 'error');
      return;
    }

    setIsScheduling(true);
    try {
      const token = await getToken();
      if (!token) {
        showToast('Authentication required. Please sign in again.', 'error');
        return;
      }

      const teamMembersWithEmails = (teamMembers || []).map(member => ({
        id: member.id,
        name: member.name,
        email: member.email || member.userPrincipalName || member.mail
      })).filter(member => member.email);

      if (teamMembersWithEmails.length === 0) {
        showToast('No team members with email addresses found', 'error');
        return;
      }

      const result = await coachingService.scheduleMeetingWithCalendar(teamId, {
        title: meetingData.title.trim(),
        date: meetingData.date,
        time: meetingData.time,
        timezone: meetingData.timezone,
        duration: meetingData.duration || 60, // Include duration (default 60 mins)
        teamMembers: teamMembersWithEmails,
        accessToken: token
      });

      if (result.success) {
        showToast('Meeting scheduled! Calendar invites sent to all team members.', 'success');

        // Reload all scheduled meetings and show the closest upcoming one
        try {
          const historyResult = await coachingService.getMeetingAttendanceHistory(teamId);
          if (historyResult.success && historyResult.data?.length > 0) {
            const closest = findClosestScheduledMeeting(historyResult.data);
            if (closest) {
              applyScheduledMeeting(closest);
            }
          }
        } catch (reloadError) {
          console.error('Failed to reload meetings after scheduling:', reloadError);
          // Fall back to showing the just-scheduled meeting
          setIsScheduledViaCalendar(true);
          setCalendarEventId(result.data?.calendarEventId || null);
          setCurrentMeetingId(result.data?.meetingId || null);
        }
      } else {
        const errMsg = typeof result.error === 'string'
          ? result.error
          : (result.error?.message || 'Failed to schedule meeting');
        showToast(errMsg, 'error');
      }
    } catch (error) {
      console.error('❌ Error scheduling meeting:', error);
      showToast('Error scheduling meeting', 'error');
    } finally {
      setIsScheduling(false);
    }
  }, [teamId, isCoach, meetingData, teamMembers, getToken, applyScheduledMeeting]);

  const handleNewMeeting = useCallback(() => {
    setMeetingData(prev => ({
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      timezone: prev.timezone,
      duration: 60
    }));
    setCurrentMeetingId(null);
    setIsScheduledViaCalendar(false);
    setCalendarEventId(null);
    const allMembers = teamMembers || [];
    const resetAttendance = {};
    allMembers.forEach(member => {
      resetAttendance[member.id] = { id: member.id, name: member.name, present: false };
    });
    setAttendance(resetAttendance);
  }, [teamMembers]);

  const handleUpdateMeeting = useCallback(async () => {
    if (!teamId || !isCoach) {
      console.error('❌ Cannot update meeting: Missing teamId or not a coach');
      return;
    }

    if (!currentMeetingId) {
      showToast('No scheduled meeting to update', 'error');
      return;
    }

    if (!meetingData.title?.trim()) {
      showToast('Please enter a meeting title', 'error');
      return;
    }

    if (!meetingData.date) {
      showToast('Please select a meeting date', 'error');
      return;
    }

    if (!meetingData.time) {
      showToast('Please enter a meeting time', 'error');
      return;
    }

    setIsScheduling(true);
    try {
      const token = await getToken();
      if (!token) {
        showToast('Authentication required. Please sign in again.', 'error');
        return;
      }

      const teamMembersWithEmails = (teamMembers || []).map(member => ({
        id: member.id,
        name: member.name,
        email: member.email || member.userPrincipalName || member.mail
      })).filter(member => member.email);

      const result = await coachingService.updateMeetingWithCalendar(teamId, {
        meetingId: currentMeetingId,
        calendarEventId: calendarEventId || undefined,
        title: meetingData.title.trim(),
        date: meetingData.date,
        time: meetingData.time,
        timezone: meetingData.timezone,
        duration: meetingData.duration || 60,
        teamMembers: teamMembersWithEmails,
        accessToken: token
      });

      if (result.success) {
        showToast(
          calendarEventId
            ? 'Meeting updated! Calendar invite updated for all team members.'
            : 'Meeting updated successfully.',
          'success'
        );

        // Reload to confirm the latest DB state
        try {
          const historyResult = await coachingService.getMeetingAttendanceHistory(teamId);
          if (historyResult.success && historyResult.data?.length > 0) {
            const closest = findClosestScheduledMeeting(historyResult.data);
            if (closest) {
              applyScheduledMeeting(closest);
            }
          }
        } catch (reloadError) {
          console.error('Failed to reload meetings after update:', reloadError);
        }
      } else {
        const errMsg = typeof result.error === 'string'
          ? result.error
          : (result.error?.message || 'Failed to update meeting');
        showToast(errMsg, 'error');
      }
    } catch (error) {
      console.error('❌ Error updating meeting:', error);
      showToast('Error updating meeting', 'error');
    } finally {
      setIsScheduling(false);
    }
  }, [teamId, isCoach, currentMeetingId, calendarEventId, meetingData, teamMembers, getToken, applyScheduledMeeting]);

  const handleCompleteMeeting = useCallback(async () => {
    if (!teamId || !isCoach) {
      console.error('❌ Cannot complete meeting: Missing teamId or not a coach');
      return;
    }

    if (!meetingData.title?.trim()) {
      showToast('Please enter a meeting title', 'error');
      return;
    }

    if (!meetingData.date) {
      showToast('Please select a meeting date', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const attendees = Object.values(attendance);
      const result = await coachingService.saveMeetingAttendance(teamId, {
        id: currentMeetingId,
        title: meetingData.title.trim(),
        date: meetingData.date,
        time: meetingData.time || undefined,
        timezone: meetingData.timezone || undefined,
        duration: meetingData.duration || 60, // Include duration (default 60 mins)
        attendees: attendees,
        completedBy: currentUser?.id || currentUser?.userId,
        isScheduledViaCalendar: isScheduledViaCalendar,
        calendarEventId: calendarEventId || undefined,
        status: 'completed'
      });

      if (result.success) {
        showToast('Meeting attendance saved successfully!', 'success');
        
        // Reset form for next meeting
        const allMembers = teamMembers || [];
        const resetAttendance = {};
        allMembers.forEach(member => {
          resetAttendance[member.id] = {
            id: member.id,
            name: member.name,
            present: false
          };
        });
        setAttendance(resetAttendance);
        setMeetingData(prev => ({
          title: '',
          date: new Date().toISOString().split('T')[0],
          time: '',
          timezone: prev.timezone, // Keep the user's timezone
          duration: 60 // Reset to default duration
        }));
        setIsScheduledViaCalendar(false);
        setCalendarEventId(null);
        setCurrentMeetingId(null);

        if (onComplete) {
          onComplete(result.data);
        }
        
        // Reload any scheduled meetings after a delay
        setTimeout(async () => {
          try {
            const historyResult = await coachingService.getMeetingAttendanceHistory(teamId);
            if (historyResult.success && historyResult.data?.length > 0) {
              const closest = findClosestScheduledMeeting(historyResult.data);
              if (closest) {
                applyScheduledMeeting(closest);
              }
            }
          } catch (error) {
            console.error('Failed to load next scheduled meeting:', error);
          }
        }, 500);
      } else {
        const errMsg = typeof result.error === 'string'
          ? result.error
          : (result.error?.message || 'Failed to save meeting attendance');
        showToast(errMsg, 'error');
      }
    } catch (error) {
      console.error('❌ Error saving meeting attendance:', error);
      showToast('Error saving meeting attendance', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [teamId, isCoach, meetingData, attendance, currentMeetingId, currentUser, isScheduledViaCalendar, calendarEventId, teamMembers, onComplete, applyScheduledMeeting]);

  return {
    meetingData,
    setMeetingData,
    attendance,
    isSaving,
    isScheduling,
    isLoadingScheduled,
    showHistory,
    setShowHistory,
    currentMeetingId,
    isScheduledViaCalendar,
    handleToggleAttendance,
    handleNewMeeting,
    handleScheduleMeeting,
    handleUpdateMeeting,
    handleCompleteMeeting
  };
}
