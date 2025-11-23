// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import PropTypes from 'prop-types';
import { Filter, Search, X } from 'lucide-react';
import FlagIcon from '../../components/FlagIcon';

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

          {/* Right: Region Flags */}
          <div className="flex items-center gap-2" data-testid="location-filter">
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
                    border-2
                    ${filters.location === region.code
                      ? 'border-netsurit-red bg-white shadow-sm'
                      : 'border-professional-gray-200 bg-white hover:border-professional-gray-300 hover:bg-professional-gray-50'
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
                </button>
              ))}
            </div>
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
                    ? 'bg-netsurit-red text-white shadow-md'
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

