// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { z } from 'zod';
import { getIsoWeek } from '../utils/dateUtils.js';

/**
 * Connect Document Schema
 * Stored in connects container with partition key userId
 */
export const ConnectDocumentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.literal('connect'),
  dreamId: z.string().optional(),
  withWhom: z.string(),
  when: z.string(), // ISO date string (YYYY-MM-DD) - placeholder date
  notes: z.string().optional(),
  
  // NEW FIELDS (v1 enhancement - simplified)
  status: z.enum(['pending', 'completed']).default('pending'),
  agenda: z.string().optional(), // Topics to discuss
  proposedWeeks: z.array(z.string()).optional(), // Array of ISO week strings (e.g., ["2025-W45", "2025-W46"])
  schedulingMethod: z.enum(['teams', 'inperson']).optional(), // Preferred method
  
  createdAt: z.string(),
  updatedAt: z.string()
}).passthrough();

/**
 * Safe parser for a single connect document
 * Returns a valid connect object with defaults
 */
export function parseConnect(data) {
  if (!data) {
    return null;
  }

  try {
    return ConnectDocumentSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse connect, using fallback:', error.message);
    
    // Fallback with sensible defaults
    return {
      id: data.id || `connect_${Date.now()}`,
      userId: data.userId,
      type: 'connect',
      dreamId: data.dreamId,
      withWhom: data.withWhom || '',
      when: data.when || new Date().toISOString().split('T')[0],
      notes: data.notes || '',
      status: data.status || 'pending',
      agenda: data.agenda,
      proposedWeeks: data.proposedWeeks || data.proposedTimeSlots?.map(slot => {
        // Migration: convert old time slots to weeks if needed
        const date = new Date(slot.date);
        const isoWeek = getIsoWeek(date);
        return isoWeek;
      }) || [],
      schedulingMethod: data.schedulingMethod,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
    };
  }
}

/**
 * Safe parser for array of connects
 * Filters out any invalid items
 */
export function parseConnectList(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item, index) => {
      try {
        return parseConnect(item);
      } catch (error) {
        console.warn(`Failed to parse connect at index ${index}:`, error.message);
        return null;
      }
    })
    .filter(Boolean);
}

/**
 * Validate connect data before saving
 * Returns { valid: boolean, errors?: string[] }
 */
export function validateConnect(data) {
  try {
    ConnectDocumentSchema.parse(data);
    return { valid: true };
  } catch (error) {
    const errors = error.errors?.map(err => `${err.path.join('.')}: ${err.message}`) || [error.message];
    return { valid: false, errors };
  }
}







