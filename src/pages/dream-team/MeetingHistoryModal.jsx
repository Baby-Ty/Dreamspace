import { X, Calendar, Loader2, CalendarPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { coachingService } from '../../services/coachingService';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toast';
import { MeetingHistoryItem } from './meeting-history';
import MeetingFormFields from './meeting-attendance/MeetingFormFields';

/**
 * Meeting History Modal Component
 * Displays detailed attendance history for a team
 * Allows coaches to edit meeting details, attendance, cancel, and complete meetings
 */
export default function MeetingHistoryModal({ teamId, onClose, isCoach = false, teamMembers = [] }) {
  const { currentUser } = useApp();
  const { getToken } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingMeetingId, setEditingMeetingId] = useState(null);
  const [editedAttendees, setEditedAttendees] = useState({});
  const [editedMeetingDetails, setEditedMeetingDetails] = useState({
    title: '',
    date: '',
    time: '',
    duration: 60
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSchedulingNew, setIsSchedulingNew] = useState(false);
  const [newMeetingData, setNewMeetingData] = useState({ title: '', date: '', time: '', duration: 60, timezone: 'Eastern Standard Time' });
  const [isSchedulingLoading, setIsSchedulingLoading] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      if (!teamId) {
        const errorMsg = 'Team ID is required to load meeting history';
        console.error('❌', errorMsg);
        setError(errorMsg);
        setIsLoading(false);
        return;
      }

      if (typeof teamId !== 'string' || !teamId.trim()) {
        const errorMsg = `Invalid team ID format: ${typeof teamId} - ${teamId}`;
        console.error('❌', errorMsg);
        setError('Invalid team ID format');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log('📞 Loading meeting history for teamId:', teamId);
        const result = await coachingService.getMeetingAttendanceHistory(teamId.trim());
        console.log('📥 Meeting history result:', result);
        
        if (result.success) {
          const allMeetings = result.data || [];
          // Filter out cancelled meetings from the display list
          const visibleMeetings = allMeetings.filter(m => m.status !== 'cancelled');
          console.log('✅ Loaded meetings:', visibleMeetings.length);
          setMeetings(visibleMeetings);
        } else {
          let errorMsg = 'Failed to load meeting history';
          if (result.error) {
            if (typeof result.error === 'string') {
              errorMsg = result.error;
            } else if (result.error.message) {
              errorMsg = result.error.message;
            } else if (result.error.code) {
              errorMsg = `${result.error.code}: ${result.error.message || 'Unknown error'}`;
            }
          }
          console.error('❌ Failed to load history:', errorMsg, result);
          setError(errorMsg);
          showToast(errorMsg, 'error');
        }
      } catch (err) {
        console.error('❌ Exception loading meeting history:', err);
        const errorMsg = err.message || 'Failed to load meeting history';
        setError(errorMsg);
        showToast(errorMsg, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [teamId]);

  const handleEditMeeting = (meeting) => {
    if (!isCoach) return;
    
    const attendeesMap = {};
    meeting.attendees?.forEach(attendee => {
      attendeesMap[attendee.id] = {
        ...attendee,
        present: attendee.present || false
      };
    });
    setEditedAttendees(attendeesMap);
    setEditedMeetingDetails({
      title: meeting.title || '',
      date: meeting.date || '',
      time: meeting.time || '',
      duration: meeting.duration || 60
    });
    setEditingMeetingId(meeting.id);
  };

  const handleCancelEdit = () => {
    setEditingMeetingId(null);
    setEditedAttendees({});
    setEditedMeetingDetails({ title: '', date: '', time: '', duration: 60 });
  };

  const handleToggleAttendance = (attendeeId) => {
    if (!isCoach || !editingMeetingId) return;
    
    setEditedAttendees(prev => ({
      ...prev,
      [attendeeId]: {
        ...prev[attendeeId],
        present: !prev[attendeeId]?.present
      }
    }));
  };

  const handleMeetingDetailsChange = (field, value) => {
    setEditedMeetingDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveMeeting = async (meeting) => {
    if (!isCoach || !editingMeetingId || editingMeetingId !== meeting.id) return;

    setIsSaving(true);
    try {
      const attendees = Object.values(editedAttendees);
      const isCompleted = (meeting.status || 'completed') === 'completed';
      const resolvedTitle = editedMeetingDetails.title || meeting.title;
      const resolvedDate = editedMeetingDetails.date || meeting.date;
      const resolvedTime = editedMeetingDetails.time || meeting.time || undefined;
      const resolvedDuration = editedMeetingDetails.duration || meeting.duration || 60;

      const result = await coachingService.saveMeetingAttendance(teamId, {
        id: meeting.id,
        title: resolvedTitle,
        date: resolvedDate,
        time: resolvedTime,
        timezone: meeting.timezone || undefined,
        duration: resolvedDuration,
        attendees: isCompleted ? attendees : (attendees.length > 0 ? attendees : undefined),
        completedBy: meeting.completedBy || currentUser?.id || currentUser?.userId,
        isScheduledViaCalendar: meeting.isScheduledViaCalendar || false,
        calendarEventId: meeting.calendarEventId || undefined,
        status: meeting.status || 'completed'
      });

      if (result.success) {
        showToast('Meeting updated successfully!', 'success');

        setMeetings(prev => prev.map(m =>
          m.id === meeting.id
            ? {
                ...m,
                title: resolvedTitle,
                date: resolvedDate,
                time: resolvedTime,
                duration: resolvedDuration,
                attendees: attendees.length > 0 ? attendees : m.attendees
              }
            : m
        ));

        handleCancelEdit();

        // Best-effort calendar sync if this meeting has a calendar event
        if (meeting.isScheduledViaCalendar && meeting.calendarEventId) {
          try {
            const token = await getToken();
            if (token) {
              const teamMembersWithEmails = (teamMembers || []).map(member => ({
                id: member.id,
                name: member.name,
                email: member.email || member.userPrincipalName || member.mail
              })).filter(m => m.email);

              await coachingService.updateMeetingWithCalendar(teamId, {
                meetingId: meeting.id,
                calendarEventId: meeting.calendarEventId,
                title: resolvedTitle,
                date: resolvedDate,
                time: resolvedTime || meeting.time,
                timezone: meeting.timezone || undefined,
                duration: resolvedDuration,
                teamMembers: teamMembersWithEmails,
                accessToken: token
              });
            }
          } catch (calendarErr) {
            console.warn('⚠️ Calendar sync failed after history save (details saved):', calendarErr);
          }
        }
      } else {
        const errorMsg = typeof result.error === 'string'
          ? result.error
          : (result.error?.message || 'Failed to update meeting');
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('❌ Error updating meeting:', err);
      showToast('Error updating meeting', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelMeeting = async (meeting) => {
    if (!isCoach) return;

    setIsSaving(true);
    try {
      const result = await coachingService.saveMeetingAttendance(teamId, {
        id: meeting.id,
        title: meeting.title,
        date: meeting.date,
        time: meeting.time || undefined,
        timezone: meeting.timezone || undefined,
        duration: meeting.duration || 60,
        attendees: meeting.attendees || [],
        isScheduledViaCalendar: meeting.isScheduledViaCalendar || false,
        calendarEventId: meeting.calendarEventId || undefined,
        status: 'cancelled'
      });

      if (result.success) {
        showToast('Meeting cancelled.', 'success');
        setMeetings(prev => prev.filter(m => m.id !== meeting.id));
      } else {
        const errorMsg = typeof result.error === 'string'
          ? result.error
          : (result.error?.message || 'Failed to cancel meeting');
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('❌ Error cancelling meeting:', err);
      showToast('Error cancelling meeting', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteMeetingFromHistory = async (meeting) => {
    if (!isCoach) return;

    // When completing from history without editing, use the meeting's existing attendees
    const attendees = editingMeetingId === meeting.id
      ? Object.values(editedAttendees)
      : (meeting.attendees || []);

    if (!attendees || attendees.length === 0) {
      showToast('No attendees found for this meeting', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const result = await coachingService.saveMeetingAttendance(teamId, {
        id: meeting.id,
        title: editingMeetingId === meeting.id ? (editedMeetingDetails.title || meeting.title) : meeting.title,
        date: editingMeetingId === meeting.id ? (editedMeetingDetails.date || meeting.date) : meeting.date,
        time: editingMeetingId === meeting.id ? (editedMeetingDetails.time || meeting.time) : meeting.time || undefined,
        timezone: meeting.timezone || undefined,
        duration: editingMeetingId === meeting.id ? (editedMeetingDetails.duration || meeting.duration) : meeting.duration || 60,
        attendees: attendees,
        completedBy: currentUser?.id || currentUser?.userId,
        isScheduledViaCalendar: meeting.isScheduledViaCalendar || false,
        calendarEventId: meeting.calendarEventId || undefined,
        status: 'completed'
      });

      if (result.success) {
        showToast('Meeting marked as complete!', 'success');
        setMeetings(prev => prev.map(m =>
          m.id === meeting.id
            ? { ...m, status: 'completed', attendees }
            : m
        ));
        if (editingMeetingId === meeting.id) {
          handleCancelEdit();
        }
      } else {
        const errorMsg = typeof result.error === 'string'
          ? result.error
          : (result.error?.message || 'Failed to complete meeting');
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('❌ Error completing meeting:', err);
      showToast('Error completing meeting', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleScheduleNewMeeting = async () => {
    if (!isCoach) return;

    if (!newMeetingData.title?.trim()) {
      showToast('Please enter a meeting title', 'error');
      return;
    }
    if (!newMeetingData.date) {
      showToast('Please select a meeting date', 'error');
      return;
    }
    if (!newMeetingData.time) {
      showToast('Please enter a meeting time', 'error');
      return;
    }

    setIsSchedulingLoading(true);
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
      })).filter(m => m.email);

      if (teamMembersWithEmails.length === 0) {
        showToast('No team members with email addresses found', 'error');
        return;
      }

      const result = await coachingService.scheduleMeetingWithCalendar(teamId, {
        title: newMeetingData.title.trim(),
        date: newMeetingData.date,
        time: newMeetingData.time,
        timezone: newMeetingData.timezone,
        duration: newMeetingData.duration || 60,
        teamMembers: teamMembersWithEmails,
        accessToken: token
      });

      if (result.success) {
        showToast('Meeting scheduled! Calendar invites sent to all team members.', 'success');
        setIsSchedulingNew(false);
        setNewMeetingData({ title: '', date: '', time: '', duration: 60, timezone: 'Eastern Standard Time' });

        // Reload meeting list to include the new scheduled meeting
        try {
          const historyResult = await coachingService.getMeetingAttendanceHistory(teamId);
          if (historyResult.success) {
            const allMeetings = historyResult.data || [];
            setMeetings(allMeetings.filter(m => m.status !== 'cancelled'));
          }
        } catch (reloadErr) {
          console.warn('⚠️ Failed to reload meetings after scheduling:', reloadErr);
        }
      } else {
        const errMsg = typeof result.error === 'string'
          ? result.error
          : (result.error?.message || 'Failed to schedule meeting');
        showToast(errMsg, 'error');
      }
    } catch (err) {
      console.error('❌ Error scheduling meeting:', err);
      showToast('Error scheduling meeting', 'error');
    } finally {
      setIsSchedulingLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meeting-history-modal-title"
      onClick={onClose}
      data-testid="meeting-history-modal"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-professional-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-professional-gray-200 bg-gradient-to-r from-[#fef9c3] to-[#fef08a] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#4a3b22]/10 rounded-lg">
                <Calendar className="w-6 h-6 text-[#4a3b22]" aria-hidden="true" />
              </div>
              <div>
                <h2 
                  id="meeting-history-modal-title"
                  className="text-xl font-bold text-[#4a3b22] font-hand"
                >
                  Meeting Attendance History
                </h2>
                <p className="text-sm text-[#5c5030] font-hand">
                  View past meetings and attendance records
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isCoach && (
                <button
                  onClick={() => setIsSchedulingNew(prev => !prev)}
                  aria-label="Schedule new meeting"
                  data-testid="schedule-new-meeting-button"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4a3b22] text-[#fef9c3] rounded-lg font-hand text-sm hover:bg-[#5c4a2a] transition-colors"
                >
                  <CalendarPlus className="w-4 h-4" aria-hidden="true" />
                  Schedule Meeting
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Close modal"
                data-testid="close-history-modal-button"
                className="p-2 text-[#5c5030] hover:text-[#4a3b22] hover:bg-[#8a7a50]/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Schedule New Meeting Form */}
        {isSchedulingNew && (
          <div className="p-4 sm:p-6 border-b border-[#8a7a50]/30 bg-[#fef9c3] flex-shrink-0">
            <h3 className="text-base font-bold text-[#4a3b22] font-hand mb-3">New Meeting</h3>
            <MeetingFormFields
              meetingData={newMeetingData}
              setMeetingData={setNewMeetingData}
              isCoach={isCoach}
              isLoadingScheduled={isSchedulingLoading}
            />
            <div className="flex gap-2">
              <button
                onClick={handleScheduleNewMeeting}
                disabled={isSchedulingLoading}
                data-testid="confirm-schedule-meeting-button"
                className="flex items-center gap-2 px-4 py-2 bg-[#4a3b22] text-[#fef9c3] rounded-lg font-hand text-sm hover:bg-[#5c4a2a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSchedulingLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  : <CalendarPlus className="w-4 h-4" aria-hidden="true" />
                }
                {isSchedulingLoading ? 'Scheduling...' : 'Confirm & Send Invites'}
              </button>
              <button
                onClick={() => {
                  setIsSchedulingNew(false);
                  setNewMeetingData({ title: '', date: '', time: '', duration: 60, timezone: 'Eastern Standard Time' });
                }}
                disabled={isSchedulingLoading}
                data-testid="cancel-schedule-meeting-button"
                className="px-4 py-2 border-2 border-[#8a7a50] text-[#5c5030] rounded-lg font-hand text-sm hover:bg-[#8a7a50]/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-br from-[#fef9c3] to-[#fef08a]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-[#8a7a50] animate-spin mb-4" aria-hidden="true" />
              <p className="text-[#5c5030] font-hand">Loading meeting history...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-[#4a3b22] font-hand text-lg mb-2">Error loading history</p>
              <p className="text-[#5c5030] font-hand">{error}</p>
            </div>
          ) : meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Calendar className="w-16 h-16 text-[#8a7a50]/50 mb-4" aria-hidden="true" />
              <p className="text-[#5c5030] font-hand text-lg">No meeting history yet</p>
              <p className="text-[#8a7a50] font-hand text-sm mt-2">Complete your first meeting to see it here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <MeetingHistoryItem
                  key={meeting.id}
                  meeting={meeting}
                  isEditing={editingMeetingId === meeting.id}
                  editedAttendees={editedAttendees}
                  editedMeetingDetails={editedMeetingDetails}
                  isSaving={isSaving}
                  isCoach={isCoach}
                  onEdit={handleEditMeeting}
                  onToggleAttendance={handleToggleAttendance}
                  onMeetingDetailsChange={handleMeetingDetailsChange}
                  onSave={handleSaveMeeting}
                  onCancelEdit={handleCancelEdit}
                  onCancelMeeting={handleCancelMeeting}
                  onCompleteMeeting={handleCompleteMeetingFromHistory}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

MeetingHistoryModal.propTypes = {
  teamId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  isCoach: PropTypes.bool,
  teamMembers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string
  }))
};

MeetingHistoryModal.defaultProps = {
  isCoach: false,
  teamMembers: []
};
