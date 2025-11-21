// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useState } from 'react';
import { 
  Users2, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  Trophy,
  TrendingUp,
  BookOpen,
  Heart,
  MapPin,
  Award
} from 'lucide-react';
import TeamMemberCard from './TeamMemberCard';
import MeetingScheduleCard from './MeetingScheduleCard';
import { useDreamTeam } from '../../hooks/useDreamTeam';
import HelpTooltip from '../../components/HelpTooltip';
import { coachingService } from '../../services/coachingService';

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

  // Edit mission state
  const [isEditingMission, setIsEditingMission] = useState(false);
  const [editedMission, setEditedMission] = useState('');

  const handleEditMission = () => {
    setEditedMission(teamData.mission || 'Empowering each team member to achieve their dreams through collaboration, support, and shared growth.');
    setIsEditingMission(true);
  };

  const handleSaveMission = async () => {
    const managerId = teamData?.managerId;
    if (!managerId) {
      console.error('❌ Cannot save mission: No manager ID');
      return;
    }

    try {
      const result = await coachingService.updateTeamMission(managerId, editedMission);
      if (result.success) {
        setIsEditingMission(false);
        // Refresh team data to show updated mission
        refreshData();
      } else {
        console.error('❌ Failed to save mission:', result.error);
        alert(`Failed to save mission: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error saving mission:', error);
      alert(`Error saving mission: ${error.message}`);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingMission(false);
    setEditedMission('');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4">
      {/* Row 1: Title | KPIs */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
          {/* Title Section */}
        <div className="lg:w-1/3">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-professional-gray-900">
                Dream Team
              </h1>
            <Users2 className="h-8 w-8 text-netsurit-red" />
              <HelpTooltip 
                title="Dream Team Guide"
                content="View your team members, see their public dreams, and track team progress. Coaches can manage team meeting schedules."
              />
            </div>
            <p className="text-professional-gray-600">
            Connect with your team members and share your dream journeys
          </p>
        </div>
        
        {/* KPI Metrics */}
        <div className="lg:w-2/3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="team-kpi-cards">
            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-6 w-6 text-netsurit-red" aria-hidden="true" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">
                Total Score
              </p>
              <p className="text-xl font-bold text-professional-gray-900" data-testid="kpi-total-score">
                {teamStats?.totalScore || 0}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-netsurit-coral" aria-hidden="true" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">
                Engagement Rate
              </p>
              <p className="text-xl font-bold text-professional-gray-900" data-testid="kpi-engagement-rate">
                {Math.round(teamStats?.engagementRate || 0)}%
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="h-6 w-6 text-netsurit-orange" aria-hidden="true" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">
                Total Dreams
              </p>
              <p className="text-xl font-bold text-professional-gray-900" data-testid="kpi-total-dreams">
                {teamStats?.totalDreams || 0}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <Heart className="h-6 w-6 text-netsurit-red" aria-hidden="true" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">
                Total Connects
              </p>
              <p className="text-xl font-bold text-professional-gray-900" data-testid="kpi-total-connects">
                {teamStats?.totalConnects || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Team Name + Mission Statement | Next Meeting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Team Name + Mission Statement Card */}
        <div className="bg-gradient-to-br from-white to-professional-gray-50 rounded-lg shadow-md p-6 border border-professional-gray-200 flex flex-col h-full relative group">
          {/* Edit Button (Coach Only) */}
          {isCoach && !isEditingMission && (
            <button
              className="absolute top-4 right-4 p-2 text-professional-gray-400 hover:text-netsurit-red hover:bg-netsurit-red/10 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
              aria-label="Edit team information"
              onClick={handleEditMission}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}

          {/* Team Name */}
          <div className="mb-4 pb-4 border-b border-professional-gray-200">
            <h2 className="text-2xl font-bold text-professional-gray-900 mb-1">
              {teamData.teamName || 'Dream Team'}
            </h2>
            <p className="text-xs text-professional-gray-500 uppercase tracking-wide font-medium">
              {teamMembers.length} Team Member{teamMembers.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Mission Statement / Message from Coach */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 bg-gradient-to-b from-netsurit-red to-netsurit-coral rounded-full"></div>
              <h3 className="text-sm font-bold text-professional-gray-700 uppercase tracking-wide">
                {isCoach ? 'Team Mission' : 'Message from Coach'}
              </h3>
            </div>
            
            {isEditingMission ? (
              <div className="flex-1 flex flex-col">
                <textarea
                  value={editedMission}
                  onChange={(e) => setEditedMission(e.target.value)}
                  className="flex-1 text-professional-gray-700 leading-relaxed border-2 border-netsurit-red/30 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Enter your team mission or message..."
                  autoFocus
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleSaveMission}
                    className="px-4 py-2 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 border-2 border-professional-gray-300 text-professional-gray-700 rounded-lg hover:bg-professional-gray-50 transition-all duration-200 font-medium text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <blockquote className="text-professional-gray-700 leading-relaxed italic border-l-2 border-professional-gray-200 pl-4">
                "{teamData.mission || 'Empowering each team member to achieve their dreams through collaboration, support, and shared growth.'}"
              </blockquote>
            )}
          </div>
        </div>

        {/* Next Meeting Card */}
        <div className="h-full">
          {isCoach ? (
          <MeetingScheduleCard 
            teamId={teamId}
            isCoach={isCoach}
            onSave={(data) => {
              console.log('Meeting schedule saved:', data);
            }}
          />
          ) : (
            <div className="bg-white rounded-lg shadow p-5 border border-professional-gray-200 h-full flex flex-col">
              <h3 className="text-sm font-bold text-professional-gray-900 uppercase tracking-wide mb-3">
                Next Meeting
              </h3>
              <p className="text-sm text-professional-gray-600 flex-1">
                Check with your coach for upcoming team meetings.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Team Members */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-professional-gray-900">
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
                   className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                   role="list"
            aria-label="Team members"
          >
            {teamMembers.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
              />
            ))}
          </div>
        )}
      </div>

      {/* Regions | Locations Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Member Regions Card */}
        <div className="bg-white rounded-lg shadow p-5 border border-professional-gray-200" data-testid="member-regions-card">
          <div className="flex items-center mb-3">
            <MapPin className="h-5 w-5 text-netsurit-red mr-2" aria-hidden="true" />
            <h3 className="text-sm font-bold text-professional-gray-900 uppercase tracking-wide">
              Regions
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {teamStats?.memberRegions && teamStats.memberRegions.length > 0 ? (
              teamStats.memberRegions.map((region, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-professional-gray-100 text-professional-gray-700 text-sm rounded-full"
                  data-testid={`region-${idx}`}
                >
                  {region}
                </span>
              ))
            ) : (
              <p className="text-sm text-professional-gray-500 italic">No regions</p>
            )}
          </div>
        </div>

        {/* Shared Interests Card */}
        <div className="bg-white rounded-lg shadow p-5 border border-professional-gray-200" data-testid="shared-interests-card">
          <div className="flex items-center mb-3">
            <Heart className="h-5 w-5 text-netsurit-coral mr-2" aria-hidden="true" />
            <h3 className="text-sm font-bold text-professional-gray-900 uppercase tracking-wide">
              Shared Interests
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {teamStats?.sharedInterests && teamStats.sharedInterests.length > 0 ? (
              teamStats.sharedInterests.map((interest, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-netsurit-red/10 text-netsurit-red text-sm rounded-full border border-netsurit-red/20"
                  data-testid={`interest-${idx}`}
                >
                  {interest}
                </span>
              ))
            ) : (
              <p className="text-sm text-professional-gray-500 italic">No shared interests</p>
            )}
          </div>
        </div>
      </div>

      {/* Recently Completed Dreams */}
      {teamStats?.recentlyCompletedDreams && teamStats.recentlyCompletedDreams.length > 0 && (
        <div className="bg-white rounded-lg shadow p-5 border border-professional-gray-200" data-testid="recently-completed-dreams-card">
          <div className="flex items-center mb-3">
            <Award className="h-5 w-5 text-netsurit-orange mr-2" aria-hidden="true" />
            <h3 className="text-sm font-bold text-professional-gray-900 uppercase tracking-wide">
              Recently Completed Dreams
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamStats.recentlyCompletedDreams.map((dream, idx) => (
              <div
                key={idx}
                className="p-4 bg-professional-gray-50 rounded-lg border border-professional-gray-200"
                data-testid={`completed-dream-${idx}`}
              >
                <p className="text-sm font-semibold text-professional-gray-900 mb-1">
                  {dream.title}
                </p>
                <p className="text-xs text-professional-gray-600">
                  {dream.memberName}
                </p>
                <span className="inline-block mt-2 px-2 py-0.5 bg-netsurit-orange/10 text-netsurit-orange text-xs rounded-full">
                  {dream.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


