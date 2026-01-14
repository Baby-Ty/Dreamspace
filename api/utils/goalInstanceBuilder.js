/**
 * Goal Instance Builders
 * 
 * Converts templates and goal definitions into weekly goal instances
 * during the rollover process. Each builder is responsible for one goal type.
 */

const { getMonthId, monthsToWeeks, getWeeksUntilDate } = require('./weekDateUtils');

/**
 * Build a weekly goal instance from a template
 * @param {object} template - Template definition
 * @param {object} dream - Associated dream
 * @param {string} weekId - Target week ID (e.g., "2025-W47")
 * @param {object} previousInstance - Previous week's instance (optional)
 * @param {object} options - Build options
 * @param {boolean} options.decrementWeeksRemaining - Whether to decrement weeksRemaining (default: true)
 * @returns {object} Weekly goal instance
 */
function buildWeeklyGoalInstance(template, dream, weekId, previousInstance, options = {}) {
  const { decrementWeeksRemaining = true } = options;
  const wasSkipped = previousInstance?.skipped || false;
  
  // Calculate weeksRemaining based on options
  const currentWeeksRemaining = template.weeksRemaining !== undefined 
    ? template.weeksRemaining 
    : (template.targetWeeks || 0);
  
  // Decrement weeksRemaining only if requested and not skipped; -1 means "done" (after final week)
  const newWeeksRemaining = !decrementWeeksRemaining
    ? currentWeeksRemaining  // Mid-week sync: keep current value
    : wasSkipped 
      ? currentWeeksRemaining // Don't decrement if skipped
      : Math.max(-1, currentWeeksRemaining - 1);
  
  const instance = {
    id: `${template.id}_${weekId}`,
    templateId: template.id,
    type: template.recurrence === 'monthly' ? 'monthly_goal' : 'weekly_goal',
    title: template.title,
    description: template.description || '',
    dreamId: template.dreamId,
    dreamTitle: dream?.title || template.dreamTitle || '',
    dreamCategory: dream?.category || template.dreamCategory || '',
    recurrence: template.recurrence,
    completed: false,
    completedAt: null,
    skipped: false,
    weekId: weekId,
    createdAt: new Date().toISOString(),
    targetWeeks: template.targetWeeks,
    weeksRemaining: newWeeksRemaining,
    frequency: template.frequency || 1, // Copy frequency from template (default to 1 if not set)
    completionCount: 0, // Reset completion count each week
    completionDates: [], // Reset completion dates each week
  };
  
  return { instance, weeksRemaining: newWeeksRemaining };
}

/**
 * Build a monthly goal instance from a template
 * @param {object} template - Template definition
 * @param {object} dream - Associated dream
 * @param {string} weekId - Target week ID (e.g., "2025-W47")
 * @param {object} previousInstance - Previous week's instance (optional)
 * @param {object} options - Build options
 * @param {boolean} options.decrementWeeksRemaining - Whether to decrement weeksRemaining (default: true)
 * @returns {object} Monthly goal instance
 */
function buildMonthlyGoalInstance(template, dream, weekId, previousInstance, options = {}) {
  const { decrementWeeksRemaining = true } = options;
  const currentMonthId = getMonthId(weekId);
  const previousMonthId = previousInstance?.weekId ? getMonthId(previousInstance.weekId) : null;
  const isSameMonth = currentMonthId === previousMonthId;
  
  const instance = {
    id: `${template.id}_${weekId}`,
    templateId: template.id,
    type: 'monthly_goal',
    title: template.title,
    description: template.description || '',
    dreamId: template.dreamId,
    dreamTitle: dream?.title || template.dreamTitle || '',
    dreamCategory: dream?.category || template.dreamCategory || '',
    recurrence: 'monthly',
    completed: false,
    completedAt: null,
    skipped: false,
    weekId: weekId,
    createdAt: new Date().toISOString(),
    frequency: template.frequency || 2,
    monthId: currentMonthId,
  };
  
  // Carry forward counter if same month
  if (isSameMonth && previousInstance) {
    instance.completionCount = previousInstance.completionCount || 0;
    instance.completionDates = previousInstance.completionDates || [];
    // Ensure completed flag is set correctly based on completionCount
    const frequency = template.frequency || 2;
    instance.completed = (instance.completionCount >= frequency) || previousInstance.completed || false;
  } else {
    // New month - reset
    instance.completionCount = 0;
    instance.completionDates = [];
    instance.completed = false;
  }
  
  // Convert months to weeks for unified tracking
  // Initialize weeksRemaining if missing (convert from targetMonths)
  const templateWeeksRemaining = template.weeksRemaining !== undefined
    ? template.weeksRemaining
    : (template.targetWeeks || (template.targetMonths ? monthsToWeeks(template.targetMonths) : 0));
  
  // Calculate weeksRemaining based on options
  const wasSkipped = previousInstance?.skipped || false;
  const newWeeksRemaining = !decrementWeeksRemaining
    ? templateWeeksRemaining  // Mid-week sync: keep current value
    : wasSkipped
      ? templateWeeksRemaining // Don't decrement if skipped
      : Math.max(-1, templateWeeksRemaining - 1);
  
  instance.weeksRemaining = newWeeksRemaining;
  instance.targetWeeks = template.targetWeeks || (template.targetMonths ? monthsToWeeks(template.targetMonths) : undefined);
  instance.targetMonths = template.targetMonths; // Keep for display
  
  return { instance, weeksRemaining: newWeeksRemaining };
}

