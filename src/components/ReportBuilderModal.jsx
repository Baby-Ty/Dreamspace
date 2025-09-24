import React, { useState, useMemo } from 'react';
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
  Filter
} from 'lucide-react';
// Temporarily disable this component to fix ReferenceError
const allUsers = [];
const teamRelationships = [];

const ReportBuilderModal = ({ isOpen, onClose }) => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });
  
  const [selectedMetrics, setSelectedMetrics] = useState({
    meetings: true,
    dreamsCreated: true,
    dreamsCompleted: true,
    tasksCreated: true,
    tasksCompleted: true,
    userEngagement: true,
    teamPerformance: true
  });

  const [selectedOffices, setSelectedOffices] = useState(['all']);
  const [selectedTeams, setSelectedTeams] = useState(['all']);
  const [exportFormat, setExportFormat] = useState('csv');
  const [isGenerating, setIsGenerating] = useState(false);

  const offices = [...new Set(allUsers.map(user => user.office))];
  const teams = teamRelationships.map(team => ({ id: team.managerId, name: team.teamName }));

  // Generate mock engagement data for the past month
  const generateEngagementData = () => {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    return allUsers.map(user => {
      // Filter by office and team if selected
      const userTeam = teamRelationships.find(team => 
        team.teamMembers.includes(user.id)
      );
      
      if (selectedOffices[0] !== 'all' && !selectedOffices.includes(user.office)) {
        return null;
      }
      
      if (selectedTeams[0] !== 'all' && userTeam && !selectedTeams.includes(userTeam.managerId)) {
        return null;
      }

      // Generate random but realistic engagement data
      const baseEngagement = Math.max(0, user.score / 10); // Use existing score as base
      
      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        office: user.office,
        team: userTeam?.teamName || 'No Team',
        coach: userTeam ? allUsers.find(u => u.id === userTeam.managerId)?.name : 'No Coach',
        
        // Meetings data
        meetingsAttended: Math.floor(Math.random() * 8) + Math.floor(baseEngagement / 2),
        meetingsScheduled: Math.floor(Math.random() * 5) + Math.floor(baseEngagement / 3),
        
        // Dreams data  
        dreamsCreated: Math.floor(Math.random() * 3) + (user.dreamBook?.length > 5 ? 1 : 0),
        dreamsCompleted: Math.floor(Math.random() * 2) + Math.floor(baseEngagement / 8),
        dreamsInProgress: user.dreamBook?.length || Math.floor(Math.random() * 5),
        
        // Tasks data
        tasksCreated: Math.floor(Math.random() * 15) + Math.floor(baseEngagement),
        tasksCompleted: Math.floor(Math.random() * 12) + Math.floor(baseEngagement * 0.8),
        
        // Engagement metrics
        loginDays: Math.min(daysDiff, Math.floor(Math.random() * daysDiff) + Math.floor(baseEngagement / 2)),
        averageSessionMinutes: Math.floor(Math.random() * 45) + 15,
        connectsInitiated: user.connects?.length || Math.floor(Math.random() * 3),
        scorecardPoints: user.score,
        
        // Performance indicators
        engagementScore: Math.min(100, Math.floor(baseEngagement * 8) + Math.floor(Math.random() * 20)),
        lastActivity: new Date(Date.now() - Math.random() * daysDiff * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
    }).filter(Boolean);
  };

  const reportData = useMemo(() => generateEngagementData(), [dateRange, selectedOffices, selectedTeams]);

  const handleMetricToggle = (metric) => {
    setSelectedMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  const handleOfficeChange = (office) => {
    if (office === 'all') {
      setSelectedOffices(['all']);
    } else {
      setSelectedOffices(prev => {
        const filtered = prev.filter(o => o !== 'all');
        if (filtered.includes(office)) {
          const newSelection = filtered.filter(o => o !== office);
          return newSelection.length === 0 ? ['all'] : newSelection;
        } else {
          return [...filtered, office];
        }
      });
    }
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
    headers.push('Name', 'Email', 'Office', 'Team', 'Coach');
    
    if (selectedMetrics.meetings) {
      headers.push('Meetings Attended', 'Meetings Scheduled');
    }
    if (selectedMetrics.dreamsCreated) {
      headers.push('Dreams Created', 'Dreams In Progress');
    }
    if (selectedMetrics.dreamsCompleted) {
      headers.push('Dreams Completed');
    }
    if (selectedMetrics.tasksCreated) {
      headers.push('Tasks Created');
    }
    if (selectedMetrics.tasksCompleted) {
      headers.push('Tasks Completed');
    }
    if (selectedMetrics.userEngagement) {
      headers.push('Login Days', 'Avg Session (min)', 'Connects Initiated', 'Last Activity');
    }
    if (selectedMetrics.teamPerformance) {
      headers.push('Scorecard Points', 'Engagement Score');
    }

    // Build rows
    reportData.forEach(user => {
      const row = [user.name, user.email, user.office, user.team, user.coach];
      
      if (selectedMetrics.meetings) {
        row.push(user.meetingsAttended, user.meetingsScheduled);
      }
      if (selectedMetrics.dreamsCreated) {
        row.push(user.dreamsCreated, user.dreamsInProgress);
      }
      if (selectedMetrics.dreamsCompleted) {
        row.push(user.dreamsCompleted);
      }
      if (selectedMetrics.tasksCreated) {
        row.push(user.tasksCreated);
      }
      if (selectedMetrics.tasksCompleted) {
        row.push(user.tasksCompleted);
      }
      if (selectedMetrics.userEngagement) {
        row.push(user.loginDays, user.averageSessionMinutes, user.connectsInitiated, user.lastActivity);
      }
      if (selectedMetrics.teamPerformance) {
        row.push(user.scorecardPoints, user.engagementScore);
      }
      
      rows.push(row);
    });

    // Convert to CSV
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  };

  const generatePDF = async () => {
    // For now, we'll create a simple HTML structure that can be converted to PDF
    // In a real implementation, you'd use a library like jsPDF or Puppeteer
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
                <h3>Avg Engagement Score</h3>
                <p>${Math.round(reportData.reduce((sum, user) => sum + user.engagementScore, 0) / reportData.length)}%</p>
              </div>
              <div class="metric-card">
                <h3>Total Dreams Created</h3>
                <p>${reportData.reduce((sum, user) => sum + user.dreamsCreated, 0)}</p>
              </div>
              <div class="metric-card">
                <h3>Total Tasks Completed</h3>
                <p>${reportData.reduce((sum, user) => sum + user.tasksCompleted, 0)}</p>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                ${generateCSV().split('\n')[0].split(',').map(header => `<th>${header.replace(/"/g, '')}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${reportData.map(user => {
                const row = [user.name, user.email, user.office, user.team, user.coach];
                if (selectedMetrics.meetings) row.push(user.meetingsAttended, user.meetingsScheduled);
                if (selectedMetrics.dreamsCreated) row.push(user.dreamsCreated, user.dreamsInProgress);
                if (selectedMetrics.dreamsCompleted) row.push(user.dreamsCompleted);
                if (selectedMetrics.tasksCreated) row.push(user.tasksCreated);
                if (selectedMetrics.tasksCompleted) row.push(user.tasksCompleted);
                if (selectedMetrics.userEngagement) row.push(user.loginDays, user.averageSessionMinutes, user.connectsInitiated, user.lastActivity);
                if (selectedMetrics.teamPerformance) row.push(user.scorecardPoints, user.engagementScore);
                
                return `<tr>${row.map(field => `<td>${field}</td>`).join('')}</tr>`;
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
  const previewData = reportData.slice(0, 3); // Show first 3 rows as preview

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
              <h3 className="text-lg font-semibold text-professional-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-netsurit-coral" />
                Metrics to Include ({selectedMetricsCount} selected)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'meetings', label: 'Meeting Attendance', icon: Users, desc: 'Meetings attended and scheduled' },
                  { key: 'dreamsCreated', label: 'Dreams Created', icon: Target, desc: 'New dreams added to dream books' },
                  { key: 'dreamsCompleted', label: 'Dreams Completed', icon: CheckCircle2, desc: 'Dreams marked as completed' },
                  { key: 'tasksCreated', label: 'Tasks Created', icon: FileText, desc: 'New tasks and goals created' },
                  { key: 'tasksCompleted', label: 'Tasks Completed', icon: CheckCircle2, desc: 'Tasks and goals completed' },
                  { key: 'userEngagement', label: 'User Engagement', icon: TrendingUp, desc: 'Login frequency, session time, connects' },
                  { key: 'teamPerformance', label: 'Team Performance', icon: BarChart3, desc: 'Scorecard points and engagement scores' }
                ].map(({ key, label, icon: Icon, desc }) => (
                  <div key={key} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id={key}
                      checked={selectedMetrics[key]}
                      onChange={() => handleMetricToggle(key)}
                      className="mt-1 h-4 w-4 text-netsurit-red focus:ring-netsurit-red border-professional-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <label htmlFor={key} className="flex items-center text-sm font-medium text-professional-gray-900 cursor-pointer">
                        <Icon className="w-4 h-4 mr-2 text-professional-gray-600" />
                        {label}
                      </label>
                      <p className="text-xs text-professional-gray-600 mt-1">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-2 text-indigo-600" />
                Filters
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Office Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Offices</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedOffices.includes('all')}
                        onChange={() => handleOfficeChange('all')}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-900">All Offices</span>
                    </label>
                    {offices.map(office => (
                      <label key={office} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedOffices.includes(office)}
                          onChange={() => handleOfficeChange(office)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-900">{office}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Team Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teams</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
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
                        <span className="ml-2 text-sm text-gray-900">{team.name}</span>
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
            {previewData.length > 0 && (
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
                          <th className="text-left py-2 px-3 font-medium text-gray-900">Office</th>
                          {selectedMetrics.meetings && <th className="text-left py-2 px-3 font-medium text-gray-900">Meetings</th>}
                          {selectedMetrics.dreamsCreated && <th className="text-left py-2 px-3 font-medium text-gray-900">Dreams</th>}
                          {selectedMetrics.userEngagement && <th className="text-left py-2 px-3 font-medium text-gray-900">Engagement</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((user, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-2 px-3 text-gray-900">{user.name}</td>
                            <td className="py-2 px-3 text-gray-600">{user.office}</td>
                            {selectedMetrics.meetings && <td className="py-2 px-3 text-gray-600">{user.meetingsAttended}</td>}
                            {selectedMetrics.dreamsCreated && <td className="py-2 px-3 text-gray-600">{user.dreamsCreated}</td>}
                            {selectedMetrics.userEngagement && <td className="py-2 px-3 text-gray-600">{user.engagementScore}%</td>}
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
              disabled={isGenerating || selectedMetricsCount === 0}
              className="flex items-center space-x-2 px-6 py-2 bg-netsurit-red text-white rounded-lg hover:bg-netsurit-coral disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Generating...' : 'Export Report'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilderModal;
