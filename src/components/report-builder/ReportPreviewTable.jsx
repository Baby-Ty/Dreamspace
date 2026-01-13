/**
 * Preview table component for report data
 */
export default function ReportPreviewTable({
  reportData,
  selectedMetrics,
  isLoading
}) {
  const previewData = reportData.slice(0, 3);
  const selectedMetricsCount = Object.values(selectedMetrics).filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading report data...</p>
      </div>
    );
  }

  if (previewData.length === 0) {
    return null;
  }

  return (
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
                {selectedMetrics.meetingAttendance && (
                  <th className="text-left py-2 px-3 font-medium text-gray-900">Meetings</th>
                )}
                {selectedMetrics.dreamsCreated && (
                  <th className="text-left py-2 px-3 font-medium text-gray-900">Dreams</th>
                )}
                {selectedMetrics.userEngagement && (
                  <th className="text-left py-2 px-3 font-medium text-gray-900">Active Weeks</th>
                )}
              </tr>
            </thead>
            <tbody>
              {previewData.map((user, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-2 px-3 text-gray-900">{user.name}</td>
                  <td className="py-2 px-3 text-gray-600">{user.team}</td>
                  {selectedMetrics.meetingAttendance && (
                    <td className="py-2 px-3 text-gray-600">{user.meetingsAttended}</td>
                  )}
                  {selectedMetrics.dreamsCreated && (
                    <td className="py-2 px-3 text-gray-600">{user.dreamsCreated}</td>
                  )}
                  {selectedMetrics.userEngagement && (
                    <td className="py-2 px-3 text-gray-600">{user.engagementWeeksActive}</td>
                  )}
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
  );
}
