/**
 * API Validation Utilities
 * 
 * Provides Zod schema validation for API endpoints.
 * Integrates with apiWrapper.js for consistent error handling.
 */

const { z } = require('zod');

// ============================================================================
// Common Schemas (reusable across endpoints)
// ============================================================================

/**
 * User ID schema - validates string or number ID
 */
const UserIdSchema = z.union([z.string().min(1), z.number()]);

/**
 * UUID/string ID schema
 */
const IdSchema = z.union([z.string().min(1), z.number()]);

/**
 * ISO date string schema
 */
const IsoDateSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: 'Invalid ISO date string' }
);

/**
 * ISO week string schema (e.g., "2025-W45")
 */
const IsoWeekSchema = z.string().regex(/^\d{4}-W\d{2}$/, 'Invalid ISO week format (expected YYYY-Www)');

// ============================================================================
// Dream Schemas
// ============================================================================

/**
 * Goal schema for dreams
 */
const GoalSchema = z.object({
  id: IdSchema,
  title: z.string().min(1, 'Goal title is required'),
  description: z.string().optional().nullable(),
  type: z.enum(['consistency', 'deadline', 'general']).default('consistency'),
  recurrence: z.enum(['weekly', 'monthly']).optional().nullable(),
  targetWeeks: z.number().int().positive().optional().nullable(),
  targetMonths: z.number().int().positive().optional().nullable(),
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  weeksRemaining: z.number().int().optional().nullable(),
  monthsRemaining: z.number().int().optional().nullable(),
  active: z.boolean().default(true),
  completed: z.boolean().default(false),
  completedAt: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable()
}).passthrough();

/**
 * Note schema for dreams
 */
const NoteSchema = z.object({
  id: IdSchema,
  text: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  timestamp: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable()
}).passthrough();

/**
 * Coach note message schema
 */
const CoachNoteMessageSchema = z.object({
  id: IdSchema,
  coachId: z.string().nullable().optional(),
  message: z.string(),
  timestamp: z.string()
}).passthrough();

/**
 * Dream schema
 */
const DreamSchema = z.object({
  id: IdSchema,
  title: z.string().min(1, 'Dream title is required'),
  category: z.string().min(1, 'Dream category is required'),
  description: z.string().optional().nullable().default(''),
  progress: z.number().min(0).max(100).default(0),
  image: z.string().url().optional().nullable().or(z.literal('')),
  goals: z.array(GoalSchema).default([]),
  notes: z.array(NoteSchema).default([]),
  coachNotes: z.array(CoachNoteMessageSchema).default([]),
  isPublic: z.boolean().default(false),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable()
}).passthrough();

/**
 * Weekly goal template schema
 */
const WeeklyGoalTemplateSchema = z.object({
  id: z.string().min(1),
  type: z.literal('weekly_goal_template').optional().nullable(),
  goalType: z.enum(['consistency', 'deadline']).optional().nullable(),
  title: z.string().min(1, 'Template title is required'),
  description: z.string().optional().nullable(),
  dreamId: z.string().min(1, 'Dream ID is required'),
  dreamTitle: z.string().optional().nullable(),
  dreamCategory: z.string().optional().nullable(),
  goalId: IdSchema.optional().nullable(),
  milestoneId: IdSchema.optional().nullable(), // @deprecated - use goalId
  recurrence: z.enum(['weekly', 'monthly']).default('weekly'),
  durationType: z.enum(['unlimited', 'weeks', 'milestone']).optional().nullable(),
  durationWeeks: z.number().int().positive().optional().nullable(),
  targetWeeks: z.number().int().positive().optional().nullable(),
  targetMonths: z.number().int().positive().optional().nullable(),
  weeksRemaining: z.number().int().optional().nullable(),
  monthsRemaining: z.number().int().optional().nullable(),
  startDate: z.string().optional().nullable(),
  active: z.boolean().default(true),
  createdAt: z.string().optional().nullable()
}).passthrough();

/**
 * Save dreams request schema
 */
const SaveDreamsRequestSchema = z.object({
  userId: UserIdSchema,
  dreams: z.array(DreamSchema),
  weeklyGoalTemplates: z.array(WeeklyGoalTemplateSchema).optional().default([])
});

