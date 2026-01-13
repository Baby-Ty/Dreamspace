import { getWeeksUntilDate } from '../../../utils/dateUtils';
import { logger } from '../../../utils/logger';

/**
 * Filter out skipped and expired goals from existing goals
 * 
 * @param {Array} goals - Existing goals to filter
 * @param {string} currentWeekIso - Current ISO week string
 * @returns {Array} Filtered goals
 */
export function filterExpiredGoals(goals, currentWeekIso) {
  return goals.filter(g => {
    if (g.skipped) return false;
    
    // Filter out deadline goals that have passed
    if (g.type === 'deadline' && g.targetDate) {
      const weeksRemaining = g.weeksRemaining !== undefined 
        ? g.weeksRemaining 
        : getWeeksUntilDate(g.targetDate, currentWeekIso);
      if (weeksRemaining < 0) {
        logger.debug('filterExpiredGoals', 'Filtering out past deadline goal', { title: g.title });
        return false;
      }
    }
    
    return true;
  });
}
