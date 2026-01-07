// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.

import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { appReducer, actionTypes } from '../state/appReducer.js';
import { createEmptyUser, saveUserData } from '../utils/appDataHelpers.js';
import { useDreamActions } from '../hooks/useDreamActions';
import { useGoalActions } from '../hooks/useGoalActions';
import { useWeeklyGoalActions } from '../hooks/useWeeklyGoalActions';
import { useConnectActions } from '../hooks/useConnectActions';
import { useUserData } from '../hooks/useUserData';
import itemService from '../services/itemService';
import { computeStreak } from '../utils/dateUtils';

// Create the context
const AppContext = createContext();

// Initial state
const initialState = {
  isAuthenticated: false,
  currentUser: null,
  weeklyGoals: [],
  scoringHistory: [],
  allYearsScoring: [],
  allTimeScore: 0
};

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
  
  // Sync initialUser prop changes to state, but preserve yearVision if it exists in state
  const prevInitialUserRef = useRef(null);
  useEffect(() => {
    if (!initialUser || !state.currentUser?.id || initialUser.id !== state.currentUser.id) {
      prevInitialUserRef.current = initialUser;
      return;
    }
    
    // Only update if initialUser actually changed
    const prevInitialUser = prevInitialUserRef.current;
    if (prevInitialUser && JSON.stringify(prevInitialUser) === JSON.stringify(initialUser)) {
      return;
    }
    
    prevInitialUserRef.current = initialUser;
    
    const existingYearVision = state.currentUser?.yearVision;
    const newYearVision = initialUser.yearVision;
    
    if (existingYearVision && !newYearVision) {
      dispatch({
        type: actionTypes.SET_USER_DATA,
        payload: {
          ...initialUser,
          yearVision: existingYearVision,
          dreamBook: initialUser.dreamBook || state.currentUser.dreamBook || [],
          connects: initialUser.connects || state.currentUser.connects || []
        }
      });
      return;
    }
    
    // Only dispatch if there are actual changes
    const hasChanges = 
      initialUser.name !== state.currentUser.name ||
      initialUser.email !== state.currentUser.email ||
      initialUser.office !== state.currentUser.office ||
      (initialUser.yearVision && initialUser.yearVision !== state.currentUser.yearVision) ||
      (initialUser.dreamBook && JSON.stringify(initialUser.dreamBook) !== JSON.stringify(state.currentUser.dreamBook)) ||
      (initialUser.connects && JSON.stringify(initialUser.connects) !== JSON.stringify(state.currentUser.connects));
    
    if (hasChanges) {
      dispatch({
        type: actionTypes.SET_USER_DATA,
        payload: {
          ...initialUser,
          yearVision: initialUser.yearVision || state.currentUser?.yearVision || '',
          dreamBook: initialUser.dreamBook || state.currentUser.dreamBook || [],
          connects: initialUser.connects || state.currentUser.connects || []
        }
      });
    }
  }, [initialUser?.id, initialUser?.name, initialUser?.email, initialUser?.office, initialUser?.yearVision, state.currentUser?.id, state.currentUser?.name, state.currentUser?.email, state.currentUser?.office]);

  // Debounced save function to avoid too many localStorage writes
  const saveTimeoutRef = useRef(null);

  // Save profile data only (NOT items - those are saved via itemService)
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (state.currentUser?.id && state.currentUser?.dataStructureVersion) {
        const { 
          dreamCategories,
          dreamBook,
          weeklyGoals: _wg,
          scoringHistory: _sh,
          connects,
          careerGoals,
          developmentPlan,
          ...profileData 
        } = state.currentUser;
        
        const dataToSave = {
          ...profileData,
          dataStructureVersion: profileData.dataStructureVersion || 2,
          lastUpdated: new Date().toISOString()
        };
        
        saveUserData(dataToSave, state.currentUser.id);
      }
    }, 300);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.isAuthenticated, state.currentUser?.id, state.currentUser?.name, state.currentUser?.email, state.currentUser?.office, state.currentUser?.score]);

  // Listen for vision-updated events to sync context state
  const currentUserRef = useRef(null);
  
  useEffect(() => {
    currentUserRef.current = state.currentUser;
  }, [state.currentUser?.id, state.currentUser?.yearVision]);
  
  useEffect(() => {
    const handleVisionUpdated = (event) => {
      const newVision = event.detail?.vision || '';
      const currentUser = currentUserRef.current;
      
      if (currentUser && currentUser.yearVision !== newVision) {
        dispatch({
          type: actionTypes.SET_USER_DATA,
          payload: {
            ...currentUser,
            yearVision: newVision
          }
        });
      }
    };

    window.addEventListener('vision-updated', handleVisionUpdated);
    return () => {
      window.removeEventListener('vision-updated', handleVisionUpdated);
    };
  }, []); // Empty deps - event listener doesn't need to re-register

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
      if (!state.currentUser?.dreamBook) return;
      const dream = state.currentUser.dreamBook.find(d => d.id === dreamId);
      if (dream) {
        const updatedDream = { ...dream, progress: newProgress };
        
        dispatch({ type: actionTypes.UPDATE_DREAM, payload: updatedDream });
        
        const userId = state.currentUser?.id;
        if (userId) {
          const updatedDreams = state.currentUser.dreamBook.map(d => 
            d.id === dreamId ? updatedDream : d
          );
          
          const templates = state.weeklyGoals?.filter(g => 
            g.type === 'weekly_goal_template'
          ) || [];
          
          const result = await itemService.saveDreams(userId, updatedDreams, templates);
          if (!result.success) {
            console.error('Failed to update dream progress in database:', result.error);
            return;
          }
        }
        
        // Check if dream is completed
        if (newProgress === 100 && dream.progress !== 100) {
          const completionEntry = {
            id: Date.now() + 1,
            type: 'dreamCompleted',
            title: `Completed "${dream.title}"`,
            points: state.scoringRules.dreamCompleted,
            date: new Date().toISOString().split('T')[0],
            category: dream.category
          };
          dispatch({ type: actionTypes.ADD_SCORING_ENTRY, payload: completionEntry });
          
          const completionScore = state.currentUser.score + state.scoringRules.dreamCompleted;
          dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: completionScore });
        }
      }
    },

    logWeeklyCompletion: async (goalId, isoWeek, completed) => {
      dispatch({ 
        type: actionTypes.LOG_WEEKLY_COMPLETION, 
        payload: { goalId, isoWeek, completed } 
      });
      
      if (!state.currentUser?.dreamBook || !state.weeklyGoals) return;
      
      const weeklyGoal = state.weeklyGoals.find(g => g.id === goalId);
      if (weeklyGoal?.goalId && weeklyGoal?.dreamId) {
        const dream = state.currentUser.dreamBook.find(d => d.id === weeklyGoal.dreamId);
        if (dream) {
          const goal = dream.goals?.find(g => g.id === weeklyGoal.goalId);
          if (goal?.type === 'consistency' && goal?.startDate) {
            const newStreak = computeStreak(
              { ...(weeklyGoal.weekLog || {}), [isoWeek]: completed },
              goal.startDate
            );
            
            if (goal.targetWeeks && newStreak >= goal.targetWeeks && !goal.completed) {
              const updatedGoal = {
                ...goal,
                completed: true,
                active: false,
                completedAt: new Date().toISOString()
              };
              
              const template = state.weeklyGoals?.find(wg => 
                wg.type === 'weekly_goal_template' && 
                (wg.id === goal.id || wg.goalId === goal.id)
              );
              
              const updatedTemplate = template ? {
                ...template,
                completed: true,
                active: false,
                completedAt: new Date().toISOString()
              } : null;
              
              await actions.updateConsistencyGoalAndTemplate(
                dream.id,
                updatedGoal,
                updatedTemplate
              );
              
              const scoringEntry = {
                id: Date.now(),
                type: 'goalCompleted',
                title: `Completed goal: "${goal.title}"`,
                points: state.scoringRules.milestoneCompleted || 15,
                date: new Date().toISOString().split('T')[0],
                category: dream.category
              };
              dispatch({ type: actionTypes.ADD_SCORING_ENTRY, payload: scoringEntry });
              
              const newScore = state.currentUser.score + (state.scoringRules.milestoneCompleted || 15);
              dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: newScore });
            }
          }
        }
      }
      
      if (completed) {
        const scoringEntry = {
          id: Date.now() + 1,
          type: 'weeklyGoalCompleted',
          title: `Completed weekly goal`,
          points: state.scoringRules.weeklyGoalCompleted || 3,
          date: new Date().toISOString().split('T')[0],
          category: weeklyGoal?.dreamCategory || 'General'
        };
        dispatch({ type: actionTypes.ADD_SCORING_ENTRY, payload: scoringEntry });
        
        const newScore = state.currentUser.score + (state.scoringRules.weeklyGoalCompleted || 3);
        dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: newScore });
      }
    },

    login: () => {
      dispatch({ type: actionTypes.LOGIN });
    },

    logout: () => {
      dispatch({ type: actionTypes.LOGOUT });
    },

    setWeeklyGoals: (goals) => {
      dispatch({ type: actionTypes.SET_WEEKLY_GOALS, payload: goals });
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
