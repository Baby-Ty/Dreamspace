// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.

import { memo } from 'react';
import PropTypes from 'prop-types';
import { 
  CheckCircle2, 
  Circle, 
  Target,
  Trophy,
  Calendar,
  Edit2,
  Save,
  X,
  Trash2,
  Repeat,
  Clock
} from 'lucide-react';

/**
 * Goal Accordion Component
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
  canEdit = true
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
  const isWeekly = goal.recurrence === 'weekly';
  const isMonthly = goal.recurrence === 'monthly';
  
  // Calculate progress for consistency goals
  const getConsistencyProgress = () => {
    if (!isConsistency || !goal.targetWeeks) return 0;
    // This would be calculated from weekly completions in the actual implementation
    // For now, just show the goal structure
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
    // Import getWeeksUntilDate if needed, or calculate inline
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
      <div className="rounded-2xl border-2 border-netsurit-red bg-white shadow-lg p-4">
        <h4 className="font-semibold text-professional-gray-900 mb-3">Edit Goal</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-professional-gray-700 mb-1">
              Goal Title
            </label>
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
              placeholder="Enter goal title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-professional-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={editData.description || ''}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red resize-none"
              placeholder="Add details about your goal"
              rows="2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-professional-gray-700 mb-1">
              Type
            </label>
            <select
              value={editData.type}
              onChange={(e) => setEditData({ ...editData, type: e.target.value })}
              className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
            >
              <option value="consistency">Consistency</option>
              <option value="deadline">Deadline</option>
            </select>
          </div>
          
          {editData.type === 'consistency' && (
            <>
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-1">
                  Recurrence
                </label>
                <select
                  value={editData.recurrence || 'weekly'}
                  onChange={(e) => setEditData({ ...editData, recurrence: e.target.value })}
                  className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-1">
                  Target {editData.recurrence === 'daily' ? 'Days' : editData.recurrence === 'weekly' ? 'Weeks' : 'Months'}
                </label>
                <input
                  type="number"
                  value={editData.targetWeeks || 12}
                  onChange={(e) => setEditData({ ...editData, targetWeeks: parseInt(e.target.value) || 12 })}
                  className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
                  min="1"
                  max="52"
                />
              </div>
            </>
          )}
          
          {editData.type === 'deadline' && (
            <div>
              <label className="block text-sm font-medium text-professional-gray-700 mb-1">
                Target Date
              </label>
              <input
                type="date"
                value={editData.targetDate ? editData.targetDate.split('T')[0] : ''}
                onChange={(e) => setEditData({ ...editData, targetDate: e.target.value })}
                className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
              />
            </div>
          )}
          
          <div className="flex space-x-2 pt-2">
            <button
              onClick={onSaveEditing}
              className="flex-1 bg-netsurit-red text-white px-4 py-2 rounded-lg hover:bg-netsurit-coral transition-colors flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button
              onClick={onCancelEditing}
              className="flex-1 bg-professional-gray-200 text-professional-gray-700 px-4 py-2 rounded-lg hover:bg-professional-gray-300 transition-colors flex items-center justify-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border-2 shadow-lg transition-all duration-300 ${
        isChecked
          ? 'bg-professional-gray-50 border-professional-gray-300'
          : 'bg-white border-professional-gray-200 hover:border-professional-gray-300 hover:shadow-xl'
      }`}
      data-testid={`goal-${goal.id}`}
    >
      {/* Goal Header */}
      <div className="flex items-start space-x-4 p-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            canEdit && onToggleGoal && onToggleGoal(goal.id);
          }}
          disabled={!canEdit || !onToggleGoal}
          className={`flex-shrink-0 mt-1 ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
          aria-label={isChecked ? (isTemplate ? 'Deactivate goal' : 'Mark goal incomplete') : (isTemplate ? 'Activate goal' : 'Mark goal complete')}
          data-testid={`goal-toggle-${goal.id}`}
        >
          {isChecked ? (
            <CheckCircle2 className="w-6 h-6 text-professional-gray-600" aria-hidden="true" />
          ) : (
            <Circle className="w-6 h-6 text-professional-gray-400 hover:text-professional-gray-600 transition-colors duration-200" aria-hidden="true" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          {/* Goal Title and Badges */}
          <div className="flex items-start justify-between mb-2 gap-2">
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className={`font-medium ${
                  isChecked 
                    ? 'text-professional-gray-700 line-through' 
                    : 'text-professional-gray-900'
                }`}>
                  {goal.title}
                </p>
                
                {/* Weeks remaining - top right */}
                {isConsistency && goal.weeksRemaining !== undefined && goal.weeksRemaining >= 0 && (
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <Clock className={`w-3.5 h-3.5 ${
                      goal.weeksRemaining === 0 ? 'text-netsurit-orange' :
                      goal.weeksRemaining === 1 ? 'text-netsurit-coral' :
                      'text-professional-gray-500'
                    }`} aria-hidden="true" />
                    <span className={`text-xs font-medium whitespace-nowrap ${
                      goal.weeksRemaining === 0 ? 'text-netsurit-orange font-semibold' :
                      goal.weeksRemaining === 1 ? 'text-netsurit-coral' :
                      'text-professional-gray-600'
                    }`}>
                      {goal.weeksRemaining === 0 ? 'Final week!' :
                       goal.weeksRemaining === 1 ? '1 week left' :
                       `${goal.weeksRemaining} weeks left`}
                    </span>
                  </div>
                )}
                
                {isDeadline && goal.targetDate && (
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <Clock className={`w-3.5 h-3.5 ${
                      weeksUntilDeadline !== null && weeksUntilDeadline < 0 ? 'text-red-600' :
                      weeksUntilDeadline === 0 ? 'text-netsurit-orange' :
                      weeksUntilDeadline === 1 ? 'text-netsurit-coral' :
                      'text-professional-gray-500'
                    }`} aria-hidden="true" />
                    <span className={`text-xs font-medium whitespace-nowrap ${
                      weeksUntilDeadline !== null && weeksUntilDeadline < 0 ? 'text-red-700 font-semibold' :
                      weeksUntilDeadline === 0 ? 'text-netsurit-orange font-semibold' :
                      weeksUntilDeadline === 1 ? 'text-netsurit-coral' :
                      'text-professional-gray-600'
                    }`}>
                      {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
              
              {goal.description && (
                <p className="text-xs text-professional-gray-600 mt-1">{goal.description}</p>
              )}
              
              {/* Type-specific Badges */}
              <div className="flex items-center flex-wrap gap-2 mt-2">
                {isConsistency && (
                  <>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium flex items-center space-x-1">
                      <Repeat className="w-3 h-3" aria-hidden="true" />
                      <span>Consistency</span>
                    </span>
                    {goal.recurrence && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium capitalize">
                        {goal.recurrence}
                      </span>
                    )}
                    {goal.targetWeeks && (
                      <span className="text-xs bg-netsurit-warm-orange/20 text-netsurit-orange px-2 py-1 rounded-full font-medium">
                        Target: {goal.targetWeeks} {goal.recurrence === 'daily' ? 'days' : goal.recurrence === 'weekly' ? 'weeks' : 'months'}
                      </span>
                    )}
                  </>
                )}
                
                {isDeadline && (
                  <>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center space-x-1">
                      <Calendar className="w-3 h-3" aria-hidden="true" />
                      <span>Deadline</span>
                    </span>
                    {goal.targetDate && (
                      <span className="text-xs bg-netsurit-light-coral/50 text-netsurit-red px-2 py-1 rounded-full font-medium">
                        {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Edit Button */}
              {onStartEditing && canEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEditing(goal);
                  }}
                  className="flex-shrink-0 p-2 hover:bg-professional-gray-100 rounded-lg transition-colors"
                  aria-label="Edit goal"
                  title="Edit goal"
                >
                  <Edit2 className="w-4 h-4 text-professional-gray-600" aria-hidden="true" />
                </button>
              )}
              
              {/* Delete Button */}
              {onDeleteGoal && canEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete goal "${goal.title}"?`)) {
                      onDeleteGoal(goal.id);
                    }
                  }}
                  className="flex-shrink-0 p-2 hover:bg-red-100 rounded-lg transition-colors"
                  aria-label="Delete goal"
                  title="Delete goal"
                >
                  <Trash2 className="w-4 h-4 text-red-600" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Consistency Progress Bar - would be calculated from weekly completions */}
          {isConsistency && goal.targetWeeks && !isChecked && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-professional-gray-600 mb-1">
                <span className="flex items-center space-x-1">
                  <Trophy className="w-3 h-3" aria-hidden="true" />
                  <span>Progress</span>
                </span>
                <span className="font-medium">{consistencyProgress}%</span>
              </div>
              <div 
                className="w-full bg-professional-gray-200 rounded-full h-2"
                role="progressbar"
                aria-valuenow={consistencyProgress}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label="Goal progress"
              >
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${consistencyProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
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
  setEditData: PropTypes.func
};

export default memo(GoalAccordion);

