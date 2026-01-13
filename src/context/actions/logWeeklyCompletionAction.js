/**
 * Log weekly goal completion action
 * Handles consistency goal streaks, scoring, and completion logic
 */

import { actionTypes } from '../../state/appReducer.js';
import { computeStreak } from '../../utils/dateUtils';

export async function logWeeklyCompletionAction(
  goalId, 
  isoWeek, 
  completed, 
  state, 
  dispatch,
  updateConsistencyGoalAndTemplate
) {
  // Log the completion in state
  dispatch({ 
    type: actionTypes.LOG_WEEKLY_COMPLETION, 
    payload: { goalId, isoWeek, completed } 
  });
  
  if (!state.currentUser?.dreamBook || !state.weeklyGoals) return;
  
  const weeklyGoal = state.weeklyGoals.find(g => g.id === goalId);
  
  // Handle consistency goal completion check
  if (weeklyGoal?.goalId && weeklyGoal?.dreamId) {
    const dream = state.currentUser.dreamBook.find(d => d.id === weeklyGoal.dreamId);
    if (dream) {
      const goal = dream.goals?.find(g => g.id === weeklyGoal.goalId);
      
      // Check if consistency goal target is reached
      if (goal?.type === 'consistency' && goal?.startDate) {
        const newStreak = computeStreak(
          { ...(weeklyGoal.weekLog || {}), [isoWeek]: completed },
          goal.startDate
        );
        
        // If target weeks reached and not yet completed, mark as complete
        if (goal.targetWeeks && newStreak >= goal.targetWeeks && !goal.completed) {
          const updatedGoal = {
            ...goal,
            completed: true,
            active: false,
            completedAt: new Date().toISOString()
          };
          
          const template = state.weeklyGoals?.find(wg => 
            wg.type === 'weekly_goal_template' && 
            (wg.id === goal.id || wg.goalId === goal.id)
          );
          
          const updatedTemplate = template ? {
            ...template,
            completed: true,
            active: false,
            completedAt: new Date().toISOString()
          } : null;
          
          await updateConsistencyGoalAndTemplate(
            dream.id,
            updatedGoal,
            updatedTemplate
          );
          
          // Award points for goal completion
          const scoringEntry = {
            id: Date.now(),
            type: 'goalCompleted',
            title: `Completed goal: "${goal.title}"`,
            points: state.scoringRules.milestoneCompleted || 15,
            date: new Date().toISOString().split('T')[0],
            category: dream.category
          };
          dispatch({ type: actionTypes.ADD_SCORING_ENTRY, payload: scoringEntry });
          
          const newScore = state.currentUser.score + (state.scoringRules.milestoneCompleted || 15);
          dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: newScore });
        }
      }
    }
  }
  
  // Award points for weekly goal completion
  if (completed) {
    const scoringEntry = {
      id: Date.now() + 1,
      type: 'weeklyGoalCompleted',
      title: `Completed weekly goal`,
      points: state.scoringRules.weeklyGoalCompleted || 3,
      date: new Date().toISOString().split('T')[0],
      category: weeklyGoal?.dreamCategory || 'General'
    };
    dispatch({ type: actionTypes.ADD_SCORING_ENTRY, payload: scoringEntry });
    
    const newScore = state.currentUser.score + (state.scoringRules.weeklyGoalCompleted || 3);
    dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: newScore });
  }
}
