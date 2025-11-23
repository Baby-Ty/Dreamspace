// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { 
  Crown, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  Repeat, 
  UserMinus,
  Edit3,
  Check,
  X,
  BookOpen,
  Heart,
  Users2,
  Sparkles
} from 'lucide-react';
import VirtualList from '../../components/VirtualList';
import FlagIcon from '../../components/FlagIcon';
import { useState } from 'react';
import { useRovingFocus } from '../../hooks/useRovingFocus';
import { getCountryCode } from '../../utils/regionUtils';
import { coachingService } from '../../services/coachingService';
import { showToast } from '../../utils/toast';
import { generateRandomTeamName } from '../../utils/teamNameGenerator';

/**
 * Pure presentational component for displaying a list of coaches
 * @param {Array} coaches - Array of coach objects with team data
 * @param {Function} onSelect - Callback when coach is selected (coach) => void (deprecated - now toggles expansion)
 * @param {Function} onUnassignUser - Callback when user is unassigned (member, coachId) => void
 * @param {Function} onReplaceCoach - Callback when coach is replaced (coach) => void
 * @param {Function} onRefresh - Callback to refresh data after updates
 */
export default function CoachList({ coaches, onSelect, onUnassignUser, onReplaceCoach, onRefresh }) {
  const [expandedTeams, setExpandedTeams] = useState({});
  const [editingTeamName, setEditingTeamName] = useState(null);
  const [editedTeamName, setEditedTeamName] = useState('');

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
    // Cancel any editing when toggling
    if (editingTeamName === coachId) {
      setEditingTeamName(null);
      setEditedTeamName('');
    }
  };

  const handleStartEditTeamName = (coach, e) => {
    e.stopPropagation();
    setEditingTeamName(coach.id);
    setEditedTeamName(coach.teamName || '');
  };

  const handleCancelEditTeamName = (e) => {
    e.stopPropagation();
    setEditingTeamName(null);
    setEditedTeamName('');
  };

  const handleGenerateRandomTeamName = (e) => {
    e.stopPropagation();
    const randomName = generateRandomTeamName();
    setEditedTeamName(randomName);
  };

  const handleSaveTeamName = async (coach, e) => {
    e.stopPropagation();
    if (!editedTeamName.trim()) {
      showToast('Team name cannot be empty', 'error');
      return;
    }

    try {
      // For now, we'll update via the team relationship update
      // This is a simplified approach - in production you'd have a dedicated endpoint
      const result = await coachingService.updateTeamName(coach.id, editedTeamName.trim());
      
      if (result.success) {
        showToast('Team name updated successfully', 'success');
        setEditingTeamName(null);
        setEditedTeamName('');
        if (onRefresh) {
          onRefresh();
        }
      } else {
        showToast(result.error || 'Failed to update team name', 'error');
      }
    } catch (error) {
      console.error('Error updating team name:', error);
      showToast('Error updating team name', 'error');
    }
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
        style={useVirtualization ? { ...style, padding: '6px 0' } : {}}
        className={useVirtualization ? '' : 'mb-3'}
      >
        <div 
          className="bg-white border border-professional-gray-200 rounded-lg hover:shadow-md transition-all duration-200"
        >
            {/* Main Coach Row */}
            <div 
              {...rovingProps}
              className="p-4 cursor-pointer hover:bg-professional-gray-50 focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 rounded-lg" 
              onClick={() => toggleTeamExpansion(coach.id)}
              onKeyDown={(e) => handleKeyDown(e, () => toggleTeamExpansion(coach.id), index)}
              role="button"
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${coach.name}'s team`}
              aria-expanded={isExpanded}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <img
                    src={coach.avatar}
                    alt={`${coach.name}'s profile`}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-professional-gray-100"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.name)}&background=6366f1&color=fff&size=48`;
                    }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Crown 
                        className="w-4 h-4 text-netsurit-red flex-shrink-0" 
                        aria-label="Coach"
                      />
                      <h3 className="text-base font-semibold text-professional-gray-900 truncate">
                        {coach.name}
                      </h3>
                    </div>
                    {/* Editable Team Name */}
                    {editingTeamName === coach.id ? (
                      <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editedTeamName}
                          onChange={(e) => setEditedTeamName(e.target.value)}
                          onKeyDown={(e) => {
                            // Prevent event propagation to parent handlers (especially spacebar)
                            e.stopPropagation();
                            if (e.key === 'Enter') {
                              handleSaveTeamName(coach, e);
                            } else if (e.key === 'Escape') {
                              handleCancelEditTeamName(e);
                            }
                            // Allow spacebar and other keys to work normally in the input
                          }}
                          className="text-sm px-3 py-1.5 border-2 border-netsurit-red rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red flex-1 min-w-0"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => handleGenerateRandomTeamName(e)}
                          className="p-1.5 text-netsurit-coral hover:text-netsurit-red hover:bg-netsurit-coral/10 rounded-lg transition-colors"
                          aria-label="Generate random team name"
                          title="Generate random team name"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleSaveTeamName(coach, e)}
                          className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          aria-label="Save team name"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleCancelEditTeamName(e)}
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Cancel editing"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1.5 group">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-professional-gray-100 rounded-md">
                          <Users2 className="w-3 h-3 text-professional-gray-500 flex-shrink-0" aria-hidden="true" />
                          <span className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">Team:</span>
                        </div>
                        <p className="text-sm font-medium text-professional-gray-700 truncate">{coach.teamName || 'Unnamed Team'}</p>
                        <button
                          onClick={(e) => handleStartEditTeamName(coach, e)}
                          className="p-1 text-professional-gray-400 hover:text-netsurit-red hover:bg-netsurit-red/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                          aria-label="Edit team name"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metrics and Actions */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 text-sm" role="group" aria-label="Team statistics">
                    <div className="text-center min-w-[50px]">
                      <div className="text-base font-semibold text-professional-gray-900">
                        {coach.teamMetrics?.teamSize || 0}
                      </div>
                      <div className="text-xs text-professional-gray-500">team</div>
                    </div>
                    <div className="text-center min-w-[60px]">
                      <div className="text-base font-semibold text-professional-gray-900">
                        {coach.performanceScore || 0}
                      </div>
                      <div className="text-xs text-professional-gray-500">score</div>
                    </div>
                    <div className="text-center min-w-[60px]">
                      <div className="text-base font-semibold text-professional-gray-900">
                        {coach.teamMetrics?.engagementRate || 0}%
                      </div>
                      <div className="text-xs text-professional-gray-500">engaged</div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center gap-1" role="group" aria-label="Coach actions">
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
                  </div>
                </div>
              </div>
            </div>

            {/* Team Members (when expanded) */}
            {isExpanded && coach.teamMetrics?.teamMembers && (
              <div 
                className="border-t-2 border-professional-gray-200 bg-professional-gray-100"
                role="region"
                aria-label={`${coach.name}'s team members`}
              >
                <div className="p-4 space-y-3">
                  {coach.teamMetrics.teamMembers.map((member) => (
                    <div 
                      key={member.id} 
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

