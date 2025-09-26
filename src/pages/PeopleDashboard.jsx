import React, { useState, useMemo, useEffect } from 'react';
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
  MapPin,
  UserPlus,
  UserMinus,
  Crown,
  ArrowRight,
  Shield,
  Plus,
  ChevronDown,
  ChevronUp,
  User,
  X,
  Repeat
} from 'lucide-react';
import peopleService from '../services/peopleService';
import CoachDetailModal from '../components/CoachDetailModal';
import ReportBuilderModal from '../components/ReportBuilderModal';
import UnassignUserModal from '../components/UnassignUserModal';
import ReplaceCoachModal from '../components/ReplaceCoachModal';

const PeopleDashboard = () => {
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [filterOffice, setFilterOffice] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('performance');
  const [expandedTeams, setExpandedTeams] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);
  const [showReplaceCoachModal, setShowReplaceCoachModal] = useState(false);
  const [selectedCoachToReplace, setSelectedCoachToReplace] = useState(null);
  
  // Data state
  const [allUsers, setAllUsers] = useState([]);
  const [teamRelationships, setTeamRelationships] = useState([]);
  const [teamMetricsCache, setTeamMetricsCache] = useState({});
  const [coachingAlertsCache, setCoachingAlertsCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize localStorage for development mode
      await peopleService.initializeLocalStorage();

      // Load users and team relationships
      const [users, teams] = await Promise.all([
        peopleService.getAllUsers(),
        peopleService.getTeamRelationships()
      ]);

      setAllUsers(users);
      setTeamRelationships(teams);

      // Load metrics and alerts for each coach
      const metricsPromises = teams.map(team => 
        peopleService.getTeamMetrics(team.managerId).catch(err => {
          console.warn(`Failed to load metrics for coach ${team.managerId}:`, err);
          return null;
        })
      );

      const alertsPromises = teams.map(team => 
        peopleService.getCoachingAlerts(team.managerId).catch(err => {
          console.warn(`Failed to load alerts for coach ${team.managerId}:`, err);
          return [];
        })
      );

      const [metricsResults, alertsResults] = await Promise.all([
        Promise.all(metricsPromises),
        Promise.all(alertsPromises)
      ]);

      // Cache the results
      const newMetricsCache = {};
      const newAlertsCache = {};
      
      teams.forEach((team, index) => {
        newMetricsCache[team.managerId] = metricsResults[index];
        newAlertsCache[team.managerId] = alertsResults[index];
      });

      setTeamMetricsCache(newMetricsCache);
      setCoachingAlertsCache(newAlertsCache);

      console.log('✅ People dashboard data loaded successfully');
    } catch (err) {
      console.error('❌ Error loading people dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get all coaches with their team metrics
  const coaches = useMemo(() => {
    return teamRelationships.map(team => {
      const coach = allUsers.find(user => user.id === team.managerId);
      const teamMetrics = teamMetricsCache[team.managerId];
      const alerts = coachingAlertsCache[team.managerId] || [];
      
      return {
        ...coach,
        teamName: team.teamName,
        teamMetrics,
        alerts,
        performanceScore: teamMetrics ? teamMetrics.averageScore : 0,
        teamData: team
      };
    }).filter(coach => coach.id); // Filter out any undefined coaches
  }, [teamRelationships, allUsers, teamMetricsCache, coachingAlertsCache]);

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

  // Get unassigned users (not coaches and not assigned to any team)
  const unassignedUsers = useMemo(() => {
    const coachIds = new Set(teamRelationships.map(team => team.managerId));
    const assignedUserIds = new Set(teamRelationships.flatMap(team => team.teamMembers));
    
    return allUsers.filter(user => 
      !coachIds.has(user.id) && !assignedUserIds.has(user.id)
    );
  }, [allUsers, teamRelationships]);

  // Calculate overall metrics
  const overallMetrics = useMemo(() => {
    const totalEmployees = allUsers.length;
    const totalCoaches = coaches.length;
    const totalTeamMembers = coaches.reduce((sum, coach) => sum + (coach.teamMetrics?.teamSize || 0), 0);
    const totalUnassigned = unassignedUsers.length;
    const avgEngagement = coaches.reduce((sum, coach) => sum + (coach.teamMetrics?.engagementRate || 0), 0) / coaches.length;
    const totalAlerts = coaches.reduce((sum, coach) => sum + (coach.alerts?.length || 0), 0);
    const avgTeamScore = coaches.reduce((sum, coach) => sum + (coach.performanceScore || 0), 0) / coaches.length;

    return {
      totalEmployees,
      totalCoaches,
      totalTeamMembers,
      totalUnassigned,
      avgEngagement: Math.round(avgEngagement || 0),
      totalAlerts,
      avgTeamScore: Math.round(avgTeamScore || 0),
      programAdoption: Math.round(((totalTeamMembers + totalCoaches) / totalEmployees) * 100)
    };
  }, [coaches, unassignedUsers]);

  const offices = [...new Set(allUsers.map(user => user.office))];

  const handleViewCoach = (coach) => {
    console.log('🔍 handleViewCoach called with coach:', {
      id: coach.id,
      name: coach.name,
      teamMetrics: coach.teamMetrics,
      alerts: coach.alerts,
      hasTeamMetrics: !!coach.teamMetrics
    });
    setSelectedCoach(coach);
    setShowCoachModal(true);
    console.log('🔍 Modal state set - showCoachModal: true, selectedCoach:', coach.name);
  };

  const toggleTeamExpansion = (coachId) => {
    setExpandedTeams(prev => ({
      ...prev,
      [coachId]: !prev[coachId]
    }));
  };

  const handlePromoteUser = (user) => {
    setSelectedUser(user);
    setShowPromoteModal(true);
  };

  const handleAssignUser = (user) => {
    setSelectedUser(user);
    setShowAssignModal(true);
  };

  const handleUnassignUser = (user, coachId) => {
    setSelectedTeamMember({ user, coachId });
    setShowUnassignModal(true);
  };

  const handleReplaceCoach = (coach) => {
    setSelectedCoachToReplace(coach);
    setShowReplaceCoachModal(true);
  };

  const confirmPromoteUser = async (user, teamName) => {
    try {
      setLoading(true);
      await peopleService.promoteUserToCoach(user.id, teamName);
      console.log(`✅ Successfully promoted ${user.name} to coach with team: ${teamName}`);
      
      // Reload data to reflect changes
      await loadData();
      
      setShowPromoteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('❌ Error promoting user:', error);
      setError(`Failed to promote ${user.name}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmAssignUser = async (user, coachId) => {
    try {
      setLoading(true);
      await peopleService.assignUserToCoach(user.id, coachId);
      console.log(`✅ Successfully assigned ${user.name} to coach ID: ${coachId}`);
      
      // Reload data to reflect changes
      await loadData();
      
      setShowAssignModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('❌ Error assigning user:', error);
      setError(`Failed to assign ${user.name}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmUnassignUser = async (user, coachId) => {
    try {
      setLoading(true);
      await peopleService.unassignUserFromTeam(user.id, coachId);
      console.log(`✅ Successfully unassigned ${user.name} from coach ID: ${coachId}`);
      
      // Reload data to reflect changes
      await loadData();
      
      setShowUnassignModal(false);
      setSelectedTeamMember(null);
    } catch (error) {
      console.error('❌ Error unassigning user:', error);
      setError(`Failed to unassign ${user.name}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmReplaceCoach = async (oldCoachId, newCoachId, teamName, demoteOption, assignToTeamId) => {
    try {
      setLoading(true);
      const oldCoach = coaches.find(c => c.id === oldCoachId);
      const newCoach = allUsers.find(u => u.id === newCoachId);
      
      await peopleService.replaceTeamCoach(oldCoachId, newCoachId, teamName, demoteOption, assignToTeamId);
      console.log(`✅ Successfully replaced ${oldCoach?.name} with ${newCoach?.name}`, {
        demoteOption,
        assignToTeamId
      });
      
      // Reload data to reflect changes
      await loadData();
      
      setShowReplaceCoachModal(false);
      setSelectedCoachToReplace(null);
    } catch (error) {
      console.error('❌ Error replacing coach:', error);
      const oldCoach = coaches.find(c => c.id === oldCoachId);
      const newCoach = allUsers.find(u => u.id === newCoachId);
      setError(`Failed to replace ${oldCoach?.name} with ${newCoach?.name}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };



  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netsurit-red mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-professional-gray-900 mb-2">Loading People Hub</h2>
          <p className="text-professional-gray-600">Fetching team data and analytics...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-professional-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-professional-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadData();
            }}
            className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-6 py-2 rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Inline KPIs */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Side: Title and Description */}
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Users2 className="h-8 w-8 text-netsurit-red" />
              <h1 className="text-2xl sm:text-3xl font-bold text-professional-gray-900">People Dashboard</h1>
            </div>
            <p className="text-professional-gray-600">HR oversight of coaches, teams, and program engagement</p>
          </div>
          
          {/* KPI Metrics Inline */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-netsurit-red" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">Adoption</p>
              <p className="text-xl font-bold text-professional-gray-900">{overallMetrics.programAdoption}%</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <Crown className="h-6 w-6 text-netsurit-coral" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">Coaches</p>
              <p className="text-xl font-bold text-professional-gray-900">{overallMetrics.totalCoaches}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <UserPlus className="h-6 w-6 text-netsurit-orange" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">Unassigned</p>
              <p className="text-xl font-bold text-professional-gray-900">{overallMetrics.totalUnassigned}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="h-6 w-6 text-netsurit-warm-orange" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">Alerts</p>
              <p className="text-xl font-bold text-professional-gray-900">{overallMetrics.totalAlerts}</p>
            </div>
          </div>

          {/* Right Side: Report Builder Button */}
          <div className="flex items-center">
            <button 
              onClick={() => setShowReportBuilder(true)}
              className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              <span>Report Builder</span>
            </button>
          </div>
        </div>
      </div>


      {/* Two-Panel Layout */}
      <div className="px-4 sm:px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Coaches/Teams */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-professional-gray-200 p-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-professional-gray-900">Coaches & Teams</h2>
              <div className="flex-1">
                <div className="relative">
                    <Search className="w-4 h-4 text-professional-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search coaches or teams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 text-sm"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-professional-gray-400 hover:text-netsurit-red transition-colors duration-200"
                      title="Search"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
            </div>
          </div>
        </div>
      </div>

        <div className="space-y-4">
            {filteredCoaches.map((coach) => (
                <CoachTeamCard 
                key={coach.id}
                  coach={coach}
                  isExpanded={expandedTeams[coach.id]}
                  onToggleExpand={() => toggleTeamExpansion(coach.id)}
                  onViewCoach={() => handleViewCoach(coach)}
                  onUnassignUser={handleUnassignUser}
                  onReplaceCoach={handleReplaceCoach}
                />
              ))}

          {filteredCoaches.length === 0 && (
            <div className="text-center py-12">
                  <Crown className="w-16 h-16 text-professional-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-professional-gray-900 mb-2">No coaches found</h3>
              <p className="text-professional-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
            </div>
          </div>

          {/* Right Panel: Unassigned Users */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-professional-gray-200 p-4">
              <h2 className="text-xl font-bold text-professional-gray-900">Unassigned Users</h2>
            </div>

            <div className="space-y-3">
              {unassignedUsers.map((user) => (
                <UnassignedUserCard 
                  key={user.id}
                  user={user}
                  coaches={coaches}
                  onPromote={() => handlePromoteUser(user)}
                  onAssign={() => handleAssignUser(user)}
                  onQuickAssign={(user, coachId) => confirmAssignUser(user, coachId)}
                />
              ))}

              {unassignedUsers.length === 0 && (
                <div className="text-center py-12">
                  <UserPlus className="w-16 h-16 text-professional-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-professional-gray-900 mb-2">All users assigned</h3>
                  <p className="text-professional-gray-500">Every user is either a coach or assigned to a team</p>
                </div>
              )}
            </div>
          </div>
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

      {/* Promote User Modal */}
      {showPromoteModal && selectedUser && (
        <PromoteUserModal
          user={selectedUser}
          onClose={() => {
            setShowPromoteModal(false);
            setSelectedUser(null);
          }}
          onConfirm={(teamName) => confirmPromoteUser(selectedUser, teamName)}
        />
      )}

      {/* Assign User Modal */}
      {showAssignModal && selectedUser && (
        <AssignUserModal
          user={selectedUser}
          coaches={coaches}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedUser(null);
          }}
          onConfirm={(coachId) => confirmAssignUser(selectedUser, coachId)}
        />
      )}

      {/* Unassign User Modal */}
      {showUnassignModal && selectedTeamMember && (
        <UnassignUserModal
          user={selectedTeamMember.user}
          coachId={selectedTeamMember.coachId}
          coaches={coaches}
          onClose={() => {
            setShowUnassignModal(false);
            setSelectedTeamMember(null);
          }}
          onConfirm={() => confirmUnassignUser(selectedTeamMember.user, selectedTeamMember.coachId)}
        />
      )}

      {/* Replace Coach Modal */}
      {showReplaceCoachModal && selectedCoachToReplace && (
        <ReplaceCoachModal
          coach={selectedCoachToReplace}
          availableReplacements={allUsers.filter(user => user.id !== selectedCoachToReplace.id)}
          coaches={coaches}
          onClose={() => {
            setShowReplaceCoachModal(false);
            setSelectedCoachToReplace(null);
          }}
          onConfirm={(oldCoachId, newCoachId, teamName, demoteOption, assignToTeamId) => 
            confirmReplaceCoach(oldCoachId, newCoachId, teamName, demoteOption, assignToTeamId)
          }
        />
      )}
    </div>
  );
};

// Coach Team Card Component - Compact List Style
const CoachTeamCard = ({ coach, isExpanded, onToggleExpand, onViewCoach, onUnassignUser, onReplaceCoach }) => {

  return (
    <div className="bg-white border border-professional-gray-200 rounded-lg hover:shadow-md transition-all duration-200">
      {/* Main Coach Row */}
      <div className="p-3 cursor-pointer hover:bg-professional-gray-50" onClick={onViewCoach}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <img
              src={coach.avatar}
              alt={coach.name}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.name)}&background=6366f1&color=fff&size=36`;
              }}
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-netsurit-red flex-shrink-0" />
                <h3 className="text-sm font-semibold text-professional-gray-900 truncate">{coach.name}</h3>
              </div>
              <p className="text-xs text-professional-gray-600 truncate">{coach.teamName}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-professional-gray-500 flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {coach.office}
                </span>
              </div>
            </div>
          </div>

          {/* Metrics and Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Quick Stats */}
            <div className="flex items-center gap-3 text-xs">
              <div className="text-center">
                <div className="font-semibold text-professional-gray-900">{coach.teamMetrics?.teamSize || 0}</div>
                <div className="text-professional-gray-500">team</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-professional-gray-900">{coach.performanceScore}</div>
                <div className="text-professional-gray-500">score</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-professional-gray-900">{coach.teamMetrics?.engagementRate || 0}%</div>
                <div className="text-professional-gray-500">engaged</div>
              </div>
            </div>


            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('🔄 Replace coach clicked for:', coach.name);
                  onReplaceCoach(coach);
                }}
                className="p-1.5 text-netsurit-orange hover:text-netsurit-warm-orange hover:bg-netsurit-orange/10 rounded transition-colors border border-netsurit-orange/20"
                title="Replace Coach"
              >
                <Repeat className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
                className="p-1.5 text-professional-gray-400 hover:text-professional-gray-600 hover:bg-professional-gray-100 rounded transition-colors"
                title={isExpanded ? "Collapse Team" : "Expand Team"}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <ChevronRight className="w-4 h-4 text-netsurit-red" />
            </div>
          </div>
        </div>
      </div>

      {/* Team Members (when expanded) */}
      {isExpanded && coach.teamMetrics?.teamMembers && (
        <div className="border-t border-professional-gray-100 bg-professional-gray-50">
          <div className="p-3 space-y-2">
            {coach.teamMetrics.teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-2 px-3 bg-white rounded border border-professional-gray-100">
                <div className="flex items-center space-x-2">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-6 h-6 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=6366f1&color=fff&size=24`;
                    }}
                  />
                  <div>
                    <div className="flex items-center space-x-1">
                      <p className="text-xs font-medium text-professional-gray-900">{member.name}</p>
                      {member.isCoach && (
                        <Crown className="w-3 h-3 text-netsurit-red" title="Team Coach" />
                      )}
                    </div>
                    <p className="text-xs text-professional-gray-500">{member.office}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-xs font-semibold text-professional-gray-900">{member.score || 0}pt</div>
                  {!member.isCoach && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnassignUser(member, coach.id);
                      }}
                      className="p-1 text-professional-gray-400 hover:text-netsurit-red hover:bg-netsurit-red/10 rounded transition-colors"
                      title="Unassign from team"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Unassigned User Card Component - Compact List Style
const UnassignedUserCard = ({ user, onPromote, onAssign, coaches, onQuickAssign }) => {
  return (
    <div className="bg-white border border-professional-gray-200 rounded-lg hover:shadow-md transition-all duration-200">
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff&size=32`;
              }}
            />
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-professional-gray-900 truncate">{user.name}</h4>
              <div className="flex items-center gap-2 text-xs text-professional-gray-500">
                <span className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {user.office}
                </span>
                <span>•</span>
                <span>{user.score || 0}pts</span>
                <span>•</span>
                <span>{user.dreamsCount || 0} dreams</span>
                <span>•</span>
                <span>{user.connectsCount || 0} connects</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onPromote}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white text-xs font-medium rounded-md hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200"
            >
              <Crown className="w-3 h-3" />
              Promote
            </button>
            
            {/* Quick Assign Dropdown */}
            {coaches.length > 0 ? (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    onQuickAssign(user, e.target.value);
                    e.target.value = ''; // Reset dropdown
                  }
                }}
                className="px-2.5 py-1.5 bg-professional-gray-800 hover:bg-professional-gray-900 text-white text-xs font-medium rounded-md transition-all duration-200 border-none outline-none appearance-none pr-6 bg-arrow-down"
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3e%3c/path%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  backgroundSize: '0.75rem'
                }}
              >
                <option value="">Assign to Coach</option>
                {coaches.map(coach => (
                  <option key={coach.id} value={coach.id}>
                    {coach.name}
                  </option>
                ))}
              </select>
            ) : (
              <button
                onClick={onAssign}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-professional-gray-800 hover:bg-professional-gray-900 text-white text-xs font-medium rounded-md transition-all duration-200"
              >
                <ArrowRight className="w-3 h-3" />
                Assign
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Promote User Modal Component
const PromoteUserModal = ({ user, onClose, onConfirm }) => {
  const [teamName, setTeamName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (teamName.trim()) {
      onConfirm(teamName.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[1000]">
      <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-professional-gray-900">Promote to Coach</h3>
            <button
              onClick={onClose}
              className="p-2 text-professional-gray-400 hover:text-professional-gray-600 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-3 mb-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff&size=48`;
              }}
            />
            <div>
              <p className="font-medium text-professional-gray-900">{user.name}</p>
              <p className="text-sm text-professional-gray-500">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="teamName" className="block text-sm font-medium text-professional-gray-700 mb-2">
                Team Name
              </label>
              <input
                type="text"
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name for this coach"
                className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red"
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-professional-gray-800 hover:bg-professional-gray-900 text-white rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200"
              >
                Promote
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Assign User Modal Component  
const AssignUserModal = ({ user, coaches, onClose, onConfirm }) => {
  const [selectedCoachId, setSelectedCoachId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedCoachId) {
      onConfirm(parseInt(selectedCoachId));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[1000]">
      <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-professional-gray-900">Assign to Coach</h3>
            <button
              onClick={onClose}
              className="p-2 text-professional-gray-400 hover:text-professional-gray-600 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-3 mb-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff&size=48`;
              }}
            />
            <div>
              <p className="font-medium text-professional-gray-900">{user.name}</p>
              <p className="text-sm text-professional-gray-500">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="coachSelect" className="block text-sm font-medium text-professional-gray-700 mb-2">
                Select Coach
              </label>
              <select
                id="coachSelect"
                value={selectedCoachId}
                onChange={(e) => setSelectedCoachId(e.target.value)}
                className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red"
                required
              >
                <option value="">Choose a coach...</option>
                {coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.name} - {coach.teamName} ({coach.teamMetrics?.teamSize || 0} members)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-professional-gray-800 hover:bg-professional-gray-900 text-white rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200"
              >
                Assign
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PeopleDashboard;
