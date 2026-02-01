import { useState } from 'react';
import peopleService from '../services/peopleService';
import userManagementService from '../services/userManagementService';
import { showToast } from '../utils/toast';
import { logger } from '../utils/logger';

/**
 * Custom hook for People Dashboard action handlers
 * Manages user and coach actions (edit, promote, assign, unassign, replace)
 * 
 * @param {Object} params - Configuration object
 * @param {Function} params.refreshData - Function to refresh people data
 * @param {Object} params.user - Current authenticated user
 * @param {Function} params.refreshUserRole - Function to refresh user role in AuthContext
 * @returns {Object} People action handlers and state
 */
export function usePeopleActions({ refreshData, user, refreshUserRole }) {
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);
  const [selectedCoachToReplace, setSelectedCoachToReplace] = useState(null);

  // User action handlers
  const handleEditUser = (userToEdit) => {
    setSelectedUser(userToEdit);
  };

  const handlePromoteUser = (userToPromote) => {
    setSelectedUser(userToPromote);
  };

  const handleAssignUser = (userToAssign) => {
    setSelectedUser(userToAssign);
  };

  // Coach action handlers
  const handleUnassignUser = (userToUnassign, coachId) => {
    setSelectedTeamMember({ user: userToUnassign, coachId });
  };

  const handleReplaceCoach = (coach) => {
    setSelectedCoachToReplace(coach);
  };

  // Save user edits
  const handleSaveUser = async (userData) => {
    try {
      setActionLoading(true);
      
      const dataToSend = {
        ...userData,
        region: userData.office
      };
      
      // Debug logging
      console.log('🔄 Saving user profile:', {
        userId: selectedUser.id,
        roles: dataToSend.roles,
        name: dataToSend.name
      });
      
      const result = await peopleService.updateUserProfile(selectedUser.id, dataToSend);

      if (result.success) {
        logger.info('people-dashboard', 'User profile updated successfully', { userId: selectedUser.id, roles: dataToSend.roles });
        showToast('Profile updated successfully', 'success');
        
        console.log('✅ Profile saved, refreshing data...');
        await refreshData();
        
        // If user edited their own profile, refresh their role in AuthContext
        if (selectedUser.id === user?.id) {
          console.log('🔄 User edited own profile, checking role changes...');
          
          // If they removed their own admin role, redirect to dashboard
          if (!dataToSend.roles.admin && user.roles?.admin === true) {
            console.log('⚠️ Admin role removed, redirecting to dashboard...');
            showToast('Your admin role has been removed', 'info');
            
            // Set flag with timestamp to prevent role refresh loops
            const timestamp = Date.now();
            sessionStorage.setItem('roleUpdateInProgress', timestamp.toString());
            
            // Wait for DB write to complete, then force full page reload to clear all state
            setTimeout(() => {
              console.log('🔄 Reloading page to apply role changes...');
              // Flag will be cleared on next page load after a delay
              window.location.replace('/'); // Use replace() to prevent back button issues
            }, 2000);
          } else {
            // For other role changes, wait for DB write then refresh
            console.log('🔄 Waiting for DB write to complete...');
            
            // Set flag to prevent role refresh loops
            sessionStorage.setItem('roleUpdateInProgress', 'true');
            
            setTimeout(async () => {
              console.log('🔄 Refreshing current user role...');
              await refreshUserRole();
              sessionStorage.removeItem('roleUpdateInProgress');
            }, 1500); // Increased delay to ensure DB write completes
          }
        }
        
        setSelectedUser(null);
        return true;
      } else {
        logger.error('people-dashboard', 'Failed to update user profile', { error: result.error, userId: selectedUser.id });
        showToast('Failed to update profile. Please try again.', 'error');
        return false;
      }
    } catch (error) {
      logger.error('people-dashboard', 'Error updating user profile', { error: error.message, userId: selectedUser.id });
      showToast('Error updating profile. Please try again.', 'error');
      return false;
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
        logger.info('people-dashboard', 'Successfully promoted user to coach', { userId: selectedUser.id, name: selectedUser.name });
        showToast(`Successfully promoted ${selectedUser.name} to coach`, 'success');
        await refreshData();
        setSelectedUser(null);
        return true;
      } else {
        logger.error('people-dashboard', 'Failed to promote user', { error: result.error, userId: selectedUser.id });
        showToast('Failed to promote user. Please try again.', 'error');
        return false;
      }
    } catch (err) {
      logger.error('people-dashboard', 'Error promoting user', { error: err.message, userId: selectedUser.id });
      showToast('Error promoting user. Please try again.', 'error');
      return false;
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
        logger.info('people-dashboard', 'Successfully assigned user to coach', { userId: selectedUser.id, name: selectedUser.name, coachId });
        showToast(`Successfully assigned ${selectedUser.name} to coach`, 'success');
        await refreshData();
        setSelectedUser(null);
        return true;
      } else {
        logger.error('people-dashboard', 'Failed to assign user', { error: result.error, userId: selectedUser.id });
        showToast('Failed to assign user. Please try again.', 'error');
        return false;
      }
    } catch (err) {
      logger.error('people-dashboard', 'Error assigning user', { error: err.message, userId: selectedUser.id });
      showToast('Error assigning user. Please try again.', 'error');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm unassign user
  const confirmUnassignUser = async (userToUnassign, coachId) => {
    try {
      setActionLoading(true);
      const result = await peopleService.unassignUserFromTeam(userToUnassign.id, coachId);
      
      if (result.success) {
        logger.info('people-dashboard', 'Successfully unassigned user', { userId: userToUnassign.id, name: userToUnassign.name, coachId });
        showToast(`Successfully unassigned ${userToUnassign.name}`, 'success');
        await refreshData();
        setSelectedTeamMember(null);
        return true;
      } else {
        logger.error('people-dashboard', 'Failed to unassign user', { error: result.error, userId: userToUnassign.id });
        showToast('Failed to unassign user. Please try again.', 'error');
        return false;
      }
    } catch (err) {
      logger.error('people-dashboard', 'Error unassigning user', { error: err.message, userId: userToUnassign.id });
      showToast('Error unassigning user. Please try again.', 'error');
      return false;
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
        if (demoteOption === 'disband-team') {
          logger.info('people-dashboard', 'Team disbanded successfully', { 
            oldCoachId, 
            disbandedTeam: result.data?.disbandedTeam 
          });
          showToast(`Team "${result.data?.disbandedTeam || 'team'}" has been disbanded. All members moved to unassigned.`, 'success');
        } else {
          logger.info('people-dashboard', 'Successfully replaced coach', { oldCoachId, newCoachId });
          showToast('Coach replaced successfully', 'success');
        }
        await refreshData();
        setSelectedCoachToReplace(null);
        return true;
      } else {
        logger.error('people-dashboard', 'Failed to replace/disband team', { error: result.error, oldCoachId });
        showToast(result.error || 'Failed to complete operation. Please try again.', 'error');
        return false;
      }
    } catch (err) {
      logger.error('people-dashboard', 'Error replacing/disbanding team', { error: err.message, oldCoachId });
      showToast('Error completing operation. Please try again.', 'error');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // Clear selected user
  const clearSelectedUser = () => {
    setSelectedUser(null);
  };

  // Clear selected team member
  const clearSelectedTeamMember = () => {
    setSelectedTeamMember(null);
  };

  // Clear selected coach to replace
  const clearSelectedCoachToReplace = () => {
    setSelectedCoachToReplace(null);
  };

  // Deactivate user
  const confirmDeactivateUser = async (userId) => {
    try {
      setActionLoading(true);
      const result = await userManagementService.deactivateUser(userId);
      
      if (result.success) {
        logger.info('people-dashboard', 'Successfully deactivated user', { userId });
        showToast('User deactivated successfully', 'success');
        await refreshData();
        return true;
      } else {
        logger.error('people-dashboard', 'Failed to deactivate user', { error: result.error, userId });
        showToast('Failed to deactivate user. Please try again.', 'error');
        return false;
      }
    } catch (err) {
      logger.error('people-dashboard', 'Error deactivating user', { error: err.message, userId });
      showToast('Error deactivating user. Please try again.', 'error');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // Reactivate user
  const confirmReactivateUser = async (userId) => {
    try {
      setActionLoading(true);
      const result = await userManagementService.reactivateUser(userId);
      
      if (result.success) {
        logger.info('people-dashboard', 'Successfully reactivated user', { userId });
        showToast('User reactivated successfully', 'success');
        await refreshData();
        return true;
      } else {
        logger.error('people-dashboard', 'Failed to reactivate user', { error: result.error, userId });
        showToast('Failed to reactivate user. Please try again.', 'error');
        return false;
      }
    } catch (err) {
      logger.error('people-dashboard', 'Error reactivating user', { error: err.message, userId });
      showToast('Error reactivating user. Please try again.', 'error');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // Delete user permanently
  const confirmDeleteUser = async (userId) => {
    try {
      setActionLoading(true);
      const result = await userManagementService.deleteUser(userId);
      
      if (result.success) {
        logger.info('people-dashboard', 'Successfully deleted user', { userId, deletedDocuments: result.data?.deletedDocuments?.length });
        showToast('User permanently deleted', 'success');
        await refreshData();
        return true;
      } else {
        logger.error('people-dashboard', 'Failed to delete user', { error: result.error, userId });
        // Check if it's a coach with team members error
        const errorMessage = result.error?.message || result.error || 'Failed to delete user';
        if (errorMessage.includes('coach with')) {
          showToast('Cannot delete: User is a coach with team members. Please replace the coach first.', 'error');
        } else {
          showToast(errorMessage, 'error');
        }
        return false;
      }
    } catch (err) {
      logger.error('people-dashboard', 'Error deleting user', { error: err.message, userId });
      showToast('Error deleting user. Please try again.', 'error');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    // State
    actionLoading,
    selectedUser,
    selectedTeamMember,
    selectedCoachToReplace,
    
    // User action handlers
    handleEditUser,
    handlePromoteUser,
    handleAssignUser,
    handleSaveUser,
    
    // Coach action handlers
    handleUnassignUser,
    handleReplaceCoach,
    
    // Confirm handlers
    confirmPromoteUser,
    confirmAssignUser,
    confirmUnassignUser,
    confirmReplaceCoach,
    confirmDeactivateUser,
    confirmReactivateUser,
    confirmDeleteUser,
    
    // Clear handlers
    clearSelectedUser,
    clearSelectedTeamMember,
    clearSelectedCoachToReplace
  };
}

export default usePeopleActions;
