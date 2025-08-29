import React, { useState } from 'react';
import { 
  User, 
  Target, 
  TrendingUp, 
  Award, 
  Briefcase,
  Calendar,
  MapPin,
  ExternalLink,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import CareerTrackerModal from '../components/CareerTrackerModal';

const CareerBook = () => {
  const { currentUser, updateCareerGoal, updateDevelopmentPlan } = useApp();
  const [activeTab, setActiveTab] = useState('my-career');
  const [viewingItem, setViewingItem] = useState(null);
  const [viewingType, setViewingType] = useState(null); // 'goal' or 'development'

  const tabs = [
    { id: 'my-career', name: 'My Career', icon: User },
    { id: 'career-goals', name: 'Career Goals', icon: Target },
    { id: 'development-plan', name: 'Development Plan', icon: TrendingUp },
    { id: 'my-skills', name: 'My Skills', icon: Award },
  ];

  const isActiveTab = (tabId) => activeTab === tabId;

  const handleViewItem = (item, type) => {
    setViewingItem(item);
    setViewingType(type);
  };

  const handleCloseModal = () => {
    setViewingItem(null);
    setViewingType(null);
  };

  const handleUpdateItem = (updatedItem, type) => {
    if (type === 'goal') {
      updateCareerGoal(updatedItem);
    } else {
      updateDevelopmentPlan(updatedItem);
    }
    setViewingItem(null);
    setViewingType(null);
  };

  if (!currentUser) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dream-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Career Book...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-3 sm:space-y-3">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl px-3 py-2 shadow-sm border border-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-1">
              Career Book 💼
            </h1>
            <p className="text-xs text-gray-500">
              Track your career journey, goals, and professional development
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-0" aria-label="Career Book Tabs">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActiveTab(tab.id)
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
        <div className="p-4">
          {activeTab === 'my-career' && <MyCareerTab currentUser={currentUser} />}
          {activeTab === 'career-goals' && <CareerGoalsTab currentUser={currentUser} onViewItem={handleViewItem} />}
          {activeTab === 'development-plan' && <DevelopmentPlanTab currentUser={currentUser} onViewItem={handleViewItem} />}
          {activeTab === 'my-skills' && <MySkillsTab />}
        </div>
      </div>

      {/* Career Tracker Modal */}
      {viewingItem && (
        <CareerTrackerModal
          careerItem={viewingItem}
          type={viewingType}
          onClose={handleCloseModal}
          onUpdate={handleUpdateItem}
        />
      )}
    </div>
  );
};

