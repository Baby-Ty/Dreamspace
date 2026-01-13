// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
// DoD: validated I/O with Zod; consistent error shape; unit tested; CI green; health check passing.

import { dateToWeeks, monthsToWeeks } from './dateUtils';

/**
 * Build a goal instance for the current week
 * Centralized logic to ensure consistency across Dashboard, Dream Tracker, and Dream Book
 * 
 * @param {Object} params - Goal parameters
 * @param {string} params.goalId - Unique goal ID
 * @param {string} params.templateId - Template ID (for tracking which template created this instance)
 * @param {string} params.type - Goal type: 'deadline', 'weekly_goal', 'consistency'
 * @param {string} params.title - Goal title
 * @param {string} params.description - Goal description
 * @param {string} params.dreamId - Associated dream ID
 * @param {string} params.dreamTitle - Associated dream title
 * @param {string} params.dreamCategory - Associated dream category
 * @param {string} params.consistency - Consistency type: 'weekly', 'monthly', 'deadline'
 * @param {number} params.targetWeeks - Target weeks for completion
 * @param {number} params.targetMonths - Target months for monthly goals
 * @param {string} params.targetDate - Target date for deadline goals (ISO string)
 * @param {number} params.frequency - Frequency for weekly/monthly goals (how many times per period)
 * @param {string} params.weekId - ISO week string
 * @param {string} params.currentWeekIso - Current ISO week (for calculations)
 * @param {boolean} params.completed - Whether goal is already completed
 * @param {string} params.completedAt - Completion timestamp
 * @param {number} params.completionCount - Current completion count for frequency-based goals
 * @param {Array} params.completionDates - Array of completion dates
 * @param {number} params.weeksRemaining - Weeks remaining (override calculated value)
 * @param {string} params.recurrence - Recurrence pattern: 'weekly', 'monthly'
 * 
 * @returns {Object} Goal instance ready for currentWeek container
 */
export function buildGoalInstance({
  goalId,
  templateId,
  type,
  title,
  description = '',
  dreamId = null,
  dreamTitle = '',
  dreamCategory = '',
  consistency = null,
  targetWeeks = null,
  targetMonths = null,
  targetDate = null,
  frequency = null,
  weekId,
  currentWeekIso = null,
  completed = false,
  completedAt = null,
  completionCount = 0,
  completionDates = [],
  weeksRemaining = null,
  recurrence = null,
}) {
  // Calculate target weeks and weeks remaining based on goal type
  let calculatedTargetWeeks = targetWeeks;
  let calculatedWeeksRemaining = weeksRemaining;

  if (consistency === 'deadline' && targetDate && currentWeekIso) {
    calculatedTargetWeeks = dateToWeeks(targetDate, currentWeekIso);
    calculatedWeeksRemaining = calculatedTargetWeeks;
  } else if (consistency === 'monthly' && targetMonths) {
    calculatedTargetWeeks = monthsToWeeks(targetMonths);
    calculatedWeeksRemaining = calculatedTargetWeeks;
  } else if (targetWeeks !== null) {
    calculatedTargetWeeks = targetWeeks;
    calculatedWeeksRemaining = weeksRemaining !== null ? weeksRemaining : targetWeeks;
  }

  // Determine goal type if not explicitly provided
  const goalType = type || (consistency === 'deadline' ? 'deadline' : 'weekly_goal');

  // Determine recurrence pattern
  const goalRecurrence = recurrence || (consistency === 'deadline' ? undefined : consistency);

  // Calculate frequency based on consistency type
  let goalFrequency = frequency;
  if (goalFrequency === null) {
    if (consistency === 'monthly') {
      goalFrequency = 2; // Default: twice per month
    } else if (consistency === 'weekly') {
      goalFrequency = 1; // Default: once per week
    }
  }

  // Build the goal instance
  const instance = {
    id: goalId,
    templateId: templateId || goalId,
    type: goalType,
    title,
    description,
    dreamId,
    dreamTitle,
    dreamCategory,
    weekId,
    createdAt: new Date().toISOString(),
    completed,
    completedAt,
    skipped: false,
  };

  // Add deadline-specific fields
  if (consistency === 'deadline' || goalType === 'deadline') {
    instance.targetWeeks = calculatedTargetWeeks;
    instance.targetDate = targetDate;
    instance.weeksRemaining = calculatedWeeksRemaining;
  } else {
    // Add recurrence-based goal fields
    instance.recurrence = goalRecurrence;
    instance.targetWeeks = calculatedTargetWeeks;
    instance.weeksRemaining = calculatedWeeksRemaining;

    if (consistency === 'monthly' || recurrence === 'monthly') {
      instance.targetMonths = targetMonths;
    }

    // Add frequency and completion tracking
    if (goalFrequency !== null) {
      instance.frequency = goalFrequency;
      instance.completionCount = completionCount;
      instance.completionDates = completionDates;
    }
  }

  return instance;
}

