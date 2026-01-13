// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useCallback } from 'react';
import { getCurrentIsoWeek, getWeeksUntilDate, monthsToWeeks, dateToWeeks } from '../utils/dateUtils';
import currentWeekService from '../services/currentWeekService';

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
      console.log('📅 Dashboard: Loading current week goals for', currentWeekIso);
      const result = await currentWeekService.getCurrentWeek(currentUser.id);
      
      let existingGoals = [];
      if (result.success && result.data) {
        existingGoals = result.data.goals || [];
        console.log('✅ Dashboard: Loaded', existingGoals.length, 'goals for current week');
      } else {
        console.log('ℹ️ Dashboard: No goals found for current week');
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
      console.log('🔍 Dashboard: Checking dreams for goals...');
      console.log('   Dreams count:', currentUser?.dreamBook?.length || 0);
      currentUser?.dreamBook?.forEach(dream => {
        console.log(`   Dream: "${dream.title}" has ${dream.goals?.length || 0} goals`);
        dream.goals?.forEach(goal => {
          console.log(`      - "${goal.title}" (type: ${goal.type}, recurrence: ${goal.recurrence}, active: ${goal.active}, completed: ${goal.completed})`);
        });
      });
      
      const dreamGoals = (currentUser?.dreamBook || []).flatMap(dream => 
        (dream.goals || []).filter(goal => {
          if (goal.completed) {
            console.log(`   ⏭️  Skipping completed goal: "${goal.title}"`);
            return false;
          }
          
          // Skip inactive goals
          if (goal.active === false) {
            console.log(`   ⏭️  Skipping inactive goal: "${goal.title}"`);
            return false;
          }
          
          // Deadline goals: show if active and weeksRemaining >= 0
          // IMPORTANT: Check completed and active flags FIRST before recalculating weeksRemaining
          if (goal.type === 'deadline') {
            // If goal is already marked completed or inactive, skip it (don't recalculate)
            if (goal.completed || goal.active === false) {
              console.log(`   ⏭️ Skipping deadline goal "${goal.title}" - ${goal.completed ? 'completed' : 'inactive'}`);
              return false;
            }
            
            const weeksRemaining = goal.weeksRemaining !== undefined 
              ? goal.weeksRemaining 
              : (goal.targetWeeks !== undefined 
                  ? goal.targetWeeks 
                  : (goal.targetDate ? getWeeksUntilDate(goal.targetDate, currentWeekIso) : -1));
            const active = weeksRemaining >= 0;
            console.log(`   ${active ? '✅' : '❌'} Deadline goal: "${goal.title}" (${weeksRemaining} weeks remaining)`);
            return active;
          }
          
          // Consistency goals: show if they're active and have recurrence and weeksRemaining > 0
          if (goal.type === 'consistency' && goal.recurrence && goal.active !== false) {
            const weeksRemaining = goal.weeksRemaining !== undefined 
              ? goal.weeksRemaining 
              : (goal.targetWeeks || (goal.targetMonths ? monthsToWeeks(goal.targetMonths) : undefined));
            
            if (weeksRemaining !== undefined && weeksRemaining < 0) {
              console.log(`   ⏭️ Skipping expired consistency goal: "${goal.title}" (weeksRemaining: ${weeksRemaining})`);
              return false;
            }
            
            console.log(`   ✅ Consistency goal: "${goal.title}" (recurrence: ${goal.recurrence})`);
            return true;
          }
          
          console.log(`   ❌ Skipping goal: "${goal.title}" (type: ${goal.type}, recurrence: ${goal.recurrence})`);
          return false;
        }).map(goal => ({
          ...goal,
          dreamId: dream.id,
          dreamTitle: dream.title,
          dreamCategory: dream.category
        }))
      );
      
      console.log(`📋 Dashboard: Found ${dreamGoals.length} goals from dreams to instantiate`);
      
      const newInstances = [];
      
      // Process templates (only for existing dreams)
      for (const template of templates) {
        // Verify dream still exists before creating instance
        if (!existingDreamIds.has(template.dreamId)) {
          console.log(`⚠️ Skipping template ${template.id} - dream ${template.dreamId} no longer exists`);
          continue;
        }
        
        // Filter out inactive templates and templates with weeksRemaining <= 0
        if (template.active === false) {
          console.log(`⏭️ Skipping inactive template: "${template.title}"`);
          continue;
        }
        
        const templateWeeksRemaining = template.weeksRemaining !== undefined 
          ? template.weeksRemaining 
          : (template.targetWeeks || (template.targetMonths ? monthsToWeeks(template.targetMonths) : undefined));
        
        if (templateWeeksRemaining !== undefined && templateWeeksRemaining < 0) {
          console.log(`⏭️ Skipping expired template: "${template.title}" (weeksRemaining: ${templateWeeksRemaining})`);
          continue;
        }
        
        // Check if instance already exists (by templateId or by id match)
        const hasInstance = existingTemplateIds.has(template.id) || existingGoalIds.has(template.id);
        
        if (!hasInstance) {
          // Create instance for current week
          const instance = {
            id: `${template.id}_${currentWeekIso}`,
            templateId: template.id,
            type: 'weekly_goal',
            title: template.title,
            description: template.description || '',
            dreamId: template.dreamId,
            dreamTitle: template.dreamTitle,
            dreamCategory: template.dreamCategory,
            recurrence: template.recurrence || 'weekly',
            targetWeeks: template.targetWeeks || (template.targetMonths ? monthsToWeeks(template.targetMonths) : undefined),
            targetMonths: template.targetMonths,
            frequency: template.recurrence === 'weekly' 
              ? (template.frequency || 1) 
              : (template.recurrence === 'monthly' ? (template.frequency || 2) : undefined),
            completionCount: 0,
            completionDates: [],
            weeksRemaining: template.weeksRemaining !== undefined 
              ? template.weeksRemaining 
              : (template.targetWeeks || (template.targetMonths ? monthsToWeeks(template.targetMonths) : undefined)),
            completed: false,
            completedAt: null,
            skipped: false,
            weekId: currentWeekIso,
            createdAt: new Date().toISOString()
          };
          newInstances.push(instance);
          console.log('✨ Auto-creating instance from template:', template.title);
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
                      ? dateToWeeks(dreamGoal.targetDate, currentWeekIso)
                      : -1));
            
            // Only create instance if deadline is still active (not past deadline, not completed, and not inactive)
            // Check both completed and active flags to ensure completed goals don't get new instances
            if (weeksRemaining >= 0 && !dreamGoal.completed && dreamGoal.active !== false) {
              // Deadline goal instance
              const instance = {
                id: `${goalId}_${currentWeekIso}`,
                templateId: goalId,
                type: 'deadline',
                title: dreamGoal.title,
                description: dreamGoal.description || '',
                dreamId: dreamGoal.dreamId,
                dreamTitle: dreamGoal.dreamTitle,
                dreamCategory: dreamGoal.dreamCategory,
                targetWeeks: dreamGoal.targetWeeks || weeksRemaining,
                targetDate: dreamGoal.targetDate,
                weeksRemaining: weeksRemaining,
                completed: dreamGoal.completed || false,
                completedAt: dreamGoal.completedAt || null,
                skipped: false,
                weekId: currentWeekIso,
                createdAt: new Date().toISOString()
              };
              newInstances.push(instance);
              console.log(`✨ Auto-creating deadline goal instance: "${dreamGoal.title}" (${weeksRemaining} weeks remaining)`);
            } else {
              console.log(`⏭️ Skipping deadline goal "${dreamGoal.title}" (${weeksRemaining < 0 ? 'past deadline' : 'already completed'})`);
            }
          } else if (dreamGoal.type === 'consistency') {
            // Consistency goal instance (create even if no template exists)
            const instance = {
              id: `${goalId}_${currentWeekIso}`,
              templateId: goalId,
              type: 'weekly_goal',
              title: dreamGoal.title,
              description: dreamGoal.description || '',
              dreamId: dreamGoal.dreamId,
              dreamTitle: dreamGoal.dreamTitle,
              dreamCategory: dreamGoal.dreamCategory,
              recurrence: dreamGoal.recurrence || 'weekly',
              targetWeeks: dreamGoal.targetWeeks || (dreamGoal.targetMonths ? monthsToWeeks(dreamGoal.targetMonths) : undefined),
              targetMonths: dreamGoal.targetMonths,
              frequency: dreamGoal.recurrence === 'weekly' 
                ? (dreamGoal.frequency || 1) 
                : (dreamGoal.recurrence === 'monthly' ? (dreamGoal.frequency || 2) : undefined),
              completionCount: 0,
              completionDates: [],
              weeksRemaining: dreamGoal.weeksRemaining !== undefined 
                ? dreamGoal.weeksRemaining 
                : (dreamGoal.targetWeeks || (dreamGoal.targetMonths ? monthsToWeeks(dreamGoal.targetMonths) : undefined)),
              completed: dreamGoal.completed || false,
              completedAt: dreamGoal.completedAt || null,
              skipped: false,
              weekId: currentWeekIso,
              createdAt: new Date().toISOString()
            };
            newInstances.push(instance);
            console.log('✨ Auto-creating consistency goal instance from dream:', dreamGoal.title);
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
          console.log(`✅ Created ${newInstances.length} new goal instances for current week`);
          setCurrentWeekGoals(updatedGoals.filter(g => !g.skipped));
        } else {
          console.error('❌ Failed to save new instances:', saveResult.error);
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
              console.log(`⏭️ Filtering out past deadline goal: "${g.title}"`);
              return false;
            }
          }
          
          return true;
        });
        setCurrentWeekGoals(filteredGoals);
      }
    } catch (error) {
      console.error('❌ Dashboard: Error loading week goals:', error);
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
