// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useCallback } from 'react';
import { getCurrentIsoWeek } from '../utils/dateUtils';
import currentWeekService from '../services/currentWeekService';
import { toast } from '../utils/toast';
import { buildGoalInstance, buildDreamGoal } from '../utils/goalInstanceBuilder';
import { logger } from '../utils/logger';

/**
 * useDashboardGoalsActions - Handles all goal manipulation actions
 * 
 * Extracted from useDashboardGoals to reduce complexity
 * Handles: toggle, add, skip, decrement, update background
 * 
 * @param {object} currentUser - Current user object
 * @param {array} currentWeekGoals - Current week goals array
 * @param {function} setCurrentWeekGoals - Setter for current week goals
 * @param {array} weeklyGoals - Weekly goal templates
 * @param {function} updateDream - Update dream function from context
 * @param {function} updateDeadlineGoalAndTemplate - Atomic update function
 * @param {function} loadCurrentWeekGoals - Reload goals function
 * @returns {object} Action handlers and form state
 */
export function useDashboardGoalsActions(
  currentUser,
  currentWeekGoals,
  setCurrentWeekGoals,
  weeklyGoals,
  updateDream,
  updateDeadlineGoalAndTemplate,
  loadCurrentWeekGoals
) {
  // New goal form state
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    dreamId: '',
    consistency: 'weekly',
    targetWeeks: 12,
    targetMonths: 6,
    frequency: 1,
    targetDate: ''
  });

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
        logger.debug('useDashboardGoalsActions', 'Monthly goal incremented', { goalId });
      } catch (error) {
        logger.error('useDashboardGoalsActions', 'Failed to increment monthly goal, reverting', error);
        setCurrentWeekGoals(currentWeekGoals);
        toast.error('Failed to save goal. Please try again.');
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
        logger.debug('useDashboardGoalsActions', 'Weekly goal incremented', { goalId });
      } catch (error) {
        logger.error('useDashboardGoalsActions', 'Failed to increment weekly goal, reverting', error);
        setCurrentWeekGoals(currentWeekGoals);
        toast.error('Failed to save goal. Please try again.');
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
        logger.debug('useDashboardGoalsActions', 'Goal toggled', { goalId });
        
        // 3. UPDATE PARENT GOAL IN DREAM (if this is a deadline goal)
        const toggledGoal = optimisticGoals.find(g => g.id === goalId);
        if (toggledGoal?.dreamId && toggledGoal.type === 'deadline') {
          logger.debug('useDashboardGoalsActions', 'Updating parent goal in dream', {
            dreamId: toggledGoal.dreamId,
            goalId: toggledGoal.templateId || goalId,
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
                active: toggledGoal.completed ? false : parentGoal.active,
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
                active: toggledGoal.completed ? false : template.active,
                completedAt: toggledGoal.completed ? new Date().toISOString() : null
              } : null;
              
              // ATOMIC UPDATE: Single write to prevent race condition
              await updateDeadlineGoalAndTemplate(
                toggledGoal.dreamId, 
                updatedParentGoal, 
                updatedTemplate
              );
              logger.debug('useDashboardGoalsActions', 'Atomic update complete', {
                parentGoalId,
                status: toggledGoal.completed ? 'complete and inactive' : 'incomplete'
              });
              
              // If completed, note that it won't appear in future weeks
              if (toggledGoal.completed) {
                logger.info('useDashboardGoalsActions', 'Deadline goal completed early! Marked inactive - will not appear in future weeks');
              }
            }
          }
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      logger.error('useDashboardGoalsActions', 'Failed to toggle goal, reverting', error);
      setCurrentWeekGoals(currentWeekGoals);
      toast.error('Failed to save goal. Please try again.');
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
      logger.debug('useDashboardGoalsActions', 'Goal decremented', { goalId });
    } catch (error) {
      logger.error('useDashboardGoalsActions', 'Failed to decrement goal, reverting', error);
      setCurrentWeekGoals(currentWeekGoals);
      toast.error('Failed to undo goal. Please try again.');
    }
  }, [currentWeekGoals, currentUser?.id]);

  /**
   * Add new goal directly to currentWeek container
   */
  const handleAddGoal = useCallback(async (e) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return;
    if (newGoal.consistency === 'deadline' && !newGoal.targetDate) return;
    
    const dreamId = newGoal.dreamId || null;
    const selectedDream = currentUser?.dreamBook?.find(dream => dream.id === dreamId);
    const currentWeekIso = getCurrentIsoWeek();
    const goalId = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.debug('useDashboardGoalsActions', 'Adding goal to currentWeek container', {
      consistency: newGoal.consistency,
      dreamId: dreamId,
      selectedDream: selectedDream?.title,
      hasDream: !!selectedDream
    });
    
    try {
      // Create new goal instance for current week using centralized builder
      const newGoalInstance = buildGoalInstance({
        goalId,
        templateId: goalId,
        type: newGoal.consistency === 'deadline' ? 'deadline' : 'weekly_goal',
        title: newGoal.title,
        description: newGoal.description || '',
        dreamId,
        dreamTitle: selectedDream?.title || '',
        dreamCategory: selectedDream?.category || '',
        consistency: newGoal.consistency,
        targetWeeks: newGoal.targetWeeks,
        targetMonths: newGoal.targetMonths,
        targetDate: newGoal.targetDate,
        frequency: newGoal.frequency,
        weekId: currentWeekIso,
        currentWeekIso,
      });
      
      // Get existing goals from current week (if any)
      const existingGoals = currentWeekGoals || [];
      const updatedGoals = [...existingGoals, newGoalInstance];
      
      logger.debug('useDashboardGoalsActions', 'Adding goal to currentWeek', { totalGoals: updatedGoals.length });
      
      // Save directly to currentWeek container
      const result = await currentWeekService.saveCurrentWeek(
        currentUser.id,
        currentWeekIso,
        updatedGoals
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save goal');
      }
      
      logger.info('useDashboardGoalsActions', 'Goal added to currentWeek successfully');
      
      // Also add goal to dream's goals array (so it shows in Dream view)
      if (dreamId && selectedDream) {
        const dreamGoal = buildDreamGoal({
          goalId,
          title: newGoal.title,
          type: newGoal.consistency === 'deadline' ? 'deadline' : 'consistency',
          recurrence: newGoal.consistency === 'deadline' ? undefined : newGoal.consistency,
          targetWeeks: newGoal.targetWeeks,
          targetMonths: newGoal.targetMonths,
          targetDate: newGoal.targetDate,
          frequency: newGoal.frequency,
          consistency: newGoal.consistency,
          currentWeekIso,
        });
        
        const updatedDream = {
          ...selectedDream,
          goals: [...(selectedDream.goals || []), dreamGoal]
        };
        
        logger.debug('useDashboardGoalsActions', 'Updating dream with new goal', { dreamId });
        await updateDream(updatedDream);
        logger.info('useDashboardGoalsActions', 'Dream updated with goal');
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
        frequency: 1,
        targetDate: ''
      });
      setShowAddGoal(false);
    } catch (error) {
      logger.error('useDashboardGoalsActions', 'Failed to add goal', error);
      toast.error(`Failed to add goal: ${error.message}`);
    }
  }, [newGoal, currentUser?.dreamBook, currentUser?.id, currentWeekGoals, loadCurrentWeekGoals, updateDream]);

  /**
   * Update goal background image
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
        logger.debug('useDashboardGoalsActions', 'Goal background updated', { goalId });
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      logger.error('useDashboardGoalsActions', 'Failed to update goal background, reverting', error);
      setCurrentWeekGoals(currentWeekGoals);
      return { success: false, error: error.message };
    }
  }, [currentWeekGoals, currentUser?.id]);

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
        setCurrentWeekGoals(currentWeekGoals.filter(g => g.id !== goalId));
        logger.debug('useDashboardGoalsActions', 'Goal skipped for this week', { goalId });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      logger.error('useDashboardGoalsActions', 'Failed to skip goal', error);
      toast.error('Failed to skip goal. Please try again.');
    }
  }, [currentWeekGoals, currentUser?.id]);

  return {
    // Form state
    showAddGoal,
    setShowAddGoal,
    newGoal,
    setNewGoal,

    // Handlers
    handleToggleGoal,
    handleDecrementGoal,
    handleAddGoal,
    handleUpdateGoalBackground,
    handleSkipGoal
  };
}

export default useDashboardGoalsActions;