/**
 * Build a deadline goal instance from a goal definition
 * @param {object} goal - Goal definition from dream.goals[]
 * @param {object} dream - Associated dream
 * @param {string} weekId - Target week ID (e.g., "2025-W47")
 * @param {object} previousInstance - Previous week's instance (optional)
 * @param {object} options - Build options
 * @param {boolean} options.decrementWeeksRemaining - Whether to decrement weeksRemaining (default: true)
 * @returns {object} Deadline goal instance and update info
 */
function buildDeadlineGoalInstance(goal, dream, weekId, previousInstance, options = {}) {
  const { decrementWeeksRemaining = true } = options;
  
  // Use targetWeeks if available, otherwise calculate from targetDate (backward compatibility)
  const targetWeeks = goal.targetWeeks !== undefined
    ? goal.targetWeeks
    : (goal.targetDate ? getWeeksUntilDate(goal.targetDate, weekId) : undefined);
  
  if (targetWeeks === undefined) {
    return null; // Cannot build instance without target
  }
  
  // Initialize weeksRemaining if missing (use targetWeeks)
  const goalWeeksRemaining = goal.weeksRemaining !== undefined
    ? goal.weeksRemaining
    : targetWeeks;
  
  // Calculate weeksRemaining based on options
  const wasSkipped = previousInstance?.skipped || false;
  const newWeeksRemaining = !decrementWeeksRemaining
    ? goalWeeksRemaining  // Mid-week sync: keep current value
    : wasSkipped
      ? goalWeeksRemaining // Don't decrement if skipped
      : Math.max(-1, goalWeeksRemaining - 1);
  
  // Only create instance if deadline is still active and not completed
  if (newWeeksRemaining >= 0 && !goal.completed && goal.active === true) {
    const instance = {
      id: `${goal.id}_${weekId}`,
      templateId: goal.id,
      type: 'deadline',
      title: goal.title,
      description: goal.description || '',
      dreamId: dream.id,
      dreamTitle: dream.title,
      dreamCategory: dream.category,
      targetWeeks: targetWeeks,
      targetDate: goal.targetDate, // Keep for backward compatibility
      weeksRemaining: newWeeksRemaining,
      completed: false,
      completedAt: null,
      skipped: false,
      weekId: weekId,
      createdAt: new Date().toISOString()
    };
    
    return { instance, weeksRemaining: newWeeksRemaining, targetWeeks };
  }
  
  // No instance created, but return update info for tracking
  return { instance: null, weeksRemaining: newWeeksRemaining, targetWeeks };
}

/**
 * Build a weekly consistency goal instance from a goal definition
 * @param {object} goal - Goal definition from dream.goals[]
 * @param {object} dream - Associated dream
 * @param {string} weekId - Target week ID (e.g., "2025-W47")
 * @param {object} previousInstance - Previous week's instance (optional)
 * @param {object} options - Build options
 * @param {boolean} options.decrementWeeksRemaining - Whether to decrement weeksRemaining (default: true)
 * @returns {object} Weekly consistency goal instance and update info
 */
