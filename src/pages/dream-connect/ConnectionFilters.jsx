// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import PropTypes from 'prop-types';
import { Filter, MapPin, RefreshCw, Search, X, Globe } from 'lucide-react';

/**
 * SVG Flag Components - Cross-browser compatible
 * Simplified, clean flag designs for better clarity at small sizes
 */
const FlagIcon = ({ countryCode, className = '' }) => {
  const flags = {
    'All': (
      <Globe className={className} strokeWidth={2} />
    ),
    'ZA': ( // South Africa
      <svg className={className} viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="za-clip">
            <rect width="900" height="600" rx="20"/>
          </clipPath>
        </defs>
        <g clipPath="url(#za-clip)">
          <rect fill="#002395" width="900" height="600"/>
          <rect fill="#DE3831" y="200" width="900" height="200"/>
          <path d="M0,0 L0,600 L450,300 Z" fill="#007A4D"/>
          <path d="M0,50 L0,550 L400,300 Z" fill="#FFB612"/>
          <rect fill="#FFFFFF" y="240" width="900" height="120"/>
        </g>
      </svg>
    ),
    'US': ( // United States
      <svg className={className} viewBox="0 0 760 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="us-clip">
            <rect width="760" height="400" rx="20"/>
          </clipPath>
        </defs>
        <g clipPath="url(#us-clip)">
          <rect fill="#B22234" width="760" height="400"/>
          <rect fill="#fff" y="30" width="760" height="30"/>
          <rect fill="#fff" y="92" width="760" height="30"/>
          <rect fill="#fff" y="154" width="760" height="30"/>
          <rect fill="#fff" y="216" width="760" height="30"/>
          <rect fill="#fff" y="278" width="760" height="30"/>
          <rect fill="#fff" y="340" width="760" height="30"/>
          <rect fill="#3C3B6E" width="304" height="216"/>
        </g>
      </svg>
    ),
    'MX': ( // Mexico
      <svg className={className} viewBox="0 0 840 480" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="mx-clip">
            <rect width="840" height="480" rx="20"/>
          </clipPath>
        </defs>
        <g clipPath="url(#mx-clip)">
          <rect fill="#006847" width="280" height="480"/>
          <rect fill="#FFFFFF" x="280" width="280" height="480"/>
          <rect fill="#CE1126" x="560" width="280" height="480"/>
        </g>
      </svg>
    ),
    'BR': ( // Brazil
      <svg className={className} viewBox="0 0 720 480" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="br-clip">
            <rect width="720" height="480" rx="20"/>
          </clipPath>
        </defs>
        <g clipPath="url(#br-clip)">
          <rect fill="#009b3a" width="720" height="480"/>
          <path fill="#fedf00" d="M360,60 L620,240 L360,420 L100,240 Z"/>
          <circle fill="#002776" cx="360" cy="240" r="80"/>
        </g>
      </svg>
    ),
    'PL': ( // Poland
      <svg className={className} viewBox="0 0 640 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="pl-clip">
            <rect width="640" height="400" rx="20"/>
          </clipPath>
        </defs>
        <g clipPath="url(#pl-clip)">
          <rect fill="#FFFFFF" width="640" height="200"/>
          <rect fill="#DC143C" y="200" width="640" height="200"/>
        </g>
      </svg>
    )
  };

  return flags[countryCode] || <Globe className={className} strokeWidth={2} />;
};

FlagIcon.propTypes = {
  countryCode: PropTypes.string.isRequired,
  className: PropTypes.string
};

/**
 * Pure presentational component for Dream Connect filters
 * @param {Object} filters - Current filter values { category, location, search }
 * @param {Function} onChange - Callback for filter changes (key, value) => void
 * @param {Array} locations - Array of available location options
 * @param {Function} onRefresh - Callback for refresh button
 */
