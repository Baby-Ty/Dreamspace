import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { currentUser as initialUserData, allUsers, dreamCategories, scoringRules } from '../data/mockData';

// Create the context
const AppContext = createContext();

// Action types
const actionTypes = {
  SET_USER_DATA: 'SET_USER_DATA',
  UPDATE_DREAM: 'UPDATE_DREAM',
  ADD_DREAM: 'ADD_DREAM',
  DELETE_DREAM: 'DELETE_DREAM',
    REORDER_DREAMS: 'REORDER_DREAMS',
  UPDATE_USER_SCORE: 'UPDATE_USER_SCORE',
  ADD_CONNECT: 'ADD_CONNECT',
  SET_WEEKLY_GOALS: 'SET_WEEKLY_GOALS',
  ADD_WEEKLY_GOAL: 'ADD_WEEKLY_GOAL',
  UPDATE_WEEKLY_GOAL: 'UPDATE_WEEKLY_GOAL',
  DELETE_WEEKLY_GOAL: 'DELETE_WEEKLY_GOAL',
  TOGGLE_WEEKLY_GOAL: 'TOGGLE_WEEKLY_GOAL',
  SET_SCORING_HISTORY: 'SET_SCORING_HISTORY',
  ADD_SCORING_ENTRY: 'ADD_SCORING_ENTRY',
  LOAD_PERSISTED_DATA: 'LOAD_PERSISTED_DATA',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT'
};

// Initial state
const initialState = {
  isAuthenticated: false,
  currentUser: initialUserData,
  allUsers: allUsers,
  dreamCategories: dreamCategories,
  scoringRules: scoringRules,
  weeklyGoals: [
    {
      id: 1001,
      title: 'Hit the gym 3 times',
      description: 'Two strength sessions and one cardio day',
      dreamId: 1,
      dreamTitle: 'Stick to a Gym Routine',
      dreamCategory: 'Health',
      completed: true,
      createdAt: '2024-01-22T09:00:00Z'
    },
    {
      id: 1002,
      title: 'Read 50 pages',
      description: 'Chip away at this month’s book',
      dreamId: 3,
      dreamTitle: 'Read a Book a Month',
      dreamCategory: 'Learning',
      completed: false,
      createdAt: '2024-01-22T09:05:00Z'
    },
    {
      id: 1003,
      title: 'Price flights to Peru',
      description: 'Compare Cape Town ↔ Lima options and note prices',
      dreamId: 2,
      dreamTitle: 'Visit Machu Picchu',
      dreamCategory: 'Travel',
      completed: false,
      createdAt: '2024-01-22T09:10:00Z'
    },
    {
      id: 1004,
      title: 'Join Mothership mailing list',
      description: 'Get alerts for upcoming shows in Austin',
      dreamId: 4,
      dreamTitle: 'See a Comedy Show at the Mothership',
      dreamCategory: 'Travel',
      completed: false,
      createdAt: '2024-01-22T09:15:00Z'
    }
  ],
  scoringHistory: [
    {
      id: 1,
      type: 'dreamCompleted',
      title: 'Completed "Learn Basic Spanish"',
      points: scoringRules.dreamCompleted,
      date: '2024-01-20',
      category: 'Learning'
    },
    {
      id: 2,
      type: 'dreamConnect',
      title: 'Dream Connect with Mike Chen',
      points: scoringRules.dreamConnect,
      date: '2024-01-15',
      category: 'Connect'
    },
    {
      id: 3,
      type: 'journalEntry',
      title: 'Updated marathon training progress',
      points: scoringRules.journalEntry,
      date: '2024-01-14',
      category: 'Progress Update'
    },
    {
      id: 4,
      type: 'groupAttendance',
      title: 'Attended Dreams Workshop',
      points: scoringRules.groupAttendance,
      date: '2024-01-10',
      category: 'Workshop'
    },
    {
      id: 5,
      type: 'dreamConnect',
      title: 'Dream Connect with Emma Wilson',
      points: scoringRules.dreamConnect,
      date: '2024-01-08',
      category: 'Connect'
    },
    {
      id: 6,
      type: 'journalEntry',
      title: 'Added new dream "Visit Japan"',
      points: scoringRules.journalEntry,
      date: '2024-01-05',
      category: 'New Dream'
    }
  ]
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.LOAD_PERSISTED_DATA:
      return {
        ...state,
        ...action.payload
      };

    case actionTypes.SET_USER_DATA:
      return {
        ...state,
        currentUser: action.payload
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
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          dreamBook: [...state.currentUser.dreamBook, action.payload]
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

    case actionTypes.SET_SCORING_HISTORY:
      return {
        ...state,
        scoringHistory: action.payload
      };

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

    default:
      return state;
  }
};

// Local storage helpers
const LOCAL_STORAGE_KEY = 'dreamspace_app_data';

const saveToLocalStorage = (data) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    // Notify listeners that a save occurred without relying on console overrides
    window.dispatchEvent(new Event('dreamspace:saved'));
  } catch (error) {
    console.warn('❌ Could not save to localStorage:', error);
  }
};

