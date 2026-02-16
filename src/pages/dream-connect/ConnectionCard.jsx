import PropTypes from 'prop-types';
import { Heart, MapPin, Award, BookOpen, RotateCw } from 'lucide-react';
import { useMemo, useState } from 'react';

/**
 * Connection Card Component with Flip Design
 * Displays a connection suggestion in a flip card layout with background image support
 * Front: Avatar + Name + Location
 * Back: Stats + Public Dreams + Quick Connect Button
 * @param {Object} item - Connection user object with dreamBook, dreamsCount, connectsCount, etc.
 * @param {Function} onInvite - Callback when connect button clicked (user) => void
 * @param {Function} onPreview - Optional callback for preview button (user) => void
 * @param {Object} rovingProps - Props from useRovingFocus for keyboard navigation
 */
function ConnectionCard({ item, onInvite, onPreview, rovingProps = {} }) {
  const [isFlipped, setIsFlipped] = useState(false);

  if (!item) return null;

  // Filter public dreams from item's dreamBook (exclude system dreams)
  const publicDreams = useMemo(() => {
    if (!item.dreamBook || !Array.isArray(item.dreamBook)) return [];
    return item.dreamBook.filter(dream => dream.isPublic === true && !dream.isSystem);
  }, [item.dreamBook]);

  const handleFlip = (e) => {
    // Don't flip if clicking buttons or if selecting text
    if (e.target.closest('button') || window.getSelection().toString()) {
      return;
    }
    setIsFlipped(!isFlipped);
  };

  const handleKeyDown = (e) => {
    // Allow Enter or Space to activate the connect button
    if (e.key === 'Enter' || e.key === ' ') {
      // If button is focused, trigger connect
      if (e.target.closest('button[data-testid*="connect-button"]')) {
        e.preventDefault();
        onInvite(item);
        return;
      }
      // Otherwise, flip the card
      e.preventDefault();
      setIsFlipped(!isFlipped);
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
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'User')}&background=EC4B5C&color=fff&size=128`;
    }
    const trimmed = avatar.trim();
    // Blob URLs are temporary and cause security errors - use fallback instead
    if (trimmed.startsWith('blob:')) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'User')}&background=EC4B5C&color=fff&size=128`;
    }
    // Only use http/https URLs
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    // Fallback for invalid URLs
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'User')}&background=EC4B5C&color=fff&size=128`;
  };

  const hasBackground = !!item.cardBackgroundImage;

  return (
    <div 
      {...rovingProps}
      className="group relative h-[420px] w-full perspective-1000 cursor-pointer"
      role="gridcell"
      aria-label={`Connection suggestion: ${item.name}`}
      data-testid={`connection-card-${item.id}`}
      onClick={handleFlip}
      onKeyDown={handleKeyDown}
    >
      {/* Inner Container for Flip Animation */}
      <div 
        className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        {/* FRONT FACE */}
        <div 
          className={`absolute w-full h-full backface-hidden rounded-2xl border shadow-lg overflow-hidden flex flex-col ${
            hasBackground ? 'border-white/30' : 'bg-white border-professional-gray-200'
          }`}
          style={{
            backgroundImage: hasBackground ? `url(${item.cardBackgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Background overlay */}
          {hasBackground && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent via-40% to-black/90 pointer-events-none z-0" />
          )}

          {/* Front Content */}
          <div className="relative z-10 flex flex-col items-center justify-between h-full p-6">
            {/* Profile Picture - Large & Centered */}
            <div className="flex flex-col items-center justify-center flex-1">
              <div className={`relative rounded-full p-1 ${getAccentColorClass().replace('ring-', 'bg-')}`}>
                <img
                  src={getAvatarUrl(item.avatar)}
                  alt={`${item.name}'s profile`}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-2xl object-cover"
                  onError={(e) => {
                    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'User')}&background=EC4B5C&color=fff&size=128`;
                    if (e.target.src !== fallbackUrl) {
                      e.target.src = fallbackUrl;
                    }
                  }}
                  data-testid={`connection-${item.id}-avatar`}
                />
              </div>
            </div>

            {/* Bottom Info */}
            <div className="w-full text-center mt-auto pb-2">
              <h3 className={`text-2xl font-bold mb-1 ${hasBackground ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' : 'text-professional-gray-900'}`}>
                {item.name}
              </h3>
              
              {item.office && (
                <div className={`flex items-center justify-center text-sm mb-2 ${hasBackground ? 'text-white/95 drop-shadow-md font-medium' : 'text-professional-gray-500'}`}>
                  <MapPin className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                  <span>{item.office}</span>
                </div>
              )}

              <div className={`text-[10px] font-medium uppercase tracking-widest flex items-center justify-center gap-1.5 opacity-80 ${hasBackground ? 'text-white' : 'text-professional-gray-400'}`}>
                <RotateCw className="w-3 h-3" /> Click to view details
              </div>
            </div>
          </div>
        </div>

        {/* BACK FACE */}
        <div 
          className="absolute w-full h-full backface-hidden rotate-y-180 rounded-2xl bg-white border border-professional-gray-200 shadow-xl overflow-hidden flex flex-col z-20"
        >
          {/* Header */}
          <div className="p-4 border-b border-professional-gray-100 flex justify-between items-center bg-professional-gray-50/50">
            <div className="flex items-center gap-2">
              <img
                src={getAvatarUrl(item.avatar)}
                alt={`${item.name}'s profile`}
                className="w-10 h-10 rounded-full border-2 border-professional-gray-200 object-cover"
                onError={(e) => {
                  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'User')}&background=EC4B5C&color=fff&size=80`;
                  if (e.target.src !== fallbackUrl) {
                    e.target.src = fallbackUrl;
                  }
                }}
              />
              <div>
                <h3 className="text-sm font-bold text-professional-gray-900">{item.name}</h3>
                {item.office && (
                  <div className="flex items-center text-xs text-professional-gray-500">
                    <MapPin className="w-3 h-3 mr-1" aria-hidden="true" />
                    <span>{item.office}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Pills */}
          <div className="p-4 border-b border-professional-gray-100">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {item.score !== undefined && (
                <div 
                  className="flex items-center gap-1 px-3 py-1.5 bg-professional-gray-100 text-professional-gray-700 rounded-lg border border-professional-gray-200"
                  data-testid={`connection-${item.id}-points-badge`}
                >
                  <Award className="w-4 h-4 text-professional-gray-600" aria-hidden="true" />
                  <span className="text-sm font-medium">{item.score} pts</span>
                </div>
              )}
              <div 
                className="flex items-center gap-1 px-3 py-1.5 bg-professional-gray-100 text-professional-gray-700 rounded-lg border border-professional-gray-200"
                data-testid={`connection-${item.id}-dreams-pill`}
              >
                <BookOpen className="w-4 h-4 text-professional-gray-600" aria-hidden="true" />
                <span className="text-sm font-medium">{item.dreamsCount || 0} dreams</span>
              </div>
              <div 
                className="flex items-center gap-1 px-3 py-1.5 bg-professional-gray-100 text-professional-gray-700 rounded-lg border border-professional-gray-200"
                data-testid={`connection-${item.id}-connects-pill`}
              >
                <Heart className="w-4 h-4 text-professional-gray-600" aria-hidden="true" />
                <span className="text-sm font-medium">{item.connectsCount || 0} connects</span>
              </div>
            </div>
          </div>

          {/* Public Dreams List */}
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar" data-testid={`connection-${item.id}-public-dreams`}>
            <h4 className="text-xs font-semibold text-professional-gray-700 uppercase tracking-wide mb-3">
              Public Dreams
            </h4>
            {publicDreams.length > 0 ? (
              <ul className="space-y-2" role="list">
                {publicDreams.slice(0, 5).map((dream, idx) => (
                  <li 
                    key={dream.id || idx} 
                    className="flex items-start text-sm text-professional-gray-700"
                    data-testid={`connection-${item.id}-dream-${idx}`}
                  >
                    <span className="text-netsurit-coral mr-2 flex-shrink-0 mt-0.5">•</span>
                    <span className="line-clamp-2">{dream.title}</span>
                  </li>
                ))}
                {publicDreams.length > 5 && (
                  <li 
                    className="text-xs text-professional-gray-500 italic pl-4"
                    data-testid={`connection-${item.id}-more-dreams`}
                  >
                    (+ {publicDreams.length - 5} more dream{publicDreams.length - 5 !== 1 ? 's' : ''})
                  </li>
                )}
              </ul>
            ) : (
              <p 
                className="text-sm text-professional-gray-500 italic"
                data-testid={`connection-${item.id}-no-dreams`}
              >
                No public dreams
              </p>
            )}
          </div>

          {/* Quick Connect Button */}
          <div className="p-4 border-t border-professional-gray-100 bg-professional-gray-50/50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onInvite(item);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onInvite(item);
                }
              }}
              className="w-full px-4 py-2.5 bg-netsurit-red text-white rounded-lg hover:bg-netsurit-coral transition-all duration-300 shadow-sm hover:shadow-md font-medium text-sm flex items-center justify-center gap-2"
              aria-label={`Send connect request to ${item.name}`}
              data-testid={`connect-button-${item.id}`}
            >
              <Heart className="w-4 h-4" aria-hidden="true" />
              Quick Connect
            </button>
          </div>
        </div>
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
    cardBackgroundImage: PropTypes.string,
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