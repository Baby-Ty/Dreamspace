import { getCurrentIsoWeek } from '../../../../utils/dateUtils';
import currentWeekService from '../../../../services/currentWeekService';
import { logger } from '../../../../utils/logger';
import { toast } from '../../../../utils/toast';
import { updateParentDeadlineGoal } from './updateParentDeadlineGoal';

/**
 * Handle toggling regular weekly goal (simple boolean toggle)
 * @param {Object} goal - Goal to toggle
 * @param {string} goalId - Goal ID
 * @param {Array} currentWeekGoals - Current week goals
 * @param {Function} setCurrentWeekGoals - Setter function
 * @param {string} userId - Current user ID
 * @param {Object} currentUser - Current user object
 * @param {Array} weeklyGoals - Weekly goal templates
 * @param {Function} updateDeadlineGoalAndTemplate - Atomic update function
 * @returns {Promise<void>}
 */
export async function handleRegularGoalToggle(
  goal, 
  goalId, 
  currentWeekGoals, 
  setCurrentWeekGoals, 
  userId,
  currentUser,
  weeklyGoals,
  updateDeadlineGoalAndTemplate
) {
  const currentWeekIso = getCurrentIsoWeek();
  
  // 1. OPTIMISTIC UPDATE: Update UI immediately for instant feedback
  const optimisticGoals = currentWeekGoals.map(g => 
    g.id === goalId 
      ? { 
          ...g, 
          completed: !g.completed, 
          completedAt: !g.completed ? new Date().toISOString() : null 
        }
      : g
  );
  setCurrentWeekGoals(optimisticGoals);
  
  // 2. PERSIST TO SERVER
  try {
    // Fetch the FULL goals array from database (including already-skipped goals)
    // to prevent losing previously skipped goals when we save
    const weekResult = await currentWeekService.getCurrentWeek(userId);
    const fullGoalsArray = weekResult.success && weekResult.data?.goals 
      ? weekResult.data.goals 
      : currentWeekGoals;
    
    const result = await currentWeekService.toggleGoalCompletion(
      userId,
      currentWeekIso,
      goalId,
      fullGoalsArray
    );
    
    if (result.success) {
      logger.debug('handleRegularGoalToggle', 'Goal toggled', { goalId });
      
      // 3. UPDATE PARENT GOAL IN DREAM (if this is a deadline goal)
      const toggledGoal = optimisticGoals.find(g => g.id === goalId);
      await updateParentDeadlineGoal(toggledGoal, currentUser, weeklyGoals, updateDeadlineGoalAndTemplate);
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    logger.error('handleRegularGoalToggle', 'Failed to toggle goal, reverting', error);
    setCurrentWeekGoals(currentWeekGoals);
    toast.error('Failed to save goal. Please try again.');
  }
}
