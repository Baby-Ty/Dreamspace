import { logger } from '../../../../utils/logger';

/**
 * Update parent deadline goal in dream when toggled
 * @param {Object} toggledGoal - The toggled goal from current week
 * @param {Object} currentUser - Current user object
 * @param {Array} weeklyGoals - Weekly goal templates
 * @param {Function} updateDeadlineGoalAndTemplate - Atomic update function
 * @returns {Promise<void>}
 */
export async function updateParentDeadlineGoal(toggledGoal, currentUser, weeklyGoals, updateDeadlineGoalAndTemplate) {
  if (!toggledGoal?.dreamId || toggledGoal.type !== 'deadline') {
    return; // Not a deadline goal
  }
  
  logger.debug('updateParentDeadlineGoal', 'Updating parent goal in dream', {
    dreamId: toggledGoal.dreamId,
    goalId: toggledGoal.templateId || toggledGoal.id,
    completed: toggledGoal.completed
  });
  
  // Find the parent dream
  const parentDream = currentUser?.dreamBook?.find(d => d.id === toggledGoal.dreamId);
  if (!parentDream) {
    logger.warn('updateParentDeadlineGoal', 'Parent dream not found');
    return;
  }
  
  // Find the parent goal (use templateId if available, otherwise use goalId)
  const parentGoalId = toggledGoal.templateId || toggledGoal.id;
  const parentGoal = parentDream.goals?.find(g => g.id === parentGoalId);
  if (!parentGoal) {
    logger.warn('updateParentDeadlineGoal', 'Parent goal not found in dream');
    return;
  }
  
  // Update parent goal completion status to match current week goal
  const updatedParentGoal = {
    ...parentGoal,
    completed: toggledGoal.completed,
    active: toggledGoal.completed ? false : parentGoal.active,
    completedAt: toggledGoal.completed ? new Date().toISOString() : null,
    weeksRemaining: toggledGoal.completed 
      ? -1 
      : (parentGoal.weeksRemaining !== undefined ? parentGoal.weeksRemaining : parentGoal.targetWeeks)
  };
  
  // Find the template if it exists (to prevent it from being generated in future weeks)
  const template = weeklyGoals?.find(t => 
    t.type === 'weekly_goal_template' && 
    (t.id === parentGoalId || t.goalId === parentGoalId)
  );
  
  const updatedTemplate = template ? {
    ...template,
    completed: toggledGoal.completed,
    active: toggledGoal.completed ? false : template.active,
    completedAt: toggledGoal.completed ? new Date().toISOString() : null
  } : null;
  
  // ATOMIC UPDATE: Single write to prevent race condition
  await updateDeadlineGoalAndTemplate(
    toggledGoal.dreamId, 
    updatedParentGoal, 
    updatedTemplate
  );
  
  logger.debug('updateParentDeadlineGoal', 'Atomic update complete', {
    parentGoalId,
    status: toggledGoal.completed ? 'complete and inactive' : 'incomplete'
  });
  
  // If completed, note that it won't appear in future weeks
  if (toggledGoal.completed) {
    logger.info('updateParentDeadlineGoal', 'Deadline goal completed early! Marked inactive - will not appear in future weeks');
  }
}
