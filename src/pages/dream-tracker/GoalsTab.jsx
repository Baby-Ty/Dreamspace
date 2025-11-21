// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import React from 'react';
import PropTypes from 'prop-types';
import { 
  Plus, 
  X, 
  Target,
  Repeat,
  Calendar
} from 'lucide-react';
import GoalAccordion from '../../components/GoalAccordion';

/**
 * Goals Tab - Manages dream goals (add, edit, delete, toggle)
 * @component
 */
export function GoalsTab({ 
  goals, 
  isAddingGoal,
  setIsAddingGoal,
  newGoalData,
  setNewGoalData,
  onAddGoal, 
  onToggleGoal, 
  onDeleteGoal,
  dreamId,
  dreamProgress,
  editingGoal,
  onStartEditingGoal,
  onCancelEditingGoal,
  onSaveEditedGoal,
  goalEditData,
  setGoalEditData,
  canEdit = true
}) {
  const completedCount = goals.filter(g => g.completed).length;
  
  const resetNewGoalData = () => {
    setNewGoalData({
      title: '',
      description: '',
      type: 'consistency',
      recurrence: 'weekly',
      targetWeeks: 12,
      targetMonths: 6,
      frequency: 1, // Default to 1 for weekly (will be 2 for monthly)
      startDate: '',
      targetDate: ''
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-professional-gray-900">Goals</h3>
        <div className="text-xs text-professional-gray-600">
          {completedCount} of {goals.length} completed
        </div>
      </div>

      {!canEdit && (
        <div className="text-xs text-professional-gray-500 italic mb-2">
          View only - Coach viewing mode
        </div>
      )}

      {/* Add New Goal Button or Form */}
      {!isAddingGoal ? (
        canEdit && (
          <button
            onClick={() => setIsAddingGoal(true)}
            className="w-full bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-3 rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Goal</span>
          </button>
        )
      ) : (
        <div className="bg-professional-gray-50 rounded-xl border border-professional-gray-200 p-4 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-professional-gray-900 text-sm">Add New Goal</h4>
            <button
              onClick={() => {
                setIsAddingGoal(false);
                resetNewGoalData();
              }}
              className="text-professional-gray-500 hover:text-professional-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-professional-gray-700 mb-1">
              Goal Title <span className="text-netsurit-red">*</span>
            </label>
            <input
              type="text"
              value={newGoalData.title}
              onChange={(e) => setNewGoalData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Gym 3x a week"
              className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-professional-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={newGoalData.description}
              onChange={(e) => setNewGoalData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add details about this goal..."
              rows={2}
              className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 text-sm resize-none"
            />
          </div>

          {/* Goal Type */}
          <div>
            <label className="block text-xs font-medium text-professional-gray-700 mb-2">
              Goal Type <span className="text-netsurit-red">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewGoalData(prev => ({ ...prev, type: 'consistency' }))}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  newGoalData.type === 'consistency'
                    ? 'bg-netsurit-red text-white shadow-md'
                    : 'bg-white border border-professional-gray-300 text-professional-gray-700 hover:border-netsurit-red'
                }`}
              >
                <Repeat className="w-3.5 h-3.5 mx-auto mb-1" />
                Consistency
              </button>
              <button
                type="button"
                onClick={() => setNewGoalData(prev => ({ ...prev, type: 'deadline' }))}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  newGoalData.type === 'deadline'
                    ? 'bg-netsurit-red text-white shadow-md'
                    : 'bg-white border border-professional-gray-300 text-professional-gray-700 hover:border-netsurit-red'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 mx-auto mb-1" />
                Deadline
              </button>
            </div>
            <p className="text-xs text-professional-gray-500 mt-1">
              {newGoalData.type === 'consistency' && 'Track this goal weekly or monthly over time'}
              {newGoalData.type === 'deadline' && 'Complete this goal by a specific date'}
            </p>
          </div>

          {/* Consistency Options */}
          {newGoalData.type === 'consistency' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-professional-gray-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={newGoalData.recurrence}
                    onChange={(e) => {
                      const newRecurrence = e.target.value;
                      setNewGoalData(prev => ({ 
                        ...prev, 
                        recurrence: newRecurrence,
                        frequency: newRecurrence === 'weekly' ? 1 : (newRecurrence === 'monthly' ? 2 : prev.frequency)
                      }));
                    }}
                    className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 text-sm"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-professional-gray-700 mb-1">
                    {newGoalData.recurrence === 'monthly' ? 'Duration (months)' : 'Duration (weeks)'}
                  </label>
                  <input
                    type="number"
                    value={newGoalData.recurrence === 'monthly' ? newGoalData.targetMonths || 6 : newGoalData.targetWeeks}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setNewGoalData(prev => ({
                        ...prev,
                        ...(prev.recurrence === 'monthly' 
                          ? { targetMonths: value }
                          : { targetWeeks: value }
                        )
                      }));
                    }}
                    min="1"
                    max={newGoalData.recurrence === 'monthly' ? 24 : 52}
                    className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 text-sm"
                  />
                </div>
              </div>
              {/* Weekly frequency input */}
              {newGoalData.recurrence === 'weekly' && (
                <div>
                  <label className="block text-xs font-medium text-professional-gray-700 mb-1">
                    Completions per week <span className="text-netsurit-red">*</span>
                  </label>
                  <input
                    type="number"
                    value={newGoalData.frequency || 1}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setNewGoalData(prev => ({ ...prev, frequency: Math.max(1, Math.min(7, value)) }));
                    }}
                    min="1"
                    max="7"
                    className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 text-sm"
                    placeholder="e.g., 3"
                  />
                  <p className="text-xs text-professional-gray-500 mt-1">
                    How many times you want to complete this goal each week (e.g., 3x = three times per week)
                  </p>
                </div>
              )}
              
              {/* Monthly frequency input */}
              {newGoalData.recurrence === 'monthly' && (
                <div>
                  <label className="block text-xs font-medium text-professional-gray-700 mb-1">
                    Completions per month <span className="text-netsurit-red">*</span>
                  </label>
                  <input
                    type="number"
                    value={newGoalData.frequency || 2}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setNewGoalData(prev => ({ ...prev, frequency: Math.max(1, Math.min(31, value)) }));
                    }}
                    min="1"
                    max="31"
                    className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 text-sm"
                    placeholder="e.g., 2"
                  />
                  <p className="text-xs text-professional-gray-500 mt-1">
                    How many times you want to complete this goal each month (e.g., 2x = twice per month)
                  </p>
                </div>
              )}
              <p className="text-xs text-professional-gray-500 mt-1">
                {newGoalData.recurrence === 'weekly' && `Goal will show every week; complete it ${newGoalData.frequency || 1}x per week to mark the week complete`}
                {newGoalData.recurrence === 'monthly' && `Goal will show every week; complete it ${newGoalData.frequency || 2}x per month to mark the month complete`}
              </p>
            </>
          )}

          {/* Deadline Options */}
          {newGoalData.type === 'deadline' && (
            <div>
              <label className="block text-xs font-medium text-professional-gray-700 mb-1">
                Target Date <span className="text-netsurit-red">*</span>
              </label>
              <input
                type="date"
                value={newGoalData.targetDate}
                onChange={(e) => setNewGoalData(prev => ({ ...prev, targetDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 text-sm"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onAddGoal}
              disabled={!newGoalData.title.trim() || (newGoalData.type === 'deadline' && !newGoalData.targetDate)}
              className="flex-1 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Add Goal</span>
            </button>
            <button
              onClick={() => {
                setIsAddingGoal(false);
                resetNewGoalData();
              }}
              className="px-4 py-2 bg-professional-gray-200 text-professional-gray-700 rounded-lg hover:bg-professional-gray-300 focus:outline-none focus:ring-2 focus:ring-professional-gray-400 transition-all duration-200 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Goals List with Accordion */}
      <div className="space-y-2" role="list" aria-label="Goals">
        {goals.length === 0 ? (
          <div className="text-center py-8" role="status">
            <Target className="w-10 h-10 mx-auto mb-3 text-professional-gray-300" aria-hidden="true" />
            <p className="text-professional-gray-500 text-sm">No goals yet. Add your first goal above!</p>
            <p className="text-xs text-professional-gray-400 mt-1">Goals can be tracked weekly in the Week Ahead section</p>
          </div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} role="listitem">
              <GoalAccordion
                goal={goal}
                onToggleGoal={canEdit ? onToggleGoal : undefined}
                onDeleteGoal={canEdit ? onDeleteGoal : undefined}
                dreamProgress={dreamProgress}
                isEditing={editingGoal === goal.id}
                onStartEditing={canEdit ? onStartEditingGoal : undefined}
                onCancelEditing={onCancelEditingGoal}
                onSaveEditing={onSaveEditedGoal}
                editData={goalEditData}
                setEditData={setGoalEditData}
                canEdit={canEdit}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

GoalsTab.propTypes = {
  goals: PropTypes.array.isRequired,
  isAddingGoal: PropTypes.bool.isRequired,
  setIsAddingGoal: PropTypes.func.isRequired,
  newGoalData: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    type: PropTypes.string,
    recurrence: PropTypes.string,
    targetWeeks: PropTypes.number,
    targetMonths: PropTypes.number,
    frequency: PropTypes.number,
    startDate: PropTypes.string,
    targetDate: PropTypes.string
  }).isRequired,
  setNewGoalData: PropTypes.func.isRequired,
  onAddGoal: PropTypes.func.isRequired,
  onToggleGoal: PropTypes.func.isRequired,
  onDeleteGoal: PropTypes.func.isRequired,
  dreamId: PropTypes.string.isRequired,
  dreamProgress: PropTypes.number.isRequired,
  editingGoal: PropTypes.string,
  onStartEditingGoal: PropTypes.func.isRequired,
  onCancelEditingGoal: PropTypes.func.isRequired,
  onSaveEditedGoal: PropTypes.func.isRequired,
  goalEditData: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    type: PropTypes.string,
    recurrence: PropTypes.string,
    targetWeeks: PropTypes.number,
    startDate: PropTypes.string,
    targetDate: PropTypes.string
  }).isRequired,
  setGoalEditData: PropTypes.func.isRequired,
  canEdit: PropTypes.bool
};

export default React.memo(GoalsTab);







