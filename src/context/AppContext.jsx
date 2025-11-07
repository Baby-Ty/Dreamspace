import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { dreamCategories, scoringRules } from '../data/mockData';
import databaseService from '../services/databaseService';
import itemService from '../services/itemService';
import connectService from '../services/connectService';
import weekService from '../services/weekService';
import scoringService from '../services/scoringService';
import { getCurrentIsoWeek, computeStreak, isMilestoneComplete } from '../utils/dateUtils';
import { checkAndDeactivateExpiredTemplates } from '../utils/templateValidation';

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
  LOG_WEEKLY_COMPLETION: 'LOG_WEEKLY_COMPLETION',
  UPDATE_MILESTONE_STREAK: 'UPDATE_MILESTONE_STREAK',
  SET_SCORING_HISTORY: 'SET_SCORING_HISTORY',
  ADD_SCORING_ENTRY: 'ADD_SCORING_ENTRY',
  LOAD_PERSISTED_DATA: 'LOAD_PERSISTED_DATA',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  // Career-related action types removed - not in this version
};

// Create empty user template for real users
const createEmptyUser = (userInfo = {}) => ({
  id: userInfo.id || null,
  userId: userInfo.userId || null, // Preserve userId from Cosmos DB
  name: userInfo.name || '',
  email: userInfo.email || '',
  office: userInfo.office || '',
  avatar: userInfo.avatar || '',
  dreamBook: userInfo.dreamBook || [],
  score: userInfo.score || 0,
  connects: userInfo.connects || [],
  // Use global dreamCategories - don't store per user
  dreamCategories: dreamCategories,
  dreamsCount: userInfo.dreamsCount || 0,
  connectsCount: userInfo.connectsCount || 0
  // Career fields removed - not in this version
});

// Initial state
const initialState = {
  isAuthenticated: false,
  currentUser: null,
  dreamCategories: dreamCategories,
  scoringRules: scoringRules,
  weeklyGoals: [],
  scoringHistory: []
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

    // UPDATE_MILESTONE_STREAK is deprecated - goals track completion directly now
    case actionTypes.UPDATE_MILESTONE_STREAK:
      console.warn('UPDATE_MILESTONE_STREAK is deprecated - goals track completion directly');
      return state;

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

    // Career-related reducer cases removed - not in this version

    default:
      return state;
  }
};

// Database helpers - now supports both localStorage and Azure Cosmos DB
const saveUserData = async (data, userId) => {
  try {
    if (userId) {
      await databaseService.saveUserData(userId, data);
    }
  } catch (error) {
    console.warn('❌ Could not save user data:', error);
  }
};

const loadUserData = async (userId) => {
  try {
    if (!userId) return null;
    
    const savedData = await databaseService.loadUserData(userId);
    if (savedData) {
      console.log(`📦 Data loaded for user ${userId}`);
      // Unwrap the { success: true, data: {...} } response from databaseService
      if (savedData.success && savedData.data) {
        return savedData.data;
      }
      return savedData;
    }
    return null;
  } catch (error) {
    console.warn('❌ Could not load user data:', error);
    return null;
  }
};

