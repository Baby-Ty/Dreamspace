// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.

import { memo } from 'react';
import PropTypes from 'prop-types';
import { GoalEditForm, GoalDisplay } from './goal-accordion';

/**
 * Goal Accordion Component (Orchestrator)
 * Displays goal with type-specific UI (consistency/deadline)
 */
function GoalAccordion({ 
  goal, 
  onToggleGoal,
  onDeleteGoal,
  dreamProgress = 0,
  isEditing = false,
  onStartEditing,
  onCancelEditing,
  onSaveEditing,
  editData,
  setEditData,
  canEdit = true,
  isSavingGoalEdit = false
}) {
  // Early return if no goal
  if (!goal) {
    return null;
  }

  // Templates use 'active' field, instances use 'completed'
  const isTemplate = goal.type === 'weekly_goal_template';
  // For templates: active=true means goal is active (NOT crossed out), active=false means inactive (crossed out)
  // For instances: completed=true means done (crossed out)
  const isChecked = isTemplate ? goal.active === false : goal.completed;
  
  // Handle goalType for templates, type for legacy goals
  const actualType = isTemplate ? goal.goalType : goal.type;
  const isConsistency = actualType === 'consistency' || actualType === 'weekly_goal' || goal.recurrence;
  const isDeadline = actualType === 'deadline';
  
  // Calculate progress for consistency goals
  const getConsistencyProgress = () => {
    if (!isConsistency || !goal.targetWeeks) return 0;
    // This would be calculated from weekly completions in the actual implementation
    return 0;
  };

  const consistencyProgress = getConsistencyProgress();
  
  // Calculate weeks until deadline (use weeksRemaining if available, otherwise calculate)
  const getWeeksUntilDeadline = () => {
    if (!isDeadline || !goal.targetDate) return null;
    
    // Use weeksRemaining if available (from currentWeek container)
    if (goal.weeksRemaining !== undefined) {
      return goal.weeksRemaining;
    }
    
    // Fallback: calculate from targetDate (for dream goals)
    const target = new Date(goal.targetDate);
    const now = new Date();
    const diffTime = target - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.ceil(diffDays / 7);
    return diffWeeks < 0 ? -1 : diffWeeks;
  };

  const weeksUntilDeadline = getWeeksUntilDeadline();
  
  // If editing, show edit form
  if (isEditing) {
    return (
      <GoalEditForm
        editData={editData}
        setEditData={setEditData}
        onSaveEditing={onSaveEditing}
        onCancelEditing={onCancelEditing}
        isSavingGoalEdit={isSavingGoalEdit}
      />
    );
  }

  // Show read-only display
  return (
    <GoalDisplay
      goal={goal}
      isChecked={isChecked}
      isTemplate={isTemplate}
      isConsistency={isConsistency}
      isDeadline={isDeadline}
      weeksUntilDeadline={weeksUntilDeadline}
      consistencyProgress={consistencyProgress}
      canEdit={canEdit}
      onToggleGoal={onToggleGoal}
      onStartEditing={onStartEditing}
      onDeleteGoal={onDeleteGoal}
    />
  );
}

GoalAccordion.propTypes = {
  goal: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    completed: PropTypes.bool,
    type: PropTypes.oneOf(['consistency', 'deadline']).isRequired,
    recurrence: PropTypes.oneOf(['weekly', 'monthly']),
    targetWeeks: PropTypes.number,
    startDate: PropTypes.string,
    targetDate: PropTypes.string,
    active: PropTypes.bool,
    completedAt: PropTypes.string
  }).isRequired,
  onToggleGoal: PropTypes.func,
  onDeleteGoal: PropTypes.func,
  dreamProgress: PropTypes.number,
  isEditing: PropTypes.bool,
  onStartEditing: PropTypes.func,
  onCancelEditing: PropTypes.func,
  onSaveEditing: PropTypes.func,
  canEdit: PropTypes.bool,
  editData: PropTypes.object,
  setEditData: PropTypes.func,
  isSavingGoalEdit: PropTypes.bool
};

export default memo(GoalAccordion);
