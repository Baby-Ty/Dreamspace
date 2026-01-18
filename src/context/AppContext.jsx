
import React, { createContext, useContext, useReducer } from 'react';
import { appReducer, actionTypes } from '../state/appReducer.js';
import { createEmptyUser } from '../utils/appDataHelpers.js';
import { useDreamActions } from '../hooks/useDreamActions';
import { useGoalActions } from '../hooks/useGoalActions';
import { useWeeklyGoalActions } from '../hooks/useWeeklyGoalActions';
import { useConnectActions } from '../hooks/useConnectActions';
import { useUserData } from '../hooks/useUserData';
import { initialState } from './appContextConfig';
import { useInitialUserSync, useAutosave, useVisionEventListener } from './hooks';
import { updateDreamProgressAction, logWeeklyCompletionAction } from './actions';

// Create the context
const AppContext = createContext();

// App Context Provider
export const AppProvider = ({ children, initialUser }) => {
  const userToUse = initialUser ? {
    ...createEmptyUser(initialUser),
    ...initialUser,
    dreamBook: initialUser.dreamBook || [],
    yearVision: initialUser.yearVision || '',
    score: initialUser.score || 0,
    connects: initialUser.connects || [],
    dreamsCount: initialUser.dreamsCount || 0,
    connectsCount: initialUser.connectsCount || 0
  } : null;

  const weeklyGoalsFromAPI = Array.isArray(initialUser?.weeklyGoals) ? initialUser.weeklyGoals : [];
  
  const initialStateWithUser = {
    ...initialState,
    currentUser: userToUse,
    weeklyGoals: weeklyGoalsFromAPI,
    isAuthenticated: !!initialUser
  };

  const [state, dispatch] = useReducer(appReducer, initialStateWithUser);
  
  // Use hooks for business logic - pass state and dispatch to avoid circular dependency
  const dreamActions = useDreamActions(state, dispatch);
  const goalActions = useGoalActions(state, dispatch);
  const weeklyGoalActions = useWeeklyGoalActions(state, dispatch);
  const connectActions = useConnectActions(state, dispatch);
  
  // Load user data
  useUserData(initialUser, dispatch, state);
  
  // Custom hooks for side effects (extracted for clarity)
  useInitialUserSync(initialUser, state, dispatch);
  useAutosave(state);
  useVisionEventListener(state, dispatch);

  // Action creators - thin wrappers that use hooks
  const actions = {
    // Dream actions
    updateDream: dreamActions.updateDream,
    addDream: dreamActions.addDream,
    deleteDream: dreamActions.deleteDream,
    reorderDreams: dreamActions.reorderDreams,

    // Goal actions
    addGoal: goalActions.addGoal,
    updateGoal: goalActions.updateGoal,
    deleteGoal: goalActions.deleteGoal,
    updateDeadlineGoalAndTemplate: goalActions.updateDeadlineGoalAndTemplate,
    updateConsistencyGoalAndTemplate: goalActions.updateConsistencyGoalAndTemplate,

    // Weekly goal actions
    addWeeklyGoal: weeklyGoalActions.addWeeklyGoal,
    addWeeklyGoalsBatch: weeklyGoalActions.addWeeklyGoalsBatch,
    updateWeeklyGoal: weeklyGoalActions.updateWeeklyGoal,
    deleteWeeklyGoal: weeklyGoalActions.deleteWeeklyGoal,
    toggleWeeklyGoal: weeklyGoalActions.toggleWeeklyGoal,

    // Connect actions
    addConnect: connectActions.addConnect,
    updateConnect: connectActions.updateConnect,
    reloadConnects: connectActions.reloadConnects,

    // Simple dispatch actions
    updateUserScore: (newScore) => {
      dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: newScore });
    },

    addScoringEntry: (entry) => {
      dispatch({ type: actionTypes.ADD_SCORING_ENTRY, payload: entry });
    },

    updateDreamProgress: async (dreamId, newProgress) => {
      await updateDreamProgressAction(dreamId, newProgress, state, dispatch);
    },

    logWeeklyCompletion: async (goalId, isoWeek, completed) => {
      await logWeeklyCompletionAction(
        goalId, 
        isoWeek, 
        completed, 
        state, 
        dispatch,
        actions.updateConsistencyGoalAndTemplate
      );
    },

    login: () => {
      dispatch({ type: actionTypes.LOGIN });
    },

    logout: () => {
      dispatch({ type: actionTypes.LOGOUT });
    },

    setWeeklyGoals: (goals) => {
      dispatch({ type: actionTypes.SET_WEEKLY_GOALS, payload: goals });
    },

    // Loading state management
    setLoading: (loadingState) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: loadingState });
    },

    markDataLoaded: (dataType, source) => {
      dispatch({ 
        type: actionTypes.SET_DATA_LOADED, 
        payload: { type: dataType, source } 
      });
    }
  };

  const value = {
    ...state,
    ...actions
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};