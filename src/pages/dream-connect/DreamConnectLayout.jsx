// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { DataBoundary } from '../../components/DataBoundary';
import ConnectionFilters from './ConnectionFilters';
import ConnectDetailModal from './ConnectDetailModal';
import DreamConnectHeader from './DreamConnectHeader';
import SuggestedConnections from './SuggestedConnections';
import RecentConnects from './RecentConnects';
import ConnectRequestModal from './ConnectRequestModal';
import { useDreamConnections } from '../../hooks/useDreamConnections';
import { useApp } from '../../context/AppContext';
import { useRovingFocus } from '../../hooks/useRovingFocus';
import { toast } from '../../utils/toast';

/**
 * Main layout for Dream Connect page
 * Handles orchestration, modals, and state management
 */
export default function DreamConnectLayout() {
  const { currentUser, addConnect, updateConnect } = useApp();
  const {
    connections,
    filteredCount,
    totalCount,
    allUsersCount,
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
  const [isSavingConnect, setIsSavingConnect] = useState(false);
  const [schedulingOption, setSchedulingOption] = useState('teams');

  // Load data when page is visited (deferred loading - Dream Connect is "Coming Soon")
  // This prevents expensive getAllUsers call from running on every app load
  useEffect(() => {
    if (currentUser?.id) {
      refreshData();
    }
  }, [currentUser?.id]);

  // Roving tabindex for keyboard navigation in grid
  const connectionsCount = Array.isArray(connections) ? connections.length : 0;
  const { getItemProps, onKeyDown: handleRovingKeyDown } = useRovingFocus(connectionsCount, {
    loop: true,
    direction: 'both',
    columnsCount: 3
  });

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
      toast.warning('Please fill in the agenda/topics field');
      return;
    }

    if (proposedWeeks.length === 0) {
      toast.warning('Please select at least one available week');
      return;
    }

    if (isSavingConnect) return;
    setIsSavingConnect(true);

    try {
      const connectData = {
        id: `connect_${Date.now()}`,
        userId: currentUser?.id,
        type: 'connect',
        withWhom: selectedUser.name,
        withWhomId: selectedUser.id || selectedUser.email || selectedUser.userId,
        when: new Date().toISOString().split('T')[0],
        notes: requestMessage,
        status: 'pending',
        agenda: agenda.trim(),
        proposedWeeks: proposedWeeks,
        schedulingMethod: schedulingOption,
        dreamId: undefined,
        name: selectedUser.name,
        category: categoryFilter !== 'All' 
          ? mapCategory(categoryFilter) 
          : (selectedUser.sharedCategories?.[0] || 'Shared interests'),
        avatar: selectedUser.avatar,
        office: selectedUser.office,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addConnect(connectData);
      handleCloseModal();
      toast.success(`Dream Connect request sent to ${selectedUser?.name}! 🎉`);
      
    } catch (err) {
      console.error('❌ Error sending connect request:', err);
      toast.error(`Failed to send connect request to ${selectedUser?.name}. Please try again.`);
    } finally {
      setIsSavingConnect(false);
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

  const handleClearFilters = () => {
    setCategoryFilter('All');
    setLocationFilter('All');
  };

  const handleSelectConnect = (connect) => {
    setSelectedConnect(connect);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedConnect(null);
  };

  const handleUpdateConnectStatus = async (connectId, newStatus) => {
    try {
      await updateConnect(connectId, newStatus);
      handleCloseDetailModal();
    } catch (err) {
      console.error('Failed to update connect:', err);
      toast.error('Failed to update connect status. Please try again.');
    }
  };

  // Early return for no user
  if (!currentUser) {
    return (
      <div className="max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-10 xl:px-12 py-3 sm:py-4">
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

  const isUserFullyLoaded = !!(currentUser?.email || currentUser?.id);
  const uniqueCategories = currentUser.dreamBook 
    ? new Set(currentUser.dreamBook.map(d => d.category)).size 
    : 0;

  return (
    <DataBoundary
      loading={isLoading}
      error={error}
      onRetry={refreshData}
      loadingMessage="Loading Dream Connections"
      errorTitle="Failed to Load Connections"
    >
      <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16 py-3 sm:py-4 space-y-3 sm:space-y-4">
        {/* Header with KPIs */}
        <DreamConnectHeader
          allUsersCount={allUsersCount}
          connectsCount={currentUser.connects?.length || 0}
          uniqueCategories={uniqueCategories}
        />

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
        <SuggestedConnections
          connections={connections}
          filteredCount={filteredCount}
          currentPage={currentPage}
          totalPages={totalPages}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          categoryFilter={categoryFilter}
          onConnectRequest={handleConnectRequest}
          onGoToNextPage={goToNextPage}
          onGoToPrevPage={goToPrevPage}
          onGoToPage={goToPage}
          onRefresh={refreshData}
          onClearFilters={handleClearFilters}
          rovingProps={{ getItemProps, onKeyDown: handleRovingKeyDown }}
        />

        {/* Recent Connects */}
        <RecentConnects
          connects={currentUser.connects}
          currentUser={currentUser}
          isUserFullyLoaded={isUserFullyLoaded}
          onSelectConnect={handleSelectConnect}
        />

        {/* Connect Detail Modal */}
        {showDetailModal && selectedConnect && (
          <ConnectDetailModal
            connect={selectedConnect}
            currentUser={currentUser}
            recipientName={selectedConnect.withWhom || selectedConnect.name}
            onClose={handleCloseDetailModal}
            onUpdateStatus={handleUpdateConnectStatus}
          />
        )}

        {/* Connect Request Modal */}
        <ConnectRequestModal
          isOpen={showRequestModal}
          selectedUser={selectedUser}
          currentUser={currentUser}
          requestMessage={requestMessage}
          agenda={agenda}
          proposedWeeks={proposedWeeks}
          schedulingOption={schedulingOption}
          isSaving={isSavingConnect}
          onMessageChange={setRequestMessage}
          onAgendaChange={setAgenda}
          onWeeksChange={setProposedWeeks}
          onSchedulingChange={setSchedulingOption}
          onSend={handleSendRequest}
          onClose={handleCloseModal}
        />
      </div>
    </DataBoundary>
  );
}
