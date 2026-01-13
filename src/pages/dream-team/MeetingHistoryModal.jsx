// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { X, Calendar, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { coachingService } from '../../services/coachingService';
import { useApp } from '../../context/AppContext';
import { showToast } from '../../utils/toast';
import { MeetingHistoryItem } from './meeting-history';

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
        id: meeting.id,
        title: meeting.title,
        date: meeting.date,
        time: meeting.time || undefined,
        attendees: attendees,
        completedBy: currentUser?.id || currentUser?.userId,
        isScheduledViaCalendar: meeting.isScheduledViaCalendar || false,
        calendarEventId: meeting.calendarEventId || undefined,
        status: meeting.status || 'completed'
      });

      if (result.success) {
        showToast('Attendance updated successfully!', 'success');
        
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
              {meetings.map((meeting) => (
                <MeetingHistoryItem
                  key={meeting.id}
                  meeting={meeting}
                  isEditing={editingMeetingId === meeting.id}
                  editedAttendees={editedAttendees}
                  isSaving={isSaving}
                  isCoach={isCoach}
                  onEdit={handleEditMeeting}
                  onToggleAttendance={handleToggleAttendance}
                  onSave={handleSaveAttendance}
                  onCancelEdit={handleCancelEdit}
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
  isCoach: PropTypes.bool
};

MeetingHistoryModal.defaultProps = {
  isCoach: false
};
