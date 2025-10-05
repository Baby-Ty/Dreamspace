// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import PropTypes from 'prop-types';
import { Heart, MapPin, Award, Eye } from 'lucide-react';

/**
 * Pure presentational component for displaying a connection card
 * @param {Object} item - Connection user object with sharedCategories, sampleDreams, etc.
 * @param {Function} onInvite - Callback when connect button clicked (user) => void
 * @param {Function} onPreview - Optional callback for preview button (user) => void
 * @param {Object} rovingProps - Props from useRovingFocus for keyboard navigation
 */
function ConnectionCard({ item, onInvite, onPreview, rovingProps = {} }) {
  if (!item) return null;

  const handleKeyDown = (e) => {
    // Allow Enter or Space to activate the connect button
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onInvite(item);
    }
  };

  return (
    <div 
      {...rovingProps}
      className="group bg-white rounded-2xl border border-professional-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-[1.02] hover:border-netsurit-red/30 focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2"
      role="gridcell"
      aria-label={`Connection suggestion: ${item.name}`}
      data-testid={`connection-card-${item.id}`}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="relative bg-gradient-to-br from-netsurit-red/5 via-netsurit-coral/5 to-netsurit-orange/5 p-4 border-b border-professional-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={item.avatar}
                alt={`${item.name}'s profile`}
                className="w-14 h-14 rounded-full ring-2 ring-white shadow-lg object-cover"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=6366f1&color=fff&size=56`;
                }}
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-netsurit-coral border-2 border-white rounded-full"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base text-professional-gray-900 truncate">
                {item.name}
              </h3>
              <div className="flex items-center text-sm text-professional-gray-600 mt-0.5">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{item.office}</span>
              </div>
              {item.score !== undefined && (
                <div className="flex items-center text-xs text-netsurit-coral mt-1">
                  <Award className="w-3 h-3 mr-1" aria-hidden="true" />
                  <span className="font-medium">{item.score} pts</span>
                </div>
              )}
            </div>
          </div>

          {onPreview && (
            <button
              onClick={() => onPreview(item)}
              className="p-1.5 text-professional-gray-400 hover:text-netsurit-red hover:bg-white rounded-lg transition-colors"
              title="Preview profile"
              aria-label={`Preview ${item.name}'s profile`}
            >
              <Eye className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Shared Categories */}
        {item.sharedCategories && item.sharedCategories.length > 0 && (
          <div className="mt-3" data-testid={`shared-categories-${item.id}`}>
            <p className="text-xs font-semibold text-professional-gray-700 mb-1.5">
              Shared interests:
            </p>
            <div className="flex flex-wrap gap-1">
              {item.sharedCategories.slice(0, 3).map((category) => (
                <span
                  key={category}
                  className="px-2 py-1 bg-white text-netsurit-red text-xs font-medium rounded-full border border-netsurit-red/20 shadow-sm"
                >
                  {category}
                </span>
              ))}
              {item.sharedCategories.length > 3 && (
                <span className="px-2 py-1 bg-professional-gray-100 text-professional-gray-600 text-xs font-medium rounded-full">
                  +{item.sharedCategories.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sample Dreams */}
      {item.sampleDreams && item.sampleDreams.length > 0 && (
        <div className="p-3" data-testid={`sample-dreams-${item.id}`}>
          <p className="text-xs font-semibold text-professional-gray-700 mb-2">
            Recent dreams:
          </p>
          <div className="space-y-2">
            {item.sampleDreams.slice(0, 2).map((dream, idx) => (
              <div 
                key={idx}
                className="flex items-center space-x-2 p-2 bg-professional-gray-50 rounded-lg border border-professional-gray-100 hover:border-netsurit-red/20 transition-colors"
              >
                <img
                  src={dream.image}
                  alt={dream.title}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=600&q=60&auto=format&fit=crop';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-professional-gray-900 truncate">
                    {dream.title}
                  </p>
                  <p className="text-xs text-professional-gray-500 truncate">
                    {dream.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer with Connect Button */}
      <div className="p-3 pt-2 border-t border-professional-gray-100 bg-gradient-to-br from-white to-professional-gray-50">
        <button
          onClick={() => onInvite(item)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onInvite(item);
            }
          }}
          className="w-full bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2.5 rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center font-semibold text-sm group-hover:scale-[1.02]"
          aria-label={`Send connect request to ${item.name}`}
          data-testid={`connect-button-${item.id}`}
        >
          <Heart className="w-4 h-4 mr-2" aria-hidden="true" />
          <span>Connect</span>
        </button>
      </div>
    </div>
  );
}

ConnectionCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    office: PropTypes.string,
    score: PropTypes.number,
    sharedCategories: PropTypes.arrayOf(PropTypes.string),
    sampleDreams: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        category: PropTypes.string,
        image: PropTypes.string
      })
    )
  }).isRequired,
  onInvite: PropTypes.func.isRequired,
  onPreview: PropTypes.func,
  rovingProps: PropTypes.object
};

ConnectionCard.defaultProps = {
  onPreview: null
};

export default ConnectionCard;

