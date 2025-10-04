// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useState, lazy, Suspense } from 'react';
import { 
  Users2, 
  TrendingUp, 
  AlertCircle, 
  BarChart3,
  Search,
  Crown,
  UserPlus,
  X,
  ChevronRight
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import CoachList from './CoachList';
import TeamMetrics from './TeamMetrics';
import { usePeopleData } from '../../hooks/usePeopleData';
import peopleService from '../../services/peopleService';

// Lazy-load heavy modals with named chunks
const CoachDetailModal = lazy(() => import(/* webpackChunkName: "coach-detail-modal" */ '../../components/coach/CoachDetailModal'));
const ReportBuilderModal = lazy(() => import(/* webpackChunkName: "report-builder-modal" */ '../../components/ReportBuilderModal'));
const UnassignUserModal = lazy(() => import(/* webpackChunkName: "unassign-user-modal" */ '../../components/UnassignUserModal'));
const ReplaceCoachModal = lazy(() => import(/* webpackChunkName: "replace-coach-modal" */ '../../components/ReplaceCoachModal'));

/**
 * Main layout for People Dashboard
 * Handles filters, orchestration, and modals
 */
export default function PeopleDashboardLayout() {
  const {
    allUsers,
    coaches,
    unassignedUsers,
    displayedUsers,
    overallMetrics,
    teamRelationships,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    showAllUsers,
    setShowAllUsers,
    userSearchTerm,
    setUserSearchTerm,
    refreshData
  } = usePeopleData();

  // Modal state
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [selectedCoachToReplace, setSelectedCoachToReplace] = useState(null);
  const [showReplaceCoachModal, setShowReplaceCoachModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Coach selection handler
  const handleViewCoach = (coach) => {
    console.log('🔍 Viewing coach:', coach.name);
    setSelectedCoach(coach);
    setShowCoachModal(true);
  };

  // Unassign user handler
  const handleUnassignUser = (user, coachId) => {
    setSelectedTeamMember({ user, coachId });
    setShowUnassignModal(true);
  };

  // Replace coach handler
  const handleReplaceCoach = (coach) => {
    setSelectedCoachToReplace(coach);
    setShowReplaceCoachModal(true);
  };

  // Confirm unassign user
  const confirmUnassignUser = async (user, coachId) => {
    try {
      setActionLoading(true);
      const result = await peopleService.unassignUserFromTeam(user.id, coachId);
      
      if (result.success) {
        console.log(`✅ Successfully unassigned ${user.name}`);
        await refreshData();
        setShowUnassignModal(false);
        setSelectedTeamMember(null);
      } else {
        console.error('❌ Failed to unassign user:', result.error);
      }
    } catch (err) {
      console.error('❌ Error unassigning user:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm replace coach
  const confirmReplaceCoach = async (oldCoachId, newCoachId, teamName, demoteOption, assignToTeamId) => {
    try {
      setActionLoading(true);
      const result = await peopleService.replaceTeamCoach(
        oldCoachId, 
        newCoachId, 
        teamName, 
        demoteOption, 
        assignToTeamId
      );
      
      if (result.success) {
        console.log('✅ Successfully replaced coach');
        await refreshData();
        setShowReplaceCoachModal(false);
        setSelectedCoachToReplace(null);
      } else {
        console.error('❌ Failed to replace coach:', result.error);
      }
    } catch (err) {
      console.error('❌ Error replacing coach:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Early return for loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Early return for error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-professional-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-professional-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-6 py-2 rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Inline KPIs */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title and Description */}
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Users2 className="h-8 w-8 text-netsurit-red" />
              <h1 className="text-2xl sm:text-3xl font-bold text-professional-gray-900">
                People Dashboard
              </h1>
            </div>
            <p className="text-professional-gray-600">
              HR oversight of coaches, teams, and program engagement
            </p>
          </div>
          
          {/* KPI Metrics Inline */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-netsurit-red" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">
                Adoption
              </p>
              <p className="text-xl font-bold text-professional-gray-900">
                {overallMetrics.programAdoption}%
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <Crown className="h-6 w-6 text-netsurit-coral" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">
                Coaches
              </p>
              <p className="text-xl font-bold text-professional-gray-900">
                {overallMetrics.totalCoaches}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <UserPlus className="h-6 w-6 text-netsurit-orange" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">
                Unassigned
              </p>
              <p className="text-xl font-bold text-professional-gray-900">
                {overallMetrics.totalUnassigned}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="h-6 w-6 text-netsurit-warm-orange" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">
                Alerts
              </p>
              <p className="text-xl font-bold text-professional-gray-900">
                {overallMetrics.totalAlerts}
              </p>
            </div>
          </div>

          {/* Report Builder Button */}
          <div className="flex items-center">
            <button 
              onClick={() => setShowReportBuilder(true)}
              className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center"
              aria-label="Open report builder"
            >
              <BarChart3 className="w-4 h-4 mr-2" aria-hidden="true" />
              <span>Report Builder</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div className="px-4 sm:px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Coaches/Teams */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-professional-gray-200 p-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-professional-gray-900">Coaches & Teams</h2>
                <div className="flex-1">
                  <div className="relative">
                    <Search 
                      className="w-4 h-4 text-professional-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" 
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      placeholder="Search coaches or teams..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 text-sm"
                      aria-label="Search coaches or teams"
                    />
                  </div>
                </div>
              </div>
            </div>

            <CoachList 
              coaches={coaches}
              onSelect={handleViewCoach}
              onUnassignUser={handleUnassignUser}
              onReplaceCoach={handleReplaceCoach}
            />
          </div>

          {/* Right Panel: Users */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-professional-gray-200 p-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-professional-gray-900 flex-shrink-0">
                  {showAllUsers ? 'All Users' : 'Unassigned Users'}
                </h2>
                
                {/* Search Bar */}
                <div className="flex-1 max-w-xs">
                  <div className="relative">
                    <Search 
                      className="w-4 h-4 text-professional-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" 
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      placeholder={`Search ${showAllUsers ? 'all users' : 'unassigned users'}...`}
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 text-sm"
                      aria-label={`Search ${showAllUsers ? 'all users' : 'unassigned users'}`}
                    />
                    {userSearchTerm && (
                      <button
                        onClick={() => setUserSearchTerm('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-professional-gray-400 hover:text-netsurit-red transition-colors duration-200"
                        title="Clear search"
                        aria-label="Clear search"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setShowAllUsers(!showAllUsers)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 flex-shrink-0 ${
                    showAllUsers
                      ? 'bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white hover:from-netsurit-coral hover:to-netsurit-orange'
                      : 'bg-professional-gray-100 text-professional-gray-700 hover:bg-professional-gray-200'
                  }`}
                  aria-label={showAllUsers ? 'Show only unassigned users' : 'Show all users'}
                >
                  {showAllUsers ? 'Show Unassigned' : 'Show All Users'}
                </button>
              </div>
            </div>

            <div className="space-y-3" role="list" aria-label="User list">
              {displayedUsers.map((user) => (
                <div 
                  key={user.id}
                  className="text-sm text-professional-gray-600 p-3 bg-white border border-professional-gray-200 rounded-lg"
                  role="listitem"
                >
                  {user.name} - {user.office}
                </div>
              ))}

              {displayedUsers.length === 0 && (
                <div className="text-center py-12">
                  {userSearchTerm ? (
                    <>
                      <Search className="w-16 h-16 text-professional-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-professional-gray-900 mb-2">No users found</h3>
                      <p className="text-professional-gray-500">
                        No {showAllUsers ? 'users' : 'unassigned users'} match "{userSearchTerm}"
                      </p>
                      <button
                        onClick={() => setUserSearchTerm('')}
                        className="mt-3 text-sm text-netsurit-red hover:text-netsurit-coral transition-colors duration-200"
                      >
                        Clear search
                      </button>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-16 h-16 text-professional-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-professional-gray-900 mb-2">
                        {showAllUsers ? 'No users found' : 'All users assigned'}
                      </h3>
                      <p className="text-professional-gray-500">
                        {showAllUsers 
                          ? 'There are no users in the system' 
                          : 'Every user is either a coach or assigned to a team'
                        }
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* Lazy-loaded Modals with Suspense */}
      {showCoachModal && selectedCoach && (
        <Suspense fallback={<LoadingSpinner />}>
          <CoachDetailModal
            coach={selectedCoach}
            onClose={() => {
              setShowCoachModal(false);
              setSelectedCoach(null);
            }}
          />
        </Suspense>
      )}

      {showReportBuilder && (
        <Suspense fallback={<LoadingSpinner />}>
          <ReportBuilderModal
            isOpen={showReportBuilder}
            onClose={() => setShowReportBuilder(false)}
            allUsers={allUsers}
            teamRelationships={teamRelationships}
          />
        </Suspense>
      )}

      {showUnassignModal && selectedTeamMember && (
        <Suspense fallback={<LoadingSpinner />}>
          <UnassignUserModal
            user={selectedTeamMember.user}
            coachId={selectedTeamMember.coachId}
            coaches={coaches}
            onClose={() => {
              setShowUnassignModal(false);
              setSelectedTeamMember(null);
            }}
            onConfirm={() => confirmUnassignUser(selectedTeamMember.user, selectedTeamMember.coachId)}
          />
        </Suspense>
      )}

      {showReplaceCoachModal && selectedCoachToReplace && (
        <Suspense fallback={<LoadingSpinner />}>
          <ReplaceCoachModal
            coach={selectedCoachToReplace}
            availableReplacements={allUsers.filter(user => user.id !== selectedCoachToReplace.id)}
            coaches={coaches}
            onClose={() => {
              setShowReplaceCoachModal(false);
              setSelectedCoachToReplace(null);
            }}
            onConfirm={confirmReplaceCoach}
          />
        </Suspense>
      )}

      {actionLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
}

