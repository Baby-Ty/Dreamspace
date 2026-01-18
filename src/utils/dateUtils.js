
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

/**
 * Get next N ISO weeks starting from a given week
 * @param {string} startWeekIso - Starting ISO week string (e.g., "2025-W43")
 * @param {number} n - Number of weeks to generate
 * @returns {string[]} Array of ISO week strings
 * @example
 * getNextNWeeks("2025-W43", 3) // ["2025-W43", "2025-W44", "2025-W45"]
 */
export function getNextNWeeks(startWeekIso, n) {
  const weeks = [];
  const { start } = getWeekRange(startWeekIso);
  
  for (let i = 0; i < n; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + (i * 7));
    weeks.push(getIsoWeek(currentDate));
  }
  
  return weeks;
}

/**
 * Get all ISO weeks for a given year (52 or 53 weeks)
 * @param {number} year - Year to generate weeks for (e.g., 2025)
 * @returns {string[]} Array of all ISO week strings for the year
 * @example
 * getAllWeeksForYear(2025) // ["2025-W01", "2025-W02", ..., "2025-W52"]
 */
export function getAllWeeksForYear(year) {
  const weeks = [];
  
  // Start from week 1 of the year
  const firstWeek = `${year}-W01`;
  const { start } = getWeekRange(firstWeek);
  
  // Keep generating weeks until we reach the next year
  let currentDate = new Date(start);
  let currentWeekIso = getIsoWeek(currentDate);
  
  while (currentWeekIso.startsWith(`${year}-`)) {
    weeks.push(currentWeekIso);
    currentDate.setDate(currentDate.getDate() + 7);
    currentWeekIso = getIsoWeek(currentDate);
  }
  
  return weeks;
}

/**
 * Calculate all week ISO strings for a recurring goal template based on its duration settings
 * @param {Object} template - Goal template with duration settings
 * @param {string} template.durationType - 'unlimited', 'weeks', or 'milestone'
 * @param {number} [template.durationWeeks] - Number of weeks (for durationType='weeks')
 * @param {number} [template.targetMonths] - Number of months (for monthly goals)
 * @param {string} [template.startDate] - ISO date string when goal starts
 * @param {string} [template.recurrence] - 'weekly' or 'monthly'
 * @returns {string[]} Array of ISO week strings where instances should be created
 * @example
 * calculateWeekInstancesForDuration({
 *   durationType: 'weeks',
 *   durationWeeks: 4,
 *   startDate: '2025-11-03T00:00:00Z'
 * }) // ["2025-W45", "2025-W46", "2025-W47", "2025-W48"]
 */
export function calculateWeekInstancesForDuration(template) {
  const startDate = template.startDate ? new Date(template.startDate) : new Date();
  const startWeek = getIsoWeek(startDate);
  
  // Handle different duration types
  if (template.durationType === 'unlimited') {
    // For unlimited goals, create instances for next 52 weeks (1 year)
    return getNextNWeeks(startWeek, 52);
  }
  
  if (template.durationType === 'weeks' && template.durationWeeks) {
    // Create instances for specific number of weeks
    return getNextNWeeks(startWeek, template.durationWeeks);
  }
  
  if (template.durationType === 'milestone' || template.recurrence === 'monthly') {
    // For monthly goals, calculate weeks based on targetMonths
    if (template.targetMonths) {
      // Approximate: ~4.33 weeks per month
      const approximateWeeks = Math.ceil(template.targetMonths * 4.33);
      return getNextNWeeks(startWeek, approximateWeeks);
    }
    // Default to 12 weeks for milestone-based goals
    return getNextNWeeks(startWeek, 12);
  }
  
  // Default fallback: create for 4 weeks
  return getNextNWeeks(startWeek, 4);
}

/**
 * Group week IDs by year
 * @param {string[]} weekIds - Array of ISO week strings
 * @returns {Record<number, string[]>} Week IDs grouped by year
 * @example
 * groupWeekIdsByYear(["2025-W51", "2025-W52", "2026-W01", "2026-W02"])
 * // Returns: { 2025: ["2025-W51", "2025-W52"], 2026: ["2026-W01", "2026-W02"] }
 */
export function groupWeekIdsByYear(weekIds) {
  const grouped = {};
  weekIds.forEach(weekId => {
    const year = parseInt(weekId.split('-')[0]);
    if (!grouped[year]) {
      grouped[year] = [];
    }
    grouped[year].push(weekId);
  });
  return grouped;
}