/**
 * Build a dream goal (for storing in dream.goals array)
 * Similar to goal instance but with slight differences in structure
 * 
 * @param {Object} params - Same as buildGoalInstance
 * @returns {Object} Goal object ready for dream.goals array
 */
export function buildDreamGoal({
  goalId,
  title,
  type = 'consistency',
  recurrence = null,
  targetWeeks = null,
  targetMonths = null,
  targetDate = null,
  frequency = null,
  weeksRemaining = null,
  consistency = null,
  completed = false,
  completedAt = null,
  active = true,
  currentWeekIso = null,
}) {
  // Calculate weeks if needed
  let calculatedWeeksRemaining = weeksRemaining;

  if (consistency === 'deadline' && targetDate && currentWeekIso) {
    const weeks = dateToWeeks(targetDate, currentWeekIso);
    calculatedWeeksRemaining = weeks;
    targetWeeks = weeks;
  } else if (consistency === 'monthly' && targetMonths) {
    calculatedWeeksRemaining = monthsToWeeks(targetMonths);
    targetWeeks = calculatedWeeksRemaining;
  } else if (targetWeeks !== null && weeksRemaining === null) {
    calculatedWeeksRemaining = targetWeeks;
  }

  // Determine type
  const goalType = type || (consistency === 'deadline' ? 'deadline' : 'consistency');

  // Determine recurrence
  const goalRecurrence = recurrence || (consistency === 'deadline' ? undefined : consistency);

  const dreamGoal = {
    id: goalId,
    title,
    type: goalType,
    active,
    completed,
    createdAt: new Date().toISOString(),
  };

  // Add deadline-specific fields
  if (consistency === 'deadline' || goalType === 'deadline') {
    dreamGoal.targetWeeks = targetWeeks;
    dreamGoal.targetDate = targetDate;
    dreamGoal.weeksRemaining = calculatedWeeksRemaining;
    dreamGoal.startDate = new Date().toISOString();
  } else {
    // Add recurrence-based goal fields
    dreamGoal.recurrence = goalRecurrence;
    dreamGoal.targetWeeks = targetWeeks;
    dreamGoal.weeksRemaining = calculatedWeeksRemaining;
    dreamGoal.startDate = new Date().toISOString();

    if (consistency === 'monthly' || recurrence === 'monthly') {
      dreamGoal.targetMonths = targetMonths;
    }

    if (frequency !== null) {
      dreamGoal.frequency = frequency;
    }
  }

  if (completedAt) {
    dreamGoal.completedAt = completedAt;
  }

  return dreamGoal;
}

/**
 * Build a goal instance from a template
 * Convenience function for auto-instantiation from templates
 * 
 * @param {Object} template - Template object
 * @param {string} weekId - ISO week string
 * @returns {Object} Goal instance
 */
