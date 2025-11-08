// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

/**
 * Centralized action type constants for all contexts
 * Organized by domain
 */

// Dream-related action types
export const DREAM_ACTIONS = {
  UPDATE_DREAM: 'UPDATE_DREAM',
  ADD_DREAM: 'ADD_DREAM',
  DELETE_DREAM: 'DELETE_DREAM',
  REORDER_DREAMS: 'REORDER_DREAMS',
};

// Weekly Goals action types
export const WEEK_GOALS_ACTIONS = {
  SET_WEEKLY_GOALS: 'SET_WEEKLY_GOALS',
  ADD_WEEKLY_GOAL: 'ADD_WEEKLY_GOAL',
  ADD_WEEKLY_GOALS_BATCH: 'ADD_WEEKLY_GOALS_BATCH',
  UPDATE_WEEKLY_GOAL: 'UPDATE_WEEKLY_GOAL',
  DELETE_WEEKLY_GOAL: 'DELETE_WEEKLY_GOAL',
  TOGGLE_WEEKLY_GOAL: 'TOGGLE_WEEKLY_GOAL',
  LOG_WEEKLY_COMPLETION: 'LOG_WEEKLY_COMPLETION',
  UPDATE_MILESTONE_STREAK: 'UPDATE_MILESTONE_STREAK',
};

// Connect action types
export const CONNECT_ACTIONS = {
  ADD_CONNECT: 'ADD_CONNECT',
  UPDATE_CONNECT: 'UPDATE_CONNECT',
  DELETE_CONNECT: 'DELETE_CONNECT',
};

// Scoring action types
export const SCORING_ACTIONS = {
  UPDATE_USER_SCORE: 'UPDATE_USER_SCORE',
  SET_SCORING_HISTORY: 'SET_SCORING_HISTORY',
  ADD_SCORING_ENTRY: 'ADD_SCORING_ENTRY',
};

// User/Auth action types
export const USER_ACTIONS = {
  SET_USER_DATA: 'SET_USER_DATA',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOAD_PERSISTED_DATA: 'LOAD_PERSISTED_DATA',
};

// Combined action types object (for backwards compatibility)
export const actionTypes = {
  ...DREAM_ACTIONS,
  ...WEEK_GOALS_ACTIONS,
  ...CONNECT_ACTIONS,
  ...SCORING_ACTIONS,
  ...USER_ACTIONS,
};

export default actionTypes;




