
import { useCallback } from 'react';
import itemService from '../services/itemService';
import { actionTypes } from '../state/appReducer';

/**
 * Custom hook for goal CRUD operations within dreams
 * Extracts business logic from AppContext for goal management
 */
export function useGoalActions(state, dispatch) {
  /**
   * Add a goal to a dream and preserve all weekly goal templates
   */
  const addGoal = useCallback(async (dreamId, goal) => {
    if (!state.currentUser?.id) return;
    
    // Find the dream and add the goal
    const dream = state.currentUser.dreamBook.find(d => d.id === dreamId);
    if (!dream) {
      console.error('Dream not found:', dreamId);
      return;
    }
    
    const updatedDream = {
      ...dream,
      goals: [...(dream.goals || []), goal]
    };
    
    // Update local state
    dispatch({ type: actionTypes.UPDATE_DREAM, payload: updatedDream });
    
    // Save entire dreams array
    const updatedDreams = state.currentUser.dreamBook.map(d => 
      d.id === dreamId ? updatedDream : d
    );
    
    // Preserve all existing weekly goal templates
    const templates = state.weeklyGoals?.filter(g => 
      g.type === 'weekly_goal_template'
    ) || [];
    
    const result = await itemService.saveDreams(state.currentUser.id, updatedDreams, templates);
    if (!result.success) {
      console.error('Failed to save dreams document after adding goal:', result.error);
    }
  }, [state.currentUser?.id, state.currentUser?.dreamBook, state.weeklyGoals, dispatch]);

  /**
   * Update a goal within a dream and preserve all weekly goal templates
   */
  const updateGoal = useCallback(async (dreamId, goal) => {
    if (!state.currentUser?.id) return;
    
    // Find the dream and update the goal
    const dream = state.currentUser.dreamBook.find(d => d.id === dreamId);
    if (!dream) {
      console.error('Dream not found:', dreamId);
      return;
    }
    
    const updatedDream = {
      ...dream,
      goals: (dream.goals || []).map(g => g.id === goal.id ? goal : g)
    };
    
    // Update local state
    dispatch({ type: actionTypes.UPDATE_DREAM, payload: updatedDream });
    
    // Save entire dreams array
    const updatedDreams = state.currentUser.dreamBook.map(d => 
      d.id === dreamId ? updatedDream : d
    );
    
    // Preserve all existing weekly goal templates
    const templates = state.weeklyGoals?.filter(g => 
      g.type === 'weekly_goal_template'
    ) || [];
    
    const result = await itemService.saveDreams(state.currentUser.id, updatedDreams, templates);
    if (!result.success) {
      console.error('Failed to save dreams document after updating goal:', result.error);
    }
  }, [state.currentUser?.id, state.currentUser?.dreamBook, state.weeklyGoals, dispatch]);

  /**
   * Delete a goal from a dream and preserve all weekly goal templates
   */
  const deleteGoal = useCallback(async (dreamId, goalId) => {
    if (!state.currentUser?.id) return;
    
    // Find the dream and remove the goal
    const dream = state.currentUser.dreamBook.find(d => d.id === dreamId);
    if (!dream) {
      console.error('Dream not found:', dreamId);
      return;
    }
    
    const updatedDream = {
      ...dream,
      goals: (dream.goals || []).filter(g => g.id !== goalId)
    };
    
    // Update local state
    dispatch({ type: actionTypes.UPDATE_DREAM, payload: updatedDream });
    
    // Save entire dreams array
    const updatedDreams = state.currentUser.dreamBook.map(d => 
      d.id === dreamId ? updatedDream : d
    );
    
    // Preserve all existing weekly goal templates
    const templates = state.weeklyGoals?.filter(g => 
      g.type === 'weekly_goal_template'
    ) || [];
    
    const result = await itemService.saveDreams(state.currentUser.id, updatedDreams, templates);
    if (!result.success) {
      console.error('Failed to save dreams document after deleting goal:', result.error);
    }
  }, [state.currentUser?.id, state.currentUser?.dreamBook, state.weeklyGoals, dispatch]);

  /**
   * Atomically update both a dream goal and its corresponding template
   * Prevents race conditions by doing a single write instead of two
   */
  const updateDeadlineGoalAndTemplate = useCallback(async (dreamId, updatedGoal, updatedTemplate = null) => {
    if (!state.currentUser?.id) return;
    
    // Find the dream and update the goal
    const dream = state.currentUser.dreamBook.find(d => d.id === dreamId);
    if (!dream) {
      console.error('Dream not found:', dreamId);
      return;
    }
    
    const updatedDream = {
      ...dream,
      goals: (dream.goals || []).map(g => g.id === updatedGoal.id ? updatedGoal : g)
    };
    
    // Build complete updated dreams array
    const updatedDreams = state.currentUser.dreamBook.map(d => 
      d.id === dreamId ? updatedDream : d
    );
    
    // Build complete updated templates array
    const templates = state.weeklyGoals?.filter(g =>
      g.type === 'weekly_goal_template'
    ) || [];
    
    const updatedTemplates = updatedTemplate
      ? templates.map(t => {
          // Match by id OR goalId (templates can use either field)
          const matches = t.id === updatedTemplate.id || 
                         (updatedTemplate.goalId && t.goalId === updatedTemplate.goalId) ||
                         (updatedTemplate.id && t.goalId === updatedTemplate.id);
          return matches ? updatedTemplate : t;
        })
      : templates;
    
    // SINGLE atomic write - no race condition!
    const result = await itemService.saveDreams(state.currentUser.id, updatedDreams, updatedTemplates);
    if (!result.success) {
      console.error('Failed to atomically save goal and template:', result.error);
      return;
    }
    
    // Update local state AFTER successful write
    dispatch({ type: actionTypes.UPDATE_DREAM, payload: updatedDream });
    if (updatedTemplate) {
      dispatch({ type: actionTypes.UPDATE_WEEKLY_GOAL, payload: updatedTemplate });
    }
  }, [state.currentUser?.id, state.currentUser?.dreamBook, state.weeklyGoals, dispatch]);

  /**
   * Atomically update a consistency goal and its template (if it exists)
   */
  const updateConsistencyGoalAndTemplate = useCallback(async (dreamId, updatedGoal, updatedTemplate = null) => {
    if (!state.currentUser?.id) return;

    // Find the dream and update the goal
    const dream = state.currentUser.dreamBook.find(d => d.id === dreamId);
    if (!dream) {
      console.error('Dream not found:', dreamId);
      return;
    }

    const updatedDream = {
      ...dream,
      goals: (dream.goals || []).map(g => g.id === updatedGoal.id ? updatedGoal : g)
    };

    // Build complete updated dreams array
    const updatedDreams = state.currentUser.dreamBook.map(d =>
      d.id === dreamId ? updatedDream : d
    );

    // Build complete updated templates array
    const templates = state.weeklyGoals?.filter(g =>
      g.type === 'weekly_goal_template'
    ) || [];

    const updatedTemplates = updatedTemplate
      ? templates.map(t => {
          // Match by id OR goalId (templates can use either field)
          const matches = t.id === updatedTemplate.id || 
                         (updatedTemplate.goalId && t.goalId === updatedTemplate.goalId) ||
                         (updatedTemplate.id && t.goalId === updatedTemplate.id);
          return matches ? updatedTemplate : t;
        })
      : templates;

    // SINGLE atomic write - no race condition!
    const result = await itemService.saveDreams(state.currentUser.id, updatedDreams, updatedTemplates);
    if (!result.success) {
      console.error('Failed to atomically save consistency goal and template:', result.error);
      return;
    }

    // Update local state AFTER successful write
    dispatch({ type: actionTypes.UPDATE_DREAM, payload: updatedDream });
    if (updatedTemplate) {
      dispatch({ type: actionTypes.UPDATE_WEEKLY_GOAL, payload: updatedTemplate });
    }
  }, [state.currentUser?.id, state.currentUser?.dreamBook, state.weeklyGoals, dispatch]);

  return {
    addGoal,
    updateGoal,
    deleteGoal,
    updateDeadlineGoalAndTemplate,
    updateConsistencyGoalAndTemplate
  };
}
