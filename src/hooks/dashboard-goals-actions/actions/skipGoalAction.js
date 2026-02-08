import { getCurrentIsoWeek } from '../../../utils/dateUtils';
import currentWeekService from '../../../services/currentWeekService';
import { toast } from '../../../utils/toast';
import { logger } from '../../../utils/logger';

/**
 * Skip a goal for the current week
 * @param {string} goalId - Goal ID to skip
 * @param {Array} currentWeekGoals - Current week goals array
 * @param {Function} setCurrentWeekGoals - Setter for goals
 * @param {string} userId - Current user ID
 * @returns {Promise<void>}
 */
export async function skipGoalAction(goalId, currentWeekGoals, setCurrentWeekGoals, userId) {
  const goal = currentWeekGoals.find(g => g.id === goalId);
  if (!goal || !goal.templateId) return;
  
  const confirmed = confirm(
    `Skip "${goal.title}" this week?\n\n` +
    `This goal will reappear next week. Your progress won't be affected.`
  );
  
  if (!confirmed) return;
  
  const currentWeekIso = getCurrentIsoWeek();
  
  try {
    // Fetch the FULL goals array from database (including already-skipped goals)
    // to prevent losing previously skipped goals when we save
    const weekResult = await currentWeekService.getCurrentWeek(userId);
    const fullGoalsArray = weekResult.success && weekResult.data?.goals 
      ? weekResult.data.goals 
      : currentWeekGoals;
    
    const result = await currentWeekService.skipGoal(
      userId,
      currentWeekIso,
      goalId,
      fullGoalsArray
    );
    
    if (result.success) {
      setCurrentWeekGoals(currentWeekGoals.filter(g => g.id !== goalId));
      logger.debug('skipGoalAction', 'Goal skipped for this week', { goalId });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    logger.error('skipGoalAction', 'Failed to skip goal', error);
    toast.error('Failed to skip goal. Please try again.');
  }
}
