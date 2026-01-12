/**
 * Goal scoring utilities for weekly rollover
 * Calculates points for completed goals when archiving weeks
 */

/**
 * Calculate score from goals array
 * Used when archiving weeks to calculate total points earned
 * 
 * Scoring rules:
 * - Weekly goals: 3 points
 * - Monthly goals: 5 points
 * - Deadline goals: 5 points
 * 
 * @param {Array} goals - Array of goal objects
 * @returns {number} Total score from completed goals
 */
function calculateScore(goals) {
  return goals.reduce((total, goal) => {
    if (goal.completed) {
      // Weekly goals: 3 points
      // Monthly goals: 5 points
      // Deadline goals: 5 points
      return total + (goal.recurrence === 'monthly' ? 5 : goal.type === 'deadline' ? 5 : 3);
    }
    return total;
  }, 0);
}

module.exports = {
  calculateScore
};
