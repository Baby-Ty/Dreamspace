// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { memo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Plus, CheckCircle2, Circle, Calendar, X, Clock, Repeat, SkipForward, History, FastForward, ChevronLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GoalListSkeleton } from '../../components/SkeletonLoader';

/**
 * Week Goals Widget Component
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
  onTestRollover,
  isRollingOver = false,
}) {
  const completedCount = currentWeekGoals.filter(g => g.completed).length;
  const totalCount = currentWeekGoals.length;
  const buttonRefs = useRef({});

  /**
   * Triggers subtle confetti animation at button position
   * @param {HTMLElement} button - The button element to position confetti
   */
  const triggerConfetti = (button) => {
    if (!button) return;
    
    const rect = button.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    // Subtle confetti burst
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
   * @param {string} goalId - The goal ID to toggle
   */
  const handleToggleWithCelebration = (goalId) => {
    const goal = currentWeekGoals.find(g => g.id === goalId);
    
    // Only celebrate when marking as complete (not when unchecking)
    if (goal && !goal.completed) {
      const button = buttonRefs.current[goalId];
      triggerConfetti(button);
    }
    
    // Call the original toggle function
    onToggleGoal(goalId);
  };

  return (
    <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden" data-testid="week-goals-widget">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-professional-gray-200 flex-shrink-0 bg-gradient-to-r from-professional-gray-50 to-white">
        <div>
          <h2 className="text-xl font-bold text-professional-gray-900">This Week's Goals</h2>
          <p className="text-xs text-professional-gray-600 mt-0.5">Your active goals for the current week</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onShowPastWeeks}
            className="inline-flex items-center space-x-1.5 text-sm bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange font-semibold focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
            data-testid="past-weeks-button"
            aria-label="View past weeks"
          >
            <History className="w-4 h-4" aria-hidden="true" />
            <span>Past Weeks</span>
          </button>
          {onTestRollover && (
            <button
              onClick={onTestRollover}
              disabled={isRollingOver}
              className="inline-flex items-center space-x-1.5 text-sm bg-professional-gray-200 text-professional-gray-700 px-4 py-2 rounded-lg hover:bg-professional-gray-300 font-semibold focus:outline-none focus:ring-2 focus:ring-professional-gray-400 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="test-rollover-button"
              aria-label="Test week rollover"
            >
              {isRollingOver ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-professional-gray-600"></div>
                  <span>Rolling...</span>
                </>
              ) : (
                <>
                  <FastForward className="w-4 h-4" aria-hidden="true" />
                  <span>Test Rollover</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Week Progress Header */}
      <div className="px-4 py-3 bg-gradient-to-br from-netsurit-red/5 via-netsurit-coral/5 to-transparent border-b border-professional-gray-200 flex-shrink-0">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-white rounded-lg shadow-sm">
                <Calendar className="w-4 h-4 text-netsurit-red" />
              </div>
              <span className="text-sm font-semibold text-professional-gray-800">{weekRange}</span>
            </div>
            <div className="px-3 py-1 bg-white rounded-lg shadow-sm">
              <span className="text-lg font-bold text-netsurit-red">{weeklyProgress}%</span>
            </div>
          </div>
          <div className="w-full bg-white/80 rounded-full h-2.5 shadow-inner border border-professional-gray-200/50">
            <div
              className="bg-gradient-to-r from-netsurit-red via-netsurit-coral to-netsurit-orange h-2.5 rounded-full transition-all duration-700 ease-out shadow-sm relative overflow-hidden"
              style={{ width: `${weeklyProgress}%` }}
              role="progressbar"
              aria-valuenow={weeklyProgress}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Weekly progress"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Goals List */}
      <div className="flex-1 p-4 overflow-hidden">
        {isLoading ? (
          <GoalListSkeleton count={3} />
        ) : currentWeekGoals.length === 0 && !showAddGoal ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="p-4 bg-professional-gray-100 rounded-full w-fit mx-auto mb-4 shadow-lg">
                <Clock className="w-12 h-12 text-professional-gray-500" />
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
                  <Plus className="w-6 h-6 mr-2" />
                  Add Goal Here
                </button>
                <button
                  onClick={() => setShowAddGoal(true)}
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-professional-gray-600 to-professional-gray-700 text-white rounded-2xl hover:from-professional-gray-700 hover:to-professional-gray-800 focus:outline-none focus:ring-2 focus:ring-professional-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-xl hover:shadow-2xl font-bold text-lg transform hover:scale-105"
                >
                  Manage Goals →
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col space-y-3 overflow-hidden">
            {/* Add Goal Form */}
            {showAddGoal && (
              <form onSubmit={onAddGoal} className="p-4 rounded-xl border-2 border-netsurit-red/20 bg-gradient-to-br from-netsurit-red/5 to-white space-y-3 shadow-lg" data-testid="add-goal-form">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-professional-gray-900">Add New Goal</h4>
                  <button
                    type="button"
                    onClick={onHideAddGoal}
                    className="text-professional-gray-400 hover:text-professional-gray-600 p-1.5 rounded-lg hover:bg-white transition-all"
                    aria-label="Cancel add goal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => onNewGoalChange({ ...newGoal, title: e.target.value })}
                  placeholder="Goal title (e.g., 'Exercise 3x per week')"
                  className="w-full px-4 py-2.5 border-2 border-professional-gray-300 rounded-lg focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red bg-white shadow-sm text-sm font-medium placeholder:text-professional-gray-400"
                  required
                  aria-label="Goal title"
                />
                <select
                  value={newGoal.dreamId}
                  onChange={(e) => onNewGoalChange({ ...newGoal, dreamId: e.target.value })}
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
                  <label className="text-xs font-medium text-professional-gray-600">How often?</label>
                  <div 
                    className="grid grid-cols-2 gap-2"
                    role="group"
                    aria-label="Goal frequency"
                  >
                    <button
                      type="button"
                      onClick={() => onNewGoalChange({ ...newGoal, consistency: 'weekly', frequency: newGoal.consistency === 'weekly' ? newGoal.frequency : 1 })}
                      aria-pressed={newGoal.consistency === 'weekly'}
                      data-testid="weekly-consistency-button"
                      className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        newGoal.consistency === 'weekly'
                          ? 'bg-professional-gray-800 text-white shadow-md ring-2 ring-professional-gray-700 ring-offset-1'
                          : 'bg-white text-professional-gray-700 hover:bg-professional-gray-100 hover:shadow-sm border border-professional-gray-300'
                      }`}
                    >
                      <Repeat className="w-4 h-4 mb-1" aria-hidden="true" />
                      <span>Weekly</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNewGoalChange({ ...newGoal, consistency: 'monthly', frequency: newGoal.consistency === 'monthly' ? newGoal.frequency : 2 })}
                      aria-pressed={newGoal.consistency === 'monthly'}
                      data-testid="monthly-consistency-button"
                      className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        newGoal.consistency === 'monthly'
                          ? 'bg-professional-gray-800 text-white shadow-md ring-2 ring-professional-gray-700 ring-offset-1'
                          : 'bg-white text-professional-gray-700 hover:bg-professional-gray-100 hover:shadow-sm border border-professional-gray-300'
                      }`}
                    >
                      <Calendar className="w-4 h-4 mb-1" aria-hidden="true" />
                      <span>Monthly</span>
                    </button>
                  </div>
                </div>

                {/* Target Duration */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-professional-gray-600">
                    Track for how many {newGoal.consistency === 'monthly' ? 'months' : 'weeks'}?
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={newGoal.consistency === 'monthly' ? 24 : 52}
                    value={newGoal.consistency === 'monthly' ? newGoal.targetMonths : newGoal.targetWeeks}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || (newGoal.consistency === 'monthly' ? 6 : 12);
                      onNewGoalChange({
                        ...newGoal, 
                        ...(newGoal.consistency === 'monthly' 
                          ? { targetMonths: value }
                          : { targetWeeks: value })
                      });
                    }}
                    className="w-full px-4 py-2.5 border-2 border-professional-gray-300 rounded-lg focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red bg-white shadow-sm text-sm font-medium"
                    aria-label={`Target ${newGoal.consistency === 'monthly' ? 'months' : 'weeks'}`}
                    data-testid="goal-duration-input"
                  />
                </div>

                {/* Monthly frequency input */}
                {newGoal.consistency === 'monthly' && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-professional-gray-600">
                      Completions per month <span className="text-netsurit-red">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={newGoal.frequency || 2}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        onNewGoalChange({
                          ...newGoal,
                          frequency: Math.max(1, Math.min(31, value))
                        });
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
                    <label className="text-xs font-medium text-professional-gray-600">
                      Completions per week <span className="text-netsurit-red">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      value={newGoal.frequency || 1}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        onNewGoalChange({
                          ...newGoal,
                          frequency: Math.max(1, Math.min(7, value))
                        });
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

                <div className="flex space-x-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg"
                  >
                    Add Goal
                  </button>
                  <button
                    type="button"
                    onClick={onHideAddGoal}
                    className="px-4 py-2.5 bg-white border-2 border-professional-gray-300 text-professional-gray-700 rounded-lg hover:bg-professional-gray-50 transition-all duration-200 font-semibold text-sm shadow-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Goals List */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-2">
              {currentWeekGoals.map((goal) => (
                <div key={goal.id} className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg flex flex-col ${
                  goal.completed 
                    ? 'bg-gradient-to-r from-professional-gray-50 to-white border-professional-gray-300 shadow-sm' 
                    : 'bg-white border-professional-gray-200 hover:border-netsurit-red/30 shadow-md hover:scale-[1.01]'
                }`} data-testid={`goal-${goal.id}`}>
                  <div className="flex items-start space-x-3.5 flex-1">
                    <button
                      ref={(el) => (buttonRefs.current[goal.id] = el)}
                      onClick={() => handleToggleWithCelebration(goal.id)}
                      className="flex-shrink-0 mt-0.5 focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 rounded-full transition-all duration-200 hover:scale-110"
                      aria-label={goal.completed ? 'Mark as incomplete' : 'Mark as complete'}
                      data-testid={`toggle-goal-${goal.id}`}
                      disabled={(goal.recurrence === 'monthly' || goal.recurrence === 'weekly') && goal.frequency && goal.completionCount >= goal.frequency}
                    >
                      {goal.completed ? (
                        <CheckCircle2 className="w-7 h-7 text-netsurit-red drop-shadow-sm" />
                      ) : (
                        <Circle className="w-7 h-7 text-professional-gray-300 hover:text-netsurit-red" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className={`text-base font-semibold leading-snug flex-1 ${
                          goal.completed ? 'line-through text-professional-gray-500' : 'text-professional-gray-900'
                        }`}>
                          {goal.title}
                        </h3>
                        
                        {/* Weeks remaining - top right */}
                        {((goal.type === 'weekly_goal' || goal.type === 'monthly_goal' || goal.type === 'consistency' || goal.goalType === 'consistency') && goal.recurrence && goal.weeksRemaining !== undefined && goal.weeksRemaining >= 0) && (
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <Clock className={`w-3.5 h-3.5 ${
                              goal.weeksRemaining === 0 
                                ? 'text-netsurit-orange' 
                                : goal.weeksRemaining === 1
                                  ? 'text-netsurit-coral'
                                  : 'text-professional-gray-500'
                            }`} aria-hidden="true" />
                            <span className={`text-xs font-medium whitespace-nowrap ${
                              goal.weeksRemaining === 0 
                                ? 'text-netsurit-orange font-semibold' 
                                : goal.weeksRemaining === 1
                                  ? 'text-netsurit-coral'
                                  : 'text-professional-gray-600'
                            }`}>
                              {goal.weeksRemaining === 0 
                                ? 'Final week!' 
                                : goal.weeksRemaining === 1
                                  ? '1 week left' 
                                  : `${goal.weeksRemaining} weeks left`}
                            </span>
                          </div>
                        )}
                        
                        {/* Deadline goal due date - top right */}
                        {goal.type === 'deadline' && goal.targetDate && (
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <Clock className={`w-3.5 h-3.5 ${
                              goal.weeksRemaining !== undefined && goal.weeksRemaining < 0
                                ? 'text-red-600' 
                                : goal.weeksRemaining === 0
                                  ? 'text-netsurit-orange'
                                  : goal.weeksRemaining === 1
                                    ? 'text-netsurit-coral'
                                    : 'text-professional-gray-500'
                            }`} aria-hidden="true" />
                            <span className={`text-xs font-medium whitespace-nowrap ${
                              goal.weeksRemaining !== undefined && goal.weeksRemaining < 0
                                ? 'text-red-700 font-semibold' 
                                : goal.weeksRemaining === 0
                                  ? 'text-netsurit-orange font-semibold'
                                  : goal.weeksRemaining === 1
                                    ? 'text-netsurit-coral'
                                    : 'text-professional-gray-600'
                            }`}>
                              {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Monthly goal counter */}
                      {goal.recurrence === 'monthly' && goal.frequency && (
                        <div className="mt-2 flex items-center space-x-2">
                          {/* Undo button - only show when completionCount > 0 */}
                          {(goal.completionCount || 0) > 0 && onDecrementGoal && (
                            <button
                              onClick={() => onDecrementGoal(goal.id)}
                              className="flex-shrink-0 p-1 rounded-full hover:bg-professional-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-1"
                              aria-label="Undo last completion"
                              data-testid={`undo-goal-${goal.id}`}
                              title="Undo last completion"
                            >
                              <ChevronLeft className="w-4 h-4 text-professional-gray-500 hover:text-netsurit-red transition-colors" />
                            </button>
                          )}
                          <div className="flex space-x-1">
                            {Array.from({ length: goal.frequency }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                                  i < (goal.completionCount || 0)
                                    ? 'bg-netsurit-red shadow-sm' 
                                    : 'bg-professional-gray-300'
                                }`}
                                aria-label={`Completion ${i + 1} of ${goal.frequency}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-professional-gray-600 font-medium">
                            {goal.completionCount || 0}/{goal.frequency} this month
                          </span>
                        </div>
                      )}
                      
                      {/* Weekly goal counter */}
                      {goal.recurrence === 'weekly' && (() => {
                        const frequency = goal.frequency || 1;
                        const completionCount = goal.completionCount || 0;
                        return (
                          <div className="mt-2 flex items-center space-x-2">
                            {/* Undo button - only show when completionCount > 0 */}
                            {completionCount > 0 && onDecrementGoal && (
                              <button
                                onClick={() => onDecrementGoal(goal.id)}
                                className="flex-shrink-0 p-1 rounded-full hover:bg-professional-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-1"
                                aria-label="Undo last completion"
                                data-testid={`undo-goal-${goal.id}`}
                                title="Undo last completion"
                              >
                                <ChevronLeft className="w-4 h-4 text-professional-gray-500 hover:text-netsurit-red transition-colors" />
                              </button>
                            )}
                            <div className="flex space-x-1">
                              {Array.from({ length: frequency }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                                    i < completionCount
                                      ? 'bg-netsurit-red shadow-sm' 
                                      : 'bg-professional-gray-300'
                                  }`}
                                  aria-label={`Completion ${i + 1} of ${frequency}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-professional-gray-600 font-medium">
                              {completionCount}/{frequency} this week
                            </span>
                          </div>
                        );
                      })()}
                      
                      {/* Dream title */}
                      {goal.dreamTitle && (
                        <p className={`text-xs mt-2 ${
                          goal.completed 
                            ? 'text-professional-gray-500' 
                            : 'text-professional-gray-700'
                        }`}>
                          dream: {goal.dreamTitle}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Skip button - bottom right */}
                  {!goal.completed && goal.templateId && onSkipGoal && (
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => onSkipGoal(goal.id)}
                        className="inline-flex items-center space-x-1 text-xs text-professional-gray-500 hover:text-netsurit-red transition-colors group"
                        aria-label="Skip this week"
                        data-testid={`skip-goal-${goal.id}`}
                      >
                        <SkipForward className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        <span className="underline decoration-dotted">Skip this week</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              {!showAddGoal && currentWeekGoals.length > 0 && (
                <button
                  onClick={onShowAddGoal}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-professional-gray-300 hover:border-netsurit-red text-professional-gray-500 hover:text-netsurit-red hover:bg-gradient-to-r hover:from-netsurit-red/5 hover:to-netsurit-coral/5 transition-all duration-200 flex items-center justify-center space-x-2 font-semibold text-sm shadow-sm hover:shadow-md"
                  data-testid="add-another-goal-button"
                >
                  <Plus className="w-5 h-5" />
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
  /** Array of current week's goals */
  currentWeekGoals: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    completed: PropTypes.bool.isRequired,
    dreamTitle: PropTypes.string,
  })).isRequired,
  /** Progress percentage (0-100) */
  weeklyProgress: PropTypes.number.isRequired,
  /** Formatted week date range */
  weekRange: PropTypes.string.isRequired,
  /** Whether add goal form is shown */
  showAddGoal: PropTypes.bool.isRequired,
  /** New goal form data */
  newGoal: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    dreamId: PropTypes.string.isRequired,
    consistency: PropTypes.oneOf(['weekly', 'monthly']).isRequired,
    targetWeeks: PropTypes.number.isRequired,
    targetMonths: PropTypes.number.isRequired,
  }).isRequired,
  /** Dream book array for dropdown */
  dreamBook: PropTypes.array.isRequired,
  /** Loading state */
  isLoading: PropTypes.bool,
  /** Callback to toggle goal completion */
  onToggleGoal: PropTypes.func.isRequired,
  /** Callback to decrement goal completion count (undo) */
  onDecrementGoal: PropTypes.func,
  /** Callback to skip goal for current week */
  onSkipGoal: PropTypes.func,
  /** Callback to show add goal form */
  onShowAddGoal: PropTypes.func.isRequired,
  /** Callback to hide add goal form */
  onHideAddGoal: PropTypes.func.isRequired,
  /** Callback to add new goal */
  onAddGoal: PropTypes.func.isRequired,
  /** Callback when new goal form changes */
  onNewGoalChange: PropTypes.func.isRequired,
  /** Callback to show past weeks modal */
  onShowPastWeeks: PropTypes.func.isRequired,
  /** Callback to test week rollover (optional, dev only) */
  onTestRollover: PropTypes.func,
  /** Whether rollover is in progress */
  isRollingOver: PropTypes.bool,
};

WeekGoalsWidget.defaultProps = {
  isLoading: false,
};

export default memo(WeekGoalsWidget);

