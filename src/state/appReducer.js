// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.

import { getCurrentIsoWeek } from '../utils/dateUtils.js';

// Action types
export const actionTypes = {
  SET_USER_DATA: 'SET_USER_DATA',
  UPDATE_DREAM: 'UPDATE_DREAM',
  ADD_DREAM: 'ADD_DREAM',
  DELETE_DREAM: 'DELETE_DREAM',
  REORDER_DREAMS: 'REORDER_DREAMS',
  UPDATE_USER_SCORE: 'UPDATE_USER_SCORE',
  ADD_CONNECT: 'ADD_CONNECT',
  UPDATE_CONNECT: 'UPDATE_CONNECT',
  SET_WEEKLY_GOALS: 'SET_WEEKLY_GOALS',
  ADD_WEEKLY_GOAL: 'ADD_WEEKLY_GOAL',
  UPDATE_WEEKLY_GOAL: 'UPDATE_WEEKLY_GOAL',
  DELETE_WEEKLY_GOAL: 'DELETE_WEEKLY_GOAL',
  TOGGLE_WEEKLY_GOAL: 'TOGGLE_WEEKLY_GOAL',
  LOG_WEEKLY_COMPLETION: 'LOG_WEEKLY_COMPLETION',
  UPDATE_MILESTONE_STREAK: 'UPDATE_MILESTONE_STREAK',
  SET_SCORING_HISTORY: 'SET_SCORING_HISTORY',
  ADD_SCORING_ENTRY: 'ADD_SCORING_ENTRY',
  LOAD_PERSISTED_DATA: 'LOAD_PERSISTED_DATA',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  // Loading state actions
  SET_LOADING: 'SET_LOADING',
  SET_DATA_LOADED: 'SET_DATA_LOADED',
};

/**
 * App Reducer
 * Handles all state mutations for the DreamSpace application
 */
