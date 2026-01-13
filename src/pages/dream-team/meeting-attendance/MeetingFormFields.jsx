import { Clock, Loader2 } from 'lucide-react';

/**
 * Meeting form fields (title, date, time)
 */
export default function MeetingFormFields({
  meetingData,
  setMeetingData,
  isCoach,
  isLoadingScheduled
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ marginBottom: '28px' }}>
      {/* Title */}
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
            disabled={!isCoach || isLoadingScheduled}
            className={`w-full px-2 border-2 border-[#8a7a50] bg-white/50 rounded-lg text-[#4a3b22] font-hand text-base ${
              isCoach 
                ? 'focus:outline-none focus:ring-2 focus:ring-[#8a7a50] cursor-text' 
                : 'opacity-60 cursor-not-allowed'
            }`}
            style={{ height: '28px', lineHeight: '28px' }}
            data-testid="meeting-title-input"
          />
          {isLoadingScheduled && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Loader2 className="h-3 w-3 animate-spin text-[#8a7a50]" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>

      {/* Date */}
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

      {/* Time */}
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
  );
}
