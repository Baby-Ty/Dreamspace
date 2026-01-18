/**
 * Central schema exports
 * All Zod schemas and parsers for DreamSpace data models
 * 
 * Usage:
 *   import { parseDreamList, parseUserData } from '@/schemas';
 *   const dreams = parseDreamList(apiData);
 */

// Microsoft Graph schemas
export {
  UserSchema,
  MeSchema,
  UserListSchema
} from './graph.js';

// Dream schemas
export {
  DreamSchema,
  DreamListSchema,
  MilestoneSchema,
  NoteSchema,
  HistorySchema,
  parseDream,
  parseDreamList,
  parseMilestone,
  parseNote
} from './dream.js';

// Person schemas
export {
  PersonSchema,
  PersonListSchema,
  ConnectSchema,
  ConnectListSchema,
  WeeklyGoalSchema,
  WeeklyGoalListSchema,
  ConnectionSuggestionSchema,
  ConnectionSuggestionListSchema,
  parsePerson,
  parsePersonList,
  parseConnect,
  parseConnectList,
  parseWeeklyGoal,
  parseWeeklyGoalList,
  parseConnectionSuggestion,
  parseConnectionSuggestionList
} from './person.js';

// Team/Coach schemas
export {
  CoachSchema,
  CoachListSchema,
  TeamMemberSchema,
  TeamMemberListSchema,
  TeamMetricsSchema,
  CoachingAlertSchema,
  CoachingAlertListSchema,
  TeamRelationshipSchema,
  TeamRelationshipListSchema,
  parseCoach,
  parseCoachList,
  parseTeamMember,
  parseTeamMemberList,
  parseTeamMetrics,
  parseCoachingAlert,
  parseCoachingAlertList,
  parseTeamRelationship,
  parseTeamRelationshipList
} from './team.js';

// User data (composite schema)
export {
  UserDataSchema,
  ScoringHistorySchema,
  parseUserData,
  parseScoringHistoryList,
  validateUserData
} from './userData.js';

/**
 * Quick reference guide:
 * 
 * DREAMS & GOALS
 * - parseDreamList(data) → Dream[]
 * 
 * PEOPLE & TEAMS
 * - parsePersonList(data) → Person[]
 * - parseCoachList(data) → Coach[]
 * - parseTeamMemberList(data) → TeamMember[]
 * 
 * CONNECTIONS & SOCIAL
 * - parseConnectList(data) → Connect[]
 * - parseConnectionSuggestionList(data) → ConnectionSuggestion[]
 * 
 * COMPLETE USER DATA
 * - parseUserData(data) → UserData
 * - validateUserData(data) → { valid, errors? }
 * 
 * All parsers are safe and return valid defaults on error.
 */
