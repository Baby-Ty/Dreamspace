// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { z } from 'zod';
import { DreamListSchema, parseDreamList } from './dream.js';
import { CareerGoalListSchema, DevelopmentPlanListSchema, parseCareerGoalList, parseDevelopmentPlanList } from './career.js';
import { ConnectListSchema, WeeklyGoalListSchema, parseConnectList, parseWeeklyGoalList } from './person.js';

/**
 * Complete user data schema
 * This is the top-level structure saved to Cosmos DB / localStorage
 */

// Scoring history entry
export const ScoringHistorySchema = z.object({
  id: z.union([z.string(), z.number()]),
  date: z.string(),
  score: z.number(),
  activity: z.string(),
  points: z.number(),
  category: z.string().optional()
}).passthrough();

// Complete user data structure
export const UserDataSchema = z.object({
  // Core identity (optional, may come from auth context)
  id: z.union([z.string(), z.number()]).optional(),
  userId: z.union([z.string(), z.number()]).optional(),
  aadObjectId: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  
  // Dream data
  dreamBook: DreamListSchema.default([]),
  dreamCategories: z.array(z.string()).default([]),
  dreamsCount: z.number().default(0),
  
  // Career data
  careerGoals: CareerGoalListSchema.default([]),
  developmentPlan: DevelopmentPlanListSchema.default([]),
  
  // Connections
  connects: ConnectListSchema.default([]),
  connectsCount: z.number().default(0),
  
  // Weekly planning
  weeklyGoals: WeeklyGoalListSchema.default([]),
  
  // Scoring
  score: z.number().default(0),
  scoringHistory: z.array(ScoringHistorySchema).default([]),
  
  // Metadata
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  lastSync: z.string().optional()
}).passthrough();

/**
 * Safe parser for complete user data
 * Returns a valid UserData object with sensible defaults
 */
export function parseUserData(data) {
  // Handle null/undefined
  if (!data) {
    return {
      dreamBook: [],
      dreamCategories: [],
      dreamsCount: 0,
      careerGoals: [],
      developmentPlan: [],
      connects: [],
      connectsCount: 0,
      weeklyGoals: [],
      score: 0,
      scoringHistory: []
    };
  }

  try {
    // Try full parse first
    return UserDataSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse user data with strict schema, using fallback:', error.message);
    
    // Fallback: parse each section independently with safe parsers
    return {
      id: data.id || data.userId,
      userId: data.userId || data.id,
      name: data.name,
      email: data.email,
      dreamBook: parseDreamList(data.dreamBook || []),
      dreamCategories: Array.isArray(data.dreamCategories) ? data.dreamCategories : [],
      dreamsCount: typeof data.dreamsCount === 'number' ? data.dreamsCount : (data.dreamBook?.length || 0),
      careerGoals: parseCareerGoalList(data.careerGoals || []),
      developmentPlan: parseDevelopmentPlanList(data.developmentPlan || []),
      connects: parseConnectList(data.connects || []),
      connectsCount: typeof data.connectsCount === 'number' ? data.connectsCount : (data.connects?.length || 0),
      weeklyGoals: parseWeeklyGoalList(data.weeklyGoals || []),
      score: typeof data.score === 'number' ? data.score : 0,
      scoringHistory: parseScoringHistoryList(data.scoringHistory || []),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      lastSync: data.lastSync
    };
  }
}

/**
 * Parse scoring history list
 */
export function parseScoringHistoryList(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item, index) => {
    try {
      return ScoringHistorySchema.parse(item);
    } catch (error) {
      console.warn(`Failed to parse scoring history at index ${index}:`, error.message);
      return {
        id: item?.id || index,
        date: item?.date || new Date().toISOString(),
        score: item?.score || 0,
        activity: item?.activity || 'Unknown',
        points: item?.points || 0
      };
    }
  }).filter(Boolean);
}

/**
 * Validate user data before saving
 * Returns { valid: boolean, errors?: string[] }
 */
export function validateUserData(data) {
  try {
    UserDataSchema.parse(data);
    return { valid: true };
  } catch (error) {
    const errors = error.errors?.map(err => `${err.path.join('.')}: ${err.message}`) || [error.message];
    return { valid: false, errors };
  }
}

