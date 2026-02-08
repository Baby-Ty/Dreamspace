
import { useState, useCallback } from 'react';
import { getCurrentIsoWeek } from '../../utils/dateUtils';
import currentWeekService from '../../services/currentWeekService';
import { logger } from '../../utils/logger';
import {
  filterActiveTemplates,
  filterActiveDreamGoals,
  createTemplateInstances,
  createDreamGoalInstances,
  filterExpiredGoals
} from './helpers';

/**
 * useDashboardGoalsLoader - Handles loading and auto-instantiation of goals
 * 
 * This loader tries to use the new syncCurrentWeek endpoint (backend-only instance creation),
 * but falls back to the legacy local creation pattern if the endpoint is unavailable.
 * 
 * Once syncCurrentWeek is deployed everywhere, the fallback can be removed.
 * 
 * @param {object} currentUser - Current user object
 * @param {array} weeklyGoals - Weekly goal templates from app context
 * @returns {object} Loading state and loader function
 */
export function useDashboardGoalsLoader(currentUser, weeklyGoals) {
  const [currentWeekGoals, setCurrentWeekGoals] = useState([]);
  const [isLoadingWeekGoals, setIsLoadingWeekGoals] = useState(true);

  /**
   * Load current week's goals - tries new sync endpoint, falls back to legacy
   */
  const loadCurrentWeekGoals = useCallback(async () => {
    if (!currentUser?.id) return;
    
    setIsLoadingWeekGoals(true);
    const currentWeekIso = getCurrentIsoWeek();
    
    try {
      logger.debug('useDashboardGoalsLoader', 'Loading current week goals', { weekId: currentWeekIso });
      
      // Try new sync endpoint first (backend-only instance creation)
      const syncResult = await currentWeekService.syncCurrentWeek(currentUser.id);
      
      if (syncResult.success && syncResult.data) {
        const goals = syncResult.data.goals || [];
        const weekId = syncResult.data.weekId || currentWeekIso;
        
        logger.debug('useDashboardGoalsLoader', 'Goals synced via new endpoint', { 
          count: goals.length,
          weekId
        });
        
        setCurrentWeekGoals(filterExpiredGoals(goals, weekId));
        return;
      }
      
      // Fallback: syncCurrentWeek not available - use legacy pattern
      logger.warn('useDashboardGoalsLoader', 'syncCurrentWeek unavailable, using legacy loader', {
        error: syncResult.error
      });
      
      // Load existing goals for current week (legacy)
      const result = await currentWeekService.getCurrentWeek(currentUser.id);
      let existingGoals = [];
      
      if (result.success && result.data) {
        existingGoals = result.data.goals || [];
        logger.debug('useDashboardGoalsLoader', 'Loaded goals for current week (legacy)', { count: existingGoals.length });
      } else {
        logger.debug('useDashboardGoalsLoader', 'No goals found for current week');
      }
      
      // Build sets for efficient lookup
      const existingDreamIds = new Set((currentUser?.dreamBook || []).map(d => d.id));
      const existingGoalIds = new Set(existingGoals.map(g => g.id));
      const existingTemplateIds = new Set(existingGoals.map(g => g.templateId).filter(Boolean));
      
      // Build set of skipped template IDs to prevent recreating skipped goals
      const skippedTemplateIds = new Set(
        existingGoals
          .filter(g => g.skipped === true && g.templateId)
          .map(g => g.templateId)
      );
      
      // Filter templates for existing dreams only
      const activeTemplates = (weeklyGoals || []).filter(g => 
        g.type === 'weekly_goal_template' && 
        g.active !== false &&
        g.dreamId && 
        existingDreamIds.has(g.dreamId)
      );
      
      // Step 1: Filter active templates that need instances
      const templatesToInstantiate = filterActiveTemplates(
        activeTemplates, 
        existingDreamIds, 
        existingTemplateIds, 
        existingGoalIds,
        skippedTemplateIds
      );
      
      // Step 2: Filter active dream goals (deadline and consistency)
      const dreamGoalsToInstantiate = filterActiveDreamGoals(currentUser, currentWeekIso, skippedTemplateIds);
      
      // Step 3: Create instances from templates
      const templateInstances = createTemplateInstances(templatesToInstantiate, currentWeekIso);
      
      // Step 4: Create instances from dream goals
      const dreamGoalInstances = createDreamGoalInstances(
        dreamGoalsToInstantiate, 
        currentWeekIso, 
        existingGoalIds, 
        existingTemplateIds
      );
      
      // Combine all new instances
      const newInstances = [...templateInstances, ...dreamGoalInstances];
      
      // Save new instances if any were created
      if (newInstances.length > 0) {
        const updatedGoals = [...existingGoals, ...newInstances];
        const saveResult = await currentWeekService.saveCurrentWeek(
          currentUser.id,
          currentWeekIso,
          updatedGoals
        );
        
        if (saveResult.success) {
          logger.info('useDashboardGoalsLoader', 'Created new goal instances for current week', {
            count: newInstances.length
          });
          setCurrentWeekGoals(filterExpiredGoals(updatedGoals, currentWeekIso));
        } else {
          logger.error('useDashboardGoalsLoader', 'Failed to save new instances', { error: saveResult.error });
          setCurrentWeekGoals(filterExpiredGoals(existingGoals, currentWeekIso));
        }
      } else {
        // No new instances - just filter expired goals
        setCurrentWeekGoals(filterExpiredGoals(existingGoals, currentWeekIso));
      }
    } catch (error) {
      logger.error('useDashboardGoalsLoader', 'Error loading week goals', error);
      setCurrentWeekGoals([]);
    } finally {
      setIsLoadingWeekGoals(false);
    }
  }, [currentUser?.id]); // Only depend on user ID - currentUser and weeklyGoals are read fresh from parameters

  return {
    currentWeekGoals,
    setCurrentWeekGoals,
    isLoadingWeekGoals,
    loadCurrentWeekGoals
  };
}

export default useDashboardGoalsLoader;