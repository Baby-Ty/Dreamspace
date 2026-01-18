
import { memo } from 'react';
import PropTypes from 'prop-types';
import { Target } from 'lucide-react';

/**
 * Compact presentation component for displaying a dream card on the dashboard
 * Displays dream image, title, category, and progress in an immersive layout
 */
function DashboardDreamCard({ dream, onClick }) {
  const handleCardKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  // Determine progress color based on completion
  const getProgressColor = (progress) => {
    if (progress >= 100) return 'from-netsurit-orange to-netsurit-warm-orange';
    if (progress >= 75) return 'from-netsurit-coral to-netsurit-orange';
    if (progress >= 50) return 'from-netsurit-red to-netsurit-coral';
    return 'from-netsurit-red to-netsurit-coral';
  };

  return (
    <div
      className="group relative flex flex-col h-full min-h-[280px] cursor-pointer select-none overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleCardKey}
      data-testid="dashboard-dream-card"
      aria-label={`View ${dream.title} dream`}
    >
      {/* Full-bleed Background Image */}
      <div className="absolute inset-0">
        {dream.image ? (
          <img 
            src={dream.image} 
            alt="" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            draggable={false} 
            aria-hidden="true"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-professional-gray-700 via-professional-gray-800 to-professional-gray-900">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-netsurit-red/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-netsurit-coral/20 rounded-full blur-3xl"></div>
            </div>
          </div>
        )}
        
        {/* Gradient Overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" aria-hidden="true"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true"></div>
      </div>

      {/* Spacer to push content down */}
      <div className="flex-grow"></div>

      {/* Content Overlay - Bottom */}
      <div className="relative z-10 p-5 pt-12 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        {/* Title */}
        <h3 
          className="text-xl font-bold text-white mb-2 line-clamp-2 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          data-testid="dream-title"
        >
          {dream.title}
        </h3>

        {/* Description - subtle */}
        {dream.description && (
          <p className="text-sm text-white/90 line-clamp-1 mb-4 drop-shadow-md font-medium">
            {dream.description}
          </p>
        )}

        {/* Progress Section */}
        <div className="space-y-2">
          {/* Progress Bar with percentage */}
          <div className="flex items-center gap-3">
            <div 
              className="flex-grow h-2.5 bg-black/40 rounded-full overflow-hidden backdrop-blur-sm ring-1 ring-white/20"
              role="progressbar"
              aria-valuenow={dream.progress}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${getProgressColor(dream.progress)} shadow-sm relative overflow-hidden`}
                style={{ width: `${dream.progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <span 
              className="text-sm font-bold text-white tabular-nums min-w-[3ch] text-right drop-shadow-md"
              data-testid="dream-progress"
              aria-label={`${dream.progress}% complete`}
            >
              {dream.progress}%
            </span>
        </div>

          {/* Milestones indicator (if available) */}
        {dream.milestones && dream.milestones.length > 0 && (
            <div className="flex items-center gap-1.5 text-white/60">
              <Target className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="text-xs font-medium" data-testid="milestones-count">
                {dream.milestones.filter(m => m.completed).length} of {dream.milestones.length} milestones
            </span>
          </div>
        )}
      </div>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl ring-2 ring-white/0 group-hover:ring-white/30 transition-all duration-500 pointer-events-none" aria-hidden="true"></div>
    </div>
  );
}

DashboardDreamCard.propTypes = {
  /** Dream object with all dream data */
  dream: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    category: PropTypes.string.isRequired,
    image: PropTypes.string,
    progress: PropTypes.number.isRequired,
    milestones: PropTypes.arrayOf(PropTypes.shape({
      completed: PropTypes.bool.isRequired,
    })),
  }).isRequired,
  /** Callback when card is clicked to view details */
  onClick: PropTypes.func.isRequired,
};

// Memoize to prevent unnecessary re-renders
export default memo(DashboardDreamCard);