function buildWeeklyConsistencyGoalInstance(goal, dream, weekId, previousInstance, options = {}) {
  const { decrementWeeksRemaining = true } = options;
  
  // Initialize weeksRemaining if missing
  const goalWeeksRemaining = goal.weeksRemaining !== undefined 
    ? goal.weeksRemaining 
    : goal.targetWeeks;
  
  // Calculate weeksRemaining based on options
  const wasSkipped = previousInstance?.skipped || false;
  const newWeeksRemaining = !decrementWeeksRemaining
    ? goalWeeksRemaining  // Mid-week sync: keep current value
    : wasSkipped
      ? goalWeeksRemaining // Don't decrement if skipped
      : Math.max(-1, goalWeeksRemaining - 1);
  
  // Create instance if weeks remaining >= 0 (0 = final week, still shows)
  if (newWeeksRemaining >= 0) {
    const instance = {
      id: `${goal.id}_${weekId}`,
      templateId: goal.id,
      type: 'weekly_goal',
      title: goal.title,
      description: goal.description || '',
      dreamId: dream.id,
      dreamTitle: dream.title,
      dreamCategory: dream.category,
      recurrence: 'weekly',
      targetWeeks: goal.targetWeeks,
      frequency: goal.frequency || 1, // Copy frequency from dream goal (default to 1 if not set)
      completionCount: 0, // Reset completion count each week
      completionDates: [], // Reset completion dates each week
      weeksRemaining: newWeeksRemaining,
      completed: false,
      completedAt: null,
      skipped: false,
      weekId: weekId,
      createdAt: new Date().toISOString()
    };
    
    return { instance, weeksRemaining: newWeeksRemaining };
  }
  
  // No instance created (weeks remaining < 0 means done), but return update info
  return { instance: null, weeksRemaining: newWeeksRemaining };
}

/**
 * Build a monthly consistency goal instance from a goal definition
 * @param {object} goal - Goal definition from dream.goals[]
 * @param {object} dream - Associated dream
 * @param {string} weekId - Target week ID (e.g., "2025-W47")
 * @param {object} previousInstance - Previous week's instance (optional)
 * @param {object} options - Build options
 * @param {boolean} options.decrementWeeksRemaining - Whether to decrement weeksRemaining (default: true)
 * @returns {object} Monthly consistency goal instance and update info
 */
function buildMonthlyConsistencyGoalInstance(goal, dream, weekId, previousInstance, options = {}) {
  const { decrementWeeksRemaining = true } = options;
  const currentMonthId = getMonthId(weekId);
  const previousMonthId = previousInstance?.weekId ? getMonthId(previousInstance.weekId) : null;
  const isSameMonth = currentMonthId === previousMonthId;
  
  // Initialize weeksRemaining if missing (convert from targetMonths)
  const goalWeeksRemaining = goal.weeksRemaining !== undefined
    ? goal.weeksRemaining
    : (goal.targetWeeks || (goal.targetMonths ? monthsToWeeks(goal.targetMonths) : 0));
  
  // Calculate weeksRemaining based on options
  const wasSkipped = previousInstance?.skipped || false;
  const newWeeksRemaining = !decrementWeeksRemaining
    ? goalWeeksRemaining  // Mid-week sync: keep current value
    : wasSkipped
      ? goalWeeksRemaining // Don't decrement if skipped
      : Math.max(-1, goalWeeksRemaining - 1);
  
  // Create instance if weeks remaining >= 0 (0 = final week, still shows)
  if (newWeeksRemaining >= 0) {
    const instance = {
      id: `${goal.id}_${weekId}`,
      templateId: goal.id,
      type: 'monthly_goal',
      title: goal.title,
      description: goal.description || '',
      dreamId: dream.id,
      dreamTitle: dream.title,
      dreamCategory: dream.category,
      recurrence: 'monthly',
      targetWeeks: goal.targetWeeks || (goal.targetMonths ? monthsToWeeks(goal.targetMonths) : undefined),
      targetMonths: goal.targetMonths, // Keep for display
      weeksRemaining: newWeeksRemaining,
      frequency: goal.frequency || 2,
      monthId: currentMonthId,
      completionCount: isSameMonth && previousInstance ? (previousInstance.completionCount || 0) : 0,
      completionDates: isSameMonth && previousInstance ? (previousInstance.completionDates || []) : [],
      completed: isSameMonth && previousInstance ? ((previousInstance.completionCount || 0) >= (goal.frequency || 2)) || previousInstance.completed || false : false,
      completedAt: isSameMonth && previousInstance && previousInstance.completed ? (previousInstance.completedAt || null) : null,
      skipped: false,
      weekId: weekId,
      createdAt: new Date().toISOString()
    };
    
    return { instance, weeksRemaining: newWeeksRemaining };
  }
  
  // No instance created (weeks remaining < 0 means done), but return update info
  return { instance: null, weeksRemaining: newWeeksRemaining };
}

module.exports = {
  buildWeeklyGoalInstance,
  buildMonthlyGoalInstance,
  buildDeadlineGoalInstance,
  buildWeeklyConsistencyGoalInstance,
  buildMonthlyConsistencyGoalInstance
};
