import { z } from 'zod';

/**
 * Person/User-related schemas
 * Used throughout the app for user profiles, coaches, team members
 */

// Connect/Connection schema
export const ConnectSchema = z.object({
  id: z.union([z.string(), z.number()]),
  withWhom: z.string().optional(), // Name of person connected with
  userId: z.union([z.string(), z.number()]).optional(), // User ID if available
  date: z.string().optional(),
  notes: z.string().optional().default(''),
  selfieUrl: z.string().url().optional(),
  avatar: z.string().url().optional(),
  createdAt: z.string().optional()
}).passthrough();

// Weekly Goal schema
export const WeeklyGoalSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().optional().default(''),
  completed: z.boolean().default(false),
  dreamId: z.union([z.string(), z.number()]).optional(),
  dreamTitle: z.string().optional(),
  dreamCategory: z.string().optional(),
  createdAt: z.string().optional(),
  completedAt: z.string().optional(),
  // Recurring goal fields
  goalId: z.union([z.string(), z.number()]).optional(), // Link to goal (not milestone)
  recurrence: z.enum(['weekly', 'once']).optional().default('once'),
  weekLog: z.record(z.boolean()).optional().default({}), // ISO week keys (e.g., "2025-W41": true)
  active: z.boolean().optional().default(true)
}).passthrough();

// Person/User base schema (for team members, coaches, connections)
export const PersonSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  email: z.string().email().optional(),
  office: z.string().optional(),
  avatar: z.string().url().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  role: z.enum(['user', 'coach', 'admin']).default('user').optional(),
  isCoach: z.boolean().optional(),
  dreamCategories: z.array(z.string()).default([]),
  score: z.number().default(0).optional(),
  dreamsCount: z.number().default(0).optional(),
  connectsCount: z.number().default(0).optional()
}).passthrough();

// Connection suggestion schema (for Dream Connect page)
export const ConnectionSuggestionSchema = PersonSchema.extend({
  sharedCategories: z.array(z.string()).default([]),
  sampleDreams: z.array(z.object({
    title: z.string(),
    category: z.string(),
    image: z.string().url().optional()
  })).default([]),
  matchScore: z.number().optional()
});

// Lists
export const ConnectListSchema = z.array(ConnectSchema);
export const WeeklyGoalListSchema = z.array(WeeklyGoalSchema);
export const PersonListSchema = z.array(PersonSchema);
export const ConnectionSuggestionListSchema = z.array(ConnectionSuggestionSchema);

/**
 * Safe parsers with fallback defaults
 */

export function parsePerson(data) {
  try {
    return PersonSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse person:', error.message, data);
    return {
      id: data?.id || 0,
      name: data?.name || 'Unknown User',
      email: data?.email,
      office: data?.office || 'Unknown',
      avatar: data?.avatar,
      dreamCategories: [],
      score: 0
    };
  }
}

export function parsePersonList(data) {
  if (!Array.isArray(data)) {
    console.warn('Expected array for person list, got:', typeof data);
    return [];
  }

  return data.map((item, index) => {
    try {
      return PersonSchema.parse(item);
    } catch (error) {
      console.warn(`Failed to parse person at index ${index}:`, error.message);
      return parsePerson(item);
    }
  }).filter(Boolean);
}

export function parseConnect(data) {
  try {
    return ConnectSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse connect:', error.message);
    return {
      id: data?.id || 0,
      withWhom: data?.withWhom || 'Unknown',
      date: data?.date || new Date().toISOString(),
      notes: data?.notes || ''
    };
  }
}

export function parseConnectList(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(item => parseConnect(item)).filter(Boolean);
}

export function parseWeeklyGoal(data) {
  try {
    return WeeklyGoalSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse weekly goal:', error.message);
    return {
      id: data?.id || 0,
      title: data?.title || 'Untitled Goal',
      description: data?.description || '',
      completed: false
    };
  }
}

export function parseWeeklyGoalList(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(item => parseWeeklyGoal(item)).filter(Boolean);
}

export function parseConnectionSuggestion(data) {
  try {
    return ConnectionSuggestionSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse connection suggestion:', error.message);
    return {
      ...parsePerson(data),
      sharedCategories: data?.sharedCategories || [],
      sampleDreams: data?.sampleDreams || []
    };
  }
}

export function parseConnectionSuggestionList(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(item => parseConnectionSuggestion(item)).filter(Boolean);
}
