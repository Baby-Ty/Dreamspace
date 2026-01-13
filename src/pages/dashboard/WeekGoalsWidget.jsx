// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { memo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Plus, Clock, History } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GoalListSkeleton } from '../../components/SkeletonLoader';
import HelpTooltip from '../../components/HelpTooltip';
import { WeekProgressHeader, GoalItem, AddGoalForm } from './week-goals';

/**
 * Week Goals Widget Component - Orchestrator
 * Displays current week's goals with progress tracking
 */
function WeekGoalsWidget({
  currentWeekGoals,
  weeklyProgress,
  weekRange,
  showAddGoal,
  newGoal,
  dreamBook,
  isLoading,
  onToggleGoal,
  onDecrementGoal,
  onSkipGoal,
  onShowAddGoal,
  onHideAddGoal,
  onAddGoal,
  onNewGoalChange,
  onShowPastWeeks,
}) {
  const buttonRefs = useRef({});

  /**
   * Triggers subtle confetti animation at button position
   */
  const triggerConfetti = (button) => {
    if (!button) return;
    
    const rect = button.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { x, y },
      colors: ['#E5002B', '#FF6B6B', '#FFA07A', '#FFD700'],
      ticks: 100,
      gravity: 1.2,
      scalar: 0.7,
      drift: 0,
      startVelocity: 20,
    });
  };

  /**
   * Handle goal toggle with celebration animation
   */
  const handleToggleWithCelebration = (goalId) => {
    const goal = currentWeekGoals.find(g => g.id === goalId);
    
    if (goal && !goal.completed) {
      const button = buttonRefs.current[goalId];
      triggerConfetti(button);
    }
    
    onToggleGoal(goalId);
  };

  return (
    <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden" data-testid="week-goals-widget">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-professional-gray-200 flex-shrink-0 bg-gradient-to-r from-professional-gray-50/80 to-white">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-xl font-bold text-professional-gray-900 inline-block">
              This Week's Goals
              <span className="block h-0.5 mt-1 bg-gradient-to-r from-netsurit-red to-netsurit-coral rounded-full"></span>
            </h2>
            <p className="text-xs text-professional-gray-600 mt-1">Your active goals for the current week</p>
          </div>
          <HelpTooltip 
            title="Tracking Your Goals"
            content="This section helps you track your weekly progress. You can set weekly recurring habits, monthly targets, or one-time deadlines. Completed goals contribute to your weekly progress score."
          />
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onShowPastWeeks}
            className="inline-flex items-center space-x-1.5 text-sm bg-netsurit-red text-white px-4 py-2 rounded-lg hover:bg-netsurit-red font-semibold focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
            data-testid="past-weeks-button"
            aria-label="View past weeks"
          >
            <History className="w-4 h-4" aria-hidden="true" />
            <span>Past Weeks</span>
          </button>
        </div>
      </div>
      
      {/* Week Progress Header */}
      <WeekProgressHeader weekRange={weekRange} weeklyProgress={weeklyProgress} />

      {/* Weekly Goals List */}
      <div className="flex-1 p-4 overflow-hidden">
        {isLoading ? (
          <GoalListSkeleton count={3} />
        ) : currentWeekGoals.length === 0 && !showAddGoal ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="p-4 bg-professional-gray-100 rounded-full w-fit mx-auto mb-4 shadow-lg">
                <Clock className="w-12 h-12 text-professional-gray-500" aria-hidden="true" />
              </div>
              <p className="text-xl font-bold text-professional-gray-800 mb-2">No weekly goals yet!</p>
              <p className="text-professional-gray-600 mb-6 max-w-sm mx-auto text-base">
                Start planning your week to make progress on your dreams.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={onShowAddGoal}
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-2xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-xl hover:shadow-2xl font-bold text-lg transform hover:scale-105"
                  data-testid="add-goal-button"
                >
                  <Plus className="w-6 h-6 mr-2" aria-hidden="true" />
                  Add Goal Here
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col space-y-3 overflow-hidden">
            {/* Add Goal Form */}
            {showAddGoal && (
              <AddGoalForm
                newGoal={newGoal}
                dreamBook={dreamBook}
                onSubmit={onAddGoal}
                onCancel={onHideAddGoal}
                onChange={onNewGoalChange}
              />
            )}

            {/* Goals List */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-2">
              {currentWeekGoals.map((goal) => (
                <GoalItem
                  key={goal.id}
                  ref={(el) => (buttonRefs.current[goal.id] = el)}
                  goal={goal}
                  onToggle={handleToggleWithCelebration}
                  onDecrement={onDecrementGoal}
                  onSkip={onSkipGoal}
                />
              ))}
              
              {!showAddGoal && currentWeekGoals.length > 0 && (
                <button
                  onClick={onShowAddGoal}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-professional-gray-300 hover:border-netsurit-red text-professional-gray-500 hover:text-netsurit-red hover:bg-gradient-to-r hover:from-netsurit-red/5 hover:to-netsurit-coral/5 transition-all duration-200 flex items-center justify-center space-x-2 font-semibold text-sm shadow-sm hover:shadow-md"
                  data-testid="add-another-goal-button"
                >
                  <Plus className="w-5 h-5" aria-hidden="true" />
                  <span>Add Another Goal</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

WeekGoalsWidget.propTypes = {
  currentWeekGoals: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    completed: PropTypes.bool.isRequired,
  })).isRequired,
  weeklyProgress: PropTypes.number.isRequired,
  weekRange: PropTypes.string.isRequired,
  showAddGoal: PropTypes.bool.isRequired,
  newGoal: PropTypes.object.isRequired,
  dreamBook: PropTypes.array.isRequired,
  isLoading: PropTypes.bool,
  onToggleGoal: PropTypes.func.isRequired,
  onDecrementGoal: PropTypes.func,
  onSkipGoal: PropTypes.func,
  onShowAddGoal: PropTypes.func.isRequired,
  onHideAddGoal: PropTypes.func.isRequired,
  onAddGoal: PropTypes.func.isRequired,
  onNewGoalChange: PropTypes.func.isRequired,
  onShowPastWeeks: PropTypes.func.isRequired,
};

WeekGoalsWidget.defaultProps = {
  isLoading: false,
};

export default memo(WeekGoalsWidget);
