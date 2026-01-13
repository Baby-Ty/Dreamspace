import { forwardRef } from 'react';
import { CheckCircle2, Circle, Calendar, ChevronLeft } from 'lucide-react';

/**
 * Individual goal item component with completion tracking
 */
const GoalItem = forwardRef(function GoalItem({
  goal,
  onToggle,
  onDecrement,
  onSkip
}, ref) {
  const isDeadline = goal.type === 'deadline';
  const isWeeklyRecurring = (goal.type === 'weekly_goal' || goal.type === 'monthly_goal' || goal.type === 'consistency' || goal.goalType === 'consistency') && goal.recurrence;
  const frequency = goal.frequency || 1;
  const completionCount = goal.completionCount || 0;
  
  // Determine accent color based on urgency
  const getAccentColor = () => {
    if (goal.completed) return 'bg-professional-gray-400';
    if (goal.weeksRemaining === 0) return 'bg-netsurit-orange';
    if (goal.weeksRemaining <= 2) return 'bg-netsurit-coral';
    return 'bg-netsurit-red';
  };

  // Handle checkbox click - toggle for regular goals, increment/decrement for frequency goals
  const handleCheckboxClick = () => {
    const hasFrequency = (goal.recurrence === 'monthly' || goal.recurrence === 'weekly') && goal.frequency;
    
    if (hasFrequency && goal.completed && onDecrement) {
      // If goal is completed and has frequency, clicking should decrement (uncheck)
      onDecrement(goal.id);
    } else {
      // Otherwise, toggle/increment as normal
      onToggle(goal.id);
    }
  };
  
  return (
    <div 
      className={`group relative overflow-hidden rounded-xl border shadow-sm transition-all duration-200 hover:shadow-lg ${
        goal.completed 
          ? 'bg-gradient-to-r from-professional-gray-100 to-white border-professional-gray-300' 
          : 'bg-gradient-to-r from-professional-gray-50/50 to-white border-professional-gray-200 hover:border-netsurit-red/40'
      }`}
      data-testid={`goal-${goal.id}`}
    >
      {/* Left accent stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getAccentColor()}`} />
      
      <div className="flex items-center gap-4 p-4 pl-5">
        {/* Checkbox */}
        <button
          ref={ref}
          onClick={handleCheckboxClick}
          className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 rounded-full transition-all duration-200 hover:scale-110"
          aria-label={goal.completed ? 'Mark as incomplete' : 'Mark as complete'}
          data-testid={`toggle-goal-${goal.id}`}
        >
          {goal.completed ? (
            <CheckCircle2 className="w-8 h-8 text-netsurit-red" />
          ) : isWeeklyRecurring && (goal.recurrence === 'weekly' || goal.recurrence === 'monthly') ? (
            <div className="relative w-8 h-8">
              <Circle className="w-8 h-8 text-professional-gray-300 group-hover:text-netsurit-red/40 transition-colors" />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-professional-gray-600">
                {completionCount}/{frequency}
              </span>
            </div>
          ) : (
            <Circle className="w-8 h-8 text-professional-gray-300 group-hover:text-netsurit-red/40 transition-colors" />
          )}
        </button>
          
        {/* Content */}
        <div className="flex-grow min-w-0">
          <h3 className={`font-semibold text-base leading-tight ${
            goal.completed ? 'line-through text-professional-gray-400' : 'text-professional-gray-900'
          }`}>
            {goal.title}
          </h3>
          
          {/* Meta line */}
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 text-sm">
            {goal.dreamTitle && (
              <span className="text-professional-gray-500">
                from <span className="text-netsurit-red font-medium">{goal.dreamTitle}</span>
              </span>
            )}
            {isDeadline && goal.targetDate && (
              <span className="text-professional-gray-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>

          {/* Progress dots for recurring goals */}
          {isWeeklyRecurring && (goal.recurrence === 'weekly' || goal.recurrence === 'monthly') && frequency > 1 && (
            <div className="flex items-center gap-2 mt-2">
              {onDecrement && completionCount > 0 && (
                <button
                  onClick={() => onDecrement(goal.id)}
                  className="p-1 rounded-full hover:bg-professional-gray-100 transition-colors"
                  aria-label="Undo last completion"
                  data-testid={`undo-goal-${goal.id}`}
                >
                  <ChevronLeft className="w-4 h-4 text-professional-gray-400" />
                </button>
              )}
              <div className="flex gap-1.5">
                {Array.from({ length: frequency }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i < completionCount ? 'bg-netsurit-red shadow-sm' : 'bg-professional-gray-200'
                    }`}
                  />
                ))}
              </div>
              {!goal.completed && completionCount < frequency && (
                <button
                  onClick={() => onToggle(goal.id)}
                  className="p-1 rounded-full hover:bg-professional-gray-100 transition-colors"
                  aria-label="Add completion"
                  data-testid={`add-completion-${goal.id}`}
                >
                  <ChevronLeft className="w-4 h-4 text-professional-gray-400 rotate-180" />
                </button>
              )}
              <span className="text-xs text-professional-gray-400 px-2 py-0.5 bg-professional-gray-100 rounded-full">
                {goal.recurrence}
              </span>
            </div>
          )}
        </div>

        {/* Right side - weeks remaining & skip */}
        <div className="flex-shrink-0 text-right">
          {(isWeeklyRecurring || isDeadline) && goal.weeksRemaining !== undefined && goal.weeksRemaining >= 0 && (
            <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
              goal.completed
                ? 'bg-professional-gray-200 text-professional-gray-600'
                : goal.weeksRemaining === 0 
                  ? 'bg-netsurit-orange/10 text-netsurit-orange' 
                  : goal.weeksRemaining <= 2
                    ? 'bg-netsurit-coral/10 text-netsurit-coral'
                    : 'bg-professional-gray-100 text-professional-gray-600'
            }`}>
              {goal.completed 
                ? 'Complete'
                : goal.weeksRemaining === 0 
                  ? 'Final week!' 
                  : `${goal.weeksRemaining}w left`}
            </div>
          )}
          {!goal.completed && goal.templateId && onSkip && (
            <button
              onClick={() => onSkip(goal.id)}
              className="block text-xs text-professional-gray-400 hover:text-netsurit-red mt-1.5 transition-colors"
              aria-label="Skip this week"
              data-testid={`skip-goal-${goal.id}`}
            >
              skip this week
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default GoalItem;
