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
  Camera,
  Send
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConnectionFilters from './ConnectionFilters';
import ConnectionCard from './ConnectionCard';
import { useDreamConnections } from '../../hooks/useDreamConnections';
import { useApp } from '../../context/AppContext';
import { useRovingFocus } from '../../hooks/useRovingFocus';
import HelpTooltip from '../../components/HelpTooltip';

/**
 * Main layout for Dream Connect page
 * Handles orchestration, modals, and state management
 */
export default function DreamConnectLayout() {
  const { currentUser, addConnect } = useApp();
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');

  // Roving tabindex for keyboard navigation in grid (3 columns on large screens)
  const { getItemProps, onKeyDown: handleRovingKeyDown } = useRovingFocus(connections.length, {
    loop: true,
    direction: 'both',
    columnsCount: 3 // Matches lg:grid-cols-3
  });
  const [uploadSelfie, setUploadSelfie] = useState(false);
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
    if (!selectedUser || !requestMessage.trim()) return;

    try {
      // Create connect entry (matches new 6-container schema)
      const connectData = {
        id: `connect_${Date.now()}`,
        type: 'connect',
        withWhom: selectedUser.name,
        when: new Date().toISOString().split('T')[0], // ISO date (YYYY-MM-DD)
        notes: requestMessage,
        dreamId: undefined, // Optional - can be linked to a specific dream
        // Additional metadata for display (not part of core schema but preserved as passthrough)
        name: selectedUser.name,
        category: categoryFilter !== 'All' 
          ? mapCategory(categoryFilter) 
          : (selectedUser.sharedCategories?.[0] || 'Shared interests'),
        avatar: selectedUser.avatar,
        office: selectedUser.office,
        schedulingOption,
        uploadSelfie,
        createdAt: new Date().toISOString()
      };

      console.log('✅ Dream Connect request created:', {
        to: selectedUser.name,
        message: requestMessage,
        scheduling: schedulingOption,
        uploadSelfie
      });

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
    setUploadSelfie(false);
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
            className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center mx-auto"
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
              className="mt-6 px-6 py-3 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
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
                      : 'bg-gradient-to-r from-professional-gray-600 to-professional-gray-700 text-white border-transparent hover:from-professional-gray-700 hover:to-professional-gray-800 hover:shadow-md'
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
                          ? 'bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white border-netsurit-red shadow-md'
                          : 'bg-gradient-to-r from-professional-gray-600 to-professional-gray-700 text-white border-transparent hover:from-professional-gray-700 hover:to-professional-gray-800 hover:shadow-md'
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
                      : 'bg-gradient-to-r from-professional-gray-600 to-professional-gray-700 text-white border-transparent hover:from-professional-gray-700 hover:to-professional-gray-800 hover:shadow-md'
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
        </div>

        {/* Recent Connects List or Empty State */}
        {!currentUser.connects || currentUser.connects.length === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentUser.connects
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 6)
              .map((connect) => (
                <div
                  key={connect.id}
                  className="bg-white rounded-xl p-4 border border-professional-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start space-x-3">
                    {connect.avatar ? (
                      <img
                        src={connect.avatar}
                        alt={connect.withWhom || connect.name}
                        className="w-12 h-12 rounded-full ring-2 ring-professional-gray-100"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-netsurit-red to-netsurit-coral rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {(connect.withWhom || connect.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-professional-gray-900 truncate">
                        {connect.withWhom || connect.name}
                      </h4>
                      <p className="text-xs text-professional-gray-500 mt-0.5">
                        {new Date(connect.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      {connect.category && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-professional-gray-100 text-professional-gray-600 text-xs rounded-full">
                          {connect.category}
                        </span>
                      )}
                      {connect.notes && (
                        <p className="text-sm text-professional-gray-600 mt-2 line-clamp-2">
                          {connect.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Connect Request Modal */}
      {showRequestModal && selectedUser && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-labelledby="connect-modal-title"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] shadow-2xl border border-professional-gray-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-netsurit-red to-netsurit-coral p-4 text-white flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-white/20"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 id="connect-modal-title" className="text-lg font-bold">
                      Connect with {selectedUser.name}
                    </h3>
                    <p className="text-white/90 text-sm">Send a connection request</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1">
              <div className="space-y-4">
                {/* User Info */}
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-professional-gray-50 to-professional-gray-100/50 rounded-lg border border-professional-gray-200">
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                    className="w-12 h-12 rounded-full ring-2 ring-white shadow-lg"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-base text-professional-gray-900">
                      {selectedUser.name}
                    </p>
                    <p className="text-sm text-professional-gray-600 flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {selectedUser.office}
                    </p>
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

                {/* Selfie Checkbox */}
                <div>
                  <label className="flex items-center p-2 rounded-lg border border-professional-gray-200 hover:bg-professional-gray-50 cursor-pointer transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={uploadSelfie}
                      onChange={(e) => setUploadSelfie(e.target.checked)}
                      className="mr-2 text-netsurit-red focus:ring-netsurit-red rounded"
                    />
                    <div className="w-6 h-6 bg-netsurit-orange/10 rounded-lg flex items-center justify-center mr-2">
                      <Camera className="w-3 h-3 text-netsurit-orange" />
                    </div>
                    <span className="text-sm font-medium text-professional-gray-700">
                      I'll upload a selfie after we connect
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-professional-gray-200 flex gap-2 flex-shrink-0">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 bg-professional-gray-100 text-professional-gray-700 rounded-lg hover:bg-professional-gray-200 focus:outline-none focus:ring-2 focus:ring-professional-gray-300 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSendRequest}
                disabled={!requestMessage.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

