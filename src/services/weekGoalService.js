
import { parseIsoWeek, getCurrentIsoWeek } from '../utils/dateUtils.js'

/**
 * Expand recurring goals into per-week instances for given weeks.
 * Only expands active recurring goals.
 * @param {Array} goals
 * @param {Array<string>} weeks
 * @returns {Array}
 */
export const expandRecurringGoals = (goals, weeks) =>
  goals.flatMap(goal => {
    // For recurring goals, only expand if active (default to true if not set)
    if (goal.recurring) {
      const isActive = goal.active !== false; // Default to true
      return isActive ? weeks.map(week => ({ ...goal, week })) : [];
    }
    // For one-time goals, include if week matches
    return goal.week && weeks.includes(goal.week) ? [goal] : [];
  })

/**
 * Returns goals visible in specified week.
 * @param {string} week
 * @param {Array} goals
 * @returns {Array}
 */
export const getVisibleGoalsForWeek = (week, goals) =>
  expandRecurringGoals(goals, [week]).filter(g => !g.hidden)

/**
 * Compute completed and total goals for a week.
 * @param {string} week
 * @param {Array} goals
 * @returns {{ completed: number, total: number }}
 */
export const computeWeekProgress = (week, goals) => {
  const weekGoals = getVisibleGoalsForWeek(week, goals)
  const completed = weekGoals.filter(g => g.completed).length
  const total = weekGoals.length
  return { completed, total }
}

/**
 * Returns true if week is current or future.
 * @param {string} week
 * @returns {boolean}
 */
export const isWeekEditable = week => {
  const { year: wYear, week: wNum } = parseIsoWeek(week)
  const { year: cYear, week: cNum } = parseIsoWeek(getCurrentIsoWeek())
  return wYear > cYear || (wYear === cYear && wNum >= cNum)
}