import { z } from 'zod';
import { DreamSchema } from './dream.js';
import { WeeklyGoalSchema, ConnectSchema } from './person.js';
import { ScoringHistorySchema } from './userData.js';
import { CareerGoalSchema, DevelopmentPlanSchema } from './career.js';

/**
 * Base schema for all items in the items container
 * Every item has these core fields plus type-specific data
 */
export const ItemBaseSchema = z.object({
  id: z.union([z.string(), z.number()]),
  userId: z.union([z.string(), z.number()]),
  type: z.enum(['dream', 'weekly_goal', 'scoring_entry', 'connect', 'career_goal', 'development_plan']),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
}).passthrough(); // Allow additional fields

/**
 * Dream Item - extends base with dream-specific fields
 */
export const DreamItemSchema = ItemBaseSchema.extend({
  type: z.literal('dream'),
  title: z.string(),
  category: z.string(),
  description: z.string().optional(),
  progress: z.number().default(0),
  milestones: z.array(z.any()).default([]),
  notes: z.array(z.any()).default([]),
  history: z.array(z.any()).default([])
}).passthrough();

/**
 * Weekly Goal Item - extends base with goal-specific fields
 */
export const WeeklyGoalItemSchema = ItemBaseSchema.extend({
  type: z.literal('weekly_goal'),
  title: z.string(),
  description: z.string().optional().default(''),
  completed: z.boolean().default(false),
  dreamId: z.union([z.string(), z.number()]).optional(),
  dreamTitle: z.string().optional(),
  dreamCategory: z.string().optional(),
  completedAt: z.string().optional(),
  milestoneId: z.union([z.string(), z.number()]).optional(),
  recurrence: z.enum(['weekly', 'once']).optional().default('once'),
  weekLog: z.record(z.boolean()).optional().default({}),
  active: z.boolean().optional().default(true)
}).passthrough();

/**
 * Scoring Entry Item - extends base with scoring-specific fields
 */
export const ScoringEntryItemSchema = ItemBaseSchema.extend({
  type: z.literal('scoring_entry'),
  title: z.string().optional(),
  points: z.number(),
  date: z.string(),
  category: z.string().optional()
}).passthrough();

/**
 * Connect Item - extends base with connect-specific fields
 */
export const ConnectItemSchema = ItemBaseSchema.extend({
  type: z.literal('connect'),
  dreamId: z.union([z.string(), z.number()]),
  withWhom: z.string(),
  when: z.string().optional(),
  notes: z.string().optional().default('')
}).passthrough();

/**
 * Career Goal Item - extends base with career goal fields
 */
export const CareerGoalItemSchema = ItemBaseSchema.extend({
  type: z.literal('career_goal'),
  title: z.string(),
  description: z.string().optional().default(''),
  targetDate: z.string().optional(),
  progress: z.number().default(0),
  milestones: z.array(z.any()).default([])
}).passthrough();

/**
 * Development Plan Item - extends base with development plan fields
 */
export const DevelopmentPlanItemSchema = ItemBaseSchema.extend({
  type: z.literal('development_plan'),
  skill: z.string(),
  action: z.string().optional().default(''),
  timeline: z.string().optional(),
  progress: z.number().default(0)
}).passthrough();

/**
 * Union type for all possible item types
 */
export const ItemSchema = z.discriminatedUnion('type', [
  DreamItemSchema,
  WeeklyGoalItemSchema,
  ScoringEntryItemSchema,
  ConnectItemSchema,
  CareerGoalItemSchema,
  DevelopmentPlanItemSchema
]);

/**
 * Helper to validate and parse item data
 */
export function parseItem(data) {
  try {
    return ItemSchema.parse(data);
  } catch (error) {
    console.error('Item validation error:', error);
    return null;
  }
}

/**
 * Helper to create a new item with proper structure
 */
export function createItem(userId, type, data) {
  const baseItem = {
    id: data.id || `${type}_${userId}_${Date.now()}`,
    userId: userId,
    type: type,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data
  };
  
  return parseItem(baseItem);
}

export default ItemSchema;


