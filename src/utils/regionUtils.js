/**
 * Region and Country Utilities
 * Maps region/office names to ISO country codes for flag display
 */

/**
 * Map office/region names to ISO 3166-1 alpha-2 country codes
 * @param {string} office - Office or region name
 * @returns {string} ISO country code (e.g., 'ZA', 'US', 'MX')
 */
export const getCountryCode = (office) => {
  if (!office) return 'Remote';
  
  const mapping = {
    // South Africa
    'South Africa': 'ZA',
    'Cape Town': 'ZA',
    'Johannesburg': 'ZA',
    'Durban': 'ZA',
    'Pretoria': 'ZA',
    
    // United States
    'United States': 'US',
    'New York': 'US',
    'Los Angeles': 'US',
    'Chicago': 'US',
    'San Francisco': 'US',
    
    // Mexico
    'Mexico': 'MX',
    'Mexico City': 'MX',
    
    // Brazil
    'Brazil': 'BR',
    'São Paulo': 'BR',
    'Rio de Janeiro': 'BR',
    
    // Poland
    'Poland': 'PL',
    'Warsaw': 'PL',
    'Krakow': 'PL',
    
    // United Kingdom
    'United Kingdom': 'GB',
    'London': 'GB',
    'Manchester': 'GB',
    
    // Remote/Global
    'Remote': 'Remote',
    'Global': 'All'
  };
  
  return mapping[office] || 'Remote';
};

/**
 * Get region name from country code
 * @param {string} countryCode - ISO country code
 * @returns {string} Region name
 */
export const getRegionName = (countryCode) => {
  const mapping = {
    'ZA': 'South Africa',
    'US': 'United States',
    'MX': 'Mexico',
    'BR': 'Brazil',
    'PL': 'Poland',
    'GB': 'United Kingdom',
    'Remote': 'Remote',
    'All': 'All Regions'
  };
  
  return mapping[countryCode] || 'Remote';
};

/**
 * Get all supported regions
 * @returns {Array<{name: string, code: string}>} Array of region objects
 */
export const getSupportedRegions = () => [
  { name: 'South Africa', code: 'ZA' },
  { name: 'United States', code: 'US' },
  { name: 'Mexico', code: 'MX' },
  { name: 'Brazil', code: 'BR' },
  { name: 'Poland', code: 'PL' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'Remote', code: 'Remote' }
];

