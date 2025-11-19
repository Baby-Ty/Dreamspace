// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getCurrentIsoWeek } from '../utils/dateUtils';
import currentWeekService from '../services/currentWeekService';
import { logger } from '../utils/logger';

/**
 * Custom hook for week rollover check (FALLBACK)
 * Runs on user login to catch any missed server-side rollovers
 * 
 * IMPORTANT: This is a safety net. The primary rollover happens
 * via server-side timer (api/weeklyRollover/index.js).
 * 
 * This hook:
 * 1. Checks if currentWeek.weekId matches actual current week
 * 2. If mismatch detected, archives old week and reloads
 * 3. Only runs once per session (via ref)
 * 4. Fails silently to not block user
 */
export function useWeekRollover() {
  const { currentUser } = useApp();
  const hasChecked = useRef(false);
  
  useEffect(() => {
    // Only check once per session
    if (hasChecked.current || !currentUser?.id) {
      return;
    }
    
    async function checkWeekRollover() {
      try {
        logger.info('useWeekRollover', 'Checking if week rollover needed', { 
          userId: currentUser.id 
        });
        
        // 1. Get current week document
        const result = await currentWeekService.getCurrentWeek(currentUser.id);
        
        if (!result.success || !result.data) {
          logger.warn('useWeekRollover', 'No current week document found');
          hasChecked.current = true;
          return;
        }
        
        const currentWeekDoc = result.data;
        const actualWeekId = getCurrentIsoWeek();
        
        // 2. Check if rollover needed
        if (currentWeekDoc.weekId === actualWeekId) {
          logger.info('useWeekRollover', 'Week is current, no rollover needed', {
            weekId: actualWeekId
          });
          hasChecked.current = true;
          return;
        }
        
        // 3. WEEK MISMATCH - Rollover needed!
        logger.warn('useWeekRollover', 'Week mismatch detected! Triggering rollover...', {
          currentWeekDoc: currentWeekDoc.weekId,
          actualWeek: actualWeekId
        });
        
        // Show notification to user (console only, no UI blocking)
        console.log('🔄 New week detected! Updating your goals...');
        
        // 4. Calculate summary for archive
        const summary = {
          totalGoals: currentWeekDoc.goals?.length || 0,
          completedGoals: currentWeekDoc.goals?.filter(g => g.completed).length || 0,
          skippedGoals: currentWeekDoc.goals?.filter(g => g.skipped).length || 0,
          score: calculateScore(currentWeekDoc.goals || []),
          weekStartDate: currentWeekDoc.weekStartDate,
          weekEndDate: currentWeekDoc.weekEndDate
        };
        
        logger.info('useWeekRollover', 'Archiving old week', {
          weekId: currentWeekDoc.weekId,
          stats: summary
        });
        
        // 5. Archive old week
        const archiveResult = await currentWeekService.archiveWeek(
          currentUser.id,
          currentWeekDoc.weekId,
          summary
        );
        
        if (!archiveResult.success) {
          throw new Error(`Archive failed: ${archiveResult.error}`);
        }
        
        logger.info('useWeekRollover', 'Old week archived successfully', {
          weekId: currentWeekDoc.weekId
        });
        
        // 6. New week will be created by useDashboardData auto-instantiation
        // Just trigger a reload to let the Dashboard create fresh goals
        logger.info('useWeekRollover', 'Rollover complete! Reloading dashboard...');
        
        // Mark as checked before reload
        hasChecked.current = true;
        
        // Trigger dashboard reload event
        window.dispatchEvent(new CustomEvent('week-rolled-over', {
          detail: {
            fromWeek: currentWeekDoc.weekId,
            toWeek: actualWeekId,
            stats: summary
          }
        }));
        
        // Optional: Show success message
        console.log(`✅ Week rollover complete! Welcome to ${actualWeekId}`);
        console.log(`📊 Last week: ${summary.completedGoals}/${summary.totalGoals} goals completed (${summary.score} points)`);
        
        // Reload the current week goals
        // The Dashboard's useDashboardData will auto-instantiate new goals
        setTimeout(() => {
          window.location.reload();
        }, 500);
        
      } catch (error) {
        logger.error('useWeekRollover', 'Rollover check failed', { 
          error: error.message 
        });
        // Don't throw - this is a background check
        // User can still use the app even if check fails
        hasChecked.current = true;
      }
    }
    
    // Run check after a short delay (let other data load first)
    const timeoutId = setTimeout(() => {
      checkWeekRollover();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
    
  }, [currentUser?.id]);
  
  // This hook doesn't return anything - it's a side effect
}

/**
 * Calculate score from goals
 */
function calculateScore(goals) {
  return goals.reduce((total, goal) => {
    if (goal.completed) {
      // Weekly goals: 3 points
      // Monthly goals: 5 points
      // Deadline goals: 5 points
      return total + (goal.recurrence === 'monthly' ? 5 : goal.type === 'deadline' ? 5 : 3);
    }
    return total;
  }, 0);
}

export default useWeekRollover;

