import { 
  Calendar, 
  Users, 
  Target, 
  CheckCircle2, 
  TrendingUp,
  Filter,
  Eye,
  Grid,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

/**
 * Report filters component - handles date range, metrics selection, and team filtering
 */
export default function ReportFilters({
  dateRange,
  onDateRangeChange,
  selectedMetrics,
  onMetricToggle,
  isMetricsCollapsed,
  onToggleMetricsCollapsed,
  selectedTeams,
  onTeamChange,
  teams,
  exportFormat,
  onExportFormatChange
}) {
  const selectedMetricsCount = Object.values(selectedMetrics).filter(Boolean).length;

  const metricOptions = [
    { key: 'meetingAttendance', label: 'Meeting Attendance', icon: Users },
    { key: 'dreamsCreated', label: 'Dreams Created', icon: Target },
    { key: 'dreamsCompleted', label: 'Dreams Completed', icon: CheckCircle2 },
    { key: 'publicDreamTitles', label: 'Public Dream Titles', icon: Eye },
    { key: 'dreamCategories', label: 'Dream Categories', icon: Grid },
    { key: 'goalsCreated', label: 'Goals Created', icon: Target },
    { key: 'goalsCompleted', label: 'Goals Completed', icon: CheckCircle2 },
    { key: 'userEngagement', label: 'User Engagement', icon: TrendingUp }
  ];

  const handleSelectAll = () => {
    const allSelected = selectedMetricsCount === 8;
    const newState = {};
    metricOptions.forEach(({ key }) => {
      newState[key] = !allSelected;
    });
    Object.keys(newState).forEach(key => onMetricToggle(key, newState[key]));
  };

  return (
    <div className="space-y-8">
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
              onChange={(e) => onDateRangeChange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-professional-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => onDateRangeChange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red"
            />
          </div>
        </div>
      </div>

      {/* Metrics Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onToggleMetricsCollapsed}
            className="flex items-center text-lg font-semibold text-professional-gray-900 hover:text-netsurit-red transition-colors"
          >
            <TrendingUp className="w-5 h-5 mr-2 text-netsurit-coral" />
            Metrics to Include ({selectedMetricsCount} selected)
            {isMetricsCollapsed ? (
              <ChevronDown className="w-4 h-4 ml-2 text-professional-gray-500" />
            ) : (
              <ChevronUp className="w-4 h-4 ml-2 text-professional-gray-500" />
            )}
          </button>
          {!isMetricsCollapsed && (
            <button
              onClick={handleSelectAll}
              className="text-xs text-netsurit-red hover:text-netsurit-coral font-medium"
            >
              {selectedMetricsCount === 8 ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>
        {!isMetricsCollapsed && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-50 rounded-lg p-3">
            {metricOptions.map(({ key, label, icon: Icon }) => (
              <label key={key} htmlFor={key} className="flex items-center space-x-2 cursor-pointer hover:bg-white rounded px-2 py-1 transition-colors">
                <input
                  type="checkbox"
                  id={key}
                  checked={selectedMetrics[key] || false}
                  onChange={() => onMetricToggle(key)}
                  className="h-4 w-4 text-netsurit-red focus:ring-netsurit-red border-professional-gray-300 rounded"
                />
                <Icon className="w-3.5 h-3.5 text-professional-gray-600 flex-shrink-0" />
                <span className="text-xs font-medium text-professional-gray-900">{label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Team Filter */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2 text-indigo-600" />
          Filters
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Teams</label>
          <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedTeams.includes('all')}
                onChange={() => onTeamChange('all')}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-900">All Teams</span>
            </label>
            {teams.map(team => (
              <label key={team.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedTeams.includes(team.id)}
                  onChange={() => onTeamChange(team.id)}
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
              onChange={(e) => onExportFormatChange(e.target.value)}
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
              onChange={(e) => onExportFormatChange(e.target.value)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-900">PDF Report</span>
          </label>
        </div>
      </div>
    </div>
  );
}
