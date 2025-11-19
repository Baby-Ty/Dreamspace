// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useEffect, useCallback } from 'react';
import { getRecentWeeks } from '../services/weekHistoryService';
import { logger } from '../utils/logger';

/**
 * Custom hook for managing past weeks data
 * @param {string} userId - User ID
 * @param {number} weeksCount - Number of past weeks to fetch (default: 24)
 * @returns {object} Past weeks data and state
 */
export function usePastWeeks(userId, weeksCount = 24) {
  const [isLoading, setIsLoading] = useState(false);
  const [weeks, setWeeks] = useState([]);
  const [error, setError] = useState(null);

  /**
   * Fetch past weeks data
   */
  const fetchPastWeeks = useCallback(async () => {
    if (!userId) {
      logger.warn('usePastWeeks', 'No userId provided');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.info('usePastWeeks', 'Fetching past weeks', { userId, weeksCount });

      const result = await getRecentWeeks(userId, weeksCount);

      if (!result.success) {
        logger.error('usePastWeeks', 'Failed to fetch past weeks', { error: result.error });
        setError(result.error);
        setWeeks([]);
        return;
      }

      // Ensure we have valid data
      const weeksData = result.data || [];
      
      console.log('📊 usePastWeeks: Raw data from API:', {
        dataLength: weeksData.length,
        sample: weeksData[0],
        allWeeks: weeksData
      });
      
      // Transform data to ensure consistent format
      const transformedWeeks = weeksData.map(week => {
        // Calculate score as percentage if needed
        // Score might be raw points or percentage - normalize to percentage
        let score = week.score || 0;
        
        // If score seems like raw points (e.g., > 100), convert to percentage
        // Assuming max possible score per week is around 30-50 points
        // If score > 100, it's likely a percentage already
        // If score < 100 and totalGoals > 0, calculate percentage
        if (score < 100 && week.totalGoals > 0) {
          // Calculate completion percentage instead
          score = Math.round((week.completedGoals / week.totalGoals) * 100);
        }
        
        const transformed = {
          weekId: week.weekId,
          weekStartDate: week.weekStartDate || week.weekEndDate || '', // Fallback to weekEndDate if startDate missing
          totalGoals: week.totalGoals || 0,
          completedGoals: week.completedGoals || 0,
          score: score,
        };
        
        console.log(`   Week ${week.weekId}:`, {
          totalGoals: transformed.totalGoals,
          completedGoals: transformed.completedGoals,
          score: transformed.score,
          weekStartDate: transformed.weekStartDate
        });
        
        return transformed;
      });

      console.log('✅ usePastWeeks: Transformed weeks:', {
        count: transformedWeeks.length,
        weeks: transformedWeeks
      });
      
      logger.info('usePastWeeks', 'Past weeks loaded', { count: transformedWeeks.length });
      setWeeks(transformedWeeks);

    } catch (err) {
      logger.error('usePastWeeks', 'Error fetching past weeks', { error: err.message });
      setError('Failed to load past weeks');
      setWeeks([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, weeksCount]);

  /**
   * Refresh past weeks data
   */
  const refresh = useCallback(() => {
    fetchPastWeeks();
  }, [fetchPastWeeks]);

  // Fetch on mount and when userId or weeksCount changes
  useEffect(() => {
    fetchPastWeeks();
  }, [fetchPastWeeks]);

  return {
    weeks,
    isLoading,
    error,
    refresh,
  };
}

export default usePastWeeks;