export const appReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.LOAD_PERSISTED_DATA:
      // Data preservation for race conditions:
      // When loading from multiple sources (API, localStorage), data may arrive at different times.
      // We preserve existing data if incoming data is empty to prevent UI flickering.
      // TODO: Long-term fix - use explicit loading states per data type
      const loadedDreams = action.payload.currentUser?.dreamBook || action.payload.dreamBook || [];
      const currentDreams = state.currentUser?.dreamBook || [];
      const preservedDreams = (loadedDreams.length > 0 || currentDreams.length === 0) 
        ? loadedDreams 
        : currentDreams;
      
      // Merge payload with preserved dreams
      const mergedPayload = {
        ...action.payload,
        currentUser: action.payload.currentUser ? {
          ...action.payload.currentUser,
          dreamBook: preservedDreams
        } : action.payload.currentUser
      };
      
      return {
        ...state,
        ...mergedPayload
      };

    case actionTypes.SET_USER_DATA:
      // ✅ FIX: Preserve dreams if payload has empty/undefined dreams but state has dreams
      // This prevents dreams from disappearing when updating other user data (e.g., connects)
      const payloadDreams = action.payload.dreamBook || action.payload.dreams || [];
      const existingDreams = state.currentUser?.dreamBook || [];
      const dreamsToUse = (payloadDreams.length > 0 || existingDreams.length === 0) 
        ? payloadDreams 
        : existingDreams;
      
      // ✅ FIX: Preserve yearVision if payload has empty/undefined yearVision but state has yearVision
      // This prevents yearVision from disappearing when updating other user data
      const payloadYearVision = action.payload.yearVision || '';
      const existingYearVision = state.currentUser?.yearVision || '';
      const yearVisionToUse = (payloadYearVision.trim().length > 0 || existingYearVision.trim().length === 0)
        ? payloadYearVision
        : existingYearVision;
      
      return {
        ...state,
        currentUser: {
          ...action.payload,
          dreamBook: dreamsToUse,
          yearVision: yearVisionToUse
        }
      };

    case actionTypes.UPDATE_DREAM:
      const updatedDreams = state.currentUser.dreamBook.map(dream =>
        dream.id === action.payload.id ? action.payload : dream
      );
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          dreamBook: updatedDreams
        }
      };

    case actionTypes.ADD_DREAM:
      const newDream = action.payload;
      
      // Goals are tracked directly by goalId - no templates needed
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          dreamBook: [...state.currentUser.dreamBook, newDream]
        }
      };

    case actionTypes.DELETE_DREAM:
      const filteredDreams = state.currentUser.dreamBook.filter(
        dream => dream.id !== action.payload
      );
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          dreamBook: filteredDreams
        }
      };

    case actionTypes.REORDER_DREAMS:
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          dreamBook: action.payload
        }
      };

    case actionTypes.UPDATE_USER_SCORE:
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          score: action.payload
        }
      };

    case actionTypes.ADD_CONNECT:
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          connects: [...state.currentUser.connects, action.payload]
        }
      };

    case actionTypes.UPDATE_CONNECT:
      const updatedConnects = state.currentUser.connects.map(connect =>
        connect.id === action.payload.id ? action.payload : connect
      );
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          connects: updatedConnects
        }
      };

    case actionTypes.SET_WEEKLY_GOALS:
      return {
        ...state,
        weeklyGoals: action.payload
      };

    case actionTypes.ADD_WEEKLY_GOAL:
      return {
        ...state,
        weeklyGoals: [...state.weeklyGoals, action.payload]
      };

    case actionTypes.UPDATE_WEEKLY_GOAL:
      const updatedWeeklyGoals = state.weeklyGoals.map(goal =>
        goal.id === action.payload.id ? action.payload : goal
      );
      return {
        ...state,
        weeklyGoals: updatedWeeklyGoals
      };

    case actionTypes.DELETE_WEEKLY_GOAL:
      const filteredWeeklyGoals = state.weeklyGoals.filter(
        goal => goal.id !== action.payload
      );
      return {
        ...state,
        weeklyGoals: filteredWeeklyGoals
      };

    case actionTypes.TOGGLE_WEEKLY_GOAL:
      const toggledWeeklyGoals = state.weeklyGoals.map(goal =>
        goal.id === action.payload ? { ...goal, completed: !goal.completed } : goal
      );
      return {
        ...state,
        weeklyGoals: toggledWeeklyGoals
      };

    case actionTypes.LOG_WEEKLY_COMPLETION:
      // DEPRECATED: This action is kept for backward compatibility
      // New implementation uses weekId-specific goal instances
      // Legacy behavior: update weekLog on the goal
      const { goalId, isoWeek, completed } = action.payload;
      
      // Find if there's a week-specific instance
      const weekSpecificGoal = state.weeklyGoals.find(g => g.id === goalId && g.weekId === isoWeek);
      
      if (weekSpecificGoal) {
        // New format: update the specific week instance
        const updatedGoalsNewFormat = state.weeklyGoals.map(goal =>
          (goal.id === goalId && goal.weekId === isoWeek)
            ? { ...goal, completed, completedAt: completed ? new Date().toISOString() : undefined }
            : goal
        );
        return {
          ...state,
          weeklyGoals: updatedGoalsNewFormat
        };
      } else {
        // Old format: update weekLog (for migration)
        const updatedGoalsWithLog = state.weeklyGoals.map(goal => {
          if (goal.id === goalId) {
            const newWeekLog = { ...(goal.weekLog || {}), [isoWeek]: completed };
            // Update completed status based on current week
            const currentWeek = getCurrentIsoWeek();
            const isCurrentWeekCompleted = newWeekLog[currentWeek] || false;
            return {
              ...goal,
              weekLog: newWeekLog,
              completed: isCurrentWeekCompleted,
              completedAt: completed ? new Date().toISOString() : goal.completedAt
            };
          }
          return goal;
        });
        return {
          ...state,
          weeklyGoals: updatedGoalsWithLog
        };
      }


    case actionTypes.SET_SCORING_HISTORY:
      // Handle both legacy format (array) and new format (object with allYearsScoring)
      if (Array.isArray(action.payload)) {
        // Legacy format: just an array of entries
        return {
          ...state,
          scoringHistory: action.payload
        };
      } else {
        // New format: object with allYearsScoring, allTimeScore, and scoringHistory
        return {
          ...state,
          allYearsScoring: action.payload.allYearsScoring || [],
          allTimeScore: action.payload.allTimeScore || 0,
          scoringHistory: action.payload.scoringHistory || []
        };
      }

    case actionTypes.ADD_SCORING_ENTRY:
      return {
        ...state,
        scoringHistory: [action.payload, ...state.scoringHistory]
      };

    case actionTypes.LOGIN:
      return {
        ...state,
        isAuthenticated: true
      };

    case actionTypes.LOGOUT:
      return {
        ...state,
        isAuthenticated: false
      };

    case actionTypes.SET_LOADING:
      // Set loading state for specific data type
      // Usage: dispatch({ type: SET_LOADING, payload: { dreams: true } })
      return {
        ...state,
        loading: {
          ...state.loading,
          ...action.payload
        }
      };

    case actionTypes.SET_DATA_LOADED:
      // Mark specific data as loaded (for race condition handling)
      // Usage: dispatch({ type: SET_DATA_LOADED, payload: { dreams: true, source: 'api' } })
      return {
        ...state,
        dataLoaded: {
          ...state.dataLoaded,
          [action.payload.type]: {
            loaded: true,
            source: action.payload.source,
            timestamp: Date.now()
          }
        },
        loading: {
          ...state.loading,
          [action.payload.type]: false
        }
      };

    default:
      return state;
  }
};
