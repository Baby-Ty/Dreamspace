import React, { useState, useMemo } from 'react';
import { 
  X, 
  Users2, 
  TrendingUp, 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Target,
  MessageSquare,
  Calendar,
  BarChart3,
  User,
  BookOpen,
  Star,
  Trophy,
  Eye,
  ChevronRight,
  MapPin,
  Mail,
  Activity,
  Heart,
  Briefcase,
  Zap,
  Filter
} from 'lucide-react';
import DreamTrackerModal from './DreamTrackerModal';
import UserManagementModal from './UserManagementModal';

const CoachDetailModal = ({ coach, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);
  const [selectedDream, setSelectedDream] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('score');

  // Use the real team data passed from the parent component
  const teamMetrics = coach.teamMetrics;
  const coachingAlerts = coach.alerts || [];
  const teamNotes = []; // For now, we'll use empty array until we implement coaching notes API

  if (!coach || !teamMetrics) return null;

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'team-members', name: 'Team Members', icon: Users2 },
    { id: 'dreams-progress', name: 'Dreams Progress', icon: Target },
    { id: 'coaching-notes', name: 'Coaching Notes', icon: MessageSquare },
    { id: 'performance', name: 'Performance', icon: TrendingUp },
  ];

  const isActiveTab = (tabId) => activeTab === tabId;

  const getStatusColor = (score) => {
    if (score >= 60) return 'text-professional-gray-700 bg-professional-gray-100 border-professional-gray-300'; // Excelling - Light grey background, darker grey text
    if (score >= 30) return 'text-professional-gray-700 bg-professional-gray-100 border-professional-gray-300'; // On Track - Same grey pill
    return 'text-amber-800 bg-amber-100 border-amber-300'; // Needs Attention - Amber pill
  };

  const getStatusText = (score) => {
    if (score >= 60) return 'Excelling';
    if (score >= 30) return 'On Track';
    return 'Needs Attention';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Health': Heart,
      'Travel': Target,
      'Career': Briefcase,
      'Learning': BookOpen,
      'Creative': Star,
      'Financial': TrendingUp,
      'Relationships': Users2,
      'Adventure': Zap,
      'Spiritual': Award,
      'Community': Users2
    };
    return icons[category] || Target;
  };

  // Filter and sort team members
  const filteredAndSortedMembers = useMemo(() => {
    let filtered = teamMetrics.teamMembers.filter(member => {
      switch (filterStatus) {
        case 'excelling':
          return member.score >= 60;
        case 'on-track':
          return member.score >= 30 && member.score < 60;
        case 'needs-attention':
          return member.score < 30;
        default:
          return true;
      }
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'dreams':
          return (b.dreamsCount || 0) - (a.dreamsCount || 0);
        case 'connects':
          return (b.connectsCount || 0) - (a.connectsCount || 0);
        default: // score
          return (b.score || 0) - (a.score || 0);
      }
    });
  }, [teamMetrics.teamMembers, filterStatus, sortBy]);

  const handleViewTeamMember = (member) => {
    setSelectedTeamMember(member);
    setShowUserModal(true);
  };

  const handleViewDream = (dream, member) => {
    setSelectedDream({ ...dream, teamMember: member });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[1000]">
      <div className="relative bg-white rounded-2xl border border-professional-gray-200 shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-netsurit-red to-netsurit-coral p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <img
                src={coach.avatar}
                alt={coach.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white object-cover flex-shrink-0"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.name)}&background=EC4B5C&color=fff&size=100`;
                }}
              />
              <div className="text-white min-w-0">
                <h1 className="text-xl sm:text-3xl font-bold text-white">{coach.name}</h1>
                <p className="text-base sm:text-xl text-white/80 mb-2">Dream Coach</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-white/80">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    <span className="text-sm">{coach.email}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{coach.office}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-lg text-sm font-medium">
                    Team Size: {teamMetrics.teamSize}
                  </span>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-lg text-sm font-medium">
                    Avg Score: {teamMetrics.averageScore}
                  </span>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-lg text-sm font-medium">
                    Engagement: {teamMetrics.engagementRate}%
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

        {/* Alerts Banner */}
        {coachingAlerts.length > 0 && (
          <div className="bg-netsurit-warm-orange/10 border-b border-netsurit-warm-orange/30 px-6 py-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-netsurit-warm-orange" />
              <span className="text-sm font-medium text-netsurit-orange">
                {coachingAlerts.length} team member(s) need attention
              </span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-professional-gray-200 bg-professional-gray-50">
          <div className="px-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActiveTab(tab.id)
                        ? 'border-netsurit-red text-netsurit-red'
                        : 'border-transparent text-professional-gray-500 hover:text-professional-gray-700 hover:border-professional-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{tab.name}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(95vh-300px)]">
          {activeTab === 'overview' && (
            <OverviewTab 
              coach={coach} 
              teamMetrics={teamMetrics} 
              coachingAlerts={coachingAlerts}
              teamNotes={teamNotes}
            />
          )}
          
          {activeTab === 'team-members' && (
            <TeamMembersTab 
              teamMembers={filteredAndSortedMembers}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onViewMember={handleViewTeamMember}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
            />
          )}
          
          {activeTab === 'dreams-progress' && (
            <DreamsProgressTab 
              teamMembers={teamMetrics.teamMembers}
              onViewDream={handleViewDream}
              getCategoryIcon={getCategoryIcon}
            />
          )}
          
          {activeTab === 'coaching-notes' && (
            <CoachingNotesTab 
              teamNotes={teamNotes}
              teamMembers={teamMetrics.teamMembers}
            />
          )}
          
          {activeTab === 'performance' && (
            <PerformanceTab 
              coach={coach}
              teamMetrics={teamMetrics}
              coachingAlerts={coachingAlerts}
              teamNotes={teamNotes}
            />
          )}
        </div>

        {/* Nested Modals */}
        {showUserModal && selectedTeamMember && (
          <UserManagementModal
            user={selectedTeamMember}
            onClose={() => {
              setShowUserModal(false);
              setSelectedTeamMember(null);
            }}
          />
        )}

        {selectedDream && (
          <DreamTrackerModal
            dream={selectedDream}
            onClose={() => setSelectedDream(null)}
            onUpdate={(updatedDream) => {
              // Handle dream update if needed
              setSelectedDream(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ coach, teamMetrics, coachingAlerts, teamNotes }) => {
  const recentNotes = teamNotes.slice(0, 5);
  const urgentAlerts = coachingAlerts.filter(alert => alert.priority === 'high');

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="p-3 bg-netsurit-light-coral/20 rounded-xl">
                <Users2 className="w-6 h-6 text-netsurit-red" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-professional-gray-600">Team Size</p>
                <p className="text-2xl font-bold text-professional-gray-900">{teamMetrics.teamSize}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="p-3 bg-netsurit-coral/20 rounded-xl">
                <TrendingUp className="w-6 h-6 text-netsurit-coral" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-professional-gray-600">Avg Score</p>
                <p className="text-2xl font-bold text-professional-gray-900">{teamMetrics.averageScore}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="p-3 bg-netsurit-orange/20 rounded-xl">
                <Activity className="w-6 h-6 text-netsurit-orange" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-professional-gray-600">Engagement</p>
                <p className="text-2xl font-bold text-professional-gray-900">{teamMetrics.engagementRate}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="p-3 bg-netsurit-warm-orange/20 rounded-xl">
                <Target className="w-6 h-6 text-netsurit-warm-orange" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-professional-gray-600">Total Dreams</p>
                <p className="text-2xl font-bold text-professional-gray-900">{teamMetrics.totalDreams}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
        {/* Recent Coaching Activity */}
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl">
          <div className="p-4 sm:p-5 border-b border-professional-gray-200 bg-professional-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-professional-gray-900">Recent Coaching Notes</h3>
              <MessageSquare className="w-5 h-5 text-professional-gray-500" />
            </div>
          </div>
          <div className="p-4 sm:p-5">
            {recentNotes.length > 0 ? (
              <div className="space-y-4">
                {recentNotes.map((note) => (
                  <div key={note.id} className="border-l-4 border-netsurit-light-coral pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-professional-gray-900">
                        {teamMetrics.teamMembers.find(u => u.id === note.teamMemberId)?.name || 'Unknown User'}
                      </span>
                      <span className="text-xs text-professional-gray-500">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-professional-gray-600">{note.note}</p>
                    <span className="inline-block mt-1 px-2 py-1 bg-professional-gray-100 text-xs text-professional-gray-600 rounded-lg">
                      {note.type.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-professional-gray-500 text-center py-8">No recent coaching notes</p>
            )}
          </div>
        </div>

        {/* Urgent Alerts */}
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl">
          <div className="p-4 sm:p-5 border-b border-professional-gray-200 bg-professional-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-professional-gray-900">Urgent Alerts</h3>
              <AlertCircle className="w-5 h-5 text-netsurit-warm-orange" />
            </div>
          </div>
          <div className="p-4 sm:p-5">
            {urgentAlerts.length > 0 ? (
              <div className="space-y-4">
                {urgentAlerts.map((alert) => (
                  <div key={alert.id} className="bg-netsurit-warm-orange/10 border border-netsurit-warm-orange/30 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-netsurit-warm-orange mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-professional-gray-900">{alert.memberName}</h4>
                        <p className="text-sm text-professional-gray-700 mt-1">{alert.message}</p>
                        <p className="text-xs text-professional-gray-600 mt-2 italic">{alert.actionSuggestion}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-professional-gray-400 mx-auto mb-2" />
                <p className="text-professional-gray-600 font-medium">All team members doing well!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Team Members Tab Component
const TeamMembersTab = ({ 
  teamMembers, 
  filterStatus, 
  setFilterStatus, 
  sortBy, 
  setSortBy, 
  onViewMember,
  getStatusColor,
  getStatusText 
}) => {
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Filters and Controls */}
      <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center space-x-3">
                <Filter className="w-4 h-4 text-professional-gray-500" />
                <span className="text-sm font-medium text-professional-gray-700">Filter:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-sm border border-professional-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200"
                >
                  <option value="all">All Members</option>
                  <option value="excelling">Excelling</option>
                  <option value="on-track">On Track</option>
                  <option value="needs-attention">Needs Attention</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-professional-gray-700">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-professional-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200"
                >
                  <option value="score">Score</option>
                  <option value="name">Name</option>
                  <option value="dreams">Dreams</option>
                  <option value="connects">Connects</option>
                </select>
              </div>
            </div>
            
            <span className="text-sm text-professional-gray-600">
              {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
        {teamMembers.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer"
            onClick={() => onViewMember(member)}
          >
            <div className="p-4 sm:p-5">
              <div className="flex items-start space-x-3">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=6366f1&color=fff&size=100`;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-bold text-professional-gray-900 truncate">{member.name}</h4>
                  <p className="text-sm text-professional-gray-600 mb-3">{member.office}</p>
                  
                  <div className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(member.score)}`}>
                    {getStatusText(member.score)}
                  </div>
                  
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-professional-gray-900">{member.score}</p>
                      <p className="text-xs text-professional-gray-600">Score</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-professional-gray-900">{member.dreamsCount || 0}</p>
                      <p className="text-xs text-professional-gray-600">Dreams</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-professional-gray-900">{member.connectsCount || 0}</p>
                      <p className="text-xs text-professional-gray-600">Connects</p>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-netsurit-red" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Dreams Progress Tab Component  
const DreamsProgressTab = ({ teamMembers, onViewDream, getCategoryIcon }) => {
  // Collect all dreams from all team members
  const allDreams = useMemo(() => {
    const dreams = [];
    teamMembers.forEach(member => {
      if (member.dreamBook && member.dreamBook.length > 0) {
        member.dreamBook.forEach(dream => {
          dreams.push({
            ...dream,
            memberName: member.name,
            memberAvatar: member.avatar,
            memberId: member.id
          });
        });
      }
    });
    return dreams.sort((a, b) => b.progress - a.progress);
  }, [teamMembers]);

  const dreamsByCategory = useMemo(() => {
    const categories = {};
    allDreams.forEach(dream => {
      if (!categories[dream.category]) {
        categories[dream.category] = [];
      }
      categories[dream.category].push(dream);
    });
    return categories;
  }, [allDreams]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Dreams Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 lg:gap-6">
        <div className="bg-gradient-to-r from-netsurit-red to-netsurit-coral rounded-2xl p-4 sm:p-5 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Total Dreams</p>
              <p className="text-3xl font-bold">{allDreams.length}</p>
            </div>
            <Target className="w-8 h-8 text-white/60" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-professional-gray-600 to-professional-gray-700 rounded-2xl p-4 sm:p-5 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Completed</p>
              <p className="text-3xl font-bold">
                {allDreams.filter(d => d.progress === 100).length}
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-white/60" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-netsurit-orange to-netsurit-warm-orange rounded-2xl p-4 sm:p-5 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">In Progress</p>
              <p className="text-3xl font-bold">
                {allDreams.filter(d => d.progress > 0 && d.progress < 100).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-white/60" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-netsurit-coral to-netsurit-light-coral rounded-2xl p-4 sm:p-5 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Avg Progress</p>
              <p className="text-3xl font-bold">
                {allDreams.length > 0 
                  ? Math.round(allDreams.reduce((sum, d) => sum + d.progress, 0) / allDreams.length)
                  : 0}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-white/60" />
          </div>
        </div>
      </div>

      {/* Dreams by Category */}
      <div className="space-y-4 sm:space-y-5">
        <h3 className="text-xl sm:text-2xl font-bold text-professional-gray-900">Dreams by Category</h3>
        
        {Object.entries(dreamsByCategory).map(([category, dreams]) => {
          const Icon = getCategoryIcon(category);
          return (
            <div key={category} className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl">
              <div className="p-4 sm:p-5 border-b border-professional-gray-200 bg-professional-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="w-6 h-6 text-netsurit-red" />
                    <h4 className="text-lg font-bold text-professional-gray-900">{category}</h4>
                    <span className="bg-professional-gray-100 text-professional-gray-600 px-2 py-1 rounded-lg text-sm">
                      {dreams.length}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dreams.map((dream) => (
                    <div
                      key={`${dream.memberId}-${dream.id}`}
                      className="border border-professional-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer"
                      onClick={() => onViewDream(dream, { 
                        id: dream.memberId, 
                        name: dream.memberName, 
                        avatar: dream.memberAvatar 
                      })}
                    >
                      <div className="flex items-start space-x-3">
                        <img
                          src={dream.memberAvatar}
                          alt={dream.memberName}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-professional-gray-900 truncate">{dream.title}</h5>
                          <p className="text-sm text-professional-gray-600">{dream.memberName}</p>
                          
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-professional-gray-600">Progress</span>
                              <span className="font-medium text-professional-gray-900">{dream.progress}%</span>
                            </div>
                            <div className="w-full bg-professional-gray-200 rounded-full h-3 shadow-inner border border-professional-gray-300">
                              <div
                                className="bg-gradient-to-r from-netsurit-red to-netsurit-coral h-3 rounded-full transition-all duration-700 ease-out shadow-lg relative overflow-hidden"
                                style={{ width: `${dream.progress}%` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Coaching Notes Tab Component
const CoachingNotesTab = ({ teamNotes, teamMembers }) => {
  const [filterType, setFilterType] = useState('all');
  
  const filteredNotes = useMemo(() => {
    if (filterType === 'all') return teamNotes;
    return teamNotes.filter(note => note.type === filterType);
  }, [teamNotes, filterType]);

  const noteTypes = ['all', 'progress_update', 'intervention', 'recognition', 'check_in'];
  
  const getTypeColor = (type) => {
    const colors = {
      progress_update: 'bg-blue-100 text-blue-800 border-blue-200',
      intervention: 'bg-red-100 text-red-800 border-red-200',
      recognition: 'bg-green-100 text-green-800 border-green-200',
      check_in: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Filter Controls */}
      <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="text-sm font-medium text-professional-gray-700">Filter by type:</span>
            <div className="flex flex-wrap gap-2">
              {noteTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    filterType === type
                      ? 'bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white shadow-md'
                      : 'bg-professional-gray-100 text-professional-gray-700 border border-professional-gray-200 hover:bg-professional-gray-200'
                  }`}
                >
                  {type === 'all' ? 'All' : type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => {
            const member = teamMembers.find(m => m.id === note.teamMemberId);
            return (
              <div key={note.id} className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl">
                <div className="p-4 sm:p-5">
                  <div className="flex items-start space-x-3">
                    {member && (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <h4 className="text-lg font-bold text-professional-gray-900">
                          {member?.name || 'Unknown Member'}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getTypeColor(note.type)}`}>
                            {note.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <span className="text-sm text-professional-gray-500">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-professional-gray-700 mb-3">{note.note}</p>
                      
                      {note.followUpDate && (
                        <div className="flex items-center text-sm text-professional-gray-600">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>Follow-up: {new Date(note.followUpDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-professional-gray-300" />
            <p className="text-professional-gray-500">No coaching notes found</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Performance Tab Component
const PerformanceTab = ({ coach, teamMetrics, coachingAlerts, teamNotes }) => {
  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    const totalNotes = teamNotes.length;
    const recentNotes = teamNotes.filter(note => {
      const noteDate = new Date(note.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return noteDate >= thirtyDaysAgo;
    }).length;

    const interventionNotes = teamNotes.filter(note => note.type === 'intervention').length;
    const recognitionNotes = teamNotes.filter(note => note.type === 'recognition').length;
    
    const highPriorityAlerts = coachingAlerts.filter(alert => alert.priority === 'high').length;
    const responseRate = totalNotes > 0 ? Math.round((recentNotes / totalNotes) * 100) : 0;

    return {
      totalNotes,
      recentNotes,
      interventionNotes,
      recognitionNotes,
      highPriorityAlerts,
      responseRate,
      teamGrowth: teamMetrics.averageScore > 50 ? '+12%' : '+5%', // Mock calculation
      retentionRate: '94%' // Mock data
    };
  }, [teamNotes, coachingAlerts, teamMetrics]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-professional-gray-600">Coaching Activity</h4>
              <MessageSquare className="w-5 h-5 text-professional-gray-400" />
            </div>
            <p className="text-3xl font-bold text-professional-gray-900">{performanceMetrics.totalNotes}</p>
            <p className="text-sm text-professional-gray-600 mt-1">Total notes this month</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-professional-gray-600">Response Rate</h4>
              <TrendingUp className="w-5 h-5 text-professional-gray-400" />
            </div>
            <p className="text-3xl font-bold text-professional-gray-900">{performanceMetrics.responseRate}%</p>
            <p className="text-sm text-professional-gray-600 mt-1">Recent activity rate</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-professional-gray-600">Team Growth</h4>
              <Award className="w-5 h-5 text-professional-gray-400" />
            </div>
            <p className="text-3xl font-bold text-professional-gray-700">{performanceMetrics.teamGrowth}</p>
            <p className="text-sm text-professional-gray-600 mt-1">Avg score improvement</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-professional-gray-600">Retention Rate</h4>
              <Users2 className="w-5 h-5 text-professional-gray-400" />
            </div>
            <p className="text-3xl font-bold text-professional-gray-700">{performanceMetrics.retentionRate}</p>
            <p className="text-sm text-professional-gray-600 mt-1">Team member retention</p>
          </div>
        </div>
      </div>

      {/* Performance Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
        {/* Coaching Style Analysis */}
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl">
          <div className="p-4 sm:p-5 border-b border-professional-gray-200 bg-professional-gray-50">
            <h3 className="text-lg font-bold text-professional-gray-900">Coaching Style Analysis</h3>
          </div>
          <div className="p-4 sm:p-5">
          
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-professional-gray-700">Recognition</span>
                <span className="text-sm text-professional-gray-600">{performanceMetrics.recognitionNotes} notes</span>
              </div>
              <div className="w-full bg-professional-gray-200 rounded-full h-3 shadow-inner border border-professional-gray-300">
                <div
                  className="bg-gradient-to-r from-professional-gray-600 to-professional-gray-700 h-3 rounded-full transition-all duration-700 ease-out shadow-lg"
                  style={{ 
                    width: `${Math.min((performanceMetrics.recognitionNotes / Math.max(performanceMetrics.totalNotes, 1)) * 100, 100)}%` 
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-professional-gray-700">Interventions</span>
                <span className="text-sm text-professional-gray-600">{performanceMetrics.interventionNotes} notes</span>
              </div>
              <div className="w-full bg-professional-gray-200 rounded-full h-3 shadow-inner border border-professional-gray-300">
                <div
                  className="bg-gradient-to-r from-netsurit-orange to-netsurit-warm-orange h-3 rounded-full transition-all duration-700 ease-out shadow-lg"
                  style={{ 
                    width: `${Math.min((performanceMetrics.interventionNotes / Math.max(performanceMetrics.totalNotes, 1)) * 100, 100)}%` 
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-professional-gray-700">Check-ins</span>
                <span className="text-sm text-professional-gray-600">
                  {performanceMetrics.totalNotes - performanceMetrics.recognitionNotes - performanceMetrics.interventionNotes} notes
                </span>
              </div>
              <div className="w-full bg-professional-gray-200 rounded-full h-3 shadow-inner border border-professional-gray-300">
                <div
                  className="bg-gradient-to-r from-netsurit-red to-netsurit-coral h-3 rounded-full transition-all duration-700 ease-out shadow-lg"
                  style={{ 
                    width: `${Math.min(((performanceMetrics.totalNotes - performanceMetrics.recognitionNotes - performanceMetrics.interventionNotes) / Math.max(performanceMetrics.totalNotes, 1)) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Health Overview */}
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl">
          <div className="p-4 sm:p-5 border-b border-professional-gray-200 bg-professional-gray-50">
            <h3 className="text-lg font-bold text-professional-gray-900">Team Health Overview</h3>
          </div>
          <div className="p-4 sm:p-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-professional-gray-50 rounded-xl border border-professional-gray-200">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-professional-gray-600" />
                  <span className="font-medium text-professional-gray-800">Excelling Members</span>
                </div>
                <span className="text-2xl font-bold text-professional-gray-700">
                  {teamMetrics.teamMembers.filter(m => m.score >= 60).length}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-professional-gray-50 rounded-xl border border-professional-gray-200">
                <div className="flex items-center space-x-3">
                  <Clock className="w-6 h-6 text-professional-gray-600" />
                  <span className="font-medium text-professional-gray-800">On Track Members</span>
                </div>
                <span className="text-2xl font-bold text-professional-gray-700">
                  {teamMetrics.teamMembers.filter(m => m.score >= 30 && m.score < 60).length}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-netsurit-warm-orange/10 rounded-xl border border-netsurit-warm-orange/30">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-6 h-6 text-netsurit-warm-orange" />
                  <span className="font-medium text-professional-gray-800">Need Attention</span>
                </div>
                <span className="text-2xl font-bold text-netsurit-warm-orange">
                  {teamMetrics.teamMembers.filter(m => m.score < 30).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachDetailModal;
