import React, { useState } from 'react';
import { ShieldAlert, Users2, Loader2, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import PromptEditorSection from './PromptEditorSection';
import { usePeopleData } from '../../hooks/usePeopleData';
import { usePeopleActions } from '../../hooks/usePeopleActions';
import { useAuth } from '../../context/AuthContext';
import PeopleHeader from './components/PeopleHeader';
import CoachesPanel from './components/CoachesPanel';
import UsersPanel from './components/UsersPanel';
import PeopleModals from './components/PeopleModals';

/**
 * Main layout for People Dashboard
 * Handles filters, orchestration, and modals
 * REQUIRES: Admin role
 */
export default function PeopleDashboardLayout() {
  const { user, refreshUserRole } = useAuth();

  // All hooks must be called before any conditional returns (Rules of Hooks)
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
    userFilter,
    setUserFilter,
    userSearchTerm,
    setUserSearchTerm,
    refreshData
  } = usePeopleData();

  // View state
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'prompts'

  // Modal state
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [showReplaceCoachModal, setShowReplaceCoachModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Use people actions hook
  const {
    actionLoading,
    selectedUser,
    selectedTeamMember,
    selectedCoachToReplace,
    handleEditUser: handleEditUserAction,
    handlePromoteUser: handlePromoteUserAction,
    handleAssignUser: handleAssignUserAction,
    handleSaveUser,
    handleUnassignUser: handleUnassignUserAction,
    handleReplaceCoach: handleReplaceCoachAction,
    confirmPromoteUser,
    confirmAssignUser,
    confirmUnassignUser,
    confirmReplaceCoach,
    confirmDeactivateUser,
    confirmReactivateUser,
    confirmDeleteUser,
    clearSelectedUser,
    clearSelectedTeamMember,
    clearSelectedCoachToReplace
  } = usePeopleActions({ refreshData, user, refreshUserRole });

  // ACCESS CONTROL: Admin only
  // Use roles object as source of truth (not the derived role string)
  const isAdmin = user?.roles?.admin === true;
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-professional-gray-200 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-netsurit-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-netsurit-red" />
          </div>
          <h2 className="text-2xl font-bold text-professional-gray-900 mb-2">Access Denied</h2>
          <p className="text-professional-gray-600 mb-1">
            You need <span className="font-semibold text-netsurit-red">admin privileges</span> to access People Hub.
          </p>
          <p className="text-sm text-professional-gray-500 mt-4">
            Current role: <span className="font-medium">{user?.role || 'user'}</span>
          </p>
        </div>
      </div>
    );
  }

  // Coach selection handler (deprecated - now handled by CoachList toggle)
  const handleViewCoach = (coach) => {
    console.log('🔍 Coach expansion handled by CoachList component');
  };

  // Wrapper handlers that also manage modal state
  const handleUnassignUser = (userToUnassign, coachId) => {
    handleUnassignUserAction(userToUnassign, coachId);
    setShowUnassignModal(true);
  };

  const handleReplaceCoach = (coach) => {
    handleReplaceCoachAction(coach);
    setShowReplaceCoachModal(true);
  };

  const handleEditUser = (userToEdit) => {
    handleEditUserAction(userToEdit);
    setShowEditModal(true);
  };

  const handlePromoteUser = (userToPromote) => {
    handlePromoteUserAction(userToPromote);
    setShowPromoteModal(true);
  };

  const handleAssignUser = (userToAssign) => {
    handleAssignUserAction(userToAssign);
    setShowAssignModal(true);
  };

  // Deactivate/Reactivate/Delete handlers
  const handleDeactivateUser = async (userId) => {
    const success = await confirmDeactivateUser(userId);
    if (success) {
      setShowEditModal(false);
      clearSelectedUser();
    }
  };

  const handleReactivateUser = async (userId) => {
    await confirmReactivateUser(userId);
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (userId) => {
    const success = await confirmDeleteUser(userId);
    if (success) {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  // Wrapped confirm handlers that also close modals
  const handleConfirmPromoteUser = async (teamName) => {
    const success = await confirmPromoteUser(teamName);
    if (success) {
      setShowPromoteModal(false);
    }
  };

  const handleConfirmAssignUser = async (coachId) => {
    const success = await confirmAssignUser(coachId);
    if (success) {
      setShowAssignModal(false);
    }
  };

  const handleConfirmUnassignUser = async () => {
    if (selectedTeamMember) {
      const success = await confirmUnassignUser(selectedTeamMember.user, selectedTeamMember.coachId);
      if (success) {
        setShowUnassignModal(false);
      }
    }
  };

  const handleConfirmReplaceCoach = async (oldCoachId, newCoachId, teamName, demoteOption, assignToTeamId) => {
    const success = await confirmReplaceCoach(oldCoachId, newCoachId, teamName, demoteOption, assignToTeamId);
    if (success) {
      setShowReplaceCoachModal(false);
    }
  };

  const handleSaveUserWrapper = async (userData) => {
    const success = await handleSaveUser(userData);
    if (success) {
      setShowEditModal(false);
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
    <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16 py-4 sm:py-6 space-y-6">
      {/* Header with Inline KPIs */}
      <PeopleHeader
        overallMetrics={overallMetrics}
        currentView={currentView}
        onViewChange={() => setCurrentView(currentView === 'dashboard' ? 'prompts' : 'dashboard')}
        onReportBuilder={() => setShowReportBuilder(true)}
      />

      {/* Conditional Rendering: Dashboard or Prompts Editor */}
      {currentView === 'prompts' ? (
        <PromptEditorSection />
      ) : (
        <>
          {/* Two-Panel Layout */}
          <div className="pb-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Panel: Coaches/Teams */}
              <CoachesPanel
                coaches={coaches}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onViewCoach={handleViewCoach}
                onUnassignUser={handleUnassignUser}
                onReplaceCoach={handleReplaceCoach}
                onRefresh={refreshData}
              />

              {/* Right Panel: Users */}
              <UsersPanel
                displayedUsers={displayedUsers}
                userFilter={userFilter}
                onFilterChange={setUserFilter}
                userSearchTerm={userSearchTerm}
                onUserSearchChange={setUserSearchTerm}
                onEditUser={handleEditUser}
                onPromoteUser={handlePromoteUser}
                onAssignUser={handleAssignUser}
                onReactivateUser={handleReactivateUser}
                onDeleteUser={handleDeleteUser}
                currentUserId={user?.id}
              />
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <PeopleModals
        modals={{
          showReportBuilder,
          showUnassignModal,
          showReplaceCoachModal,
          showEditModal,
          showPromoteModal,
          showAssignModal
        }}
        selectedData={{
          user: selectedUser,
          teamMember: selectedTeamMember,
          coachToReplace: selectedCoachToReplace
        }}
        allUsers={allUsers}
        coaches={coaches}
        teamRelationships={teamRelationships}
        onClose={{
          reportBuilder: () => setShowReportBuilder(false),
          unassign: () => {
            setShowUnassignModal(false);
            clearSelectedTeamMember();
          },
          replaceCoach: () => {
            setShowReplaceCoachModal(false);
            clearSelectedCoachToReplace();
          },
          edit: () => {
            setShowEditModal(false);
            clearSelectedUser();
          },
          promote: () => {
            setShowPromoteModal(false);
            clearSelectedUser();
          },
          assign: () => {
            setShowAssignModal(false);
            clearSelectedUser();
          }
        }}
        onConfirm={{
          unassign: handleConfirmUnassignUser,
          replaceCoach: handleConfirmReplaceCoach,
          saveUser: handleSaveUserWrapper,
          promote: handleConfirmPromoteUser,
          assign: handleConfirmAssignUser
        }}
        onDeactivateUser={handleDeactivateUser}
        currentUserId={user?.id}
        actionLoading={actionLoading}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <DeleteConfirmationModal
          user={userToDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          isDeleting={actionLoading}
        />
      )}
    </div>
  );
}
