/**
 * Utilities for exporting report data to CSV and PDF formats
 */

/**
 * Generate CSV content from report data
 * @param {Array} reportData - Array of user report data
 * @param {Object} selectedMetrics - Object indicating which metrics to include
 * @returns {string} CSV formatted string
 */
export function generateCSV(reportData, selectedMetrics) {
  const headers = ['Name', 'Email', 'Team', 'Coach'];
  const rows = [];

  // Build headers based on selected metrics
  if (selectedMetrics.meetingAttendance) headers.push('Meetings Attended');
  if (selectedMetrics.dreamsCreated) headers.push('Dreams Created');
  if (selectedMetrics.dreamsCompleted) headers.push('Dreams Completed');
  if (selectedMetrics.publicDreamTitles) headers.push('Public Dream Titles');
  if (selectedMetrics.dreamCategories) headers.push('Dream Categories (breakdown)');
  if (selectedMetrics.goalsCreated) headers.push('Goals Created');
  if (selectedMetrics.goalsCompleted) headers.push('Goals Completed');
  if (selectedMetrics.userEngagement) headers.push('Active Weeks (score > 0)');

  // Build rows
  reportData.forEach(user => {
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
    
    rows.push(row);
  });

  // Convert to CSV
  return [headers, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

/**
 * Generate HTML content for PDF export
 * @param {Array} reportData - Array of user report data
 * @param {Object} selectedMetrics - Object indicating which metrics to include
 * @param {Object} dateRange - Date range object with startDate and endDate
 * @returns {string} HTML formatted string
 */
export function generatePDFContent(reportData, selectedMetrics, dateRange) {
  const csvContent = generateCSV(reportData, selectedMetrics);
  const csvHeaders = csvContent.split('\n')[0].split(',').map(h => h.replace(/"/g, ''));
  
  return `
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
}

/**
 * Download report file
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Export report in specified format
 * @param {Object} params - Export parameters
 * @returns {Promise<void>}
 */
export async function exportReport({
  reportData,
  selectedMetrics,
  dateRange,
  exportFormat,
  onStart,
  onComplete,
  onError
}) {
  onStart?.();
  
  try {
    let content;
    let filename;
    let mimeType;

    if (exportFormat === 'csv') {
      content = generateCSV(reportData, selectedMetrics);
      filename = `dreams-engagement-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
      mimeType = 'text/csv';
    } else {
      content = generatePDFContent(reportData, selectedMetrics, dateRange);
      filename = `dreams-engagement-report-${dateRange.startDate}-to-${dateRange.endDate}.html`;
      mimeType = 'text/html';
    }

    downloadFile(content, filename, mimeType);
    onComplete?.();
  } catch (error) {
    console.error('Export failed:', error);
    onError?.(error);
  }
}
