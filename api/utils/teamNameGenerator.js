/**
 * Generate random team names for DreamSpace (CommonJS version for API)
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
  'Phoenix', 'Dragons', 'Titans', 'Giants', 'Rockets'
];

/**
 * Generate a random team name
 * @returns {string} Random team name
 */
function generateRandomTeamName() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective} ${noun}`;
}

module.exports = {
  generateRandomTeamName
};

