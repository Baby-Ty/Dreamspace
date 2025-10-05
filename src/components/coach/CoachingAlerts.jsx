// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import PropTypes from 'prop-types';
import { AlertCircle, Clock, Target } from 'lucide-react';

/**
 * Pure presentational component for displaying coaching alerts
 * @param {Array} alerts - Array of alert objects
 * @param {Function} onViewMember - Optional callback when alert is clicked (member) => void
 */
function CoachingAlerts({ alerts, onViewMember }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div 
        className="text-center py-8 text-professional-gray-500"
        data-testid="coaching-alerts-empty"
      >
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-professional-gray-300" />
        <p className="text-sm">No alerts at this time</p>
        <p className="text-xs mt-1">Team is performing well!</p>
      </div>
    );
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case 'inactive':
        return Clock;
      case 'low-engagement':
        return Target;
      default:
        return AlertCircle;
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="space-y-3" data-testid="coaching-alerts">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-professional-gray-900">
          Coaching Alerts
        </h3>
        <span 
          className="px-3 py-1 bg-netsurit-orange/10 text-netsurit-orange text-sm font-medium rounded-full"
          data-testid="alert-count"
        >
          {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {alerts.map((alert, index) => {
        const Icon = getAlertIcon(alert.type);
        const colorClass = getAlertColor(alert.severity);

        return (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 ${colorClass} transition-all duration-200 hover:shadow-md ${
              onViewMember ? 'cursor-pointer' : ''
            }`}
            onClick={() => onViewMember && alert.member && onViewMember(alert.member)}
            role={onViewMember ? 'button' : 'article'}
            tabIndex={onViewMember ? 0 : undefined}
            onKeyDown={(e) => {
              if (onViewMember && alert.member && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onViewMember(alert.member);
              }
            }}
            data-testid={`alert-${index}`}
            aria-label={`${alert.severity || 'info'} alert: ${alert.memberName || alert.title}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm">
                    {alert.memberName || alert.title}
                  </p>
                  {alert.severity && (
                    <span className="text-xs font-medium uppercase px-2 py-0.5 rounded">
                      {alert.severity}
                    </span>
                  )}
                </div>
                <p className="text-sm mb-2">
                  {alert.message || alert.description}
                </p>
                {alert.lastActivity && (
                  <p className="text-xs opacity-75">
                    Last activity: {alert.lastActivity}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

CoachingAlerts.propTypes = {
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string,
      severity: PropTypes.oneOf(['high', 'medium', 'low']),
      memberName: PropTypes.string,
      title: PropTypes.string,
      message: PropTypes.string,
      description: PropTypes.string,
      lastActivity: PropTypes.string,
      member: PropTypes.object
    })
  ),
  onViewMember: PropTypes.func
};

CoachingAlerts.defaultProps = {
  alerts: [],
  onViewMember: null
};

export default CoachingAlerts;

