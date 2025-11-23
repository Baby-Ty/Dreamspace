// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import PropTypes from 'prop-types';
import { Heart, MapPin, Award, BookOpen } from 'lucide-react';
import { useMemo } from 'react';

/**
 * Pure presentational component for displaying a connection card
 * Aligned with Team Member card design - centered vertical layout
 * @param {Object} item - Connection user object with dreamBook, dreamsCount, connectsCount, etc.
 * @param {Function} onInvite - Callback when connect button clicked (user) => void
 * @param {Function} onPreview - Optional callback for preview button (user) => void
 * @param {Object} rovingProps - Props from useRovingFocus for keyboard navigation
 */
function ConnectionCard({ item, onInvite, onPreview, rovingProps = {} }) {
  if (!item) return null;

  // Filter public dreams from item's dreamBook
  const publicDreams = useMemo(() => {
    if (!item.dreamBook || !Array.isArray(item.dreamBook)) return [];
    return item.dreamBook.filter(dream => dream.isPublic === true);
  }, [item.dreamBook]);

  const handleKeyDown = (e) => {
    // Allow Enter or Space to activate the connect button
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onInvite(item);
    }
  };

  // Get accent color class based on item's accentColor
  const getAccentColorClass = () => {
    const color = item.accentColor || 'netsurit-red';
    const colorMap = {
      'netsurit-red': 'ring-netsurit-red',
      'netsurit-coral': 'ring-netsurit-coral',
      'netsurit-orange': 'ring-netsurit-orange'
    };
    return colorMap[color] || 'ring-netsurit-red';
  };

  // Helper to get valid avatar URL - blob URLs don't work across page loads, so use fallback
  const getAvatarUrl = (avatar) => {
    if (!avatar || typeof avatar !== 'string') {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'User')}&background=EC4B5C&color=fff&size=80`;
    }
    const trimmed = avatar.trim();
    // Blob URLs are temporary and cause security errors - use fallback instead
    if (trimmed.startsWith('blob:')) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'User')}&background=EC4B5C&color=fff&size=80`;
    }
    // Only use http/https URLs
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    // Fallback for invalid URLs
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'User')}&background=EC4B5C&color=fff&size=80`;
  };

  return (
    <div 
      {...rovingProps}
      className="group bg-white rounded-2xl border border-professional-gray-200 shadow-lg hover:shadow-2xl hover:border-netsurit-red/20 hover:-translate-y-1 transition-all duration-500 ease-out overflow-hidden flex flex-col relative"
      role="gridcell"
      aria-label={`Connection suggestion: ${item.name}`}
      data-testid={`connection-card-${item.id}`}
      onKeyDown={handleKeyDown}
    >
      {/* Main Content - Centered */}
      <div className="p-4 flex flex-col items-center flex-1">
        {/* Profile Picture - Centered */}
        <div className="relative mb-3">
          <img
            src={getAvatarUrl(item.avatar)}
            alt={`${item.name}'s profile`}
            className={`w-20 h-20 rounded-full ring-2 ${getAccentColorClass()} shadow-lg object-cover bg-professional-gray-100`}
            loading="lazy"
            onError={(e) => {
              const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'User')}&background=EC4B5C&color=fff&size=80`;
              // Only update if not already using fallback to prevent infinite loop
              if (e.target.src !== fallbackUrl) {
                e.target.src = fallbackUrl;
              }
            }}
            data-testid={`connection-${item.id}-avatar`}
          />
        </div>

        {/* Name & Location - Centered */}
        <h3 className="text-lg font-bold text-professional-gray-900 text-center mb-1" data-testid={`connection-${item.id}-name`}>
          {item.name}
        </h3>
        {item.office && (
          <div className="flex items-center text-xs text-professional-gray-600 mb-3" data-testid={`connection-${item.id}-location`}>
            <MapPin className="w-2.5 h-2.5 mr-1 flex-shrink-0" aria-hidden="true" />
            <span>{item.office}</span>
          </div>
        )}

        {/* Stats Pills - Horizontal Row */}
        <div className="flex items-center justify-center gap-1.5 mb-3 w-full">
          {item.score !== undefined && (
            <div 
              className="flex items-center gap-1 px-2 py-1 bg-professional-gray-100 text-professional-gray-700 rounded-full border border-professional-gray-200"
              data-testid={`connection-${item.id}-points-badge`}
            >
              <Award className="w-3 h-3 text-professional-gray-600" aria-hidden="true" />
              <span className="text-xs font-medium">{item.score} pts</span>
            </div>
          )}
          <div 
            className="flex items-center gap-1 px-2 py-1 bg-professional-gray-100 text-professional-gray-700 rounded-full border border-professional-gray-200"
            data-testid={`connection-${item.id}-dreams-pill`}
          >
            <BookOpen className="w-3 h-3 text-professional-gray-600" aria-hidden="true" />
            <span className="text-xs font-medium">{item.dreamsCount || 0} dreams</span>
          </div>
          <div 
            className="flex items-center gap-1 px-2 py-1 bg-professional-gray-100 text-professional-gray-700 rounded-full border border-professional-gray-200"
            data-testid={`connection-${item.id}-connects-pill`}
          >
            <Heart className="w-3 h-3 text-professional-gray-600" aria-hidden="true" />
            <span className="text-xs font-medium">{item.connectsCount || 0} connects</span>
          </div>
        </div>

        {/* Public Dreams List */}
        <div className="w-full mt-3 pt-3 border-t border-professional-gray-200 self-stretch" data-testid={`connection-${item.id}-public-dreams`}>
          <h4 className="text-xs font-semibold text-professional-gray-700 uppercase tracking-wide mb-1.5">
            Public Dreams
          </h4>
          {publicDreams.length > 0 ? (
            <ul className="space-y-1" role="list">
              {publicDreams.slice(0, 3).map((dream, idx) => (
                <li 
                  key={dream.id || idx} 
                  className="flex items-start text-xs text-professional-gray-700"
                  data-testid={`connection-${item.id}-dream-${idx}`}
                >
                  <span className="text-netsurit-coral mr-1.5 flex-shrink-0">•</span>
                  <span className="truncate">{dream.title}</span>
                </li>
              ))}
              {publicDreams.length > 3 && (
                <li 
                  className="text-xs text-professional-gray-500 italic pl-3"
                  data-testid={`connection-${item.id}-more-dreams`}
                >
                  (+ {publicDreams.length - 3} more dream{publicDreams.length - 3 !== 1 ? 's' : ''})
                </li>
              )}
            </ul>
          ) : (
            <p 
              className="text-xs text-professional-gray-500 italic"
              data-testid={`connection-${item.id}-no-dreams`}
            >
              No public dreams
            </p>
          )}
        </div>

        {/* Spacer to push button to bottom */}
        <div className="flex-1"></div>

        {/* Quick Connect Button */}
        <button
          onClick={() => onInvite(item)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onInvite(item);
            }
          }}
          className="w-full mt-3 px-3 py-2 bg-netsurit-red text-white rounded-lg hover:bg-netsurit-red transition-all duration-300 shadow-sm hover:shadow-md font-medium text-xs flex items-center justify-center gap-1.5"
          aria-label={`Send connect request to ${item.name}`}
          data-testid={`connect-button-${item.id}`}
        >
          <Heart className="w-3.5 h-3.5" aria-hidden="true" />
          Quick Connect
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
    dreamsCount: PropTypes.number,
    connectsCount: PropTypes.number,
    accentColor: PropTypes.string,
    dreamBook: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        title: PropTypes.string,
        isPublic: PropTypes.bool
      })
    ),
    // Legacy support for sharedCategories and sampleDreams
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

