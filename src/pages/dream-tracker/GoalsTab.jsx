
import React from 'react';
import PropTypes from 'prop-types';
import { Plus, Target } from 'lucide-react';
import GoalAccordion from '../../components/GoalAccordion';
import { AddGoalForm } from './goals-tab';

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
  canEdit = true,
  isSavingGoal = false,
  isSavingGoalEdit = false
}) {
  const completedCount = goals.filter(g => g.completed).length;
  
  const resetNewGoalData = () => {
    setNewGoalData({
      title: '',
      description: '',
      type: 'consistency',
      recurrence: 'weekly',
      consistency: 'weekly',
      targetWeeks: 12,
      targetMonths: 6,
      frequency: 1,
      startDate: '',
      targetDate: ''
    });
  };

  const handleCancel = () => {
    setIsAddingGoal(false);
    resetNewGoalData();
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
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add New Goal</span>
          </button>
        )
      ) : (
        <AddGoalForm
          newGoalData={newGoalData}
          setNewGoalData={setNewGoalData}
          onAddGoal={onAddGoal}
          onCancel={handleCancel}
          isSavingGoal={isSavingGoal}
        />
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
                isSavingGoalEdit={isSavingGoalEdit}
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
    targetWeeks: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    targetMonths: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    frequency: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
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
    targetWeeks: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    startDate: PropTypes.string,
    targetDate: PropTypes.string
  }).isRequired,
  setGoalEditData: PropTypes.func.isRequired,
  canEdit: PropTypes.bool,
  isSavingGoal: PropTypes.bool,
  isSavingGoalEdit: PropTypes.bool
};

export default React.memo(GoalsTab);