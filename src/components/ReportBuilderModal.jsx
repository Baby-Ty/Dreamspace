import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  X, 
  Calendar, 
  Users, 
  Target, 
  CheckCircle2, 
  TrendingUp,
  Download,
  FileText,
  BarChart3,
  Filter,
  Eye,
  Grid
} from 'lucide-react';
import { coachingService } from '../services/coachingService';
import { getPastWeeks } from '../services/weekHistoryService';
import databaseService from '../services/databaseService';

const ReportBuilderModal = ({ isOpen, onClose, allUsers = [], teamRelationships = [] }) => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });
  
  const [selectedMetrics, setSelectedMetrics] = useState({
    meetingAttendance: true,
    dreamsCreated: true,
    dreamsCompleted: true,
    publicDreamTitles: true,
    dreamCategories: true,
    goalsCreated: true,
    goalsCompleted: true,
    userEngagement: true
  });

  const [selectedTeams, setSelectedTeams] = useState(['all']);
  const [exportFormat, setExportFormat] = useState('csv');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Teams with coach names
  const teams = useMemo(() => {
    return teamRelationships.map(team => {
      const coach = allUsers.find(u => u.id === team.managerId);
      return {
        id: team.managerId,
        name: team.teamName,
        coachName: coach?.name || 'Unknown Coach',
        teamId: team.teamId || team.id // Use teamId if available, fallback to id
      };
    });
  }, [teamRelationships, allUsers]);

  // Helper: Get meeting attendance count for a user's team within date range
  const getMeetingAttendanceCount = useCallback(async (userId, teamId) => {
    if (!teamId) {
      console.log(`⚠️ No teamId for user ${userId}, skipping meeting attendance`);
      return 0;
    }
    
    try {
      console.log(`📅 Fetching meeting attendance for user ${userId}, team ${teamId}`);
      const response = await coachingService.getMeetingAttendanceHistory(teamId);
      
      if (!response.success) {
        console.warn(`⚠️ Failed to fetch meeting attendance for team ${teamId}:`, response.error);
        return 0;
      }
      
      const meetings = response.data || [];
      console.log(`📅 Found ${meetings.length} meetings for team ${teamId}`);
      
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      // Filter meetings within date range and count user's attendance
      const filteredMeetings = meetings.filter(meeting => {
        const meetingDate = new Date(meeting.date);
        return meetingDate >= startDate && meetingDate <= endDate;
      });
      
      console.log(`📅 ${filteredMeetings.length} meetings in date range ${dateRange.startDate} to ${dateRange.endDate}`);
      
      const attendanceCount = filteredMeetings.reduce((count, meeting) => {
        const attendee = meeting.attendees?.find(a => a.id === userId);
        if (attendee?.present) {
          console.log(`✅ User ${userId} attended meeting on ${meeting.date}`);
          return count + 1;
        }
        return count;
      }, 0);
      
      console.log(`📅 User ${userId} attended ${attendanceCount} meetings`);
      return attendanceCount;
    } catch (error) {
      console.error(`❌ Error fetching meeting attendance for user ${userId}, team ${teamId}:`, error);
      return 0;
    }
  }, [dateRange]);

  // Helper: Get active weeks count (weeks with score > 0%)
  const getActiveWeeksCount = useCallback(async (userId) => {
    try {
      console.log(`📊 Fetching past weeks for user ${userId}`);
      const response = await getPastWeeks(userId);
      
      if (!response.success) {
        console.warn(`⚠️ Failed to fetch past weeks for user ${userId}:`, response.error);
        return 0;
      }
      
      const weekHistory = response.data?.weekHistory || {};
      const weekCount = Object.keys(weekHistory).length;
      console.log(`📊 Found ${weekCount} weeks in history for user ${userId}`);
      
      // Count weeks with score > 0
      const activeWeeks = Object.values(weekHistory).filter(week => week.score > 0);
      console.log(`📊 User ${userId} has ${activeWeeks.length} active weeks (score > 0)`);
      
      return activeWeeks.length;
    } catch (error) {
      console.error(`❌ Error fetching past weeks for user ${userId}:`, error);
      return 0;
    }
  }, []);

  // Generate report data from real sources
  const generateReportData = useCallback(async () => {
    setIsLoadingData(true);
    
    try {
      console.log(`🔍 Generating report data:`, {
        totalUsers: allUsers.length,
        selectedTeams: selectedTeams,
        isAllSelected: selectedTeams[0] === 'all',
        teamRelationshipsCount: teamRelationships.length
      });
      
      const reportPromises = allUsers.map(async (user) => {
        // Find user's team (normalize IDs for comparison)
        const userIdStr = String(user.id);
        const userTeam = teamRelationships.find(team => 
          team.teamMembers && team.teamMembers.some(memberId => String(memberId) === userIdStr)
        );
        
        // Apply team filter
        // If "all" is not selected, only include users from selected teams
        if (selectedTeams[0] !== 'all') {
          // If user has no team, exclude them when filtering by specific teams
          if (!userTeam) {
            console.log(`🚫 Filtering out ${user.name} (${user.id}) - no team assigned`);
            return null;
          }
          
          // Normalize IDs for comparison (handle string/number mismatches)
          const userTeamManagerId = String(userTeam.managerId);
          const selectedTeamIds = selectedTeams.map(id => String(id));
          
          // If user's team managerId is not in selected teams, exclude them
          if (!selectedTeamIds.includes(userTeamManagerId)) {
            console.log(`🚫 Filtering out ${user.name} - team ${userTeam.teamName} (managerId: ${userTeamManagerId}, type: ${typeof userTeam.managerId}) not in selected teams [${selectedTeamIds.join(', ')}]`);
            return null;
          }
        }
        
        console.log(`✅ Including ${user.name} - team: ${userTeam?.teamName || 'No Team'}`);

        // Fetch dreams if not already in user object
        let dreams = user.dreamBook || [];
        
        // If dreamBook is empty or missing, fetch from getUserData API
        if (!dreams || dreams.length === 0) {
          try {
            console.log(`📊 Fetching dreams for user ${user.id} (${user.name})`);
            const userDataResult = await databaseService.loadFromCosmosDB(user.id);
            if (userDataResult.success && userDataResult.data) {
              dreams = userDataResult.data.dreamBook || [];
              console.log(`✅ Loaded ${dreams.length} dreams for ${user.name}`);
            }
          } catch (dreamError) {
            console.warn(`⚠️ Could not load dreams for ${user.name}:`, dreamError);
            dreams = [];
          }
        } else {
          console.log(`✅ Using ${dreams.length} dreams from allUsers for ${user.name}`);
        }

        const publicDreams = dreams.filter(d => d.isPublic);
        const completedDreams = dreams.filter(d => d.completed);
        
        // Count all goals across all dreams
        const allGoals = dreams.flatMap(d => d.goals || []);
        const completedGoals = allGoals.filter(g => g.completed);
        
        // Group dreams by category
        const categoryBreakdown = dreams.reduce((acc, dream) => {
          const category = dream.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {});

        // Get teamId for meeting attendance lookup
        // teamId is the stable team identifier (not managerId)
        const teamId = userTeam?.teamId || userTeam?.id;
        
        if (userTeam && !teamId) {
          console.warn(`⚠️ Team ${userTeam.teamName} (manager: ${userTeam.managerId}) missing teamId - meeting attendance may not work`);
        }
        
        // Fetch async data
        const [meetingsAttended, engagementWeeksActive] = await Promise.all([
          getMeetingAttendanceCount(user.id, teamId),
          getActiveWeeksCount(user.id)
        ]);

        console.log(`📊 Report data for ${user.name}:`, {
          dreamsCreated: dreams.length,
          dreamsCompleted: completedDreams.length,
          goalsCreated: allGoals.length,
          goalsCompleted: completedGoals.length,
          meetingsAttended,
          engagementWeeksActive
        });

        return {
          userId: user.id,
          name: user.name,
          email: user.email,
          team: userTeam?.teamName || 'No Team',
          coach: userTeam ? allUsers.find(u => u.id === userTeam.managerId)?.name : 'No Coach',
          
          // Real metrics
          meetingsAttended,
          dreamsCreated: dreams.length,
          dreamsCompleted: completedDreams.length,
          publicDreamTitles: publicDreams.map(d => d.title),
          dreamCategories: categoryBreakdown,
          goalsCreated: allGoals.length,
          goalsCompleted: completedGoals.length,
          engagementWeeksActive
        };
      });

      const results = await Promise.all(reportPromises);
      const filteredResults = results.filter(Boolean);
      console.log(`✅ Generated report data for ${filteredResults.length} users`);
      return filteredResults;
    } catch (error) {
      console.error('Error generating report data:', error);
      return [];
    } finally {
      setIsLoadingData(false);
    }
  }, [allUsers, teamRelationships, selectedTeams, dateRange, getMeetingAttendanceCount, getActiveWeeksCount]);

  // Load report data when filters change
  useEffect(() => {
    if (isOpen) {
      generateReportData().then(setReportData);
    }
  }, [isOpen, dateRange, selectedTeams, generateReportData]);

  const handleMetricToggle = (metric) => {
    setSelectedMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  const handleTeamChange = (teamId) => {
    if (teamId === 'all') {
      setSelectedTeams(['all']);
    } else {
      setSelectedTeams(prev => {
        const filtered = prev.filter(t => t !== 'all');
        if (filtered.includes(teamId)) {
          const newSelection = filtered.filter(t => t !== teamId);
          return newSelection.length === 0 ? ['all'] : newSelection;
        } else {
          return [...filtered, teamId];
        }
      });
    }
  };

  const generateCSV = () => {
    const headers = [];
    const rows = [];

    // Build headers based on selected metrics
    headers.push('Name', 'Email', 'Team', 'Coach');
    
    if (selectedMetrics.meetingAttendance) {
      headers.push('Meetings Attended');
    }
    if (selectedMetrics.dreamsCreated) {
      headers.push('Dreams Created');
    }
    if (selectedMetrics.dreamsCompleted) {
      headers.push('Dreams Completed');
    }
    if (selectedMetrics.publicDreamTitles) {
      headers.push('Public Dream Titles');
    }
    if (selectedMetrics.dreamCategories) {
      headers.push('Dream Categories (breakdown)');
    }
    if (selectedMetrics.goalsCreated) {
      headers.push('Goals Created');
    }
    if (selectedMetrics.goalsCompleted) {
      headers.push('Goals Completed');
    }
    if (selectedMetrics.userEngagement) {
      headers.push('Active Weeks (score > 0)');
    }

    // Build rows
    reportData.forEach(user => {
      const row = [user.name, user.email, user.team, user.coach];
      
      if (selectedMetrics.meetingAttendance) {
        row.push(user.meetingsAttended);
      }
      if (selectedMetrics.dreamsCreated) {
        row.push(user.dreamsCreated);
      }
      if (selectedMetrics.dreamsCompleted) {
        row.push(user.dreamsCompleted);
      }
      if (selectedMetrics.publicDreamTitles) {
        row.push(user.publicDreamTitles.join('; ') || 'None');
      }
      if (selectedMetrics.dreamCategories) {
        const categoryStr = Object.entries(user.dreamCategories)
          .map(([cat, count]) => `${cat}: ${count}`)
          .join('; ');
        row.push(categoryStr || 'None');
      }
      if (selectedMetrics.goalsCreated) {
        row.push(user.goalsCreated);
      }
      if (selectedMetrics.goalsCompleted) {
        row.push(user.goalsCompleted);
      }
      if (selectedMetrics.userEngagement) {
        row.push(user.engagementWeeksActive);
      }
      
      rows.push(row);
    });

    // Convert to CSV
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  };

  const generatePDF = async () => {
    // For now, we'll create a simple HTML structure that can be converted to PDF
    // In a real implementation, you'd use a library like jsPDF or Puppeteer
    const csvHeaders = generateCSV().split('\n')[0].split(',').map(h => h.replace(/"/g, ''));
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Dreams Program Engagement Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
            .metric-card { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Dreams Program Engagement Report</h1>
            <p>Period: ${dateRange.startDate} to ${dateRange.endDate}</p>
            <p>Generated: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="summary">
            <h2>Executive Summary</h2>
            <div class="metrics">
              <div class="metric-card">
                <h3>Total Users</h3>
                <p>${reportData.length}</p>
              </div>
              <div class="metric-card">
                <h3>Total Dreams Created</h3>
                <p>${reportData.reduce((sum, user) => sum + (user.dreamsCreated || 0), 0)}</p>
              </div>
              <div class="metric-card">
                <h3>Total Goals Completed</h3>
                <p>${reportData.reduce((sum, user) => sum + (user.goalsCompleted || 0), 0)}</p>
              </div>
              <div class="metric-card">
                <h3>Avg Active Weeks</h3>
                <p>${reportData.length > 0 ? Math.round(reportData.reduce((sum, user) => sum + (user.engagementWeeksActive || 0), 0) / reportData.length) : 0}</p>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                ${csvHeaders.map(header => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${reportData.map(user => {
                const row = [user.name, user.email, user.team, user.coach];
                if (selectedMetrics.meetingAttendance) row.push(user.meetingsAttended);
                if (selectedMetrics.dreamsCreated) row.push(user.dreamsCreated);
                if (selectedMetrics.dreamsCompleted) row.push(user.dreamsCompleted);
                if (selectedMetrics.publicDreamTitles) row.push(user.publicDreamTitles.join('; ') || 'None');
                if (selectedMetrics.dreamCategories) {
                  const categoryStr = Object.entries(user.dreamCategories)
                    .map(([cat, count]) => `${cat}: ${count}`)
                    .join('; ');
                  row.push(categoryStr || 'None');
                }
                if (selectedMetrics.goalsCreated) row.push(user.goalsCreated);
                if (selectedMetrics.goalsCompleted) row.push(user.goalsCompleted);
                if (selectedMetrics.userEngagement) row.push(user.engagementWeeksActive);
                
                return `<tr>${row.map(field => `<td>${String(field)}</td>`).join('')}</tr>`;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    return htmlContent;
  };

  const handleExport = async () => {
    setIsGenerating(true);
    
    try {
      let content;
      let filename;
      let mimeType;

      if (exportFormat === 'csv') {
        content = generateCSV();
        filename = `dreams-engagement-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
        mimeType = 'text/csv';
      } else {
        content = await generatePDF();
        filename = `dreams-engagement-report-${dateRange.startDate}-to-${dateRange.endDate}.html`;
        mimeType = 'text/html';
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedMetricsCount = Object.values(selectedMetrics).filter(Boolean).length;
  const previewData = useMemo(() => reportData.slice(0, 3), [reportData]); // Show first 3 rows as preview

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-professional-gray-200">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-netsurit-red" />
            <h2 className="text-2xl font-bold text-professional-gray-900">Report Builder</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-professional-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-professional-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-8">
            {/* Date Range Selection */}
            <div>
              <h3 className="text-lg font-semibold text-professional-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-netsurit-red" />
                Date Range
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-professional-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-professional-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red"
                  />
                </div>
              </div>
            </div>

            {/* Metrics Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-professional-gray-900 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-netsurit-coral" />
                  Metrics to Include ({selectedMetricsCount} selected)
                </h3>
                <button
                  onClick={() => {
                    const allSelected = selectedMetricsCount === 8;
                    setSelectedMetrics({
                      meetingAttendance: !allSelected,
                      dreamsCreated: !allSelected,
                      dreamsCompleted: !allSelected,
                      publicDreamTitles: !allSelected,
                      dreamCategories: !allSelected,
                      goalsCreated: !allSelected,
                      goalsCompleted: !allSelected,
                      userEngagement: !allSelected
                    });
                  }}
                  className="text-xs text-netsurit-red hover:text-netsurit-coral font-medium"
                >
                  {selectedMetricsCount === 8 ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-50 rounded-lg p-3">
                {[
                  { key: 'meetingAttendance', label: 'Meeting Attendance', icon: Users },
                  { key: 'dreamsCreated', label: 'Dreams Created', icon: Target },
                  { key: 'dreamsCompleted', label: 'Dreams Completed', icon: CheckCircle2 },
                  { key: 'publicDreamTitles', label: 'Public Dream Titles', icon: Eye },
                  { key: 'dreamCategories', label: 'Dream Categories', icon: Grid },
                  { key: 'goalsCreated', label: 'Goals Created', icon: Target },
                  { key: 'goalsCompleted', label: 'Goals Completed', icon: CheckCircle2 },
                  { key: 'userEngagement', label: 'User Engagement', icon: TrendingUp }
                ].map(({ key, label, icon: Icon }) => (
                  <label key={key} htmlFor={key} className="flex items-center space-x-2 cursor-pointer hover:bg-white rounded px-2 py-1 transition-colors">
                    <input
                      type="checkbox"
                      id={key}
                      checked={selectedMetrics[key] || false}
                      onChange={() => handleMetricToggle(key)}
                      className="h-4 w-4 text-netsurit-red focus:ring-netsurit-red border-professional-gray-300 rounded"
                    />
                    <Icon className="w-3.5 h-3.5 text-professional-gray-600 flex-shrink-0" />
                    <span className="text-xs font-medium text-professional-gray-900">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-2 text-indigo-600" />
                Filters
              </h3>
              <div className="grid grid-cols-1 gap-6">
                {/* Team Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teams</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTeams.includes('all')}
                        onChange={() => handleTeamChange('all')}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-900">All Teams</span>
                    </label>
                    {teams.map(team => (
                      <label key={team.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedTeams.includes(team.id)}
                          onChange={() => handleTeamChange(team.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-900">
                          {team.name} <span className="text-gray-500">(Coach: {team.coachName})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Export Format */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Format</h3>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-900">CSV (Excel compatible)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="pdf"
                    checked={exportFormat === 'pdf'}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-900">PDF Report</span>
                </label>
              </div>
            </div>

            {/* Preview */}
            {isLoadingData ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading report data...</p>
              </div>
            ) : previewData.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Report will include {reportData.length} users with {selectedMetricsCount} metric categories
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-medium text-gray-900">Name</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-900">Team</th>
                          {selectedMetrics.meetingAttendance && <th className="text-left py-2 px-3 font-medium text-gray-900">Meetings</th>}
                          {selectedMetrics.dreamsCreated && <th className="text-left py-2 px-3 font-medium text-gray-900">Dreams</th>}
                          {selectedMetrics.userEngagement && <th className="text-left py-2 px-3 font-medium text-gray-900">Active Weeks</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((user, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-2 px-3 text-gray-900">{user.name}</td>
                            <td className="py-2 px-3 text-gray-600">{user.team}</td>
                            {selectedMetrics.meetingAttendance && <td className="py-2 px-3 text-gray-600">{user.meetingsAttended}</td>}
                            {selectedMetrics.dreamsCreated && <td className="py-2 px-3 text-gray-600">{user.dreamsCreated}</td>}
                            {selectedMetrics.userEngagement && <td className="py-2 px-3 text-gray-600">{user.engagementWeeksActive}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {reportData.length > 3 && (
                    <p className="text-xs text-gray-500 mt-2">... and {reportData.length - 3} more users</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-professional-gray-200 bg-professional-gray-50">
          <div className="text-sm text-professional-gray-600">
            {reportData.length} users • {selectedMetricsCount} metrics • {exportFormat.toUpperCase()} format
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-professional-gray-700 bg-white border border-professional-gray-300 rounded-lg hover:bg-professional-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isGenerating || isLoadingData || selectedMetricsCount === 0 || reportData.length === 0}
              className="flex items-center space-x-2 px-6 py-2 bg-netsurit-red text-white rounded-lg hover:bg-netsurit-coral disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Generating...' : isLoadingData ? 'Loading Data...' : 'Export Report'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilderModal;
