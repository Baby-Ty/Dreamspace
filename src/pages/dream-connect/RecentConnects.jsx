import PropTypes from 'prop-types';
import { Heart, Loader2 } from 'lucide-react';
import { parseIsoWeek, getIsoWeek } from '../../utils/dateUtils';
import ConnectStatusBadge from './ConnectStatusBadge';

/**
 * Helper to get first name from full name
 */
const getFirstName = (fullName) => {
  if (!fullName) return '';
  return fullName.split(' ')[0];
};

/**
 * Helper to format ISO week string as "Nov 17"
 */
const formatIsoWeekString = (isoWeekString) => {
  if (!isoWeekString) return null;
  try {
    const { year, week: weekNum } = parseIsoWeek(isoWeekString);
    const jan4 = new Date(year, 0, 4);
    const jan4Day = jan4.getDay() || 7;
    const monday = new Date(year, 0, 4 + (1 - jan4Day) + (weekNum - 1) * 7);
    return monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return null;
  }
};

/**
 * Helper to format date as week date
 */
const formatWeekOfDate = (dateString) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    const isoWeek = getIsoWeek(date);
    return formatIsoWeekString(isoWeek);
  } catch (e) {
    return null;
  }
};

/**
 * Helper to get valid avatar URL
 */
const getAvatarUrl = (avatar, name, defaultColor = 'EC4B5C') => {
  const avatarUrl = avatar || null;
  
  if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim()) {
    const trimmed = avatarUrl.trim();
    // Blob URLs are temporary - use fallback
    if (trimmed.startsWith('blob:')) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=${defaultColor}&color=fff&size=64`;
    }
    // Only accept http/https URLs
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=${defaultColor}&color=fff&size=64`;
};

/**
 * Single connect card component
 */
