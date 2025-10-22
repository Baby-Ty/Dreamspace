import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { dreamCategories, scoringRules } from '../data/mockData';
import databaseService from '../services/databaseService';
import { getCurrentIsoWeek, computeStreak, isMilestoneComplete } from '../utils/dateUtils';

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
  UPDATE_CAREER_GOAL: 'UPDATE_CAREER_GOAL',
  UPDATE_DEVELOPMENT_PLAN: 'UPDATE_DEVELOPMENT_PLAN',
  UPDATE_CAREER_PROFILE: 'UPDATE_CAREER_PROFILE',
  ADD_CAREER_HIGHLIGHT: 'ADD_CAREER_HIGHLIGHT',
  UPDATE_SKILL: 'UPDATE_SKILL',
  ADD_SKILL: 'ADD_SKILL',
  ADD_CAREER_GOAL: 'ADD_CAREER_GOAL',
  ADD_DEVELOPMENT_PLAN: 'ADD_DEVELOPMENT_PLAN'
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
  careerGoals: userInfo.careerGoals || [],
  developmentPlan: userInfo.developmentPlan || [],
  score: userInfo.score || 0,
  connects: userInfo.connects || [],
  // Use global dreamCategories - don't store per user
  dreamCategories: dreamCategories,
  dreamsCount: userInfo.dreamsCount || 0,
  connectsCount: userInfo.connectsCount || 0,
  careerProfile: userInfo.careerProfile || {
    currentRole: {
      jobTitle: '',
      department: '',
      startDate: '',
      location: ''
    },
    aspirations: {
      desiredJobTitle: '',
      preferredDepartment: '',
      interestedInRelocation: false,
      preferredGeography: ''
    },
    preferences: {
      wantToDo: [],
      dontWantToDo: [],
      motivators: []
    },
    careerHighlights: [],
    skills: {
      technical: [],
      soft: []
    }
  }
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
      const newWeeklyGoals = [];
      
      // Auto-create TEMPLATES ONLY for consistency milestones
      // Week instances created on-demand when user views that week
      if (newDream.milestones && Array.isArray(newDream.milestones)) {
        newDream.milestones.forEach(milestone => {
          if (milestone.type === 'consistency' && !milestone.completed) {
            const templateId = `goal_milestone_${milestone.id}_${Date.now()}`;
            const nowIso = new Date().toISOString();
            
            const template = {
              id: templateId,
              type: 'weekly_goal_template',
              title: newDream.title,
              description: `Track progress for ${milestone.text}`,
              dreamId: newDream.id,
              dreamTitle: newDream.title,
              dreamCategory: newDream.category,
              milestoneId: milestone.id,
              recurrence: 'weekly',
              active: true,
              durationType: 'unlimited',
              startDate: nowIso,
              createdAt: nowIso
            };
            
            newWeeklyGoals.push(template);
          }
        });
      }
      
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          dreamBook: [...state.currentUser.dreamBook, newDream]
        },
        weeklyGoals: [...state.weeklyGoals, ...newWeeklyGoals]
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

    case actionTypes.UPDATE_MILESTONE_STREAK:
      const { dreamId, milestoneId: mId, newStreak } = action.payload;
      const updatedDreamsWithStreak = state.currentUser.dreamBook.map(dream => {
        if (dream.id === dreamId) {
          const updatedMilestones = dream.milestones.map(milestone => {
            if (milestone.id === mId) {
              const isComplete = isMilestoneComplete(
                { ...milestone, streakWeeks: newStreak },
                dream.progress
              );
              return {
                ...milestone,
                streakWeeks: newStreak,
                completed: isComplete
              };
            }
            return milestone;
          });
          return { ...dream, milestones: updatedMilestones };
        }
        return dream;
      });
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          dreamBook: updatedDreamsWithStreak
        }
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

    case actionTypes.UPDATE_CAREER_GOAL:
      const updatedCareerGoals = state.currentUser.careerGoals.map(goal =>
        goal.id === action.payload.id ? action.payload : goal
      );
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          careerGoals: updatedCareerGoals
        }
      };

    case actionTypes.UPDATE_DEVELOPMENT_PLAN:
      const updatedDevelopmentPlan = state.currentUser.developmentPlan.map(item =>
        item.id === action.payload.id ? action.payload : item
      );
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          developmentPlan: updatedDevelopmentPlan
        }
      };

    case actionTypes.UPDATE_CAREER_PROFILE:
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          careerProfile: {
            ...state.currentUser.careerProfile,
            ...action.payload
          }
        }
      };

    case actionTypes.ADD_CAREER_HIGHLIGHT:
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          careerProfile: {
            ...state.currentUser.careerProfile,
            careerHighlights: [...state.currentUser.careerProfile.careerHighlights, action.payload]
          }
        }
      };

    case actionTypes.UPDATE_SKILL:
      const { skillType, skillIndex, skillData } = action.payload;
      const updatedSkills = [...state.currentUser.careerProfile.skills[skillType]];
      updatedSkills[skillIndex] = skillData;
      
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          careerProfile: {
            ...state.currentUser.careerProfile,
            skills: {
              ...state.currentUser.careerProfile.skills,
              [skillType]: updatedSkills
            }
          }
        }
      };

    case actionTypes.ADD_SKILL:
      const { skillType: newSkillType, skill } = action.payload;
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          careerProfile: {
            ...state.currentUser.careerProfile,
            skills: {
              ...state.currentUser.careerProfile.skills,
              [newSkillType]: [...state.currentUser.careerProfile.skills[newSkillType], skill]
            }
          }
        }
      };

    case actionTypes.ADD_CAREER_GOAL:
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          careerGoals: [...state.currentUser.careerGoals, action.payload]
        }
      };

    case actionTypes.ADD_DEVELOPMENT_PLAN:
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          developmentPlan: [...state.currentUser.developmentPlan, action.payload]
        }
      };

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
    careerGoals: initialUser.careerGoals || [],
    developmentPlan: initialUser.developmentPlan || [],
    score: initialUser.score || 0,
    connects: initialUser.connects || [],
    // Use global dreamCategories instead of per-user categories
    dreamCategories: dreamCategories,
    dreamsCount: initialUser.dreamsCount || 0,
    connectsCount: initialUser.connectsCount || 0,
    careerProfile: {
      ...createEmptyUser().careerProfile,
      ...initialUser.careerProfile
    }
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
      
      if (persistedData && persistedData.currentUser) {
        console.log('✅ Found persisted data with currentUser, loading...');
        console.log('📚 Dreams in persisted data:', persistedData.currentUser.dreamBook?.length || 0);
        
        // Ensure the persisted user data has all required fields
        const migratedUser = {
          ...createEmptyUser(initialUser),
          ...persistedData.currentUser,
          // Ensure arrays exist
          dreamBook: (persistedData.currentUser && persistedData.currentUser.dreamBook) || [],
          careerGoals: (persistedData.currentUser && persistedData.currentUser.careerGoals) || [],
          developmentPlan: (persistedData.currentUser && persistedData.currentUser.developmentPlan) || [],
          connects: (persistedData.currentUser && persistedData.currentUser.connects) || [],
          // Use global dreamCategories, not per-user
          dreamCategories: dreamCategories,
          // Ensure career profile exists with proper structure
          careerProfile: {
            ...createEmptyUser().careerProfile,
            ...(persistedData.currentUser && persistedData.currentUser.careerProfile)
          }
        };
        
        console.log('📚 Dreams after migration:', migratedUser.dreamBook?.length || 0);
        
        dispatch({
          type: actionTypes.LOAD_PERSISTED_DATA,
          payload: {
            ...persistedData,
            currentUser: migratedUser,
            weeklyGoals: Array.isArray(persistedData.weeklyGoals) ? persistedData.weeklyGoals : 
                        (Array.isArray(initialUser?.weeklyGoals) ? initialUser.weeklyGoals : [])
          }
        });
      } else {
        console.log('ℹ️ No persisted data found or missing currentUser structure');
      }
    };
    
    loadData();
  }, [userId]);

  // Save to localStorage whenever state changes (debounced)
  useEffect(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      // Only save if we have a user ID
      if (state.currentUser?.id) {
        // Prepare data for persistence (exclude static data like dreamCategories)
        const { dreamCategories: _, ...userDataWithoutCategories } = state.currentUser;
        const dataToSave = {
          isAuthenticated: state.isAuthenticated,
          currentUser: userDataWithoutCategories,
          weeklyGoals: state.weeklyGoals,
          scoringHistory: state.scoringHistory
        };
        
        console.log('💾 Saving user data:', {
          userId: state.currentUser.id,
          dreamsCount: userDataWithoutCategories.dreamBook?.length || 0,
          weeklyGoalsCount: state.weeklyGoals?.length || 0
        });
        
        saveUserData(dataToSave, state.currentUser.id);
      }
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
      // Validate weekId is present for all new goals
      if (!goalData.weekId) {
        console.error('weekId is required for weekly goals');
        return;
      }
      
      const goal = {
        id: `goal_${Date.now()}`,
        ...goalData,
        completed: false,
        createdAt: new Date().toISOString()
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

    logWeeklyCompletion: (goalId, isoWeek, completed) => {
      dispatch({ 
        type: actionTypes.LOG_WEEKLY_COMPLETION, 
        payload: { goalId, isoWeek, completed } 
      });
      
      // Find the goal and its linked milestone
      const goal = state.weeklyGoals.find(g => g.id === goalId);
      if (goal?.milestoneId && goal?.dreamId) {
        // Find the dream and milestone
        const dream = state.currentUser.dreamBook.find(d => d.id === goal.dreamId);
        if (dream) {
          const milestone = dream.milestones?.find(m => m.id === goal.milestoneId);
          if (milestone?.coachManaged && milestone?.startDate) {
            // Recompute streak
            const newStreak = computeStreak(
              { ...(goal.weekLog || {}), [isoWeek]: completed },
              milestone.startDate
            );
            
            // Update milestone streak
            dispatch({
              type: actionTypes.UPDATE_MILESTONE_STREAK,
              payload: { dreamId: goal.dreamId, milestoneId: goal.milestoneId, newStreak }
            });
            
            // Check if milestone just completed and add scoring entry
            const wasComplete = milestone.streakWeeks >= milestone.targetWeeks;
            const isNowComplete = newStreak >= milestone.targetWeeks;
            
            if (!wasComplete && isNowComplete) {
              const scoringEntry = {
                id: Date.now(),
                type: 'milestoneCompleted',
                title: `Completed milestone: "${milestone.text}"`,
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
      
      // Add scoring for weekly completion
      if (completed) {
        const scoringEntry = {
          id: Date.now() + 1,
          type: 'weeklyGoalCompleted',
          title: `Completed weekly goal`,
          points: state.scoringRules.weeklyGoalCompleted || 3,
          date: new Date().toISOString().split('T')[0],
          category: goal?.dreamCategory || 'General'
        };
        dispatch({ type: actionTypes.ADD_SCORING_ENTRY, payload: scoringEntry });
        
        const newScore = state.currentUser.score + (state.scoringRules.weeklyGoalCompleted || 3);
        dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: newScore });
      }
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

    updateCareerGoal: (goal) => {
      dispatch({ type: actionTypes.UPDATE_CAREER_GOAL, payload: goal });
    },

    updateDevelopmentPlan: (item) => {
      dispatch({ type: actionTypes.UPDATE_DEVELOPMENT_PLAN, payload: item });
    },

    updateCareerProfile: (profileData) => {
      dispatch({ type: actionTypes.UPDATE_CAREER_PROFILE, payload: profileData });
    },

    addCareerHighlight: (highlight) => {
      dispatch({ type: actionTypes.ADD_CAREER_HIGHLIGHT, payload: highlight });
    },

    updateSkill: (skillType, skillIndex, skillData) => {
      dispatch({ type: actionTypes.UPDATE_SKILL, payload: { skillType, skillIndex, skillData } });
    },

    addSkill: (skillType, skill) => {
      dispatch({ type: actionTypes.ADD_SKILL, payload: { skillType, skill } });
    },

    addCareerGoal: (goal) => {
      dispatch({ type: actionTypes.ADD_CAREER_GOAL, payload: goal });
    },

    addDevelopmentPlan: (plan) => {
      dispatch({ type: actionTypes.ADD_DEVELOPMENT_PLAN, payload: plan });
    },

    updateCareerProgress: (itemId, newProgress, type) => {
      const collection = type === 'goal' ? state.currentUser.careerGoals : state.currentUser.developmentPlan;
      const item = collection.find(item => item.id === itemId);
      if (item) {
        const updatedItem = { ...item, progress: newProgress };
        if (type === 'goal') {
          dispatch({ type: actionTypes.UPDATE_CAREER_GOAL, payload: updatedItem });
        } else {
          dispatch({ type: actionTypes.UPDATE_DEVELOPMENT_PLAN, payload: updatedItem });
        }
      }
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