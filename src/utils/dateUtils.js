// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.

/**
 * Date utility functions for DreamSpace
 * Handles ISO week calculations and date formatting
 */

/**
 * Get ISO week string from a date
 * @param {Date} [date=new Date()] - Date to convert
 * @returns {string} ISO week string in format "YYYY-Www" (e.g., "2025-W41")
 * @example
 * getIsoWeek(new Date('2025-10-06')) // "2025-W41"
 */
export function getIsoWeek(date = new Date()) {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
  const year = target.getFullYear();
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

/**
 * Get current ISO week string
 * @returns {string} Current ISO week (e.g., "2025-W41")
 * @example
 * getCurrentIsoWeek() // "2025-W41"
 */
export function getCurrentIsoWeek() {
  return getIsoWeek(new Date());
}

/**
 * Parse ISO week string to get year and week number
 * @param {string} isoWeek - ISO week string (e.g., "2025-W41")
 * @returns {{year: number, week: number}} Year and week number
 * @example
 * parseIsoWeek("2025-W41") // { year: 2025, week: 41 }
 */
export function parseIsoWeek(isoWeek) {
  const match = isoWeek.match(/^(\d{4})-W(\d{2})$/);
  if (!match) {
    return { year: new Date().getFullYear(), week: 1 };
  }
  return {
    year: parseInt(match[1], 10),
    week: parseInt(match[2], 10)
  };
}

/**
 * Compute consecutive week streak from weekLog
 * @param {Object} weekLog - Object with ISO week keys and boolean values
 * @param {string} startDate - ISO date string when tracking started
 * @returns {number} Number of consecutive weeks with true value
 * @example
 * computeStreak({
 *   '2025-W40': true,
 *   '2025-W41': true,
 *   '2025-W42': false
 * }, '2025-10-01') // 2
 */
export function computeStreak(weekLog = {}, startDate = null) {
  if (!weekLog || Object.keys(weekLog).length === 0) {
    return 0;
  }

  const start = startDate ? new Date(startDate) : new Date();
  const startWeek = getIsoWeek(start);
  const currentWeek = getCurrentIsoWeek();
  
  // Get all weeks from start to current
  const weeks = [];
  let current = new Date(start);
  const now = new Date();
  
  while (current <= now) {
    weeks.push(getIsoWeek(current));
    current.setDate(current.getDate() + 7);
  }
  
  // Count consecutive weeks from the start
  let streak = 0;
  for (const week of weeks) {
    if (weekLog[week] === true) {
      streak++;
    } else {
      // Break streak on first false/missing week
      break;
    }
  }
  
  return streak;
}

/**
 * Check if a milestone is complete based on streak and target
 * @param {Object} milestone - Milestone object
 * @param {number} milestone.targetWeeks - Target number of weeks
 * @param {number} milestone.streakWeeks - Current streak
 * @param {boolean} milestone.endOnDreamComplete - End when dream completes
 * @param {number} dreamProgress - Dream progress percentage
 * @returns {boolean} Whether milestone is complete
 * @example
 * isMilestoneComplete({ targetWeeks: 12, streakWeeks: 12 }, 85) // true
 */
export function isMilestoneComplete(milestone, dreamProgress = 0) {
  if (!milestone) return false;
  
  // Complete if streak reached target
  if (milestone.streakWeeks >= milestone.targetWeeks) {
    return true;
  }
  
  // Complete if dream is done and endOnDreamComplete is true
  if (milestone.endOnDreamComplete && dreamProgress >= 100) {
    return true;
  }
  
  return false;
}

/**
 * Format ISO week for display
 * @param {string} isoWeek - ISO week string (e.g., "2025-W41")
 * @returns {string} Formatted string (e.g., "Week 41, 2025")
 * @example
 * formatIsoWeek("2025-W41") // "Week 41, 2025"
 */
export function formatIsoWeek(isoWeek) {
  const { year, week } = parseIsoWeek(isoWeek);
  return `Week ${week}, ${year}`;
}

/**
 * Get week range dates from ISO week
 * @param {string} isoWeek - ISO week string
 * @returns {{start: Date, end: Date}} Start and end dates of the week
 * @example
 * getWeekRange("2025-W41") // { start: Date(...), end: Date(...) }
 */
export function getWeekRange(isoWeek) {
  const { year, week } = parseIsoWeek(isoWeek);
  
  // ISO week 1 is the week with the year's first Thursday
  const jan4 = new Date(year, 0, 4);
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  
  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  return { start: weekStart, end: weekEnd };
}

export const dateUtils = {
  getIsoWeek,
  getCurrentIsoWeek,
  parseIsoWeek,
  computeStreak,
  isMilestoneComplete,
  formatIsoWeek,
  getWeekRange
};

