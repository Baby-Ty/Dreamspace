
import { useApp } from '../context/AppContext';
import { useDashboardStats } from './useDashboardStats';
import { useDashboardGoals } from './useDashboardGoals';

/**
 * Custom hook for Dashboard data management
 * 
 * Orchestrates 2 specialized hooks:
 * - useDashboardStats: Stats calculations and metrics
 * - useDashboardGoals: Goal loading, instantiation, and actions
 * 
 * Handles loading current week goals, stats calculation, and goal actions
 * 
 * Refactored from 934 lines to ~50 lines by extracting specialized hooks
 */
export function useDashboardData() {
  const appContext = useApp();
  const { currentUser, weeklyGoals } = appContext;

  // Use specialized hooks
  const goalsHook = useDashboardGoals(appContext, weeklyGoals);
  const {
    currentWeekGoals,
    isLoadingWeekGoals,
    dreamsUpdateTrigger,
    showAddGoal,
    setShowAddGoal,
    newGoal,
    setNewGoal,
    loadCurrentWeekGoals,
    handleToggleGoal,
    handleDecrementGoal,
    handleAddGoal,
    handleUpdateGoalBackground,
    handleSkipGoal
  } = goalsHook;

  const statsHook = useDashboardStats(currentUser, currentWeekGoals);
  const {
    getCurrentWeekRange,
    stats,
    weeklyProgress
  } = statsHook;

  // Return combined interface (maintains backward compatibility)
  return {
    // Loading state
    isLoadingWeekGoals,

    // Data
    currentWeekGoals,
    stats,
    weeklyProgress,

    // Form state
    showAddGoal,
    setShowAddGoal,
    newGoal,
    setNewGoal,

    // Actions
    handleToggleGoal,
    handleDecrementGoal,
    handleAddGoal,
    handleSkipGoal,
    handleUpdateGoalBackground,
    loadCurrentWeekGoals,

    // Helpers
    getCurrentWeekRange,

    // Force re-render trigger (not used directly by components)
    dreamsUpdateTrigger,
  };
}

export default useDashboardData;