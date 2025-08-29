import React, { useState } from 'react';
import { Users, MapPin, Heart, MessageCircle, Calendar, Camera, X, Send, Award, BookOpen, MoreVertical } from 'lucide-react';
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
      {/* Compact Header with KPIs */}
      <div className="bg-gradient-to-r from-purple-100 via-blue-50 to-pink-100 rounded-xl px-3 py-2 shadow-sm border border-white/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-1">Dream Connect 🤝</h1>
            <p className="text-xs text-gray-500">Find colleagues with shared dream categories and learn from each other.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <div className="bg-white rounded-xl border p-2 text-center">
              <p className="text-xs text-gray-500">Suggested</p>
              <p className="text-base font-semibold text-gray-900">{filteredConnections.length}</p>
            </div>
            <div className="bg-white rounded-xl border p-2 text-center">
              <p className="text-xs text-gray-500">Your Connects</p>
              <p className="text-base font-semibold text-gray-900">{currentUser.connects.length}</p>
            </div>
            <div className="bg-white rounded-xl border p-2 text-center">
              <p className="text-xs text-gray-500">Categories</p>
              <p className="text-base font-semibold text-gray-900">{new Set(currentUser.dreamBook.map(d=>d.category)).size}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Filters */}
      <div className="sticky top-2 z-10 bg-gradient-to-b from-white to-transparent pt-2">
        <div className="flex flex-wrap items-center gap-2">
          {categoryPills.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1 rounded-full text-sm border transition ${categoryFilter === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              {c}
            </button>
          ))}
          <div className="ml-auto">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="input-field h-9 text-sm py-1"
            >
              <option>All</option>
              <option>Cape Town</option>
              <option>Johannesburg</option>
              <option>New York</option>
              <option>Remote</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suggested Connections */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Suggested Dream Connections
        </h2>
        
        {filteredConnections.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No suggestions available
            </h3>
            <p className="text-gray-600">
              Complete your Dream Book to get personalized connection suggestions!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Your Recent Connects
        </h2>
        
        {currentUser.connects.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-12 text-center">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No connects yet
            </h3>
            <p className="text-gray-600">
              Start connecting with colleagues to share your dream journeys!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentUser.connects.map((connect) => (
              <div key={connect.id} className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6 hover:scale-[1.02]">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{connect.withWhom}</h3>
                    <p className="text-sm text-gray-600 mt-1">{connect.notes}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Connected on {new Date(connect.date).toLocaleDateString()}
                    </p>
                  </div>
                  {connect.selfieUrl && (
                    <img
                      src={connect.selfieUrl}
                      alt="Connect selfie"
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connect Request Modal */}
      {showRequestModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Connect with {selectedUser.name}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium text-gray-900">{selectedUser.name}</p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {selectedUser.office}
                  </p>
                </div>
              </div>

              {/* Shared Categories */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Shared interests:
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.sharedCategories.map((category) => (
                    <span
                      key={category}
                      className="px-2 py-1 bg-dream-blue bg-opacity-10 text-dream-blue text-xs rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Optional message:
                </label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="input-field h-20 resize-none"
                  placeholder="Share why you'd like to connect..."
                />
              </div>

              {/* Scheduling Option */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred meeting method:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="teams"
                      checked={schedulingOption === 'teams'}
                      onChange={(e) => setSchedulingOption(e.target.value)}
                      className="mr-2"
                    />
                    <Calendar className="w-4 h-4 mr-1" />
                    Microsoft Teams
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="inperson"
                      checked={schedulingOption === 'inperson'}
                      onChange={(e) => setSchedulingOption(e.target.value)}
                      className="mr-2"
                    />
                    <Users className="w-4 h-4 mr-1" />
                    In Person
                  </label>
                </div>
              </div>

              {/* Selfie Checkbox */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={uploadSelfie}
                    onChange={(e) => setUploadSelfie(e.target.checked)}
                    className="mr-2"
                  />
                  <Camera className="w-4 h-4 mr-1" />
                  <span className="text-sm text-gray-700">
                    I'll upload a selfie after our meeting
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSendRequest}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Request</span>
                </button>
                <button
                  onClick={handleCloseModal}
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                >
                  Cancel
                </button>
              </div>
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
      className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition p-5 flex flex-col cursor-pointer"
      onClick={() => onPreview()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPreview(); } }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-12 h-12 rounded-full object-cover"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff&size=100`;
            }}
          />
          <div className="min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{user.name}</h3>
            <p className="text-sm text-gray-600 flex items-center mt-1">
              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="truncate">{user.office}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">Match {matchPercent}%</span>
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(v=>!v); }} className="p-1 rounded hover:bg-gray-100">
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white border rounded-lg shadow-lg z-10 text-sm">
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={(e)=>e.stopPropagation()}>Message on Teams</button>
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={(e)=>e.stopPropagation()}>Follow</button>
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={(e)=>e.stopPropagation()}>Hide suggestions</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex flex-wrap gap-1">
          {limitedCategories.map((category) => (
            <span key={category} className="px-2 py-1 bg-dream-blue bg-opacity-10 text-dream-blue text-xs rounded-full">{category}</span>
          ))}
          {remainingCount > 0 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">+{remainingCount} more</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <span className="flex items-center gap-1"><BookOpen className="w-4 h-4 text-gray-400" />{user.dreamsCount}</span>
        <span className="flex items-center gap-1"><Heart className="w-4 h-4 text-gray-400" />{user.connectsCount}</span>
        <span className="flex items-center gap-1"><Award className="w-4 h-4 text-gray-400" />{user.score}</span>
      </div>

      {/* Optional recent dream line if available */}
      {user.latestDreamTitle && (
        <p className="text-xs text-gray-500 mb-3 truncate">Recent dream: {user.latestDreamTitle}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-2 mt-auto">
        <button
          onClick={(e) => { e.stopPropagation(); onConnect(); }}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all text-sm"
        >
          <Users className="w-4 h-4 mr-2" />
          <span>Connect</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onPreview(); }}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all text-sm"
        >
          Preview Dreams
        </button>
      </div>
    </div>
  );
};

// Modal for previewing a user's profile summary and a grid of sample dreams
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{user.name} — Dream Preview</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Profile summary */}
          <div className="flex items-start gap-4">
            <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-medium text-gray-900 truncate">{user.name}</span>
                <span className="text-sm text-gray-600 flex items-center"><MapPin className="w-4 h-4 mr-1" />{user.office}</span>
              </div>
              <p className="text-sm text-gray-700 mt-1">{makeBio()}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {(user.dreamCategories || []).map((c) => (
                  <span key={c} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{c}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Dreams grid */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Dreams</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {dreams.map((d) => (
                <div key={d.id} className="rounded-xl border bg-white overflow-hidden">
                  <div className="relative">
                    <div className="w-full h-28 bg-gray-200">
                      <img src={d.image} alt={d.title} className="w-full h-full object-cover" />
                    </div>
                    <span className="absolute top-2 left-2 bg-white px-2 py-1 rounded-full text-xs font-medium">{d.category}</span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{d.title}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">Sample description. This is a preview layout.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connect CTA */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => onConnect(user)}
              className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all text-sm"
            >
              <Users className="w-4 h-4 mr-2" />
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DreamConnect;