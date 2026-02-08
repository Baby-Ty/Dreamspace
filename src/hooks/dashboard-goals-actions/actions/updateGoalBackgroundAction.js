import { getCurrentIsoWeek } from '../../../utils/dateUtils';
import currentWeekService from '../../../services/currentWeekService';
import { logger } from '../../../utils/logger';

/**
 * Update goal background image
 * @param {string} goalId - Goal ID to update
 * @param {string} backgroundImageUrl - New background image URL
 * @param {Array} currentWeekGoals - Current week goals array
 * @param {Function} setCurrentWeekGoals - Setter for goals
 * @param {string} userId - Current user ID
 * @returns {Promise<Object>} Result object with success status
 */
export async function updateGoalBackgroundAction(
  goalId,
  backgroundImageUrl,
  currentWeekGoals,
  setCurrentWeekGoals,
  userId
) {
  if (!userId) return { success: false, error: 'No user' };
  
  const currentWeekIso = getCurrentIsoWeek();
  
  // Optimistic update
  const optimisticGoals = currentWeekGoals.map(g => 
    g.id === goalId 
      ? { ...g, cardBackgroundImage: backgroundImageUrl }
      : g
  );
  setCurrentWeekGoals(optimisticGoals);
  
  try {
    // Fetch the FULL goals array from database (including already-skipped goals)
    // to prevent losing previously skipped goals when we save
    const weekResult = await currentWeekService.getCurrentWeek(userId);
    const fullGoalsArray = weekResult.success && weekResult.data?.goals 
      ? weekResult.data.goals 
      : currentWeekGoals;
    
    const result = await currentWeekService.updateGoalBackground(
      userId,
      currentWeekIso,
      goalId,
      backgroundImageUrl,
      fullGoalsArray
    );
    
    if (result.success) {
      logger.debug('updateGoalBackgroundAction', 'Goal background updated', { goalId });
      return { success: true };
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    logger.error('updateGoalBackgroundAction', 'Failed to update goal background, reverting', error);
    setCurrentWeekGoals(currentWeekGoals);
    return { success: false, error: error.message };
  }
}
