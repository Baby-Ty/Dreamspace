
/**
 * Category mapping for radar chart visualization
 * Groups 9 dream categories into 6 simplified radar points
 */

export const RADAR_CATEGORIES = [
  {
    id: 'growth',
    label: 'Growth',
    sourceCategories: ['Learning', 'Personal Growth', 'Spiritual'],
    color: '#E53935', // netsurit-red
    description: 'Personal development, learning new skills, spiritual growth, and expanding your horizons.'
  },
  {
    id: 'relationships',
    label: 'Relationships',
    sourceCategories: ['Relationships'],
    color: '#FF6B5B', // netsurit-coral
    description: 'Building stronger bonds with family, friends, and loved ones.'
  },
  {
    id: 'wellness',
    label: 'Wellness',
    sourceCategories: ['Health'],
    color: '#FF8A65', // netsurit-orange
    description: 'Nurturing your physical health, mental peace, and spiritual well-being.'
  },
  {
    id: 'wealth',
    label: 'Wealth',
    sourceCategories: ['Finance', 'Career'],
    color: '#E53935',
    description: 'Financial freedom, career goals, and material abundance.'
  },
  {
    id: 'adventure',
    label: 'Adventure',
    sourceCategories: ['Travel', 'Creative'],
    color: '#FF6B5B',
    description: 'Exploring the world, having fun, and seeking new experiences.'
  },
  {
    id: 'community',
    label: 'Community',
    sourceCategories: ['Community', 'Other'],
    color: '#FF8A65',
    description: 'Giving back, volunteering, and making a positive impact on others.'
  }
];

/**
 * Aggregates dream counts by radar category
 * @param {Array} dreams - Array of dream objects with category property
 * @returns {Array} Radar data with counts for each category
 */
export function aggregateDreamsByRadarCategory(dreams = []) {
  return RADAR_CATEGORIES.map(radarCat => {
    const matchingDreams = dreams.filter(dream => 
      radarCat.sourceCategories.includes(dream.category)
    );
    
    return {
      ...radarCat,
      count: matchingDreams.length,
      // Normalize to 0-1 scale (max 3 dreams per category for full scale)
      value: Math.min(matchingDreams.length / 3, 1),
      dreams: matchingDreams.map(d => d.title)
    };
  });
}

/**
 * Gets the radar category for a given dream category
 * @param {string} dreamCategory - Original dream category
 * @returns {Object|null} Matching radar category or null
 */
export function getRadarCategoryForDream(dreamCategory) {
  return RADAR_CATEGORIES.find(radarCat => 
    radarCat.sourceCategories.includes(dreamCategory)
  ) || null;
}