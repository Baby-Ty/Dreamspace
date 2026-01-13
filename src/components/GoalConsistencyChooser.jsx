import { Repeat, Calendar, Target } from 'lucide-react';
import HelpTooltip from './HelpTooltip';

/**
 * Reusable consistency chooser for goal types (Weekly/Monthly/Deadline)
 * Used in both WeekGoalsWidget AddGoalForm and DreamForm FirstGoalSetup
 */
export default function GoalConsistencyChooser({
  consistency,
  frequency,
  targetWeeks,
  targetMonths,
  targetDate,
  onChange,
  showHelp = true
}) {
  const handleConsistencyChange = (newConsistency) => {
    const updates = { consistency: newConsistency };
    
    // Set default frequency when switching
    if (newConsistency === 'weekly' && consistency !== 'weekly') {
      updates.frequency = 1;
    } else if (newConsistency === 'monthly' && consistency !== 'monthly') {
      updates.frequency = 2;
    }
    
    onChange(updates);
  };

  const handleDurationChange = (value) => {
    const key = consistency === 'monthly' ? 'targetMonths' : 'targetWeeks';
    onChange({ [key]: value });
  };

  const handleFrequencyChange = (value) => {
    onChange({ frequency: value });
  };

  return (
    <div className="space-y-3">
      {/* Consistency Type Selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-professional-gray-600">How often?</label>
          {showHelp && (
            <HelpTooltip 
              title="Goal Types"
              content="Choose how you want to track this goal: Weekly for habits, Monthly for broader targets, or Deadline for one-time milestones."
            />
          )}
        </div>
        <div 
          className="grid grid-cols-3 gap-2"
          role="group"
          aria-label="Goal frequency"
        >
          <button
            type="button"
            onClick={() => handleConsistencyChange('weekly')}
            aria-pressed={consistency === 'weekly'}
            data-testid="weekly-consistency-button"
            className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              consistency === 'weekly'
                ? 'bg-gradient-to-br from-netsurit-red to-netsurit-coral text-white shadow-md ring-2 ring-netsurit-red ring-offset-1'
                : 'bg-white text-professional-gray-700 hover:bg-professional-gray-100 hover:shadow-sm border border-professional-gray-300'
            }`}
          >
            <Repeat className="w-4 h-4 mb-1" aria-hidden="true" />
            <span>Weekly</span>
          </button>
          <button
            type="button"
            onClick={() => handleConsistencyChange('monthly')}
            aria-pressed={consistency === 'monthly'}
            data-testid="monthly-consistency-button"
            className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              consistency === 'monthly'
                ? 'bg-gradient-to-br from-netsurit-red to-netsurit-coral text-white shadow-md ring-2 ring-netsurit-red ring-offset-1'
                : 'bg-white text-professional-gray-700 hover:bg-professional-gray-100 hover:shadow-sm border border-professional-gray-300'
            }`}
          >
            <Calendar className="w-4 h-4 mb-1" aria-hidden="true" />
            <span>Monthly</span>
          </button>
          <button
            type="button"
            onClick={() => handleConsistencyChange('deadline')}
            aria-pressed={consistency === 'deadline'}
            data-testid="deadline-consistency-button"
            className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              consistency === 'deadline'
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
      {consistency === 'deadline' ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-professional-gray-600">
              Target Date <span className="text-netsurit-red">*</span>
            </label>
            {showHelp && (
              <HelpTooltip 
                title="Deadline Goal"
                content="Set a specific date to complete this goal. It will stay in your weekly list until the date passes or you mark it complete."
              />
            )}
          </div>
          <input
            type="date"
            value={targetDate || ''}
            onChange={(e) => onChange({ targetDate: e.target.value })}
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
        <>
          {/* Duration Input */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-professional-gray-600">
                Track for how many {consistency === 'monthly' ? 'months' : 'weeks'}?
              </label>
              {showHelp && (
                <HelpTooltip 
                  title="Goal Duration"
                  content={`This goal will automatically reappear in your list for the next ${consistency === 'monthly' ? 'few months' : 'few weeks'}.`}
                />
              )}
            </div>
            <input
              type="number"
              min="1"
              max={consistency === 'monthly' ? 24 : 52}
              value={consistency === 'monthly' 
                ? (targetMonths === '' ? '' : (targetMonths || 6))
                : (targetWeeks === '' ? '' : (targetWeeks || 12))}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === '') {
                  handleDurationChange('');
                  return;
                }
                const numValue = parseInt(inputValue, 10);
                if (!isNaN(numValue)) {
                  handleDurationChange(numValue);
                }
              }}
              onBlur={(e) => {
                const inputValue = e.target.value;
                if (inputValue === '' || isNaN(parseInt(inputValue, 10))) {
                  handleDurationChange(consistency === 'monthly' ? 6 : 12);
                }
              }}
              className="w-full px-4 py-2.5 border-2 border-professional-gray-300 rounded-lg focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red bg-white shadow-sm text-sm font-medium"
              aria-label={`Target ${consistency === 'monthly' ? 'months' : 'weeks'}`}
              data-testid="goal-duration-input"
            />
            <p className="text-xs text-professional-gray-500">
              Default: {consistency === 'monthly' ? '6 months' : '12 weeks'}
            </p>
          </div>

          {/* Frequency Input */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-professional-gray-600">
                Completions per {consistency === 'monthly' ? 'month' : 'week'} <span className="text-netsurit-red">*</span>
              </label>
              {showHelp && (
                <HelpTooltip 
                  title={consistency === 'monthly' ? 'Monthly Target' : 'Weekly Habit'}
                  content={consistency === 'monthly' 
                    ? 'How many times total do you want to complete this activity across the entire month?' 
                    : 'How many times each week do you want to complete this activity? (e.g., 3x for gym, 5x for meditation)'}
                />
              )}
            </div>
            <input
              type="number"
              min="1"
              max={consistency === 'monthly' ? 31 : 7}
              value={frequency === '' ? '' : (frequency || (consistency === 'monthly' ? 2 : 1))}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === '') {
                  handleFrequencyChange('');
                  return;
                }
                const numValue = parseInt(inputValue, 10);
                if (!isNaN(numValue)) {
                  const max = consistency === 'monthly' ? 31 : 7;
                  handleFrequencyChange(Math.max(1, Math.min(max, numValue)));
                }
              }}
              onBlur={(e) => {
                const inputValue = e.target.value;
                if (inputValue === '' || isNaN(parseInt(inputValue, 10))) {
                  handleFrequencyChange(consistency === 'monthly' ? 2 : 1);
                }
              }}
              className="w-full px-4 py-2.5 border-2 border-professional-gray-300 rounded-lg focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red bg-white shadow-sm text-sm font-medium"
              aria-label={`Completions per ${consistency === 'monthly' ? 'month' : 'week'}`}
              data-testid={`goal-frequency-input-${consistency}`}
              placeholder={`e.g., ${consistency === 'monthly' ? '2' : '3'}`}
            />
            <p className="text-xs text-professional-gray-500">
              How many times you want to complete this goal each {consistency === 'monthly' ? 'month' : 'week'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
