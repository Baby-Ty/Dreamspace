import { 
  CheckCircle2, 
  Circle, 
  Trophy,
  Calendar,
  Edit2,
  Trash2,
  Repeat,
  Clock
} from 'lucide-react';

/**
 * Goal Display Component
 * Read-only display of a goal with toggle, edit, and delete actions
 */
export default function GoalDisplay({
  goal,
  isChecked,
  isTemplate,
  isConsistency,
  isDeadline,
  weeksUntilDeadline,
  consistencyProgress,
  canEdit,
  onToggleGoal,
  onStartEditing,
  onDeleteGoal
}) {
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
        {/* Toggle Button */}
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
          <div className="flex items-start justify-between gap-3">
            {/* Title and badges inline */}
            <div className="flex items-start flex-wrap gap-2 flex-1 min-w-0">
              <p className={`font-medium ${
                isChecked 
                  ? 'text-professional-gray-700 line-through' 
                  : 'text-professional-gray-900'
              }`}>
                {goal.title}
              </p>
              
              {/* Type-specific Badges inline with title */}
              {isConsistency && (
                <>
                  <span className="text-xs bg-professional-gray-100 text-professional-gray-700 px-2 py-1 rounded-full font-medium flex items-center space-x-1">
                    <Repeat className="w-3 h-3" aria-hidden="true" />
                    <span>Consistency</span>
                  </span>
                  {goal.recurrence && (
                    <span className="text-xs bg-professional-gray-100 text-professional-gray-700 px-2 py-1 rounded-full font-medium capitalize">
                      {goal.recurrence}
                    </span>
                  )}
                </>
              )}
              
              {isDeadline && (
                <span className="text-xs bg-professional-gray-100 text-professional-gray-700 px-2 py-1 rounded-full font-medium flex items-center space-x-1">
                  <Calendar className="w-3 h-3" aria-hidden="true" />
                  <span>Deadline</span>
                </span>
              )}
            </div>
            
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
          
          {/* Description */}
          {goal.description && (
            <p className="text-xs text-professional-gray-600 mt-2">{goal.description}</p>
          )}

          {/* Consistency Progress Bar */}
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
    </div>
  );
}
