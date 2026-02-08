import { getCurrentIsoWeek } from '../../../utils/dateUtils';
import currentWeekService from '../../../services/currentWeekService';
import { toast } from '../../../utils/toast';
import { logger } from '../../../utils/logger';

/**
 * Decrement goal completion count (undo)
 * @param {string} goalId - Goal ID to decrement
 * @param {Array} currentWeekGoals - Current week goals array
 * @param {Function} setCurrentWeekGoals - Setter for goals
 * @param {string} userId - Current user ID
 * @returns {Promise<void>}
 */
export async function decrementGoalAction(goalId, currentWeekGoals, setCurrentWeekGoals, userId) {
  const goal = currentWeekGoals.find(g => g.id === goalId);
  if (!goal) return;
  
  // Only allow decrement for goals with frequency (weekly/monthly with counter)
  if (!goal.recurrence || !goal.frequency) return;
  
  // Don't allow decrement if count is already 0
  const currentCount = goal.completionCount || 0;
  if (currentCount === 0) return;
  
  const currentWeekIso = getCurrentIsoWeek();
  
  // Optimistic update
  const optimisticGoals = currentWeekGoals.map(g => {
    if (g.id === goalId) {
      const newCount = Math.max(0, currentCount - 1);
      const isComplete = newCount >= g.frequency;
      
      // Remove the most recent completion date
      const completionDates = [...(g.completionDates || [])];
      if (completionDates.length > 0) {
        completionDates.pop();
      }
      
      return {
        ...g,
        completionCount: newCount,
        completed: isComplete,
        completionDates
      };
    }
    return g;
  });
  setCurrentWeekGoals(optimisticGoals);
  
  // Persist to server
  try {
    // Fetch the FULL goals array from database (including already-skipped goals)
    // to prevent losing previously skipped goals when we save
    const weekResult = await currentWeekService.getCurrentWeek(userId);
    const fullGoalsArray = weekResult.success && weekResult.data?.goals 
      ? weekResult.data.goals 
      : currentWeekGoals;
    
    const result = goal.recurrence === 'monthly'
      ? await currentWeekService.decrementMonthlyGoal(userId, currentWeekIso, goalId, fullGoalsArray)
      : await currentWeekService.decrementWeeklyGoal(userId, currentWeekIso, goalId, fullGoalsArray);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    logger.debug('decrementGoalAction', 'Goal decremented', { goalId });
  } catch (error) {
    logger.error('decrementGoalAction', 'Failed to decrement goal, reverting', error);
    setCurrentWeekGoals(currentWeekGoals);
    toast.error('Failed to undo goal. Please try again.');
  }
}