/**
 * Convert months to weeks (approximately 4.33 weeks per month)
 * Used to convert monthly goals to weeks for unified tracking
 * @param {number} months - Number of months to convert
 * @returns {number} Number of weeks (rounded up)
 * @example
 * monthsToWeeks(6) // 26 (6 * 4.33 = 25.98, rounded up to 26)
 */
export function monthsToWeeks(months) {
  // Average: 4.33 weeks per month (52 weeks / 12 months)
  return Math.ceil(months * 4.33);
}

/**
 * Convert target date to target weeks (weeks from current week to target date)
 * Used to convert deadline goals to weeks for unified tracking
 * @param {string} targetDate - ISO date string (e.g., "2025-12-19")
 * @param {string} [currentWeekIso] - Current week ID (optional, defaults to now)
 * @returns {number} Number of weeks (rounded up, -1 if past deadline)
 * @example
 * dateToWeeks("2025-12-19", "2025-W47") // 5
 */
export function dateToWeeks(targetDate, currentWeekIso = null) {
  return getWeeksUntilDate(targetDate, currentWeekIso);
}

/**
 * Format a date as a short week range string
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted string (e.g., "Oct 6-12" or "Nov 11-17")
 * @example
 * formatWeekRange("2025-10-06") // "Oct 6-12"
 */
export function formatWeekRange(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Get the week range
  const isoWeek = getIsoWeek(d);
  const { start, end } = getWeekRange(isoWeek);
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startMonth = monthNames[start.getMonth()];
  const endMonth = monthNames[end.getMonth()];
  const startDay = start.getDate();
  const endDay = end.getDate();
  
  // If same month, show "Oct 6-12"
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`;
  }
  
  // If different months, show "Oct 28-Nov 3"
  return `${startMonth} ${startDay}-${endMonth} ${endDay}`;
}

/**
 * Calculate number of weeks between current week and target date
 * Similar to getMonthsRemaining but for weeks
 * @param {string} targetDate - ISO date string (e.g., "2025-12-31")
 * @param {string} [currentWeekIso] - Current week ID (optional, defaults to now)
 * @returns {number} Weeks remaining (0 or positive, -1 if past deadline)
 * @example
 * getWeeksUntilDate("2025-12-31", "2025-W47") // 7
 * getWeeksUntilDate("2025-11-15", "2025-W47") // -1 (past deadline)
 */
export function getWeeksUntilDate(targetDate, currentWeekIso = null) {
  if (!targetDate) return -1;
  
  const target = new Date(targetDate);
  if (isNaN(target.getTime())) {
    console.warn('Invalid targetDate:', targetDate);
    return -1;
  }
  
  const weekIso = currentWeekIso || getCurrentIsoWeek();
  const { start: currentWeekStart } = getWeekRange(weekIso);
  
  // Calculate days difference (round up to include partial weeks)
  const daysDiff = Math.ceil((target - currentWeekStart) / (1000 * 60 * 60 * 24));
  
  // Convert to weeks (round up to include partial weeks)
  // This ensures a goal due on Friday still shows as "due this week" on Monday
  const weeksDiff = Math.ceil(daysDiff / 7);
  
  // Return -1 if deadline has passed, otherwise return weeks remaining
  return weeksDiff < 0 ? -1 : weeksDiff;
}

/**
 * Check if a deadline goal should still be shown
 * @param {string} targetDate - ISO date string
 * @param {string} [currentWeekIso] - Current week ID (optional, defaults to now)
 * @returns {boolean} True if deadline is in future or current week
 * @example
 * isDeadlineActive("2025-12-31", "2025-W47") // true
 * isDeadlineActive("2025-11-15", "2025-W47") // false (past deadline)
 */
export function isDeadlineActive(targetDate, currentWeekIso = null) {
  const weeksRemaining = getWeeksUntilDate(targetDate, currentWeekIso);
  return weeksRemaining >= 0;
}

export const dateUtils = {
  getIsoWeek,
  getCurrentIsoWeek,
  parseIsoWeek,
  computeStreak,
  isMilestoneComplete,
  formatIsoWeek,
  getWeekRange,
  formatWeekRange,
  getNextNWeeks,
  getAllWeeksForYear,
  calculateWeekInstancesForDuration,
  groupWeekIdsByYear,
  getWeeksUntilDate,
  isDeadlineActive
};
