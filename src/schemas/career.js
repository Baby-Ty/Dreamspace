// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { z } from 'zod';
import { MilestoneSchema } from './dream.js';

/**
 * Career-related schemas
 * Used in CareerBook for goals and development plans
 */

// Career Goal schema
export const CareerGoalSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().optional().default(''),
  progress: z.number().min(0).max(100).default(0),
  targetDate: z.string().optional(),
  status: z.enum(['Planned', 'In Progress', 'Completed', 'On Hold']).default('Planned'),
  milestones: z.array(MilestoneSchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
}).passthrough();

// Development Plan schema
export const DevelopmentPlanSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().optional().default(''),
  progress: z.number().min(0).max(100).default(0),
  targetDate: z.string().optional(),
  status: z.enum(['Planned', 'In Progress', 'Completed', 'On Hold']).default('Planned'),
  skills: z.array(z.string()).default([]),
  milestones: z.array(MilestoneSchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
}).passthrough();

// Skill schema (for skills matrix)
export const SkillSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  category: z.string().optional(),
  level: z.number().min(0).max(5).default(0), // 0-5 proficiency
  yearsExperience: z.number().min(0).optional(),
  lastUsed: z.string().optional(),
  endorsements: z.number().default(0)
}).passthrough();

// Lists
export const CareerGoalListSchema = z.array(CareerGoalSchema);
export const DevelopmentPlanListSchema = z.array(DevelopmentPlanSchema);
export const SkillListSchema = z.array(SkillSchema);

/**
 * Safe parsers with fallback defaults
 */

export function parseCareerGoal(data) {
  try {
    return CareerGoalSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse career goal:', error.message, data);
    return {
      id: data?.id || 0,
      title: data?.title || 'Untitled Goal',
      description: data?.description || '',
      progress: 0,
      status: 'Planned',
      milestones: []
    };
  }
}

export function parseCareerGoalList(data) {
  if (!Array.isArray(data)) {
    console.warn('Expected array for career goals, got:', typeof data);
    return [];
  }

  return data.map((item, index) => {
    try {
      return CareerGoalSchema.parse(item);
    } catch (error) {
      console.warn(`Failed to parse career goal at index ${index}:`, error.message);
      return parseCareerGoal(item);
    }
  }).filter(Boolean);
}

export function parseDevelopmentPlan(data) {
  try {
    return DevelopmentPlanSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse development plan:', error.message, data);
    return {
      id: data?.id || 0,
      title: data?.title || 'Untitled Plan',
      description: data?.description || '',
      progress: 0,
      status: 'Planned',
      skills: [],
      milestones: []
    };
  }
}

export function parseDevelopmentPlanList(data) {
  if (!Array.isArray(data)) {
    console.warn('Expected array for development plans, got:', typeof data);
    return [];
  }

  return data.map((item, index) => {
    try {
      return DevelopmentPlanSchema.parse(item);
    } catch (error) {
      console.warn(`Failed to parse development plan at index ${index}:`, error.message);
      return parseDevelopmentPlan(item);
    }
  }).filter(Boolean);
}

export function parseSkill(data) {
  try {
    return SkillSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse skill:', error.message);
    return {
      id: data?.id || 0,
      name: data?.name || 'Unknown Skill',
      level: 0
    };
  }
}

export function parseSkillList(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(item => parseSkill(item)).filter(Boolean);
}

