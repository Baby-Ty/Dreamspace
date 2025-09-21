import React, { useState, useMemo } from 'react';
import { 
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
  Filter,
  Search,
  ChevronRight,
  Star,
  Trophy,
  BookOpen,
  Users,
  Heart,
  Briefcase,
  Zap,
  Eye,
  UserCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getTeamMetrics, getCoachingAlerts, coachingNotes } from '../data/mockData';
import DreamCoachingModal from '../components/DreamCoachingModal';

const DreamCoach = () => {
  const { currentUser } = useApp();
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedDream, setSelectedDream] = useState(null);
  const [dreamCoachingNotes, setDreamCoachingNotes] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Get team data for current user (assuming they're a manager)
  const teamMetrics = useMemo(() => getTeamMetrics(currentUser.id), [currentUser.id]);
  const coachingAlerts = useMemo(() => getCoachingAlerts(currentUser.id), [currentUser.id]);
  const teamNotes = useMemo(() => 
    coachingNotes.filter(note => note.managerId === currentUser.id),
    [currentUser.id]
  );

  if (!teamMetrics) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Users2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Team Assigned</h2>
          <p className="text-gray-600">You don't have any team members assigned to coach yet.</p>
        </div>
      </div>
    );
  }

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
      'Relationships': Users,
      'Adventure': Zap,
      'Spiritual': Award,
      'Community': Users2
    };
    return icons[category] || Target;
  };

  const filteredMembers = teamMetrics.teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

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

  const handleAddCoachNote = (note) => {
    setDreamCoachingNotes(prev => [...prev, note]);
  };

  const handleDreamSelect = (dream, member) => {
    // Add coaching notes to the dream object
    const dreamWithCoachNotes = {
      ...dream,
      notes: [
        ...(dream.notes || []),
        ...dreamCoachingNotes.filter(note => note.dreamId === dream.id)
      ]
    };
    setSelectedDream(dreamWithCoachNotes);
    setSelectedMember(member);
  };

  const MemberDetailModal = ({ member, onClose }) => {
    if (!member) return null;

    const memberNotes = teamNotes.filter(note => note.teamMemberId === member.id);
    
    return (
      <div className="fixed inset-0 bg-professional-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-6 border border-professional-gray-200 w-11/12 max-w-4xl shadow-lg rounded-xl bg-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <img 
                src={member.avatar} 
                alt={member.name}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-netsurit-light-coral/30"
              />
              <div>
                <h2 className="text-2xl font-bold text-professional-gray-900">{member.name}</h2>
                <p className="text-professional-gray-600">{member.office} • {member.score} points</p>
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(member.score)}`}>
                  {getStatusText(member.score)}
                </span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-professional-gray-400 hover:text-netsurit-red transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dreams Overview */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-professional-gray-900 mb-4">Dreams Portfolio</h3>
              <div className="space-y-4">
                {member.sampleDreams?.slice(0, 3).map((dream, index) => (
                  <div 
                    key={index} 
                    className="bg-professional-gray-50 rounded-lg p-4 hover:bg-netsurit-light-coral/10 cursor-pointer transition-colors border border-transparent hover:border-netsurit-light-coral/40 hover:shadow-sm"
                    onClick={() => handleDreamSelect(dream, member)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="h-16 w-16 rounded-lg flex-shrink-0 ring-1 ring-professional-gray-200 overflow-hidden bg-professional-gray-100">
                        {dream.image ? (
                          <img 
                            src={dream.image} 
                            alt={dream.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`h-full w-full flex items-center justify-center ${dream.image ? 'hidden' : 'flex'}`}>
                          {React.createElement(getCategoryIcon(dream.category), { 
                            className: "h-8 w-8 text-professional-gray-400" 
                          })}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            {React.createElement(getCategoryIcon(dream.category), { 
                              className: "h-4 w-4 text-netsurit-red" 
                            })}
                            <h4 className="font-medium text-professional-gray-900">{dream.title}</h4>
                          </div>
                          <div className="flex items-center space-x-1 text-netsurit-red">
                            <Eye className="h-4 w-4" />
                            <span className="text-xs font-medium">View Details</span>
                          </div>
                        </div>
                        <p className="text-sm text-professional-gray-600 mb-2">{dream.category}</p>
                        <div className="w-full bg-professional-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-netsurit-red to-netsurit-coral h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${dream.progress || 0}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-professional-gray-500">{dream.progress || 0}% complete</p>
                          <p className="text-xs text-netsurit-red font-medium">Click to coach</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coaching Notes & Actions */}
            <div>
              <h3 className="text-lg font-semibold text-professional-gray-900 mb-4">Coaching Notes</h3>
              <div className="space-y-3 mb-6">
                {memberNotes.slice(0, 3).map((note) => (
                  <div key={note.id} className="bg-professional-gray-50 rounded-lg p-3 border border-professional-gray-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${
                        note.type === 'recognition' ? 'bg-netsurit-coral' :
                        note.type === 'intervention' ? 'bg-netsurit-orange' :
                        'bg-netsurit-red'
                      }`}></div>
                      <span className="text-xs font-medium text-professional-gray-600 uppercase">
                        {note.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-professional-gray-700 mb-2">{note.note}</p>
                    <p className="text-xs text-professional-gray-500">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <button className="w-full bg-netsurit-red text-white px-4 py-2 rounded-lg hover:bg-netsurit-coral transition-colors flex items-center justify-center space-x-2 shadow-sm hover:shadow-md">
                  <MessageSquare className="h-4 w-4" />
                  <span>Add Coaching Note</span>
                </button>
                <button className="w-full bg-white border border-professional-gray-300 text-professional-gray-700 px-4 py-2 rounded-lg hover:bg-netsurit-light-coral/10 hover:border-netsurit-light-coral/40 transition-colors flex items-center justify-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Schedule Check-in</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <UserCheck className="h-8 w-8 text-netsurit-red" />
          <h1 className="text-3xl font-bold text-professional-gray-900">Dream Coach Dashboard</h1>
        </div>
        <p className="text-professional-gray-600">Support and guide your team's personal and professional growth journey</p>
      </div>

      {/* Team Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border border-professional-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users2 className="h-8 w-8 text-netsurit-red" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-professional-gray-500">Team Size</p>
              <p className="text-2xl font-semibold text-professional-gray-900">{teamMetrics.teamSize}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-professional-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-netsurit-coral" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-professional-gray-500">Avg Score</p>
              <p className="text-2xl font-semibold text-professional-gray-900">{teamMetrics.averageScore}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-professional-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-netsurit-orange" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-professional-gray-500">Total Dreams</p>
              <p className="text-2xl font-semibold text-professional-gray-900">{teamMetrics.totalDreams}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-professional-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Award className="h-8 w-8 text-netsurit-warm-orange" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-professional-gray-500">Engagement</p>
              <p className="text-2xl font-semibold text-professional-gray-900">{teamMetrics.engagementRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-lg shadow mb-8 border border-professional-gray-200">
        <div className="px-6 py-4 border-b border-professional-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-professional-gray-900">Team Members</h2>
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="h-4 w-4 text-professional-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-professional-gray-300 rounded-lg focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red"
                />
              </div>
              
              {/* Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-professional-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red"
              >
                <option value="all">All Members</option>
                <option value="excelling">Excelling</option>
                <option value="on-track">On Track</option>
                <option value="needs-attention">Needs Attention</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <div 
                key={member.id} 
                className="bg-professional-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer border border-professional-gray-200 hover:border-netsurit-light-coral/40 hover:bg-netsurit-light-coral/5"
                onClick={() => setSelectedMember(member)}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <img 
                    src={member.avatar} 
                    alt={member.name}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-professional-gray-200"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-professional-gray-900">{member.name}</h3>
                    <p className="text-sm text-professional-gray-600">{member.office}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-netsurit-red" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-professional-gray-600">Overall Score</span>
                    <span className="font-semibold text-professional-gray-900">{member.score}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-professional-gray-600">Dreams</span>
                    <span className="font-semibold text-professional-gray-900">{member.dreamsCount || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-professional-gray-600">Connects</span>
                    <span className="font-semibold text-professional-gray-900">{member.connectsCount || 0}</span>
                  </div>

                  <div className="pt-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(member.score)}`}>
                      {getStatusText(member.score)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-professional-gray-200">
                  <p className="text-xs text-professional-gray-500 mb-2">Top Categories:</p>
                  <div className="flex flex-wrap gap-1">
                    {member.dreamCategories?.slice(0, 3).map((category, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-professional-gray-100 text-professional-gray-700 border border-professional-gray-300"
                      >
                        {React.createElement(getCategoryIcon(category), { 
                          className: "h-3 w-3 mr-1" 
                        })}
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Coaching Alerts */}
      {coachingAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-8 border border-professional-gray-200">
          <div className="px-6 py-4 border-b border-professional-gray-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-netsurit-orange" />
              <h2 className="text-lg font-semibold text-professional-gray-900">Coaching Alerts</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {coachingAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-start space-x-4 p-4 bg-professional-gray-50 rounded-lg border border-professional-gray-100">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    alert.priority === 'high' ? 'bg-netsurit-red' :
                    alert.priority === 'medium' ? 'bg-netsurit-orange' :
                    'bg-netsurit-coral'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-professional-gray-900">{alert.message}</p>
                    <p className="text-sm text-professional-gray-600 mt-1">{alert.actionSuggestion}</p>
                  </div>
                  <button className="text-netsurit-red hover:text-netsurit-coral text-sm font-medium transition-colors">
                    Take Action
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Member Detail Modal */}
      {selectedMember && !selectedDream && (
        <MemberDetailModal 
          member={selectedMember} 
          onClose={() => setSelectedMember(null)} 
        />
      )}

      {/* Dream Coaching Modal */}
      {selectedDream && selectedMember && (
        <DreamCoachingModal
          dream={selectedDream}
          teamMember={selectedMember}
          onClose={() => {
            setSelectedDream(null);
            setSelectedMember(null);
          }}
          onAddCoachNote={handleAddCoachNote}
        />
      )}
    </div>
  );
};

export default DreamCoach;
