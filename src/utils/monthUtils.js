// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.

/**
 * Monthly goal tracking utilities
 * Used for goals that track completion per month
 */

/**
 * Get current month ID in format "YYYY-MM"
 * @returns {string} Current month ID (e.g., "2025-11")
 */
export function getCurrentMonthId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get month ID for a specific date
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Month ID in format "YYYY-MM"
 */
export function getMonthId(date) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get month ID from ISO week string
 * @param {string} isoWeek - ISO week string (e.g., "2025-W44")
 * @returns {string} Month ID (e.g., "2025-11")
 */
export function getMonthIdFromWeek(isoWeek) {
  // Parse ISO week format "YYYY-WNN"
  const [year, weekPart] = isoWeek.split('-W');
  const week = parseInt(weekPart, 10);
  
  // Calculate the date of the first day of the ISO week
  // ISO week 1 starts on the Monday of the week containing Jan 4th
  const jan4 = new Date(parseInt(year), 0, 4);
  const jan4Day = jan4.getDay() || 7; // Convert Sunday (0) to 7
  const weekStart = new Date(jan4);
  weekStart.setDate(jan4.getDate() - jan4Day + 1 + (week - 1) * 7);
  
  return getMonthId(weekStart);
}

/**
 * Calculate how many months have elapsed since start date
 * @param {string} startDate - ISO date string
 * @param {string} currentMonthId - Current month ID (optional, defaults to now)
 * @returns {number} Number of months elapsed (1-indexed)
 */
export function getMonthsElapsed(startDate, currentMonthId = null) {
  const start = new Date(startDate);
  const startMonthId = getMonthId(start);
  const targetMonthId = currentMonthId || getCurrentMonthId();
  
  // Parse month IDs
  const [startYear, startMonth] = startMonthId.split('-').map(Number);
  const [targetYear, targetMonth] = targetMonthId.split('-').map(Number);
  
  // Calculate months difference
  const monthsDiff = (targetYear - startYear) * 12 + (targetMonth - startMonth);
  
  // Return 1-indexed (first month is 1, not 0)
  return monthsDiff + 1;
}

/**
 * Calculate how many months remain until target is met
 * @param {string} startDate - ISO date string
 * @param {number} targetMonths - Total months to track
 * @param {string} currentMonthId - Current month ID (optional)
 * @returns {number} Months remaining (0 or positive)
 */
export function getMonthsRemaining(startDate, targetMonths, currentMonthId = null) {
  const elapsed = getMonthsElapsed(startDate, currentMonthId);
  const remaining = targetMonths - elapsed + 1;
  return Math.max(0, remaining);
}

/**
 * Check if a monthly goal is complete (has reached target months)
 * @param {string} startDate - ISO date string
 * @param {number} targetMonths - Total months to track
 * @param {string} currentMonthId - Current month ID (optional)
 * @returns {boolean} True if goal has reached or exceeded target months
 */
export function isMonthlyGoalComplete(startDate, targetMonths, currentMonthId = null) {
  const elapsed = getMonthsElapsed(startDate, currentMonthId);
  return elapsed > targetMonths;
}

/**
 * Check if a month ID is within the tracking period
 * @param {string} monthId - Month ID to check (e.g., "2025-11")
 * @param {string} startDate - ISO date string
 * @param {number} targetMonths - Total months to track
 * @returns {boolean} True if month is within tracking period
 */
export function isMonthInTrackingPeriod(monthId, startDate, targetMonths) {
  const startMonthId = getMonthId(new Date(startDate));
  const [startYear, startMonth] = startMonthId.split('-').map(Number);
  const [checkYear, checkMonth] = monthId.split('-').map(Number);
  
  // Calculate month index from start
  const monthIndex = (checkYear - startYear) * 12 + (checkMonth - startMonth);
  
  // Should be within 0 to targetMonths-1
  return monthIndex >= 0 && monthIndex < targetMonths;
}

/**
 * Format month ID for display
 * @param {string} monthId - Month ID (e.g., "2025-11")
 * @returns {string} Formatted month (e.g., "November 2025")
 */
export function formatMonthId(monthId) {
  const [year, month] = monthId.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Get all month IDs in a tracking period
 * @param {string} startDate - ISO date string
 * @param {number} targetMonths - Total months to track
 * @returns {string[]} Array of month IDs
 */
export function getTrackingMonthIds(startDate, targetMonths) {
  const startMonthId = getMonthId(new Date(startDate));
  const [startYear, startMonth] = startMonthId.split('-').map(Number);
  
  const monthIds = [];
  for (let i = 0; i < targetMonths; i++) {
    const month = startMonth + i;
    const year = startYear + Math.floor((month - 1) / 12);
    const adjustedMonth = ((month - 1) % 12) + 1;
    monthIds.push(`${year}-${String(adjustedMonth).padStart(2, '0')}`);
  }
  
  return monthIds;
}




