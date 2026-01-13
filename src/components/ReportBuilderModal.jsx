// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useState } from 'react';
import { X, BarChart3, Download } from 'lucide-react';
import { useReportData, exportReport } from './report-builder';
import ReportFilters from './report-builder/ReportFilters';
import ReportPreviewTable from './report-builder/ReportPreviewTable';

/**
 * Report Builder Modal - Orchestrator component
 * Combines data fetching, filtering, and export functionality
 */
const ReportBuilderModal = ({ isOpen, onClose, allUsers = [], teamRelationships = [] }) => {
  // Date range state
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  // Metrics selection state
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

  // Filter state
  const [selectedTeams, setSelectedTeams] = useState(['all']);
  const [exportFormat, setExportFormat] = useState('csv');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMetricsCollapsed, setIsMetricsCollapsed] = useState(true);

  // Use the report data hook
  const { reportData, isLoadingData, teams } = useReportData({
    isOpen,
    allUsers,
    teamRelationships,
    selectedTeams,
    dateRange
  });

  // Handlers
  const handleMetricToggle = (metric, value) => {
    setSelectedMetrics(prev => ({
      ...prev,
      [metric]: value !== undefined ? value : !prev[metric]
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
        }
        return [...filtered, teamId];
      });
    }
  };

  const handleExport = () => {
    exportReport({
      reportData,
      selectedMetrics,
      dateRange,
      exportFormat,
      onStart: () => setIsGenerating(true),
      onComplete: () => setIsGenerating(false),
      onError: () => {
        setIsGenerating(false);
        alert('Export failed. Please try again.');
      }
    });
  };

  const selectedMetricsCount = Object.values(selectedMetrics).filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-labelledby="report-builder-title"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-professional-gray-200">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-netsurit-red" aria-hidden="true" />
            <h2 id="report-builder-title" className="text-2xl font-bold text-professional-gray-900">
              Report Builder
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-professional-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-professional-gray-500" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-8">
            <ReportFilters
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              selectedMetrics={selectedMetrics}
              onMetricToggle={handleMetricToggle}
              isMetricsCollapsed={isMetricsCollapsed}
              onToggleMetricsCollapsed={() => setIsMetricsCollapsed(!isMetricsCollapsed)}
              selectedTeams={selectedTeams}
              onTeamChange={handleTeamChange}
              teams={teams}
              exportFormat={exportFormat}
              onExportFormatChange={setExportFormat}
            />

            <ReportPreviewTable
              reportData={reportData}
              selectedMetrics={selectedMetrics}
              isLoading={isLoadingData}
            />
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
              data-testid="export-report-button"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>{isGenerating ? 'Generating...' : isLoadingData ? 'Loading Data...' : 'Export Report'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilderModal;
