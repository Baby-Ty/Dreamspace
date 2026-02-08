import { getCurrentIsoWeek } from '../../../../utils/dateUtils';
import currentWeekService from '../../../../services/currentWeekService';
import { logger } from '../../../../utils/logger';
import { toast } from '../../../../utils/toast';

/**
 * Handle toggling weekly goal with frequency (increment counter)
 * @param {Object} goal - Goal to toggle
 * @param {string} goalId - Goal ID
 * @param {Array} currentWeekGoals - Current week goals
 * @param {Function} setCurrentWeekGoals - Setter function
 * @param {string} userId - Current user ID
 * @returns {Promise<void>}
 */
export async function handleWeeklyFrequencyToggle(goal, goalId, currentWeekGoals, setCurrentWeekGoals, userId) {
  const currentWeekIso = getCurrentIsoWeek();
  
  // Optimistic update
  const optimisticGoals = currentWeekGoals.map(g => {
    if (g.id === goalId) {
      const newCount = Math.min((g.completionCount || 0) + 1, g.frequency || 1);
      return {
        ...g,
        completionCount: newCount,
        completed: newCount >= g.frequency,
        completionDates: [...(g.completionDates || []), new Date().toISOString()]
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
    
    const result = await currentWeekService.incrementWeeklyGoal(
      userId,
      currentWeekIso,
      goalId,
      fullGoalsArray
    );
    
    if (!result.success) {
      throw new Error(result.error);
    }
    logger.debug('handleWeeklyFrequencyToggle', 'Weekly goal incremented', { goalId });
  } catch (error) {
    logger.error('handleWeeklyFrequencyToggle', 'Failed to increment weekly goal, reverting', error);
    setCurrentWeekGoals(currentWeekGoals);
    toast.error('Failed to save goal. Please try again.');
  }
}
