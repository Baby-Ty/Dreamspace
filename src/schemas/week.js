// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { z } from 'zod';

/**
 * Weekly Goal Instance Schema
 * Individual goal within a specific week
 */
export const WeeklyGoalInstanceSchema = z.object({
  id: z.string(),
  templateId: z.string().optional(),
  dreamId: z.string().optional(),
  milestoneId: z.number().optional(),
  title: z.string(),
  description: z.string().optional(),
  dreamTitle: z.string().optional(),
  dreamCategory: z.string().optional(),
  completed: z.boolean().default(false),
  completedAt: z.string().optional(),
  recurrence: z.enum(['once', 'weekly']).optional(),
  createdAt: z.string()
}).passthrough();

/**
 * Week Document Schema
 * One document per user per year with nested weeks
 * Structure: { id: "userId_2025", userId, year: 2025, weeks: { "2025-W43": { goals: [...] } } }
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






