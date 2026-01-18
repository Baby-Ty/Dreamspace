
/**
 * HealthCheck Page - Full system status dashboard
 * Shows detailed health information about all backend services
 */

import { useState } from 'react';
import { useHealthMonitoring } from '../hooks/useHealthMonitoring.js';

function HealthCheck() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Use health monitoring hook with conditional polling
  const { healthData, loading, error, lastChecked, refresh } = useHealthMonitoring(
    autoRefresh ? 30000 : 0 // 30 seconds if auto-refresh enabled, otherwise no polling
  );

  const handleRefresh = () => {
    refresh();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'unhealthy':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return '✓';
      case 'degraded':
        return '⚠';
      case 'unhealthy':
        return '✗';
      default:
        return '?';
    }
  };

  if (loading && !healthData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netsurit-red mx-auto mb-4"></div>
          <p className="text-professional-gray-600">Checking system health...</p>
        </div>
      </div>
    );
  }

  if (error && !healthData) {
    return (
      <div className="flex items-center justify-center p-4 min-h-[400px]">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">✗</div>
            <h2 className="text-2xl font-bold text-professional-gray-900 mb-2">
              Health Check Failed
            </h2>
            <p className="text-professional-gray-600 mb-6">
              {error}
            </p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-netsurit-red text-white rounded-lg hover:bg-red-600 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-professional-gray-900">
              System Health Status
            </h1>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-professional-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-netsurit-red focus:ring-netsurit-red"
                />
                Auto-refresh
              </label>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 bg-netsurit-red text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Refresh health status"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Overall Status */}
          <div className={`flex items-center gap-4 p-4 rounded-lg border ${getStatusColor(healthData?.status)}`}>
            <div className="text-4xl font-bold">
              {getStatusIcon(healthData?.status)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold capitalize">
                {healthData?.status || 'Unknown'}
              </h2>
              <p className="text-sm opacity-75">
                {healthData?.service || 'DreamSpace API'}
                {healthData?.version && ` v${healthData.version}`}
              </p>
            </div>
            <div className="text-right text-sm opacity-75">
              <div>Last Updated</div>
              <div className="font-medium">
                {lastChecked?.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Component Checks */}
        {healthData?.checks && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-professional-gray-900 mb-4">
              Component Status
            </h2>
            
            <div className="space-y-4">
              {Object.entries(healthData.checks).map(([component, check]) => (
                <div 
                  key={component}
                  className={`p-4 rounded-lg border ${getStatusColor(check.status)}`}
                  data-testid={`health-component-${component}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold">
                        {getStatusIcon(check.status)}
                      </div>
                      <div>
                        <h3 className="font-semibold capitalize text-lg">
                          {component}
                        </h3>
                        {check.message && (
                          <p className="text-sm opacity-75 mt-1">
                            {check.message}
                          </p>
                        )}
                        {check.endpoint && (
                          <p className="text-xs opacity-60 mt-1 font-mono">
                            {check.endpoint}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {check.responseTime !== undefined && (
                        <div className="text-sm font-medium">
                          {check.responseTime}ms
                        </div>
                      )}
                      {check.status && (
                        <div className="text-xs opacity-75 capitalize mt-1">
                          {check.status}
                        </div>
                      )}
                    </div>
                  </div>

                  {check.error && (
                    <div className="mt-3 p-2 bg-white bg-opacity-50 rounded text-xs font-mono">
                      Error: {check.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-center text-sm text-professional-gray-500 mt-6">
          Server timestamp: {healthData?.timestamp && new Date(healthData.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

export default HealthCheck;
