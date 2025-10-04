// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import PropTypes from 'prop-types';
import { Filter, MapPin, RefreshCw, Search, X } from 'lucide-react';

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

  return (
    <div className="space-y-4" data-testid="connection-filters">
      {/* Category Pills */}
      <div className="bg-white rounded-xl p-4 border border-professional-gray-200" data-testid="category-filter">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-netsurit-red" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-professional-gray-900">
              Filter by Interest
            </h3>
          </div>
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
        
        <div 
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Category filters"
        >
          {categoryPills.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
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
      </div>

      {/* Location & Search Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Location Filter */}
        <div className="bg-white rounded-xl p-4 border border-professional-gray-200" data-testid="location-filter">
          <label 
            htmlFor="location-filter"
            className="flex items-center space-x-2 mb-2"
          >
            <MapPin className="w-4 h-4 text-netsurit-coral" aria-hidden="true" />
            <span className="text-sm font-semibold text-professional-gray-900">
              Location
            </span>
          </label>
          <select
            id="location-filter"
            value={filters.location}
            onChange={handleLocationChange}
            className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 text-sm"
            aria-label="Filter by location"
          >
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl p-4 border border-professional-gray-200" data-testid="search-filter">
          <label 
            htmlFor="connection-search"
            className="flex items-center space-x-2 mb-2"
          >
            <Search className="w-4 h-4 text-netsurit-orange" aria-hidden="true" />
            <span className="text-sm font-semibold text-professional-gray-900">
              Search
            </span>
          </label>
          <div className="relative">
            <input
              id="connection-search"
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search by name, office, or interests..."
              className="w-full px-3 py-2 pr-8 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 text-sm"
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