function ConnectionFilters({ filters, onChange, locations, onRefresh }) {
  const categoryPills = [
    'All',
    'Learning',
    'Health',
    'Travel',
    'Creative',
    'Career',
    'Finance',
    'Community'
  ];

  const handleCategoryClick = (category) => {
    onChange('category', category);
  };

  const handleLocationChange = (e) => {
    onChange('location', e.target.value);
  };

  const handleSearchChange = (e) => {
    onChange('search', e.target.value);
  };

  const clearSearch = () => {
    onChange('search', '');
  };

  // Country/Region flags mapping with SVG codes
  const regionFlags = [
    { code: 'All', countryCode: 'All', label: 'All Regions' },
    { code: 'South Africa', countryCode: 'ZA', label: 'South Africa' },
    { code: 'United States', countryCode: 'US', label: 'United States' },
    { code: 'Mexico', countryCode: 'MX', label: 'Mexico' },
    { code: 'Brazil', countryCode: 'BR', label: 'Brazil' },
    { code: 'Poland', countryCode: 'PL', label: 'Poland' }
  ];

  return (
    <div className="space-y-3" data-testid="connection-filters">
      {/* Filter Card */}
      <div className="bg-white rounded-xl p-4 border border-professional-gray-200" data-testid="category-filter">
        {/* Top Row: Filter Title (Left) + Region Flags (Right) */}
        <div className="flex items-center justify-between gap-3 mb-3">
          {/* Left: Filter Title */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-netsurit-red" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-professional-gray-900 whitespace-nowrap">
              Filter by Interest
            </h3>
          </div>

          {/* Right: Region Label + Flags + Refresh */}
          <div className="flex items-center gap-3" data-testid="location-filter">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-netsurit-coral" aria-hidden="true" />
              <span className="text-sm font-medium text-professional-gray-700 whitespace-nowrap">
                Region
              </span>
              <div 
                className="flex items-center gap-2"
                role="group"
                aria-label="Region filters"
              >
                {regionFlags.map((region) => (
                  <button
                    key={region.code}
                    onClick={() => handleLocationChange({ target: { value: region.code } })}
                    className={`
                      relative w-9 h-9 flex items-center justify-center rounded-lg 
                      transition-all duration-200 
                      border-2 shadow-sm
                      ${filters.location === region.code
                        ? 'border-netsurit-red bg-gradient-to-br from-netsurit-red/5 to-netsurit-coral/5 scale-105 shadow-md'
                        : 'border-professional-gray-200 bg-white hover:border-netsurit-coral hover:bg-gradient-to-br hover:from-professional-gray-50 hover:to-white hover:scale-105 hover:shadow-md'
                      }
                    `}
                    title={region.label}
                    aria-label={`Filter by ${region.label}`}
                    aria-pressed={filters.location === region.code}
                  >
                    <div className={`transition-all duration-200 ${
                      filters.location === region.code
                        ? 'opacity-100'
                        : 'opacity-70 group-hover:opacity-100'
                    }`}>
                      <FlagIcon countryCode={region.countryCode} className="w-6 h-6" />
                    </div>
                    {filters.location === region.code && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-netsurit-red rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Refresh Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1.5 text-professional-gray-400 hover:text-netsurit-red hover:bg-professional-gray-100 rounded-lg transition-colors"
                title="Refresh connections"
                aria-label="Refresh connections"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        
        {/* Second Row: Category Pills (Left, Scrollable) + Search Input (Right, Inline) */}
        <div className="flex items-center gap-3">
          {/* Category Pills - Scrollable */}
          <div 
            className="flex gap-2 overflow-x-auto scrollbar-hide flex-1 min-w-0"
            role="group"
            aria-label="Category filters"
          >
            {categoryPills.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={`px-3 py-1 text-sm font-medium rounded-lg transition-all duration-200 h-8 whitespace-nowrap flex-shrink-0 ${
                  filters.category === category
                    ? 'bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white shadow-md'
                    : 'bg-professional-gray-100 text-professional-gray-700 hover:bg-professional-gray-200'
                }`}
                aria-pressed={filters.category === category}
                data-testid={`category-${category.toLowerCase()}`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search Input - Inline Right */}
          <div className="flex-shrink-0 w-[280px]" data-testid="search-filter">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-netsurit-orange pointer-events-none" aria-hidden="true" />
              <input
                id="connection-search"
                type="text"
                value={filters.search}
                onChange={handleSearchChange}
                placeholder="Search by name or office..."
                className="w-full pl-9 pr-9 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 text-sm h-8"
                aria-label="Search connections"
              />
              {filters.search && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-professional-gray-400 hover:text-netsurit-red transition-colors"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ConnectionFilters.propTypes = {
  filters: PropTypes.shape({
    category: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    search: PropTypes.string.isRequired
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  locations: PropTypes.arrayOf(PropTypes.string).isRequired,
  onRefresh: PropTypes.func
};

ConnectionFilters.defaultProps = {
  onRefresh: null
};

export default ConnectionFilters;

