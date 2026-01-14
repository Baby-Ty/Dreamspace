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
 * 2. If mismatch detected, calls syncCurrentWeek which handles rollover
 * 3. Only runs once per session (via ref)
 * 4. Fails silently to not block user
 * 
 * NOTE: The syncCurrentWeek endpoint handles both:
 * - Full rollover (archives old week, creates new goals with decremented weeksRemaining)
 * - Same-week sync (creates missing instances for new templates)
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
        
        // 1. Get current week document to check if rollover needed
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
        logger.warn('useWeekRollover', 'Week mismatch detected! Triggering sync/rollover...', {
          currentWeekDoc: currentWeekDoc.weekId,
          actualWeek: actualWeekId
        });
        
        // Store old week info for event
        const oldWeekId = currentWeekDoc.weekId;
        const summary = {
          totalGoals: currentWeekDoc.goals?.length || 0,
          completedGoals: currentWeekDoc.goals?.filter(g => g.completed).length || 0,
          skippedGoals: currentWeekDoc.goals?.filter(g => g.skipped).length || 0,
          score: calculateScore(currentWeekDoc.goals || [])
        };
        
        // Show notification to user (console only, no UI blocking)
        console.log('🔄 New week detected! Updating your goals...');
        
        // 4. Call syncCurrentWeek - it handles everything:
        //    - Archives old week
        //    - Creates new goals with properly decremented weeksRemaining
        //    - Returns the new week data
        const syncResult = await currentWeekService.syncCurrentWeek(currentUser.id);
        
        if (!syncResult.success) {
          // If sync fails, try legacy archive approach
          logger.warn('useWeekRollover', 'syncCurrentWeek failed, trying legacy archive', {
            error: syncResult.error
          });
          
          // Fall back to just archiving (dashboard loader will create goals)
          const archiveResult = await currentWeekService.archiveWeek(
            currentUser.id,
            oldWeekId,
            summary
          );
          
          if (!archiveResult.success) {
            throw new Error(`Archive failed: ${archiveResult.error}`);
          }
        }
        
        logger.info('useWeekRollover', 'Rollover complete! Triggering dashboard refresh...');
        
        // Mark as checked before triggering refresh
        hasChecked.current = true;
        
        // Trigger dashboard refresh event (Dashboard will listen and refresh data)
        window.dispatchEvent(new CustomEvent('week-rolled-over', {
          detail: {
            fromWeek: oldWeekId,
            toWeek: actualWeekId,
            stats: summary
          }
        }));
        
        // Optional: Show success message
        console.log(`✅ Week rollover complete! Welcome to ${actualWeekId}`);
        console.log(`📊 Last week: ${summary.completedGoals}/${summary.totalGoals} goals completed (${summary.score} points)`);
        
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
