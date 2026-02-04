/**
 * AppContext Configuration
 * Constants and initial state definitions
 */

// Default dream categories (global, not per-user)
export const DEFAULT_DREAM_CATEGORIES = [
  'Health',
  'Career',
  'Finance',
  'Travel',
  'Learning',
  'Relationships',
  'Creative',
  'Community',
  'Personal Growth',
  'Spiritual',
  'Other'
];

// Scoring rules - points awarded for different activities
export const SCORING_RULES = {
  dreamCompleted: 10,   // +10 for completing a dream
  dreamConnect: 5,      // +5 for dream connects
  groupAttendance: 3    // +3 for group attendance
};

// Initial state for AppContext
export const initialState = {
  isAuthenticated: false,
  currentUser: null,
  weeklyGoals: [],
  scoringHistory: [],
  allYearsScoring: [],
  allTimeScore: 0,
  dreamCategories: DEFAULT_DREAM_CATEGORIES,
  // Loading states for explicit data loading tracking
  loading: {
    dreams: false,
    connects: false,
    weeklyGoals: false,
    scoring: false,
    user: false
  },
  // Track which data sources have been loaded (for race condition handling)
  dataLoaded: {
    dreams: { loaded: false, source: null, timestamp: null },
    connects: { loaded: false, source: null, timestamp: null },
    weeklyGoals: { loaded: false, source: null, timestamp: null },
    scoring: { loaded: false, source: null, timestamp: null }
  }
};
