// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useMemo, useCallback } from 'react';

/**
 * useDashboardStats - Calculates dashboard statistics and metrics
 * 
 * Extracted from useDashboardData to reduce complexity
 * Handles: user stats, weekly progress, week range formatting
 * 
 * @param {object} currentUser - Current user object
 * @param {array} currentWeekGoals - Goals for current week
 * @returns {object} Stats and computed values
 */
export function useDashboardStats(currentUser, currentWeekGoals) {
  /**
   * Get current week date range formatted
   */
  const getCurrentWeekRange = useCallback(() => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    };
    
    return `${formatDate(startOfWeek)} – ${formatDate(endOfWeek)}`;
  }, []);

  /**
   * Calculate user stats
   */
  const stats = useMemo(() => {
    if (!currentUser) {
      return {
        dreamsCreated: 0,
        connectsCompleted: 0,
        scorecardPoints: 0
      };
    }
    
    return {
      dreamsCreated: currentUser.dreamBook?.length || 0,
      connectsCompleted: currentUser.connects?.length || 0,
      scorecardPoints: currentUser.score || 0
    };
  }, [currentUser]);

  /**
   * Calculate weekly progress for current week
   */
  const weeklyProgress = useMemo(() => {
    if (currentWeekGoals.length === 0) return 0;
    const completed = currentWeekGoals.filter(goal => goal.completed).length;
    return Math.round((completed / currentWeekGoals.length) * 100);
  }, [currentWeekGoals]);

  return {
    getCurrentWeekRange,
    stats,
    weeklyProgress
  };
}

export default useDashboardStats;
