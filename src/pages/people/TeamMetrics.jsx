import { Users2, TrendingUp, Activity, AlertCircle, Target, Award } from 'lucide-react';

/**
 * Pure presentational component for displaying team metrics
 * @param {Object} metrics - Overall team metrics
 */
export default function TeamMetrics({ metrics }) {
  if (!metrics) return null;

  const metricCards = [
    {
      title: 'Total Employees',
      value: metrics.totalEmployees,
      icon: Users2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Coaches',
      value: metrics.totalCoaches,
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Team Members',
      value: metrics.totalTeamMembers,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Unassigned',
      value: metrics.totalUnassigned,
      icon: UserPlus,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Avg Engagement',
      value: `${metrics.avgEngagement}%`,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      title: 'Active Alerts',
      value: metrics.totalAlerts,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Avg Team Score',
      value: metrics.avgTeamScore,
      icon: Activity,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100'
    },
    {
      title: 'Program Adoption',
      value: `${metrics.programAdoption}%`,
      icon: Target,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100'
    }
  ];

  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      role="region"
      aria-label="Team metrics overview"
    >
      {metricCards.map((metric, index) => (
        <div 
          key={index}
          className="bg-white rounded-xl p-4 border border-professional-gray-200 shadow-sm hover:shadow-md transition-shadow"
          role="article"
          aria-label={`${metric.title}: ${metric.value}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-professional-gray-600 mb-1">{metric.title}</p>
              <p className="text-2xl font-bold text-professional-gray-900">{metric.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${metric.bgColor}`}>
              <metric.icon className={`w-6 h-6 ${metric.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Missing UserPlus import fix
function UserPlus({ className }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  );
}
