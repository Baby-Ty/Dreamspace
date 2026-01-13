// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useApp } from '../context/AppContext';
import { useDreamTrackerState } from './useDreamTrackerState';
import { useDreamGoals } from './useDreamGoals';
import { useCoachNotes } from './useCoachNotes';

/**
 * Custom hook for Dream Tracker modal state management
 * 
 * Orchestrates 3 specialized hooks:
 * - useDreamTrackerState: Core state & content updates
 * - useDreamGoals: Goal CRUD operations
 * - useCoachNotes: Coach messaging
 * 
 * Handles all CRUD operations for dreams, goals, milestones, and notes
 * Supports coach viewing mode with read-only access and coach messaging
 * 
 * Refactored from 1013 lines to ~100 lines by extracting specialized hooks
 */
export function useDreamTracker(dream, onUpdate, isCoachViewing = false, teamMember = null) {
  const appContext = useApp();
  const { 
    currentUser, 
    addGoal, 
    updateGoal, 
    deleteGoal,
    weeklyGoals,
    updateWeeklyGoal,
    deleteWeeklyGoal
  } = appContext;

  // Coach mode: canEdit is false when coach is viewing (except for coach notes)
  const canEdit = !isCoachViewing;

  // Use specialized hooks
  const stateHook = useDreamTrackerState(dream, onUpdate, canEdit);
  const {
    localDream,
    setLocalDream,
    activeTab,
    setActiveTab,
    hasChanges,
    setHasChanges,
    handleProgressChange,
    toggleComplete,
    handlePrivacyChange,
    handleUpdateDescription,
    handleUpdateMotivation,
    handleUpdateApproach,
    handleUpdateTitle,
    handleSave,
    getCategoryIcon,
    getProgressColor,
    formatDate,
    coachNotes
  } = stateHook;

  const goalsHook = useDreamGoals(localDream, setLocalDream, setHasChanges, appContext, canEdit, weeklyGoals);
  const {
    dreamGoals,
    isAddingGoal,
    setIsAddingGoal,
    isSavingGoal,
    newGoalData,
    setNewGoalData,
    editingGoal,
    isSavingGoalEdit,
    goalEditData,
    setGoalEditData,
    handleAddGoal,
    toggleGoal,
    handleDeleteGoal,
    startEditingGoal,
    cancelEditingGoal,
    saveEditedGoal,
    completedGoals,
    totalGoals
  } = goalsHook;

  const notesHook = useCoachNotes(localDream, setLocalDream, setHasChanges, isCoachViewing, teamMember, currentUser, canEdit);
  const {
    newNote,
    setNewNote,
    addCoachMessage,
    addNote
  } = notesHook;

  // Return combined interface (maintains backward compatibility)
  return {
    // State
    activeTab,
    setActiveTab,
    localDream,
    hasChanges,
    newNote,
    setNewNote,
    isAddingGoal,
    setIsAddingGoal,
    isSavingGoal,
    newGoalData,
    setNewGoalData,
    editingGoal,
    isSavingGoalEdit,
    goalEditData,
    setGoalEditData,
    
    // Progress handlers
    handleProgressChange,
    toggleComplete,
    
    // Goal handlers
    handleAddGoal,
    toggleGoal,
    handleDeleteGoal,
    startEditingGoal,
    cancelEditingGoal,
    saveEditedGoal,
    
    // Note handlers
    addNote,
    
    // Coach message handlers
    addCoachMessage,
    
    // Save handler
    handleSave,
    
    // Privacy handler
    handlePrivacyChange,
    
    // What/Why/How handlers
    handleUpdateDescription,
    handleUpdateMotivation,
    handleUpdateApproach,
    handleUpdateTitle,
    
    // Helpers
    getCategoryIcon,
    getProgressColor,
    formatDate,
    
    // Calculated
    completedGoals,
    totalGoals,
    dreamGoals,
    
    // Coach mode
    canEdit,
    coachNotes,
  };
}

export default useDreamTracker;
