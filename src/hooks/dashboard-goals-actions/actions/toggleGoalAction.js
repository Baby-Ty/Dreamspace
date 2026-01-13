import {
  handleMonthlyGoalToggle,
  handleWeeklyFrequencyToggle,
  handleRegularGoalToggle
} from './helpers';

/**
 * Toggle goal completion - orchestrates different goal types
 * @param {string} goalId - Goal ID to toggle
 * @param {Array} currentWeekGoals - Current week goals array
 * @param {Function} setCurrentWeekGoals - Setter for goals
 * @param {string} userId - Current user ID
 * @param {Object} currentUser - Current user object
 * @param {Array} weeklyGoals - Weekly goal templates
 * @param {Function} updateDeadlineGoalAndTemplate - Atomic update function
 * @returns {Promise<void>}
 */
export async function toggleGoalAction(
  goalId,
  currentWeekGoals,
  setCurrentWeekGoals,
  userId,
  currentUser,
  weeklyGoals,
  updateDeadlineGoalAndTemplate
) {
  const goal = currentWeekGoals.find(g => g.id === goalId);
  if (!goal) return;
  
  // Handle monthly goals differently (increment counter)
  if (goal.recurrence === 'monthly') {
    await handleMonthlyGoalToggle(goal, goalId, currentWeekGoals, setCurrentWeekGoals, userId);
    return;
  }
  
  // Handle weekly goals with frequency (increment counter)
  if (goal.recurrence === 'weekly' && goal.frequency) {
    await handleWeeklyFrequencyToggle(goal, goalId, currentWeekGoals, setCurrentWeekGoals, userId);
    return;
  }
  
  // Handle regular weekly goals (no frequency - simple boolean toggle)
  await handleRegularGoalToggle(
    goal,
    goalId,
    currentWeekGoals,
    setCurrentWeekGoals,
    userId,
    currentUser,
    weeklyGoals,
    updateDeadlineGoalAndTemplate
  );
}
