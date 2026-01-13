import { Repeat, Calendar, Target } from 'lucide-react';
import HelpTooltip from '../../../components/HelpTooltip';

/**
 * First goal setup section for new dreams
 * Allows configuring a consistency goal with weekly/monthly/deadline tracking
 */
export default function FirstGoalSetup({ firstGoal, dreamTitle, onChange }) {
  const handleChange = (updates) => {
    onChange({ ...firstGoal, ...updates });
  };

  return (
    <div 
      className="border-2 border-dashed border-professional-gray-300 rounded-xl p-4 space-y-3 bg-professional-gray-50/50"
      role="region"
      aria-label="First goal setup"
    >
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="enableFirstGoal"
          checked={firstGoal.enabled}
          onChange={(e) => handleChange({ enabled: e.target.checked })}
          className="w-4 h-4 text-netsurit-red border-professional-gray-300 rounded focus:ring-netsurit-red"
          data-testid="enable-first-goal-checkbox"
        />
        <label htmlFor="enableFirstGoal" className="text-sm font-medium text-professional-gray-700 cursor-pointer">
          Add first goal with consistency tracking
        </label>
        <HelpTooltip 
          title="First Goal"
          content="Set up a consistency goal to track daily, weekly, or monthly progress. Perfect for building habits like 'Exercise 3x per week' or 'Read daily'."
        />
      </div>

      {firstGoal.enabled && (
        <div className="space-y-3 pt-2">
          {/* Goal Title */}
          <input
            type="text"
            placeholder={`Goal title (e.g., "${dreamTitle || 'Exercise 3x per week'}")`}
            value={firstGoal.title}
            onChange={(e) => handleChange({ title: e.target.value })}
            className="input-field text-sm"
            aria-label="Goal title"
            data-testid="goal-title-input"
          />

          {/* Consistency Chooser */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-professional-gray-600">How often?</label>
            <div 
              className="grid grid-cols-3 gap-2"
              role="group"
              aria-label="Goal frequency"
            >
              <button
                type="button"
                onClick={() => handleChange({ 
                  consistency: 'weekly',
                  frequency: firstGoal.consistency === 'weekly' ? firstGoal.frequency : 1
                })}
                aria-pressed={firstGoal.consistency === 'weekly'}
                data-testid="weekly-consistency-button"
                className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  firstGoal.consistency === 'weekly'
                    ? 'bg-gradient-to-br from-netsurit-red to-netsurit-coral text-white shadow-md ring-2 ring-netsurit-red ring-offset-1'
                    : 'bg-white text-professional-gray-700 hover:bg-professional-gray-100 hover:shadow-sm border border-professional-gray-300'
                }`}
              >
                <Repeat className="w-4 h-4 mb-1" aria-hidden="true" />
                <span>Weekly</span>
              </button>
              <button
                type="button"
                onClick={() => handleChange({ 
                  consistency: 'monthly',
                  frequency: firstGoal.consistency === 'monthly' ? firstGoal.frequency : 2
                })}
                aria-pressed={firstGoal.consistency === 'monthly'}
                data-testid="monthly-consistency-button"
                className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  firstGoal.consistency === 'monthly'
                    ? 'bg-gradient-to-br from-netsurit-red to-netsurit-coral text-white shadow-md ring-2 ring-netsurit-red ring-offset-1'
                    : 'bg-white text-professional-gray-700 hover:bg-professional-gray-100 hover:shadow-sm border border-professional-gray-300'
                }`}
              >
                <Calendar className="w-4 h-4 mb-1" aria-hidden="true" />
                <span>Monthly</span>
              </button>
              <button
                type="button"
                onClick={() => handleChange({ consistency: 'deadline' })}
                aria-pressed={firstGoal.consistency === 'deadline'}
                data-testid="deadline-consistency-button"
                className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  firstGoal.consistency === 'deadline'
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
          {firstGoal.consistency === 'deadline' ? (
            <div className="space-y-1">
              <label className="text-xs font-medium text-professional-gray-600">
                Target Date <span className="text-netsurit-red">*</span>
              </label>
              <input
                type="date"
                value={firstGoal.targetDate || ''}
                onChange={(e) => handleChange({ targetDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="input-field text-sm"
                aria-label="Target date"
                data-testid="goal-deadline-input"
              />
              <p className="text-xs text-professional-gray-500">
                Complete this goal by a specific date
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-medium text-professional-gray-600">
                {firstGoal.consistency === 'monthly' 
                  ? 'Track for how many months?' 
                  : 'Track for how many weeks?'}
              </label>
              <input
                type="number"
                min="1"
                max={firstGoal.consistency === 'monthly' ? 24 : 52}
                value={firstGoal.consistency === 'monthly' 
                  ? (firstGoal.targetMonths === '' ? '' : (firstGoal.targetMonths || 6))
                  : (firstGoal.targetWeeks === '' ? '' : (firstGoal.targetWeeks || 12))}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '') {
                    handleChange(firstGoal.consistency === 'monthly' 
                      ? { targetMonths: '' }
                      : { targetWeeks: '' });
                    return;
                  }
                  const numValue = parseInt(inputValue, 10);
                  if (!isNaN(numValue)) {
                    handleChange(firstGoal.consistency === 'monthly' 
                      ? { targetMonths: numValue }
                      : { targetWeeks: numValue });
                  }
                }}
                onBlur={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '' || isNaN(parseInt(inputValue, 10))) {
                    const defaultValue = firstGoal.consistency === 'monthly' ? 6 : 12;
                    handleChange(firstGoal.consistency === 'monthly' 
                      ? { targetMonths: defaultValue }
                      : { targetWeeks: defaultValue });
                  }
                }}
                className="input-field text-sm w-24"
                aria-label={`Target ${firstGoal.consistency === 'monthly' ? 'months' : 'weeks'}`}
                data-testid="goal-duration-input"
              />
              <p className="text-xs text-professional-gray-500">
                {firstGoal.consistency === 'monthly' 
                  ? 'Default: 6 months' 
                  : 'Default: 12 weeks'}
              </p>
              
              {/* Weekly frequency input */}
              {firstGoal.consistency === 'weekly' && (
                <div className="mt-3">
                  <label className="text-xs font-medium text-professional-gray-600">
                    Completions per week <span className="text-netsurit-red">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={firstGoal.frequency === '' ? '' : (firstGoal.frequency || 1)}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === '') {
                        handleChange({ frequency: '' });
                        return;
                      }
                      const numValue = parseInt(inputValue, 10);
                      if (!isNaN(numValue)) {
                        handleChange({ frequency: Math.max(1, Math.min(7, numValue)) });
                      }
                    }}
                    onBlur={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === '' || isNaN(parseInt(inputValue, 10))) {
                        handleChange({ frequency: 1 });
                      }
                    }}
                    className="input-field text-sm w-24"
                    aria-label="Completions per week"
                    data-testid="goal-frequency-input-weekly"
                    placeholder="e.g., 3"
                  />
                  <p className="text-xs text-professional-gray-500 mt-1">
                    How many times you want to complete this goal each week
                  </p>
                </div>
              )}
              
              {/* Monthly frequency input */}
              {firstGoal.consistency === 'monthly' && (
                <div className="mt-3">
                  <label className="text-xs font-medium text-professional-gray-600">
                    Completions per month <span className="text-netsurit-red">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={firstGoal.frequency === '' ? '' : (firstGoal.frequency || 2)}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === '') {
                        handleChange({ frequency: '' });
                        return;
                      }
                      const numValue = parseInt(inputValue, 10);
                      if (!isNaN(numValue)) {
                        handleChange({ frequency: Math.max(1, Math.min(31, numValue)) });
                      }
                    }}
                    onBlur={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === '' || isNaN(parseInt(inputValue, 10))) {
                        handleChange({ frequency: 2 });
                      }
                    }}
                    className="input-field text-sm w-24"
                    aria-label="Completions per month"
                    data-testid="goal-frequency-input-monthly"
                    placeholder="e.g., 2"
                  />
                  <p className="text-xs text-professional-gray-500 mt-1">
                    How many times you want to complete this goal each month
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
