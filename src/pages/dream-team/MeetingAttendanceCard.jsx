// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { Calendar, Check, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { coachingService } from '../../services/coachingService';
import { useApp } from '../../context/AppContext';
import { showToast } from '../../utils/toast';

/**
 * Meeting Attendance Card Component
 * Allows coaches to track meeting attendance with yellow lined paper styling
 * @param {boolean} embedded - When true, renders without background (for use inside parent card)
 */
export default function MeetingAttendanceCard({ teamId, teamMembers, isCoach, onComplete, embedded = false }) {
  const { currentUser } = useApp();
  const [isSaving, setIsSaving] = useState(false);
  const [meetingData, setMeetingData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0], // Default to today
  });
  const [attendance, setAttendance] = useState({});

  // Initialize attendance state with all team members (excluding coach)
  useEffect(() => {
    const members = (teamMembers || []).filter(member => !member.isCoach);
    const initialAttendance = {};
    members.forEach(member => {
      initialAttendance[member.id] = {
        id: member.id,
        name: member.name,
        present: false
      };
    });
    setAttendance(initialAttendance);
  }, [teamMembers]);

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
        attendees: attendees,
        completedBy: currentUser?.id || currentUser?.userId
      });

      if (result.success) {
        showToast('Meeting attendance saved successfully!', 'success');
        
        // Reset form for next meeting
        const members = (teamMembers || []).filter(member => !member.isCoach);
        const resetAttendance = {};
        members.forEach(member => {
          resetAttendance[member.id] = {
            id: member.id,
            name: member.name,
            present: false
          };
        });
        setAttendance(resetAttendance);
        setMeetingData({
          title: '',
          date: new Date().toISOString().split('T')[0]
        });

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

  const members = (teamMembers || []).filter(member => !member.isCoach);
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

      {/* Meeting Title & Date - Side by side when embedded */}
      <div className={embedded ? "grid grid-cols-2 gap-4" : "space-y-4"} style={{ marginBottom: '28px' }}>
        <div>
          <p className="text-sm font-semibold text-[#5c5030] font-hand" style={{ lineHeight: '28px' }}>
            Meeting Title
          </p>
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
      </div>

      {/* Attendance Checklist */}
      {members.length > 0 ? (
        <>
          <p className="text-sm font-semibold text-[#5c5030] font-hand" style={{ lineHeight: '28px', marginBottom: '0' }}>
            Team Members ({presentCount}/{totalCount} present)
          </p>
          <div className="grid grid-cols-3 gap-x-4" style={{ marginTop: '0', marginBottom: '28px', rowGap: '0' }}>
            {members.map((member) => {
              const memberAttendance = attendance[member.id];
              const isPresent = memberAttendance?.present || false;
              
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
                    {member.name}
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

      {/* Complete Meeting Button - Only show for coaches */}
      {isCoach && (
        <div>
          <button
            onClick={handleCompleteMeeting}
            disabled={isSaving || !meetingData.title || !meetingData.date || members.length === 0}
            className="w-full px-3 bg-[#4a3b22] text-[#fef9c3] rounded-lg hover:bg-[#5c5030] transition-all duration-200 shadow-sm hover:shadow-md font-medium text-base font-hand disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        </div>
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
  embedded: PropTypes.bool
};

MeetingAttendanceCard.defaultProps = {
  teamId: null,
  teamMembers: [],
  isCoach: false,
  onComplete: null,
  embedded: false
};

