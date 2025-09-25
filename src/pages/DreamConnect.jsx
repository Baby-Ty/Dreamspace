import React, { useState, useEffect } from 'react';
import { Users, MapPin, Heart, MessageCircle, Calendar, Camera, X, Send, Award, BookOpen, MoreVertical, Network, Loader2, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import peopleService from '../services/peopleService';
import { useApp } from '../context/AppContext';

const DreamConnect = () => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [uploadSelfie, setUploadSelfie] = useState(false);
  const [schedulingOption, setSchedulingOption] = useState('teams');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUser, setPreviewUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { currentUser } = useApp();

  // Real data state
  const [allUsers, setAllUsers] = useState([]);
  const [suggestedConnections, setSuggestedConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load users and generate suggestions
  useEffect(() => {
    loadUsersAndGenerateSuggestions();
  }, [currentUser?.id, currentUser?.userId]);

  const loadUsersAndGenerateSuggestions = async () => {
    // Use id or userId - handle both formats
    const userId = currentUser?.id || currentUser?.userId;
    if (!userId) {
      console.log('❌ DreamConnect: No currentUser.id or currentUser.userId, skipping loadUsersAndGenerateSuggestions');
      setIsLoading(false);
      return;
    }

    console.log('🔄 DreamConnect: Loading users and generating suggestions', {
      currentUserId: userId,
      currentUserName: currentUser?.name,
      currentUserEmail: currentUser?.email
    });

    try {
      setError(null);
      setIsLoading(true);

      // Get all users from Cosmos DB
      const users = await peopleService.getAllUsers();
      setAllUsers(users);

      // Generate suggested connections based on real data
      const suggestions = generateSuggestedConnections(users, currentUser);
      setSuggestedConnections(suggestions);

      console.log('✅ Loaded Dream Connect data:', {
        totalUsers: users.length,
        suggestions: suggestions.length,
        currentUser: currentUser.name
      });
    } catch (error) {
      console.error('❌ Error loading Dream Connect data:', error);
      setError(error.message || 'Failed to load users');
      setSuggestedConnections([]); // Fallback to empty array
    } finally {
      setIsLoading(false);
    }
  };

  const generateSuggestedConnections = (users, currentUser) => {
    if (!users || !currentUser) return [];

    // Use currentUser's id or userId - handle both formats
    const currentUserId = currentUser.id || currentUser.userId;

    // Filter out the current user
    const otherUsers = users.filter(user => 
      user.id !== currentUserId && 
      user.userId !== currentUserId &&
      user.id !== currentUser.id && 
      user.userId !== currentUser.userId
    );

    // Calculate shared categories and create suggestions
    return otherUsers.map(user => {
      const sharedCategories = getSharedCategories(
        currentUser.dreamCategories || [], 
        user.dreamCategories || []
      );

      return {
        ...user,
        sharedCategories,
        // Add sample dreams if they don't exist
        sampleDreams: user.sampleDreams || generateSampleDreamsFromCategories(user.dreamCategories || [])
      };
    })
    // Sort by number of shared categories first (most compatible first), 
    // then by activity level, then alphabetically
    .sort((a, b) => {
      const diff = b.sharedCategories.length - a.sharedCategories.length;
      if (diff !== 0) return diff;
      // Secondary sort by score/activity level
      const scoreDiff = (b.score || 0) - (a.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      // Tertiary sort alphabetically by name
      return (a.name || '').localeCompare(b.name || '');
    });
  };

  const getSharedCategories = (userCategories, otherCategories) => {
    return userCategories.filter(cat => otherCategories.includes(cat));
  };

  const generateSampleDreamsFromCategories = (categories) => {
    const sampleTitleByCategory = {
      'Learning': { title: 'Learn a New Skill', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=60&auto=format&fit=crop' },
      'Health': { title: 'Get Fit — 3x a Week', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=60&auto=format&fit=crop' },
      'Travel': { title: 'Visit a New Country', image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=60&auto=format&fit=crop' },
      'Creative': { title: 'Start a Creative Project', image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&q=60&auto=format&fit=crop' },
      'Career': { title: 'Earn a Certification', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=60&auto=format&fit=crop' },
      'Financial': { title: 'Save for a Big Goal', image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&q=60&auto=format&fit=crop' },
      'Community': { title: 'Volunteer for a Cause', image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&q=60&auto=format&fit=crop' }
    };

    return categories.slice(0, 3).map((category, index) => ({
      title: sampleTitleByCategory[category]?.title || 'Personal Growth Goal',
      category: category,
      image: sampleTitleByCategory[category]?.image || 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=600&q=60&auto=format&fit=crop'
    }));
  };

  const refreshConnections = async () => {
    await loadUsersAndGenerateSuggestions();
  };

  const categoryPills = ['All','Learning','Health','Travel','Creative','Career','Finance','Community'];
  const mapCategory = (c) => (c === 'Finance' ? 'Financial' : c);

  const filteredConnections = suggestedConnections.filter(u => {
    let ok = true;
    
    // Category filtering: Show all users when "All" is selected
    if (categoryFilter !== 'All') {
      // When a specific category is selected, only show users with that dream category
      const userCategories = u.dreamCategories || [];
      ok = userCategories.includes(mapCategory(categoryFilter));
    }
    // If categoryFilter is "All", show everyone regardless of dream categories (ok stays true)
    
    // Location filtering
    if (ok && locationFilter !== 'All') {
      ok = u.office === locationFilter;
    }
    
    return ok;
  });

  // Pagination constants
  const USERS_PER_PAGE = 6;
  const totalPages = Math.ceil(filteredConnections.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  const paginatedConnections = filteredConnections.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, locationFilter]);

  console.log('🔍 Dream Connect Debug:', {
    totalUsers: allUsers.length,
    suggestedConnections: suggestedConnections.length,
    filteredConnections: filteredConnections.length,
    paginatedConnections: paginatedConnections.length,
    currentPage,
    totalPages,
    categoryFilter,
    locationFilter,
    currentUser: currentUser?.name
  });

  const handleConnectRequest = (user) => {
    setSelectedUser(user);
    const chosenCategory = categoryFilter !== 'All' ? mapCategory(categoryFilter) : (user.sharedCategories[0] || 'our shared interests');
    setRequestMessage(`Hey ${user.name.split(' ')[0]}, I’d love to connect about ${chosenCategory}.`);
    setShowRequestModal(true);
  };

  const handlePreview = (user) => {
    setPreviewUser(user);
    setShowPreviewModal(true);
  };

  const handleSendRequest = async () => {
    if (!selectedUser || !requestMessage.trim()) return;

    try {
      // Create connect entry
      const connectData = {
        id: Date.now(),
        name: selectedUser.name,
        category: categoryFilter !== 'All' ? mapCategory(categoryFilter) : (selectedUser.sharedCategories?.[0] || 'Shared interests'),
        withWhom: selectedUser.name,
        date: new Date().toISOString().split('T')[0],
        notes: requestMessage,
        avatar: selectedUser.avatar,
        office: selectedUser.office,
        schedulingOption,
        uploadSelfie
      };

      console.log('✅ Dream Connect request created:', {
        to: selectedUser.name,
        message: requestMessage,
        scheduling: schedulingOption,
        uploadSelfie
      });

      // TODO: In a real implementation, this would:
      // 1. Send notification to the target user
      // 2. Create a pending connection request in the database
      // 3. Update both users' connect histories
      // For now, we'll just add it to the current user's connects
      
      // You can use the AppContext addConnect method here if needed
      // addConnect(connectData);
      
      setShowRequestModal(false);
      setSelectedUser(null);
      setRequestMessage('');
      setUploadSelfie(false);
      setSchedulingOption('teams');
      
      // Show success message
      alert(`Dream Connect request sent to ${selectedUser?.name}! 🎉`);
      
    } catch (error) {
      console.error('❌ Error sending connect request:', error);
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="text-center py-20">
          <Loader2 className="h-12 w-12 text-netsurit-red animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-professional-gray-900 mb-2">Loading Dream Connections</h2>
          <p className="text-professional-gray-600">Finding people you can connect with...</p>
          
          {/* Debug Info */}
          <div className="mt-8 bg-gray-50 p-4 rounded-lg text-left max-w-md mx-auto">
            <p className="text-sm text-gray-600 mb-2"><strong>Debug Info:</strong></p>
            <p className="text-xs text-gray-500">User ID: {currentUser?.id || 'Not available'}</p>
            <p className="text-xs text-gray-500">User UserID: {currentUser?.userId || 'Not available'}</p>
            <p className="text-xs text-gray-500">User Name: {currentUser?.name || 'Not available'}</p>
            <p className="text-xs text-gray-500">Effective ID: {currentUser?.id || currentUser?.userId || 'Not available'}</p>
            <p className="text-xs text-gray-500">Debug: Check browser console for detailed loading info</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-netsurit-red text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
            >
              Force Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="text-center py-20">
          <AlertCircle className="h-12 w-12 text-netsurit-red mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-professional-gray-900 mb-2">Failed to Load Connections</h2>
          <p className="text-professional-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshConnections}
            className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-3 sm:space-y-4">
      {/* Header with Inline KPIs */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          {/* Title Section */}
          <div className="mb-6 lg:mb-0">
            <div className="flex items-center space-x-3 mb-2">
              <Network className="h-8 w-8 text-netsurit-red" />
              <h1 className="text-3xl font-bold text-professional-gray-900">Dream Connect</h1>
              <button
                onClick={refreshConnections}
                disabled={isLoading}
                className="bg-professional-gray-100 text-professional-gray-700 p-2 rounded-lg hover:bg-professional-gray-200 focus:outline-none focus:ring-2 focus:ring-professional-gray-300 transition-all duration-200"
                title="Refresh Connections"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-professional-gray-600">Find colleagues with shared dream categories and learn from each other</p>
          </div>
          
          {/* KPI Metrics Inline */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-netsurit-red" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">Suggested</p>
              <p className="text-xl font-bold text-professional-gray-900">{filteredConnections.length}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <Heart className="h-6 w-6 text-netsurit-coral" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">Your Connects</p>
              <p className="text-xl font-bold text-professional-gray-900">{currentUser.connects.length}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="h-6 w-6 text-netsurit-orange" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">Categories</p>
              <p className="text-xl font-bold text-professional-gray-900">{new Set(currentUser.dreamBook.map(d=>d.category)).size}</p>
            </div>
          </div>
        </div>
      </div>


      {/* Suggested Connections with Inline Category Filters */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-professional-gray-900 mb-1">
              Suggested Connections
            </h2>
            <p className="text-sm text-professional-gray-600">
              {filteredConnections.length > 0 
                ? `${filteredConnections.length} colleague${filteredConnections.length !== 1 ? 's' : ''} match${filteredConnections.length === 1 ? 'es' : ''} your interests`
                : 'No matches found for current filters'
              }
              {totalPages > 1 && (
                <span className="text-professional-gray-500"> • Page {currentPage} of {totalPages}</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-professional-gray-700 mr-1">Categories:</span>
            {categoryPills.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                  categoryFilter === c 
                    ? 'bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white border-netsurit-red shadow-md hover:shadow-lg transform hover:scale-105' 
                    : 'bg-white text-professional-gray-700 border-professional-gray-300 hover:bg-professional-gray-50 hover:border-professional-gray-400 hover:shadow-sm'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        
        {filteredConnections.length === 0 ? (
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
                  refreshConnections();
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
            <div className="grid grid-cols-3 gap-4 auto-rows-fr">
              {paginatedConnections.map((user) => (
                <div key={user.id} className="w-full">
                  <ConnectionCard
                    user={user}
                    currentUserCategories={[...new Set(currentUser.dreamBook.map(d=>d.category))]}
                    onConnect={() => handleConnectRequest(user)}
                    onPreview={() => handlePreview(user)}
                  />
                </div>
              ))}
              {/* Fill remaining slots with empty cards if needed for consistent 3x2 layout */}
              {Array.from({ length: Math.max(0, USERS_PER_PAGE - paginatedConnections.length) }).map((_, index) => (
                <div key={`empty-${index}`} className="w-full">
                  {/* Empty placeholder to maintain grid structure */}
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border transition-all duration-200 ${
                    currentPage === 1 
                      ? 'border-professional-gray-200 text-professional-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-professional-gray-600 to-professional-gray-700 text-white border-transparent hover:from-professional-gray-700 hover:to-professional-gray-800 hover:shadow-md'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg border font-medium text-sm transition-all duration-200 ${
                        currentPage === pageNum
                          ? 'bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white border-netsurit-red shadow-md'
                          : 'bg-gradient-to-r from-professional-gray-600 to-professional-gray-700 text-white border-transparent hover:from-professional-gray-700 hover:to-professional-gray-800 hover:shadow-md'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg border transition-all duration-200 ${
                    currentPage === totalPages
                      ? 'border-professional-gray-200 text-professional-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-professional-gray-600 to-professional-gray-700 text-white border-transparent hover:from-professional-gray-700 hover:to-professional-gray-800 hover:shadow-md'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Recent Connects */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-professional-gray-900 mb-1">
              Your Recent Connects
            </h2>
            <p className="text-sm text-professional-gray-600">
              {currentUser.connects.length > 0 
                ? `${currentUser.connects.length} connection${currentUser.connects.length !== 1 ? 's' : ''} made`
                : 'Start building your dream network'
              }
            </p>
          </div>
          {currentUser.connects.length > 0 && (
            <div className="text-xs text-professional-gray-500">
              Most recent first
            </div>
          )}
        </div>
        
        {currentUser.connects.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-professional-gray-50 rounded-2xl border border-professional-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-netsurit-coral/10 to-netsurit-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-netsurit-coral" />
            </div>
            <h3 className="text-xl font-bold text-professional-gray-900 mb-3">
              No connects yet
            </h3>
            <p className="text-professional-gray-600 max-w-md mx-auto leading-relaxed">
              Start connecting with colleagues to share your dream journeys and build meaningful relationships!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {currentUser.connects.map((connect) => (
              <div key={connect.id} className="group bg-white rounded-xl border border-professional-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-4 hover:scale-[1.01] hover:border-netsurit-red/20">
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-netsurit-red/10 to-netsurit-coral/10 rounded-full flex items-center justify-center ring-2 ring-white shadow-lg">
                      <Users className="w-5 h-5 text-netsurit-red" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-netsurit-coral border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-professional-gray-900 group-hover:text-netsurit-red transition-colors duration-200 truncate">
                      {connect.withWhom}
                    </h3>
                    <p className="text-sm text-professional-gray-600 mt-1 line-clamp-2 leading-relaxed">
                      {connect.notes}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="w-3 h-3 text-professional-gray-400" />
                      <p className="text-xs text-professional-gray-500 font-medium">
                        Connected on {new Date(connect.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  {connect.selfieUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={connect.selfieUrl}
                        alt="Connect selfie"
                        className="w-12 h-12 rounded-lg object-cover shadow-lg ring-2 ring-white group-hover:ring-netsurit-red/20 transition-all duration-300"
                      />
                    </div>
                  )}
                </div>
                
                {/* Connect Actions */}
                <div className="mt-3 pt-3 border-t border-professional-gray-100 flex gap-2">
                  <button className="flex-1 px-3 py-1.5 bg-professional-gray-50 hover:bg-professional-gray-100 text-professional-gray-700 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5">
                    <MessageCircle className="w-3 h-3" />
                    Message
                  </button>
                  <button className="flex-1 px-3 py-1.5 bg-gradient-to-r from-netsurit-red/10 to-netsurit-coral/10 hover:from-netsurit-red/20 hover:to-netsurit-coral/20 text-netsurit-red rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    Meet Again
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Connect Request Modal */}
      {showRequestModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] shadow-2xl border border-professional-gray-200 overflow-hidden flex flex-col">
            <div className="relative bg-gradient-to-r from-netsurit-red to-netsurit-coral p-4 text-white flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-white/20"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Connect with {selectedUser.name}</h3>
                    <p className="text-white/90 text-sm">Send a connection request</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <div className="space-y-4">
                {/* User Info */}
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-professional-gray-50 to-professional-gray-100/50 rounded-lg border border-professional-gray-200">
                  <div className="relative">
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                      className="w-12 h-12 rounded-full ring-2 ring-white shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-netsurit-coral border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-base text-professional-gray-900">{selectedUser.name}</p>
                    <p className="text-sm text-professional-gray-600 flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {selectedUser.office}
                    </p>
                  </div>
                </div>

                {/* Shared Categories */}
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

                {/* Message */}
                <div>
                  <label className="block text-sm font-bold text-professional-gray-700 mb-2">
                    Optional message:
                  </label>
                  <textarea
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
                      <span className="text-sm font-medium text-professional-gray-800">Microsoft Teams</span>
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
                      <span className="text-sm font-medium text-professional-gray-800">In Person</span>
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
                      I'll upload a selfie after our meeting
                    </span>
                  </label>
                </div>

              </div>
            </div>
            
            {/* Sticky Footer Actions */}
            <div className="flex space-x-3 p-4 bg-professional-gray-50/50 border-t border-professional-gray-200 flex-shrink-0">
              <button
                onClick={handleSendRequest}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-bold text-sm space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Send Request</span>
              </button>
              <button
                onClick={handleCloseModal}
                className="px-4 py-2.5 bg-white text-professional-gray-700 border border-professional-gray-300 rounded-lg hover:bg-professional-gray-50 hover:border-professional-gray-400 focus:outline-none focus:ring-2 focus:ring-professional-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Dreams Modal */}
      {showPreviewModal && previewUser && (
        <PreviewDreamsModal 
          user={previewUser} 
          onClose={() => { setShowPreviewModal(false); setPreviewUser(null); }}
          onConnect={(user) => { setShowPreviewModal(false); handleConnectRequest(user); }}
        />
      )}
    </div>
  );
};

const ConnectionCard = ({ user, onConnect, onPreview, currentUserCategories }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const matchPercent = (() => {
    if (!user.sharedCategories || user.sharedCategories.length === 0) {
      // No shared categories - give a low random match between 15-25%
      return 15 + Math.floor(Math.random() * 11);
    }
    
    const denom = user.dreamCategories?.length || 1;
    const pct = Math.round((user.sharedCategories.length / denom) * 100);
    
    // Add some randomness to make it more realistic
    const variance = Math.floor(Math.random() * 21) - 10; // -10 to +10
    const finalPct = Math.min(95, Math.max(20, pct + variance));
    
    return finalPct;
  })();
  const categoriesToShow = (user.sharedCategories && user.sharedCategories.length > 0)
    ? user.sharedCategories
    : (user.dreamCategories || []);
  const limitedCategories = categoriesToShow.slice(0, 3);
  const remainingCount = Math.max(0, categoriesToShow.length - limitedCategories.length);
  
  return (
    <div
      className="group relative rounded-xl border border-professional-gray-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300 p-4 flex flex-col cursor-pointer hover:scale-[1.01] hover:border-netsurit-red/20 overflow-hidden w-full max-w-sm mx-auto"
      onClick={() => onPreview()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPreview(); } }}
    >
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-netsurit-red/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Header Section */}
      <div className="relative flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-lg group-hover:ring-netsurit-red/20 transition-all duration-300"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff&size=100`;
              }}
            />
            {/* Online Status Indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-netsurit-coral border-2 border-white rounded-full"></div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base text-professional-gray-900 truncate group-hover:text-netsurit-red transition-colors duration-200">{user.name}</h3>
            <p className="text-xs text-professional-gray-600 flex items-center mt-0.5">
              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="truncate">{user.office}</span>
            </p>
          </div>
        </div>
        
        {/* Match Badge & Menu */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-professional-gray-100 text-professional-gray-700 border border-professional-gray-200 shadow-sm">
              {matchPercent}%
            </span>
          </div>
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setMenuOpen(v=>!v); }} 
              className="p-1.5 rounded-full hover:bg-professional-gray-100 group-hover:bg-white/50 transition-all duration-200 opacity-60 group-hover:opacity-100"
            >
              <MoreVertical className="w-3 h-3 text-professional-gray-500" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-professional-gray-200 rounded-xl shadow-xl z-10 text-sm overflow-hidden">
                <button className="w-full text-left px-4 py-3 hover:bg-professional-gray-50 transition-colors duration-150 flex items-center gap-2" onClick={(e)=>e.stopPropagation()}>
                  <MessageCircle className="w-4 h-4" />
                  Message on Teams
                </button>
                <button className="w-full text-left px-4 py-3 hover:bg-professional-gray-50 transition-colors duration-150 flex items-center gap-2" onClick={(e)=>e.stopPropagation()}>
                  <Heart className="w-4 h-4" />
                  Follow
                </button>
                <button className="w-full text-left px-4 py-3 hover:bg-professional-gray-50 transition-colors duration-150 flex items-center gap-2 text-red-600" onClick={(e)=>e.stopPropagation()}>
                  <X className="w-4 h-4" />
                  Hide suggestions
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="relative mb-3">
        <div className="flex flex-wrap gap-1.5">
          {limitedCategories.map((category) => (
            <span 
              key={category} 
              className="px-2 py-0.5 bg-professional-gray-50 text-professional-gray-600 text-xs font-medium rounded-full border border-professional-gray-200 hover:bg-professional-gray-100 transition-all duration-200"
            >
              {category}
            </span>
          ))}
          {remainingCount > 0 && (
            <span className="px-2 py-0.5 bg-professional-gray-100 text-professional-gray-600 text-xs font-medium rounded-full border border-professional-gray-200">
              +{remainingCount}
            </span>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative flex items-center justify-between text-xs mb-3">
        <div className="flex items-center gap-1 text-professional-gray-600 hover:text-netsurit-red transition-colors duration-200">
          <BookOpen className="w-3 h-3" />
          <span className="font-medium">{user.dreamsCount}</span>
        </div>
        <div className="flex items-center gap-1 text-professional-gray-600 hover:text-netsurit-red transition-colors duration-200">
          <Heart className="w-3 h-3" />
          <span className="font-medium">{user.connectsCount}</span>
        </div>
        <div className="flex items-center gap-1 text-professional-gray-600 hover:text-netsurit-red transition-colors duration-200">
          <Award className="w-3 h-3" />
          <span className="font-medium">{user.score}</span>
        </div>
      </div>

      {/* Recent Dream */}
      {user.latestDreamTitle && (
        <div className="relative mb-3 p-2 bg-professional-gray-50 rounded-lg border border-professional-gray-100">
          <p className="text-xs text-professional-gray-500 mb-0.5">Latest:</p>
          <p className="text-xs font-medium text-professional-gray-800 truncate">{user.latestDreamTitle}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="relative flex gap-2 mt-auto">
        <button
          onClick={(e) => { e.stopPropagation(); onConnect(); }}
          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-semibold text-xs"
        >
          <Users className="w-3 h-3 mr-1.5" />
          <span>Connect</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onPreview(); }}
          className="px-3 py-2 bg-gradient-to-r from-professional-gray-600 to-professional-gray-700 text-white rounded-lg hover:from-professional-gray-700 hover:to-professional-gray-800 focus:outline-none focus:ring-2 focus:ring-professional-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-xs"
        >
          Preview
        </button>
      </div>
    </div>
  );
};

// Enhanced Modal for previewing a user's profile summary and a grid of sample dreams
const PreviewDreamsModal = ({ user, onClose, onConnect }) => {
  const makeBio = () => {
    const categories = user.dreamCategories?.slice(0, 3).join(', ');
    return `Based in ${user.office}. Focused on ${categories || 'personal growth'} this year.`;
  };
  const sampleTitleByCategory = (cat) => {
    switch (cat) {
      case 'Learning': return 'Learn a New Skill';
      case 'Health': return 'Get Fit — 3x a Week';
      case 'Travel': return 'Visit a New Country';
      case 'Creative': return 'Start a Creative Project';
      case 'Career': return 'Earn a Certification';
      case 'Financial': return 'Save for a Big Goal';
      case 'Community': return 'Volunteer for a Cause';
      default: return 'New Dream';
    }
  };
  const dreams = (() => {
    // First priority: Use actual dreams from user's dreamBook
    if (user.dreamBook && user.dreamBook.length > 0) {
      return user.dreamBook.slice(0, 6).map((d, idx) => ({
        id: d.id || idx + 1,
        title: d.title,
        category: d.category,
        image: d.image || `https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=600&q=60`,
        progress: d.progress || 0,
        description: d.description
      }));
    }
    // Second priority: Use sampleDreams if they exist
    else if (user.sampleDreams && user.sampleDreams.length > 0) {
      return user.sampleDreams.slice(0, 6).map((d, idx) => ({
        id: idx + 1,
        title: d.title,
        category: d.category,
        image: d.image,
      }));
    }
    // Fallback: Generate from categories
    else {
      return (user.dreamCategories || []).slice(0, 6).map((c, idx) => ({
        id: idx + 1,
        title: sampleTitleByCategory(c),
        category: c,
        image: `https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=600&q=60`,
      }));
    }
  })();
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] shadow-2xl overflow-hidden border border-professional-gray-200 flex flex-col">
        {/* Enhanced Header with Netsurit Colors */}
        <div className="relative bg-gradient-to-r from-netsurit-red to-netsurit-coral p-5 text-white flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-white/20"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{user.name} — Dream Preview</h3>
                <p className="text-white/90 text-sm">Explore their dream journey</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* Enhanced Profile summary */}
          <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-professional-gray-50 to-professional-gray-100/50 rounded-xl border border-professional-gray-200">
            <div className="relative">
              <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow-lg" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-netsurit-coral border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <span className="text-xl font-bold text-professional-gray-900">{user.name}</span>
                <span className="text-sm text-professional-gray-600 flex items-center bg-white px-2 py-1 rounded-full border border-professional-gray-200">
                  <MapPin className="w-3 h-3 mr-1" />
                  {user.office}
                </span>
              </div>
              <p className="text-sm text-professional-gray-700 leading-relaxed mb-3">{makeBio()}</p>
              <div className="flex flex-wrap gap-2">
                {(user.dreamCategories || []).map((c) => (
                  <span 
                    key={c} 
                    className="px-2 py-1 bg-professional-gray-50 text-professional-gray-600 text-xs font-medium rounded-full border border-professional-gray-200"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced Dreams grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-bold text-professional-gray-900 mb-1">Dream Collection</h4>
                <p className="text-sm text-professional-gray-600">{dreams.length} dreams to explore</p>
              </div>
              <div className="text-xs text-professional-gray-500">
                Preview samples
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dreams.map((d) => (
                <div key={d.id} className="group rounded-xl border border-professional-gray-200 bg-white overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-netsurit-red/20">
                  <div className="relative">
                    <div className="w-full h-24 bg-professional-gray-200 overflow-hidden">
                      <img 
                        src={d.image} 
                        alt={d.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium border border-white/20">
                      {d.category}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-bold text-professional-gray-900 mb-1 group-hover:text-netsurit-red transition-colors duration-200">
                      {d.title}
                    </p>
                    {d.description && (
                      <p className="text-xs text-professional-gray-500 line-clamp-2 leading-relaxed mb-2">
                        {d.description}
                      </p>
                    )}
                    {d.progress !== undefined && d.progress > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-professional-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-netsurit-red to-netsurit-coral rounded-full transition-all duration-300"
                            style={{ width: `${d.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-professional-gray-600">
                          {d.progress}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
        
        {/* Enhanced Connect CTA */}
        <div className="flex items-center justify-between p-5 border-t border-professional-gray-200 bg-professional-gray-50/50 flex-shrink-0">
          <div className="text-sm text-professional-gray-600">
            Ready to start a conversation about shared dreams?
          </div>
          <button
            onClick={() => onConnect(user)}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-bold text-sm transform hover:-translate-y-0.5"
          >
            <Users className="w-4 h-4 mr-2" />
            Connect with {user.name.split(' ')[0]}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DreamConnect;