// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { 
  Crown, 
  MapPin, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Repeat, 
  UserMinus 
} from 'lucide-react';
import VirtualList from '../../components/VirtualList';
import FlagIcon from '../../components/FlagIcon';
import { useState } from 'react';
import { useRovingFocus } from '../../hooks/useRovingFocus';
import { getCountryCode } from '../../utils/regionUtils';

/**
 * Pure presentational component for displaying a list of coaches
 * @param {Array} coaches - Array of coach objects with team data
 * @param {Function} onSelect - Callback when coach is selected (coach) => void
 * @param {Function} onUnassignUser - Callback when user is unassigned (member, coachId) => void
 * @param {Function} onReplaceCoach - Callback when coach is replaced (coach) => void
 */
export default function CoachList({ coaches, onSelect, onUnassignUser, onReplaceCoach }) {
  const [expandedTeams, setExpandedTeams] = useState({});

  // Roving tabindex for keyboard navigation
  const { getItemProps, onKeyDown: handleRovingKeyDown } = useRovingFocus(coaches?.length || 0, {
    loop: true,
    direction: 'vertical'
  });

  const toggleTeamExpansion = (coachId) => {
    setExpandedTeams(prev => ({
      ...prev,
      [coachId]: !prev[coachId]
    }));
  };

  const handleKeyDown = (e, action, index) => {
    // Handle roving focus navigation
    handleRovingKeyDown(e);
    
    // Handle activation (Enter/Space)
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  if (!coaches || coaches.length === 0) {
    return (
      <div className="text-center py-12 text-professional-gray-500">
        <p>No coaches found.</p>
      </div>
    );
  }

  // Use virtual list for large datasets (100+ coaches)
  const useVirtualization = coaches.length > 100;

  // Render a single coach card
  const renderCoachCard = (coach, index, style = {}) => {
    const isExpanded = expandedTeams[coach.id];
    const rovingProps = getItemProps(index);
    
    return (
      <div 
        key={coach.id}
        style={useVirtualization ? { ...style, padding: '4px 0' } : {}}
        className={useVirtualization ? '' : 'mb-2'}
      >
        <div 
          className="bg-white border border-professional-gray-200 rounded-lg hover:shadow-md transition-all duration-200"
        >
            {/* Main Coach Row */}
            <div 
              {...rovingProps}
              className="p-3 cursor-pointer hover:bg-professional-gray-50 focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 rounded-lg" 
              onClick={() => onSelect(coach)}
              onKeyDown={(e) => handleKeyDown(e, () => onSelect(coach), index)}
              role="button"
              aria-label={`View ${coach.name}'s team details`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <img
                    src={coach.avatar}
                    alt={`${coach.name}'s profile`}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.name)}&background=6366f1&color=fff&size=36`;
                    }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Crown 
                        className="w-3.5 h-3.5 text-netsurit-red flex-shrink-0" 
                        aria-label="Coach"
                      />
                      <h3 className="text-sm font-semibold text-professional-gray-900 truncate">
                        {coach.name}
                      </h3>
                    </div>
                    <p className="text-xs text-professional-gray-600 truncate">{coach.teamName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-professional-gray-500 flex items-center gap-1">
                        <FlagIcon countryCode={getCountryCode(coach.office)} className="w-4 h-4" />
                        {coach.office}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metrics and Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Quick Stats */}
                  <div className="flex items-center gap-3 text-xs" role="group" aria-label="Team statistics">
                    <div className="text-center">
                      <div className="font-semibold text-professional-gray-900">
                        {coach.teamMetrics?.teamSize || 0}
                      </div>
                      <div className="text-professional-gray-500">team</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-professional-gray-900">
                        {coach.performanceScore || 0}
                      </div>
                      <div className="text-professional-gray-500">score</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-professional-gray-900">
                        {coach.teamMetrics?.engagementRate || 0}%
                      </div>
                      <div className="text-professional-gray-500">engaged</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1" role="group" aria-label="Coach actions">
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
                      className="p-1.5 text-netsurit-orange hover:text-netsurit-warm-orange hover:bg-netsurit-orange/10 rounded transition-colors border border-netsurit-orange/20"
                      title="Replace Coach"
                      aria-label={`Replace ${coach.name} as coach`}
                    >
                      <Repeat className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTeamExpansion(coach.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleTeamExpansion(coach.id);
                        }
                      }}
                      className="p-1.5 text-professional-gray-400 hover:text-professional-gray-600 hover:bg-professional-gray-100 rounded transition-colors"
                      title={isExpanded ? "Collapse Team" : "Expand Team"}
                      aria-label={isExpanded ? "Collapse team members" : "Expand team members"}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                    <ChevronRight className="w-4 h-4 text-netsurit-red" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>

            {/* Team Members (when expanded) */}
            {isExpanded && coach.teamMetrics?.teamMembers && (
              <div 
                className="border-t border-professional-gray-100 bg-professional-gray-50"
                role="region"
                aria-label={`${coach.name}'s team members`}
              >
                <div className="p-3 space-y-2">
                  {coach.teamMetrics.teamMembers.map((member) => (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between py-2 px-3 bg-white rounded border border-professional-gray-100"
                      role="listitem"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && !member.isCoach) {
                          e.preventDefault();
                          onUnassignUser(member, coach.id);
                        }
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <img
                          src={member.avatar}
                          alt={`${member.name}'s profile`}
                          className="w-6 h-6 rounded-full object-cover"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=6366f1&color=fff&size=24`;
                          }}
                        />
                        <div>
                          <div className="flex items-center space-x-1">
                            <p className="text-xs font-medium text-professional-gray-900">
                              {member.name}
                            </p>
                            {member.isCoach && (
                              <Crown 
                                className="w-3 h-3 text-netsurit-red" 
                                title="Team Coach"
                                aria-label="Coach badge"
                              />
                            )}
                          </div>
                          <p className="text-xs text-professional-gray-500 flex items-center gap-1">
                            <FlagIcon countryCode={getCountryCode(member.office)} className="w-3 h-3" />
                            {member.office}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div 
                          className="text-xs font-semibold text-professional-gray-900"
                          aria-label={`Score: ${member.score || 0} points`}
                        >
                          {member.score || 0}pt
                        </div>
                        {!member.isCoach && (
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
                            className="p-1 text-professional-gray-400 hover:text-netsurit-red hover:bg-netsurit-red/10 rounded transition-colors"
                            title="Unassign from team"
                            aria-label={`Unassign ${member.name} from team`}
                          >
                            <UserMinus className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    );
  };

  // Conditional rendering: virtual list for 100+ items, regular list otherwise
  if (useVirtualization) {
    return (
      <VirtualList
        items={coaches}
        renderItem={renderCoachCard}
        itemHeight={120} // Approximate height of each coach card
        height={600} // Container height
        ariaLabel="Virtual coach teams list"
        testId="coach-list-virtual"
        className="rounded-lg"
      />
    );
  }

  // Regular rendering for smaller lists
  return (
    <div 
      className="space-y-2"
      role="list"
      aria-label="Coach teams list"
      data-testid="coach-list-regular"
    >
      {coaches.map((coach, index) => renderCoachCard(coach, index))}
    </div>
  );
}