// App Context Provider
export const AppProvider = ({ children, initialUser }) => {
  // For real users, create empty profile. For demo users, use provided data.
  const userToUse = initialUser ? {
    ...createEmptyUser(initialUser),
    // Preserve ALL existing data from initialUser (especially from Cosmos DB)
    ...initialUser,
    // Ensure arrays exist
    dreamBook: initialUser.dreamBook || [],
    score: initialUser.score || 0,
    connects: initialUser.connects || [],
    // Use global dreamCategories instead of per-user categories
    dreamCategories: dreamCategories,
    dreamsCount: initialUser.dreamsCount || 0,
    connectsCount: initialUser.connectsCount || 0
    // Career fields removed - not in this version
  } : null;

  const initialStateWithUser = {
    ...initialState,
    currentUser: userToUse,
    weeklyGoals: Array.isArray(initialUser?.weeklyGoals) ? initialUser.weeklyGoals : [],
    isAuthenticated: !!initialUser
  };

  const [state, dispatch] = useReducer(appReducer, initialStateWithUser);
  
  // Debounced save function to avoid too many localStorage writes
  const saveTimeoutRef = useRef(null);

  // Load persisted data on mount
  const userId = initialUser ? (initialUser.id || initialUser.userId) : null;
  
  // DEBUG: Log userId to see if it's email or GUID
  console.log('🔍 AppContext userId:', userId);
  console.log('🔍 initialUser.id:', initialUser?.id);
  console.log('🔍 initialUser.aadObjectId:', initialUser?.aadObjectId);
  
  // Initialize weeks document on mount
  useEffect(() => {
    if (!userId) return;
    
    const initializeWeeksDocument = async () => {
      const currentYear = new Date().getFullYear();
      console.log(`📅 Initializing weeks document for ${userId}, year ${currentYear}`);
      
      try {
        const weekService = (await import('../services/weekService.js')).default;
        const result = await weekService.getWeekGoals(userId, currentYear);
        
        if (result.success) {
          console.log(`✅ Weeks document verified/created for ${userId}:`, {
            documentId: result.data?.id,
            year: result.data?.year,
            weeksCount: Object.keys(result.data?.weeks || {}).length
          });
          
          // Verify document actually exists by checking the structure
          if (!result.data || !result.data.id) {
            console.error('⚠️ Document created but has invalid structure:', result.data);
          }
        } else {
          console.error('❌ Failed to initialize weeks document:', result.error);
          alert(`Failed to initialize weeks document: ${result.error}. Goals may not work correctly.`);
        }
      } catch (error) {
        console.error('❌ Error initializing weeks document:', error);
        alert(`Error initializing weeks document: ${error.message}. Goals may not work correctly.`);
      }
    };
    
    initializeWeeksDocument();
  }, [userId]);
  
  useEffect(() => {
    if (!userId) return;
    
    // Skip redundant database call for demo user (Sarah Johnson) who already has data from login
    const isDemoUser = initialUser?.email === 'sarah.johnson@netsurit.com' || userId === 'sarah.johnson@netsurit.com';
    if (isDemoUser && initialUser?.dreamBook && initialUser.dreamBook.length > 0) {
      console.log('ℹ️ Skipping redundant data load for demo user - using initial data');
      return;
    }
    
    const loadData = async () => {
      const persistedData = await loadUserData(userId);
      console.log('📦 Persisted data loaded:', persistedData);
      
      // Handle both wrapped and unwrapped data formats
      let userData = null;
      let weeklyGoalsData = [];
      let scoringHistoryData = [];
      
      if (persistedData) {
        // Check if data is wrapped in currentUser (old format)
        if (persistedData.currentUser) {
          console.log('📦 Found wrapped data format (currentUser property)');
          userData = persistedData.currentUser;
          weeklyGoalsData = persistedData.weeklyGoals || [];
          scoringHistoryData = persistedData.scoringHistory || [];
        } 
        // Check if data is the user object directly (v2 format from Cosmos DB)
        else if (persistedData.id && persistedData.email) {
          console.log('📦 Found v2 data format (direct user object)');
          userData = persistedData;
          weeklyGoalsData = persistedData.weeklyGoals || [];
          scoringHistoryData = persistedData.scoringHistory || [];
        }
      }
      
      if (userData) {
        console.log('✅ Found persisted user data, loading...');
        console.log('📚 Dreams in persisted data:', userData.dreamBook?.length || 0);
        
        // Ensure the persisted user data has all required fields
        const migratedUser = {
          ...createEmptyUser(initialUser),
          ...userData,
          // Ensure arrays exist
          dreamBook: userData.dreamBook || [],
          connects: userData.connects || [],
          // Use global dreamCategories, not per-user
          dreamCategories: dreamCategories
          // Career fields removed - not in this version
        };
        
        console.log('📚 Dreams after migration:', migratedUser.dreamBook?.length || 0);
        
        dispatch({
          type: actionTypes.LOAD_PERSISTED_DATA,
          payload: {
            isAuthenticated: true,
            currentUser: migratedUser,
            weeklyGoals: Array.isArray(weeklyGoalsData) ? weeklyGoalsData : 
                        (Array.isArray(initialUser?.weeklyGoals) ? initialUser.weeklyGoals : []),
            scoringHistory: Array.isArray(scoringHistoryData) ? scoringHistoryData : []
          }
        });
      } else {
        console.log('ℹ️ No persisted data found or missing user structure');
      }
    };
    
    loadData();
  }, [userId]);

  // Save profile data only (NOT items - those are saved via itemService)
  useEffect(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      // Only save if we have a user ID AND the user has been loaded from database
      // Skip save if this is a fresh load (dataStructureVersion will be set by AuthContext initial save)
      if (state.currentUser?.id && state.currentUser?.dataStructureVersion) {
        // In v2+ architecture, we ONLY save profile data here
        // Items (dreams, goals, etc.) are saved individually via itemService
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
          dataStructureVersion: profileData.dataStructureVersion || 2, // Preserve existing version
          lastUpdated: new Date().toISOString()
        };
        
        console.log('💾 Saving user profile (v2+ - items saved separately via itemService)');
        
        saveUserData(dataToSave, state.currentUser.id);
      } else if (state.currentUser?.id && !state.currentUser?.dataStructureVersion) {
        console.log('⏭️  Skipping auto-save for new user (already saved by AuthContext)');
      }
    }, 300); // 300ms debounce
    
    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.isAuthenticated, state.currentUser.id, state.currentUser.name, state.currentUser.email, state.currentUser.office, state.currentUser.score]);

  // Action creators
  const actions = {
    updateDream: async (dream) => {
      // Update local state first
      dispatch({ type: actionTypes.UPDATE_DREAM, payload: dream });
      
      // Save entire dreams array to database (one doc per user)
      const userId = state.currentUser?.id;
      if (userId) {
        console.log('💾 Saving dreams document after update:', dream.id);
        
        // Get updated dreamBook from state (after dispatch)
        const updatedDreams = state.currentUser.dreamBook.map(d => 
          d.id === dream.id ? dream : d
        );
        
        // No templates needed - goals are tracked directly by goalId
        const result = await itemService.saveDreams(userId, updatedDreams, []);
        if (!result.success) {
          console.error('Failed to save dreams document:', result.error);
          return;
        }
      }
    },

    addDream: async (dream) => {
      // Add to local state first
      dispatch({ type: actionTypes.ADD_DREAM, payload: dream });
      
      // Save entire dreams array to database (one doc per user)
      const userId = state.currentUser?.id;
      if (userId) {
        console.log('💾 Saving dreams document with new dream:', dream.id);
        
        // Get updated dreamBook from state (after dispatch)
        const updatedDreams = [...state.currentUser.dreamBook, dream];
        
        // No templates needed - goals are tracked directly by goalId in weekly completions
        const result = await itemService.saveDreams(userId, updatedDreams, []);
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
        
        await scoringService.addScoringEntry(userId, currentYear, entry);
        dispatch({ type: actionTypes.ADD_SCORING_ENTRY, payload: entry });
        
        const newScore = state.currentUser.score + points;
        dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: newScore });
      }
    },

    deleteDream: async (dreamId) => {
      // Delete from local state first
      dispatch({ type: actionTypes.DELETE_DREAM, payload: dreamId });
      
      // Save updated dreams array to database (one doc per user)
      const userId = state.currentUser?.id;
      if (userId) {
        console.log('🗑️ Deleting dream from dreams document:', dreamId);
        
        // Get updated dreamBook from state (after dispatch)
        const updatedDreams = state.currentUser.dreamBook.filter(d => d.id !== dreamId);
        
        // No templates needed - goals are tracked directly by goalId
        const result = await itemService.saveDreams(userId, updatedDreams, []);
        if (!result.success) {
          console.error('Failed to save dreams document after delete:', result.error);
          return;
        }
      }
    },

    reorderDreams: (fromIndex, toIndex) => {
      const list = [...state.currentUser.dreamBook];
      if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) return;
      const [moved] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, moved);
      dispatch({ type: actionTypes.REORDER_DREAMS, payload: list });
    },

    addWeeklyGoal: async (goalData) => {
      const userId = state.currentUser?.id;
      if (!userId) return;
      
      // Determine if this is a template or instance
      if (goalData.type === 'weekly_goal_template') {
        // Template - save individually to dreams container via itemService
        const template = {
          id: goalData.id || `template_${Date.now()}`,
          ...goalData,
          type: 'weekly_goal_template',
          createdAt: goalData.createdAt || new Date().toISOString()
        };
        
        dispatch({ type: actionTypes.ADD_WEEKLY_GOAL, payload: template });
        
        console.log('💾 Saving template individually:', template.id);
        
        const result = await itemService.saveItem(userId, 'weekly_goal_template', template);
        if (!result.success) {
          console.error('Failed to save template:', result.error);
          return;
        }
      } else {
        // Instance - save to weeks container
        if (!goalData.weekId) {
          console.error('weekId is required for weekly goal instances');
          return;
        }
        
        const goal = {
          id: goalData.id || `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: goalData.type || 'weekly_goal',
          ...goalData,
          completed: goalData.completed !== undefined ? goalData.completed : false,
          createdAt: goalData.createdAt || new Date().toISOString()
        };
        
        // Extract year from weekId (e.g., "2025-W43" -> 2025)
        const year = parseInt(goalData.weekId.split('-')[0]);
        
        // Load existing goals for this week and append the new goal
        const weekDocResult = await weekService.getWeekGoals(userId, year);
        const existingGoals = weekDocResult.success && weekDocResult.data?.weeks?.[goalData.weekId]?.goals || [];
        
        // Check for duplicate
        const isDuplicate = existingGoals.some(g => g.id === goal.id);
        if (isDuplicate) {
          console.log('⚠️ Goal already exists, skipping:', goal.id);
          return;
        }
        
        const allGoals = [...existingGoals, goal];
        
        console.log('💾 Saving goal to weeks container:', goal.id, goalData.weekId, `(${existingGoals.length} existing)`);
        const result = await weekService.saveWeekGoals(userId, year, goalData.weekId, allGoals);
        if (!result.success) {
          console.error('Failed to save goal to weeks container:', result.error);
          return;
        }
        
        dispatch({ type: actionTypes.ADD_WEEKLY_GOAL, payload: { ...goal, weekId: goalData.weekId }});
      }
    },

    addWeeklyGoalsBatch: async (goals) => {
      const userId = state.currentUser?.id;
      if (!userId) return;
      
      console.log(`📦 Batch adding ${goals.length} goals`);
      
      // Group goals by weekId to batch save to weeks container
      const goalsByWeek = {};
      const templates = [];
      
      for (const goalData of goals) {
        if (goalData.type === 'weekly_goal_template') {
          // Template - save individually
          templates.push(goalData);
        } else if (goalData.weekId) {
          // Instance - group by week
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
        
        const result = await itemService.saveItem(userId, 'weekly_goal_template', templateToSave);
        if (!result.success) {
          console.error('Failed to save template:', result.error);
        }
      }
      
      // Save instances by week (batch per week)
      for (const [weekId, weekGoals] of Object.entries(goalsByWeek)) {
        const year = parseInt(weekId.split('-')[0]);
        
        // Load existing goals for this week
        const weekDocResult = await weekService.getWeekGoals(userId, year);
        const existingGoals = weekDocResult.success && weekDocResult.data?.weeks?.[weekId]?.goals || [];
        
        // Merge existing and new goals (avoid duplicates)
        const existingIds = new Set(existingGoals.map(g => g.id));
        const newGoals = weekGoals.filter(g => !existingIds.has(g.id));
        const allGoals = [...existingGoals, ...newGoals];
        
        console.log(`💾 Batch saving ${newGoals.length} new goals to ${weekId} (${existingGoals.length} existing)`);
        
        const result = await weekService.saveWeekGoals(userId, year, weekId, allGoals);
        if (result.success) {
          // Dispatch ADD for each new goal
          newGoals.forEach(goal => {
            dispatch({ type: actionTypes.ADD_WEEKLY_GOAL, payload: { ...goal, weekId } });
          });
        } else {
          console.error(`Failed to save goals for ${weekId}:`, result.error);
        }
      }
      
      console.log(`✅ Batch add complete: ${templates.length} templates, ${Object.keys(goalsByWeek).length} weeks`);
    },

    updateWeeklyGoal: async (goal) => {
      const userId = state.currentUser?.id;
      if (!userId) return;
      
      dispatch({ type: actionTypes.UPDATE_WEEKLY_GOAL, payload: goal });
      
      // Determine if this is a template or instance
      if (goal.type === 'weekly_goal_template') {
        // Template - save individually
        console.log('💾 Updating template individually:', goal.id);
        
        const result = await itemService.saveItem(userId, 'weekly_goal_template', goal);
        if (!result.success) {
          console.error('Failed to save template:', result.error);
          return;
        }
      } else if (goal.weekId) {
        // Instance - save to weeks container
        const year = parseInt(goal.weekId.split('-')[0]);
        
        // Get all goals for this week and update the specific one
        const weekGoals = state.weeklyGoals.filter(g => g.weekId === goal.weekId && g.type !== 'weekly_goal_template');
        const updatedWeekGoals = weekGoals.map(g => g.id === goal.id ? goal : g);
        
        console.log('💾 Updating goal in weeks container:', goal.id, goal.weekId);
        const result = await weekService.saveWeekGoals(userId, year, goal.weekId, updatedWeekGoals);
        if (!result.success) {
          console.error('Failed to update goal in weeks container:', result.error);
          return;
        }
      }
    },

    deleteWeeklyGoal: async (goalId) => {
      const userId = state.currentUser?.id;
      if (!userId) return;
      
      // Find the goal to determine if it's a template or instance
      const goal = state.weeklyGoals.find(g => g.id === goalId);
      if (!goal) {
        console.error('Goal not found:', goalId);
        return;
      }
      
      if (goal.type === 'weekly_goal_template') {
        // Template - delete from dreams container and all instances
        console.log('🗑️ Deleting template and all instances:', goalId);
        
        // Delete the template
        const result = await itemService.deleteItem(userId, goalId);
        if (!result.success) {
          console.error('Failed to delete template:', result.error);
          return;
        }
        
        // Find all instances of this template and delete them
        const instances = state.weeklyGoals.filter(g => g.templateId === goalId);
        console.log(`🗑️ Found ${instances.length} instances to delete`);
        
        // Group instances by week for efficient deletion
        const instancesByWeek = {};
        instances.forEach(instance => {
          if (instance.weekId) {
            if (!instancesByWeek[instance.weekId]) {
              instancesByWeek[instance.weekId] = [];
            }
            instancesByWeek[instance.weekId].push(instance.id);
          }
        });
        
        // Delete instances from each week
        for (const [weekId, instanceIds] of Object.entries(instancesByWeek)) {
          const year = parseInt(weekId.split('-')[0]);
          const weekGoals = state.weeklyGoals.filter(g => 
            g.weekId === weekId && g.type !== 'weekly_goal_template' && !instanceIds.includes(g.id)
          );
          
          console.log(`🗑️ Removing ${instanceIds.length} instances from ${weekId}`);
          await weekService.saveWeekGoals(userId, year, weekId, weekGoals);
        }
        
        // Dispatch delete for template and all instances
        dispatch({ type: actionTypes.DELETE_WEEKLY_GOAL, payload: goalId });
        instances.forEach(instance => {
          dispatch({ type: actionTypes.DELETE_WEEKLY_GOAL, payload: instance.id });
        });
        
      } else if (goal.weekId) {
        // Instance - save to weeks container without this goal
        const year = parseInt(goal.weekId.split('-')[0]);
        
        // If this is an instance with a templateId, only delete this specific instance
        // Don't delete the template or other instances
        const weekGoals = state.weeklyGoals.filter(g => 
          g.weekId === goal.weekId && g.type !== 'weekly_goal_template' && g.id !== goalId
        );
        
        console.log('🗑️ Deleting goal instance from weeks container:', goalId);
        const result = await weekService.saveWeekGoals(userId, year, goal.weekId, weekGoals);
        if (!result.success) {
          console.error('Failed to save week goals after delete:', result.error);
          return;
        }
        
        dispatch({ type: actionTypes.DELETE_WEEKLY_GOAL, payload: goalId });
      }
    },

    toggleWeeklyGoal: async (goalId) => {
      // Find the goal to toggle
      const goal = state.weeklyGoals.find(g => g.id === goalId);
      if (!goal) {
        console.error('Goal not found:', goalId);
        return;
      }
      
      const userId = state.currentUser?.id;
      if (!userId) return;
      
      // If it's a template, we need to work with the instance for current week
      if (goal.type === 'weekly_goal_template') {
        const currentWeekIso = getCurrentIsoWeek();
        
        // Find or create instance for current week
        let instance = state.weeklyGoals.find(g => 
          g.templateId === goal.id && g.weekId === currentWeekIso
        );
        
        if (!instance) {
          // Create new instance for this week
          instance = {
            id: `${goal.id}_${currentWeekIso}`,
            type: 'weekly_goal',
            templateId: goal.id,
            title: goal.title,
            description: goal.description,
            dreamId: goal.dreamId,
            dreamTitle: goal.dreamTitle,
            dreamCategory: goal.dreamCategory,
            goalId: goal.goalId,
            weekId: currentWeekIso,
            completed: true, // Mark as complete
            completedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          };
          
          console.log('✅ Creating new instance from template for current week:', currentWeekIso);
          dispatch({ type: actionTypes.ADD_WEEKLY_GOAL, payload: instance });
        } else {
          // Toggle existing instance
          const updatedInstance = {
            ...instance,
            completed: !instance.completed,
            completedAt: !instance.completed ? new Date().toISOString() : undefined
          };
          
          console.log('🔄 Toggling existing instance for week:', currentWeekIso);
          dispatch({ type: actionTypes.UPDATE_WEEKLY_GOAL, payload: updatedInstance });
          instance = updatedInstance;
        }
        
        // Save the instance to weeks container
        const year = parseInt(currentWeekIso.split('-')[0]);
        const weekGoals = state.weeklyGoals.filter(g => 
          g.weekId === currentWeekIso && g.type !== 'weekly_goal_template'
        );
        
        // Add or update the instance in the list
        const instanceExists = weekGoals.some(g => g.id === instance.id);
        const updatedWeekGoals = instanceExists
          ? weekGoals.map(g => g.id === instance.id ? instance : g)
          : [...weekGoals, instance];
        
        console.log('💾 Saving instance to weeks container:', currentWeekIso, instance.id);
        const result = await weekService.saveWeekGoals(userId, year, currentWeekIso, updatedWeekGoals);
        if (!result.success) {
          console.error('Failed to save week goals:', result.error);
          return;
        }
        
        // If goal was just completed, add scoring
        if (instance.completed) {
          const currentYear = new Date().getFullYear();
          const points = scoringService.calculateWeekScoring(instance);
          const entry = scoringService.createScoringEntry(
            'week',
            points,
            `Completed: "${instance.title}"`,
            { weekId: currentWeekIso, dreamId: instance.dreamId }
          );
          
          await scoringService.addScoringEntry(userId, currentYear, entry);
          dispatch({ type: actionTypes.ADD_SCORING_ENTRY, payload: entry });
          
          const newScore = state.currentUser.score + points;
          dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: newScore });
        }
        
      } else if (goal.weekId) {
        // Regular instance - existing logic works fine
        const updatedGoal = {
          ...goal,
          completed: !goal.completed,
          completedAt: !goal.completed ? new Date().toISOString() : undefined
        };
        
        dispatch({ type: actionTypes.UPDATE_WEEKLY_GOAL, payload: updatedGoal });
        
        const year = parseInt(goal.weekId.split('-')[0]);
        const weekGoals = state.weeklyGoals.filter(g => 
          g.weekId === goal.weekId && g.type !== 'weekly_goal_template'
        );
        const updatedWeekGoals = weekGoals.map(g => g.id === goalId ? updatedGoal : g);
        
        console.log('💾 Updating goal in weeks container:', goalId, goal.weekId);
        const result = await weekService.saveWeekGoals(userId, year, goal.weekId, updatedWeekGoals);
        if (!result.success) {
          console.error('Failed to update goal in weeks container:', result.error);
          return;
        }
        
        // If goal was just completed, add scoring
        if (updatedGoal.completed) {
          const currentYear = new Date().getFullYear();
          const points = scoringService.calculateWeekScoring(updatedGoal);
          const entry = scoringService.createScoringEntry(
            'week',
            points,
            `Completed: "${updatedGoal.title}"`,
            { weekId: goal.weekId, dreamId: updatedGoal.dreamId }
          );
          
          await scoringService.addScoringEntry(userId, currentYear, entry);
          dispatch({ type: actionTypes.ADD_SCORING_ENTRY, payload: entry });
          
          const newScore = state.currentUser.score + points;
          dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: newScore });
        }
      }
      
      dispatch({ type: actionTypes.TOGGLE_WEEKLY_GOAL, payload: goalId });
    },

    logWeeklyCompletion: (goalId, isoWeek, completed) => {
      dispatch({ 
        type: actionTypes.LOG_WEEKLY_COMPLETION, 
        payload: { goalId, isoWeek, completed } 
      });
      
      // Find the goal and its linked goal (not milestone - deprecated)
      const weeklyGoal = state.weeklyGoals.find(g => g.id === goalId);
      if (weeklyGoal?.goalId && weeklyGoal?.dreamId) {
        // Find the dream and goal
        const dream = state.currentUser.dreamBook.find(d => d.id === weeklyGoal.dreamId);
        if (dream) {
          const goal = dream.goals?.find(g => g.id === weeklyGoal.goalId);
          if (goal?.type === 'consistency' && goal?.startDate) {
            // Recompute streak
            const newStreak = computeStreak(
              { ...(weeklyGoal.weekLog || {}), [isoWeek]: completed },
              goal.startDate
            );
            
            // Update goal completion status (if reached target)
            if (goal.targetWeeks && newStreak >= goal.targetWeeks && !goal.completed) {
              const updatedGoal = {
                ...goal,
                completed: true,
                completedAt: new Date().toISOString()
              };
              
              // Update dream with completed goal
              const updatedDream = {
                ...dream,
                goals: dream.goals.map(g => g.id === goal.id ? updatedGoal : g)
              };
              
              dispatch({ type: actionTypes.UPDATE_DREAM, payload: updatedDream });
              
              // Add scoring entry for goal completion
              const scoringEntry = {
                id: Date.now(),
                type: 'goalCompleted',
                title: `Completed goal: "${goal.title}"`,
                points: state.scoringRules.milestoneCompleted || 15, // Using milestone points for now
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
      
      // Add scoring for weekly completion
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

    updateUserScore: (newScore) => {
      dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: newScore });
    },

    addConnect: async (connect) => {
      // Save to connects container first
      const userId = state.currentUser?.id;
      if (userId) {
        console.log('💾 Saving connect to connects container:', connect.id);
        const result = await connectService.saveConnect(userId, connect);
        if (!result.success) {
          console.error('Failed to save connect to database:', result.error);
          return;
        }
      }
      
      dispatch({ type: actionTypes.ADD_CONNECT, payload: connect });
      
      // Add scoring entry via scoring service
      const currentYear = new Date().getFullYear();
      const points = scoringService.calculateConnectScoring(connect);
      const entry = scoringService.createScoringEntry(
        'connect',
        points,
        `Dream Connect with ${connect.withWhom}`,
        { connectId: connect.id, dreamId: connect.dreamId }
      );
      
      if (userId) {
        await scoringService.addScoringEntry(userId, currentYear, entry);
      }
      
      // Update local state
      dispatch({ type: actionTypes.ADD_SCORING_ENTRY, payload: entry });
      const newScore = state.currentUser.score + points;
      dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: newScore });
    },

    addGoal: async (dreamId, goal) => {
      const userId = state.currentUser?.id;
      if (!userId) return;
      
      console.log('💾 Adding goal to dream:', dreamId, goal.id);
      
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
      
      // No templates needed - goals are tracked directly by goalId
      const result = await itemService.saveDreams(userId, updatedDreams, []);
      if (!result.success) {
        console.error('Failed to save dreams document after adding goal:', result.error);
        return;
      }
    },

    updateGoal: async (dreamId, goal) => {
      const userId = state.currentUser?.id;
      if (!userId) return;
      
      console.log('💾 Updating goal in dream:', dreamId, goal.id);
      
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
      
      // No templates needed - goals are tracked directly by goalId
      const result = await itemService.saveDreams(userId, updatedDreams, []);
      if (!result.success) {
        console.error('Failed to save dreams document after updating goal:', result.error);
        return;
      }
    },

    deleteGoal: async (dreamId, goalId) => {
      const userId = state.currentUser?.id;
      if (!userId) return;
      
      console.log('🗑️ Deleting goal from dream:', dreamId, goalId);
      
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
      
      // No templates needed - goals are tracked directly by goalId
      const result = await itemService.saveDreams(userId, updatedDreams, []);
      if (!result.success) {
        console.error('Failed to save dreams document after deleting goal:', result.error);
        return;
      }
    },

    addScoringEntry: (entry) => {
      dispatch({ type: actionTypes.ADD_SCORING_ENTRY, payload: entry });
    },

    updateDreamProgress: async (dreamId, newProgress) => {
      const dream = state.currentUser.dreamBook.find(d => d.id === dreamId);
      if (dream) {
        const updatedDream = { ...dream, progress: newProgress };
        
        // Update local state first
        dispatch({ type: actionTypes.UPDATE_DREAM, payload: updatedDream });
        
        // Save entire dreams array to database
        const userId = state.currentUser?.id;
        if (userId) {
          console.log('💾 Updating dream progress in dreams document:', dreamId);
          
          const updatedDreams = state.currentUser.dreamBook.map(d => 
            d.id === dreamId ? updatedDream : d
          );
          
          // No templates needed - goals are tracked directly by goalId
          const result = await itemService.saveDreams(userId, updatedDreams, []);
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
          
          // Update user score for completion
          const completionScore = state.currentUser.score + state.scoringRules.dreamCompleted;
          dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: completionScore });
        }
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
    },

    // Career-related action creators removed - not in this version
  };

  // Note: Templates removed - goals are tracked directly by goalId in weekly completions

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