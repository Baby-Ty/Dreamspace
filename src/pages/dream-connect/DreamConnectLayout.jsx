// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useState } from 'react';
import { 
  Users, 
  Heart, 
  BookOpen, 
  Network, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  X,
  MapPin,
  Calendar,
  Send
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConnectionFilters from './ConnectionFilters';
import ConnectionCard from './ConnectionCard';
import TimeSlotSelector from './TimeSlotSelector';
import ConnectStatusBadge from './ConnectStatusBadge';
import ConnectDetailModal from './ConnectDetailModal';
import { parseIsoWeek, getIsoWeek, getWeekRange } from '../../utils/dateUtils';
import { useDreamConnections } from '../../hooks/useDreamConnections';
import { useApp } from '../../context/AppContext';
import { useRovingFocus } from '../../hooks/useRovingFocus';
import HelpTooltip from '../../components/HelpTooltip';

/**
 * Main layout for Dream Connect page
 * Handles orchestration, modals, and state management
 */
export default function DreamConnectLayout() {
  const { currentUser, addConnect, updateConnect, reloadConnects } = useApp();
  const {
    connections,
    filteredCount,
    totalCount,
    locations,
    isLoading,
    error,
    categoryFilter,
    setCategoryFilter,
    locationFilter,
    setLocationFilter,
    searchTerm,
    setSearchTerm,
    currentPage,
    totalPages,
    goToNextPage,
    goToPrevPage,
    goToPage,
    hasNextPage,
    hasPrevPage,
    refreshData,
    mapCategory
  } = useDreamConnections();

  // Modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedConnect, setSelectedConnect] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [agenda, setAgenda] = useState('');
  const [proposedWeeks, setProposedWeeks] = useState([]);

  // Roving tabindex for keyboard navigation in grid (3 columns on large screens)
  const { getItemProps, onKeyDown: handleRovingKeyDown } = useRovingFocus(connections.length, {
    loop: true,
    direction: 'both',
    columnsCount: 3 // Matches lg:grid-cols-3
  });
  const [schedulingOption, setSchedulingOption] = useState('teams');

  // Filter change handler
  const handleFilterChange = (key, value) => {
    if (key === 'category') setCategoryFilter(value);
    if (key === 'location') setLocationFilter(value);
    if (key === 'search') setSearchTerm(value);
  };

  // Connect request handler
  const handleConnectRequest = (user) => {
    setSelectedUser(user);
    const chosenCategory = categoryFilter !== 'All' 
      ? mapCategory(categoryFilter) 
      : (user.sharedCategories?.[0] || 'our shared interests');
    setRequestMessage(`Hey ${user.name.split(' ')[0]}, I'd love to connect about ${chosenCategory}.`);
    setShowRequestModal(true);
  };

  // Send request handler
  const handleSendRequest = async () => {
    if (!selectedUser || !requestMessage.trim() || !agenda.trim()) {
      alert('Please fill in the agenda/topics field');
      return;
    }

    if (proposedWeeks.length === 0) {
      alert('Please select at least one available week');
      return;
    }

    try {
      // Create connect entry (matches enhanced schema)
      const connectData = {
        id: `connect_${Date.now()}`,
        userId: currentUser?.id,
        type: 'connect',
        withWhom: selectedUser.name,
        withWhomId: selectedUser.id || selectedUser.email || selectedUser.userId, // Store user ID/email for avatar lookup
        when: new Date().toISOString().split('T')[0], // ISO date (YYYY-MM-DD) - placeholder until scheduled
        notes: requestMessage,
        status: 'pending',
        agenda: agenda.trim(),
        proposedWeeks: proposedWeeks,
        schedulingMethod: schedulingOption,
        dreamId: undefined, // Optional - can be linked to a specific dream
        // Additional metadata for display (not part of core schema but preserved as passthrough)
        name: selectedUser.name,
        category: categoryFilter !== 'All' 
          ? mapCategory(categoryFilter) 
          : (selectedUser.sharedCategories?.[0] || 'Shared interests'),
        avatar: selectedUser.avatar, // Store current avatar, but will be enriched from users container on load
        office: selectedUser.office,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add connect via AppContext (will save to connects container + add scoring)
      await addConnect(connectData);

      // Close modal
      handleCloseModal();
      
      // Show success message
      alert(`Dream Connect request sent to ${selectedUser?.name}! 🎉`);
      
    } catch (err) {
      console.error('❌ Error sending connect request:', err);
      alert(`Failed to send connect request to ${selectedUser?.name}. Please try again.`);
    }
  };

  const handleCloseModal = () => {
    setShowRequestModal(false);
    setSelectedUser(null);
    setRequestMessage('');
    setAgenda('');
    setProposedWeeks([]);
    setSchedulingOption('teams');
  };

  // Early return for loading
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="text-center py-20">
          <Loader2 className="h-12 w-12 text-netsurit-red animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-professional-gray-900 mb-2">
            Loading Dream Connections
          </h2>
          <p className="text-professional-gray-600">
            Finding people you can connect with...
          </p>
        </div>
      </div>
    );
  }

  // Early return for error
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="text-center py-20">
          <AlertCircle className="h-12 w-12 text-netsurit-red mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-professional-gray-900 mb-2">
            Failed to Load Connections
          </h2>
          <p className="text-professional-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="bg-netsurit-red text-white px-4 py-2 rounded-xl hover:bg-netsurit-red focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  // Early return for no user
  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="text-center py-20">
          <AlertCircle className="h-12 w-12 text-professional-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-professional-gray-900 mb-2">
            No User Data
          </h2>
          <p className="text-professional-gray-600">
            Please log in to view Dream Connect.
          </p>
        </div>
      </div>
    );
  }

  // Wait for currentUser to be fully loaded (have email/id) before rendering connects
  // This prevents showing stale/cached data with wrong name ordering
  const isUserFullyLoaded = !!(currentUser?.email || currentUser?.id);

  const uniqueCategories = currentUser.dreamBook 
    ? new Set(currentUser.dreamBook.map(d => d.category)).size 
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-3 sm:space-y-4">
      {/* Header with KPIs */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          {/* Title Section */}
          <div className="mb-6 lg:mb-0">
            <div className="flex items-center space-x-3 mb-2">
              <Network className="h-8 w-8 text-netsurit-red" />
              <h1 className="text-3xl font-bold text-professional-gray-900">
                Dream Connect
              </h1>
              <HelpTooltip 
                title="Dream Connect Guide"
                content="Connect with colleagues who share similar dream categories. Browse suggested connections, filter by category or location, and request a Dream Connect meeting. Complete connects earn you +5 points on your scorecard!"
              />
            </div>
            <p className="text-professional-gray-600">
              Find colleagues with shared dream categories and learn from each other
            </p>
          </div>
          
          {/* KPI Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-netsurit-red" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">
                Suggested
              </p>
              <p className="text-xl font-bold text-professional-gray-900">{filteredCount}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <Heart className="h-6 w-6 text-netsurit-coral" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">
                Your Connects
              </p>
              <p className="text-xl font-bold text-professional-gray-900">
                {currentUser.connects?.length || 0}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="h-6 w-6 text-netsurit-orange" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">
                Categories
              </p>
              <p className="text-xl font-bold text-professional-gray-900">{uniqueCategories}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <ConnectionFilters
        filters={{
          category: categoryFilter,
          location: locationFilter,
          search: searchTerm
        }}
        onChange={handleFilterChange}
        locations={locations}
        onRefresh={refreshData}
      />

      {/* Suggested Connections */}
      <div className="mb-8 mt-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-professional-gray-900">
            Suggested Connections
          </h2>
          <p className="text-xs text-professional-gray-500">
            {filteredCount} match{filteredCount !== 1 ? 'es' : ''}
            {totalPages > 1 && (
              <span> · Page {currentPage} of {totalPages}</span>
            )}
          </p>
        </div>
        
        {/* Connection Cards or Empty State */}
        {connections.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-professional-gray-50 rounded-2xl border border-professional-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-professional-gray-100 to-professional-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-professional-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-professional-gray-900 mb-3">
              {categoryFilter === 'All' ? 'No colleagues found' : `No colleagues with "${categoryFilter}" dreams`}
            </h3>
            <p className="text-professional-gray-600 max-w-md mx-auto leading-relaxed">
              {categoryFilter === 'All' 
                ? 'No other users are available for connections at the moment.'
                : `Try selecting "All" to see all colleagues, or choose a different dream category.`
              }
            </p>
            <button 
              onClick={() => {
                if (categoryFilter === 'All') {
                  refreshData();
                } else {
                  setCategoryFilter('All'); 
                  setLocationFilter('All');
                }
              }}
              className="mt-6 px-6 py-3 bg-netsurit-red text-white rounded-xl hover:bg-netsurit-red transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              {categoryFilter === 'All' ? 'Refresh' : 'Show All Colleagues'}
            </button>
          </div>
        ) : (
          <>
            {/* Grid of Connection Cards */}
            <div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              role="grid"
              aria-label="Dream connections"
              onKeyDown={handleRovingKeyDown}
            >
              {connections.map((user, index) => (
                <ConnectionCard
                  key={user.id}
                  item={user}
                  onInvite={handleConnectRequest}
                  rovingProps={getItemProps(index)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={goToPrevPage}
                  disabled={!hasPrevPage}
                  className={`p-2 rounded-lg border transition-all duration-200 ${
                    !hasPrevPage
                      ? 'border-professional-gray-200 text-professional-gray-400 cursor-not-allowed'
                      : 'bg-professional-gray-600 text-white border-transparent hover:bg-professional-gray-700 hover:shadow-md'
                  }`}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`w-10 h-10 rounded-lg border font-medium text-sm transition-all duration-200 ${
                        currentPage === pageNum
                          ? 'bg-netsurit-red text-white border-netsurit-red shadow-md'
                          : 'bg-professional-gray-600 text-white border-transparent hover:bg-professional-gray-700 hover:shadow-md'
                      }`}
                      aria-label={`Go to page ${pageNum}`}
                      aria-current={currentPage === pageNum ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={!hasNextPage}
                  className={`p-2 rounded-lg border transition-all duration-200 ${
                    !hasNextPage
                      ? 'border-professional-gray-200 text-professional-gray-400 cursor-not-allowed'
                      : 'bg-professional-gray-600 text-white border-transparent hover:bg-professional-gray-700 hover:shadow-md'
                  }`}
                  aria-label="Next page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Recent Connections */}
      <div className="mb-8 mt-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-professional-gray-900">
              Your Recent Connects
            </h2>
            <p className="text-sm text-professional-gray-600 mt-1">
              Start building your dream network
            </p>
          </div>
          <button
            onClick={reloadConnects}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-professional-gray-600 hover:text-professional-gray-900 bg-white border border-professional-gray-200 rounded-lg hover:bg-professional-gray-50 transition-all duration-200"
            aria-label="Refresh connects"
            data-testid="reload-connects-button"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Recent Connects List or Empty State */}
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
        ) : !currentUser.connects || currentUser.connects.length === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentUser.connects
              .sort((a, b) => {
                // Sort by status priority (pending first), then by date
                const statusPriority = { pending: 0, completed: 1 };
                const aStatus = statusPriority[a.status] ?? 1;
                const bStatus = statusPriority[b.status] ?? 1;
                if (aStatus !== bStatus) return aStatus - bStatus;
                // Then by date (newest first)
                const aDate = new Date(a.when || a.date || a.createdAt);
                const bDate = new Date(b.when || b.date || b.createdAt);
                return bDate - aDate;
              })
              .slice(0, 12) // Show up to 12 recent connects (3 rows of 4)
              .map((connect, index) => {
                // Create a stable key that includes avatar URL and currentUser to force re-render when data changes
                const avatarHash = connect.avatar ? connect.avatar.substring(0, 50) : 'no-avatar';
                const userHash = currentUser?.email || currentUser?.id || 'no-user';
                return (
                <div
                  key={`connect-${connect.id}-${avatarHash}-${userHash}-${connect.updatedAt || connect.createdAt || index}`}
                  className="bg-white rounded-xl p-4 border border-professional-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col min-h-[240px]"
                  onClick={() => {
                    setSelectedConnect(connect);
                    setShowDetailModal(true);
                  }}
                  data-testid={`connect-card-${connect.id}`}
                >
                  {(() => {
                    // Helper to get first name
                    const getFirstName = (fullName) => {
                      if (!fullName) return '';
                      return fullName.split(' ')[0];
                    };
                    
                    // Helper to format ISO week string as "Week of Nov 17"
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
                    
                    // Helper to format date as "Week of Nov 17"
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
                    
                    // Determine which user is which
                    // Check both email and id formats since connects can be stored with either
                    const currentUserId = currentUser?.email || currentUser?.id || '';
                    const connectUserId = connect.userId || '';
                    // More robust check: compare both email and id formats
                    const isSender = connectUserId === currentUserId || 
                                    connectUserId === currentUser?.email || 
                                    connectUserId === currentUser?.id ||
                                    (currentUser?.email && connectUserId.includes(currentUser.email)) ||
                                    (currentUser?.id && connectUserId.includes(currentUser.id));
                    
                    const currentUserFirstName = getFirstName(currentUser?.name || '');
                    const otherUserName = connect.withWhom || connect.name || '';
                    const otherUserFirstName = getFirstName(otherUserName);
                    
                    // Helper to get valid avatar URL - prioritize actual profile picture, fallback to generated
                    // NOTE: Blob URLs are temporary and cause security errors - they should be converted to permanent storage URLs
                    const getAvatarUrl = (avatar, name, defaultColor = 'EC4B5C') => {
                      // Check multiple avatar fields and validate URL
                      const avatarUrl = avatar || null;
                      
                      if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim()) {
                        const trimmed = avatarUrl.trim();
                        // Blob URLs are temporary and cause security errors - use fallback instead
                        if (trimmed.startsWith('blob:')) {
                          return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=${defaultColor}&color=fff&size=64`;
                        }
                        // Only accept http/https URLs (permanent storage)
                        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
                          return trimmed;
                        }
                      }
                      // Fallback to generated avatar
                      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=${defaultColor}&color=fff&size=64`;
                    };
                    
                    // Get avatars - prioritize profile pictures from connect data or currentUser
                    // Check multiple possible avatar fields in connect object
                    const connectAvatar = connect.avatar || connect.picture || null;
                    
                    // Ensure we have currentUser avatar - if not, use fallback but log for debugging
                    const currentUserAvatarValue = currentUser?.avatar;
                    if (!currentUserAvatarValue && process.env.NODE_ENV === 'development') {
                      console.log(`⚠️ Current user avatar not loaded yet for connect ${connect.id}`);
                    }
                    
                    const currentUserAvatar = getAvatarUrl(
                      currentUserAvatarValue,
                      currentUser?.name || 'User',
                      'EC4B5C'
                    );
                    const otherUserAvatar = getAvatarUrl(
                      connectAvatar, // This should be enriched by the API from users container
                      otherUserName || 'User',
                      '6366f1'
                    );
                    
                    // Debug logging (remove in production if needed)
                    if (!connectAvatar && process.env.NODE_ENV === 'development') {
                      console.log(`⚠️ No avatar found for connect ${connect.id}:`, {
                        connectId: connect.id,
                        withWhom: connect.withWhom,
                        withWhomId: connect.withWhomId,
                        name: connect.name,
                        hasAvatar: !!connect.avatar,
                        hasPicture: !!connect.picture,
                        currentUserHasAvatar: !!currentUserAvatarValue
                      });
                    }
                    
                    // Format names: always show "User1 x User2" where User1 is the sender
                    const displayName = isSender
                      ? `${currentUserFirstName} x ${otherUserFirstName}`
                      : `${otherUserFirstName} x ${currentUserFirstName}`;
                    
                    // Get date to display - prefer first proposedWeek, then when date, then createdAt
                    const displayDate = connect.proposedWeeks && connect.proposedWeeks.length > 0
                      ? formatIsoWeekString(connect.proposedWeeks[0])
                      : formatWeekOfDate(connect.when || connect.date || connect.createdAt);
                    
                    return (
                      <>
                        {/* Two profile pictures side by side */}
                        <div className="flex items-center justify-center gap-2 mb-3 min-h-[56px]">
                          <img
                            key={`${connect.id}-avatar1-${isSender ? 'current' : 'other'}`}
                            src={isSender ? currentUserAvatar : otherUserAvatar}
                            alt={isSender ? currentUser?.name : otherUserName}
                            className="w-14 h-14 rounded-full ring-2 ring-professional-gray-200 object-cover flex-shrink-0 bg-professional-gray-100"
                            loading="lazy"
                            onError={(e) => {
                              // If image fails to load, use generated avatar as fallback
                              const name = isSender ? currentUser?.name : otherUserName;
                              const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=EC4B5C&color=fff&size=64`;
                              // Only update if not already using fallback to prevent infinite loop
                              if (e.target.src !== fallbackUrl) {
                                e.target.src = fallbackUrl;
                              }
                            }}
                          />
                          <img
                            key={`${connect.id}-avatar2-${isSender ? 'other' : 'current'}`}
                            src={isSender ? otherUserAvatar : currentUserAvatar}
                            alt={isSender ? otherUserName : currentUser?.name}
                            className="w-14 h-14 rounded-full ring-2 ring-professional-gray-200 object-cover flex-shrink-0 bg-professional-gray-100"
                            loading="lazy"
                            onError={(e) => {
                              // If image fails to load, use generated avatar as fallback
                              const name = isSender ? otherUserName : currentUser?.name;
                              const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=6366f1&color=fff&size=64`;
                              // Only update if not already using fallback to prevent infinite loop
                              if (e.target.src !== fallbackUrl) {
                                e.target.src = fallbackUrl;
                              }
                            }}
                          />
                        </div>
                        
                        {/* FirstName x FirstName */}
                        <h4 className="font-semibold text-professional-gray-900 text-center mb-2 min-h-[24px]">
                          {displayName}
                        </h4>
                        
                        {/* Date display - always show if available */}
                        {displayDate && (
                          <div className="mb-3 text-center">
                            <span className="text-xs text-professional-gray-600 font-medium">
                              Week of {displayDate}
                            </span>
                          </div>
                        )}
                        
                        {/* Additional proposed weeks if more than one */}
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
                        
                        {/* Bottom row: Shared interests | Pending */}
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
                      </>
                    );
                  })()}
                </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Connect Detail Modal */}
      {showDetailModal && selectedConnect && (
        <ConnectDetailModal
          connect={selectedConnect}
          currentUser={currentUser}
          recipientName={selectedConnect.withWhom || selectedConnect.name}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedConnect(null);
          }}
          onUpdateStatus={async (connectId, newStatus) => {
            try {
              await updateConnect(connectId, newStatus);
              // Close modal after successful update
              setShowDetailModal(false);
              setSelectedConnect(null);
            } catch (err) {
              console.error('Failed to update connect:', err);
              alert('Failed to update connect status. Please try again.');
            }
          }}
        />
      )}

      {/* Connect Request Modal */}
      {showRequestModal && selectedUser && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-labelledby="connect-modal-title"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-professional-gray-200 overflow-hidden flex flex-col">
            {/* Modal Header - Clean white header like Connect Detail Modal */}
            <div className="p-4 border-b border-professional-gray-200 bg-white flex-shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 id="connect-modal-title" className="text-xl font-bold text-professional-gray-900">
                    Connect with {selectedUser.name}
                  </h3>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={handleCloseModal}
                    className="p-1.5 text-professional-gray-600 hover:text-professional-gray-900 hover:bg-professional-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-professional-gray-500"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-5">
                {/* User Info - Side by side layout matching Connect Detail Modal */}
                <div>
                  <label className="block text-sm font-bold text-professional-gray-700 mb-2">
                    Connect With
                  </label>
                  <div className="p-4 bg-professional-gray-50 rounded-lg border border-professional-gray-200 space-y-3">
                    {/* User 1 pic + name | User 2 pic + name */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 flex-1">
                        <img
                          src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=EC4B5C&color=fff&size=48`}
                          alt={currentUser?.name}
                          className="w-8 h-8 rounded-full ring-2 ring-white object-cover flex-shrink-0"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=EC4B5C&color=fff&size=48`;
                          }}
                        />
                        <p className="text-sm font-medium text-professional-gray-900 truncate">
                          {currentUser?.name}
                        </p>
                      </div>
                      <div className="w-px h-8 bg-professional-gray-300"></div>
                      <div className="flex items-center gap-2 flex-1">
                        <img
                          src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name || 'User')}&background=6366f1&color=fff&size=48`}
                          alt={selectedUser.name}
                          className="w-8 h-8 rounded-full ring-2 ring-white object-cover flex-shrink-0"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name || 'User')}&background=6366f1&color=fff&size=48`;
                          }}
                        />
                        <p className="text-sm font-medium text-professional-gray-900 truncate">
                          {selectedUser.name}
                        </p>
                      </div>
                    </div>
                    
                    {/* User 1 location | User 2 location */}
                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-professional-gray-200">
                      <div className="flex items-center gap-1 flex-1">
                        <MapPin className="w-3 h-3 text-professional-gray-500 flex-shrink-0" />
                        <p className="text-xs text-professional-gray-600 truncate">
                          {currentUser?.office || 'Unknown'}
                        </p>
                      </div>
                      <div className="w-px h-4 bg-professional-gray-300"></div>
                      <div className="flex items-center gap-1 flex-1">
                        <MapPin className="w-3 h-3 text-professional-gray-500 flex-shrink-0" />
                        <p className="text-xs text-professional-gray-600 truncate">
                          {selectedUser.office || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shared Categories */}
                {selectedUser.sharedCategories && selectedUser.sharedCategories.length > 0 && (
                  <div>
                    <p className="text-sm font-bold text-professional-gray-700 mb-2">
                      Shared interests:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedUser.sharedCategories.map((category) => (
                        <span
                          key={category}
                          className="px-2 py-1 bg-professional-gray-50 text-professional-gray-600 text-xs font-medium rounded-full border border-professional-gray-200"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Agenda */}
                <div>
                  <label 
                    htmlFor="connect-agenda"
                    className="block text-sm font-bold text-professional-gray-700 mb-2"
                  >
                    Agenda / Topics <span className="text-netsurit-red">*</span>
                  </label>
                  <input
                    id="connect-agenda"
                    type="text"
                    value={agenda}
                    onChange={(e) => setAgenda(e.target.value)}
                    className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-transparent text-sm"
                    placeholder="e.g., Discuss marathon training tips, share career advice..."
                    required
                    data-testid="agenda-input"
                  />
                  <p className="text-xs text-professional-gray-500 mt-1">
                    What would you like to discuss during this connect?
                  </p>
                </div>

                {/* Week Selector */}
                <div>
                  <TimeSlotSelector
                    value={proposedWeeks}
                    onChange={setProposedWeeks}
                    maxWeeks={3}
                  />
                </div>

                {/* Message */}
                <div>
                  <label 
                    htmlFor="request-message"
                    className="block text-sm font-bold text-professional-gray-700 mb-2"
                  >
                    Optional message:
                  </label>
                  <textarea
                    id="request-message"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-transparent h-16 resize-none text-sm leading-relaxed"
                    placeholder="Share why you'd like to connect..."
                  />
                </div>

                {/* Scheduling Option */}
                <div>
                  <label className="block text-sm font-bold text-professional-gray-700 mb-2">
                    Preferred meeting method:
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-2 rounded-lg border border-professional-gray-200 hover:bg-professional-gray-50 cursor-pointer transition-all duration-200">
                      <input
                        type="radio"
                        value="teams"
                        checked={schedulingOption === 'teams'}
                        onChange={(e) => setSchedulingOption(e.target.value)}
                        className="mr-2 text-netsurit-red focus:ring-netsurit-red"
                      />
                      <div className="w-6 h-6 bg-netsurit-red/10 rounded-lg flex items-center justify-center mr-2">
                        <Calendar className="w-3 h-3 text-netsurit-red" />
                      </div>
                      <span className="text-sm font-medium text-professional-gray-800">
                        Microsoft Teams
                      </span>
                    </label>
                    <label className="flex items-center p-2 rounded-lg border border-professional-gray-200 hover:bg-professional-gray-50 cursor-pointer transition-all duration-200">
                      <input
                        type="radio"
                        value="inperson"
                        checked={schedulingOption === 'inperson'}
                        onChange={(e) => setSchedulingOption(e.target.value)}
                        className="mr-2 text-netsurit-red focus:ring-netsurit-red"
                      />
                      <div className="w-6 h-6 bg-netsurit-coral/10 rounded-lg flex items-center justify-center mr-2">
                        <Users className="w-3 h-3 text-netsurit-coral" />
                      </div>
                      <span className="text-sm font-medium text-professional-gray-800">
                        In Person
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-professional-gray-200 flex gap-2 flex-shrink-0">
              {/* Send Request Button - Left, Red, Large */}
              <button
                onClick={handleSendRequest}
                disabled={!requestMessage.trim() || !agenda.trim() || proposedWeeks.length === 0}
                className="flex-1 px-4 py-2 bg-netsurit-red text-white rounded-lg hover:bg-netsurit-red focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                data-testid="send-connect-request-button"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Request
              </button>
              
              {/* Cancel Button - Right, Grey, Small */}
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-professional-gray-600 text-white rounded-lg hover:bg-professional-gray-700 focus:outline-none focus:ring-2 focus:ring-professional-gray-500 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

