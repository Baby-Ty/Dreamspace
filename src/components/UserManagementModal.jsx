
import { useState } from 'react';
import { 
  X, 
  User, 
  BookOpen, 
  Users, 
  MapPin,
  Mail
} from 'lucide-react';
import DreamTrackerModal from './DreamTrackerModal';
import FlagIcon from './FlagIcon';
import { getCountryCode } from '../utils/regionUtils';

// Import extracted tab components
import {
  OverviewTab,
  DreamsTab,
  ConnectsTab
} from './user-management';

const UserManagementModal = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Nested modal state
  const [selectedDream, setSelectedDream] = useState(null);

  if (!user) return null;

  const handleOpenDreamModal = (dream) => {
    setSelectedDream(dream);
  };

  const handleCloseDreamModal = () => {
    setSelectedDream(null);
  };

  const handleUpdateDream = (updatedDream) => {
    setSelectedDream(updatedDream);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'dreams', name: 'Dreams', icon: BookOpen },
    { id: 'connects', name: 'Connects', icon: Users },
  ];

  const isActiveTab = (tabId) => activeTab === tabId;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[1000]">
      <div className="relative bg-white rounded-2xl border border-professional-gray-200 shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-netsurit-red to-netsurit-coral p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-white object-cover flex-shrink-0"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=EC4B5C&color=fff&size=100`;
                }}
              />
              <div className="text-white min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-white">{user.name}</h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-white/80">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    <FlagIcon countryCode={getCountryCode(user.office)} className="w-4 h-4 mr-1" />
                    <span className="text-sm">{user.office}</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="self-end sm:self-auto p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-professional-gray-50 border-b border-professional-gray-200 px-4 sm:px-6">
          <nav className="flex space-x-1 overflow-x-auto py-2" aria-label="User management tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    isActiveTab(tab.id)
                      ? 'bg-netsurit-red text-white shadow-md'
                      : 'text-professional-gray-700 hover:bg-professional-gray-200 hover:text-professional-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && <OverviewTab user={user} />}
          {activeTab === 'dreams' && <DreamsTab user={user} onOpenDreamModal={handleOpenDreamModal} />}
          {activeTab === 'connects' && <ConnectsTab user={user} />}
        </div>

        {/* Nested Dream Tracker Modal */}
        {selectedDream && (
          <DreamTrackerModal
            dream={selectedDream}
            onClose={handleCloseDreamModal}
            onUpdateDream={handleUpdateDream}
            isReadOnly={true}
          />
        )}
      </div>
    </div>
  );
};

export default UserManagementModal;