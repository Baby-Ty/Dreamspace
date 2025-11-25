// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.

import { useCallback } from 'react';
import itemService from '../services/itemService';
import currentWeekService from '../services/currentWeekService';
import scoringService from '../services/scoringService';
import { getCurrentIsoWeek } from '../utils/dateUtils';
import { actionTypes } from '../state/appReducer';

/**
 * Custom hook for weekly goal operations
 * Extracts business logic from AppContext for weekly goal management
 */
export function useWeeklyGoalActions(state, dispatch) {
  /**
   * Add a weekly goal (either template or instance)
   */
  const addWeeklyGoal = useCallback(async (goalData) => {
    if (!state.currentUser?.id) return;
    
    // Determine if this is a template or instance
    if (goalData.type === 'weekly_goal_template') {
      // Template - save via saveDreams endpoint with all dreams and templates
      const template = {
        id: goalData.id || `template_${Date.now()}`,
        ...goalData,
        type: 'weekly_goal_template',
        createdAt: goalData.createdAt || new Date().toISOString()
      };
      
      dispatch({ type: actionTypes.ADD_WEEKLY_GOAL, payload: template });
      
      // Get all current dreams and templates
      const dreams = state.currentUser?.dreamBook || [];
      const existingTemplates = state.weeklyGoals?.filter(g => g.type === 'weekly_goal_template') || [];
      const allTemplates = [...existingTemplates, template];
      
      const result = await itemService.saveDreams(state.currentUser.id, dreams, allTemplates);
      if (!result.success) {
        console.error('Failed to save template:', result.error);
      }
    } else {
      // Instance - save to currentWeek container (only current week instances are supported)
      if (!goalData.weekId) {
        console.error('weekId is required for weekly goal instances');
        return;
      }
      
      const currentWeekIso = getCurrentIsoWeek();
      if (goalData.weekId !== currentWeekIso) {
        console.warn('⚠️ Cannot add instance for non-current week. Only current week instances are supported.');
        return;
      }
      
      const goal = {
        id: goalData.id || `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: goalData.type || 'weekly_goal',
        ...goalData,
        completed: goalData.completed !== undefined ? goalData.completed : false,
        createdAt: goalData.createdAt || new Date().toISOString()
      };
      
      // Load existing goals for current week
      const currentWeekResult = await currentWeekService.getCurrentWeek(state.currentUser.id);
      const existingGoals = currentWeekResult.success && currentWeekResult.data?.goals || [];
      
      // Check for duplicate
      const isDuplicate = existingGoals.some(g => g.id === goal.id);
      if (isDuplicate) {
        console.log('⚠️ Goal already exists, skipping:', goal.id);
        return;
      }
      
      const allGoals = [...existingGoals, goal];
      
      const result = await currentWeekService.saveCurrentWeek(state.currentUser.id, currentWeekIso, allGoals);
      if (!result.success) {
        console.error('Failed to save goal to currentWeek container:', result.error);
        return;
      }
      
      dispatch({ type: actionTypes.ADD_WEEKLY_GOAL, payload: { ...goal, weekId: goalData.weekId }});
    }
  }, [state.currentUser?.id, state.currentUser?.dreamBook, state.weeklyGoals, dispatch]);

  /**
   * Batch add multiple weekly goals (templates and/or instances)
   */
  const addWeeklyGoalsBatch = useCallback(async (goals) => {
    if (!state.currentUser?.id) return;
    
    // Group goals by weekId to batch save
    const goalsByWeek = {};
    const templates = [];
    
    for (const goalData of goals) {
      if (goalData.type === 'weekly_goal_template') {
        templates.push(goalData);
      } else if (goalData.weekId) {
        if (!goalsByWeek[goalData.weekId]) {
          goalsByWeek[goalData.weekId] = [];
        }
        goalsByWeek[goalData.weekId].push({
          id: goalData.id || `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...goalData,
          completed: goalData.completed !== undefined ? goalData.completed : false,
          createdAt: goalData.createdAt || new Date().toISOString()
        });
      }
    }
    
    // Save templates individually
    for (const template of templates) {
      const templateToSave = {
        id: template.id || `template_${Date.now()}`,
        ...template,
        type: 'weekly_goal_template',
        createdAt: template.createdAt || new Date().toISOString()
      };
      
      dispatch({ type: actionTypes.ADD_WEEKLY_GOAL, payload: templateToSave });
      
      const result = await itemService.saveItem(state.currentUser.id, 'weekly_goal_template', templateToSave);
      if (!result.success) {
        console.error('Failed to save template:', result.error);
      }
    }
    
    // Save instances by week (only current week instances are supported)
    const currentWeekIso = getCurrentIsoWeek();
    for (const [weekId, weekGoals] of Object.entries(goalsByWeek)) {
      if (weekId !== currentWeekIso) {
        console.warn(`⚠️ Skipping batch add for non-current week ${weekId}. Only current week instances are supported.`);
        continue;
      }
      
      const currentWeekResult = await currentWeekService.getCurrentWeek(state.currentUser.id);
      const existingGoals = currentWeekResult.success && currentWeekResult.data?.goals || [];
      
      const existingIds = new Set(existingGoals.map(g => g.id));
      const newGoals = weekGoals.filter(g => !existingIds.has(g.id));
      const allGoals = [...existingGoals, ...newGoals];
      
      const result = await currentWeekService.saveCurrentWeek(state.currentUser.id, currentWeekIso, allGoals);
      if (result.success) {
        newGoals.forEach(goal => {
          dispatch({ type: actionTypes.ADD_WEEKLY_GOAL, payload: { ...goal, weekId } });
        });
      } else {
        console.error(`Failed to save goals for current week:`, result.error);
      }
    }
  }, [state.currentUser?.id, dispatch]);

  /**
   * Update a weekly goal (either template or instance)
   */
  const updateWeeklyGoal = useCallback(async (goal) => {
    if (!state.currentUser?.id) return;
    
    dispatch({ type: actionTypes.UPDATE_WEEKLY_GOAL, payload: goal });
    
    // Determine if this is a template or instance
    if (goal.type === 'weekly_goal_template') {
      // Template - save via saveDreams with all dreams and templates
      const dreams = state.currentUser?.dreamBook || [];
      const allTemplates = state.weeklyGoals?.filter(g => g.type === 'weekly_goal_template') || [];
      
      const result = await itemService.saveDreams(state.currentUser.id, dreams, allTemplates);
      if (!result.success) {
        console.error('Failed to save template:', result.error);
      }
    } else if (goal.weekId) {
      // Instance - save to currentWeek container (only current week instances are supported)
      const currentWeekIso = getCurrentIsoWeek();
      if (goal.weekId !== currentWeekIso) {
        console.warn('⚠️ Cannot update instance for non-current week. Only current week instances are supported.');
        return;
      }
      
      const currentWeekResult = await currentWeekService.getCurrentWeek(state.currentUser.id);
      const existingGoals = currentWeekResult.success && currentWeekResult.data?.goals || [];
      const updatedWeekGoals = existingGoals.map(g => g.id === goal.id ? goal : g);
      
      const result = await currentWeekService.saveCurrentWeek(state.currentUser.id, currentWeekIso, updatedWeekGoals);
      if (!result.success) {
        console.error('Failed to update goal in currentWeek container:', result.error);
      }
    }
  }, [state.currentUser?.id, state.currentUser?.dreamBook, state.weeklyGoals, dispatch]);

  /**
   * Delete a weekly goal (either template or instance)
   */
  const deleteWeeklyGoal = useCallback(async (goalId) => {
    if (!state.currentUser?.id) return;
    
    const goal = state.weeklyGoals.find(g => g.id === goalId);
    if (!goal) {
      console.error('Goal not found:', goalId);
      return;
    }
    
    if (goal.type === 'weekly_goal_template') {
      // Template - delete from dreams container via saveDreams
      const dreams = state.currentUser?.dreamBook || [];
      const allTemplates = state.weeklyGoals?.filter(g => 
        g.type === 'weekly_goal_template' && g.id !== goalId
      ) || [];
      
      const result = await itemService.saveDreams(state.currentUser.id, dreams, allTemplates);
      if (!result.success) {
        console.error('Failed to delete template:', result.error);
        return;
      }
      
      // Remove instances from current week only
      const currentWeekIso = getCurrentIsoWeek();
      const currentWeekResult = await currentWeekService.getCurrentWeek(state.currentUser.id);
      
      if (currentWeekResult.success && currentWeekResult.data?.goals) {
        const existingGoals = currentWeekResult.data.goals;
        const filteredGoals = existingGoals.filter(g => g.templateId !== goalId);
        
        if (filteredGoals.length < existingGoals.length) {
          await currentWeekService.saveCurrentWeek(state.currentUser.id, currentWeekIso, filteredGoals);
          
          existingGoals.filter(g => g.templateId === goalId).forEach(instance => {
            dispatch({ type: actionTypes.DELETE_WEEKLY_GOAL, payload: instance.id });
          });
        }
      }
      
      dispatch({ type: actionTypes.DELETE_WEEKLY_GOAL, payload: goalId });
    } else if (goal.weekId) {
      // Instance - delete from currentWeek container
      const currentWeekIso = getCurrentIsoWeek();
      if (goal.weekId !== currentWeekIso) {
        console.warn('⚠️ Cannot delete instance for non-current week. Only current week instances are supported.');
        return;
      }
      
      const currentWeekResult = await currentWeekService.getCurrentWeek(state.currentUser.id);
      const existingGoals = currentWeekResult.success && currentWeekResult.data?.goals || [];
      const filteredGoals = existingGoals.filter(g => g.id !== goalId);
      
      const result = await currentWeekService.saveCurrentWeek(state.currentUser.id, currentWeekIso, filteredGoals);
      if (!result.success) {
        console.error('Failed to save current week goals after delete:', result.error);
        return;
      }
      
      dispatch({ type: actionTypes.DELETE_WEEKLY_GOAL, payload: goalId });
    }
  }, [state.currentUser?.id, state.currentUser?.dreamBook, state.weeklyGoals, dispatch]);

  /**
   * Toggle weekly goal completion
   */
  const toggleWeeklyGoal = useCallback(async (goalId) => {
    if (!state.currentUser?.id) return;
    
    const goal = state.weeklyGoals.find(g => g.id === goalId);
    if (!goal) {
      console.error('Goal not found:', goalId);
      return;
    }
    
    const currentWeekIso = getCurrentIsoWeek();
    
    // If it's a template, work with the instance for current week
    if (goal.type === 'weekly_goal_template') {
      let instance = state.weeklyGoals.find(g => 
        g.templateId === goal.id && g.weekId === currentWeekIso
      );
      
      if (!instance) {
        instance = {
          id: `${goal.id}_${currentWeekIso}`,
          type: 'weekly_goal',
          templateId: goal.id,
          goalType: goal.goalType || 'consistency',
          title: goal.title,
          description: goal.description,
          dreamId: goal.dreamId,
          dreamTitle: goal.dreamTitle,
          dreamCategory: goal.dreamCategory,
          goalId: goal.goalId,
          recurrence: goal.recurrence || 'weekly',
          targetWeeks: goal.targetWeeks,
          targetMonths: goal.targetMonths,
          weekId: currentWeekIso,
          completed: true,
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        
        dispatch({ type: actionTypes.ADD_WEEKLY_GOAL, payload: instance });
      } else {
        const updatedInstance = {
          ...instance,
          completed: !instance.completed,
          completedAt: !instance.completed ? new Date().toISOString() : undefined
        };
        
        dispatch({ type: actionTypes.UPDATE_WEEKLY_GOAL, payload: updatedInstance });
        instance = updatedInstance;
      }
      
      // Save the instance to currentWeek container
      const currentWeekResult = await currentWeekService.getCurrentWeek(state.currentUser.id);
      const existingGoals = currentWeekResult.success && currentWeekResult.data?.goals || [];
      
      const instanceExists = existingGoals.some(g => g.id === instance.id);
      const updatedWeekGoals = instanceExists
        ? existingGoals.map(g => g.id === instance.id ? instance : g)
        : [...existingGoals, instance];
      
      const result = await currentWeekService.saveCurrentWeek(state.currentUser.id, currentWeekIso, updatedWeekGoals);
      if (!result.success) {
        console.error('Failed to save current week goals:', result.error);
        return;
      }
      
      // Add scoring if goal was completed
      if (instance.completed) {
        const currentYear = new Date().getFullYear();
        const points = scoringService.calculateWeekScoring(instance);
        const entry = scoringService.createScoringEntry(
          'week',
          points,
          `Completed: "${instance.title}"`,
          { weekId: currentWeekIso, dreamId: instance.dreamId }
        );
        
        await scoringService.addScoringEntry(state.currentUser.id, currentYear, entry);
        dispatch({ type: actionTypes.ADD_SCORING_ENTRY, payload: entry });
        
        const newScore = (state.currentUser?.score || 0) + points;
        dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: newScore });
      }
    } else if (goal.weekId) {
      // Regular instance
      if (goal.weekId !== currentWeekIso) {
        console.warn('⚠️ Cannot toggle instance for non-current week. Only current week instances are supported.');
        return;
      }
      
      const updatedGoal = {
        ...goal,
        completed: !goal.completed,
        completedAt: !goal.completed ? new Date().toISOString() : undefined
      };
      
      dispatch({ type: actionTypes.UPDATE_WEEKLY_GOAL, payload: updatedGoal });
      
      const currentWeekResult = await currentWeekService.getCurrentWeek(state.currentUser.id);
      const existingGoals = currentWeekResult.success && currentWeekResult.data?.goals || [];
      const updatedWeekGoals = existingGoals.map(g => g.id === goalId ? updatedGoal : g);
      
      const result = await currentWeekService.saveCurrentWeek(state.currentUser.id, currentWeekIso, updatedWeekGoals);
      if (!result.success) {
        console.error('Failed to update goal in currentWeek container:', result.error);
        return;
      }
      
      // Add scoring if goal was completed
      if (updatedGoal.completed) {
        const currentYear = new Date().getFullYear();
        const points = scoringService.calculateWeekScoring(updatedGoal);
        const entry = scoringService.createScoringEntry(
          'week',
          points,
          `Completed: "${updatedGoal.title}"`,
          { weekId: goal.weekId, dreamId: updatedGoal.dreamId }
        );
        
        await scoringService.addScoringEntry(state.currentUser.id, currentYear, entry);
        dispatch({ type: actionTypes.ADD_SCORING_ENTRY, payload: entry });
        
        const newScore = (state.currentUser?.score || 0) + points;
        dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: newScore });
      }
    }
    
    dispatch({ type: actionTypes.TOGGLE_WEEKLY_GOAL, payload: goalId });
  }, [state.currentUser?.id, state.currentUser?.dreamBook, state.weeklyGoals, dispatch]);

  return {
    addWeeklyGoal,
    addWeeklyGoalsBatch,
    updateWeeklyGoal,
    deleteWeeklyGoal,
    toggleWeeklyGoal
  };
}

