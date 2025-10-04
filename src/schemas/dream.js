// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { z } from 'zod';

/**
 * Dream-related schemas
 * Mirrors data structures used in DreamBook and related components
 */

// Milestone schema
export const MilestoneSchema = z.object({
  id: z.union([z.string(), z.number()]),
  text: z.string(),
  completed: z.boolean().default(false),
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

// History entry schema
export const HistorySchema = z.object({
  id: z.union([z.string(), z.number()]),
  type: z.enum(['progress', 'milestone', 'note', 'status', 'created']),
  action: z.string(),
  timestamp: z.string(),
  oldValue: z.any().optional(),
  newValue: z.any().optional()
}).passthrough();

// Main Dream schema
export const DreamSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  category: z.string(),
  description: z.string().optional().default(''),
  progress: z.number().min(0).max(100).default(0),
  image: z.string().url().optional(),
  milestones: z.array(MilestoneSchema).default([]),
  notes: z.array(NoteSchema).default([]),
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
      milestones: [],
      notes: [],
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

export function parseMilestone(data) {
  try {
    return MilestoneSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse milestone:', error.message);
    return {
      id: data?.id || 0,
      text: data?.text || '',
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