function ConnectCard({ connect, currentUser, onClick }) {
  const currentUserId = currentUser?.email || currentUser?.id || '';
  const connectUserId = connect.userId || '';
  const isSender = connectUserId === currentUserId || 
                  connectUserId === currentUser?.email || 
                  connectUserId === currentUser?.id ||
                  (currentUser?.email && connectUserId.includes(currentUser.email)) ||
                  (currentUser?.id && connectUserId.includes(currentUser.id));
  
  const currentUserFirstName = getFirstName(currentUser?.name || '');
  const otherUserName = connect.withWhom || connect.name || '';
  const otherUserFirstName = getFirstName(otherUserName);
  
  const connectAvatar = connect.avatar || connect.picture || null;
  const currentUserAvatar = getAvatarUrl(currentUser?.avatar, currentUser?.name || 'User', 'EC4B5C');
  const otherUserAvatar = getAvatarUrl(connectAvatar, otherUserName || 'User', '6366f1');
  
  const displayName = isSender
    ? `${currentUserFirstName} x ${otherUserFirstName}`
    : `${otherUserFirstName} x ${currentUserFirstName}`;
  
  const displayDate = connect.proposedWeeks && connect.proposedWeeks.length > 0
    ? formatIsoWeekString(connect.proposedWeeks[0])
    : formatWeekOfDate(connect.when || connect.date || connect.createdAt);

  const handleImageError = (e, name, color) => {
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=${color}&color=fff&size=64`;
    if (e.target.src !== fallbackUrl) {
      e.target.src = fallbackUrl;
    }
  };

  return (
    <div
      className="bg-white rounded-xl p-4 border border-professional-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col min-h-[240px]"
      onClick={onClick}
      data-testid={`connect-card-${connect.id}`}
    >
      {/* Two profile pictures side by side */}
      <div className="flex items-center justify-center gap-2 mb-3 min-h-[56px]">
        <img
          src={isSender ? currentUserAvatar : otherUserAvatar}
          alt={isSender ? currentUser?.name : otherUserName}
          className="w-14 h-14 rounded-full ring-2 ring-professional-gray-200 object-cover flex-shrink-0 bg-professional-gray-100"
          loading="lazy"
          onError={(e) => handleImageError(e, isSender ? currentUser?.name : otherUserName, 'EC4B5C')}
        />
        <img
          src={isSender ? otherUserAvatar : currentUserAvatar}
          alt={isSender ? otherUserName : currentUser?.name}
          className="w-14 h-14 rounded-full ring-2 ring-professional-gray-200 object-cover flex-shrink-0 bg-professional-gray-100"
          loading="lazy"
          onError={(e) => handleImageError(e, isSender ? otherUserName : currentUser?.name, '6366f1')}
        />
      </div>
      
      {/* FirstName x FirstName */}
      <h4 className="font-semibold text-professional-gray-900 text-center mb-2 min-h-[24px]">
        {displayName}
      </h4>
      
      {/* Date display */}
      {displayDate && (
        <div className="mb-3 text-center">
          <span className="text-xs text-professional-gray-600 font-medium">
            Week of {displayDate}
          </span>
        </div>
      )}
      
      {/* Additional proposed weeks */}
      {connect.proposedWeeks && connect.proposedWeeks.length > 1 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1 justify-center">
            {connect.proposedWeeks.slice(1, 3).map((week, idx) => {
              const weekDate = formatIsoWeekString(week);
              if (!weekDate) return null;
              return (
                <span
                  key={idx}
                  className="text-xs px-2 py-1 bg-professional-gray-100 text-professional-gray-700 rounded-md font-medium"
                >
                  Week of {weekDate}
                </span>
              );
            })}
            {connect.proposedWeeks.length > 3 && (
              <span className="text-xs px-2 py-1 bg-professional-gray-100 text-professional-gray-700 rounded-md font-medium">
                +{connect.proposedWeeks.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Bottom row: Category | Status */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-professional-gray-100">
        {connect.category && (
          <span className="text-xs text-professional-gray-600 font-medium truncate flex-1 mr-2">
            {connect.category}
          </span>
        )}
        <div className="flex-shrink-0">
          <ConnectStatusBadge status={connect.status || 'pending'} />
        </div>
      </div>
    </div>
  );
}

ConnectCard.propTypes = {
  connect: PropTypes.object.isRequired,
  currentUser: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired
};

/**
 * Recent connects section
 */
export default function RecentConnects({ 
  connects, 
  currentUser, 
  isUserFullyLoaded,
  onSelectConnect 
}) {
  return (
    <div className="mb-8 mt-6">
      <div className="mb-3">
        <h2 className="text-xl font-bold text-professional-gray-900">
          Your Recent Connects
        </h2>
        <p className="text-sm text-professional-gray-600 mt-1">
          Start building your dream network
        </p>
      </div>

      {/* Loading State */}
      {!isUserFullyLoaded ? (
        <div className="bg-gradient-to-br from-white to-professional-gray-50 rounded-2xl border border-professional-gray-200 shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-professional-gray-100 to-professional-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-professional-gray-400 animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-professional-gray-900 mb-3">
            Loading connects...
          </h3>
          <p className="text-professional-gray-600">
            Please wait while we load your connection data.
          </p>
        </div>
      ) : !connects || connects.length === 0 ? (
        /* Empty State */
        <div className="bg-gradient-to-br from-white to-professional-gray-50 rounded-2xl border border-professional-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-netsurit-red/10 to-netsurit-coral/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-netsurit-red" />
          </div>
          <h3 className="text-xl font-bold text-professional-gray-900 mb-3">
            No connects yet
          </h3>
          <p className="text-professional-gray-600 max-w-md mx-auto leading-relaxed">
            Start connecting with colleagues to share your dream journeys and build meaningful relationships!
          </p>
        </div>
      ) : (
        /* Connects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {connects
            .sort((a, b) => {
              const statusPriority = { pending: 0, completed: 1 };
              const aStatus = statusPriority[a.status] ?? 1;
              const bStatus = statusPriority[b.status] ?? 1;
              if (aStatus !== bStatus) return aStatus - bStatus;
              const aDate = new Date(a.when || a.date || a.createdAt);
              const bDate = new Date(b.when || b.date || b.createdAt);
              return bDate - aDate;
            })
            .slice(0, 12)
            .map((connect, index) => {
              const avatarHash = connect.avatar ? connect.avatar.substring(0, 50) : 'no-avatar';
              const userHash = currentUser?.email || currentUser?.id || 'no-user';
              return (
                <ConnectCard
                  key={`connect-${connect.id}-${avatarHash}-${userHash}-${connect.updatedAt || connect.createdAt || index}`}
                  connect={connect}
                  currentUser={currentUser}
                  onClick={() => onSelectConnect(connect)}
                />
              );
            })}
        </div>
      )}
    </div>
  );
}

RecentConnects.propTypes = {
  connects: PropTypes.array,
  currentUser: PropTypes.object.isRequired,
  isUserFullyLoaded: PropTypes.bool.isRequired,
  onSelectConnect: PropTypes.func.isRequired
};

RecentConnects.defaultProps = {
  connects: []
};