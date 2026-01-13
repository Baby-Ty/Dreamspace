import { X, Repeat, Calendar, Target } from 'lucide-react';
import HelpTooltip from '../../../components/HelpTooltip';

/**
 * Form component for adding new goals
 * Supports weekly, monthly, and deadline goal types
 */
export default function AddGoalForm({
  newGoal,
  dreamBook,
  onSubmit,
  onCancel,
  onChange
}) {
  return (
    <form 
      onSubmit={onSubmit} 
      className="p-4 rounded-xl border-2 border-netsurit-red/20 bg-gradient-to-br from-netsurit-red/5 to-white space-y-3 shadow-lg" 
      data-testid="add-goal-form"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-base font-bold text-professional-gray-900">Add New Goal</h4>
        <button
          type="button"
          onClick={onCancel}
          className="text-professional-gray-400 hover:text-professional-gray-600 p-1.5 rounded-lg hover:bg-white transition-all"
          aria-label="Cancel add goal"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
      
      {/* Goal Title */}
      <input
        type="text"
        value={newGoal.title}
        onChange={(e) => onChange({ ...newGoal, title: e.target.value })}
        placeholder="Goal title (e.g., 'Exercise 3x per week')"
        className="w-full px-4 py-2.5 border-2 border-professional-gray-300 rounded-lg focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red bg-white shadow-sm text-sm font-medium placeholder:text-professional-gray-400"
        required
        aria-label="Goal title"
      />
      
      {/* Dream Selection */}
      <select
        value={newGoal.dreamId}
        onChange={(e) => onChange({ ...newGoal, dreamId: e.target.value })}
        className="w-full px-4 py-2.5 border-2 border-professional-gray-300 rounded-lg focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red bg-white shadow-sm text-sm font-medium"
        aria-label="Select dream"
      >
        <option value="">Select a dream (optional)</option>
        {dreamBook.map((dream) => (
          <option key={dream.id} value={dream.id}>
            {dream.title}
          </option>
        ))}
      </select>

      {/* Consistency Selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-professional-gray-600">How often?</label>
          <HelpTooltip 
            title="Goal Types"
            content="Choose how you want to track this goal: Weekly for habits, Monthly for broader targets, or Deadline for one-time milestones."
          />
        </div>
        <div 
          className="grid grid-cols-3 gap-2"
          role="group"
          aria-label="Goal frequency"
        >
          <button
            type="button"
            onClick={() => onChange({ ...newGoal, consistency: 'weekly', frequency: newGoal.consistency === 'weekly' ? newGoal.frequency : 1 })}
            aria-pressed={newGoal.consistency === 'weekly'}
            data-testid="weekly-consistency-button"
            className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              newGoal.consistency === 'weekly'
                ? 'bg-gradient-to-br from-netsurit-red to-netsurit-coral text-white shadow-md ring-2 ring-netsurit-red ring-offset-1'
                : 'bg-white text-professional-gray-700 hover:bg-professional-gray-100 hover:shadow-sm border border-professional-gray-300'
            }`}
          >
            <Repeat className="w-4 h-4 mb-1" aria-hidden="true" />
            <span>Weekly</span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...newGoal, consistency: 'monthly', frequency: newGoal.consistency === 'monthly' ? newGoal.frequency : 2 })}
            aria-pressed={newGoal.consistency === 'monthly'}
            data-testid="monthly-consistency-button"
            className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              newGoal.consistency === 'monthly'
                ? 'bg-gradient-to-br from-netsurit-red to-netsurit-coral text-white shadow-md ring-2 ring-netsurit-red ring-offset-1'
                : 'bg-white text-professional-gray-700 hover:bg-professional-gray-100 hover:shadow-sm border border-professional-gray-300'
            }`}
          >
            <Calendar className="w-4 h-4 mb-1" aria-hidden="true" />
            <span>Monthly</span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...newGoal, consistency: 'deadline' })}
            aria-pressed={newGoal.consistency === 'deadline'}
            data-testid="deadline-consistency-button"
            className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              newGoal.consistency === 'deadline'
                ? 'bg-gradient-to-br from-netsurit-red to-netsurit-coral text-white shadow-md ring-2 ring-netsurit-red ring-offset-1'
                : 'bg-white text-professional-gray-700 hover:bg-professional-gray-100 hover:shadow-sm border border-professional-gray-300'
            }`}
          >
            <Target className="w-4 h-4 mb-1" aria-hidden="true" />
            <span>Deadline</span>
          </button>
        </div>
      </div>

      {/* Target Duration or Date */}
      {newGoal.consistency === 'deadline' ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-professional-gray-600">
              Target Date <span className="text-netsurit-red">*</span>
            </label>
            <HelpTooltip 
              title="Deadline Goal"
              content="Set a specific date to complete this goal. It will stay in your weekly list until the date passes or you mark it complete."
            />
          </div>
          <input
            type="date"
            value={newGoal.targetDate || ''}
            onChange={(e) => onChange({ ...newGoal, targetDate: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2.5 border-2 border-professional-gray-300 rounded-lg focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red bg-white shadow-sm text-sm font-medium"
            aria-label="Target date"
            data-testid="goal-deadline-input"
          />
          <p className="text-xs text-professional-gray-500">
            Complete this goal by a specific date
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-professional-gray-600">
              Track for how many {newGoal.consistency === 'monthly' ? 'months' : 'weeks'}?
            </label>
            <HelpTooltip 
              title="Goal Duration"
              content={`This goal will automatically reappear in your list for the next ${newGoal.consistency === 'monthly' ? 'few months' : 'few weeks'}.`}
            />
          </div>
          <input
            type="number"
            min="1"
            max={newGoal.consistency === 'monthly' ? 24 : 52}
            value={newGoal.consistency === 'monthly' 
              ? (newGoal.targetMonths === '' ? '' : (newGoal.targetMonths || 6))
              : (newGoal.targetWeeks === '' ? '' : (newGoal.targetWeeks || 12))}
            onChange={(e) => {
              const inputValue = e.target.value;
              if (inputValue === '') {
                onChange({
                  ...newGoal, 
                  ...(newGoal.consistency === 'monthly' 
                    ? { targetMonths: '' }
                    : { targetWeeks: '' })
                });
                return;
              }
              const numValue = parseInt(inputValue, 10);
              if (!isNaN(numValue)) {
                onChange({
                  ...newGoal, 
                  ...(newGoal.consistency === 'monthly' 
                    ? { targetMonths: numValue }
                    : { targetWeeks: numValue })
                });
              }
            }}
            onBlur={(e) => {
              const inputValue = e.target.value;
              if (inputValue === '' || isNaN(parseInt(inputValue, 10))) {
                const defaultValue = newGoal.consistency === 'monthly' ? 6 : 12;
                onChange({
                  ...newGoal, 
                  ...(newGoal.consistency === 'monthly' 
                    ? { targetMonths: defaultValue }
                    : { targetWeeks: defaultValue })
                });
              }
            }}
            className="w-full px-4 py-2.5 border-2 border-professional-gray-300 rounded-lg focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red bg-white shadow-sm text-sm font-medium"
            aria-label={`Target ${newGoal.consistency === 'monthly' ? 'months' : 'weeks'}`}
            data-testid="goal-duration-input"
          />
          <p className="text-xs text-professional-gray-500">
            Default: {newGoal.consistency === 'monthly' ? '6 months' : '12 weeks'}
          </p>
        </div>
      )}

      {/* Monthly frequency input */}
      {newGoal.consistency === 'monthly' && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-professional-gray-600">
              Completions per month <span className="text-netsurit-red">*</span>
            </label>
            <HelpTooltip 
              title="Monthly Target"
              content="How many times total do you want to complete this activity across the entire month?"
            />
          </div>
          <input
            type="number"
            min="1"
            max="31"
            value={newGoal.frequency === '' ? '' : (newGoal.frequency || 2)}
            onChange={(e) => {
              const inputValue = e.target.value;
              if (inputValue === '') {
                onChange({ ...newGoal, frequency: '' });
                return;
              }
              const numValue = parseInt(inputValue, 10);
              if (!isNaN(numValue)) {
                onChange({ ...newGoal, frequency: Math.max(1, Math.min(31, numValue)) });
              }
            }}
            onBlur={(e) => {
              const inputValue = e.target.value;
              if (inputValue === '' || isNaN(parseInt(inputValue, 10))) {
                onChange({ ...newGoal, frequency: 2 });
              }
            }}
            className="w-full px-4 py-2.5 border-2 border-professional-gray-300 rounded-lg focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red bg-white shadow-sm text-sm font-medium"
            aria-label="Completions per month"
            data-testid="goal-frequency-input"
            placeholder="e.g., 2"
          />
          <p className="text-xs text-professional-gray-500">
            How many times you want to complete this goal each month
          </p>
        </div>
      )}

      {/* Weekly frequency input */}
      {newGoal.consistency === 'weekly' && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-professional-gray-600">
              Completions per week <span className="text-netsurit-red">*</span>
            </label>
            <HelpTooltip 
              title="Weekly Habit"
              content="How many times each week do you want to complete this activity? (e.g., 3x for gym, 5x for meditation)"
            />
          </div>
          <input
            type="number"
            min="1"
            max="7"
            value={newGoal.frequency === '' ? '' : (newGoal.frequency || 1)}
            onChange={(e) => {
              const inputValue = e.target.value;
              if (inputValue === '') {
                onChange({ ...newGoal, frequency: '' });
                return;
              }
              const numValue = parseInt(inputValue, 10);
              if (!isNaN(numValue)) {
                onChange({ ...newGoal, frequency: Math.max(1, Math.min(7, numValue)) });
              }
            }}
            onBlur={(e) => {
              const inputValue = e.target.value;
              if (inputValue === '' || isNaN(parseInt(inputValue, 10))) {
                onChange({ ...newGoal, frequency: 1 });
              }
            }}
            className="w-full px-4 py-2.5 border-2 border-professional-gray-300 rounded-lg focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red bg-white shadow-sm text-sm font-medium"
            aria-label="Completions per week"
            data-testid="goal-frequency-input-weekly"
            placeholder="e.g., 3"
          />
          <p className="text-xs text-professional-gray-500">
            How many times you want to complete this goal each week
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2 pt-1">
        <button
          type="submit"
          disabled={!newGoal.title.trim() || (newGoal.consistency === 'deadline' && !newGoal.targetDate)}
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Goal
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 bg-white border-2 border-professional-gray-300 text-professional-gray-700 rounded-lg hover:bg-professional-gray-50 transition-all duration-200 font-semibold text-sm shadow-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
