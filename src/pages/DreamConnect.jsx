import React, { useState } from 'react';
import { Users, MapPin, Heart, MessageCircle, Calendar, Camera, X, Send, Award, BookOpen, MoreVertical, Network } from 'lucide-react';
import { getSuggestedConnections } from '../data/mockData';
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
  const { currentUser } = useApp();

  const suggestedConnections = getSuggestedConnections(currentUser.id);

  const categoryPills = ['All','Learning','Health','Travel','Creative','Career','Finance','Community'];
  const mapCategory = (c) => (c === 'Finance' ? 'Financial' : c);

  const filteredConnections = suggestedConnections.filter(u => {
    let ok = true;
    if (categoryFilter !== 'All') {
      ok = (u.dreamCategories || []).includes(mapCategory(categoryFilter));
    }
    if (ok && locationFilter !== 'All') {
      ok = u.office === locationFilter;
    }
    return ok;
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

  const handleSendRequest = () => {
    // In a real app, this would send the connect request
    console.log('Sending connect request to:', selectedUser.name);
    console.log('Message:', requestMessage);
    console.log('Scheduling:', schedulingOption);
    console.log('Upload selfie after meeting:', uploadSelfie);
    
    setShowRequestModal(false);
    setSelectedUser(null);
    setRequestMessage('');
    setUploadSelfie(false);
    setSchedulingOption('teams');
    
    // Show success message (you could add a toast notification here)
    alert(`Dream Connect request sent to ${selectedUser?.name}!`);
  };

  const handleCloseModal = () => {
    setShowRequestModal(false);
    setSelectedUser(null);
    setRequestMessage('');
    setUploadSelfie(false);
    setSchedulingOption('teams');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Enhanced Header with KPIs */}
      <div className="mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex flex-col justify-center">
            <div className="flex items-center space-x-4 mb-3">
              <div className="p-2 bg-gradient-to-br from-netsurit-red to-netsurit-coral rounded-2xl shadow-lg">
                <Network className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-professional-gray-900">Dream Connect</h1>
            </div>
            <p className="text-lg text-professional-gray-600 leading-relaxed">
              Find colleagues with shared dream categories and learn from each other.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 w-full lg:w-auto">
            <div className="group bg-white rounded-2xl border border-professional-gray-200 shadow-lg hover:shadow-xl p-4 text-center transition-all duration-300 hover:scale-105">
              <div className="w-10 h-10 bg-gradient-to-br from-netsurit-red/10 to-netsurit-coral/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Users className="w-5 h-5 text-netsurit-red" />
              </div>
              <p className="text-xs text-professional-gray-500 font-medium mb-1">Suggested</p>
              <p className="text-xl font-bold text-professional-gray-900">{filteredConnections.length}</p>
            </div>
            <div className="group bg-white rounded-2xl border border-professional-gray-200 shadow-lg hover:shadow-xl p-4 text-center transition-all duration-300 hover:scale-105">
              <div className="w-10 h-10 bg-gradient-to-br from-netsurit-coral/10 to-netsurit-orange/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Heart className="w-5 h-5 text-netsurit-coral" />
              </div>
              <p className="text-xs text-professional-gray-500 font-medium mb-1">Your Connects</p>
              <p className="text-xl font-bold text-professional-gray-900">{currentUser.connects.length}</p>
            </div>
            <div className="group bg-white rounded-2xl border border-professional-gray-200 shadow-lg hover:shadow-xl p-4 text-center transition-all duration-300 hover:scale-105">
              <div className="w-10 h-10 bg-gradient-to-br from-netsurit-orange/10 to-netsurit-red/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-5 h-5 text-netsurit-orange" />
              </div>
              <p className="text-xs text-professional-gray-500 font-medium mb-1">Categories</p>
              <p className="text-xl font-bold text-professional-gray-900">{new Set(currentUser.dreamBook.map(d=>d.category)).size}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Sticky Filters */}
      <div className="sticky top-2 z-20 bg-gradient-to-b from-white via-white to-white/95 backdrop-blur-sm pt-4 pb-6 border-b border-professional-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <span className="text-sm font-semibold text-professional-gray-700 mr-2">Categories:</span>
            {categoryPills.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                  categoryFilter === c 
                    ? 'bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white border-netsurit-red shadow-lg hover:shadow-xl transform hover:scale-105' 
                    : 'bg-white text-professional-gray-700 border-professional-gray-300 hover:bg-professional-gray-50 hover:border-professional-gray-400 hover:shadow-md'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-professional-gray-500" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-4 py-2 border border-professional-gray-300 rounded-xl text-sm font-medium bg-white text-professional-gray-700 hover:border-professional-gray-400 focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <option>All Locations</option>
              <option>Cape Town</option>
              <option>Johannesburg</option>
              <option>New York</option>
              <option>Remote</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suggested Connections */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-professional-gray-900 mb-2">
              Suggested Dream Connections
            </h2>
            <p className="text-professional-gray-600">
              {filteredConnections.length > 0 
                ? `${filteredConnections.length} colleague${filteredConnections.length !== 1 ? 's' : ''} match${filteredConnections.length === 1 ? 'es' : ''} your interests`
                : 'No matches found for current filters'
              }
            </p>
          </div>
          {filteredConnections.length > 0 && (
            <div className="text-sm text-professional-gray-500">
              Sorted by compatibility
            </div>
          )}
        </div>
        
        {filteredConnections.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-professional-gray-50 rounded-2xl border border-professional-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-professional-gray-100 to-professional-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-professional-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-professional-gray-900 mb-3">
              No suggestions available
            </h3>
            <p className="text-professional-gray-600 max-w-md mx-auto leading-relaxed">
              Complete your Dream Book or adjust your filters to get personalized connection suggestions!
            </p>
            <button 
              onClick={() => setCategoryFilter('All')}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredConnections.map((user) => (
              <ConnectionCard
                key={user.id}
                user={user}
                currentUserCategories={[...new Set(currentUser.dreamBook.map(d=>d.category))]}
                onConnect={() => handleConnectRequest(user)}
                onPreview={() => handlePreview(user)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Connects */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-professional-gray-900 mb-2">
              Your Recent Connects
            </h2>
            <p className="text-professional-gray-600">
              {currentUser.connects.length > 0 
                ? `${currentUser.connects.length} connection${currentUser.connects.length !== 1 ? 's' : ''} made`
                : 'Start building your dream network'
              }
            </p>
          </div>
          {currentUser.connects.length > 0 && (
            <div className="text-sm text-professional-gray-500">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {currentUser.connects.map((connect) => (
              <div key={connect.id} className="group bg-white rounded-2xl border border-professional-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 p-6 hover:scale-[1.02] hover:border-netsurit-red/20">
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-netsurit-red/10 to-netsurit-coral/10 rounded-full flex items-center justify-center ring-2 ring-white shadow-lg">
                      <Users className="w-7 h-7 text-netsurit-red" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-netsurit-coral border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-professional-gray-900 group-hover:text-netsurit-red transition-colors duration-200 truncate">
                      {connect.withWhom}
                    </h3>
                    <p className="text-sm text-professional-gray-600 mt-2 line-clamp-2 leading-relaxed">
                      {connect.notes}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Calendar className="w-4 h-4 text-professional-gray-400" />
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
                        className="w-16 h-16 rounded-xl object-cover shadow-lg ring-2 ring-white group-hover:ring-netsurit-red/20 transition-all duration-300"
                      />
                    </div>
                  )}
                </div>
                
                {/* Connect Actions */}
                <div className="mt-4 pt-4 border-t border-professional-gray-100 flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-professional-gray-50 hover:bg-professional-gray-100 text-professional-gray-700 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </button>
                  <button className="flex-1 px-4 py-2 bg-gradient-to-r from-netsurit-red/10 to-netsurit-coral/10 hover:from-netsurit-red/20 hover:to-netsurit-coral/20 text-netsurit-red rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4" />
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
                        className="px-2 py-1 bg-gradient-to-r from-netsurit-red/10 to-netsurit-coral/10 text-netsurit-red text-xs font-semibold rounded-full border border-netsurit-red/20"
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
    const denom = user.dreamCategories?.length || 1;
    const pct = Math.round((user.sharedCategories.length / denom) * 100);
    return Math.min(100, Math.max(30, pct));
  })();
  const categoriesToShow = (user.sharedCategories && user.sharedCategories.length > 0)
    ? user.sharedCategories
    : (user.dreamCategories || []);
  const limitedCategories = categoriesToShow.slice(0, 3);
  const remainingCount = Math.max(0, categoriesToShow.length - limitedCategories.length);
  
  return (
    <div
      className="group relative rounded-2xl border border-professional-gray-200 bg-white shadow-lg hover:shadow-2xl transition-all duration-300 p-6 flex flex-col cursor-pointer hover:scale-[1.02] hover:border-netsurit-red/20 overflow-hidden"
      onClick={() => onPreview()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPreview(); } }}
    >
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-netsurit-red/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Header Section */}
      <div className="relative flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-lg group-hover:ring-netsurit-red/20 transition-all duration-300"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff&size=100`;
              }}
            />
            {/* Online Status Indicator */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-netsurit-coral border-2 border-white rounded-full"></div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-lg text-professional-gray-900 truncate group-hover:text-netsurit-red transition-colors duration-200">{user.name}</h3>
            <p className="text-sm text-professional-gray-600 flex items-center mt-1">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{user.office}</span>
            </p>
          </div>
        </div>
        
        {/* Match Badge & Menu */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-netsurit-red/10 to-netsurit-coral/10 text-netsurit-red border border-netsurit-red/20 shadow-sm">
              {matchPercent}% Match
            </span>
          </div>
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setMenuOpen(v=>!v); }} 
              className="p-2 rounded-full hover:bg-professional-gray-100 group-hover:bg-white/50 transition-all duration-200 opacity-60 group-hover:opacity-100"
            >
              <MoreVertical className="w-4 h-4 text-professional-gray-500" />
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
      <div className="relative mb-5">
        <div className="flex flex-wrap gap-2">
          {limitedCategories.map((category) => (
            <span 
              key={category} 
              className="px-3 py-1 bg-gradient-to-r from-netsurit-red/10 to-netsurit-coral/10 text-netsurit-red text-xs font-semibold rounded-full border border-netsurit-red/20 hover:from-netsurit-red/20 hover:to-netsurit-coral/20 transition-all duration-200"
            >
              {category}
            </span>
          ))}
          {remainingCount > 0 && (
            <span className="px-3 py-1 bg-professional-gray-100 text-professional-gray-600 text-xs font-medium rounded-full border border-professional-gray-200">
              +{remainingCount} more
            </span>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative flex items-center justify-between text-sm mb-5">
        <div className="flex items-center gap-1 text-professional-gray-600 hover:text-netsurit-red transition-colors duration-200">
          <BookOpen className="w-4 h-4" />
          <span className="font-medium">{user.dreamsCount}</span>
          <span className="text-xs">dreams</span>
        </div>
        <div className="flex items-center gap-1 text-professional-gray-600 hover:text-netsurit-red transition-colors duration-200">
          <Heart className="w-4 h-4" />
          <span className="font-medium">{user.connectsCount}</span>
          <span className="text-xs">connects</span>
        </div>
        <div className="flex items-center gap-1 text-professional-gray-600 hover:text-netsurit-red transition-colors duration-200">
          <Award className="w-4 h-4" />
          <span className="font-medium">{user.score}</span>
          <span className="text-xs">score</span>
        </div>
      </div>

      {/* Recent Dream */}
      {user.latestDreamTitle && (
        <div className="relative mb-5 p-3 bg-professional-gray-50 rounded-lg border border-professional-gray-100">
          <p className="text-xs text-professional-gray-500 mb-1">Latest Dream:</p>
          <p className="text-sm font-medium text-professional-gray-800 truncate">{user.latestDreamTitle}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="relative flex gap-3 mt-auto">
        <button
          onClick={(e) => { e.stopPropagation(); onConnect(); }}
          className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-semibold text-sm"
        >
          <Users className="w-4 h-4 mr-2" />
          <span>Connect</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onPreview(); }}
          className="px-4 py-3 bg-white text-professional-gray-700 border border-professional-gray-300 rounded-xl hover:bg-professional-gray-50 hover:border-professional-gray-400 focus:outline-none focus:ring-2 focus:ring-professional-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm"
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
  const dreams = (user.sampleDreams && user.sampleDreams.length > 0)
    ? user.sampleDreams.slice(0, 6).map((d, idx) => ({
        id: idx + 1,
        title: d.title,
        category: d.category,
        image: d.image,
      }))
    : (user.dreamCategories || []).slice(0, 6).map((c, idx) => ({
        id: idx + 1,
        title: sampleTitleByCategory(c),
        category: c,
        image: `https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=600&q=60`,
      }));
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
                    className="px-2 py-1 bg-gradient-to-r from-netsurit-red/10 to-netsurit-coral/10 text-netsurit-red text-xs font-semibold rounded-full border border-netsurit-red/20"
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
                    <p className="text-xs text-professional-gray-500 line-clamp-2 leading-relaxed">
                      Sample description showcasing this dream's potential journey and goals.
                    </p>
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