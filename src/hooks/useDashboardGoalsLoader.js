// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useCallback } from 'react';
import { getCurrentIsoWeek, getWeeksUntilDate, monthsToWeeks } from '../utils/dateUtils';
import currentWeekService from '../services/currentWeekService';
import { buildInstanceFromTemplate, buildInstanceFromDreamGoal } from '../utils/goalInstanceBuilder';
import { logger } from '../utils/logger';

/**
 * useDashboardGoalsLoader - Handles loading and auto-instantiation of goals
 * 
 * Extracted from useDashboardGoals to reduce complexity
 * Handles: loading from currentWeek, auto-instantiating templates and dream goals
 * 
 * @param {object} currentUser - Current user object
 * @param {array} weeklyGoals - Weekly goal templates from app context
 * @returns {object} Loading state and loader function
 */
export function useDashboardGoalsLoader(currentUser, weeklyGoals) {
  const [currentWeekGoals, setCurrentWeekGoals] = useState([]);
  const [isLoadingWeekGoals, setIsLoadingWeekGoals] = useState(true);

  /**
   * Load current week's goals from currentWeek container
   * Auto-instantiate templates that don't have instances yet
   */
  const loadCurrentWeekGoals = useCallback(async () => {
    if (!currentUser?.id) return;
    
    setIsLoadingWeekGoals(true);
    const currentWeekIso = getCurrentIsoWeek();
    
    try {
      logger.debug('useDashboardGoalsLoader', 'Loading current week goals', { weekId: currentWeekIso });
      const result = await currentWeekService.getCurrentWeek(currentUser.id);
      
      let existingGoals = [];
      if (result.success && result.data) {
        existingGoals = result.data.goals || [];
        logger.debug('useDashboardGoalsLoader', 'Loaded goals for current week', { count: existingGoals.length });
      } else {
        logger.debug('useDashboardGoalsLoader', 'No goals found for current week');
      }
      
      // Auto-instantiate templates and deadline goals that don't have instances for current week
      // IMPORTANT: Only create instances for dreams that still exist
      const existingDreamIds = new Set((currentUser?.dreamBook || []).map(d => d.id));
      
      const templates = (weeklyGoals || []).filter(g => 
        g.type === 'weekly_goal_template' && 
        g.active !== false &&
        g.dreamId && 
        existingDreamIds.has(g.dreamId) // Only templates for existing dreams
      );
      const existingGoalIds = new Set(existingGoals.map(g => g.id));
      const existingTemplateIds = new Set(existingGoals.map(g => g.templateId).filter(Boolean));
      
      // Also check for goals from dreams that should appear in current week
      // This handles cases where templates might not exist yet
      logger.debug('useDashboardGoalsLoader', 'Checking dreams for goals', {
        dreamsCount: currentUser?.dreamBook?.length || 0
      });
      currentUser?.dreamBook?.forEach(dream => {
        logger.debug('useDashboardGoalsLoader', 'Dream goals', {
          dreamTitle: dream.title,
          goalsCount: dream.goals?.length || 0
        });
      });
      
      const dreamGoals = (currentUser?.dreamBook || []).flatMap(dream => 
        (dream.goals || []).filter(goal => {
          if (goal.completed) {
            logger.debug('useDashboardGoalsLoader', 'Skipping completed goal', { title: goal.title });
            return false;
          }
          
          // Skip inactive goals
          if (goal.active === false) {
            logger.debug('useDashboardGoalsLoader', 'Skipping inactive goal', { title: goal.title });
            return false;
          }
          
          // Deadline goals: show if active and weeksRemaining >= 0
          // IMPORTANT: Check completed and active flags FIRST before recalculating weeksRemaining
          if (goal.type === 'deadline') {
            // If goal is already marked completed or inactive, skip it (don't recalculate)
            if (goal.completed || goal.active === false) {
              logger.debug('useDashboardGoalsLoader', 'Skipping deadline goal', {
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
            logger.debug('useDashboardGoalsLoader', `${active ? 'Including' : 'Skipping'} deadline goal`, {
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
              logger.debug('useDashboardGoalsLoader', 'Skipping expired consistency goal', {
                title: goal.title,
                weeksRemaining
              });
              return false;
            }
            
            logger.debug('useDashboardGoalsLoader', 'Including consistency goal', {
              title: goal.title,
              recurrence: goal.recurrence
            });
            return true;
          }
          
          logger.debug('useDashboardGoalsLoader', 'Skipping goal', {
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
      
      logger.debug('useDashboardGoalsLoader', 'Found goals from dreams to instantiate', { count: dreamGoals.length });
      
      const newInstances = [];
      
      // Process templates (only for existing dreams)
      for (const template of templates) {
        // Verify dream still exists before creating instance
        if (!existingDreamIds.has(template.dreamId)) {
          logger.warn('useDashboardGoalsLoader', 'Skipping template - dream no longer exists', {
            templateId: template.id,
            dreamId: template.dreamId
          });
          continue;
        }
        
        // Filter out inactive templates and templates with weeksRemaining <= 0
        if (template.active === false) {
          logger.debug('useDashboardGoalsLoader', 'Skipping inactive template', { title: template.title });
          continue;
        }
        
        const templateWeeksRemaining = template.weeksRemaining !== undefined 
          ? template.weeksRemaining 
          : (template.targetWeeks || (template.targetMonths ? monthsToWeeks(template.targetMonths) : undefined));
        
        if (templateWeeksRemaining !== undefined && templateWeeksRemaining < 0) {
          logger.debug('useDashboardGoalsLoader', 'Skipping expired template', {
            title: template.title,
            weeksRemaining: templateWeeksRemaining
          });
          continue;
        }
        
        // Check if instance already exists (by templateId or by id match)
        const hasInstance = existingTemplateIds.has(template.id) || existingGoalIds.has(template.id);
        
        if (!hasInstance) {
          // Create instance for current week using centralized builder
          const instance = buildInstanceFromTemplate(template, currentWeekIso);
          newInstances.push(instance);
          logger.debug('useDashboardGoalsLoader', 'Auto-creating instance from template', { title: template.title });
        }
      }
      
      // Process goals from dreams (deadline and consistency goals)
      // These are already filtered to only include existing dreams
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
              logger.debug('useDashboardGoalsLoader', 'Auto-creating deadline goal instance', {
                title: dreamGoal.title,
                weeksRemaining
              });
            } else {
              logger.debug('useDashboardGoalsLoader', 'Skipping deadline goal', {
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
            logger.debug('useDashboardGoalsLoader', 'Auto-creating consistency goal instance from dream', {
              title: dreamGoal.title
            });
          }
        }
      }
      
      // If we created new instances, save them to currentWeek container
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
          setCurrentWeekGoals(updatedGoals.filter(g => !g.skipped));
        } else {
          logger.error('useDashboardGoalsLoader', 'Failed to save new instances', { error: saveResult.error });
          setCurrentWeekGoals(existingGoals.filter(g => !g.skipped));
        }
      } else {
        // Filter out skipped goals and past deadline goals
        const filteredGoals = existingGoals.filter(g => {
          if (g.skipped) return false;
          
          // Filter out deadline goals that have passed
          if (g.type === 'deadline' && g.targetDate) {
            const weeksRemaining = g.weeksRemaining !== undefined 
              ? g.weeksRemaining 
              : getWeeksUntilDate(g.targetDate, currentWeekIso);
            if (weeksRemaining < 0) {
              logger.debug('useDashboardGoalsLoader', 'Filtering out past deadline goal', { title: g.title });
              return false;
            }
          }
          
          return true;
        });
        setCurrentWeekGoals(filteredGoals);
      }
    } catch (error) {
      logger.error('useDashboardGoalsLoader', 'Error loading week goals', error);
      setCurrentWeekGoals([]);
    } finally {
      setIsLoadingWeekGoals(false);
    }
  }, [currentUser?.id, currentUser?.dreamBook, weeklyGoals]);

  return {
    currentWeekGoals,
    setCurrentWeekGoals,
    isLoadingWeekGoals,
    loadCurrentWeekGoals
  };
}

export default useDashboardGoalsLoader;
