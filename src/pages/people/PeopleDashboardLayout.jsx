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
  MapPin,
  Edit3,
  ArrowRight
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
const EditUserModal = lazy(() => import(/* webpackChunkName: "edit-user-modal" */ '../../components/EditUserModal'));
const PromoteUserModal = lazy(() => import(/* webpackChunkName: "promote-user-modal" */ '../../components/PromoteUserModal'));
const AssignUserModal = lazy(() => import(/* webpackChunkName: "assign-user-modal" */ '../../components/AssignUserModal'));

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
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
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

  // User action handlers
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handlePromoteUser = (user) => {
    setSelectedUser(user);
    setShowPromoteModal(true);
  };

  const handleAssignUser = (user) => {
    setSelectedUser(user);
    setShowAssignModal(true);
  };

  // Save user edits
  const handleSaveUser = async (userData) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/updateUserProfile/${selectedUser.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          region: userData.office
        })
      });

      if (response.ok) {
        console.log('✅ User profile updated successfully');
        await refreshData();
        setShowEditModal(false);
        setSelectedUser(null);
      } else {
        console.error('❌ Failed to update user profile');
        alert('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm promote user
  const confirmPromoteUser = async (teamName) => {
    try {
      setActionLoading(true);
      const result = await peopleService.promoteUserToCoach(selectedUser.id, teamName);
      
      if (result.success) {
        console.log(`✅ Successfully promoted ${selectedUser.name} to coach`);
        await refreshData();
        setShowPromoteModal(false);
        setSelectedUser(null);
      } else {
        console.error('❌ Failed to promote user:', result.error);
        alert('Failed to promote user. Please try again.');
      }
    } catch (err) {
      console.error('❌ Error promoting user:', err);
      alert('Error promoting user. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm assign user
  const confirmAssignUser = async (coachId) => {
    try {
      setActionLoading(true);
      const result = await peopleService.assignUserToCoach(selectedUser.id, coachId);
      
      if (result.success) {
        console.log(`✅ Successfully assigned ${selectedUser.name} to coach`);
        await refreshData();
        setShowAssignModal(false);
        setSelectedUser(null);
      } else {
        console.error('❌ Failed to assign user:', result.error);
        alert('Failed to assign user. Please try again.');
      }
    } catch (err) {
      console.error('❌ Error assigning user:', err);
      alert('Error assigning user. Please try again.');
    } finally {
      setActionLoading(false);
    }
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
                  className="bg-white border border-professional-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                  role="listitem"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-professional-gray-100"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=EC4B5C&color=fff&size=100`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-professional-gray-900 truncate">
                            {user.name}
                          </h4>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-1 text-professional-gray-400 hover:text-netsurit-red transition-colors duration-200"
                            title="Edit user"
                            aria-label={`Edit ${user.name}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-xs text-professional-gray-500 mt-0.5">
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {user.office}
                          </span>
                          <span>•</span>
                          <span>{user.score || 0}pts</span>
                          <span>•</span>
                          <span>{user.dreamsCount || 0} dreams</span>
                          <span>•</span>
                          <span>{user.connectsCount || 0} connects</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handlePromoteUser(user)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white text-xs font-medium rounded-md hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200 shadow-sm hover:shadow-md"
                        title="Promote to coach"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        Promote
                      </button>
                      <button
                        onClick={() => handleAssignUser(user)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-professional-gray-700 text-white text-xs font-medium rounded-md hover:bg-professional-gray-800 transition-all duration-200"
                        title="Assign to coach"
                      >
                        Assign to Coach
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
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

      {showEditModal && selectedUser && (
        <Suspense fallback={<LoadingSpinner />}>
          <EditUserModal
            user={selectedUser}
            coaches={coaches}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            onSave={handleSaveUser}
          />
        </Suspense>
      )}

      {showPromoteModal && selectedUser && (
        <Suspense fallback={<LoadingSpinner />}>
          <PromoteUserModal
            user={selectedUser}
            onClose={() => {
              setShowPromoteModal(false);
              setSelectedUser(null);
            }}
            onConfirm={confirmPromoteUser}
          />
        </Suspense>
      )}

      {showAssignModal && selectedUser && (
        <Suspense fallback={<LoadingSpinner />}>
          <AssignUserModal
            user={selectedUser}
            coaches={coaches}
            onClose={() => {
              setShowAssignModal(false);
              setSelectedUser(null);
            }}
            onConfirm={confirmAssignUser}
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

