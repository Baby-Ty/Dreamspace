import { Clock, Loader2, Globe } from 'lucide-react';
import TimezoneSelect from 'react-timezone-select';

/**
 * Timezone mappings: IANA names (for react-timezone-select) with Windows equivalents
 */
const TIMEZONE_CONFIG = {
  'Africa/Johannesburg': {
    label: 'South African Time (SAST)',
    windows: 'South Africa Standard Time'
  },
  'America/New_York': {
    label: 'Eastern Time (EST/EDT)',
    windows: 'Eastern Standard Time'
  },
  'America/Chicago': {
    label: 'Central Time (CST/CDT)',
    windows: 'Central Standard Time'
  },
  'America/Denver': {
    label: 'Mountain Time (MST/MDT)',
    windows: 'Mountain Standard Time'
  },
  'America/Los_Angeles': {
    label: 'Pacific Time (PST/PDT)',
    windows: 'Pacific Standard Time'
  },
  'Europe/London': {
    label: 'UK Time (GMT/BST)',
    windows: 'GMT Standard Time'
  },
  'Europe/Paris': {
    label: 'Central European Time (CET)',
    windows: 'W. Europe Standard Time'
  }
};

// Create timezone list for react-timezone-select (IANA names with labels)
const COMMON_TIMEZONES = Object.fromEntries(
  Object.entries(TIMEZONE_CONFIG).map(([iana, config]) => [iana, config.label])
);

/**
 * Convert Windows timezone format to IANA format for display
 * Handles both Windows and IANA formats as input
 */
const windowsToIANA = (windowsName) => {
  if (!windowsName) return null;
  
  // Check if it's already IANA format (contains '/')
  if (windowsName.includes('/')) {
    return windowsName;
  }
  
  // Convert from Windows to IANA
  const entry = Object.entries(TIMEZONE_CONFIG).find(([_, config]) => config.windows === windowsName);
  if (!entry) {
    console.warn(`Unknown Windows timezone: "${windowsName}", defaulting to America/New_York`);
    return 'America/New_York';
  }
  return entry[0];
};

/**
 * Convert IANA timezone format to Windows format for API
 * Handles both IANA and Windows formats as input
 */
const ianaToWindows = (ianaName) => {
  if (!ianaName) return 'Eastern Standard Time';
  
  // Check if it's already Windows format (doesn't contain '/')
  if (!ianaName.includes('/')) {
    return ianaName;
  }
  
  // Convert from IANA to Windows
  return TIMEZONE_CONFIG[ianaName]?.windows || 'Eastern Standard Time';
};

// Helper: Normalize timezone to Windows format (from either IANA or Windows)
const normalizeToWindows = (timezone) => {
  if (!timezone) return 'Eastern Standard Time';
  
  // If it contains '/', it's IANA - convert to Windows
  if (timezone.includes('/')) {
    return ianaToWindows(timezone);
  }
  
  // Already Windows format
  return timezone;
};

/**
 * Meeting form fields (title, date, time, timezone)
 */
export default function MeetingFormFields({
  meetingData,
  setMeetingData,
  isCoach,
  isLoadingScheduled
}) {
  // Normalize timezone to Windows format first, then convert to IANA for display
  const windowsTimezone = normalizeToWindows(meetingData.timezone);
  const displayTimezone = windowsToIANA(windowsTimezone);
  
  // Auto-convert legacy IANA format to Windows format
  if (meetingData.timezone && meetingData.timezone !== windowsTimezone) {
    setMeetingData({ ...meetingData, timezone: windowsTimezone });
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" style={{ marginBottom: '28px' }}>
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

      {/* Duration */}
      <div>
        <p className="text-sm font-semibold text-[#5c5030] font-hand" style={{ lineHeight: '28px' }}>
          Duration
        </p>
        <div className="relative">
          <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a7a50] pointer-events-none z-10" aria-hidden="true" />
          <select
            id="meeting-duration"
            value={meetingData.duration || 60}
            onChange={(e) => setMeetingData({ ...meetingData, duration: parseInt(e.target.value, 10) })}
            disabled={!isCoach}
            className={`w-full pl-8 pr-2 border-2 border-[#8a7a50] bg-white/50 rounded-lg text-[#4a3b22] font-hand text-base ${
              isCoach 
                ? 'focus:outline-none focus:ring-2 focus:ring-[#8a7a50] cursor-pointer' 
                : 'opacity-60 cursor-not-allowed'
            }`}
            style={{ height: '28px', lineHeight: '28px' }}
            data-testid="meeting-duration-select"
          >
            <option value="30">30 mins</option>
            <option value="45">45 mins</option>
            <option value="60">60 mins</option>
          </select>
        </div>
      </div>

      {/* Timezone */}
      <div>
        <p className="text-sm font-semibold text-[#5c5030] font-hand" style={{ lineHeight: '28px' }}>
          Timezone
        </p>
        <div className="relative">
          <Globe className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a7a50] pointer-events-none z-10" aria-hidden="true" />
          <TimezoneSelect
            value={displayTimezone}
            onChange={(tz) => {
              const ianaValue = typeof tz === 'string' ? tz : tz?.value;
              const windowsValue = ianaToWindows(ianaValue);
              setMeetingData({ ...meetingData, timezone: windowsValue });
            }}
            isDisabled={!isCoach}
            timezones={COMMON_TIMEZONES}
            labelStyle="offsetHidden"
            className="timezone-select"
            styles={{
              control: (base, state) => ({
                ...base,
                minHeight: '28px',
                height: '28px',
                paddingLeft: '24px',
                border: '2px solid #8a7a50',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                cursor: isCoach ? 'pointer' : 'not-allowed',
                opacity: isCoach ? 1 : 0.6,
                '&:hover': {
                  borderColor: '#8a7a50'
                },
                boxShadow: state.isFocused ? '0 0 0 2px #8a7a50' : 'none'
              }),
              valueContainer: (base) => ({
                ...base,
                height: '28px',
                padding: '0 4px',
                fontFamily: 'var(--font-hand)',
                color: '#4a3b22'
              }),
              input: (base) => ({
                ...base,
                margin: '0',
                padding: '0',
                fontFamily: 'var(--font-hand)',
                color: '#4a3b22'
              }),
              indicatorSeparator: () => ({
                display: 'none'
              }),
              dropdownIndicator: (base) => ({
                ...base,
                padding: '0 4px',
                color: '#8a7a50',
                '&:hover': {
                  color: '#8a7a50'
                }
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: '#fef9c3',
                border: '2px solid #8a7a50',
                borderRadius: '0.5rem',
                zIndex: 50
              }),
              option: (base, state) => ({
                ...base,
                fontFamily: 'var(--font-hand)',
                fontSize: '0.875rem',
                backgroundColor: state.isFocused ? '#fef08a' : 'transparent',
                color: '#4a3b22',
                cursor: 'pointer',
                '&:active': {
                  backgroundColor: '#fef08a'
                }
              }),
              singleValue: (base) => ({
                ...base,
                fontFamily: 'var(--font-hand)',
                color: '#4a3b22'
              })
            }}
            data-testid="meeting-timezone-select"
          />
        </div>
      </div>
    </div>
  );
}
