import { Plus, X, Loader2 } from 'lucide-react';
import GoalConsistencyChooser from '../../../components/GoalConsistencyChooser';

/**
 * Form component for adding goals to a dream
 * Uses GoalConsistencyChooser for goal type selection
 */
export default function AddGoalForm({
  newGoalData,
  setNewGoalData,
  onAddGoal,
  onCancel,
  isSavingGoal = false
}) {
  const handleConsistencyChange = (updates) => {
    setNewGoalData(prev => {
      const newData = { ...prev };
      
      if (updates.consistency !== undefined) {
        // Map consistency to type/recurrence
        if (updates.consistency === 'deadline') {
          newData.type = 'deadline';
          newData.recurrence = undefined;
          newData.consistency = 'deadline';
        } else {
          newData.type = 'consistency';
          newData.recurrence = updates.consistency;
          newData.consistency = updates.consistency;
        }
      }
      
      if (updates.frequency !== undefined) {
        newData.frequency = updates.frequency;
      }
      if (updates.targetWeeks !== undefined) {
        newData.targetWeeks = updates.targetWeeks;
      }
      if (updates.targetMonths !== undefined) {
        newData.targetMonths = updates.targetMonths;
      }
      if (updates.targetDate !== undefined) {
        newData.targetDate = updates.targetDate;
      }
      
      return newData;
    });
  };

  const isValid = newGoalData.title.trim() && 
    (newGoalData.type !== 'deadline' || newGoalData.targetDate);

  return (
    <div className="bg-professional-gray-50 rounded-xl border border-professional-gray-200 p-4 space-y-4 shadow-lg">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-professional-gray-900 text-sm">Add New Goal</h4>
        <button
          onClick={onCancel}
          className="text-professional-gray-500 hover:text-professional-gray-700 transition-colors"
          aria-label="Cancel add goal"
        >
          <X className="w-4 h-4" aria-hidden="true" />
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

      {/* Goal Type Chooser */}
      <GoalConsistencyChooser
        consistency={newGoalData.consistency || newGoalData.recurrence || 'weekly'}
        frequency={newGoalData.frequency}
        targetWeeks={newGoalData.targetWeeks}
        targetMonths={newGoalData.targetMonths}
        targetDate={newGoalData.targetDate}
        onChange={handleConsistencyChange}
        showHelp={false}
      />

      {/* Consistency explanation */}
      {newGoalData.type === 'consistency' && (
        <p className="text-xs text-professional-gray-500">
          {newGoalData.recurrence === 'weekly' && `Goal will show every week; complete it ${newGoalData.frequency || 1}x per week to mark the week complete`}
          {newGoalData.recurrence === 'monthly' && `Goal will show every week; complete it ${newGoalData.frequency || 2}x per month to mark the month complete`}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onAddGoal}
          disabled={!isValid || isSavingGoal}
          className="flex-1 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm font-medium"
        >
          {isSavingGoal ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Adding...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add Goal</span>
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-professional-gray-200 text-professional-gray-700 rounded-lg hover:bg-professional-gray-300 focus:outline-none focus:ring-2 focus:ring-professional-gray-400 transition-all duration-200 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