// My Career Tab Component
const MyCareerTab = ({ currentUser }) => {
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-1">My Career Profile</h2>
        <p className="text-sm text-gray-600">Track your current role, experience, and career highlights</p>
      </div>

      {/* Current Role Section */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
          <Briefcase className="w-4 h-4 mr-2 text-gray-600" />
          Current Role
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Job Title</label>
            <p className="text-gray-900 bg-white p-2 rounded-md border text-sm">Senior Software Developer</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
            <p className="text-gray-900 bg-white p-2 rounded-md border text-sm">Engineering</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
            <p className="text-gray-900 bg-white p-2 rounded-md border flex items-center text-sm">
              <Calendar className="w-3 h-3 mr-2 text-gray-500" />
              March 2022
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
            <p className="text-gray-900 bg-white p-2 rounded-md border flex items-center text-sm">
              <MapPin className="w-3 h-3 mr-2 text-gray-500" />
              Cape Town, South Africa
            </p>
          </div>
        </div>
      </div>

      {/* Aspirations */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
        <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
          <Target className="w-4 h-4 mr-2 text-purple-600" />
          My Aspirations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Desired Job Title</label>
            <p className="text-gray-900 bg-white p-2 rounded-md border text-sm">Technical Lead / Engineering Manager</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Department</label>
            <p className="text-gray-900 bg-white p-2 rounded-md border text-sm">Engineering / Product Development</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Interested in Relocation</label>
            <p className="text-gray-900 bg-white p-2 rounded-md border text-sm flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Yes, open to opportunities
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Geography</label>
            <p className="text-gray-900 bg-white p-2 rounded-md border text-sm">Europe, North America, Remote</p>
          </div>
        </div>
      </div>

      {/* Career Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* What I Want to Do */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
            <Target className="w-4 h-4 mr-2 text-gray-600" />
            What I Want to Do
          </h3>
          <div className="space-y-2">
            <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
              <p className="text-sm text-gray-800">Lead technical architecture decisions</p>
            </div>
            <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
              <p className="text-sm text-gray-800">Mentor junior developers</p>
            </div>
            <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
              <p className="text-sm text-gray-800">Work on innovative projects</p>
            </div>
            <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
              <p className="text-sm text-gray-800">Collaborate with cross-functional teams</p>
            </div>
          </div>
        </div>

        {/* What I Don't Want to Do */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
            <X className="w-4 h-4 mr-2 text-gray-600" />
            What I Don't Want to Do
          </h3>
          <div className="space-y-2">
            <div className="bg-gray-100 p-2 rounded-md border border-gray-200">
              <p className="text-sm text-gray-800">Repetitive maintenance tasks</p>
            </div>
            <div className="bg-gray-100 p-2 rounded-md border border-gray-200">
              <p className="text-sm text-gray-800">Work in isolation without team interaction</p>
            </div>
            <div className="bg-gray-100 p-2 rounded-md border border-gray-200">
              <p className="text-sm text-gray-800">Focus solely on legacy system support</p>
            </div>
            <div className="bg-gray-100 p-2 rounded-md border border-gray-200">
              <p className="text-sm text-gray-800">Excessive overtime or weekend work</p>
            </div>
          </div>
        </div>

        {/* Motivators */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
          <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-purple-600" />
            What Motivates Me
          </h3>
          <div className="space-y-2">
            <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
              <p className="text-sm text-gray-800">Learning new technologies</p>
            </div>
            <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
              <p className="text-sm text-gray-800">Solving complex problems</p>
            </div>
            <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
              <p className="text-sm text-gray-800">Making a positive impact</p>
            </div>
            <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
              <p className="text-sm text-gray-800">Recognition for good work</p>
            </div>
          </div>
        </div>
      </div>

      {/* Career Highlights */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Career Highlights</h3>
        <div className="space-y-2">
          <div className="p-2 bg-gray-50 rounded-md">
            <h4 className="font-medium text-gray-900 text-sm">Led Team Migration Project</h4>
            <p className="text-sm text-gray-600 mt-1">Successfully migrated legacy systems to cloud infrastructure, improving performance by 40%</p>
            <p className="text-xs text-gray-500 mt-1">Q2 2023</p>
          </div>
          <div className="p-2 bg-gray-50 rounded-md">
            <h4 className="font-medium text-gray-900 text-sm">Mentorship Excellence Award</h4>
            <p className="text-sm text-gray-600 mt-1">Recognized for outstanding mentorship of junior developers</p>
            <p className="text-xs text-gray-500 mt-1">Q4 2022</p>
          </div>
          <div className="p-2 bg-gray-50 rounded-md">
            <h4 className="font-medium text-gray-900 text-sm">Innovation Champion</h4>
            <p className="text-sm text-gray-600 mt-1">Implemented automated testing framework, reducing deployment time by 60%</p>
            <p className="text-xs text-gray-500 mt-1">Q1 2023</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Career Goals Tab Component
const CareerGoalsTab = ({ currentUser, onViewItem }) => {
  const careerGoals = currentUser?.careerGoals || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Planned':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTargetDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short'
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Career Goals</h2>
        <p className="text-sm text-gray-600">Define and track your professional aspirations and objectives</p>
      </div>

      {/* Career Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {careerGoals.map((goal) => (
          <div 
            key={goal.id} 
            className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onViewItem(goal, 'goal')}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900 text-sm flex-1">{goal.title}</h4>
              <span className={`px-2 py-1 text-xs rounded-full ml-2 ${getStatusColor(goal.status)}`}>
                {goal.status}
              </span>
            </div>
            
            <p className="text-xs text-gray-600 mb-3 line-clamp-2">{goal.description}</p>
            
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{goal.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="w-3 h-3 mr-1" />
                <span>Target: {formatTargetDate(goal.targetDate)}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onViewItem(goal, 'goal');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {careerGoals.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No career goals yet. Start by adding your first career goal!</p>
        </div>
      )}
    </div>
  );
};

// Development Plan Tab Component
const DevelopmentPlanTab = ({ currentUser, onViewItem }) => {
  const developmentPlan = currentUser?.developmentPlan || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Planned':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTargetDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short'
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Development Plan</h2>
        <p className="text-sm text-gray-600">Chart your learning path and professional growth activities</p>
      </div>

      {/* Development Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {developmentPlan.map((item) => (
          <div 
            key={item.id} 
            className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onViewItem(item, 'development')}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900 text-sm flex-1">{item.title}</h4>
              <span className={`px-2 py-1 text-xs rounded-full ml-2 ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
            </div>
            
            <p className="text-xs text-gray-600 mb-3 line-clamp-2">{item.description}</p>
            
            {/* Skills */}
            {item.skills && item.skills.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {item.skills.slice(0, 3).map((skill, index) => (
                    <span key={index} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                  {item.skills.length > 3 && (
                    <span className="text-xs text-gray-500">+{item.skills.length - 3} more</span>
                  )}
                </div>
              </div>
            )}
            
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{item.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-green-600 h-1 rounded-full transition-all duration-300" 
                  style={{ width: `${item.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="w-3 h-3 mr-1" />
                <span>Target: {formatTargetDate(item.targetDate)}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onViewItem(item, 'development');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {developmentPlan.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No development plans yet. Start by adding your first learning activity!</p>
        </div>
      )}
    </div>
  );
};

// My Skills Tab Component
const MySkillsTab = () => {
  const technicalSkills = [
    { name: 'JavaScript/TypeScript', level: 90, category: 'Programming' },
    { name: 'React/Vue.js', level: 85, category: 'Frontend' },
    { name: 'Node.js', level: 80, category: 'Backend' },
    { name: 'Python', level: 75, category: 'Programming' },
    { name: 'AWS/Cloud', level: 70, category: 'Infrastructure' },
    { name: 'Docker/Kubernetes', level: 65, category: 'DevOps' },
  ];

  const softSkills = [
    { name: 'Team Leadership', level: 80 },
    { name: 'Communication', level: 85 },
    { name: 'Problem Solving', level: 90 },
    { name: 'Project Management', level: 75 },
    { name: 'Mentoring', level: 80 },
    { name: 'Public Speaking', level: 60 },
  ];

  const getSkillColor = (level) => {
    if (level >= 80) return 'bg-green-500';
    if (level >= 60) return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-1">My Skills</h2>
        <p className="text-sm text-gray-600">Track your technical and soft skills proficiency levels</p>
      </div>

      {/* Technical Skills */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
          <Award className="w-4 h-4 mr-2 text-gray-600" />
          Technical Skills
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {technicalSkills.map((skill, index) => (
            <div key={index} className="bg-white p-2 rounded-md border border-gray-200">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-gray-900 text-sm">{skill.name}</span>
                <span className="text-xs text-gray-600">{skill.level}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1 mb-1">
                <div 
                  className={`h-1 rounded-full ${getSkillColor(skill.level)}`}
                  style={{ width: `${skill.level}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500">{skill.category}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Soft Skills */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
          <User className="w-4 h-4 mr-2 text-gray-600" />
          Soft Skills
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {softSkills.map((skill, index) => (
            <div key={index} className="bg-white p-2 rounded-md border border-gray-200">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-gray-900 text-sm">{skill.name}</span>
                <span className="text-xs text-gray-600">{skill.level}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full ${getSkillColor(skill.level)}`}
                  style={{ width: `${skill.level}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills Development Goals */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Skills Development Goals</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-md border border-yellow-200">
            <span className="text-gray-900 text-sm">Improve Machine Learning skills</span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Target: 70%</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md border border-gray-200">
            <span className="text-gray-900 text-sm">Enhance Public Speaking confidence</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Target: 80%</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-green-50 rounded-md border border-green-200">
            <span className="text-gray-900 text-sm">Master Kubernetes orchestration</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Target: 85%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerBook;