export function buildInstanceFromTemplate(template, weekId) {
  return buildGoalInstance({
    goalId: `${template.id}_${weekId}`,
    templateId: template.id,
    type: 'weekly_goal',
    title: template.title,
    description: template.description || '',
    dreamId: template.dreamId,
    dreamTitle: template.dreamTitle,
    dreamCategory: template.dreamCategory,
    consistency: template.recurrence || 'weekly',
    recurrence: template.recurrence || 'weekly',
    targetWeeks: template.targetWeeks || (template.targetMonths ? monthsToWeeks(template.targetMonths) : undefined),
    targetMonths: template.targetMonths,
    frequency: template.recurrence === 'weekly' 
      ? (template.frequency || 1) 
      : (template.recurrence === 'monthly' ? (template.frequency || 2) : undefined),
    weeksRemaining: template.weeksRemaining !== undefined 
      ? template.weeksRemaining 
      : (template.targetWeeks || (template.targetMonths ? monthsToWeeks(template.targetMonths) : undefined)),
    weekId,
  });
}

/**
 * Build a goal instance from a dream goal
 * Convenience function for auto-instantiation from dream goals
 * 
 * @param {Object} dreamGoal - Dream goal object
 * @param {string} dreamId - Dream ID
 * @param {string} dreamTitle - Dream title
 * @param {string} dreamCategory - Dream category
 * @param {string} weekId - ISO week string
 * @param {string} currentWeekIso - Current ISO week (for date calculations)
 * @returns {Object} Goal instance
 */
export function buildInstanceFromDreamGoal(dreamGoal, dreamId, dreamTitle, dreamCategory, weekId, currentWeekIso) {
  const goalId = dreamGoal.id || dreamGoal.goalId;

  if (dreamGoal.type === 'deadline') {
    const weeksRemaining = dreamGoal.weeksRemaining !== undefined
      ? dreamGoal.weeksRemaining
      : (dreamGoal.targetWeeks !== undefined
          ? dreamGoal.targetWeeks
          : (dreamGoal.targetDate
              ? dateToWeeks(dreamGoal.targetDate, currentWeekIso)
              : -1));

    return buildGoalInstance({
      goalId: `${goalId}_${weekId}`,
      templateId: goalId,
      type: 'deadline',
      title: dreamGoal.title,
      description: dreamGoal.description || '',
      dreamId,
      dreamTitle,
      dreamCategory,
      consistency: 'deadline',
      targetWeeks: dreamGoal.targetWeeks || weeksRemaining,
      targetDate: dreamGoal.targetDate,
      weeksRemaining,
      completed: dreamGoal.completed || false,
      completedAt: dreamGoal.completedAt || null,
      weekId,
    });
  }

  // Consistency goal
  return buildGoalInstance({
    goalId: `${goalId}_${weekId}`,
    templateId: goalId,
    type: 'weekly_goal',
    title: dreamGoal.title,
    description: dreamGoal.description || '',
    dreamId,
    dreamTitle,
    dreamCategory,
    consistency: dreamGoal.recurrence || 'weekly',
    recurrence: dreamGoal.recurrence || 'weekly',
    targetWeeks: dreamGoal.targetWeeks || (dreamGoal.targetMonths ? monthsToWeeks(dreamGoal.targetMonths) : undefined),
    targetMonths: dreamGoal.targetMonths,
    frequency: dreamGoal.recurrence === 'weekly' 
      ? (dreamGoal.frequency || 1) 
      : (dreamGoal.recurrence === 'monthly' ? (dreamGoal.frequency || 2) : undefined),
    weeksRemaining: dreamGoal.weeksRemaining !== undefined 
      ? dreamGoal.weeksRemaining 
      : (dreamGoal.targetWeeks || (dreamGoal.targetMonths ? monthsToWeeks(dreamGoal.targetMonths) : undefined)),
    completed: dreamGoal.completed || false,
    completedAt: dreamGoal.completedAt || null,
    completionCount: 0,
    completionDates: [],
    weekId,
  });
}

export default {
  buildGoalInstance,
  buildDreamGoal,
  buildInstanceFromTemplate,
  buildInstanceFromDreamGoal,
};
