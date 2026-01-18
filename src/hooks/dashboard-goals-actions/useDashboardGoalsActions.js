
import { useState, useCallback } from 'react';
import {
  toggleGoalAction,
  decrementGoalAction,
  addGoalAction,
  updateGoalBackgroundAction,
  skipGoalAction
} from './actions';

/**
 * useDashboardGoalsActions - Handles all goal manipulation actions
 * 
 * Extracted from useDashboardGoals to reduce complexity
 * Refactored into focused action modules for better maintainability
 * 
 * @param {object} currentUser - Current user object
 * @param {array} currentWeekGoals - Current week goals array
 * @param {function} setCurrentWeekGoals - Setter for current week goals
 * @param {array} weeklyGoals - Weekly goal templates
 * @param {function} updateDream - Update dream function from context
 * @param {function} updateDeadlineGoalAndTemplate - Atomic update function
 * @param {function} loadCurrentWeekGoals - Reload goals function
 * @returns {object} Action handlers and form state
 */
export function useDashboardGoalsActions(
  currentUser,
  currentWeekGoals,
  setCurrentWeekGoals,
  weeklyGoals,
  updateDream,
  updateDeadlineGoalAndTemplate,
  loadCurrentWeekGoals
) {
  // New goal form state
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    dreamId: '',
    consistency: 'weekly',
    targetWeeks: 12,
    targetMonths: 6,
    frequency: 1,
    targetDate: ''
  });

  /**
   * Toggle goal completion with optimistic updates
   */
  const handleToggleGoal = useCallback(async (goalId) => {
    await toggleGoalAction(
      goalId,
      currentWeekGoals,
      setCurrentWeekGoals,
      currentUser?.id,
      currentUser,
      weeklyGoals,
      updateDeadlineGoalAndTemplate
    );
  }, [currentWeekGoals, currentUser?.id, currentUser, weeklyGoals, updateDeadlineGoalAndTemplate]);

  /**
   * Decrement goal completion count (undo) with optimistic updates
   */
  const handleDecrementGoal = useCallback(async (goalId) => {
    await decrementGoalAction(
      goalId,
      currentWeekGoals,
      setCurrentWeekGoals,
      currentUser?.id
    );
  }, [currentWeekGoals, currentUser?.id]);

  /**
   * Add new goal directly to currentWeek container
   */
  const handleAddGoal = useCallback(async (e) => {
    e.preventDefault();
    await addGoalAction(
      newGoal,
      currentWeekGoals,
      currentUser,
      updateDream,
      loadCurrentWeekGoals,
      setNewGoal,
      setShowAddGoal
    );
  }, [newGoal, currentWeekGoals, currentUser, updateDream, loadCurrentWeekGoals]);

  /**
   * Update goal background image
   */
  const handleUpdateGoalBackground = useCallback(async (goalId, backgroundImageUrl) => {
    return await updateGoalBackgroundAction(
      goalId,
      backgroundImageUrl,
      currentWeekGoals,
      setCurrentWeekGoals,
      currentUser?.id
    );
  }, [currentWeekGoals, currentUser?.id]);

  /**
   * Skip a goal for the current week
   */
  const handleSkipGoal = useCallback(async (goalId) => {
    await skipGoalAction(
      goalId,
      currentWeekGoals,
      setCurrentWeekGoals,
      currentUser?.id
    );
  }, [currentWeekGoals, currentUser?.id]);

  return {
    // Form state
    showAddGoal,
    setShowAddGoal,
    newGoal,
    setNewGoal,

    // Handlers
    handleToggleGoal,
    handleDecrementGoal,
    handleAddGoal,
    handleUpdateGoalBackground,
    handleSkipGoal
  };
}

export default useDashboardGoalsActions;