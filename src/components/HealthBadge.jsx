
/**
 * HealthBadge - Shows backend API health status
 * Displays status badge with optional detailed view
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { useHealthMonitoring } from '../hooks/useHealthMonitoring.js';

const HealthStatus = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
  UNKNOWN: 'unknown'
};

function HealthBadge({ 
  pollInterval = 60000, // 1 minute default
  showDetails = false,
  className = ''
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Use health monitoring hook
  const { status, healthData, lastChecked } = useHealthMonitoring(pollInterval);

  const getStatusColor = () => {
    switch (status) {
      case HealthStatus.HEALTHY:
        return 'bg-green-500';
      case HealthStatus.DEGRADED:
        return 'bg-yellow-500';
      case HealthStatus.UNHEALTHY:
        return 'bg-red-500';
      case HealthStatus.UNKNOWN:
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case HealthStatus.HEALTHY:
        return '✓';
      case HealthStatus.DEGRADED:
        return '⚠';
      case HealthStatus.UNHEALTHY:
        return '✗';
      case HealthStatus.UNKNOWN:
      default:
        return '?';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case HealthStatus.HEALTHY:
        return 'Operational';
      case HealthStatus.DEGRADED:
        return 'Degraded';
      case HealthStatus.UNHEALTHY:
        return 'Unavailable';
      case HealthStatus.UNKNOWN:
      default:
        return 'Unknown';
    }
  };

  const formatTimestamp = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  if (!showDetails) {
    // Simple badge mode
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-medium ${getStatusColor()} ${className}`}
        role="status"
        aria-live="polite"
        aria-label={`Backend status: ${getStatusText()}`}
        data-testid="health-badge-simple"
      >
        <span className="text-white font-bold">{getStatusIcon()}</span>
        <span>{getStatusText()}</span>
      </div>
    );
  }

  // Detailed badge with expandable info
  return (
    <div className={`${className}`} data-testid="health-badge-detailed">
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-medium transition-all ${getStatusColor()} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-netsurit-red`}
        role="button"
        aria-expanded={isExpanded}
        aria-label={`Backend status: ${getStatusText()}. Click for details.`}
        data-testid="health-badge-toggle"
      >
        <span className="text-white font-bold">{getStatusIcon()}</span>
        <span>{getStatusText()}</span>
        <span className="text-xs opacity-75">
          {formatTimestamp(lastChecked)}
        </span>
        <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isExpanded && healthData && (
        <div 
          className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-professional-gray-200 p-4 z-50"
          role="region"
          aria-label="Health check details"
          data-testid="health-details"
        >
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-professional-gray-900">
                System Health
              </h3>
              <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>

            {/* Service Info */}
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-professional-gray-600">Service:</span>
                <span className="font-medium text-professional-gray-900">
                  {healthData.service || 'DreamSpace API'}
                </span>
              </div>
              {healthData.version && (
                <div className="flex justify-between">
                  <span className="text-professional-gray-600">Version:</span>
                  <span className="font-medium text-professional-gray-900">
                    {healthData.version}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-professional-gray-600">Last Check:</span>
                <span className="font-medium text-professional-gray-900">
                  {formatTimestamp(lastChecked)}
                </span>
              </div>
            </div>

            {/* Component Checks */}
            {healthData.checks && (
              <div className="space-y-2 border-t pt-2">
                <h4 className="text-xs font-semibold text-professional-gray-700 uppercase">
                  Components
                </h4>
                
                {Object.entries(healthData.checks).map(([component, check]) => (
                  <div 
                    key={component}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        check.status === 'healthy' ? 'bg-green-500' :
                        check.status === 'degraded' ? 'bg-yellow-500' :
                        check.status === 'unhealthy' ? 'bg-red-500' :
                        'bg-gray-400'
                      }`} />
                      <span className="capitalize text-professional-gray-900">
                        {component}
                      </span>
                    </div>
                    <div className="text-right">
                      {check.responseTime !== undefined && (
                        <span className="text-xs text-professional-gray-600">
                          {check.responseTime}ms
                        </span>
                      )}
                      {check.message && (
                        <div className="text-xs text-professional-gray-500">
                          {check.message}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error message if unhealthy */}
            {healthData.message && status === HealthStatus.UNHEALTHY && (
              <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-800">
                {healthData.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

HealthBadge.propTypes = {
  pollInterval: PropTypes.number,
  showDetails: PropTypes.bool,
  className: PropTypes.string
};

export default HealthBadge;
