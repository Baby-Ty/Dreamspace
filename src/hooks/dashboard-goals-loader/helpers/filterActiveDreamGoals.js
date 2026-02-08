import { getWeeksUntilDate, monthsToWeeks } from '../../../utils/dateUtils';
import { logger } from '../../../utils/logger';

/**
 * Filter active dream goals (deadline and consistency) that should appear in current week
 * 
 * @param {Object} currentUser - Current user object with dreamBook
 * @param {string} currentWeekIso - Current ISO week string
 * @param {Set} skippedTemplateIds - Set of template IDs that are skipped this week
 * @returns {Array} Filtered dream goals ready for instantiation
 */
export function filterActiveDreamGoals(currentUser, currentWeekIso, skippedTemplateIds = new Set()) {
  logger.debug('filterActiveDreamGoals', 'Checking dreams for goals', {
    dreamsCount: currentUser?.dreamBook?.length || 0
  });
  
  currentUser?.dreamBook?.forEach(dream => {
    logger.debug('filterActiveDreamGoals', 'Dream goals', {
      dreamTitle: dream.title,
      goalsCount: dream.goals?.length || 0
    });
  });
  
  const dreamGoals = (currentUser?.dreamBook || []).flatMap(dream => 
    (dream.goals || []).filter(goal => {
      // Skip goals that are already skipped this week (don't recreate skipped goals)
      if (skippedTemplateIds.has(goal.id)) {
        logger.debug('filterActiveDreamGoals', 'Skipping goal - already skipped this week', { title: goal.title });
        return false;
      }
      
      if (goal.completed) {
        logger.debug('filterActiveDreamGoals', 'Skipping completed goal', { title: goal.title });
        return false;
      }
      
      // Skip inactive goals
      if (goal.active === false) {
        logger.debug('filterActiveDreamGoals', 'Skipping inactive goal', { title: goal.title });
        return false;
      }
      
      // Deadline goals: show if active and weeksRemaining >= 0
      // IMPORTANT: Check completed and active flags FIRST before recalculating weeksRemaining
      if (goal.type === 'deadline') {
        // If goal is already marked completed or inactive, skip it (don't recalculate)
        if (goal.completed || goal.active === false) {
          logger.debug('filterActiveDreamGoals', 'Skipping deadline goal', {
            title: goal.title,
            reason: goal.completed ? 'completed' : 'inactive'
          });
          return false;
        }
        
        const weeksRemaining = goal.weeksRemaining !== undefined 
          ? goal.weeksRemaining 
          : (goal.targetWeeks !== undefined 
              ? goal.targetWeeks 
              : (goal.targetDate ? getWeeksUntilDate(goal.targetDate, currentWeekIso) : -1));
        const active = weeksRemaining >= 0;
        logger.debug('filterActiveDreamGoals', `${active ? 'Including' : 'Skipping'} deadline goal`, {
          title: goal.title,
          weeksRemaining
        });
        return active;
      }
      
      // Consistency goals: show if they're active and have recurrence and weeksRemaining > 0
      if (goal.type === 'consistency' && goal.recurrence && goal.active !== false) {
        const weeksRemaining = goal.weeksRemaining !== undefined 
          ? goal.weeksRemaining 
          : (goal.targetWeeks || (goal.targetMonths ? monthsToWeeks(goal.targetMonths) : undefined));
        
        if (weeksRemaining !== undefined && weeksRemaining < 0) {
          logger.debug('filterActiveDreamGoals', 'Skipping expired consistency goal', {
            title: goal.title,
            weeksRemaining
          });
          return false;
        }
        
        logger.debug('filterActiveDreamGoals', 'Including consistency goal', {
          title: goal.title,
          recurrence: goal.recurrence
        });
        return true;
      }
      
      logger.debug('filterActiveDreamGoals', 'Skipping goal', {
        title: goal.title,
        type: goal.type,
        recurrence: goal.recurrence
      });
      return false;
    }).map(goal => ({
      ...goal,
      dreamId: dream.id,
      dreamTitle: dream.title,
      dreamCategory: dream.category
    }))
  );
  
  logger.debug('filterActiveDreamGoals', 'Found goals from dreams to instantiate', { count: dreamGoals.length });
  
  return dreamGoals;
}
