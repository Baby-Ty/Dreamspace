// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useState } from 'react';
import { 
  Users2, 
  Loader2, 
  AlertCircle, 
  RefreshCw
} from 'lucide-react';
import TeamMemberCard from './TeamMemberCard';
import TeamStatsWidget from './TeamStatsWidget';
import TeamMemberModal from './TeamMemberModal';
import MeetingScheduleCard from './MeetingScheduleCard';
import { useDreamTeam } from '../../hooks/useDreamTeam';
import { useRovingFocus } from '../../hooks/useRovingFocus';
import HelpTooltip from '../../components/HelpTooltip';

/**
 * Main layout for Dream Team page
 * Handles orchestration, modals, and state management
 */
export default function DreamTeamLayout() {
  const {
    teamData,
    teamMembers,
    teamStats,
    isCoach,
    isLoading,
    error,
    refreshData
  } = useDreamTeam();

  // Modal state
  const [selectedMember, setSelectedMember] = useState(null);

  // Roving tabindex for keyboard navigation in grid (3 columns on large screens)
  const { getItemProps, onKeyDown: handleRovingKeyDown } = useRovingFocus(teamMembers.length, {
    loop: true,
    direction: 'both',
    columnsCount: 3 // Matches lg:grid-cols-3
  });

  // Handle member card click
  const handleMemberClick = (member) => {
    setSelectedMember(member);
  };

  // Early return for loading
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="text-center py-20">
          <Loader2 className="h-12 w-12 text-netsurit-red animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-professional-gray-900 mb-2">
            Loading Dream Team
          </h2>
          <p className="text-professional-gray-600">
            Fetching your team information...
          </p>
        </div>
      </div>
    );
  }

  // Early return for error
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="text-center py-20">
          <AlertCircle className="h-12 w-12 text-netsurit-red mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-professional-gray-900 mb-2">
            Failed to Load Team
          </h2>
          <p className="text-professional-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  // Early return for no team
  if (!teamData || !teamMembers || teamMembers.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="text-center py-20">
          <Users2 className="h-12 w-12 text-professional-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-professional-gray-900 mb-2">
            No Team Found
          </h2>
          <p className="text-professional-gray-600 max-w-md mx-auto">
            You're not currently assigned to a team. Please contact your administrator to be added to a team.
          </p>
        </div>
      </div>
    );
  }

  const teamId = teamData.managerId || teamData.teamName || 'default';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          {/* Title Section */}
          <div className="mb-6 lg:mb-0">
            <div className="flex items-center space-x-3 mb-2">
              <Users2 className="h-8 w-8 text-netsurit-red" />
              <h1 className="text-3xl font-bold text-professional-gray-900">
                Dream Team
              </h1>
              {isCoach && (
                <span className="px-3 py-1 bg-netsurit-red/10 text-netsurit-red text-xs font-semibold rounded-full border border-netsurit-red/20">
                  Coach
                </span>
              )}
              <HelpTooltip 
                title="Dream Team Guide"
                content="View your team members, see their public dreams, and track team progress. Coaches can manage team meeting schedules."
              />
            </div>
            <p className="text-professional-gray-600">
              {teamData.teamName ? (
                <>Team: <span className="font-semibold">{teamData.teamName}</span></>
              ) : (
                'Connect with your team members and share your dream journeys'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Meeting Schedule Card (Coach-only, shown at top) */}
      {isCoach && (
        <div className="mb-6">
          <MeetingScheduleCard 
            teamId={teamId}
            isCoach={isCoach}
            onSave={(data) => {
              console.log('Meeting schedule saved:', data);
            }}
          />
        </div>
      )}

      {/* Team Stats Widget */}
      <div className="mb-8">
        <TeamStatsWidget teamStats={teamStats} teamName={teamData.teamName} />
      </div>

      {/* Team Members */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-professional-gray-900">
            Team Members
          </h2>
          <p className="text-sm text-professional-gray-500">
            {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Grid of Team Member Cards */}
        {teamMembers.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-professional-gray-50 rounded-2xl border border-professional-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-professional-gray-100 to-professional-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users2 className="w-10 h-10 text-professional-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-professional-gray-900 mb-3">
              No team members yet
            </h3>
            <p className="text-professional-gray-600 max-w-md mx-auto leading-relaxed">
              {isCoach 
                ? 'Start building your team by adding members through the People Hub.'
                : 'Your team is being set up. Check back soon!'}
            </p>
          </div>
        ) : (
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            role="grid"
            aria-label="Team members"
            onKeyDown={handleRovingKeyDown}
          >
            {teamMembers.map((member, index) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                onClick={handleMemberClick}
                rovingProps={getItemProps(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Team Member Modal */}
      {selectedMember && (
        <TeamMemberModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          isCoach={isCoach}
        />
      )}
    </div>
  );
}

