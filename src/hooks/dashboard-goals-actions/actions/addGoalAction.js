import { getCurrentIsoWeek } from '../../../utils/dateUtils';
import currentWeekService from '../../../services/currentWeekService';
import { toast } from '../../../utils/toast';
import { buildGoalInstance, buildDreamGoal } from '../../../utils/goalInstanceBuilder';
import { logger } from '../../../utils/logger';

/**
 * Add new goal directly to currentWeek container
 * @param {Object} newGoal - New goal data from form
 * @param {Array} currentWeekGoals - Current week goals array
 * @param {Object} currentUser - Current user object
 * @param {Function} updateDream - Update dream function
 * @param {Function} loadCurrentWeekGoals - Reload goals function
 * @param {Function} setNewGoal - Reset form state
 * @param {Function} setShowAddGoal - Close add goal modal
 * @returns {Promise<void>}
 */
export async function addGoalAction(
  newGoal,
  currentWeekGoals,
  currentUser,
  updateDream,
  loadCurrentWeekGoals,
  setNewGoal,
  setShowAddGoal
) {
  if (!newGoal.title.trim()) return;
  if (newGoal.consistency === 'deadline' && !newGoal.targetDate) return;
  
  const dreamId = newGoal.dreamId || null;
  const selectedDream = currentUser?.dreamBook?.find(dream => dream.id === dreamId);
  const currentWeekIso = getCurrentIsoWeek();
  const goalId = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  logger.debug('addGoalAction', 'Adding goal to currentWeek container', {
    consistency: newGoal.consistency,
    dreamId: dreamId,
    selectedDream: selectedDream?.title,
    hasDream: !!selectedDream
  });
  
  try {
    // Create new goal instance for current week using centralized builder
    const newGoalInstance = buildGoalInstance({
      goalId,
      templateId: goalId,
      type: newGoal.consistency === 'deadline' ? 'deadline' : 'weekly_goal',
      title: newGoal.title,
      description: newGoal.description || '',
      dreamId,
      dreamTitle: selectedDream?.title || '',
      dreamCategory: selectedDream?.category || '',
      consistency: newGoal.consistency,
      targetWeeks: newGoal.targetWeeks,
      targetMonths: newGoal.targetMonths,
      targetDate: newGoal.targetDate,
      frequency: newGoal.frequency,
      weekId: currentWeekIso,
      currentWeekIso,
    });
    
    // Get existing goals from current week (if any)
    const existingGoals = currentWeekGoals || [];
    const updatedGoals = [...existingGoals, newGoalInstance];
    
    logger.debug('addGoalAction', 'Adding goal to currentWeek', { totalGoals: updatedGoals.length });
    
    // Save directly to currentWeek container
    const result = await currentWeekService.saveCurrentWeek(
      currentUser.id,
      currentWeekIso,
      updatedGoals
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to save goal');
    }
    
    logger.info('addGoalAction', 'Goal added to currentWeek successfully');
    
    // Also add goal to dream's goals array (so it shows in Dream view)
    if (dreamId && selectedDream) {
      const dreamGoal = buildDreamGoal({
        goalId,
        title: newGoal.title,
        type: newGoal.consistency === 'deadline' ? 'deadline' : 'consistency',
        recurrence: newGoal.consistency === 'deadline' ? undefined : newGoal.consistency,
        targetWeeks: newGoal.targetWeeks,
        targetMonths: newGoal.targetMonths,
        targetDate: newGoal.targetDate,
        frequency: newGoal.frequency,
        consistency: newGoal.consistency,
        currentWeekIso,
      });
      
      const updatedDream = {
        ...selectedDream,
        goals: [...(selectedDream.goals || []), dreamGoal]
      };
      
      logger.debug('addGoalAction', 'Updating dream with new goal', { dreamId });
      await updateDream(updatedDream);
      logger.info('addGoalAction', 'Dream updated with goal');
    }
    
    // Reload goals to refresh UI
    await loadCurrentWeekGoals();
    
    // Reset form
    setNewGoal({
      title: '',
      description: '',
      dreamId: '',
      consistency: 'weekly',
      targetWeeks: 12,
      targetMonths: 6,
      frequency: 1,
      targetDate: ''
    });
    setShowAddGoal(false);
  } catch (error) {
    logger.error('addGoalAction', 'Failed to add goal', error);
    toast.error(`Failed to add goal: ${error.message}`);
  }
}
