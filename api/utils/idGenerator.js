/**
 * ID Generator Utilities for DreamSpace
 * Generates short, unique IDs for teams and other entities
 */

/**
 * Generate a short, unique team ID
 * Format: team_XXXXXX (6 alphanumeric chars)
 * Supports ~2 billion unique combinations - plenty for <10,000 teams
 * @returns {string} Short team ID (e.g., "team_a1b2c3")
 */
function generateTeamId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `team_${id}`;
}

/**
 * Generate a short, unique meeting ID
 * Format: mtg_XXXXXXXX (8 alphanumeric chars)
 * @param {string} teamId - Team ID to include for context
 * @returns {string} Short meeting ID
 */
function generateMeetingId(teamId) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `mtg_${id}`;
}

module.exports = {
  generateTeamId,
  generateMeetingId
};
