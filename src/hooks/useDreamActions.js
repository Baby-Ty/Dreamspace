// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.

import { useCallback } from 'react';
import itemService from '../services/itemService';
import scoringService from '../services/scoringService';
import currentWeekService from '../services/currentWeekService';
import { getCurrentIsoWeek } from '../utils/dateUtils';
import { actionTypes } from '../state/appReducer';

/**
 * Custom hook for dream CRUD operations
 * Extracts business logic from AppContext for dream management
 */
export function useDreamActions(state, dispatch) {
  /**
   * Update a dream and preserve all weekly goal templates
   */
  const updateDream = useCallback(async (dream) => {
    if (!state.currentUser?.id) return;
    
    // Update local state first
    dispatch({ type: actionTypes.UPDATE_DREAM, payload: dream });
    
    // Get updated dreamBook from state (after dispatch)
    const updatedDreams = state.currentUser.dreamBook.map(d => 
      d.id === dream.id ? dream : d
    );
    
    // Preserve all existing weekly goal templates
    const templates = state.weeklyGoals?.filter(g => 
      g.type === 'weekly_goal_template'
    ) || [];
    
    const result = await itemService.saveDreams(state.currentUser.id, updatedDreams, templates);
    if (!result.success) {
      console.error('Failed to save dreams document:', result.error);
    }
  }, [state.currentUser?.id, state.currentUser?.dreamBook, state.weeklyGoals, dispatch]);

  /**
   * Add a new dream and preserve all weekly goal templates
   */
  const addDream = useCallback(async (dream) => {
    if (!state.currentUser?.id) return;
    
    // Add to local state first
    dispatch({ type: actionTypes.ADD_DREAM, payload: dream });
    
    // Get updated dreamBook from state (after dispatch)
    const updatedDreams = [...state.currentUser.dreamBook, dream];
    
    // Preserve all existing weekly goal templates
    const templates = state.weeklyGoals?.filter(g => 
      g.type === 'weekly_goal_template'
    ) || [];
    
    const result = await itemService.saveDreams(state.currentUser.id, updatedDreams, templates);
    if (!result.success) {
      console.error('Failed to save dreams document:', result.error);
      return;
    }
    
    // Add scoring entry for new dream
    const currentYear = new Date().getFullYear();
    const points = scoringService.calculateDreamScoring(dream);
    const entry = scoringService.createScoringEntry(
      'dream',
      points,
      `Added dream: "${dream.title}"`,
      { dreamId: dream.id }
    );
    
    await scoringService.addScoringEntry(state.currentUser.id, currentYear, entry);
    dispatch({ type: actionTypes.ADD_SCORING_ENTRY, payload: entry });
    
    const newScore = state.currentUser.score + points;
    dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: newScore });
  }, [state.currentUser?.id, state.currentUser?.dreamBook, state.currentUser?.score, state.weeklyGoals, dispatch]);

  /**
   * Delete a dream and remove its associated weekly goal templates
   */
  const deleteDream = useCallback(async (dreamId) => {
    if (!state.currentUser?.id) return;
    
    // Delete from local state first
    dispatch({ type: actionTypes.DELETE_DREAM, payload: dreamId });
    
    // Get updated dreamBook from state (after dispatch)
    const updatedDreams = state.currentUser.dreamBook.filter(d => d.id !== dreamId);
    
    // Keep templates that aren't tied to the deleted dream
    const remainingTemplates = state.weeklyGoals?.filter(g => 
      g.type === 'weekly_goal_template' && g.dreamId !== dreamId
    ) || [];
    
    const result = await itemService.saveDreams(state.currentUser.id, updatedDreams, remainingTemplates);
    if (!result.success) {
      console.error('Failed to save dreams document after delete:', result.error);
      return;
    }

    // Remove goals for deleted dream from current week only
    const currentWeekIso = getCurrentIsoWeek();
    const currentWeekResult = await currentWeekService.getCurrentWeek(state.currentUser.id);
    
    if (currentWeekResult.success && currentWeekResult.data?.goals) {
      const existingGoals = currentWeekResult.data.goals;
      const filteredGoals = existingGoals.filter(g => g.dreamId !== dreamId);
      
      if (filteredGoals.length < existingGoals.length) {
        await currentWeekService.saveCurrentWeek(state.currentUser.id, currentWeekIso, filteredGoals);
        
        // Update local state - dispatch DELETE for each removed goal
        existingGoals.filter(g => g.dreamId === dreamId).forEach(goal => {
          dispatch({ type: actionTypes.DELETE_WEEKLY_GOAL, payload: goal.id });
        });
      }
    }
  }, [state.currentUser?.id, state.currentUser?.dreamBook, state.weeklyGoals, dispatch]);

  /**
   * Reorder dreams in the dream book (drag & drop)
   */
  const reorderDreams = useCallback((fromIndex, toIndex) => {
    const list = [...state.currentUser.dreamBook];
    if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) return;
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    dispatch({ type: actionTypes.REORDER_DREAMS, payload: list });
  }, [state.currentUser?.dreamBook, dispatch]);

  return {
    updateDream,
    addDream,
    deleteDream,
    reorderDreams
  };
}

