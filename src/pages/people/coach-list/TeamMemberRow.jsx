import { Crown, Repeat, UserMinus, BookOpen, Heart } from 'lucide-react';
import FlagIcon from '../../../components/FlagIcon';
import { getCountryCode } from '../../../utils/regionUtils';

/**
 * Single team member row in expanded coach view
 */
export default function TeamMemberRow({
  member,
  coach,
  onUnassignUser,
  onReplaceCoach
}) {
  return (
    <div 
      className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-professional-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
      role="listitem"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !member.isCoach) {
          e.preventDefault();
          onUnassignUser(member, coach.id);
        }
      }}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <img
          src={member.avatar}
          alt={`${member.name}'s profile`}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-professional-gray-200"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=6366f1&color=fff&size=40`;
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <p className="text-sm font-semibold text-professional-gray-900 truncate">
              {member.name}
            </p>
            {member.isCoach && (
              <Crown 
                className="w-4 h-4 text-netsurit-red flex-shrink-0" 
                title="Team Coach"
                aria-label="Coach badge"
              />
            )}
          </div>
          <p className="text-sm text-professional-gray-600 flex items-center gap-1.5 truncate">
            <FlagIcon countryCode={getCountryCode(member.office)} className="w-4 h-4 flex-shrink-0" />
            {member.office}
          </p>
        </div>
      </div>
      
      {/* Inline KPI Stats */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex flex-col items-center min-w-[50px]" title={`Score: ${member.score || 0} points`}>
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-professional-gray-900">{member.score || 0}</span>
            <span className="text-xs text-professional-gray-500">pts</span>
          </div>
        </div>
        <div className="flex flex-col items-center min-w-[50px]" title={`Dreams: ${member.dreamsCount || 0}`}>
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-netsurit-red" aria-hidden="true" />
            <span className="text-sm font-semibold text-professional-gray-900">{member.dreamsCount || 0}</span>
          </div>
        </div>
        <div className="flex flex-col items-center min-w-[50px]" title={`Connects: ${member.connectsCount || 0}`}>
          <div className="flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-netsurit-coral" aria-hidden="true" />
            <span className="text-sm font-semibold text-professional-gray-900">{member.connectsCount || 0}</span>
          </div>
        </div>
        {member.isCoach ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReplaceCoach(coach);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onReplaceCoach(coach);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-netsurit-orange hover:text-netsurit-warm-orange hover:bg-netsurit-orange/10 rounded-lg transition-colors border border-netsurit-orange/20 ml-2"
            title="Replace Coach"
            aria-label={`Replace ${coach.name} as coach`}
          >
            <Repeat className="w-4 h-4" aria-hidden="true" />
            <span>Replace</span>
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUnassignUser(member, coach.id);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onUnassignUser(member, coach.id);
              }
            }}
            className="p-2 text-professional-gray-400 hover:text-netsurit-red hover:bg-netsurit-red/10 rounded-lg transition-colors ml-2"
            title="Unassign from team"
            aria-label={`Unassign ${member.name} from team`}
          >
            <UserMinus className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
