import React, { useState, useMemo } from 'react';
import { 
  Users2, 
  TrendingUp, 
  Award, 
  AlertCircle, 
  BarChart3,
  Filter,
  Search,
  Download,
  Calendar,
  Target,
  Activity,
  Eye,
  ChevronRight,
  Star,
  MapPin
} from 'lucide-react';
import { allUsers, teamRelationships, getTeamMetrics, getCoachingAlerts } from '../data/mockData';
import CoachDetailModal from '../components/CoachDetailModal';
import ReportBuilderModal from '../components/ReportBuilderModal';

const PeopleDashboard = () => {
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [filterOffice, setFilterOffice] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('performance');

  // Get all coaches with their team metrics
  const coaches = useMemo(() => {
    return teamRelationships.map(team => {
      const coach = allUsers.find(user => user.id === team.managerId);
      const teamMetrics = getTeamMetrics(team.managerId);
      const alerts = getCoachingAlerts(team.managerId);
      
      return {
        ...coach,
        teamName: team.teamName,
        teamMetrics,
        alerts,
        performanceScore: teamMetrics ? teamMetrics.averageScore : 0
      };
    }).filter(coach => coach.id); // Filter out any undefined coaches
  }, []);

  // Filter and sort coaches
  const filteredCoaches = useMemo(() => {
    let filtered = coaches.filter(coach => {
      const matchesOffice = filterOffice === 'all' || coach.office === filterOffice;
      const matchesSearch = coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           coach.teamName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesOffice && matchesSearch;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'team-size':
          return (b.teamMetrics?.teamSize || 0) - (a.teamMetrics?.teamSize || 0);
        case 'alerts':
          return (b.alerts?.length || 0) - (a.alerts?.length || 0);
        default: // performance
          return (b.performanceScore || 0) - (a.performanceScore || 0);
      }
    });
  }, [coaches, filterOffice, searchTerm, sortBy]);

  // Calculate overall metrics
  const overallMetrics = useMemo(() => {
    const totalEmployees = allUsers.length;
    const totalCoaches = coaches.length;
    const totalTeamMembers = coaches.reduce((sum, coach) => sum + (coach.teamMetrics?.teamSize || 0), 0);
    const avgEngagement = coaches.reduce((sum, coach) => sum + (coach.teamMetrics?.engagementRate || 0), 0) / coaches.length;
    const totalAlerts = coaches.reduce((sum, coach) => sum + (coach.alerts?.length || 0), 0);
    const avgTeamScore = coaches.reduce((sum, coach) => sum + (coach.performanceScore || 0), 0) / coaches.length;

    return {
      totalEmployees,
      totalCoaches,
      totalTeamMembers,
      avgEngagement: Math.round(avgEngagement || 0),
      totalAlerts,
      avgTeamScore: Math.round(avgTeamScore || 0),
      programAdoption: Math.round((totalTeamMembers / totalEmployees) * 100)
    };
  }, [coaches]);

  const offices = [...new Set(allUsers.map(user => user.office))];

  const handleViewCoach = (coach) => {
    setSelectedCoach(coach);
    setShowCoachModal(true);
  };

  const getPerformanceColor = (score) => {
    if (score >= 60) return 'text-professional-gray-700 bg-professional-gray-100 border-professional-gray-300'; // Excelling - Light grey background, darker grey text
    if (score >= 30) return 'text-professional-gray-700 bg-professional-gray-100 border-professional-gray-300'; // On Track - Same grey pill
    return 'text-amber-800 bg-amber-100 border-amber-300'; // Needs Attention - Amber pill
  };

  const getAlertColor = (alertCount) => {
    if (alertCount === 0) return 'text-professional-gray-700 bg-professional-gray-100';
    if (alertCount <= 2) return 'text-netsurit-orange bg-netsurit-warm-orange/20';
    return 'text-netsurit-red bg-netsurit-light-coral/20';
  };

  return (
    <div className="py-3 sm:py-4 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Users2 className="h-8 w-8 text-netsurit-red" />
              <h1 className="text-2xl sm:text-3xl font-bold text-professional-gray-900">People Dashboard</h1>
            </div>
            <p className="text-professional-gray-600">HR oversight of coaches, teams, and program engagement</p>
          </div>
          
          <div className="flex items-center">
            <button 
              onClick={() => setShowReportBuilder(true)}
              className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              <span>Report Builder</span>
            </button>
          </div>
        </div>
      </div>

      {/* Executive Summary Metrics */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-professional-gray-600">Program Adoption</p>
                  <p className="text-3xl font-bold text-professional-gray-900">{overallMetrics.programAdoption}%</p>
                  <p className="text-sm text-professional-gray-500">{overallMetrics.totalTeamMembers} of {overallMetrics.totalEmployees} employees</p>
                </div>
                <div className="p-3 bg-netsurit-light-coral/20 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-netsurit-red" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-professional-gray-600">Active Coaches</p>
                  <p className="text-3xl font-bold text-professional-gray-900">{overallMetrics.totalCoaches}</p>
                  <p className="text-sm text-professional-gray-500">Managing {overallMetrics.totalTeamMembers} team members</p>
                </div>
                <div className="p-3 bg-netsurit-coral/20 rounded-xl">
                  <Users2 className="w-6 h-6 text-netsurit-coral" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-professional-gray-600">Avg Engagement</p>
                  <p className="text-3xl font-bold text-professional-gray-900">{overallMetrics.avgEngagement}%</p>
                  <p className="text-sm text-professional-gray-500">Across all teams</p>
                </div>
                <div className="p-3 bg-netsurit-orange/20 rounded-xl">
                  <Activity className="w-6 h-6 text-netsurit-orange" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-professional-gray-600">Active Alerts</p>
                  <p className="text-3xl font-bold text-professional-gray-900">{overallMetrics.totalAlerts}</p>
                  <p className="text-sm text-professional-gray-500">Requiring attention</p>
                </div>
                <div className="p-3 bg-netsurit-warm-orange/20 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-netsurit-warm-orange" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-4 sm:p-5">
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl">
          <div className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-5 h-5 text-professional-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search coaches or teams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-professional-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center space-x-3">
                  <Filter className="w-4 h-4 text-professional-gray-500" />
                  <select
                    value={filterOffice}
                    onChange={(e) => setFilterOffice(e.target.value)}
                    className="border border-professional-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200"
                  >
                    <option value="all">All Offices</option>
                    {offices.map(office => (
                      <option key={office} value={office}>{office}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-professional-gray-700">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-professional-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200"
                  >
                    <option value="performance">Performance</option>
                    <option value="name">Name</option>
                    <option value="team-size">Team Size</option>
                    <option value="alerts">Alerts</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coaches Grid */}
      <div className="p-4 sm:p-5">
        <div className="space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-professional-gray-900">Coaches Overview</h2>
            <span className="text-sm text-professional-gray-600">
              {filteredCoaches.length} coach{filteredCoaches.length !== 1 ? 'es' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
            {filteredCoaches.map((coach) => (
              <div
                key={coach.id}
                className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer"
                onClick={() => handleViewCoach(coach)}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-start space-x-3">
                    <img
                      src={coach.avatar}
                      alt={coach.name}
                      className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.name)}&background=6366f1&color=fff&size=100`;
                      }}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-professional-gray-900 truncate">{coach.name}</h3>
                          <p className="text-sm text-professional-gray-600 truncate">{coach.teamName}</p>
                          <div className="flex items-center text-xs text-professional-gray-500 mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span>{coach.office}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-netsurit-red flex-shrink-0" />
                      </div>

                      {/* Performance Indicators */}
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="text-center">
                          <p className="text-lg font-bold text-professional-gray-900">{coach.teamMetrics?.teamSize || 0}</p>
                          <p className="text-xs text-professional-gray-600">Team Size</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-professional-gray-900">{coach.performanceScore}</p>
                          <p className="text-xs text-professional-gray-600">Avg Score</p>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${getPerformanceColor(coach.performanceScore)}`}>
                            {coach.performanceScore >= 60 ? 'Excelling' : 
                             coach.performanceScore >= 30 ? 'On Track' : 'Needs Attention'}
                          </span>
                          
                          <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${getAlertColor(coach.alerts?.length || 0)}`}>
                            {coach.alerts?.length || 0} Alert{(coach.alerts?.length || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="flex items-center text-xs text-professional-gray-600">
                          <Activity className="w-3 h-3 mr-1" />
                          <span>{coach.teamMetrics?.engagementRate || 0}% engaged</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCoaches.length === 0 && (
            <div className="text-center py-12">
              <Users2 className="w-16 h-16 text-professional-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-professional-gray-900 mb-2">No coaches found</h3>
              <p className="text-professional-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Coach Detail Modal */}
      {showCoachModal && selectedCoach && (
        <CoachDetailModal
          coach={selectedCoach}
          onClose={() => {
            setShowCoachModal(false);
            setSelectedCoach(null);
          }}
        />
      )}

      {/* Report Builder Modal */}
      <ReportBuilderModal
        isOpen={showReportBuilder}
        onClose={() => setShowReportBuilder(false)}
      />
    </div>
  );
};

export default PeopleDashboard;
