import { getWeeksUntilDate } from '../../../utils/dateUtils';
import { buildInstanceFromDreamGoal } from '../../../utils/goalInstanceBuilder';
import { logger } from '../../../utils/logger';

/**
 * Create goal instances from dream goals (deadline and consistency)
 * 
 * @param {Array} dreamGoals - Filtered active dream goals
 * @param {string} currentWeekIso - Current ISO week string
 * @param {Set} existingGoalIds - Set of existing goal IDs
 * @param {Set} existingTemplateIds - Set of template IDs that already have instances
 * @returns {Array} New goal instances
 */
export function createDreamGoalInstances(dreamGoals, currentWeekIso, existingGoalIds, existingTemplateIds) {
  const newInstances = [];
  
  for (const dreamGoal of dreamGoals) {
    const goalId = dreamGoal.id || dreamGoal.goalId;
    const hasInstance = existingGoalIds.has(goalId) || 
                       existingGoalIds.has(`${goalId}_${currentWeekIso}`) ||
                       existingTemplateIds.has(goalId);
    
    if (!hasInstance) {
      if (dreamGoal.type === 'deadline') {
        // Use targetWeeks if available, otherwise calculate from targetDate (backward compatibility)
        const weeksRemaining = dreamGoal.weeksRemaining !== undefined
          ? dreamGoal.weeksRemaining
          : (dreamGoal.targetWeeks !== undefined
              ? dreamGoal.targetWeeks
              : (dreamGoal.targetDate
                  ? getWeeksUntilDate(dreamGoal.targetDate, currentWeekIso)
                  : -1));
        
        // Only create instance if deadline is still active (not past deadline, not completed, and not inactive)
        // Check both completed and active flags to ensure completed goals don't get new instances
        if (weeksRemaining >= 0 && !dreamGoal.completed && dreamGoal.active !== false) {
          // Deadline goal instance using centralized builder
          const instance = buildInstanceFromDreamGoal(
            dreamGoal,
            dreamGoal.dreamId,
            dreamGoal.dreamTitle,
            dreamGoal.dreamCategory,
            currentWeekIso,
            currentWeekIso
          );
          newInstances.push(instance);
          logger.debug('createDreamGoalInstances', 'Auto-creating deadline goal instance', {
            title: dreamGoal.title,
            weeksRemaining
          });
        } else {
          logger.debug('createDreamGoalInstances', 'Skipping deadline goal', {
            title: dreamGoal.title,
            reason: weeksRemaining < 0 ? 'past deadline' : 'already completed'
          });
        }
      } else if (dreamGoal.type === 'consistency') {
        // Consistency goal instance using centralized builder
        const instance = buildInstanceFromDreamGoal(
          dreamGoal,
          dreamGoal.dreamId,
          dreamGoal.dreamTitle,
          dreamGoal.dreamCategory,
          currentWeekIso,
          currentWeekIso
        );
        newInstances.push(instance);
        logger.debug('createDreamGoalInstances', 'Auto-creating consistency goal instance from dream', {
          title: dreamGoal.title
        });
      }
    }
  }
  
  return newInstances;
}
