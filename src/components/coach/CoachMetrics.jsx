import PropTypes from 'prop-types';
import { Users2, TrendingUp, Target, Activity, Award, Heart } from 'lucide-react';

/**
 * Pure presentational component for displaying coach team metrics
 * @param {Object} metrics - Metrics object with teamSize, averageScore, engagementRate, etc.
 * @param {Object} coach - Coach object with name, office, email
 */
function CoachMetrics({ metrics, coach }) {
  if (!metrics) {
    return (
      <div 
        className="text-center py-8 text-professional-gray-500"
        data-testid="coach-metrics-empty"
      >
        <Activity className="w-12 h-12 mx-auto mb-3 text-professional-gray-300" />
        <p>No metrics available</p>
      </div>
    );
  }

  const metricCards = [
    {
      label: 'Team Size',
      value: metrics.teamSize || 0,
      icon: Users2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Average Score',
      value: metrics.averageScore || 0,
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      suffix: ' pts'
    },
    {
      label: 'Engagement Rate',
      value: `${metrics.engagementRate || 0}%`,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Exceeding',
      value: metrics.exceeding || 0,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      description: 'Members scoring 60+'
    },
    {
      label: 'On Track',
      value: metrics.onTrack || 0,
      icon: Target,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      description: 'Members scoring 30-59'
    },
    {
      label: 'Needs Attention',
      value: metrics.needsAttention || 0,
      icon: Activity,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      description: 'Members scoring <30'
    }
  ];

  if (metrics.totalDreams !== undefined) {
    metricCards.push({
      label: 'Total Dreams',
      value: metrics.totalDreams,
      icon: Target,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
    });
  }

  if (metrics.totalConnects !== undefined) {
    metricCards.push({
      label: 'Total Connects',
      value: metrics.totalConnects,
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    });
  }

  return (
    <div className="space-y-6" data-testid="coach-metrics">
      {/* Coach Info Summary */}
      {coach && (
        <div 
          className="bg-professional-gray-50 rounded-xl p-4 border border-professional-gray-200"
          data-testid="coach-info-summary"
        >
          <h3 className="text-sm font-semibold text-professional-gray-700 mb-2">
            Coach Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-professional-gray-600">Name:</span>
              <span className="ml-2 font-medium text-professional-gray-900">{coach.name}</span>
            </div>
            <div>
              <span className="text-professional-gray-600">Office:</span>
              <span className="ml-2 font-medium text-professional-gray-900">{coach.office}</span>
            </div>
            {coach.email && (
              <div className="md:col-span-2">
                <span className="text-professional-gray-600">Email:</span>
                <span className="ml-2 font-medium text-professional-gray-900">{coach.email}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div data-testid="metrics-grid">
        <h3 className="text-lg font-semibold text-professional-gray-900 mb-4">
          Team Performance Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {metricCards.map((metric, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-4 border border-professional-gray-200 shadow-sm hover:shadow-md transition-shadow"
              role="article"
              aria-label={`${metric.label}: ${metric.value}${metric.suffix || ''}`}
              data-testid={`metric-${metric.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`w-5 h-5 ${metric.color}`} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-professional-gray-900">
                  {metric.value}{metric.suffix || ''}
                </p>
                <p className="text-xs text-professional-gray-600 mt-1">
                  {metric.label}
                </p>
                {metric.description && (
                  <p className="text-xs text-professional-gray-500 mt-1">
                    {metric.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Breakdown */}
      {metrics.teamSize > 0 && (
        <div 
          className="bg-white rounded-xl p-4 border border-professional-gray-200"
          data-testid="performance-distribution"
        >
          <h4 className="text-sm font-semibold text-professional-gray-700 mb-3">
            Performance Distribution
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-professional-gray-600">Exceeding Expectations</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-professional-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${((metrics.exceeding || 0) / metrics.teamSize) * 100}%` 
                    }}
                  />
                </div>
                <span className="font-medium text-professional-gray-900 w-12 text-right">
                  {Math.round(((metrics.exceeding || 0) / metrics.teamSize) * 100)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-professional-gray-600">On Track</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-professional-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${((metrics.onTrack || 0) / metrics.teamSize) * 100}%` 
                    }}
                  />
                </div>
                <span className="font-medium text-professional-gray-900 w-12 text-right">
                  {Math.round(((metrics.onTrack || 0) / metrics.teamSize) * 100)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-professional-gray-600">Needs Attention</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-professional-gray-200 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${((metrics.needsAttention || 0) / metrics.teamSize) * 100}%` 
                    }}
                  />
                </div>
                <span className="font-medium text-professional-gray-900 w-12 text-right">
                  {Math.round(((metrics.needsAttention || 0) / metrics.teamSize) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

CoachMetrics.propTypes = {
  metrics: PropTypes.shape({
    teamSize: PropTypes.number,
    averageScore: PropTypes.number,
    engagementRate: PropTypes.number,
    exceeding: PropTypes.number,
    onTrack: PropTypes.number,
    needsAttention: PropTypes.number,
    totalDreams: PropTypes.number,
    totalConnects: PropTypes.number
  }),
  coach: PropTypes.shape({
    name: PropTypes.string,
    office: PropTypes.string,
    email: PropTypes.string
  })
};

CoachMetrics.defaultProps = {
  metrics: null,
  coach: null
};

export default CoachMetrics;
