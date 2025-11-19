// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { z } from 'zod';

/**
 * Scoring Entry Schema
 * Individual scoring event (dream added, goal completed, connect made, etc.)
 */
export const ScoringEntrySchema = z.object({
  id: z.string(),
  date: z.string(), // ISO date string (YYYY-MM-DD)
  source: z.enum(['dream', 'week', 'connect', 'milestone']),
  dreamId: z.string().optional(),
  weekId: z.string().optional(),
  connectId: z.string().optional(),
  points: z.number(),
  activity: z.string(),
  createdAt: z.string()
}).passthrough();

/**
 * Scoring Document Schema
 * One document per user per year with all scoring entries
 * Structure: { id: "userId_2025_scoring", userId, year: 2025, totalScore: 450, entries: [...] }
 */
export const ScoringDocumentSchema = z.object({
  id: z.string(), // Format: "userId_2025_scoring"
  userId: z.string(),
  year: z.number(),
  totalScore: z.number(),
  entries: z.array(ScoringEntrySchema),
  createdAt: z.string(),
  updatedAt: z.string()
}).passthrough();

/**
 * Safe parser for a single scoring entry
 */
export function parseScoringEntry(data) {
  if (!data) {
    return null;
  }

  try {
    return ScoringEntrySchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse scoring entry, using fallback:', error.message);
    
    return {
      id: data.id || `score_${Date.now()}`,
      date: data.date || new Date().toISOString().split('T')[0],
      source: data.source || 'dream',
      dreamId: data.dreamId,
      weekId: data.weekId,
      connectId: data.connectId,
      points: data.points || 0,
      activity: data.activity || 'Unknown activity',
      createdAt: data.createdAt || new Date().toISOString()
    };
  }
}

/**
 * Safe parser for scoring document
 */
export function parseScoringDocument(data) {
  if (!data) {
    return null;
  }

  try {
    return ScoringDocumentSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse scoring document, using fallback:', error.message);
    
    return {
      id: data.id || `${data.userId}_${data.year}_scoring`,
      userId: data.userId,
      year: data.year,
      totalScore: data.totalScore || 0,
      entries: Array.isArray(data.entries) ? data.entries.map(parseScoringEntry).filter(Boolean) : [],
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
    };
  }
}

/**
 * Safe parser for array of scoring entries
 */
export function parseScoringEntryList(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item, index) => {
      try {
        return parseScoringEntry(item);
      } catch (error) {
        console.warn(`Failed to parse scoring entry at index ${index}:`, error.message);
        return null;
      }
    })
    .filter(Boolean);
}

/**
 * Validate scoring entry before saving
 */
export function validateScoringEntry(data) {
  try {
    ScoringEntrySchema.parse(data);
    return { valid: true };
  } catch (error) {
    const errors = error.errors?.map(err => `${err.path.join('.')}: ${err.message}`) || [error.message];
    return { valid: false, errors };
  }
}

/**
 * Validate scoring document before saving
 */
export function validateScoringDocument(data) {
  try {
    ScoringDocumentSchema.parse(data);
    return { valid: true };
  } catch (error) {
    const errors = error.errors?.map(err => `${err.path.join('.')}: ${err.message}`) || [error.message];
    return { valid: false, errors };
  }
}







