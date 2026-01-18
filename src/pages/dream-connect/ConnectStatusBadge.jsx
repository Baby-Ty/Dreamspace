import { CheckCircle, Clock, Calendar } from 'lucide-react';

/**
 * ConnectStatusBadge Component
 * Displays the status of a Dream Connect with color-coded badge
 * Props:
 * - status: 'pending' | 'completed'
 * - className: Optional additional CSS classes
 */
export default function ConnectStatusBadge({ status = 'pending', className = '' }) {
  const statusConfig = {
    pending: {
      label: 'Pending',
      icon: Clock,
      bgClass: 'bg-professional-gray-200',
      textClass: 'text-professional-gray-700',
      iconClass: 'text-professional-gray-700'
    },
    completed: {
      label: 'Completed',
      icon: CheckCircle,
      bgClass: 'bg-gradient-to-r from-green-500 to-green-600',
      textClass: 'text-white',
      iconClass: 'text-white'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bgClass} ${config.textClass} ${className}`}
      data-testid={`connect-status-badge-${status}`}
      aria-label={`Connect status: ${config.label}`}
    >
      <Icon className={`w-3 h-3 ${config.iconClass}`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}
