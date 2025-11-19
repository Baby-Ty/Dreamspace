// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { z } from 'zod';

/**
 * Weekly Goal Instance Schema (Enhanced for currentWeek container)
 * Individual goal within the current week
 */
export const WeeklyGoalInstanceSchema = z.object({
  id: z.string(),
  templateId: z.string().optional(),
  type: z.enum(['weekly_goal', 'deadline']).default('weekly_goal'),
  title: z.string(),
  description: z.string().optional(),
  dreamId: z.string().optional(),
  dreamTitle: z.string().optional(),
  dreamCategory: z.string().optional(),
  milestoneId: z.union([z.string(), z.number()]).optional(),
  // For weekly goals
  recurrence: z.enum(['weekly', 'monthly']).optional(),
  targetWeeks: z.number().optional(),
  weeksRemaining: z.number().optional(), // Weeks remaining for ALL goal types (-1 = complete/past)
  targetMonths: z.number().optional(),
  monthsRemaining: z.number().optional(), // Months remaining for monthly goals (-1 = complete)
  // For deadline goals
  targetDate: z.string().optional(),
  // Status
  completed: z.boolean().default(false),
  completedAt: z.string().nullable().optional(),
  skipped: z.boolean().optional(),
  weekId: z.string().optional(),
  createdAt: z.string()
}).passthrough();

/**
 * DEPRECATED: Week Document Schema for legacy weeks{year} containers
 * One document per user per year with nested weeks
 * Structure: { id: "userId_2025", userId, year: 2025, weeks: { "2025-W43": { goals: [...] } } }
 * 
 * @deprecated Use CurrentWeekDocumentSchema or PastWeeksDocumentSchema instead
 */
export const WeekDocumentSchema = z.object({
  id: z.string(), // Format: "userId_2025"
  userId: z.string(),
  year: z.number(),
  weeks: z.record(z.object({
    goals: z.array(WeeklyGoalInstanceSchema)
  })),
  createdAt: z.string(),
  updatedAt: z.string()
}).passthrough();

/**
 * Current Week Document Schema (NEW - Simplified Tracking)
 * One document per user with current week's goals
 * Container: currentWeek, Partition Key: /userId
 * Structure: { id: "userId", weekId: "2025-W45", goals: [...] }
 */
export const CurrentWeekDocumentSchema = z.object({
  id: z.string(), // Same as userId
  userId: z.string(),
  weekId: z.string(), // Format: "YYYY-Www" (e.g., "2025-W45")
  goals: z.array(WeeklyGoalInstanceSchema),
  stats: z.object({
    totalGoals: z.number(),
    completedGoals: z.number(),
    score: z.number()
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
}).passthrough();

/**
 * Past Weeks Document Schema (NEW - Historical Summary)
 * One document per user with all historical week summaries
 * Container: pastWeeks, Partition Key: /userId
 * Structure: { id: "userId", weekHistory: { "2025-W40": { totalGoals, completedGoals, score } } }
 */
export const PastWeeksDocumentSchema = z.object({
  id: z.string(), // Same as userId
  userId: z.string(),
  weekHistory: z.record(z.object({
    totalGoals: z.number(),
    completedGoals: z.number(),
    score: z.number(),
    weekStartDate: z.string().optional(),
    weekEndDate: z.string().optional()
  })),
  totalWeeksTracked: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
}).passthrough();

/**
 * Safe parser for a single weekly goal instance
 */
export function parseWeeklyGoalInstance(data) {
  if (!data) {
    return null;
  }

  try {
    return WeeklyGoalInstanceSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse weekly goal instance, using fallback:', error.message);
    
    return {
      id: data.id || `goal_${Date.now()}`,
      templateId: data.templateId,
      dreamId: data.dreamId,
      milestoneId: data.milestoneId,
      title: data.title || '',
      description: data.description || '',
      dreamTitle: data.dreamTitle,
      dreamCategory: data.dreamCategory,
      completed: data.completed || false,
      completedAt: data.completedAt,
      recurrence: data.recurrence,
      createdAt: data.createdAt || new Date().toISOString()
    };
  }
}

/**
 * Safe parser for week document
 */
export function parseWeekDocument(data) {
  if (!data) {
    return null;
  }

  try {
    return WeekDocumentSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse week document, using fallback:', error.message);
    
    return {
      id: data.id || `${data.userId}_${data.year}`,
      userId: data.userId,
      year: data.year,
      weeks: data.weeks || {},
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
    };
  }
}

/**
 * Helper to flatten week document into array of goals with weekId
 * Converts nested structure to flat array for easier component consumption
 */
export function flattenWeekDocument(weekDoc) {
  if (!weekDoc || !weekDoc.weeks) {
    return [];
  }

  const flattened = [];
  Object.entries(weekDoc.weeks).forEach(([weekId, weekData]) => {
    weekData.goals.forEach(goal => {
      flattened.push({
        ...goal,
        weekId: weekId
      });
    });
  });

  return flattened;
}

/**
 * Helper to extract goals for a specific week
 */
export function getGoalsForWeek(weekDoc, weekId) {
  if (!weekDoc || !weekDoc.weeks || !weekDoc.weeks[weekId]) {
    return [];
  }

  return weekDoc.weeks[weekId].goals || [];
}

/**
 * Validate week document before saving
 * @deprecated Use validateCurrentWeekDocument or validatePastWeeksDocument instead
 */
export function validateWeekDocument(data) {
  try {
    WeekDocumentSchema.parse(data);
    return { valid: true };
  } catch (error) {
    const errors = error.errors?.map(err => `${err.path.join('.')}: ${err.message}`) || [error.message];
    return { valid: false, errors };
  }
}

/**
 * Parse current week document
 */
export function parseCurrentWeekDocument(data) {
  if (!data) {
    return null;
  }

  try {
    return CurrentWeekDocumentSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse current week document, using fallback:', error.message);
    
    return {
      id: data.id || data.userId,
      userId: data.userId,
      weekId: data.weekId || '',
      goals: Array.isArray(data.goals) ? data.goals.map(parseWeeklyGoalInstance).filter(Boolean) : [],
      stats: data.stats || { totalGoals: 0, completedGoals: 0, score: 0 },
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
    };
  }
}

/**
 * Parse past weeks document
 */
export function parsePastWeeksDocument(data) {
  if (!data) {
    return null;
  }

  try {
    return PastWeeksDocumentSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse past weeks document, using fallback:', error.message);
    
    return {
      id: data.id || data.userId,
      userId: data.userId,
      weekHistory: data.weekHistory || data.weeks || {},
      totalWeeksTracked: data.totalWeeksTracked || Object.keys(data.weekHistory || {}).length,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
    };
  }
}

/**
 * Validate current week document before saving
 */
export function validateCurrentWeekDocument(data) {
  try {
    CurrentWeekDocumentSchema.parse(data);
    return { valid: true };
  } catch (error) {
    const errors = error.errors?.map(err => `${err.path.join('.')}: ${err.message}`) || [error.message];
    return { valid: false, errors };
  }
}

/**
 * Validate past weeks document before saving
 */
export function validatePastWeeksDocument(data) {
  try {
    PastWeeksDocumentSchema.parse(data);
    return { valid: true };
  } catch (error) {
    const errors = error.errors?.map(err => `${err.path.join('.')}: ${err.message}`) || [error.message];
    return { valid: false, errors };
  }
}






