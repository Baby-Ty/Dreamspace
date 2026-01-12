/**
 * Week and date utility functions for backend
 * Handles ISO week calculations and date conversions
 * 
 * These utilities are shared across the API layer for consistent
 * week-based calculations, especially for the weekly rollover system.
 */

/**
 * Get current ISO week
 * @param {Date} [date=new Date()] - Date to get week for
 * @returns {string} ISO week string (e.g., "2025-W47")
 */
function getCurrentIsoWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Parse ISO week string to date
 * @param {string} isoWeek - ISO week string (e.g., "2025-W47")
 * @returns {Date} Monday of that week
 */
function parseIsoWeek(isoWeek) {
  const [yearStr, weekStr] = isoWeek.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
  
  // Get January 4th of the year (always in week 1)
  const jan4 = new Date(year, 0, 4);
  
  // Get start of week 1 (Monday)
  const startOfWeek1 = new Date(jan4);
  const dayOfWeek = jan4.getDay() || 7; // Convert Sunday (0) to 7
  startOfWeek1.setDate(jan4.getDate() - dayOfWeek + 1);
  
  // Add weeks
  const targetDate = new Date(startOfWeek1);
  targetDate.setDate(startOfWeek1.getDate() + (week - 1) * 7);
  
  return targetDate;
}

/**
 * Get week date range (Monday to Sunday)
 * @param {string} isoWeek - ISO week string (e.g., "2025-W47")
 * @returns {{start: Date, end: Date}} Week start and end dates
 */
function getWeekRange(isoWeek) {
  const start = parseIsoWeek(isoWeek);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

/**
 * Get weeks between two ISO week strings
 * @param {string} startWeekIso - Start week (e.g., "2025-W47")
 * @param {string} endWeekIso - End week (e.g., "2025-W50")
 * @returns {string[]} Array of ISO week strings
 */
function getWeeksBetween(startWeekIso, endWeekIso) {
  const weeks = [];
  const start = parseIsoWeek(startWeekIso);
  const end = parseIsoWeek(endWeekIso);
  
  let current = new Date(start);
  while (current < end) {
    weeks.push(getCurrentIsoWeek(current));
    current.setDate(current.getDate() + 7);
  }
  
  return weeks;
}

/**
 * Get the next week ID from a given week ID
 * @param {string} isoWeek - ISO week string (e.g., "2025-W47")
 * @returns {string} Next week ID (e.g., "2025-W48")
 */
function getNextWeekId(isoWeek) {
  const startDate = parseIsoWeek(isoWeek);
  const nextWeekDate = new Date(startDate);
  nextWeekDate.setDate(startDate.getDate() + 7);
  return getCurrentIsoWeek(nextWeekDate);
}

/**
 * Get month ID from ISO week (e.g., "2025-W48" -> "2025-11")
 * @param {string} isoWeek - ISO week string
 * @returns {string} Month ID in format "YYYY-MM"
 */
function getMonthId(isoWeek) {
  const date = parseIsoWeek(isoWeek);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Convert months to weeks (approximately 4.33 weeks per month)
 * Used to convert monthly goals to weeks for unified tracking
 * @param {number} months - Number of months to convert
 * @returns {number} Number of weeks (rounded up)
 */
function monthsToWeeks(months) {
  // Average: 4.33 weeks per month (52 weeks / 12 months)
  return Math.ceil(months * 4.33);
}

/**
 * Calculate number of weeks between current week and target date
 * Similar to frontend getWeeksUntilDate
 * @param {string} targetDate - ISO date string (e.g., "2025-12-31")
 * @param {string} currentWeekIso - Current week ID (e.g., "2025-W47")
 * @returns {number} Weeks remaining (0 or positive, -1 if past deadline)
 */
function getWeeksUntilDate(targetDate, currentWeekIso) {
  if (!targetDate) return -1;
  
  const target = new Date(targetDate);
  if (isNaN(target.getTime())) {
    return -1;
  }
  
  const { start: currentWeekStart } = getWeekRange(currentWeekIso);
  
  // Calculate days difference (round up to include partial weeks)
  const daysDiff = Math.ceil((target - currentWeekStart) / (1000 * 60 * 60 * 24));
  
  // Convert to weeks (round up to include partial weeks)
  // This ensures a goal due on Friday still shows as "due this week" on Monday
  const weeksDiff = Math.ceil(daysDiff / 7);
  
  // Return -1 if deadline has passed, otherwise return weeks remaining
  return weeksDiff < 0 ? -1 : weeksDiff;
}

module.exports = {
  getCurrentIsoWeek,
  parseIsoWeek,
  getWeekRange,
  getWeeksBetween,
  getNextWeekId,
  getMonthId,
  monthsToWeeks,
  getWeeksUntilDate
};