// ============================================================================
// Current Week Schemas
// ============================================================================

/**
 * Weekly goal instance schema
 */
const WeeklyGoalInstanceSchema = z.object({
  id: z.string().min(1),
  templateId: z.string().optional(),
  type: z.enum(['weekly_goal', 'monthly_goal', 'deadline']).default('weekly_goal'),
  title: z.string().min(1, 'Goal title is required'),
  description: z.string().optional(),
  dreamId: z.string().optional().nullable(),
  dreamTitle: z.string().optional(),
  dreamCategory: z.string().optional(),
  goalId: IdSchema.optional(),
  recurrence: z.enum(['weekly', 'monthly']).optional().nullable(),
  targetWeeks: z.number().int().optional().nullable(),
  weeksRemaining: z.number().int().optional().nullable(),
  targetMonths: z.number().int().optional().nullable(),
  monthsRemaining: z.number().int().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  completed: z.boolean().default(false),
  completedAt: z.string().nullable().optional(),
  skipped: z.boolean().optional(),
  skippedAt: z.string().optional().nullable(),
  weekId: z.string().optional(),
  createdAt: z.string().optional(),
  frequency: z.number().int().optional().nullable(),
  completionCount: z.number().int().optional(),
  completionDates: z.array(z.string()).optional(),
  cardBackgroundImage: z.string().optional().nullable()
}).passthrough();

/**
 * Save current week request schema
 */
const SaveCurrentWeekRequestSchema = z.object({
  userId: UserIdSchema,
  weekId: IsoWeekSchema,
  goals: z.array(WeeklyGoalInstanceSchema)
});

// ============================================================================
// User Data Schemas
// ============================================================================

/**
 * Connect schema
 */
const ConnectSchema = z.object({
  id: IdSchema,
  title: z.string().optional(),
  personName: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'scheduled', 'completed', 'cancelled']).optional(),
  dueDate: z.string().optional(),
  scheduledDate: z.string().optional(),
  completedDate: z.string().optional()
}).passthrough();

/**
 * Career goal schema
 */
const CareerGoalSchema = z.object({
  id: IdSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
  milestones: z.array(z.object({
    id: IdSchema,
    title: z.string(),
    completed: z.boolean().default(false)
  }).passthrough()).optional()
}).passthrough();

/**
 * Save user data request schema
 */
const SaveUserDataRequestSchema = z.object({
  userId: UserIdSchema,
  dreamBook: z.array(DreamSchema).optional(),
  dreamCategories: z.array(z.string()).optional(),
  connects: z.array(ConnectSchema).optional(),
  careerGoals: z.array(CareerGoalSchema).optional(),
  developmentPlan: z.array(z.any()).optional(),
  weeklyGoals: z.array(z.any()).optional(),
  score: z.number().optional(),
  scoringHistory: z.array(z.any()).optional()
}).passthrough();

// ============================================================================
// Validation Helper
// ============================================================================

/**
 * Validate request body against a Zod schema
 * Returns { success: true, data } or { success: false, errors }
 * 
 * @param {Object} body - Request body to validate
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {{ success: boolean, data?: any, errors?: string[] }}
 */
function validateRequest(body, schema) {
  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(err => {
        const path = err.path.join('.');
        return path ? `${path}: ${err.message}` : err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: [error.message || 'Validation failed'] };
  }
}

/**
 * Create a validation error response
 * Use this to format validation errors for API responses
 * 
 * @param {string[]} errors - Array of error messages
 * @returns {{ status: number, message: string, details: string[] }}
 */
function createValidationError(errors) {
  return {
    status: 400,
    message: 'Validation failed',
    details: errors
  };
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  // Schemas
  z,
  UserIdSchema,
  IdSchema,
  IsoDateSchema,
  IsoWeekSchema,
  GoalSchema,
  NoteSchema,
  CoachNoteMessageSchema,
  DreamSchema,
  WeeklyGoalTemplateSchema,
  WeeklyGoalInstanceSchema,
  ConnectSchema,
  CareerGoalSchema,
  SaveDreamsRequestSchema,
  SaveCurrentWeekRequestSchema,
  SaveUserDataRequestSchema,
  // Helpers
  validateRequest,
  createValidationError
};
