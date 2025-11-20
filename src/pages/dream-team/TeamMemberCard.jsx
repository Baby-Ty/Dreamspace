// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { MapPin, Award, BookOpen, Heart, Users2, ChevronRight } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Team Member Card Component
 * Displays a team member's basic info in a card format
 */
export default function TeamMemberCard({ member, onClick, rovingProps }) {
  const handleClick = () => {
    if (onClick) {
      onClick(member);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div 
      {...rovingProps}
      className="group bg-white rounded-2xl border border-professional-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-[1.02] hover:border-netsurit-red/30 focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 cursor-pointer flex flex-col"
      role="gridcell"
      aria-label={`Team member: ${member.name}`}
      data-testid={`team-member-card-${member.id}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="relative bg-gradient-to-br from-netsurit-red/5 via-netsurit-coral/5 to-netsurit-orange/5 p-5 border-b border-professional-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src={member.avatar && !member.avatar.startsWith('blob:') 
                  ? member.avatar 
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=EC4B5C&color=fff&size=56`}
                alt={`${member.name}'s profile`}
                className="w-14 h-14 rounded-full ring-2 ring-white shadow-lg object-cover"
                onError={(e) => {
                  // Fallback to generated avatar if image fails to load (including blob URLs)
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=EC4B5C&color=fff&size=56`;
                }}
              />
              {member.isCoach && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-netsurit-red border-2 border-white rounded-full flex items-center justify-center">
                  <Users2 className="w-3 h-3 text-white" aria-hidden="true" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-professional-gray-900 truncate text-base">
                {member.name}
              </h3>
              <div className="flex items-center text-sm text-professional-gray-600 mt-1">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{member.office || 'Remote'}</span>
              </div>
              {member.score !== undefined && (
                <div className="flex items-center text-xs text-netsurit-coral mt-1.5 font-medium">
                  <Award className="w-3 h-3 mr-1" aria-hidden="true" />
                  <span>{member.score} pts</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="p-5 pb-4 flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-professional-gray-700">
            <BookOpen className="w-4 h-4 mr-2 text-professional-gray-500" aria-hidden="true" />
            <span className="text-sm font-medium">{member.dreamsCount || 0} dreams</span>
          </div>
          <div className="flex items-center text-professional-gray-700">
            <Heart className="w-4 h-4 mr-2 text-professional-gray-500" aria-hidden="true" />
            <span className="text-sm font-medium">{member.connectsCount || 0} connects</span>
          </div>
        </div>

        {/* Dream Categories Preview */}
        {member.dreamCategories && member.dreamCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {member.dreamCategories.slice(0, 3).map((category, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-professional-gray-100 text-professional-gray-700 text-xs font-medium rounded-full"
              >
                {category}
              </span>
            ))}
            {member.dreamCategories.length > 3 && (
              <span className="px-2.5 py-1 bg-professional-gray-100 text-professional-gray-700 text-xs font-medium rounded-full">
                +{member.dreamCategories.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Button */}
      <div className="px-5 pb-5">
        <button
          type="button"
          className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-professional-gray-600 to-professional-gray-700 text-white rounded-lg hover:from-professional-gray-700 hover:to-professional-gray-800 focus:outline-none focus:ring-2 focus:ring-professional-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm group-hover:shadow-md"
          aria-label={`View ${member.name}'s profile`}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          <span>View Profile</span>
          <ChevronRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
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
    dreamCategories: PropTypes.arrayOf(PropTypes.string),
    isCoach: PropTypes.bool
  }).isRequired,
  onClick: PropTypes.func,
  rovingProps: PropTypes.object
};

TeamMemberCard.defaultProps = {
  onClick: null,
  rovingProps: {}
};
