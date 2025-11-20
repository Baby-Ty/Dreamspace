// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.

const STATUS_STYLES = {
  'on-track': 'bg-green-100 text-green-700',
  'at-risk': 'bg-amber-100 text-amber-700',
  blocked: 'bg-red-100 text-red-700'
};

export default function StatusPill({ status }) {
  const normalizedStatus = status || 'unknown';
  const styles = STATUS_STYLES[normalizedStatus] || 'bg-professional-gray-100 text-professional-gray-600';

  return (
    <span
      className={`${styles} inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold`}
      data-testid={`build-overview-status-${normalizedStatus}`}
    >
      {normalizedStatus.replace('-', ' ')}
    </span>
  );
}




