// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

/**
 * Category mapping for radar chart visualization
 * Groups 9 dream categories into 6 simplified radar points
 */

export const RADAR_CATEGORIES = [
  {
    id: 'growth',
    label: 'Growth',
    sourceCategories: ['Growth & Learning', 'Skills & Hobbies'],
    color: '#E53935' // netsurit-red
  },
  {
    id: 'relationships',
    label: 'Relationships',
    sourceCategories: ['Family & Friends', 'Love & Relationships'],
    color: '#FF6B5B' // netsurit-coral
  },
  {
    id: 'wellness',
    label: 'Wellness',
    sourceCategories: ['Wellness & Fitness', 'Spirituality & Mind'],
    color: '#FF8A65' // netsurit-orange
  },
  {
    id: 'wealth',
    label: 'Wealth',
    sourceCategories: ['Money & Wealth'],
    color: '#E53935'
  },
  {
    id: 'adventure',
    label: 'Adventure',
    sourceCategories: ['Adventure & Fun'],
    color: '#FF6B5B'
  },
  {
    id: 'community',
    label: 'Community',
    sourceCategories: ['Contribution & Giving Back'],
    color: '#FF8A65'
  }
];

/**
 * Aggregates dream counts by radar category
 * @param {Array} dreams - Array of dream objects with category property
 * @returns {Array} Radar data with counts for each category
 */
export function aggregateDreamsByRadarCategory(dreams = []) {
  return RADAR_CATEGORIES.map(radarCat => {
    const count = dreams.filter(dream => 
      radarCat.sourceCategories.includes(dream.category)
    ).length;
    
    return {
      ...radarCat,
      count,
      // Normalize to 0-1 scale (max 3 dreams per category for full scale)
      value: Math.min(count / 3, 1)
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

