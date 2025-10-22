// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, memo } from 'react';
import PropTypes from 'prop-types';
import { 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronRight, 
  Target,
  Trophy,
  Calendar,
  Plus,
  Edit2,
  Save,
  X,
  Trash2
} from 'lucide-react';
import { formatIsoWeek } from '../utils/dateUtils';

/**
 * Milestone Accordion Component
 * Displays milestone with expandable section showing linked goals and weekly log
 */
function MilestoneAccordion({ 
  milestone, 
  linkedGoals = [],
  onToggleMilestone,
  onDeleteMilestone,
  onAddGoalToMilestone,
  onEditGoal,
  dreamProgress = 0,
  isEditing = false,
  onStartEditing,
  onCancelEditing,
  onSaveEditing,
  editData,
  setEditData
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Early return if no milestone
  if (!milestone) {
    return null;
  }

  const hasLinkedGoals = linkedGoals.length > 0;
  const isCoachManaged = milestone.coachManaged || false;
  const isConsistency = milestone.type === 'consistency';
  
  // Calculate progress for consistency milestones
  const getConsistencyProgress = () => {
    if (!isConsistency || !milestone.targetWeeks) return 0;
    const current = milestone.streakWeeks || 0;
    return Math.min(Math.round((current / milestone.targetWeeks) * 100), 100);
  };

  const consistencyProgress = getConsistencyProgress();
  
  // If editing, show edit form
  if (isEditing) {
    return (
      <div className="rounded-2xl border-2 border-netsurit-red bg-white shadow-lg p-4">
        <h4 className="font-semibold text-professional-gray-900 mb-3">Edit Milestone</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-professional-gray-700 mb-1">
              Milestone Text
            </label>
            <input
              type="text"
              value={editData.text}
              onChange={(e) => setEditData({ ...editData, text: e.target.value })}
              className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
              placeholder="Enter milestone text"
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
              <option value="general">General</option>
            </select>
          </div>
          
          {editData.type === 'consistency' && (
            <div>
              <label className="block text-sm font-medium text-professional-gray-700 mb-1">
                Target Weeks
              </label>
              <input
                type="number"
                value={editData.targetWeeks}
                onChange={(e) => setEditData({ ...editData, targetWeeks: parseInt(e.target.value) || 12 })}
                className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
                min="1"
                max="52"
              />
            </div>
          )}
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={editData.endOnDreamComplete}
                onChange={(e) => setEditData({ ...editData, endOnDreamComplete: e.target.checked })}
                className="rounded border-professional-gray-300 text-netsurit-red focus:ring-netsurit-red"
              />
              <span className="text-sm text-professional-gray-700">End when dream is complete</span>
            </label>
          </div>
          
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
        milestone.completed
          ? 'bg-professional-gray-50 border-professional-gray-300'
          : 'bg-white border-professional-gray-200 hover:border-professional-gray-300 hover:shadow-xl'
      }`}
      data-testid={`milestone-${milestone.id}`}
    >
      {/* Milestone Header */}
      <div className="flex items-start space-x-4 p-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMilestone(milestone.id);
          }}
          className="flex-shrink-0 mt-1"
          aria-label={milestone.completed ? 'Mark milestone incomplete' : 'Mark milestone complete'}
          data-testid={`milestone-toggle-${milestone.id}`}
        >
          {milestone.completed ? (
            <CheckCircle2 className="w-6 h-6 text-professional-gray-600" aria-hidden="true" />
          ) : (
            <Circle className="w-6 h-6 text-professional-gray-400 hover:text-professional-gray-600 transition-colors duration-200" aria-hidden="true" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          {/* Milestone Title and Badge */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className={`font-medium ${
                milestone.completed 
                  ? 'text-professional-gray-700 line-through' 
                  : 'text-professional-gray-900'
              }`}>
                {milestone.text}
              </p>
              
              {/* Badges */}
              <div className="flex items-center flex-wrap gap-2 mt-1">
                {isCoachManaged && (
                  <>
                    <span className="text-xs bg-netsurit-light-coral text-netsurit-red px-2 py-1 rounded-full font-medium">
                      Coach Milestone
                    </span>
                    {isConsistency && (
                      <span className="text-xs bg-netsurit-warm-orange/20 text-netsurit-orange px-2 py-1 rounded-full font-medium">
                        {milestone.streakWeeks || 0}/{milestone.targetWeeks} weeks
                      </span>
                    )}
                  </>
                )}
                
                {/* Goals indicator */}
                {hasLinkedGoals && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center space-x-1">
                    <Target className="w-3 h-3" aria-hidden="true" />
                    <span>{linkedGoals.length} goal{linkedGoals.length !== 1 ? 's' : ''}</span>
                  </span>
                )}
                
                {!hasLinkedGoals && (
                  <span className="text-xs bg-professional-gray-100 text-professional-gray-600 px-2 py-1 rounded-full font-medium">
                    No goals yet
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {/* Edit Button */}
              {onStartEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEditing(milestone);
                  }}
                  className="flex-shrink-0 p-2 hover:bg-professional-gray-100 rounded-lg transition-colors"
                  aria-label="Edit milestone"
                  title="Edit milestone"
                >
                  <Edit2 className="w-4 h-4 text-professional-gray-600" aria-hidden="true" />
                </button>
              )}
              
              {/* Delete Button */}
              {onDeleteMilestone && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete milestone "${milestone.text}"?`)) {
                      onDeleteMilestone(milestone.id);
                    }
                  }}
                  className="flex-shrink-0 p-2 hover:bg-red-100 rounded-lg transition-colors"
                  aria-label="Delete milestone"
                  title="Delete milestone"
                >
                  <Trash2 className="w-4 h-4 text-red-600" aria-hidden="true" />
                </button>
              )}
              
              {/* Quick Add Goal Button (when no goals) */}
              {!hasLinkedGoals && onAddGoalToMilestone && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddGoalToMilestone(milestone);
                  }}
                  className="text-xs bg-professional-gray-500 text-white px-3 py-1.5 rounded-lg hover:bg-professional-gray-600 transition-colors flex items-center space-x-1 shadow-sm"
                  aria-label="Add goal to milestone"
                >
                  <Plus className="w-3 h-3" aria-hidden="true" />
                  <span>Add Goal</span>
                </button>
              )}
              
              {/* Expand/Collapse Button (when has goals) */}
              {hasLinkedGoals && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex-shrink-0 p-2 hover:bg-professional-gray-100 rounded-lg transition-colors"
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? 'Collapse goals' : 'Expand goals'}
                  data-testid={`milestone-expand-${milestone.id}`}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-professional-gray-600" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-professional-gray-600" aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Consistency Progress Bar */}
          {isConsistency && milestone.targetWeeks && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-professional-gray-600 mb-1">
                <span className="flex items-center space-x-1">
                  <Trophy className="w-3 h-3" aria-hidden="true" />
                  <span>Streak Progress</span>
                </span>
                <span className="font-medium">{consistencyProgress}%</span>
              </div>
              <div 
                className="w-full bg-professional-gray-200 rounded-full h-2"
                role="progressbar"
                aria-valuenow={consistencyProgress}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label="Milestone progress"
              >
                <div
                  className="bg-gradient-to-r from-netsurit-red to-netsurit-coral h-2 rounded-full transition-all duration-500"
                  style={{ width: `${consistencyProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Section - Linked Goals */}
      {isExpanded && (
        <div 
          className="border-t border-professional-gray-200 p-4 bg-professional-gray-50"
          role="region"
          aria-label="Linked goals and weekly history"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-professional-gray-700 flex items-center space-x-2">
              <Target className="w-4 h-4" aria-hidden="true" />
              <span>Recurring Goals ({linkedGoals.length})</span>
            </h4>
            
            {onAddGoalToMilestone && (
              <button
                onClick={() => onAddGoalToMilestone(milestone)}
                className="text-xs bg-professional-gray-500 text-white px-3 py-1.5 rounded-lg hover:bg-professional-gray-600 transition-colors flex items-center space-x-1"
                aria-label="Add goal to milestone"
              >
                <Plus className="w-3 h-3" aria-hidden="true" />
                <span>Add Goal</span>
              </button>
            )}
          </div>
          
          {hasLinkedGoals ? (
            <div className="space-y-3">
              {linkedGoals.map(goal => (
                <LinkedGoalItem 
                  key={goal.id} 
                  goal={goal}
                  milestoneStartDate={milestone.startDate}
                  onEditGoal={onEditGoal}
                  allGoals={allGoals}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-professional-gray-500 bg-white rounded-lg border border-dashed border-professional-gray-300">
              <Target className="w-8 h-8 mx-auto mb-2 text-professional-gray-300" aria-hidden="true" />
              <p className="text-sm">No goals linked to this milestone yet</p>
              <p className="text-xs mt-1">Click "Add Goal" to create a recurring goal</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Linked Goal Item Component
 * Shows a recurring goal with its weekly log
 */
const LinkedGoalItem = memo(function LinkedGoalItem({ goal, milestoneStartDate, onEditGoal, allGoals }) {
  const [showWeekLog, setShowWeekLog] = useState(false);
  
  // For new format: Find all week instances with same templateId or goalId
  // For old format: Fall back to weekLog
  let weekInstances = [];
  let completedWeeks = 0;
  
  if (goal.weekId) {
    // New format: Find all instances with same templateId
    weekInstances = (allGoals || []).filter(g => 
      g.templateId === goal.templateId || 
      (g.milestoneId === goal.milestoneId && g.dreamId === goal.dreamId)
    ).sort((a, b) => b.weekId.localeCompare(a.weekId)); // Most recent first
    completedWeeks = weekInstances.filter(g => g.completed).length;
  } else {
    // Old format: Use weekLog (for backward compatibility)
    const weekLog = goal.weekLog || {};
    const weekKeys = Object.keys(weekLog).sort().reverse();
    completedWeeks = weekKeys.filter(week => weekLog[week] === true).length;
    // Convert to instances format for display
    weekInstances = weekKeys.map(week => ({
      weekId: week,
      completed: weekLog[week]
    }));
  }

  return (
    <div 
      className="bg-white rounded-lg p-3 border border-professional-gray-200"
      data-testid={`linked-goal-${goal.id}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-medium text-professional-gray-900 text-sm">{goal.title}</p>
          {goal.description && (
            <p className="text-xs text-professional-gray-600 mt-1">{goal.description}</p>
          )}
          
          <div className="flex items-center space-x-3 mt-2 text-xs text-professional-gray-600">
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
              <span>{completedWeeks} weeks completed</span>
            </span>
            {goal.recurrence && (
              <span className="bg-professional-gray-100 px-2 py-0.5 rounded">
                {goal.recurrence === 'weekly' ? 'Weekly' : 'Once'}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-2">
          {onEditGoal && (
            <button
              onClick={() => onEditGoal(goal)}
              className="flex-shrink-0 p-1.5 hover:bg-professional-gray-100 rounded transition-colors"
              aria-label="Edit goal"
              title="Edit goal"
            >
              <Edit2 className="w-3.5 h-3.5 text-professional-gray-600" aria-hidden="true" />
            </button>
          )}
          
          {weekInstances.length > 0 && (
            <button
              onClick={() => setShowWeekLog(!showWeekLog)}
              className="flex-shrink-0 text-xs text-professional-gray-600 hover:text-professional-gray-800 font-medium"
              aria-expanded={showWeekLog}
              aria-label={showWeekLog ? 'Hide weekly history' : 'Show weekly history'}
              data-testid={`toggle-weeklog-${goal.id}`}
            >
              {showWeekLog ? 'Hide History' : 'View History'}
            </button>
          )}
        </div>
      </div>

      {/* Week Log History */}
      {showWeekLog && weekInstances.length > 0 && (
        <div className="mt-3 pt-3 border-t border-professional-gray-200">
          <h5 className="text-xs font-semibold text-professional-gray-700 mb-2 flex items-center space-x-1">
            <Calendar className="w-3 h-3" aria-hidden="true" />
            <span>Weekly History</span>
          </h5>
          <div 
            className="space-y-1 max-h-40 overflow-y-auto"
            role="list"
            aria-label="Weekly completion history"
          >
            {weekInstances.map((instance, idx) => (
              <div 
                key={instance.weekId || idx} 
                className="flex items-center justify-between text-xs py-1"
                role="listitem"
              >
                <span className="text-professional-gray-600">{formatIsoWeek(instance.weekId)}</span>
                {instance.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" aria-label="Completed" />
                ) : (
                  <Circle className="w-4 h-4 text-professional-gray-400" aria-label="Not completed" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

LinkedGoalItem.propTypes = {
  goal: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    recurrence: PropTypes.oneOf(['weekly', 'once']),
    weekLog: PropTypes.object,
    weekId: PropTypes.string,
    templateId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired,
  milestoneStartDate: PropTypes.string,
  onEditGoal: PropTypes.func,
  allGoals: PropTypes.array
};

MilestoneAccordion.propTypes = {
  milestone: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    text: PropTypes.string.isRequired,
    completed: PropTypes.bool,
    coachManaged: PropTypes.bool,
    type: PropTypes.oneOf(['consistency', 'deadline', 'general']),
    targetWeeks: PropTypes.number,
    startDate: PropTypes.string,
    streakWeeks: PropTypes.number
  }).isRequired,
  linkedGoals: PropTypes.array,
  onToggleMilestone: PropTypes.func.isRequired,
  onDeleteMilestone: PropTypes.func,
  onAddGoalToMilestone: PropTypes.func,
  onEditGoal: PropTypes.func,
  dreamProgress: PropTypes.number,
  isEditing: PropTypes.bool,
  onStartEditing: PropTypes.func,
  onCancelEditing: PropTypes.func,
  onSaveEditing: PropTypes.func,
  editData: PropTypes.object,
  setEditData: PropTypes.func
};

export default memo(MilestoneAccordion);

