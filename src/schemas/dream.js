// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { z } from 'zod';

/**
 * Dream-related schemas
 * Mirrors data structures used in DreamBook and related components
 */

// Goal schema - simplified from milestones
export const GoalSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().optional(),
  type: z.enum(['consistency', 'deadline']).default('consistency'),
  // For consistency goals
  recurrence: z.enum(['weekly', 'monthly']).optional(),
  targetWeeks: z.number().optional(), // How many weeks to track (for weekly AND deadline goals)
  targetMonths: z.number().optional(), // How many months to track (for monthly)
  frequency: z.number().optional(), // How many times to complete per month (for monthly goals only)
  startDate: z.string().optional(), // ISO date when tracking starts
  // For deadline goals (backward compatibility - targetWeeks is now primary)
  targetDate: z.string().optional(), // ISO date for deadline (kept for backward compatibility, targetWeeks is source of truth)
  // Computed fields (calculated on load/rollover)
  weeksRemaining: z.number().optional(), // Weeks remaining for ALL goal types (-1 = complete/past)
  monthsRemaining: z.number().optional(), // Months remaining for monthly goals (-1 = complete)
  // For monthly tracking (which month/week instances belong to)
  monthId: z.string().optional(), // Format: "2025-11" for November 2025
  weekId: z.string().optional(), // Format: "2025-W44" for week tracking
  // Status
  active: z.boolean().default(true),
  completed: z.boolean().default(false),
  completedAt: z.string().optional(),
  createdAt: z.string().optional()
});

// Note/Comment schema (includes both user notes and coach notes)
export const NoteSchema = z.object({
  id: z.union([z.string(), z.number()]),
  text: z.string().optional(),
  note: z.string().optional(), // Coach notes use 'note' instead of 'text'
  timestamp: z.string().optional(),
  createdAt: z.string().optional(),
  dreamId: z.union([z.string(), z.number()]).optional(),
  teamMemberId: z.union([z.string(), z.number()]).optional(),
  coachId: z.union([z.string(), z.number()]).optional(),
  coachName: z.string().optional(),
  type: z.enum(['encouragement', 'suggestion', 'feedback', 'general']).optional(),
  isCoachNote: z.boolean().optional()
}).passthrough();

// Coach note message schema (simplified chat-like structure)
export const CoachNoteMessageSchema = z.object({
  id: z.union([z.string(), z.number()]),
  coachId: z.string().nullable().optional(), // Present = coach message, null/undefined = user message
  message: z.string(),
  timestamp: z.string()
}).passthrough();

// History entry schema
export const HistorySchema = z.object({
  id: z.union([z.string(), z.number()]),
  type: z.enum(['progress', 'goal', 'note', 'status', 'created']),
  action: z.string(),
  timestamp: z.string(),
  oldValue: z.any().optional(),
  newValue: z.any().optional()
}).passthrough();

// Weekly Goal Template schema (stored in dreams container)
export const WeeklyGoalTemplateSchema = z.object({
  id: z.string(),
  type: z.literal('weekly_goal_template'),
  title: z.string(),
  description: z.string().optional(),
  dreamId: z.string(),
  dreamTitle: z.string().optional(),
  dreamCategory: z.string().optional(),
  goalId: z.union([z.string(), z.number()]).optional(), // Links to parent dream goal
  milestoneId: z.union([z.string(), z.number()]).optional(), // @deprecated - use goalId
  recurrence: z.enum(['weekly', 'monthly']).default('weekly'),
  targetWeeks: z.number().optional(),
  targetMonths: z.number().optional(),
  startDate: z.string().optional(),
  active: z.boolean().default(true),
  createdAt: z.string().optional()
}).passthrough();

// Main Dream schema
export const DreamSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  category: z.string(),
  description: z.string().optional().default(''),
  progress: z.number().min(0).max(100).default(0),
  image: z.string().url().optional(),
  goals: z.array(GoalSchema).default([]),
  notes: z.array(NoteSchema).default([]),
  coachNotes: z.array(CoachNoteMessageSchema).default([]),
  history: z.array(HistorySchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
}).passthrough();

// Dream list schema
export const DreamListSchema = z.array(DreamSchema);

/**
 * Safe parsers with fallback defaults
 */

export function parseDream(data) {
  try {
    return DreamSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse dream:', error.message, data);
    return {
      id: data?.id || 0,
      title: data?.title || 'Untitled Dream',
      category: data?.category || 'General',
      description: data?.description || '',
      progress: 0,
      image: data?.image,
      goals: [],
      notes: [],
      coachNotes: [],
      history: []
    };
  }
}

export function parseDreamList(data) {
  if (!Array.isArray(data)) {
    console.warn('Expected array for dream list, got:', typeof data);
    return [];
  }

  return data.map((item, index) => {
    try {
      return DreamSchema.parse(item);
    } catch (error) {
      console.warn(`Failed to parse dream at index ${index}:`, error.message);
      return parseDream(item);
    }
  }).filter(Boolean);
}

export function parseGoal(data) {
  try {
    return GoalSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse goal:', error.message);
    return {
      id: data?.id || 0,
      title: data?.title || '',
      type: 'consistency',
      recurrence: 'weekly',
      active: true,
      completed: false
    };
  }
}

export function parseNote(data) {
  try {
    return NoteSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse note:', error.message);
    return {
      id: data?.id || 0,
      text: data?.text || data?.note || '',
      timestamp: data?.timestamp || data?.createdAt || new Date().toISOString()
    };
  }
}

export function parseWeeklyGoalTemplate(data) {
  try {
    return WeeklyGoalTemplateSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse weekly goal template:', error.message);
    return {
      id: data?.id || `template_${Date.now()}`,
      type: 'weekly_goal_template',
      title: data?.title || '',
      description: data?.description || '',
      dreamId: data?.dreamId || '',
      dreamTitle: data?.dreamTitle,
      dreamCategory: data?.dreamCategory,
      goalId: data?.goalId || data?.milestoneId, // Prefer goalId, fallback to milestoneId
      recurrence: data?.recurrence || 'weekly',
      targetWeeks: data?.targetWeeks,
      targetMonths: data?.targetMonths,
      startDate: data?.startDate,
      active: data?.active !== undefined ? data?.active : true,
      createdAt: data?.createdAt || new Date().toISOString()
    };
  }
}

export function parseWeeklyGoalTemplateList(data) {
  if (!Array.isArray(data)) {
    console.warn('Expected array for template list, got:', typeof data);
    return [];
  }

  return data.map((item, index) => {
    try {
      return WeeklyGoalTemplateSchema.parse(item);
    } catch (error) {
      console.warn(`Failed to parse template at index ${index}:`, error.message);
      return parseWeeklyGoalTemplate(item);
    }
  }).filter(Boolean);
}

export function parseCoachNoteMessage(data) {
  try {
    return CoachNoteMessageSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse coach note message:', error.message);
    return {
      id: data?.id || `note_${Date.now()}`,
      coachId: data?.coachId || null,
      message: data?.message || '',
      timestamp: data?.timestamp || new Date().toISOString()
    };
  }
}

