import { Check } from 'lucide-react';

/**
 * Attendee checkbox list for meeting attendance
 */
export default function AttendeeList({
  members,
  attendance,
  isCoach,
  managerId,
  onToggleAttendance,
  presentCount,
  totalCount
}) {
  if (members.length === 0) {
    return (
      <div style={{ height: '56px', lineHeight: '28px' }}>
        <p className="text-base text-[#5c5030] font-hand text-center">
          No team members to track attendance for.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm font-semibold text-[#5c5030] font-hand" style={{ lineHeight: '28px', marginBottom: '0' }}>
        Team Members ({presentCount}/{totalCount} present)
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4" style={{ marginTop: '0', marginBottom: '28px', rowGap: '0' }}>
        {members.map((member) => {
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
                  onChange={() => onToggleAttendance(member.id)}
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
  );
}
