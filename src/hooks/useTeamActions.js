import { useState } from 'react';
import { coachingService } from '../services/coachingService';
import peopleService from '../services/peopleService';
import { generateRandomTeamName } from '../utils/teamNameGenerator';
import { showToast } from '../utils/toast';

/**
 * Custom hook for Dream Team action handlers
 * Manages team editing, AI background generation, and dream viewing
 * 
 * @param {Object} params - Configuration object
 * @param {Object} params.teamData - Current team data
 * @param {Object} params.teamStats - Team statistics
 * @param {Function} params.refreshData - Function to refresh team data
 * @returns {Object} Team action handlers and state
 */
export function useTeamActions({ teamData, teamStats, refreshData }) {
  // Team info editing state
  const [isEditingTeamInfo, setIsEditingTeamInfo] = useState(false);
  const [editedTeamInterests, setEditedTeamInterests] = useState('');
  const [editedTeamRegions, setEditedTeamRegions] = useState('');
  const [isEditingTeamName, setIsEditingTeamName] = useState(false);
  const [editedTeamName, setEditedTeamName] = useState('');

  // AI Background Generator state
  const [showAIBackgroundGenerator, setShowAIBackgroundGenerator] = useState(false);
  const [selectedMemberForBackground, setSelectedMemberForBackground] = useState(null);

  // Dream Tracker Coach View state
  const [selectedDreamForCoachView, setSelectedDreamForCoachView] = useState(null);
  const [selectedMemberForCoachView, setSelectedMemberForCoachView] = useState(null);
  const [dreamWasModified, setDreamWasModified] = useState(false);

  // Team info editing handlers
  const handleEditTeamInfo = () => {
    setEditedTeamName(teamData.teamName || 'Dream Team');
    // Use computed values from teamStats, or fallback to saved values, or empty string
    const interests = teamData.teamInterests || (teamStats?.sharedInterests?.join(', ') || '');
    const regions = teamData.teamRegions || (teamStats?.memberRegions?.join(', ') || '');
    setEditedTeamInterests(interests);
    setEditedTeamRegions(regions);
    setIsEditingTeamName(true);
    setIsEditingTeamInfo(true);
  };

  const handleSaveTeamInfo = async () => {
    const managerId = teamData?.managerId;
    if (!managerId) {
      console.error('❌ Cannot save team info: No manager ID');
      return;
    }

    if (!editedTeamName.trim()) {
      showToast('Team name cannot be empty', 'error');
      return;
    }

    try {
      // Save team name
      const teamNameResult = await coachingService.updateTeamName(managerId, editedTeamName.trim());
      
      // Save team interests and regions
      const teamInfoResult = await coachingService.updateTeamInfo(managerId, {
        teamInterests: editedTeamInterests.trim(),
        teamRegions: editedTeamRegions.trim()
      });

      if (teamNameResult.success && teamInfoResult.success) {
        setIsEditingTeamInfo(false);
        setIsEditingTeamName(false);
        showToast('Team information updated successfully', 'success');
        // Refresh team data to show updated info
        refreshData();
      } else {
        const errors = [];
        if (!teamNameResult.success) errors.push(`Team name: ${teamNameResult.error}`);
        if (!teamInfoResult.success) errors.push(`Team info: ${teamInfoResult.error}`);
        showToast(`Failed to save: ${errors.join(', ')}`, 'error');
      }
    } catch (error) {
      console.error('❌ Error saving team info:', error);
      showToast(`Error saving team information: ${error.message}`, 'error');
    }
  };

  const handleCancelEdit = () => {
    setIsEditingTeamInfo(false);
    setIsEditingTeamName(false);
    setEditedTeamInterests('');
    setEditedTeamRegions('');
    setEditedTeamName('');
  };

  const handleGenerateRandomTeamName = () => {
    setEditedTeamName(generateRandomTeamName());
  };

  // AI Background Generator handlers
  const handleOpenAIBackgroundGenerator = (member) => {
    setSelectedMemberForBackground(member);
    setShowAIBackgroundGenerator(true);
  };

  const handleSelectAIBackground = async (imageUrl) => {
    if (!selectedMemberForBackground) return;

    try {
      // First upload the image to blob storage (backend fetches from URL server-side to avoid CORS)
      const uploadResult = await peopleService.uploadUserBackgroundImageFromUrl(
        selectedMemberForBackground.id,
        imageUrl
      );

      if (!uploadResult.success) {
        showToast(`Failed to upload background: ${uploadResult.error}`, 'error');
        return;
      }

      // Then save the blob storage URL to the user profile
      const result = await peopleService.updateUserBackgroundImage(
        selectedMemberForBackground.id,
        uploadResult.data.url
      );

      if (result.success) {
        console.log('✅ Background image uploaded and saved successfully, refreshing team data...');
        showToast('Background image updated successfully', 'success');
        setShowAIBackgroundGenerator(false);
        setSelectedMemberForBackground(null);
        // Refresh team data to show new background (this will reload from database)
        refreshData();
      } else {
        showToast(`Failed to update background: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error updating background image:', error);
      showToast('Failed to update background image', 'error');
    }
  };

  const handleCloseAIBackgroundGenerator = () => {
    setShowAIBackgroundGenerator(false);
    setSelectedMemberForBackground(null);
  };

  // Dream Tracker Coach View handlers
  const handleViewDreamInCoachMode = (dream, member) => {
    setSelectedDreamForCoachView(dream);
    setSelectedMemberForCoachView(member);
    setDreamWasModified(false); // Reset modification flag
  };

  const handleCloseDreamTrackerCoachView = () => {
    // Only refresh if dream was actually modified during this session
    if (dreamWasModified) {
      console.log('🔄 Modal closing with changes, refreshing team data to get latest updates');
      refreshData();
    } else {
      console.log('✅ Modal closing without changes, no refresh needed');
    }
    
    setSelectedDreamForCoachView(null);
    setSelectedMemberForCoachView(null);
    setDreamWasModified(false);
  };

  const handleUpdateDreamInCoachView = async (updatedDream) => {
    // Mark that dream was modified so we refresh on close
    setDreamWasModified(true);
    console.log('🔄 Dream updated, will refresh on modal close');
  };

  return {
    // Team editing state
    isEditingTeamInfo,
    isEditingTeamName,
    editedTeamName,
    setEditedTeamName,
    editedTeamInterests,
    setEditedTeamInterests,
    editedTeamRegions,
    setEditedTeamRegions,
    
    // Team editing handlers
    handleEditTeamInfo,
    handleSaveTeamInfo,
    handleCancelEdit,
    handleGenerateRandomTeamName,
    
    // Background generation state
    showAIBackgroundGenerator,
    selectedMemberForBackground,
    
    // Background generation handlers
    handleOpenAIBackgroundGenerator,
    handleSelectAIBackground,
    handleCloseAIBackgroundGenerator,
    
    // Dream viewing state
    selectedDreamForCoachView,
    selectedMemberForCoachView,
    
    // Dream viewing handlers
    handleViewDreamInCoachMode,
    handleCloseDreamTrackerCoachView,
    handleUpdateDreamInCoachView
  };
}

export default useTeamActions;