const loadFromLocalStorage = () => {
  try {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      console.log('📦 Data loaded from localStorage');
      return JSON.parse(savedData);
    }
    return null;
  } catch (error) {
    console.warn('❌ Could not load from localStorage:', error);
    return null;
  }
};

// App Context Provider
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Debounced save function to avoid too many localStorage writes
  const saveTimeoutRef = useRef(null);

  // Load persisted data on mount
  useEffect(() => {
    const persistedData = loadFromLocalStorage();
    if (persistedData) {
      dispatch({
        type: actionTypes.LOAD_PERSISTED_DATA,
        payload: persistedData
      });
    }
  }, []);

  // Save to localStorage whenever state changes (debounced)
  useEffect(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      // Prepare data for persistence (exclude static data)
      const dataToSave = {
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
        weeklyGoals: state.weeklyGoals,
        scoringHistory: state.scoringHistory
      };
      
      saveToLocalStorage(dataToSave);
    }, 300); // 300ms debounce
    
    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.isAuthenticated, state.currentUser, state.weeklyGoals, state.scoringHistory]);

  // Action creators
  const actions = {
    updateDream: (dream) => {
      dispatch({ type: actionTypes.UPDATE_DREAM, payload: dream });
    },

    addDream: (dream) => {
      dispatch({ type: actionTypes.ADD_DREAM, payload: dream });
      
      // Add scoring entry for new dream
      const scoringEntry = {
        id: Date.now(),
        type: 'journalEntry',
        title: `Added new dream "${dream.title}"`,
        points: state.scoringRules.journalEntry,
        date: new Date().toISOString().split('T')[0],
        category: 'New Dream'
      };
      dispatch({ type: actionTypes.ADD_SCORING_ENTRY, payload: scoringEntry });
      
      // Update user score
      const newScore = state.currentUser.score + state.scoringRules.journalEntry;
      dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: newScore });
    },

    deleteDream: (dreamId) => {
      dispatch({ type: actionTypes.DELETE_DREAM, payload: dreamId });
    },

    reorderDreams: (fromIndex, toIndex) => {
      const list = [...state.currentUser.dreamBook];
      if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) return;
      const [moved] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, moved);
      dispatch({ type: actionTypes.REORDER_DREAMS, payload: list });
    },

    addWeeklyGoal: (goalData) => {
      const goal = {
        id: Date.now(),
        ...goalData,
        completed: false,
        dateCreated: new Date().toISOString().split('T')[0]
      };
      dispatch({ type: actionTypes.ADD_WEEKLY_GOAL, payload: goal });
    },

    updateWeeklyGoal: (goal) => {
      dispatch({ type: actionTypes.UPDATE_WEEKLY_GOAL, payload: goal });
    },

    deleteWeeklyGoal: (goalId) => {
      dispatch({ type: actionTypes.DELETE_WEEKLY_GOAL, payload: goalId });
    },

    toggleWeeklyGoal: (goalId) => {
      dispatch({ type: actionTypes.TOGGLE_WEEKLY_GOAL, payload: goalId });
    },

    updateUserScore: (newScore) => {
      dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: newScore });
    },

    addConnect: (connect) => {
      dispatch({ type: actionTypes.ADD_CONNECT, payload: connect });
      
      // Add scoring entry for connect
      const scoringEntry = {
        id: Date.now(),
        type: 'dreamConnect',
        title: `Dream Connect with ${connect.withWhom}`,
        points: state.scoringRules.dreamConnect,
        date: new Date().toISOString().split('T')[0],
        category: 'Connect'
      };
      dispatch({ type: actionTypes.ADD_SCORING_ENTRY, payload: scoringEntry });
      
      // Update user score
      const newScore = state.currentUser.score + state.scoringRules.dreamConnect;
      dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: newScore });
    },

    addScoringEntry: (entry) => {
      dispatch({ type: actionTypes.ADD_SCORING_ENTRY, payload: entry });
    },

    updateDreamProgress: (dreamId, newProgress) => {
      const dream = state.currentUser.dreamBook.find(d => d.id === dreamId);
      if (dream) {
        const updatedDream = { ...dream, progress: newProgress };
        dispatch({ type: actionTypes.UPDATE_DREAM, payload: updatedDream });
        
        // Add scoring entry for progress update
        const scoringEntry = {
          id: Date.now(),
          type: 'journalEntry',
          title: `Updated "${dream.title}" progress to ${newProgress}%`,
          points: state.scoringRules.journalEntry,
          date: new Date().toISOString().split('T')[0],
          category: 'Progress Update'
        };
        dispatch({ type: actionTypes.ADD_SCORING_ENTRY, payload: scoringEntry });
        
        // Update user score
        const newScore = state.currentUser.score + state.scoringRules.journalEntry;
        dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: newScore });
        
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
          
          // Update user score for completion
          const completionScore = newScore + state.scoringRules.dreamCompleted;
          dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: completionScore });
        }
      }
    },

    login: () => {
      dispatch({ type: actionTypes.LOGIN });
    },

    logout: () => {
      dispatch({ type: actionTypes.LOGOUT });
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