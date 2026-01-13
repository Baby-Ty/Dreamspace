// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useEffect } from 'react';
import { useDashboardGoalsLoader } from './useDashboardGoalsLoader';
import { useDashboardGoalsActions } from './useDashboardGoalsActions';

/**
 * useDashboardGoals - Orchestrates dashboard goal operations
 * 
 * Combines 2 specialized hooks:
 * - useDashboardGoalsLoader: Complex loading and auto-instantiation
 * - useDashboardGoalsActions: All action handlers (toggle, add, skip, etc.)
 * 
 * Refactored from 823 lines to ~80 lines by extracting specialized hooks
 * 
 * @param {object} appContext - App context with current user and operations
 * @param {array} weeklyGoals - Weekly goals from app context
 * @returns {object} Goal state and handlers
 */
export function useDashboardGoals(appContext, weeklyGoals) {
  const { 
    currentUser, 
    updateDream, 
    updateDeadlineGoalAndTemplate 
  } = appContext;

  // State for dreams update trigger
  const [dreamsUpdateTrigger, setDreamsUpdateTrigger] = useState(0);

  // Use specialized hooks
  const loaderHook = useDashboardGoalsLoader(currentUser, weeklyGoals);
  const {
    currentWeekGoals,
    setCurrentWeekGoals,
    isLoadingWeekGoals,
    loadCurrentWeekGoals
  } = loaderHook;

  const actionsHook = useDashboardGoalsActions(
    currentUser,
    currentWeekGoals,
    setCurrentWeekGoals,
    weeklyGoals,
    updateDream,
    updateDeadlineGoalAndTemplate,
    loadCurrentWeekGoals
  );
  const {
    showAddGoal,
    setShowAddGoal,
    newGoal,
    setNewGoal,
    handleToggleGoal,
    handleDecrementGoal,
    handleAddGoal,
    handleUpdateGoalBackground,
    handleSkipGoal
  } = actionsHook;

  // Load current week goals on mount
  useEffect(() => {
    loadCurrentWeekGoals();
  }, [loadCurrentWeekGoals]);

  /**
   * Listen for goals-updated events to refresh dashboard
   */
  useEffect(() => {
    const handleGoalsUpdated = () => {
      console.log('📢 Goals updated event received, reloading dashboard goals');
      loadCurrentWeekGoals();
    };

    const handleDreamsUpdated = () => {
      console.log('📢 Dreams updated event received, forcing dashboard re-render');
      setDreamsUpdateTrigger(prev => prev + 1);
    };

    window.addEventListener('goals-updated', handleGoalsUpdated);
    window.addEventListener('dreams-updated', handleDreamsUpdated);

    return () => {
      window.removeEventListener('goals-updated', handleGoalsUpdated);
      window.removeEventListener('dreams-updated', handleDreamsUpdated);
    };
  }, [loadCurrentWeekGoals]);

  // Return combined interface (maintains backward compatibility)
  return {
    // State
    currentWeekGoals,
    isLoadingWeekGoals,
    dreamsUpdateTrigger,
    showAddGoal,
    setShowAddGoal,
    newGoal,
    setNewGoal,

    // Handlers
    loadCurrentWeekGoals,
    handleToggleGoal,
    handleDecrementGoal,
    handleAddGoal,
    handleUpdateGoalBackground,
    handleSkipGoal
  };
}

export default useDashboardGoals;
