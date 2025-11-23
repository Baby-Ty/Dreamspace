/**
 * Generate random team names for DreamSpace
 * Provides creative, professional team name suggestions
 */

const adjectives = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon',
  'Phoenix', 'Titan', 'Apex', 'Nexus', 'Vortex',
  'Stellar', 'Nova', 'Quantum', 'Zenith', 'Pinnacle',
  'Catalyst', 'Momentum', 'Velocity', 'Synergy', 'Dynamo',
  'Horizon', 'Summit', 'Peak', 'Elevate', 'Ascend',
  'Thunder', 'Lightning', 'Storm', 'Aurora', 'Eclipse',
  'Fusion', 'Unity', 'Alliance', 'Collective', 'Squadron',
  'Elite', 'Prime', 'Core', 'Vanguard', 'Frontier'
];

const nouns = [
  'Team', 'Squad', 'Unit', 'Force', 'Group',
  'Alliance', 'Collective', 'Squadron', 'Brigade', 'Legion',
  'Champions', 'Warriors', 'Guardians', 'Defenders', 'Heroes',
  'Pioneers', 'Trailblazers', 'Explorers', 'Voyagers', 'Navigators',
  'Innovators', 'Creators', 'Builders', 'Makers', 'Crafters',
  'Dreamers', 'Achievers', 'Leaders', 'Masters', 'Experts',
  'Stars', 'Eagles', 'Lions', 'Wolves', 'Panthers',
  'Phoenix', 'Dragons', 'Titans', 'Giants', 'Titans'
];

const suffixes = [
  '', 'Pro', 'Elite', 'Prime', 'Plus',
  'X', '360', 'Max', 'Ultra', 'Pro',
  'United', 'Alliance', 'Collective', 'Group', 'Squad'
];

/**
 * Generate a random team name
 * @returns {string} Random team name
 */
export function generateRandomTeamName() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const useSuffix = Math.random() > 0.7; // 30% chance of suffix
  const suffix = useSuffix ? ` ${suffixes[Math.floor(Math.random() * suffixes.length)]}` : '';
  
  return `${adjective} ${noun}${suffix}`.trim();
}

/**
 * Generate multiple random team name suggestions
 * @param {number} count - Number of suggestions to generate (default: 5)
 * @returns {string[]} Array of unique team name suggestions
 */
export function generateTeamNameSuggestions(count = 5) {
  const suggestions = new Set();
  
  while (suggestions.size < count) {
    suggestions.add(generateRandomTeamName());
  }
  
  return Array.from(suggestions);
}

