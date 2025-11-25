// ⚠️ DOD VIOLATION: This file is 478 lines (limit: 400)
// TODO: Split into useDashboardStats.js + useDashboardGoals.js (separate concerns)
// Target: Each hook < 300 lines

// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getCurrentIsoWeek, getWeeksUntilDate, isDeadlineActive, monthsToWeeks, dateToWeeks } from '../utils/dateUtils';
import currentWeekService from '../services/currentWeekService';

/**
 * Custom hook for Dashboard data management
 * Handles loading current week goals, stats calculation, and goal actions
 */
export function useDashboardData() {
  const { currentUser, updateDream, updateGoal, updateWeeklyGoal, updateDeadlineGoalAndTemplate, weeklyGoals } = useApp();
  
  // Note: We still need weeklyGoals to check for templates that need instantiation
  
  // State
  const [currentWeekGoals, setCurrentWeekGoals] = useState([]);
  const [isLoadingWeekGoals, setIsLoadingWeekGoals] = useState(true);
  const [dreamsUpdateTrigger, setDreamsUpdateTrigger] = useState(0); // Force re-render when dreams update
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    dreamId: '',
    consistency: 'weekly',
    targetWeeks: 12,
    targetMonths: 6,
    frequency: 1 // Default to 1 for weekly (will be 2 for monthly)
  });

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
            
            if (weeksRemaining !== undefined && weeksRemaining <= 0) {
              console.log(`   ⏭️ Skipping completed consistency goal: "${goal.title}" (weeksRemaining: ${weeksRemaining})`);
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
        
        // 🎯 Filter out inactive templates and templates with weeksRemaining <= 0
        if (template.active === false) {
          console.log(`⏭️ Skipping inactive template: "${template.title}"`);
          continue;
        }
        
        const templateWeeksRemaining = template.weeksRemaining !== undefined 
          ? template.weeksRemaining 
          : (template.targetWeeks || (template.targetMonths ? monthsToWeeks(template.targetMonths) : undefined));
        
        if (templateWeeksRemaining !== undefined && templateWeeksRemaining <= 0) {
          console.log(`⏭️ Skipping completed template: "${template.title}" (weeksRemaining: ${templateWeeksRemaining})`);
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
              : (template.recurrence === 'monthly' ? (template.frequency || 2) : undefined), // Copy frequency with defaults
            completionCount: 0, // Initialize completion count
            completionDates: [], // Initialize completion dates
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
                targetWeeks: dreamGoal.targetWeeks || weeksRemaining, // Use targetWeeks
                targetDate: dreamGoal.targetDate, // Keep for backward compatibility
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
                : (dreamGoal.recurrence === 'monthly' ? (dreamGoal.frequency || 2) : undefined), // Copy frequency with defaults
              completionCount: 0, // Initialize completion count
              completionDates: [], // Initialize completion dates
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
  }, [currentUser?.id, weeklyGoals]);

  /**
   * Toggle goal completion with optimistic updates
   */
  const handleToggleGoal = useCallback(async (goalId) => {
    const goal = currentWeekGoals.find(g => g.id === goalId);
    if (!goal) return;
    
    // Handle monthly goals differently (increment counter)
    if (goal.recurrence === 'monthly') {
      const currentWeekIso = getCurrentIsoWeek();
      
      // Optimistic update
      const optimisticGoals = currentWeekGoals.map(g => {
        if (g.id === goalId) {
          const newCount = Math.min((g.completionCount || 0) + 1, g.frequency || 1);
          return {
            ...g,
            completionCount: newCount,
            completed: newCount >= g.frequency,
            completionDates: [...(g.completionDates || []), new Date().toISOString()]
          };
        }
        return g;
      });
      setCurrentWeekGoals(optimisticGoals);
      
      // Persist to server
      try {
        const result = await currentWeekService.incrementMonthlyGoal(
          currentUser.id,
          currentWeekIso,
          goalId,
          currentWeekGoals
        );
        
        if (!result.success) {
          throw new Error(result.error);
        }
        console.log('✅ Monthly goal incremented:', goalId);
      } catch (error) {
        console.error('❌ Failed to increment monthly goal, reverting:', error);
        setCurrentWeekGoals(currentWeekGoals);
        alert('Failed to save goal. Please try again.');
      }
      return;
    }
    
    // Handle weekly goals with frequency (increment counter)
    if (goal.recurrence === 'weekly' && goal.frequency) {
      const currentWeekIso = getCurrentIsoWeek();
      
      // Optimistic update
      const optimisticGoals = currentWeekGoals.map(g => {
        if (g.id === goalId) {
          const newCount = Math.min((g.completionCount || 0) + 1, g.frequency || 1);
          return {
            ...g,
            completionCount: newCount,
            completed: newCount >= g.frequency,
            completionDates: [...(g.completionDates || []), new Date().toISOString()]
          };
        }
        return g;
      });
      setCurrentWeekGoals(optimisticGoals);
      
      // Persist to server
      try {
        const result = await currentWeekService.incrementWeeklyGoal(
          currentUser.id,
          currentWeekIso,
          goalId,
          currentWeekGoals
        );
        
        if (!result.success) {
          throw new Error(result.error);
        }
        console.log('✅ Weekly goal incremented:', goalId);
      } catch (error) {
        console.error('❌ Failed to increment weekly goal, reverting:', error);
        setCurrentWeekGoals(currentWeekGoals);
        alert('Failed to save goal. Please try again.');
      }
      return;
    }
    
    // Handle regular weekly goals (no frequency - simple boolean toggle)
    const currentWeekIso = getCurrentIsoWeek();
    
    // 1. OPTIMISTIC UPDATE: Update UI immediately for instant feedback
    const optimisticGoals = currentWeekGoals.map(g => 
      g.id === goalId 
        ? { 
            ...g, 
            completed: !g.completed, 
            completedAt: !g.completed ? new Date().toISOString() : null 
          }
        : g
    );
    setCurrentWeekGoals(optimisticGoals);
    
    // 2. PERSIST TO SERVER
    try {
      const result = await currentWeekService.toggleGoalCompletion(
        currentUser.id,
        currentWeekIso,
        goalId,
        currentWeekGoals
      );
      
      if (result.success) {
        console.log('✅ Goal toggled:', goalId);
        
        // 3. UPDATE PARENT GOAL IN DREAM (if this is a deadline goal)
        const toggledGoal = optimisticGoals.find(g => g.id === goalId);
        if (toggledGoal?.dreamId && toggledGoal.type === 'deadline') {
          console.log('📝 Updating parent goal in dream:', {
            dreamId: toggledGoal.dreamId,
            goalId: toggledGoal.templateId || goalId, // Use templateId to find parent
            completed: toggledGoal.completed
          });
          
          // Find the parent dream
          const parentDream = currentUser?.dreamBook?.find(d => d.id === toggledGoal.dreamId);
          if (parentDream) {
            // Find the parent goal (use templateId if available, otherwise use goalId)
            const parentGoalId = toggledGoal.templateId || goalId;
            const parentGoal = parentDream.goals?.find(g => g.id === parentGoalId);
            if (parentGoal) {
              // Update parent goal completion status to match current week goal
              const updatedParentGoal = {
                ...parentGoal,
                completed: toggledGoal.completed,
                active: toggledGoal.completed ? false : parentGoal.active, // Mark inactive when completed
                completedAt: toggledGoal.completed ? new Date().toISOString() : null,
                weeksRemaining: toggledGoal.completed ? -1 : (parentGoal.weeksRemaining !== undefined ? parentGoal.weeksRemaining : parentGoal.targetWeeks)
              };
              
              // Find the template if it exists (to prevent it from being generated in future weeks)
              const template = weeklyGoals?.find(t => 
                t.type === 'weekly_goal_template' && 
                (t.id === parentGoalId || t.goalId === parentGoalId)
              );
              
              const updatedTemplate = template ? {
                ...template,
                completed: toggledGoal.completed,
                active: toggledGoal.completed ? false : template.active, // Mark inactive when completed
                completedAt: toggledGoal.completed ? new Date().toISOString() : null
              } : null;
              
              // 🔒 ATOMIC UPDATE: Single write to prevent race condition!
              // Previously: two separate writes (updateGoal + updateWeeklyGoal)
              // Problem: Second write could overwrite first write's changes due to stale React state
              // Solution: One atomic write updates both dream goal AND template simultaneously
              await updateDeadlineGoalAndTemplate(
                toggledGoal.dreamId, 
                updatedParentGoal, 
                updatedTemplate
              );
              console.log('✅ Atomic update complete:', parentGoalId, toggledGoal.completed ? 'complete and inactive' : 'incomplete');
              
              // If completed, note that it won't appear in future weeks
              if (toggledGoal.completed) {
                console.log('🎉 Deadline goal completed early! Marked inactive - will not appear in future weeks.');
              }
            }
          }
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Failed to toggle goal, reverting:', error);
      // 4. REVERT ON ERROR
      setCurrentWeekGoals(currentWeekGoals);
      alert('Failed to save goal. Please try again.');
    }
  }, [currentWeekGoals, currentUser?.id, currentUser?.dreamBook, updateDeadlineGoalAndTemplate, weeklyGoals]);

  /**
   * Decrement goal completion count (undo) with optimistic updates
   */
  const handleDecrementGoal = useCallback(async (goalId) => {
    const goal = currentWeekGoals.find(g => g.id === goalId);
    if (!goal) return;
    
    // Only allow decrement for goals with frequency (weekly/monthly with counter)
    if (!goal.recurrence || !goal.frequency) return;
    
    // Don't allow decrement if count is already 0
    const currentCount = goal.completionCount || 0;
    if (currentCount === 0) return;
    
    const currentWeekIso = getCurrentIsoWeek();
    
    // Optimistic update
    const optimisticGoals = currentWeekGoals.map(g => {
      if (g.id === goalId) {
        const newCount = Math.max(0, currentCount - 1);
        const isComplete = newCount >= g.frequency;
        
        // Remove the most recent completion date
        const completionDates = [...(g.completionDates || [])];
        if (completionDates.length > 0) {
          completionDates.pop();
        }
        
        return {
          ...g,
          completionCount: newCount,
          completed: isComplete,
          completionDates
        };
      }
      return g;
    });
    setCurrentWeekGoals(optimisticGoals);
    
    // Persist to server
    try {
      const result = goal.recurrence === 'monthly'
        ? await currentWeekService.decrementMonthlyGoal(
            currentUser.id,
            currentWeekIso,
            goalId,
            currentWeekGoals
          )
        : await currentWeekService.decrementWeeklyGoal(
            currentUser.id,
            currentWeekIso,
            goalId,
            currentWeekGoals
          );
      
      if (!result.success) {
        throw new Error(result.error);
      }
      console.log('✅ Goal decremented:', goalId);
    } catch (error) {
      console.error('❌ Failed to decrement goal, reverting:', error);
      setCurrentWeekGoals(currentWeekGoals);
      alert('Failed to undo goal. Please try again.');
    }
  }, [currentWeekGoals, currentUser?.id]);

  /**
   * Add new goal directly to currentWeek container (NEW SIMPLIFIED SYSTEM)
   */
  const handleAddGoal = useCallback(async (e) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return;
    
    const dreamId = newGoal.dreamId || null;
    const selectedDream = currentUser?.dreamBook?.find(dream => dream.id === dreamId);
    const currentWeekIso = getCurrentIsoWeek();
    const goalId = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('📝 Adding goal to currentWeek container:', {
      consistency: newGoal.consistency,
      dreamId: dreamId,
      selectedDream: selectedDream?.title,
      hasDream: !!selectedDream
    });
    
    try {
      // Create new goal instance for current week
      const newGoalInstance = {
        id: goalId,
        templateId: goalId, // Self-reference for now (will be proper template ID later)
        type: 'weekly_goal',
        title: newGoal.title,
        description: newGoal.description || '',
        dreamId: dreamId,
        dreamTitle: selectedDream?.title || '',
        dreamCategory: selectedDream?.category || '',
        recurrence: newGoal.consistency, // 'weekly' or 'monthly'
        targetWeeks: newGoal.consistency === 'weekly' 
          ? newGoal.targetWeeks 
          : (newGoal.consistency === 'monthly' ? monthsToWeeks(newGoal.targetMonths) : null),
        targetMonths: newGoal.consistency === 'monthly' ? newGoal.targetMonths : null,
        frequency: newGoal.consistency === 'monthly' 
          ? (newGoal.frequency || 2) 
          : (newGoal.consistency === 'weekly' ? (newGoal.frequency || 1) : null), // Monthly: default 2x/month, Weekly: default 1x/week
        completionCount: 0,
        completionDates: [],
        completed: false,
        completedAt: null,
        skipped: false,
        weeksRemaining: newGoal.consistency === 'weekly' 
          ? newGoal.targetWeeks 
          : (newGoal.consistency === 'monthly' ? monthsToWeeks(newGoal.targetMonths) : null),
        weekId: currentWeekIso,
        createdAt: new Date().toISOString()
      };
      
      // Get existing goals from current week (if any)
      const existingGoals = currentWeekGoals || [];
      const updatedGoals = [...existingGoals, newGoalInstance];
      
      console.log(`✨ Adding goal to currentWeek (total: ${updatedGoals.length})`);
      
      // Save directly to currentWeek container
      const result = await currentWeekService.saveCurrentWeek(
        currentUser.id,
        currentWeekIso,
        updatedGoals
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save goal');
      }
      
      console.log('✅ Goal added to currentWeek successfully');
      
      // Also add goal to dream's goals array (so it shows in Dream view)
      if (dreamId && selectedDream) {
        const dreamGoal = {
          id: goalId,
          title: newGoal.title,
          type: 'consistency',
          recurrence: newGoal.consistency,
          targetWeeks: newGoal.consistency === 'weekly' 
            ? newGoal.targetWeeks 
            : (newGoal.consistency === 'monthly' ? monthsToWeeks(newGoal.targetMonths) : undefined),
          targetMonths: newGoal.consistency === 'monthly' ? newGoal.targetMonths : undefined,
          frequency: newGoal.consistency === 'monthly' 
            ? (newGoal.frequency || 2) 
            : (newGoal.consistency === 'weekly' ? (newGoal.frequency || 1) : undefined),
          weeksRemaining: newGoal.consistency === 'weekly' 
            ? newGoal.targetWeeks 
            : (newGoal.consistency === 'monthly' ? monthsToWeeks(newGoal.targetMonths) : undefined),
          startDate: new Date().toISOString(),
          active: true,
          completed: false,
          createdAt: new Date().toISOString()
        };
        
        const updatedDream = {
          ...selectedDream,
          goals: [...(selectedDream.goals || []), dreamGoal]
        };
        
        console.log('📚 Updating dream with new goal:', dreamId);
        await updateDream(updatedDream);
        console.log('✅ Dream updated with goal');
      }
      
      // Reload goals to refresh UI
      await loadCurrentWeekGoals();
      
      // Reset form
      setNewGoal({
        title: '',
        description: '',
        dreamId: '',
        consistency: 'weekly',
        targetWeeks: 12,
        targetMonths: 6,
        frequency: 1 // Default to 1 for weekly, will be 2 for monthly
      });
      setShowAddGoal(false);
    } catch (error) {
      console.error('❌ Failed to add goal:', error);
      alert(`Failed to add goal: ${error.message}`);
    }
  }, [newGoal, currentUser?.dreamBook, currentUser?.id, currentWeekGoals, loadCurrentWeekGoals, updateDream]);

  /**
   * Update goal background image
   * @param {string} goalId - Goal ID to update
   * @param {string} backgroundImageUrl - URL of the background image
   */
  const handleUpdateGoalBackground = useCallback(async (goalId, backgroundImageUrl) => {
    if (!currentUser?.id) return { success: false, error: 'No user' };
    
    const currentWeekIso = getCurrentIsoWeek();
    
    // Optimistic update
    const optimisticGoals = currentWeekGoals.map(g => 
      g.id === goalId 
        ? { ...g, cardBackgroundImage: backgroundImageUrl }
        : g
    );
    setCurrentWeekGoals(optimisticGoals);
    
    try {
      const result = await currentWeekService.updateGoalBackground(
        currentUser.id,
        currentWeekIso,
        goalId,
        backgroundImageUrl,
        currentWeekGoals
      );
      
      if (result.success) {
        console.log('✅ Goal background updated:', goalId);
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Failed to update goal background, reverting:', error);
      // Revert on error
      setCurrentWeekGoals(currentWeekGoals);
      return { success: false, error: error.message };
    }
  }, [currentWeekGoals, currentUser?.id]);

  /**
   * Listen for goals-updated events to refresh dashboard
   */
  useEffect(() => {
    const handleGoalsUpdated = () => {
      console.log('📢 Goals updated event received, reloading dashboard goals');
      loadCurrentWeekGoals();
    };

    const handleDreamsUpdated = () => {
      console.log('📢 Dreams updated event received, forcing dashboard re-render');
      // Force a re-render by updating the trigger state
      setDreamsUpdateTrigger(prev => prev + 1);
    };

    window.addEventListener('goals-updated', handleGoalsUpdated);
    window.addEventListener('dreams-updated', handleDreamsUpdated);

    return () => {
      window.removeEventListener('goals-updated', handleGoalsUpdated);
      window.removeEventListener('dreams-updated', handleDreamsUpdated);
    };
  }, [loadCurrentWeekGoals]);

  /**
   * Auto-create current week instances from templates on mount
   * TEMPORARILY DISABLED - Using new currentWeek container system
   * TODO: Re-implement after AppContext is updated for new system
   */
  // useEffect(() => {
  //   if (!currentUser?.id) return;
  //   
  //   const currentWeekIso = getCurrentIsoWeek();
  //   const allTemplates = safeWeeklyGoals.filter(g => 
  //     g.type === 'weekly_goal_template'
  //   );
  //   
  //   // Get milestones for validation
  //   const milestones = currentUser?.dreamBook
  //     ?.flatMap(dream => dream.milestones || []) || [];
  //   
  //   // Filter valid templates for current week
  //   const validTemplates = allTemplates.filter(template => {
  //     const milestone = template.milestoneId 
  //       ? milestones.find(m => m.id === template.milestoneId)
  //       : null;
  //     return isTemplateActiveForWeek(template, currentWeekIso, milestone);
  //   });
  //   
  //   // Check each valid template and create instance if it doesn't exist
  //   validTemplates.forEach(template => {
  //     const instanceExists = safeWeeklyGoals.some(g => 
  //       g.templateId === template.id && g.weekId === currentWeekIso
  //     );
  //     
  //     if (!instanceExists) {
  //       // Create instance for current week
  //       const instance = {
  //         id: `${template.id}_${currentWeekIso}`,
  //         type: 'weekly_goal',
  //         templateId: template.id,
  //         goalType: template.goalType || 'consistency',
  //         title: template.title,
  //         description: template.description,
  //         dreamId: template.dreamId,
  //         dreamTitle: template.dreamTitle,
  //         dreamCategory: template.dreamCategory,
  //         milestoneId: template.milestoneId,
  //         recurrence: template.recurrence || 'weekly',
  //         targetWeeks: template.targetWeeks,
  //         targetMonths: template.targetMonths,
  //         weekId: currentWeekIso,
  //         completed: false,
  //         createdAt: new Date().toISOString()
  //       };
  //       addWeeklyGoal(instance);
  //     }
  //   });
  // }, [currentUser?.id, safeWeeklyGoals.length, addWeeklyGoal, currentUser?.dreamBook]);

  /**
   * Skip a goal for the current week
   */
  const handleSkipGoal = useCallback(async (goalId) => {
    const goal = currentWeekGoals.find(g => g.id === goalId);
    if (!goal || !goal.templateId) return;
    
    const confirmed = confirm(
      `Skip "${goal.title}" this week?\n\n` +
      `This goal will reappear next week. Your progress won't be affected.`
    );
    
    if (!confirmed) return;
    
    const currentWeekIso = getCurrentIsoWeek();
    
    try {
      const result = await currentWeekService.skipGoal(
        currentUser.id,
        currentWeekIso,
        goalId,
        currentWeekGoals
      );
      
      if (result.success) {
        // Remove skipped goal from display
        setCurrentWeekGoals(currentWeekGoals.filter(g => g.id !== goalId));
        console.log('✅ Goal skipped for this week:', goalId);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Failed to skip goal:', error);
      alert('Failed to skip goal. Please try again.');
    }
  }, [currentWeekGoals, currentUser?.id]);

  // Load current week goals on mount
  useEffect(() => {
    loadCurrentWeekGoals();
  }, [loadCurrentWeekGoals]);

  return {
    // Loading state
    isLoadingWeekGoals,

    // Data
    currentWeekGoals,
    stats,
    weeklyProgress,

    // Form state
    showAddGoal,
    setShowAddGoal,
    newGoal,
    setNewGoal,

    // Actions
    handleToggleGoal,
    handleDecrementGoal,
    handleAddGoal,
    handleSkipGoal,
    handleUpdateGoalBackground,
    loadCurrentWeekGoals,

    // Helpers
    getCurrentWeekRange,

    // Force re-render trigger (not used directly by components)
    dreamsUpdateTrigger,
  };
}

