// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import React from 'react';
import { 
  Users2, 
  Loader2, 
  AlertCircle, 
  RefreshCw
} from 'lucide-react';
import { useDreamTeam } from '../../hooks/useDreamTeam';
import { useTeamActions } from '../../hooks/useTeamActions';
import { useApp } from '../../context/AppContext';
import TeamHeader from './components/TeamHeader';
import TeamInfoCard from './components/TeamInfoCard';
import TeamMembersSection from './components/TeamMembersSection';
import RecentlyCompletedDreamsCard from './components/RecentlyCompletedDreamsCard';
import TeamModals from './components/TeamModals';

/**
 * Main layout for Dream Team page
 * Handles orchestration, modals, and state management
 */
export default function DreamTeamLayout() {
  const { currentUser } = useApp();
  const {
    teamData,
    teamMembers,
    teamStats,
    isCoach,
    isLoading,
    error,
    refreshData
  } = useDreamTeam();

  // Use team actions hook for all action handlers and state
  const {
    isEditingTeamInfo,
    isEditingTeamName,
    editedTeamName,
    setEditedTeamName,
    editedTeamInterests,
    setEditedTeamInterests,
    editedTeamRegions,
    setEditedTeamRegions,
    handleEditTeamInfo,
    handleSaveTeamInfo,
    handleCancelEdit,
    handleGenerateRandomTeamName,
    showAIBackgroundGenerator,
    handleOpenAIBackgroundGenerator,
    handleSelectAIBackground,
    handleCloseAIBackgroundGenerator,
    selectedDreamForCoachView,
    selectedMemberForCoachView,
    handleViewDreamInCoachMode,
    handleCloseDreamTrackerCoachView,
    handleUpdateDreamInCoachView
  } = useTeamActions({ teamData, teamStats, refreshData });


  // Early return for loading
  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16 py-3 sm:py-4">
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
      <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16 py-3 sm:py-4">
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
      <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16 py-3 sm:py-4">
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

  // Use stable teamId for meeting attendance (persists across coach changes)
  // Falls back to managerId for backwards compatibility with older team documents
  const teamId = teamData.teamId || teamData.managerId;
  
  if (!teamId) {
    console.error('❌ Cannot render meeting attendance: Missing teamId/managerId in teamData', teamData);
    // Don't render MeetingAttendanceCard if teamId is missing
  }

  return (
    <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16 py-6 sm:py-8 space-y-4">
      {/* Row 1: Title | KPIs */}
      <TeamHeader teamStats={teamStats} />

      {/* Row 2: Team Info + Meeting Attendance - Combined Sticky Note */}
      <TeamInfoCard
        teamData={teamData}
        teamMembers={teamMembers}
        teamStats={teamStats}
        isCoach={isCoach}
        teamId={teamId}
        isEditingTeamInfo={isEditingTeamInfo}
        isEditingTeamName={isEditingTeamName}
        editedTeamName={editedTeamName}
        setEditedTeamName={setEditedTeamName}
        editedTeamInterests={editedTeamInterests}
        setEditedTeamInterests={setEditedTeamInterests}
        editedTeamRegions={editedTeamRegions}
        setEditedTeamRegions={setEditedTeamRegions}
        onEditTeamInfo={handleEditTeamInfo}
        onSaveTeamInfo={handleSaveTeamInfo}
        onCancelEdit={handleCancelEdit}
        onGenerateRandomTeamName={handleGenerateRandomTeamName}
        onComplete={(data) => {
          console.log('Meeting attendance completed:', data);
          refreshData();
        }}
      />

      {/* Team Members */}
      <TeamMembersSection
        teamMembers={teamMembers}
        currentUserId={currentUser?.id}
        isCoach={isCoach}
        onGenerateBackground={handleOpenAIBackgroundGenerator}
        onViewDreamInCoachMode={handleViewDreamInCoachMode}
      />

      {/* Recently Completed Dreams */}
      <RecentlyCompletedDreamsCard 
        recentlyCompletedDreams={teamStats?.recentlyCompletedDreams}
      />

      {/* Modals */}
      <TeamModals
        showAIBackgroundGenerator={showAIBackgroundGenerator}
        onSelectAIBackground={handleSelectAIBackground}
        onCloseAIBackgroundGenerator={handleCloseAIBackgroundGenerator}
        selectedDreamForCoachView={selectedDreamForCoachView}
        selectedMemberForCoachView={selectedMemberForCoachView}
        isCoach={isCoach}
        onCloseDreamTrackerCoachView={handleCloseDreamTrackerCoachView}
        onUpdateDreamInCoachView={handleUpdateDreamInCoachView}
      />
    </div>
  );
}


