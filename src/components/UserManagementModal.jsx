import React, { useState } from 'react';
import { 
  X, 
  User, 
  Target, 
  BookOpen, 
  TrendingUp, 
  Award, 
  Users, 
  MapPin,
  Mail,
  Calendar,
  CheckCircle2,
  Circle,
  ExternalLink,
  Eye,
  Edit3,
  Star
} from 'lucide-react';
import DreamTrackerModal from './DreamTrackerModal';
import CareerTrackerModal from './CareerTrackerModal';

const UserManagementModal = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Nested modal state
  const [selectedDream, setSelectedDream] = useState(null);
  const [selectedCareerItem, setSelectedCareerItem] = useState(null);
  const [careerItemType, setCareerItemType] = useState(null);

  if (!user) return null;

  const handleOpenDreamModal = (dream) => {
    setSelectedDream(dream);
  };

  const handleCloseDreamModal = () => {
    setSelectedDream(null);
  };

  const handleOpenCareerModal = (item, type) => {
    setSelectedCareerItem(item);
    setCareerItemType(type);
  };

  const handleCloseCareerModal = () => {
    setSelectedCareerItem(null);
    setCareerItemType(null);
  };

  const handleUpdateDream = (updatedDream) => {
    // For admin view, we could potentially sync this back to the user data
    // For now, just close the modal
    setSelectedDream(updatedDream);
  };

  const handleUpdateCareerItem = (updatedItem, type) => {
    // For admin view, we could potentially sync this back to the user data
    // For now, just close the modal
    setSelectedCareerItem(null);
    setCareerItemType(null);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'dreams', name: 'Dreams', icon: BookOpen },
    { id: 'career-goals', name: 'Career Goals', icon: Target },
    { id: 'development', name: 'Development', icon: TrendingUp },
    { id: 'skills', name: 'Skills', icon: Award },
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
                    <span className="text-sm">{user.office}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-lg text-sm font-medium">
                    Score: {user.score} pts
                  </span>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-lg text-sm font-medium">
                    {user.dreamsCount} Dreams
                  </span>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-lg text-sm font-medium">
                    {user.connectsCount} Connects
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="self-start sm:self-center p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-professional-gray-200 bg-professional-gray-50">
          <nav className="flex space-x-0" aria-label="User Management Tabs">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-3 py-3 text-sm font-medium transition-all duration-200 ${
                    isActiveTab(tab.id)
                      ? 'bg-white text-netsurit-red border-b-2 border-netsurit-red'
                      : 'text-professional-gray-600 hover:text-professional-gray-900 hover:bg-professional-gray-100'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && <OverviewTab user={user} />}
          {activeTab === 'dreams' && <DreamsTab user={user} onOpenDreamModal={handleOpenDreamModal} />}
          {activeTab === 'career-goals' && <CareerGoalsTab user={user} onOpenCareerModal={handleOpenCareerModal} />}
          {activeTab === 'development' && <DevelopmentTab user={user} onOpenCareerModal={handleOpenCareerModal} />}
          {activeTab === 'skills' && <SkillsTab user={user} />}
          {activeTab === 'connects' && <ConnectsTab user={user} />}
        </div>
        
        {/* Nested Modals */}
        {selectedDream && (
          <DreamTrackerModal
            dream={selectedDream}
            onClose={handleCloseDreamModal}
            onUpdate={handleUpdateDream}
          />
        )}
        
        {selectedCareerItem && (
          <CareerTrackerModal
            careerItem={selectedCareerItem}
            type={careerItemType}
            onClose={handleCloseCareerModal}
            onUpdate={handleUpdateCareerItem}
          />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ user }) => {
  return (
    <div className="space-y-4 sm:space-y-5">
      <h3 className="text-xl sm:text-2xl font-bold text-professional-gray-900">User Overview</h3>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="p-3 bg-netsurit-light-coral/20 rounded-xl">
                <BookOpen className="w-8 h-8 text-netsurit-red" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-professional-gray-600">Active Dreams</p>
                <p className="text-2xl font-bold text-professional-gray-900">{user.dreamsCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="p-3 bg-netsurit-coral/20 rounded-xl">
                <Users className="w-8 h-8 text-netsurit-coral" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-professional-gray-600">Connections</p>
                <p className="text-2xl font-bold text-professional-gray-900">{user.connectsCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="p-3 bg-netsurit-orange/20 rounded-xl">
                <Star className="w-8 h-8 text-netsurit-orange" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-professional-gray-600">Total Score</p>
                <p className="text-2xl font-bold text-professional-gray-900">{user.score || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dream Categories */}
      <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl">
        <div className="p-4 sm:p-5 border-b border-professional-gray-200 bg-professional-gray-50">
          <h4 className="text-lg font-bold text-professional-gray-900">Dream Categories</h4>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            {user.dreamCategories?.map((category) => (
              <span
                key={category}
                className="px-3 py-1 bg-professional-gray-100 text-professional-gray-700 text-sm rounded-lg font-medium"
              >
                {category}
              </span>
            )) || <span className="text-professional-gray-500">No categories yet</span>}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl">
        <div className="p-4 sm:p-5 border-b border-professional-gray-200 bg-professional-gray-50">
          <h4 className="text-lg font-bold text-professional-gray-900">Recent Activity</h4>
        </div>
        <div className="p-4 sm:p-5">
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm text-professional-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Last login: {new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-professional-gray-600">
              <BookOpen className="w-4 h-4" />
              <span>Latest dream: {user.latestDreamTitle || 'No dreams yet'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dreams Tab Component
const DreamsTab = ({ user, onOpenDreamModal }) => {
  const dreams = user.sampleDreams || [];

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl sm:text-2xl font-bold text-professional-gray-900">Dream Book</h3>
        <span className="text-sm text-professional-gray-600">{dreams.length} dreams</span>
      </div>

      {dreams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {dreams.map((dream, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden"
              onClick={() => onOpenDreamModal(dream)}
            >
              <img
                src={dream.image}
                alt={dream.title}
                className="w-full h-32 object-cover"
              />
              <div className="p-4 sm:p-5">
                <h4 className="font-bold text-professional-gray-900 mb-2">{dream.title}</h4>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-professional-gray-100 text-professional-gray-700 text-xs rounded-lg font-medium">
                    {dream.category}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDreamModal(dream);
                    }}
                    className="text-netsurit-red hover:text-netsurit-coral text-sm font-medium flex items-center transition-colors duration-200"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-professional-gray-300" />
          <p className="text-professional-gray-500">No dreams created yet</p>
        </div>
      )}
    </div>
  );
};

// Career Goals Tab Component
const CareerGoalsTab = ({ user, onOpenCareerModal }) => {
  const careerGoals = user.careerGoals || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress':
        return 'bg-netsurit-warm-orange/20 text-netsurit-orange';
      case 'Planned':
        return 'bg-netsurit-light-coral/20 text-netsurit-coral';
      case 'Completed':
        return 'bg-netsurit-red/20 text-netsurit-red';
      default:
        return 'bg-professional-gray-100 text-professional-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Career Goals</h3>
        <span className="text-sm text-gray-600">{careerGoals.length} goals</span>
      </div>

      <div className="space-y-4">
        {careerGoals.map((goal) => (
          <div 
            key={goal.id} 
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onOpenCareerModal(goal, 'goal')}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900">{goal.title}</h4>
                {goal.description && (
                  <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                )}
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(goal.status)}`}>
                    {goal.status}
                  </span>
                  <span className="text-sm text-gray-600">
                    Target: {new Date(goal.targetDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCareerModal(goal, 'goal');
                }}
                className="text-netsurit-red hover:text-netsurit-coral text-sm font-medium flex items-center"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Edit
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-professional-gray-600 mb-1">
                <span>Progress</span>
                <span>{goal.progress}%</span>
              </div>
              <div className="w-full bg-professional-gray-200 rounded-full h-3 shadow-inner border border-professional-gray-300">
                <div 
                  className="bg-gradient-to-r from-netsurit-red to-netsurit-coral h-3 rounded-full transition-all duration-700 ease-out shadow-lg relative overflow-hidden" 
                  style={{ width: `${goal.progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Development Tab Component
const DevelopmentTab = ({ user, onOpenCareerModal }) => {
  const developmentPlan = user.developmentPlan || [];

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl sm:text-2xl font-bold text-professional-gray-900">Development Plan</h3>
        <span className="text-sm text-professional-gray-600">{developmentPlan.length} activities</span>
      </div>

      <div className="space-y-4">
        {developmentPlan.map((item) => (
          <div 
            key={item.id} 
            className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer"
            onClick={() => onOpenCareerModal(item, 'development')}
          >
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-professional-gray-900">{item.title}</h4>
                  {item.description && (
                    <p className="text-sm text-professional-gray-600 mt-1">{item.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.skills?.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-netsurit-light-coral/20 text-netsurit-red text-xs rounded-lg font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-netsurit-warm-orange/20 text-netsurit-orange text-xs rounded-lg font-medium">
                    {item.status}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCareerModal(item, 'development');
                    }}
                    className="text-netsurit-red hover:text-netsurit-coral text-sm font-medium flex items-center transition-colors duration-200"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm text-professional-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{item.progress}%</span>
                </div>
                <div className="w-full bg-professional-gray-200 rounded-full h-3 shadow-inner border border-professional-gray-300">
                  <div 
                    className="bg-gradient-to-r from-netsurit-red to-netsurit-coral h-3 rounded-full transition-all duration-700 ease-out shadow-lg relative overflow-hidden" 
                    style={{ width: `${item.progress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Skills Tab Component
const SkillsTab = ({ user }) => {
  // Mock skills data
  const technicalSkills = [
    { name: 'JavaScript', level: 85, category: 'Programming' },
    { name: 'React', level: 80, category: 'Frontend' },
    { name: 'Node.js', level: 75, category: 'Backend' },
    { name: 'AWS', level: 70, category: 'Cloud' }
  ];

  const softSkills = [
    { name: 'Communication', level: 90 },
    { name: 'Leadership', level: 75 },
    { name: 'Problem Solving', level: 85 },
    { name: 'Teamwork', level: 88 }
  ];

  const getSkillColor = (level) => {
    if (level >= 80) return 'bg-gradient-to-r from-netsurit-red to-netsurit-coral';
    if (level >= 60) return 'bg-gradient-to-r from-netsurit-coral to-netsurit-orange';
    return 'bg-gradient-to-r from-netsurit-orange to-netsurit-warm-orange';
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <h3 className="text-xl sm:text-2xl font-bold text-professional-gray-900">Skills Assessment</h3>

      {/* Technical Skills */}
      <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl">
        <div className="p-4 sm:p-5 border-b border-professional-gray-200 bg-professional-gray-50">
          <h4 className="text-lg font-bold text-professional-gray-900">Technical Skills</h4>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {technicalSkills.map((skill, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-professional-gray-900">{skill.name}</span>
                  <span className="text-sm text-professional-gray-600">{skill.level}%</span>
                </div>
                <div className="w-full bg-professional-gray-200 rounded-full h-3 shadow-inner border border-professional-gray-300">
                  <div 
                    className={`h-3 rounded-full transition-all duration-700 ease-out shadow-lg ${getSkillColor(skill.level)}`}
                    style={{ width: `${skill.level}%` }}
                  ></div>
                </div>
                <span className="text-xs text-professional-gray-500">{skill.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Soft Skills */}
      <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl">
        <div className="p-4 sm:p-5 border-b border-professional-gray-200 bg-professional-gray-50">
          <h4 className="text-lg font-bold text-professional-gray-900">Soft Skills</h4>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {softSkills.map((skill, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-professional-gray-900">{skill.name}</span>
                  <span className="text-sm text-professional-gray-600">{skill.level}%</span>
                </div>
                <div className="w-full bg-professional-gray-200 rounded-full h-3 shadow-inner border border-professional-gray-300">
                  <div 
                    className={`h-3 rounded-full transition-all duration-700 ease-out shadow-lg ${getSkillColor(skill.level)}`}
                    style={{ width: `${skill.level}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Connects Tab Component
const ConnectsTab = ({ user }) => {
  const connects = user.connects || [];

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl sm:text-2xl font-bold text-professional-gray-900">Dream Connects</h3>
        <span className="text-sm text-professional-gray-600">{connects.length} connections</span>
      </div>

      {connects.length > 0 ? (
        <div className="space-y-4">
          {connects.map((connect) => (
            <div key={connect.id} className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="p-4 sm:p-5">
                <div className="flex items-start space-x-4">
                  <img
                    src={connect.avatar}
                    alt={connect.withWhom}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-professional-gray-900">{connect.withWhom}</h4>
                      <span className="text-sm text-professional-gray-600">{new Date(connect.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-professional-gray-600 mt-2">{connect.notes}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto mb-4 text-professional-gray-300" />
          <p className="text-professional-gray-500">No connections yet</p>
        </div>
      )}
    </div>
  );
};

export default UserManagementModal;
