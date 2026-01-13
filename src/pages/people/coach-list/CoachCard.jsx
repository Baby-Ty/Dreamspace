import { 
  Crown, 
  ChevronDown, 
  ChevronUp, 
  Edit3,
  Check,
  X,
  Users2,
  Sparkles
} from 'lucide-react';
import TeamMemberRow from './TeamMemberRow';

/**
 * Single coach card with expandable team members
 */
export default function CoachCard({
  coach,
  index,
  isExpanded,
  rovingProps,
  editingTeamName,
  editedTeamName,
  setEditedTeamName,
  onToggle,
  onStartEdit,
  onCancelEdit,
  onSaveTeamName,
  onGenerateRandomName,
  onKeyDown,
  onUnassignUser,
  onReplaceCoach,
  useVirtualization,
  style = {}
}) {
  return (
    <div 
      key={coach.id}
      style={useVirtualization ? { ...style, padding: '6px 0' } : {}}
      className={useVirtualization ? '' : 'mb-3'}
    >
      <div className="bg-white border border-professional-gray-200 rounded-lg hover:shadow-md transition-all duration-200">
        {/* Main Coach Row */}
        <div 
          {...rovingProps}
          className="p-4 cursor-pointer hover:bg-professional-gray-50 focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 rounded-lg" 
          onClick={() => onToggle(coach.id)}
          onKeyDown={(e) => onKeyDown(e, () => onToggle(coach.id), index)}
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
                        e.stopPropagation();
                        if (e.key === 'Enter') {
                          onSaveTeamName(coach, e);
                        } else if (e.key === 'Escape') {
                          onCancelEdit(e);
                        }
                      }}
                      className="text-sm px-3 py-1.5 border-2 border-netsurit-red rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red flex-1 min-w-0"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={(e) => onGenerateRandomName(e)}
                      className="p-1.5 text-netsurit-coral hover:text-netsurit-red hover:bg-netsurit-coral/10 rounded-lg transition-colors"
                      aria-label="Generate random team name"
                      title="Generate random team name"
                    >
                      <Sparkles className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={(e) => onSaveTeamName(coach, e)}
                      className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      aria-label="Save team name"
                    >
                      <Check className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={(e) => onCancelEdit(e)}
                      className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Cancel editing"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
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
                      onClick={(e) => onStartEdit(coach, e)}
                      className="p-1 text-professional-gray-400 hover:text-netsurit-red hover:bg-netsurit-red/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                      aria-label="Edit team name"
                    >
                      <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
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
                    onToggle(coach.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggle(coach.id);
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
                <TeamMemberRow
                  key={member.id}
                  member={member}
                  coach={coach}
                  onUnassignUser={onUnassignUser}
                  onReplaceCoach={onReplaceCoach}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
