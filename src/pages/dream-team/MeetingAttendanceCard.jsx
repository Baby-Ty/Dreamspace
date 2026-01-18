import { Calendar, CheckCircle2, Loader2, History } from 'lucide-react';
import PropTypes from 'prop-types';
import MeetingHistoryModal from './MeetingHistoryModal';
import { useMeetingAttendance, AttendeeList, MeetingFormFields } from './meeting-attendance';

/**
 * Meeting Attendance Card Component
 * Allows coaches to track meeting attendance with yellow lined paper styling
 * @param {boolean} embedded - When true, renders without background (for use inside parent card)
 */
export default function MeetingAttendanceCard({ teamId, teamMembers, isCoach, onComplete, embedded = false, managerId }) {
  const {
    meetingData,
    setMeetingData,
    attendance,
    isSaving,
    isScheduling,
    isLoadingScheduled,
    showHistory,
    setShowHistory,
    handleToggleAttendance,
    handleScheduleMeeting,
    handleCompleteMeeting
  } = useMeetingAttendance({ teamId, teamMembers, isCoach, onComplete });

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

      {/* Meeting Form Fields */}
      <MeetingFormFields
        meetingData={meetingData}
        setMeetingData={setMeetingData}
        isCoach={isCoach}
        isLoadingScheduled={isLoadingScheduled}
      />

      {/* Attendance Checklist */}
      <AttendeeList
        members={allMembers}
        attendance={attendance}
        isCoach={isCoach}
        managerId={managerId}
        onToggleAttendance={handleToggleAttendance}
        presentCount={presentCount}
        totalCount={totalCount}
      />

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
  managerId: PropTypes.string
};

MeetingAttendanceCard.defaultProps = {
  teamId: null,
  teamMembers: [],
  isCoach: false,
  onComplete: null,
  embedded: false,
  managerId: null
};