import React, { useState, useMemo, useEffect } from 'react';
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
  UserCheck,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import peopleService from '../services/peopleService';
import DreamCoachingModal from '../components/DreamCoachingModal';
import HelpTooltip from '../components/HelpTooltip';

const DreamCoach = () => {
  const { currentUser } = useApp();
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedDream, setSelectedDream] = useState(null);
  const [dreamCoachingNotes, setDreamCoachingNotes] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Real data state
  const [teamMetrics, setTeamMetrics] = useState(null);
  const [coachingAlerts, setCoachingAlerts] = useState([]);
  const [teamNotes, setTeamNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load team data for current user
  useEffect(() => {
    const loadCoachData = async () => {
      console.log('🎯 DreamCoach useEffect triggered:', {
        hasCurrentUser: !!currentUser,
        currentUserId: currentUser?.id,
        currentUserUserId: currentUser?.userId,
        currentUserEmail: currentUser?.email,
        currentUserName: currentUser?.name,
        currentUserKeys: currentUser ? Object.keys(currentUser) : null
      });
      
      // Use id or userId - handle both formats
      const userId = currentUser?.id || currentUser?.userId;
      if (!userId) {
        console.log('❌ No currentUser.id or currentUser.userId, skipping loadCoachData');
        setIsLoading(false); // IMPORTANT: Stop loading even if no user
        return;
      }

      try {
        setError(null);
        setIsLoading(true);
        
        console.log('🔄 About to call peopleService APIs with userId:', userId);

        const [metricsResult, alertsResult] = await Promise.all([
          peopleService.getTeamMetrics(userId),
          peopleService.getCoachingAlerts(userId)
        ]);

        console.log('📊 Raw API responses received:', {
          metricsResult,
          alertsResult,
          metricsSuccess: metricsResult?.success,
          alertsSuccess: alertsResult?.success
        });

        // Handle new { success, data, error } format
        if (!metricsResult?.success) {
          throw new Error(metricsResult?.error?.message || 'Failed to load team metrics');
        }
        if (!alertsResult?.success) {
          throw new Error(alertsResult?.error?.message || 'Failed to load coaching alerts');
        }

        const metrics = metricsResult.data;
        const alerts = alertsResult.data;

        setTeamMetrics(metrics);
        setCoachingAlerts(alerts || []);
        setTeamNotes([]); // For now, we'll use empty array until we implement coaching notes API
        
        console.log('✅ Loaded coach data - Final state:', {
          userId: userId,
          hasMetrics: !!metrics,
          metricsType: typeof metrics,
          metricsValue: JSON.stringify(metrics),
          alertsCount: alerts?.length || 0,
          teamSize: metrics?.teamSize,
          averageScore: metrics?.averageScore,
          totalDreams: metrics?.totalDreams
        });
      } catch (error) {
        console.error('❌ Error loading coach data:', error);
        console.error('❌ Error stack:', error.stack);
        setError(error.message || 'Failed to load team data');
      } finally {
        console.log('🏁 Setting isLoading to false');
        setIsLoading(false);
      }
    };

    loadCoachData();
  }, [currentUser?.id, currentUser?.userId]);

  // Refresh data function
  const refreshData = async () => {
    setIsLoading(true);
    const loadCoachData = async () => {
      const userId = currentUser?.id || currentUser?.userId;
      if (!userId) return;

      try {
        setError(null);

        const [metricsResult, alertsResult] = await Promise.all([
          peopleService.getTeamMetrics(userId),
          peopleService.getCoachingAlerts(userId)
        ]);

        // Handle new { success, data, error } format
        if (!metricsResult?.success) {
          throw new Error(metricsResult?.error?.message || 'Failed to load team metrics');
        }
        if (!alertsResult?.success) {
          throw new Error(alertsResult?.error?.message || 'Failed to load coaching alerts');
        }

        const metrics = metricsResult.data;
        const alerts = alertsResult.data;

        setTeamMetrics(metrics);
        setCoachingAlerts(alerts || []);
        setTeamNotes([]);
        
        console.log('🔄 Refreshed coach data');
      } catch (error) {
        console.error('❌ Error refreshing coach data:', error);
        setError(error.message || 'Failed to refresh team data');
      } finally {
        setIsLoading(false);
      }
    };

    await loadCoachData();
  };

  // Show loading state
  if (isLoading) {
    console.log('🔄 DreamCoach showing loading state');
    return (
      <div className="p-6">
        <div className="text-center py-20">
          <Loader2 className="h-12 w-12 text-netsurit-red animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-professional-gray-900 mb-2">Loading Your Team</h2>
          <p className="text-professional-gray-600">Fetching your coaching assignments and team data...</p>
          <div className="mt-4 text-sm text-professional-gray-500">
            <p>User ID: {currentUser?.id || 'Not available'}</p>
            <p>User UserID: {currentUser?.userId || 'Not available'}</p>
            <p>User Name: {currentUser?.name || 'Not available'}</p>
            <p>Effective ID: {currentUser?.id || currentUser?.userId || 'Not available'}</p>
            <p>Debug: Check browser console for detailed loading info</p>
          </div>
          <button 
            onClick={() => {
              console.log('🔄 Force refresh triggered');
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 bg-netsurit-red text-white rounded hover:bg-netsurit-coral"
          >
            Force Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-20">
          <AlertCircle className="h-12 w-12 text-netsurit-red mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-professional-gray-900 mb-2">Failed to Load Team Data</h2>
          <p className="text-professional-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center mx-auto"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            <span>{isLoading ? 'Retrying...' : 'Retry'}</span>
          </button>
        </div>
      </div>
    );
  }

  // Show no team assigned state
  if (!teamMetrics) {
    console.log('❌ DreamCoach showing "No Team Assigned" state:', {
      teamMetrics,
      teamMetricsType: typeof teamMetrics,
      hasCurrentUser: !!currentUser,
      currentUserId: currentUser?.id,
      isLoading,
      error
    });
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Users2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Team Assigned</h2>
          <p className="text-gray-600 mb-4">You don't have any team members assigned to coach yet.</p>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center mx-auto"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            <span className="text-sm">{isLoading ? 'Checking...' : 'Check Again'}</span>
          </button>
        </div>
      </div>
    );
  }


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
                src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=6366f1&color=fff&size=100`} 
                alt={member.name}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-netsurit-light-coral/30"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=6366f1&color=fff&size=100`;
                }}
              />
              <div>
                <h2 className="text-2xl font-bold text-professional-gray-900">{member.name}</h2>
                <p className="text-professional-gray-600">{member.office} • {member.score} points</p>
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
                {(member.dreamBook || member.sampleDreams || []).length > 0 ? (
                  (member.dreamBook || member.sampleDreams || [])?.slice(0, 3).map((dream, index) => (
                    <div 
                      key={dream.id || index} 
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
                          {dream.description && (
                            <p className="text-xs text-professional-gray-500 mb-2 line-clamp-2">{dream.description}</p>
                          )}
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
                  ))
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-professional-gray-300 mx-auto mb-4" />
                    <p className="text-professional-gray-500 font-medium">No Dreams Yet</p>
                    <p className="text-sm text-professional-gray-400 mt-1">
                      {member.name} hasn't created any dreams to work on.
                    </p>
                    <p className="text-xs text-professional-gray-400 mt-2">
                      Encourage them to set some professional or personal goals!
                    </p>
                  </div>
                )}
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
                <button className="w-full bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg">
                  <MessageSquare className="h-4 w-4" />
                  <span>Add Coaching Note</span>
                </button>
                <button className="w-full bg-gradient-to-r from-professional-gray-600 to-professional-gray-700 text-white px-4 py-2 rounded-lg hover:from-professional-gray-700 hover:to-professional-gray-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg">
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
      {/* Header with Inline KPIs */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          {/* Title Section */}
          <div className="mb-6 lg:mb-0">
            <div className="flex items-center space-x-3 mb-2">
              <UserCheck className="h-8 w-8 text-netsurit-red" />
              <h1 className="text-3xl font-bold text-professional-gray-900">Dream Coach Dashboard</h1>
              <HelpTooltip 
                title="Dream Coach Guide"
                content="Guide your team's growth journey. View team member profiles, track their dreams and progress, provide coaching support, monitor alerts for team members needing attention, and celebrate achievements together."
              />
            </div>
            <p className="text-professional-gray-600">Support and guide your team's personal and professional growth journey</p>
          </div>
          
          {/* KPI Metrics Inline */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <Users2 className="h-6 w-6 text-netsurit-red" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">Team Size</p>
              <p className="text-xl font-bold text-professional-gray-900">{teamMetrics.teamSize}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-netsurit-coral" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">Avg Score</p>
              <p className="text-xl font-bold text-professional-gray-900">{teamMetrics.averageScore}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-6 w-6 text-netsurit-orange" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">Total Dreams</p>
              <p className="text-xl font-bold text-professional-gray-900">{teamMetrics.totalDreams}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <Award className="h-6 w-6 text-netsurit-warm-orange" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">Engagement</p>
              <p className="text-xl font-bold text-professional-gray-900">{teamMetrics.engagementRate}%</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredMembers.map((member) => (
              <div 
                key={member.id} 
                className="bg-professional-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer border border-professional-gray-200 hover:border-netsurit-light-coral/40 hover:bg-netsurit-light-coral/5"
                onClick={() => setSelectedMember(member)}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <img 
                    src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=6366f1&color=fff&size=100`} 
                    alt={member.name}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-professional-gray-200"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=6366f1&color=fff&size=100`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-professional-gray-900 text-sm truncate">{member.name}</h3>
                    <p className="text-xs text-professional-gray-600 truncate">{member.office}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-netsurit-red" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-professional-gray-600">Overall Score</span>
                    <span className="font-semibold text-professional-gray-900 text-sm">{member.score}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-professional-gray-600">Dreams</span>
                    <span className="font-semibold text-professional-gray-900 text-sm">{member.dreamsCount || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-professional-gray-600">Connects</span>
                    <span className="font-semibold text-professional-gray-900 text-sm">{member.connectsCount || 0}</span>
                  </div>

                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedMember(member); }}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-semibold text-xs"
                  >
                    <BookOpen className="w-3 h-3 mr-1.5" />
                    <span>View Dreams</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); /* TODO: Add check-in functionality */ }}
                    className="px-3 py-2 bg-gradient-to-r from-professional-gray-600 to-professional-gray-700 text-white rounded-lg hover:from-professional-gray-700 hover:to-professional-gray-800 focus:outline-none focus:ring-2 focus:ring-professional-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-xs"
                  >
                    Check-In
                  </button>
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
                  <button className="px-3 py-1.5 bg-gradient-to-r from-professional-gray-600 to-professional-gray-700 text-white rounded-lg hover:from-professional-gray-700 hover:to-professional-gray-800 text-xs font-medium transition-all duration-200 shadow-md hover:shadow-lg">
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
