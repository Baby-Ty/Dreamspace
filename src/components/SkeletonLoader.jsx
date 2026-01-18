
/**
 * Skeleton loader for individual goal items
 * Provides better perceived performance during loading states
 */
export const GoalSkeleton = () => (
  <div 
    className="animate-pulse bg-white rounded-xl p-4 border border-gray-200"
    role="status"
    aria-label="Loading goal"
    data-testid="goal-skeleton"
  >
    <div className="flex items-start space-x-3">
      <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0" aria-hidden="true"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" aria-hidden="true"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2" aria-hidden="true"></div>
      </div>
    </div>
    <span className="sr-only">Loading goal...</span>
  </div>
);

/**
 * Skeleton loader for a list of goals
 * @param {Object} props - Component props
 * @param {number} [props.count=3] - Number of skeleton items to display
 */
export const GoalListSkeleton = ({ count = 3 }) => (
  <div className="space-y-3" data-testid="goal-list-skeleton" role="status" aria-label="Loading goals">
    {Array.from({ length: count }).map((_, i) => (
      <GoalSkeleton key={`skeleton-${i}`} />
    ))}
    <span className="sr-only">Loading {count} goals...</span>
  </div>
);

/**
 * Skeleton loader for dream cards
 * Used in dashboard dream grid
 */
export const DreamCardSkeleton = () => (
  <div 
    className="animate-pulse bg-white rounded-xl p-4 border border-gray-200 shadow-lg"
    role="status"
    aria-label="Loading dream"
    data-testid="dream-skeleton"
  >
    <div className="space-y-3">
      <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto" aria-hidden="true"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto" aria-hidden="true"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" aria-hidden="true"></div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2" aria-hidden="true"></div>
      <div className="h-8 bg-gray-200 rounded w-full" aria-hidden="true"></div>
    </div>
    <span className="sr-only">Loading dream...</span>
  </div>
);

/**
 * Skeleton loader for dashboard stats
 */
export const StatsSkeleton = () => (
  <div 
    className="animate-pulse flex space-x-4"
    role="status"
    aria-label="Loading statistics"
    data-testid="stats-skeleton"
  >
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex-1 bg-white rounded-xl p-4 border border-gray-200">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" aria-hidden="true"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4" aria-hidden="true"></div>
      </div>
    ))}
    <span className="sr-only">Loading statistics...</span>
  </div>
);

/**
 * Generic content skeleton
 * @param {Object} props - Component props
 * @param {string} [props.className=''] - Additional CSS classes
 */
export const ContentSkeleton = ({ className = '' }) => (
  <div 
    className={`animate-pulse ${className}`}
    role="status"
    aria-label="Loading content"
    data-testid="content-skeleton"
  >
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-full" aria-hidden="true"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6" aria-hidden="true"></div>
      <div className="h-4 bg-gray-200 rounded w-4/6" aria-hidden="true"></div>
    </div>
    <span className="sr-only">Loading content...</span>
  </div>
);
