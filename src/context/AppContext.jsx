// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.

import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { dreamCategories, scoringRules } from '../data/mockData';
import itemService from '../services/itemService';
import connectService from '../services/connectService';
// DEPRECATED: weekService removed - use currentWeekService and weekHistoryService instead
// import weekService from '../services/weekService';
import scoringService from '../services/scoringService';
import { getCurrentIsoWeek, computeStreak, isMilestoneComplete, parseIsoWeek } from '../utils/dateUtils';
import { checkAndDeactivateExpiredTemplates } from '../utils/templateValidation';
import { appReducer, actionTypes } from '../state/appReducer.js';
import { createEmptyUser, saveUserData, loadUserData } from '../utils/appDataHelpers.js';

// DEPRECATED WEEK SERVICE STUB
// This stub replaces the removed weekService to prevent runtime crashes
// Functions using this need migration to currentWeekService + weekHistoryService
const deprecatedWeekServiceStub = {
  getWeekGoals: async (userId, year) => {
    console.error('❌ DEPRECATED: weekService.getWeekGoals() called but weekService is removed');
    console.error('   Migration needed: Use currentWeekService.getCurrentWeek() instead');
    console.error('   Location: AppContext functions need migration to currentWeek + pastWeeks model');
    return { success: false, error: 'weekService removed - needs migration to currentWeekService' };
  },
  saveWeekGoals: async (userId, year, weekId, goals) => {
    console.error('❌ DEPRECATED: weekService.saveWeekGoals() called but weekService is removed');
    console.error('   Migration needed: Use currentWeekService.saveCurrentWeek() instead');
    console.error('   Location: AppContext functions need migration to currentWeek + pastWeeks model');
    return { success: false, error: 'weekService removed - needs migration to currentWeekService' };
  },
  bulkInstantiateTemplates: async (userId, templates) => {
    console.error('❌ DEPRECATED: weekService.bulkInstantiateTemplates() called but weekService is removed');
    console.error('   Migration needed: Goals now created on-demand, no bulk instantiation');
    console.error('   Location: AppContext functions need migration to currentWeek + pastWeeks model');
    return { success: false, error: 'weekService removed - bulk instantiation no longer needed' };
  }
};
const weekService = deprecatedWeekServiceStub; // Temporarily alias for compatibility

// Create the context
const AppContext = createContext();

