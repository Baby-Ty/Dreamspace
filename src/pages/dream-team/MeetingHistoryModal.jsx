// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { X, Calendar, Clock, Check, User, Loader2, Edit2, Save, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { coachingService } from '../../services/coachingService';
import { useApp } from '../../context/AppContext';
import { showToast } from '../../utils/toast';

/**
 * Meeting History Modal Component
 * Displays detailed attendance history for a team
 * Allows coaches to edit attendance after submission
 */
export default function MeetingHistoryModal({ teamId, onClose, isCoach = false }) {
  const { currentUser } = useApp();
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingMeetingId, setEditingMeetingId] = useState(null);
  const [editedAttendees, setEditedAttendees] = useState({});
  const [isSaving, setIsSaving] = useState(false);

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
          const meetings = result.data || [];
          console.log('✅ Loaded meetings:', meetings.length);
          setMeetings(meetings);
        } else {
          // Extract error message from error object if it's an object
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      // Handle HH:MM format
      if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
      }
      return timeString;
    } catch {
      return timeString;
    }
  };

  const handleEditMeeting = (meeting) => {
    if (!isCoach) return;
    
    // Initialize edited attendees with current values
    const attendeesMap = {};
    meeting.attendees?.forEach(attendee => {
      attendeesMap[attendee.id] = {
        ...attendee,
        present: attendee.present || false
      };
    });
    setEditedAttendees(attendeesMap);
    setEditingMeetingId(meeting.id);
  };

  const handleCancelEdit = () => {
    setEditingMeetingId(null);
    setEditedAttendees({});
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

  const handleSaveAttendance = async (meeting) => {
    if (!isCoach || !editingMeetingId || editingMeetingId !== meeting.id) return;

    setIsSaving(true);
    try {
      const attendees = Object.values(editedAttendees);
      
      const result = await coachingService.saveMeetingAttendance(teamId, {
        id: meeting.id, // Pass existing ID to update
        title: meeting.title,
        date: meeting.date,
        time: meeting.time || undefined,
        attendees: attendees,
        completedBy: currentUser?.id || currentUser?.userId,
        isScheduledViaCalendar: meeting.isScheduledViaCalendar || false,
        calendarEventId: meeting.calendarEventId || undefined
      });

      if (result.success) {
        showToast('Attendance updated successfully!', 'success');
        
        // Update the meeting in the list
        setMeetings(prev => prev.map(m => 
          m.id === meeting.id 
            ? { ...m, attendees: attendees }
            : m
        ));
        
        handleCancelEdit();
      } else {
        const errorMsg = typeof result.error === 'string' 
          ? result.error 
          : (result.error?.message || 'Failed to update attendance');
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('❌ Error updating attendance:', err);
      showToast('Error updating attendance', 'error');
    } finally {
      setIsSaving(false);
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
              {meetings.map((meeting) => {
                const isEditing = editingMeetingId === meeting.id;
                const attendeesToDisplay = isEditing ? Object.values(editedAttendees) : (meeting.attendees || []);
                const presentCount = attendeesToDisplay.filter(a => a.present).length || 0;
                const totalCount = attendeesToDisplay.length || 0;
                
                return (
                  <div
                    key={meeting.id}
                    className={`bg-white/80 rounded-lg p-4 border-2 transition-shadow ${
                      isEditing 
                        ? 'border-[#4a3b22] shadow-md' 
                        : 'border-[#8a7a50]/30 shadow-sm hover:shadow-md'
                    }`}
                    data-testid={`meeting-history-item-${meeting.id}`}
                  >
                    {/* Meeting Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-[#4a3b22] font-hand mb-1">
                          {meeting.title || 'Untitled Meeting'}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-[#5c5030] font-hand">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" aria-hidden="true" />
                            <span>{formatDate(meeting.date)}</span>
                          </div>
                          {meeting.time && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" aria-hidden="true" />
                              <span>{formatTime(meeting.time)}</span>
                            </div>
                          )}
                          {meeting.isScheduledViaCalendar && (
                            <span className="px-2 py-1 bg-[#4a3b22]/10 text-[#4a3b22] rounded text-xs font-semibold">
                              Calendar Event
                            </span>
                          )}
                          {isEditing && (
                            <span className="px-2 py-1 bg-[#4a3b22] text-[#fef9c3] rounded text-xs font-semibold">
                              Editing
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex items-start gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[#4a3b22] font-hand">
                            {presentCount}/{totalCount} Present
                          </p>
                          {meeting.completedAt && (
                            <p className="text-xs text-[#8a7a50] font-hand mt-1">
                              {formatDate(meeting.completedAt)}
                            </p>
                          )}
                        </div>
                        {isCoach && !isEditing && (
                          <button
                            onClick={() => handleEditMeeting(meeting)}
                            className="p-1.5 text-[#5c5030] hover:text-[#4a3b22] hover:bg-[#8a7a50]/20 rounded-lg transition-colors"
                            aria-label="Edit attendance"
                            data-testid={`edit-meeting-${meeting.id}`}
                          >
                            <Edit2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Attendees List */}
                    {attendeesToDisplay.length > 0 && (
                      <div className="border-t border-[#8a7a50]/20 pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-[#5c5030] font-hand uppercase tracking-wide">
                            Attendees
                          </p>
                          {isEditing && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveAttendance(meeting)}
                                disabled={isSaving}
                                className="px-2 py-1 bg-[#4a3b22] text-[#fef9c3] rounded text-xs font-semibold hover:bg-[#5c5030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                data-testid={`save-meeting-${meeting.id}`}
                              >
                                {isSaving ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-3 h-3" aria-hidden="true" />
                                    Save
                                  </>
                                )}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                                className="px-2 py-1 bg-[#8a7a50]/30 text-[#5c5030] rounded text-xs font-semibold hover:bg-[#8a7a50]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                data-testid={`cancel-edit-${meeting.id}`}
                              >
                                <XCircle className="w-3 h-3" aria-hidden="true" />
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {attendeesToDisplay.map((attendee) => {
                            const isPresent = attendee.present || false;
                            return (
                              <label
                                key={attendee.id}
                                className={`flex items-center gap-2 text-sm ${
                                  isEditing 
                                    ? 'cursor-pointer hover:bg-[#8a7a50]/10 rounded px-1 py-0.5 transition-colors' 
                                    : ''
                                }`}
                                data-testid={`attendee-${attendee.id}`}
                              >
                                <div className="relative flex-shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={isPresent}
                                    onChange={() => handleToggleAttendance(attendee.id)}
                                    disabled={!isEditing || isSaving}
                                    className="sr-only"
                                    aria-label={`Mark ${attendee.name} as present`}
                                  />
                                  <div className={`w-4 h-4 rounded flex items-center justify-center ${
                                    isPresent 
                                      ? 'bg-[#4a3b22]' 
                                      : 'bg-[#8a7a50]/30 border border-[#8a7a50]'
                                  }`}>
                                    {isPresent && (
                                      <Check className="w-3 h-3 text-[#fef9c3]" aria-hidden="true" />
                                    )}
                                  </div>
                                </div>
                                <span className={`font-hand ${
                                  isPresent 
                                    ? 'text-[#4a3b22] font-semibold' 
                                    : 'text-[#5c5030]'
                                }`}>
                                  {attendee.name}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
  isCoach: PropTypes.bool
};

MeetingHistoryModal.defaultProps = {
  isCoach: false
};

