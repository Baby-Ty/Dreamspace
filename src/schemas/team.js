// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { z } from 'zod';
import { PersonSchema } from './person.js';

/**
 * Team and coaching-related schemas
 * Used in PeopleDashboard and coaching features
 */

// Team member schema (extends Person)
export const TeamMemberSchema = PersonSchema.extend({
  managerId: z.union([z.string(), z.number()]).optional(),
  teamId: z.union([z.string(), z.number()]).optional(),
  teamName: z.string().optional(),
  performanceScore: z.number().min(0).max(100).optional(),
  engagementLevel: z.enum(['high', 'medium', 'low']).optional(),
  lastCheckIn: z.string().optional()
});

// Team metrics schema
export const TeamMetricsSchema = z.object({
  teamId: z.union([z.string(), z.number()]).optional(),
  teamSize: z.number().default(0),
  averageScore: z.number().default(0),
  engagementRate: z.number().min(0).max(100).default(0),
  activeGoals: z.number().default(0),
  completedGoals: z.number().default(0),
  teamMembers: z.array(TeamMemberSchema).default([])
}).passthrough();

// Coach schema (extends Person with team data)
export const CoachSchema = PersonSchema.extend({
  teamName: z.string().optional(),
  teamId: z.union([z.string(), z.number()]).optional(),
  managerId: z.union([z.string(), z.number()]).optional(),
  performanceScore: z.number().min(0).max(100).default(0),
  teamMetrics: TeamMetricsSchema.optional()
});

// Coaching alert schema
export const CoachingAlertSchema = z.object({
  id: z.union([z.string(), z.number()]),
  type: z.enum(['low_engagement', 'no_progress', 'milestone_due', 'check_in_needed', 'goal_completion']),
  severity: z.enum(['low', 'medium', 'high']).default('medium'),
  userId: z.union([z.string(), z.number()]),
  userName: z.string(),
  message: z.string(),
  actionRequired: z.string().optional(),
  createdAt: z.string().optional()
}).passthrough();

// Team relationship schema (for team assignments)
export const TeamRelationshipSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  managerId: z.union([z.string(), z.number()]),
  managerName: z.string().optional(),
  teamName: z.string(),
  teamMembers: z.array(z.union([z.string(), z.number()])).default([]),
  createdAt: z.string().optional(),
  lastModified: z.string().optional()
}).passthrough();

// Lists
export const CoachListSchema = z.array(CoachSchema);
export const TeamMemberListSchema = z.array(TeamMemberSchema);
export const CoachingAlertListSchema = z.array(CoachingAlertSchema);
export const TeamRelationshipListSchema = z.array(TeamRelationshipSchema);

/**
 * Safe parsers with fallback defaults
 */

export function parseCoach(data) {
  try {
    return CoachSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse coach:', error.message, data);
    return {
      id: data?.id || 0,
      name: data?.name || 'Unknown Coach',
      email: data?.email,
      office: data?.office || 'Unknown',
      avatar: data?.avatar,
      teamName: data?.teamName || 'Team',
      performanceScore: 0,
      dreamCategories: []
    };
  }
}

export function parseCoachList(data) {
  if (!Array.isArray(data)) {
    console.warn('Expected array for coach list, got:', typeof data);
    return [];
  }

  return data.map((item, index) => {
    try {
      return CoachSchema.parse(item);
    } catch (error) {
      console.warn(`Failed to parse coach at index ${index}:`, error.message);
      return parseCoach(item);
    }
  }).filter(Boolean);
}

export function parseTeamMember(data) {
  try {
    return TeamMemberSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse team member:', error.message);
    return {
      id: data?.id || 0,
      name: data?.name || 'Unknown Member',
      email: data?.email,
      office: data?.office,
      avatar: data?.avatar,
      dreamCategories: []
    };
  }
}

export function parseTeamMemberList(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(item => parseTeamMember(item)).filter(Boolean);
}

export function parseTeamMetrics(data) {
  try {
    return TeamMetricsSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse team metrics:', error.message);
    return {
      teamSize: 0,
      averageScore: 0,
      engagementRate: 0,
      activeGoals: 0,
      completedGoals: 0,
      teamMembers: []
    };
  }
}

export function parseCoachingAlert(data) {
  try {
    return CoachingAlertSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse coaching alert:', error.message);
    return {
      id: data?.id || 0,
      type: 'check_in_needed',
      severity: 'medium',
      userId: data?.userId || 0,
      userName: data?.userName || 'Unknown User',
      message: data?.message || 'Check in required'
    };
  }
}

export function parseCoachingAlertList(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(item => parseCoachingAlert(item)).filter(Boolean);
}

export function parseTeamRelationship(data) {
  try {
    return TeamRelationshipSchema.parse(data);
  } catch (error) {
    console.warn('Failed to parse team relationship:', error.message);
    return {
      managerId: data?.managerId || 0,
      teamName: data?.teamName || 'Team',
      teamMembers: []
    };
  }
}

export function parseTeamRelationshipList(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(item => parseTeamRelationship(item)).filter(Boolean);
}