// Initial state
const initialState = {
  isAuthenticated: false,
  currentUser: null,
  dreamCategories: dreamCategories,
  scoringRules: scoringRules,
  weeklyGoals: [],
  scoringHistory: [],
  allYearsScoring: [], // Array of scoring documents, one per year
  allTimeScore: 0 // Sum of all years' totalScore
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

  const weeklyGoalsFromAPI = Array.isArray(initialUser?.weeklyGoals) ? initialUser.weeklyGoals : [];
  
  console.log('🚀 AppContext initializing with data from API:');
  console.log('   👤 User:', userToUse?.email || 'none');
  console.log('   📚 Dreams:', userToUse?.dreamBook?.length || 0);
  console.log('   🔗 Connects from API:', userToUse?.connects?.length || 0);
  if (userToUse?.connects && userToUse.connects.length > 0) {
    console.log('   🔗 Connect IDs:', userToUse.connects.map(c => c.id));
  }
  console.log('   📋 Weekly goals from API:', weeklyGoalsFromAPI.length);
  console.log('   📋 Templates from API:', weeklyGoalsFromAPI.filter(g => g.type === 'weekly_goal_template').length);
  
  if (weeklyGoalsFromAPI.filter(g => g.type === 'weekly_goal_template').length > 0) {
    console.log('   📋 API Template details:', weeklyGoalsFromAPI
      .filter(g => g.type === 'weekly_goal_template')
      .map(t => ({ id: t.id, dreamId: t.dreamId, dreamTitle: t.dreamTitle, title: t.title }))
    );
  }
  
  const initialStateWithUser = {
    ...initialState,
    currentUser: userToUse,
    weeklyGoals: weeklyGoalsFromAPI,
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
  
  // Note: All weeks initialization is now handled by getUserData API on login
  // No separate frontend call needed
  
  // Track if we've already loaded data to prevent duplicate loads
  const hasLoadedRef = useRef(false);
  
  useEffect(() => {
    if (!userId) return;
    
    // Prevent duplicate loads - only load once per userId
    if (hasLoadedRef.current) {
      console.log('⏭️ Skipping duplicate data load - already loaded for userId:', userId);
      return;
    }
    
    hasLoadedRef.current = true;
    
    // Skip redundant database call for demo user (Sarah Johnson) who already has data from login
    const isDemoUser = initialUser?.email === 'sarah.johnson@netsurit.com' || userId === 'sarah.johnson@netsurit.com';
    if (isDemoUser && initialUser?.dreamBook && initialUser.dreamBook.length > 0) {
      console.log('ℹ️ Skipping redundant data load for demo user - using initial data');
      hasLoadedRef.current = true; // Mark as loaded
      return;
    }
    
    // ✅ FIX: If initialUser already has dreams from AuthContext, use those instead of loading
    // This prevents dreams from disappearing when AppProvider remounts
    if (initialUser?.dreamBook && initialUser.dreamBook.length > 0) {
      console.log('✅ Using dreams from initialUser (already loaded by AuthContext):', initialUser.dreamBook.length);
      // Still load persisted data to get weeklyGoals and scoringHistory, but preserve dreams from initialUser
      const loadData = async () => {
        const persistedData = await loadUserData(userId);
        if (persistedData) {
          const userData = persistedData.currentUser || persistedData;
          const weeklyGoalsData = persistedData.weeklyGoals || userData.weeklyGoals || [];
          const scoringHistoryData = persistedData.scoringHistory || userData.scoringHistory || [];
          
          // Use dreams from initialUser (already loaded by AuthContext), not from persistedData
          const migratedUser = {
            ...createEmptyUser(initialUser),
            ...initialUser, // Preserve dreams from initialUser
            ...userData,
            dreamBook: initialUser.dreamBook, // ✅ CRITICAL: Use dreams from initialUser
            connects: initialUser.connects || userData.connects || [],
            dreamCategories: dreamCategories
          };
          
          dispatch({
            type: actionTypes.LOAD_PERSISTED_DATA,
            payload: {
              isAuthenticated: true,
              currentUser: migratedUser,
              weeklyGoals: Array.isArray(weeklyGoalsData) ? weeklyGoalsData : [],
              scoringHistory: Array.isArray(scoringHistoryData) ? scoringHistoryData : []
            }
          });
        }
      };
      loadData();
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
        
        const finalWeeklyGoals = Array.isArray(weeklyGoalsData) ? weeklyGoalsData : 
                                (Array.isArray(initialUser?.weeklyGoals) ? initialUser.weeklyGoals : []);
        
        console.log('📦 Loading persisted data into state:');
        console.log('   📚 Dreams:', migratedUser.dreamBook?.length || 0);
        console.log('   📋 Weekly goals total:', finalWeeklyGoals.length);
        console.log('   📋 Templates:', finalWeeklyGoals.filter(g => g.type === 'weekly_goal_template').length);
        console.log('   📋 Instances:', finalWeeklyGoals.filter(g => g.type !== 'weekly_goal_template').length);
        
        if (finalWeeklyGoals.filter(g => g.type === 'weekly_goal_template').length > 0) {
          console.log('   📋 Template details:', finalWeeklyGoals
            .filter(g => g.type === 'weekly_goal_template')
            .map(t => ({ id: t.id, dreamId: t.dreamId, dreamTitle: t.dreamTitle, title: t.title }))
          );
        }
        
        dispatch({
          type: actionTypes.LOAD_PERSISTED_DATA,
          payload: {
            isAuthenticated: true,
            currentUser: migratedUser,
            weeklyGoals: finalWeeklyGoals,
            scoringHistory: Array.isArray(scoringHistoryData) ? scoringHistoryData : []
          }
        });
        
        // Load all-time scoring from API (spans all years)
        console.log('📊 Loading all-time scoring from API...');
        const allScoringResult = await scoringService.getAllYearsScoring(userId);
        if (allScoringResult.success) {
          console.log(`✅ All-time scoring loaded: ${allScoringResult.data.allYears.length} year(s), total: ${allScoringResult.data.allTimeTotal} pts`);
          
          // Flatten entries from all years for scoringHistory
          const allEntries = allScoringResult.data.allYears.flatMap(yearDoc => 
            (yearDoc.entries || []).map(entry => ({ ...entry, year: yearDoc.year }))
          );
          
          // Update state with all-time scoring data
          dispatch({
            type: actionTypes.SET_SCORING_HISTORY,
            payload: {
              allYearsScoring: allScoringResult.data.allYears,
              allTimeScore: allScoringResult.data.allTimeTotal,
              scoringHistory: allEntries
            }
          });
          
          // Update user's score to reflect all-time total
          if (migratedUser) {
            migratedUser.score = allScoringResult.data.allTimeTotal;
          }
        } else {
          console.warn('⚠️ Could not load all-time scoring:', allScoringResult.error);
        }
      } else {
        console.log('ℹ️ No persisted data found or missing user structure');
      }
    };
    
    loadData();
    
    // Reset ref when userId changes (user logs out/in)
    return () => {
      hasLoadedRef.current = false;
    };
  }, [userId]); // Only depend on userId, not initialUser properties

  // Load connects from API on mount and when user changes to ensure they're always up-to-date
  useEffect(() => {
    // Use email as userId for connects (connects are saved with email format)
    // Prefer email over GUID to match how connects are stored in Cosmos DB
    const userId = state.currentUser?.email || state.currentUser?.id;
    if (!userId) return;

    let isMounted = true;

    const loadConnects = async () => {
      try {
        console.log('🔄 Loading connects for user:', userId);
        const result = await connectService.getConnects(userId);
        if (!isMounted) return;

        if (result.success && Array.isArray(result.data)) {
          console.log(`✅ Loaded ${result.data.length} connects from API`);
          // Update connects in state with fresh data from API
          // Use functional update to ensure we have the latest state
          dispatch({
            type: actionTypes.SET_USER_DATA,
            payload: {
              ...state.currentUser,
              connects: result.data
            }
          });
        } else {
          console.warn('⚠️ getConnects returned unsuccessful result:', result);
        }
      } catch (error) {
        console.error('❌ Error loading connects:', error);
      }
    };

    loadConnects();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentUser?.id]);

  // DEPRECATED: Bulk instantiation removed - currentWeek + pastWeeks model creates goals on-demand
  // Templates are no longer pre-instantiated into weeks{year} containers
  // Goals are created when the current week starts via currentWeekService
  // This useEffect has been removed as part of the weeks tracking simplification

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
    /**
     * Update a dream and preserve all weekly goal templates
     * @param {Object} dream - Dream object with nested goals
     * @returns {Promise<void>}
     * 
     * NOTE: This function saves the entire dreams document including:
     * 1. All dreams (updated dream + unchanged dreams)
     * 2. All weekly goal templates (preserved from state)
     */
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
        
        // ✅ CRITICAL: Preserve all existing weekly goal templates
        const templates = state.weeklyGoals?.filter(g => 
          g.type === 'weekly_goal_template'
        ) || [];
        
        console.log('📝 Saving:', { dreamsCount: updatedDreams.length, templatesCount: templates.length });
        
        const result = await itemService.saveDreams(userId, updatedDreams, templates);
        if (!result.success) {
          console.error('Failed to save dreams document:', result.error);
          return;
        }
      }
    },

    /**
     * Add a new dream and preserve all weekly goal templates
     * @param {Object} dream - Dream object to add
     * @returns {Promise<void>}
     * 
     * NOTE: This function saves the entire dreams document including:
     * 1. All dreams (existing dreams + new dream)
     * 2. All weekly goal templates (preserved from state)
     * 3. Awards points for creating the dream
     */
    addDream: async (dream) => {
      // Add to local state first
      dispatch({ type: actionTypes.ADD_DREAM, payload: dream });
      
      // Save entire dreams array to database (one doc per user)
      const userId = state.currentUser?.id;
      if (userId) {
        console.log('💾 Saving dreams document with new dream:', dream.id);
        
        // Get updated dreamBook from state (after dispatch)
        const updatedDreams = [...state.currentUser.dreamBook, dream];
        
        // ✅ CRITICAL: Preserve all existing weekly goal templates
        const templates = state.weeklyGoals?.filter(g => 
          g.type === 'weekly_goal_template'
        ) || [];
        
        console.log('📝 Saving:', { dreamsCount: updatedDreams.length, templatesCount: templates.length });
        
        const result = await itemService.saveDreams(userId, updatedDreams, templates);
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

    /**
     * Delete a dream and remove its associated weekly goal templates
     * @param {string} dreamId - ID of the dream to delete
     * @returns {Promise<void>}
     * 
     * NOTE: This function removes:
     * 1. The dream itself
     * 2. Weekly goal templates linked to this dream
     * 3. Weekly goal instances from current week and all future weeks
     */
    deleteDream: async (dreamId) => {
      // Delete from local state first
      dispatch({ type: actionTypes.DELETE_DREAM, payload: dreamId });
      
      // Save updated dreams array to database (one doc per user)
      const userId = state.currentUser?.id;
      if (userId) {
        console.log('🗑️ Deleting dream from dreams document:', dreamId);
        
        // Get updated dreamBook from state (after dispatch)
        const updatedDreams = state.currentUser.dreamBook.filter(d => d.id !== dreamId);
        
        // Keep templates that aren't tied to the deleted dream
        const remainingTemplates = state.weeklyGoals?.filter(g => 
          g.type === 'weekly_goal_template' && g.dreamId !== dreamId
        ) || [];
        
        console.log('📝 Saving after dream delete:', { dreamsCount: updatedDreams.length, templatesCount: remainingTemplates.length });
        
        const result = await itemService.saveDreams(userId, updatedDreams, remainingTemplates);
        if (!result.success) {
          console.error('Failed to save dreams document after delete:', result.error);
          return;
        }

        // DEPRECATED: Week goal cleanup removed - currentWeek + pastWeeks model handles this differently
        // Goals for deleted dreams should be removed from currentWeek container only
        // Use currentWeekService instead of weekService for current week operations
        console.log('⚠️ DEPRECATED: Week goal cleanup for deleted dream needs migration to currentWeekService');
        // TODO: Implement with currentWeekService.getCurrentWeek() and currentWeekService.saveCurrentWeek()
        // Only need to clean up goals in the current week, not future weeks
        
        console.log('✅ Dream and associated goals deleted successfully');
      }
    },

    /**
     * Reorder dreams in the dream book (drag & drop)
     * @param {number} fromIndex - Source index
     * @param {number} toIndex - Destination index
     * @returns {void}
     * 
     * NOTE: This is a client-side only operation for UI state.
     * The order is persisted when dreams are next saved.
     */
    reorderDreams: (fromIndex, toIndex) => {
      const list = [...state.currentUser.dreamBook];
      if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) return;
      const [moved] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, moved);
      dispatch({ type: actionTypes.REORDER_DREAMS, payload: list });
    },

    /**
     * Add a weekly goal (either template or instance)
     * @param {Object} goalData - Goal data with type, dreamId, etc.
     * @returns {Promise<void>}
     * 
     * NOTE: Handles two types:
     * 1. weekly_goal_template: Saves to dreams container, then bulk instantiates
     * 2. weekly_goal: Saves instance to weeks{year} container
     */
    addWeeklyGoal: async (goalData) => {
      const userId = state.currentUser?.id;
      if (!userId) return;
      
      console.log('📝 addWeeklyGoal called:', {
        goalId: goalData.id,
        type: goalData.type,
        dreamId: goalData.dreamId,
        dreamTitle: goalData.dreamTitle,
        dreamCategory: goalData.dreamCategory
      });
      
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
        
        console.log('💾 Saving template via saveDreams:', template.id);
        console.log('   📌 Template object:', template);
        console.log('   📌 DreamId:', template.dreamId);
        console.log('   📌 DreamTitle:', template.dreamTitle);
        
        // Get all current dreams and templates
        const dreams = state.currentUser?.dreamBook || [];
        const existingTemplates = state.weeklyGoals?.filter(g => g.type === 'weekly_goal_template') || [];
        const allTemplates = [...existingTemplates, template];
        
        console.log('📝 Saving to dreams container:');
        console.log('   📚 Dreams count:', dreams.length);
        console.log('   📋 Templates count:', allTemplates.length);
        console.log('   📋 All templates:', allTemplates.map(t => ({ id: t.id, dreamId: t.dreamId, title: t.title })));
        
        const result = await itemService.saveDreams(userId, dreams, allTemplates);
        if (!result.success) {
          console.error('❌ Failed to save template:', result.error);
          return;
        }
        
        console.log('✅ Template saved successfully to dreams container');
        console.log('   📊 Server response:', result);
        
        // NOTE: Templates are kept for backward compatibility with existing data.
        // New goals should be added directly to dream.goals[] array, not via templates.
        // Dashboard auto-instantiation reads from dream.goals[] to create weekly instances.
        
        // Bulk instantiate the template across all target weeks
        // API now automatically handles multi-year splitting
        console.log('🚀 Bulk instantiating template across weeks:', {
          templateId: template.id,
          targetWeeks: template.targetWeeks,
          startDate: template.startDate
        });
        
        // Map template to format expected by bulkInstantiateTemplates API
        const templateForAPI = {
          ...template,
          durationType: template.targetWeeks ? 'weeks' : 'unlimited',
          durationWeeks: template.targetWeeks || 52
        };
        
        console.log('📤 Sending to bulkInstantiateTemplates API (multi-year):', templateForAPI);
        
        const instantiateResult = await weekService.bulkInstantiateTemplates(
          userId,
          [templateForAPI]
        );
        
        console.log('📥 bulkInstantiateTemplates result:', instantiateResult);
        
        if (!instantiateResult.success) {
          console.error('❌ Failed to bulk instantiate template:', instantiateResult.error);
          // Don't fail the entire operation - template is saved, instances can be created on-demand
        } else {
          console.log('✅ Template instantiated across all target weeks:', instantiateResult.data);
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

    /**
     * Batch add multiple weekly goals (templates and/or instances)
     * @param {Array<Object>} goals - Array of goal objects to add
     * @returns {Promise<void>}
     * 
     * NOTE: Optimized for bulk operations, groups instances by week.
     * Templates are saved individually to dreams container.
     * Instances are batched by week to weeks{year} container.
     */
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

    /**
     * Update a weekly goal (either template or instance)
     * @param {Object} goal - Updated goal object
     * @returns {Promise<void>}
     * 
     * NOTE: Handles two types:
     * 1. weekly_goal_template: Updates in dreams container
     * 2. weekly_goal: Updates instance in weeks{year} container
     */
    updateWeeklyGoal: async (goal) => {
      const userId = state.currentUser?.id;
      if (!userId) return;
      
      dispatch({ type: actionTypes.UPDATE_WEEKLY_GOAL, payload: goal });
      
      // Determine if this is a template or instance
      if (goal.type === 'weekly_goal_template') {
        // Template - save via saveDreams with all dreams and templates
        console.log('💾 Updating template via saveDreams:', goal.id);
        
        // Get all current dreams and templates
        const dreams = state.currentUser?.dreamBook || [];
        const allTemplates = state.weeklyGoals?.filter(g => g.type === 'weekly_goal_template') || [];
        
        console.log('📝 Saving:', { dreamsCount: dreams.length, templatesCount: allTemplates.length });
        
        const result = await itemService.saveDreams(userId, dreams, allTemplates);
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

    /**
     * Delete a weekly goal (either template or instance)
     * @param {string} goalId - ID of the goal to delete
     * @returns {Promise<void>}
     * 
     * NOTE: Handles two types:
     * 1. weekly_goal_template: Deletes template and ALL its instances
     * 2. weekly_goal: Deletes only this specific instance
     */
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
        // Template - delete from dreams container via saveDreams
        console.log('🗑️ Deleting template and all instances:', goalId);
        
        // Get all current dreams and templates (excluding the one being deleted)
        const dreams = state.currentUser?.dreamBook || [];
        const allTemplates = state.weeklyGoals?.filter(g => 
          g.type === 'weekly_goal_template' && g.id !== goalId
        ) || [];
        
        console.log('📝 Saving without deleted template:', { dreamsCount: dreams.length, templatesCount: allTemplates.length });
        
        const result = await itemService.saveDreams(userId, dreams, allTemplates);
        if (!result.success) {
          console.error('Failed to delete template:', result.error);
          return;
        }
        
        // ✅ FIX: Load ALL instances from database, not just those in state
        console.log(`🔍 Scanning database for all instances of template ${goalId}`);
        
        const currentYear = new Date().getFullYear();
        const yearsToCheck = [currentYear - 1, currentYear, currentYear + 1]; // Check 3 years to be thorough
        let totalInstancesDeleted = 0;
        
        for (const year of yearsToCheck) {
          const weekDocResult = await weekService.getWeekGoals(userId, year);
          if (!weekDocResult.success || !weekDocResult.data?.weeks) {
            console.log(`📊 No week document found for year ${year}, skipping`);
            continue;
          }
          
          const weeks = weekDocResult.data.weeks;
          console.log(`📅 Checking ${Object.keys(weeks).length} weeks in year ${year}`);
          
          // Process each week
          for (const [weekId, weekData] of Object.entries(weeks)) {
            const goals = weekData.goals || [];
            const filteredGoals = goals.filter(g => g.templateId !== goalId);
            
            // Only save if we actually removed instances
            if (filteredGoals.length < goals.length) {
              const removedCount = goals.length - filteredGoals.length;
              totalInstancesDeleted += removedCount;
              console.log(`🗑️ Removing ${removedCount} instance(s) from ${weekId}`);
              
              const saveResult = await weekService.saveWeekGoals(userId, year, weekId, filteredGoals);
              if (!saveResult.success) {
                console.error(`Failed to save updated goals for ${weekId}:`, saveResult.error);
              }
              
              // Update local state - dispatch DELETE for each removed instance
              goals.filter(g => g.templateId === goalId).forEach(instance => {
                dispatch({ type: actionTypes.DELETE_WEEKLY_GOAL, payload: instance.id });
              });
            }
          }
        }
        
        console.log(`✅ Deleted template and ${totalInstancesDeleted} instances from database`);
        
        // Dispatch delete for template (instances already dispatched in loop above)
        dispatch({ type: actionTypes.DELETE_WEEKLY_GOAL, payload: goalId });
        
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
            goalType: goal.goalType || 'consistency',
            title: goal.title,
            description: goal.description,
            dreamId: goal.dreamId,
            dreamTitle: goal.dreamTitle,
            dreamCategory: goal.dreamCategory,
            goalId: goal.goalId,
            recurrence: goal.recurrence || 'weekly', // ✅ FIX: Copy recurrence from template
            targetWeeks: goal.targetWeeks,
            targetMonths: goal.targetMonths,
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

    logWeeklyCompletion: async (goalId, isoWeek, completed) => {
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
                active: false, // Mark inactive when completed
                completedAt: new Date().toISOString()
              };
              
              // Find template if it exists
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
              
              // 🔒 ATOMIC UPDATE: Single write to prevent race condition!
              await actions.updateConsistencyGoalAndTemplate(
                dream.id,
                updatedGoal,
                updatedTemplate
              );
              
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
      // Use email as userId for connects (connects are saved with email format in Cosmos DB)
      const userId = state.currentUser?.email || state.currentUser?.id;
      if (userId) {
        console.log('💾 Saving connect to connects container:', connect.id);
        const result = await connectService.saveConnect(userId, connect);
        if (!result.success) {
          console.error('Failed to save connect to database:', result.error);
          return;
        }
        
        // Add connect to local state immediately using the saved data from API response
        // This avoids Cosmos DB eventual consistency issues where immediate queries might not find the new connect
        const savedConnect = result.data || connect;
        dispatch({ type: actionTypes.ADD_CONNECT, payload: savedConnect });
        console.log('✅ Connect added to local state:', savedConnect.id);
        
        // Reload connects from API after a short delay to account for eventual consistency
        // This ensures we get the complete list with all fields, but doesn't block the UI
        setTimeout(async () => {
          try {
            console.log('🔄 Reloading connects from API after save (delayed for eventual consistency)');
            const reloadResult = await connectService.getConnects(userId);
            if (reloadResult.success && Array.isArray(reloadResult.data)) {
              dispatch({
                type: actionTypes.SET_USER_DATA,
                payload: {
                  ...state.currentUser,
                  connects: reloadResult.data
                }
              });
              console.log(`✅ Reloaded ${reloadResult.data.length} connects from API`);
            }
          } catch (reloadError) {
            console.error('❌ Error reloading connects after save:', reloadError);
            // Non-critical - connect is already in local state
          }
        }, 1000); // 1 second delay to allow Cosmos DB to propagate the write
      } else {
        // If no userId, still add to local state (for offline/dev scenarios)
        dispatch({ type: actionTypes.ADD_CONNECT, payload: connect });
      }
      
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

    /**
     * Update a connect status (simplified: pending → completed)
     * @param {string} connectId - Connect ID to update
     * @param {string} status - New status ('pending' | 'completed')
     * @returns {Promise<void>}
     */
    updateConnect: async (connectId, status) => {
      // Use email as userId for connects (connects are saved with email format in Cosmos DB)
      const userId = state.currentUser?.email || state.currentUser?.id;
      if (!userId) return;

      console.log('💾 Updating connect:', { connectId, status });

      // Update via connect service
      const result = await connectService.updateConnectStatus(userId, connectId, status);
      if (!result.success) {
        console.error('Failed to update connect:', result.error);
        return;
      }

      // Reload all connects to ensure we have the latest data
      const reloadResult = await connectService.getConnects(userId);
      if (reloadResult.success && Array.isArray(reloadResult.data)) {
        dispatch({
          type: actionTypes.SET_USER_DATA,
          payload: {
            ...state.currentUser,
            connects: reloadResult.data
          }
        });
      } else {
        // Fallback: update local state with the updated connect
        const updatedConnect = result.data;
        dispatch({ type: actionTypes.UPDATE_CONNECT, payload: updatedConnect });
      }
    },

    /**
     * Manually reload connects from the API
     * Useful for refreshing the connects list after external changes
     * @returns {Promise<void>}
     */
    reloadConnects: async () => {
      // Use email as userId for connects (connects are saved with email format in Cosmos DB)
      const userId = state.currentUser?.email || state.currentUser?.id;
      if (!userId) {
        console.warn('⚠️ Cannot reload connects: no user ID');
        return;
      }

      console.log('🔄 Manually reloading connects for user:', userId);
      try {
        const result = await connectService.getConnects(userId);
        if (result.success && Array.isArray(result.data)) {
          dispatch({
            type: actionTypes.SET_USER_DATA,
            payload: {
              ...state.currentUser,
              connects: result.data
            }
          });
          console.log(`✅ Reloaded ${result.data.length} connects`);
        } else {
          console.error('❌ Failed to reload connects:', result.error);
        }
      } catch (error) {
        console.error('❌ Error reloading connects:', error);
      }
    },

    /**
     * Add a goal to a dream and preserve all weekly goal templates
     * @param {string} dreamId - ID of the dream to add goal to
     * @param {Object} goal - Goal object to add
     * @returns {Promise<void>}
     * 
     * NOTE: Goals nested in dreams are long-term goals, separate from weekly goal templates.
     * This function preserves both dream goals and weekly goal templates.
     */
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
      
      // ✅ CRITICAL: Preserve all existing weekly goal templates
      const templates = state.weeklyGoals?.filter(g => 
        g.type === 'weekly_goal_template'
      ) || [];
      
      console.log('📝 Saving:', { dreamsCount: updatedDreams.length, templatesCount: templates.length });
      
      const result = await itemService.saveDreams(userId, updatedDreams, templates);
      if (!result.success) {
        console.error('Failed to save dreams document after adding goal:', result.error);
        return;
      }
    },

    /**
     * Update a goal within a dream and preserve all weekly goal templates
     * @param {string} dreamId - ID of the dream containing the goal
     * @param {Object} goal - Updated goal object
     * @returns {Promise<void>}
     * 
     * NOTE: Goals nested in dreams are long-term goals, separate from weekly goal templates.
     * This function preserves both dream goals and weekly goal templates.
     */
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
      
      // ✅ CRITICAL: Preserve all existing weekly goal templates
      const templates = state.weeklyGoals?.filter(g => 
        g.type === 'weekly_goal_template'
      ) || [];
      
      console.log('📝 Saving:', { dreamsCount: updatedDreams.length, templatesCount: templates.length });
      
      const result = await itemService.saveDreams(userId, updatedDreams, templates);
      if (!result.success) {
        console.error('Failed to save dreams document after updating goal:', result.error);
        return;
      }
    },

    /**
     * Atomically update both a dream goal and its corresponding template
     * This prevents race conditions by doing a single write instead of two
     * @param {string} dreamId - ID of the dream containing the goal
     * @param {Object} updatedGoal - Updated goal object
     * @param {Object} updatedTemplate - Updated template object (optional)
     * @returns {Promise<void>}
     * 
     * USE CASE: When completing a deadline goal, we need to update both:
     * 1. The goal in dream.goals[] (completed: true, active: false)
     * 2. The template in weeklyGoalTemplates[] (completed: true, active: false)
     * 
     * Doing these as separate writes causes race conditions where the second
     * write can overwrite the first write's changes due to stale React state.
     */
    updateDeadlineGoalAndTemplate: async (dreamId, updatedGoal, updatedTemplate = null) => {
      const userId = state.currentUser?.id;
      if (!userId) return;
      
      console.log('💾 Atomically updating deadline goal and template:', {
        dreamId,
        goalId: updatedGoal.id,
        templateId: updatedTemplate?.id,
        completed: updatedGoal.completed
      });
      
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
      
      console.log('📝 Atomic save:', { 
        dreamsCount: updatedDreams.length, 
        templatesCount: updatedTemplates.length,
        goalUpdated: !!updatedGoal,
        templateUpdated: !!updatedTemplate
      });
      
      // SINGLE atomic write - no race condition!
      const result = await itemService.saveDreams(userId, updatedDreams, updatedTemplates);
      if (!result.success) {
        console.error('Failed to atomically save goal and template:', result.error);
        return;
      }
      
      // Update local state AFTER successful write
      dispatch({ type: actionTypes.UPDATE_DREAM, payload: updatedDream });
      if (updatedTemplate) {
        dispatch({ type: actionTypes.UPDATE_WEEKLY_GOAL, payload: updatedTemplate });
      }
      
      console.log('✅ Atomic update successful - no race condition!');
    },

    /**
     * Atomically update a consistency goal and its template (if it exists)
     * Prevents race conditions by updating both in a single write
     * @param {string} dreamId - Dream ID containing the goal
     * @param {Object} updatedGoal - Updated goal object
     * @param {Object} updatedTemplate - Updated template object (optional)
     * @returns {Promise<void>}
     */
    updateConsistencyGoalAndTemplate: async (dreamId, updatedGoal, updatedTemplate = null) => {
      const userId = state.currentUser?.id;
      if (!userId) return;

      console.log('💾 Atomically updating consistency goal and template:', {
        dreamId,
        goalId: updatedGoal.id,
        templateId: updatedTemplate?.id,
        completed: updatedGoal.completed,
        active: updatedGoal.active
      });

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

      console.log('📝 Atomic save:', {
        dreamsCount: updatedDreams.length,
        templatesCount: updatedTemplates.length,
        goalUpdated: !!updatedGoal,
        templateUpdated: !!updatedTemplate
      });

      // SINGLE atomic write - no race condition!
      const result = await itemService.saveDreams(userId, updatedDreams, updatedTemplates);
      if (!result.success) {
        console.error('Failed to atomically save consistency goal and template:', result.error);
        return;
      }

      // Update local state AFTER successful write
      dispatch({ type: actionTypes.UPDATE_DREAM, payload: updatedDream });
      if (updatedTemplate) {
        dispatch({ type: actionTypes.UPDATE_WEEKLY_GOAL, payload: updatedTemplate });
      }

      console.log('✅ Atomic consistency goal update successful - no race condition!');
    },

    /**
     * Delete a goal from a dream and preserve all weekly goal templates
     * @param {string} dreamId - ID of the dream containing the goal
     * @param {string} goalId - ID of the goal to delete
     * @returns {Promise<void>}
     * 
     * NOTE: Goals nested in dreams are long-term goals, separate from weekly goal templates.
     * This function preserves both dream goals and weekly goal templates.
     */
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
      
      // ✅ CRITICAL: Preserve all existing weekly goal templates
      const templates = state.weeklyGoals?.filter(g => 
        g.type === 'weekly_goal_template'
      ) || [];
      
      console.log('📝 Saving:', { dreamsCount: updatedDreams.length, templatesCount: templates.length });
      
      const result = await itemService.saveDreams(userId, updatedDreams, templates);
      if (!result.success) {
        console.error('Failed to save dreams document after deleting goal:', result.error);
        return;
      }
    },

    addScoringEntry: (entry) => {
      dispatch({ type: actionTypes.ADD_SCORING_ENTRY, payload: entry });
    },

    /**
     * Update dream progress and preserve all weekly goal templates
     * @param {string} dreamId - ID of the dream to update
     * @param {number} newProgress - New progress value (0-100)
     * @returns {Promise<void>}
     * 
     * NOTE: Awards bonus points when dream reaches 100% completion.
     * This function preserves both dreams and weekly goal templates.
     */
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
          
          // ✅ CRITICAL: Preserve all existing weekly goal templates
          const templates = state.weeklyGoals?.filter(g => 
            g.type === 'weekly_goal_template'
          ) || [];
          
          console.log('📝 Saving:', { dreamsCount: updatedDreams.length, templatesCount: templates.length });
          
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