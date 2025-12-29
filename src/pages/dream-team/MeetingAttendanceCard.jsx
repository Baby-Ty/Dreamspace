// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { Calendar, Check, CheckCircle2, Loader2, Clock, History } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { coachingService } from '../../services/coachingService';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toast';
import MeetingHistoryModal from './MeetingHistoryModal';

/**
 * Meeting Attendance Card Component
 * Allows coaches to track meeting attendance with yellow lined paper styling
 * @param {boolean} embedded - When true, renders without background (for use inside parent card)
 */
export default function MeetingAttendanceCard({ teamId, teamMembers, isCoach, onComplete, embedded = false, managerId, teamData }) {
  const { currentUser } = useApp();
  const { getToken } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [meetingData, setMeetingData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0], // Default to today
    time: '', // HH:MM format
  });
  const [attendance, setAttendance] = useState({});
  const [isScheduledViaCalendar, setIsScheduledViaCalendar] = useState(false);
  const [calendarEventId, setCalendarEventId] = useState(null);
  const saveTimeoutRef = useRef(null);

  // Load meeting draft from teamData on mount
  useEffect(() => {
    if (teamData?.meetingDraft && isCoach) {
      setMeetingData({
        title: teamData.meetingDraft.title || '',
        date: teamData.meetingDraft.date || new Date().toISOString().split('T')[0],
        time: teamData.meetingDraft.time || ''
      });
    }
  }, [teamData, isCoach]);

  // Initialize attendance state with ALL team members INCLUDING coach
  useEffect(() => {
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
  }, [teamMembers]);

  // Auto-save meeting draft when title, date, or time changes (debounced)
  useEffect(() => {
    if (!isCoach || !managerId) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout to save after 1 second of no changes
    saveTimeoutRef.current = setTimeout(async () => {
      if (meetingData.title || meetingData.date || meetingData.time) {
        setIsSavingDraft(true);
        try {
          await coachingService.updateTeamInfo(managerId, {
            meetingDraft: {
              title: meetingData.title,
              date: meetingData.date,
              time: meetingData.time
            }
          });
        } catch (error) {
          console.error('Failed to save meeting draft:', error);
          // Don't show error toast for draft saves - silent failure is OK
        } finally {
          setIsSavingDraft(false);
        }
      }
    }, 1000);

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [meetingData.title, meetingData.date, meetingData.time, isCoach, managerId]);

  const handleToggleAttendance = (memberId) => {
    if (!isCoach) return;
    
    setAttendance(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        present: !prev[memberId]?.present
      }
    }));
  };

  const handleScheduleMeeting = async () => {
    if (!teamId || !isCoach) {
      console.error('❌ Cannot schedule meeting: Missing teamId or not a coach');
      return;
    }

    if (!meetingData.title || !meetingData.title.trim()) {
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

      // Get team members with email addresses
      const teamMembersWithEmails = (teamMembers || []).map(member => ({
        id: member.id,
        name: member.name,
        email: member.email || member.userPrincipalName || member.mail
      })).filter(member => member.email); // Only include members with emails

      if (teamMembersWithEmails.length === 0) {
        showToast('No team members with email addresses found', 'error');
        return;
      }

      const result = await coachingService.scheduleMeetingWithCalendar(teamId, {
        title: meetingData.title.trim(),
        date: meetingData.date,
        time: meetingData.time,
        teamMembers: teamMembersWithEmails,
        accessToken: token
      });

      if (result.success) {
        setIsScheduledViaCalendar(true);
        setCalendarEventId(result.data?.calendarEventId || null);
        showToast('Meeting scheduled! Calendar invites sent to all team members.', 'success');
      } else {
        showToast(result.error || 'Failed to schedule meeting', 'error');
      }
    } catch (error) {
      console.error('❌ Error scheduling meeting:', error);
      showToast('Error scheduling meeting', 'error');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCompleteMeeting = async () => {
    if (!teamId || !isCoach) {
      console.error('❌ Cannot complete meeting: Missing teamId or not a coach');
      return;
    }

    if (!meetingData.title || !meetingData.title.trim()) {
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
        title: meetingData.title.trim(),
        date: meetingData.date,
        time: meetingData.time || undefined,
        attendees: attendees,
        completedBy: currentUser?.id || currentUser?.userId,
        isScheduledViaCalendar: isScheduledViaCalendar,
        calendarEventId: calendarEventId || undefined
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
        setMeetingData({
          title: '',
          date: new Date().toISOString().split('T')[0],
          time: ''
        });
        setIsScheduledViaCalendar(false);
        setCalendarEventId(null);

        if (onComplete) {
          onComplete(result.data);
        }
      } else {
        showToast(result.error || 'Failed to save meeting attendance', 'error');
      }
    } catch (error) {
      console.error('❌ Error saving meeting attendance:', error);
      showToast('Error saving meeting attendance', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Include ALL members (coach + team members) for attendance tracking
  const allMembers = teamMembers || [];
  const membersArray = Object.values(attendance);
  const presentCount = membersArray.filter(a => a.present).length;
  const totalCount = membersArray.length;

  // Content to render (shared between embedded and standalone modes)
  const content = (
    <>
      {/* Header */}
      <div className="flex items-center gap-2" style={{ height: '28px', lineHeight: '28px' }}>
        <Calendar className="w-5 h-5 text-[#8a7a50]" aria-hidden="true" />
        <h3 className="text-lg font-bold text-[#4a3b22] font-hand tracking-wide">
          Meeting Attendance
        </h3>
      </div>

      {/* Meeting Title, Date & Time - Grid layout */}
      <div className={embedded ? "grid grid-cols-1 sm:grid-cols-3 gap-4" : "grid grid-cols-1 sm:grid-cols-3 gap-4"} style={{ marginBottom: '28px' }}>
        <div>
          <p className="text-sm font-semibold text-[#5c5030] font-hand" style={{ lineHeight: '28px' }}>
            Meeting Title
          </p>
          <div className="relative">
            <input
              id="meeting-title"
              type="text"
              value={meetingData.title}
              onChange={(e) => setMeetingData({ ...meetingData, title: e.target.value })}
              placeholder="e.g., Weekly Team Sync"
              disabled={!isCoach}
              className={`w-full px-2 border-2 border-[#8a7a50] bg-white/50 rounded-lg text-[#4a3b22] font-hand text-base ${
                isCoach 
                  ? 'focus:outline-none focus:ring-2 focus:ring-[#8a7a50] cursor-text' 
                  : 'opacity-60 cursor-not-allowed'
              }`}
              style={{ height: '28px', lineHeight: '28px' }}
              data-testid="meeting-title-input"
            />
            {isSavingDraft && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Loader2 className="h-3 w-3 animate-spin text-[#8a7a50]" />
              </div>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#5c5030] font-hand" style={{ lineHeight: '28px' }}>
            Date
          </p>
          <input
            id="meeting-date"
            type="date"
            value={meetingData.date}
            onChange={(e) => setMeetingData({ ...meetingData, date: e.target.value })}
            disabled={!isCoach}
            className={`w-full px-2 border-2 border-[#8a7a50] bg-white/50 rounded-lg text-[#4a3b22] font-hand text-base ${
              isCoach 
                ? 'focus:outline-none focus:ring-2 focus:ring-[#8a7a50] cursor-pointer' 
                : 'opacity-60 cursor-not-allowed'
            }`}
            style={{ height: '28px', lineHeight: '28px' }}
            data-testid="meeting-date-input"
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#5c5030] font-hand" style={{ lineHeight: '28px' }}>
            Time
          </p>
          <div className="relative">
            <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a7a50] pointer-events-none z-10" aria-hidden="true" />
            <input
              id="meeting-time"
              type="time"
              value={meetingData.time}
              onChange={(e) => setMeetingData({ ...meetingData, time: e.target.value })}
              disabled={!isCoach}
              className={`w-full pl-8 pr-2 border-2 border-[#8a7a50] bg-white/50 rounded-lg text-[#4a3b22] font-hand text-base relative z-0 ${
                isCoach 
                  ? 'focus:outline-none focus:ring-2 focus:ring-[#8a7a50] cursor-pointer' 
                  : 'opacity-60 cursor-not-allowed'
              }`}
              style={{ height: '28px', lineHeight: '28px' }}
              data-testid="meeting-time-input"
              onClick={(e) => {
                if (isCoach && e.target === e.currentTarget) {
                  e.target.showPicker?.();
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Attendance Checklist - Includes Coach */}
      {allMembers.length > 0 ? (
        <>
          <p className="text-sm font-semibold text-[#5c5030] font-hand" style={{ lineHeight: '28px', marginBottom: '0' }}>
            Team Members ({presentCount}/{totalCount} present)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4" style={{ marginTop: '0', marginBottom: '28px', rowGap: '0' }}>
            {allMembers.map((member) => {
              const memberAttendance = attendance[member.id];
              const isPresent = memberAttendance?.present || false;
              const isCoachMember = member.isCoach || member.id === managerId;
              
              return (
                <label
                  key={member.id}
                  className={`flex items-baseline gap-2 rounded-lg transition-colors ${
                    isCoach 
                      ? 'cursor-pointer hover:bg-[#8a7a50]/10' 
                      : 'cursor-default opacity-75'
                  }`}
                  style={{ height: '28px', lineHeight: '28px' }}
                  data-testid={`attendance-checkbox-${member.id}`}
                >
                  <div className="relative flex-shrink-0" style={{ display: 'flex', alignItems: 'baseline', height: '28px' }}>
                    <input
                      type="checkbox"
                      checked={isPresent}
                      onChange={() => handleToggleAttendance(member.id)}
                      disabled={!isCoach}
                      className="sr-only"
                      aria-label={`Mark ${member.name} as present`}
                    />
                    <div
                      className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
                        isPresent
                          ? 'bg-[#4a3b22] border-[#4a3b22]'
                          : 'border-[#8a7a50] bg-white/50'
                      }`}
                      style={{ marginTop: 'auto', marginBottom: '2px' }}
                    >
                      {isPresent && (
                        <Check className="w-3 h-3 text-[#fef9c3]" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                  <span 
                    className={`text-base font-hand ${isPresent ? 'text-[#4a3b22] font-semibold' : 'text-[#5c5030]'}`} 
                    style={{ 
                      lineHeight: '28px',
                      display: 'block'
                    }}
                  >
                    {member.name}{isCoachMember ? ' (Coach)' : ''}
                  </span>
                </label>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ height: '56px', lineHeight: '28px' }}>
          <p className="text-base text-[#5c5030] font-hand text-center">
            No team members to track attendance for.
          </p>
        </div>
      )}

      {/* Action Buttons - Only show for coaches */}
      {isCoach && (
        <div className="flex gap-2">
          <button
            onClick={handleScheduleMeeting}
            disabled={isScheduling || !meetingData.title || !meetingData.date || !meetingData.time || allMembers.length === 0}
            className="flex-1 px-3 bg-[#8a7a50] text-[#fef9c3] rounded-lg hover:bg-[#9a8a60] transition-all duration-200 shadow-sm hover:shadow-md font-medium text-base font-hand disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ height: '28px', lineHeight: '28px' }}
            data-testid="schedule-meeting-button"
          >
            {isScheduling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Scheduling...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" aria-hidden="true" />
                Schedule Meeting
              </>
            )}
          </button>
          <button
            onClick={handleCompleteMeeting}
            disabled={isSaving || !meetingData.title || !meetingData.date || allMembers.length === 0}
            className="flex-1 px-3 bg-[#4a3b22] text-[#fef9c3] rounded-lg hover:bg-[#5c5030] transition-all duration-200 shadow-sm hover:shadow-md font-medium text-base font-hand disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ height: '28px', lineHeight: '28px' }}
            data-testid="complete-meeting-button"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                Complete Meeting
              </>
            )}
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="px-3 bg-[#8a7a50]/30 text-[#5c5030] rounded-lg hover:bg-[#8a7a50]/50 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-base font-hand flex items-center justify-center"
            style={{ height: '28px', lineHeight: '28px' }}
            data-testid="history-button"
            aria-label="View attendance history"
          >
            <History className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}
      
      {/* History Modal */}
      {showHistory && teamId && (
        <MeetingHistoryModal
          teamId={teamId}
          onClose={() => setShowHistory(false)}
          isCoach={isCoach}
        />
      )}
      
      {/* Read-only message for non-coaches */}
      {!isCoach && (
        <div className="pt-3 border-t border-[#8a7a50]/20">
          <p className="text-sm text-[#5c5030] font-hand text-center italic">
            Only coaches can mark attendance and complete meetings
          </p>
        </div>
      )}
    </>
  );

  // Embedded mode: just render content without background
  if (embedded) {
    return <div className="flex flex-col h-full" style={{ marginTop: '-4px' }}>{content}</div>;
  }

  // Standalone mode: render with yellow lined paper background
  return (
    <div className="relative h-full group">
      <div 
        className="absolute inset-0 rounded-sm shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02] group-hover:rotate-0"
        style={{
          background: 'linear-gradient(to bottom right, #fef9c3 0%, #fef08a 100%)',
          transform: 'rotate(-1deg)',
        }}
      >
        {/* Lined Paper Effect */}
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-sm"
          style={{
            backgroundImage: `repeating-linear-gradient(
              transparent,
              transparent 27px,
              rgba(180, 160, 120, 0.25) 27px,
              rgba(180, 160, 120, 0.25) 28px
            )`,
            backgroundPosition: '0 32px',
          }}
        />

        {/* Top fold/tape effect */}
        <div 
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-6 opacity-50"
          style={{
            background: 'rgba(255, 255, 255, 0.4)',
            transform: 'rotate(-1deg)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            backdropFilter: 'blur(1px)',
          }}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col p-6 group-hover:scale-[1.02] group-hover:rotate-0 transition-all duration-300" style={{ transform: 'rotate(-1deg)' }}>
        {content}
      </div>
    </div>
  );
}

MeetingAttendanceCard.propTypes = {
  teamId: PropTypes.string,
  teamMembers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    isCoach: PropTypes.bool
  })),
  isCoach: PropTypes.bool,
  onComplete: PropTypes.func,
  embedded: PropTypes.bool,
  managerId: PropTypes.string,
  teamData: PropTypes.object
};

MeetingAttendanceCard.defaultProps = {
  teamId: null,
  teamMembers: [],
  isCoach: false,
  onComplete: null,
  embedded: false,
  managerId: null,
  teamData: null
};

