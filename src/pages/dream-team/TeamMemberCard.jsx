// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { MapPin, Award, BookOpen, Heart, Users2, CheckCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Team Member Card Component
 * Displays a team member's info in a vertical, centered card layout
 */
export default function TeamMemberCard({ member }) {
  const navigate = useNavigate();

  // Filter public dreams from member's dreamBook
  const publicDreams = useMemo(() => {
    if (!member.dreamBook || !Array.isArray(member.dreamBook)) return [];
    return member.dreamBook.filter(dream => dream.isPublic === true);
  }, [member.dreamBook]);

  const handleConnect = () => {
    navigate('/dream-connect', { state: { targetUserId: member.id } });
  };

  // Get accent color class based on member's accentColor
  const getAccentColorClass = () => {
    const color = member.accentColor || 'netsurit-red';
    const colorMap = {
      'netsurit-red': 'ring-netsurit-red',
      'netsurit-coral': 'ring-netsurit-coral',
      'netsurit-orange': 'ring-netsurit-orange'
    };
    return colorMap[color] || 'ring-netsurit-red';
  };

  // Get progress bar color based on percentage
  const getProgressBarColor = () => {
    const progress = member.weeklyProgress || 0;
    if (progress >= 67) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (progress >= 34) return 'bg-gradient-to-r from-netsurit-orange to-netsurit-coral';
    return 'bg-gradient-to-r from-netsurit-red to-netsurit-coral';
  };

  return (
    <div 
      className="group bg-white rounded-2xl border border-professional-gray-200 shadow-lg hover:shadow-2xl hover:border-netsurit-red/20 hover:-translate-y-1 transition-all duration-500 ease-out overflow-hidden flex flex-col relative"
      role="listitem"
      aria-label={`Team member: ${member.name}`}
      data-testid={`team-member-card-${member.id}`}
    >
      {/* Points Badge - Top Right */}
      {member.score !== undefined && (
        <div 
          className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-netsurit-coral to-netsurit-orange text-white rounded-full shadow-md"
          data-testid={`member-${member.id}-points-badge`}
        >
          <Award className="w-2.5 h-2.5" aria-hidden="true" />
          <span className="text-xs font-bold">{member.score} pts</span>
        </div>
      )}

      {/* Main Content - Centered */}
      <div className="p-4 pt-6 flex flex-col items-center flex-1">
        {/* Profile Picture - Centered */}
        <div className="relative mb-3">
          <img
            src={member.avatar && !member.avatar.startsWith('blob:') 
              ? member.avatar 
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=EC4B5C&color=fff&size=80`}
            alt={`${member.name}'s profile`}
            className={`w-20 h-20 rounded-full ring-2 ${getAccentColorClass()} shadow-lg object-cover`}
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=EC4B5C&color=fff&size=80`;
            }}
            data-testid={`member-${member.id}-avatar`}
          />
          {/* Coach Badge */}
          {member.isCoach && (
            <div 
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-netsurit-red border-2 border-white rounded-full flex items-center justify-center shadow-md"
              aria-label="Coach"
              data-testid={`member-${member.id}-coach-badge`}
            >
              <Users2 className="w-3 h-3 text-white" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Name & Location - Centered */}
        <h3 className="text-lg font-bold text-professional-gray-900 text-center mb-1" data-testid={`member-${member.id}-name`}>
          {member.name}
        </h3>
        {member.office && (
          <div className="flex items-center text-xs text-professional-gray-600 mb-3" data-testid={`member-${member.id}-location`}>
            <MapPin className="w-2.5 h-2.5 mr-1 flex-shrink-0" aria-hidden="true" />
            <span>{member.office}</span>
          </div>
        )}

        {/* Stats Pills - Horizontal Row */}
        <div className="flex items-center justify-center gap-1.5 mb-3 w-full">
          <div 
            className="flex items-center gap-1 px-2 py-1 bg-professional-gray-100 text-professional-gray-700 rounded-full border border-professional-gray-200"
            data-testid={`member-${member.id}-dreams-pill`}
          >
            <BookOpen className="w-3 h-3 text-professional-gray-600" aria-hidden="true" />
            <span className="text-xs font-medium">{member.dreamsCount || 0} dreams</span>
          </div>
          <div 
            className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-netsurit-red/20 to-netsurit-coral/20 text-professional-gray-900 rounded-full"
            data-testid={`member-${member.id}-connects-pill`}
          >
            <Heart className="w-3 h-3 text-netsurit-red" aria-hidden="true" />
            <span className="text-xs font-medium">{member.connectsCount || 0} connects</span>
          </div>
        </div>

        {/* Completion Stats Row */}
        <div className="flex items-center justify-center text-xs text-professional-gray-600 mb-3 gap-1.5" data-testid={`member-${member.id}-completion-stats`}>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-600" aria-hidden="true" />
            {member.completedGoalsCount || 0} goals
          </span>
          <span className="text-professional-gray-400">|</span>
          <span className="flex items-center gap-1">
            <Award className="w-3 h-3 text-netsurit-orange" aria-hidden="true" />
            {member.completedDreamsCount || 0} dreams
          </span>
        </div>

        {/* Weekly Progress Bar */}
        <div className="w-full mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-professional-gray-700">This Week</span>
            <span className="text-xs font-bold text-professional-gray-900">{member.weeklyProgress || 0}%</span>
          </div>
          <div className="w-full h-2 bg-professional-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getProgressBarColor()} transition-all duration-500 ease-out`}
              style={{ width: `${member.weeklyProgress || 0}%` }}
              role="progressbar"
              aria-valuenow={member.weeklyProgress || 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Weekly progress: ${member.weeklyProgress || 0}%`}
              data-testid={`member-${member.id}-progress-bar`}
            />
          </div>
        </div>

        {/* Public Dreams List */}
        <div className="w-full mt-3 pt-3 border-t border-professional-gray-200 self-stretch" data-testid={`member-${member.id}-public-dreams`}>
          <h4 className="text-xs font-semibold text-professional-gray-700 uppercase tracking-wide mb-1.5">
            Public Dreams
          </h4>
          {publicDreams.length > 0 ? (
            <ul className="space-y-1" role="list">
              {publicDreams.slice(0, 3).map((dream, idx) => (
                <li 
                  key={dream.id || idx} 
                  className="flex items-start text-xs text-professional-gray-700"
                  data-testid={`member-${member.id}-dream-${idx}`}
                >
                  <span className="text-netsurit-coral mr-1.5 flex-shrink-0">•</span>
                  <span className="truncate">{dream.title}</span>
                </li>
              ))}
              {publicDreams.length > 3 && (
                <li 
                  className="text-xs text-professional-gray-500 italic pl-3"
                  data-testid={`member-${member.id}-more-dreams`}
                >
                  (+ {publicDreams.length - 3} more dream{publicDreams.length - 3 !== 1 ? 's' : ''})
                </li>
              )}
            </ul>
          ) : (
            <p 
              className="text-xs text-professional-gray-500 italic"
              data-testid={`member-${member.id}-no-dreams`}
            >
              No public dreams
            </p>
          )}
        </div>

        {/* Spacer to push button to bottom */}
        <div className="flex-1"></div>

        {/* Quick Connect Button */}
        <button
          onClick={handleConnect}
          className="w-full mt-3 px-3 py-2 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-300 shadow-sm hover:shadow-md font-medium text-xs flex items-center justify-center gap-1.5"
          aria-label={`Connect with ${member.name}`}
          data-testid={`member-${member.id}-connect-button`}
        >
          <Heart className="w-3.5 h-3.5" aria-hidden="true" />
          Quick Connect
        </button>
      </div>
    </div>
  );
}

TeamMemberCard.propTypes = {
  member: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    office: PropTypes.string,
    score: PropTypes.number,
    dreamsCount: PropTypes.number,
    connectsCount: PropTypes.number,
    completedGoalsCount: PropTypes.number,
    completedDreamsCount: PropTypes.number,
    weeklyProgress: PropTypes.number,
    activityStatus: PropTypes.oneOf(['active', 'recent', 'inactive']),
    accentColor: PropTypes.string,
    isCoach: PropTypes.bool,
    dreamBook: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      isPublic: PropTypes.bool
    }))
  }).isRequired
};
