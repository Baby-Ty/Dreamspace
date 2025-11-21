// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { memo } from 'react';
import PropTypes from 'prop-types';
import { Image } from 'lucide-react';

/**
 * Compact presentation component for displaying a dream card on the dashboard
 * Displays dream image, title, category, and progress in a compact layout
 */
function DashboardDreamCard({ dream, onClick }) {
  const handleCardKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className="group relative flex flex-col h-full cursor-pointer select-none overflow-hidden rounded-xl bg-white border-2 border-professional-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] hover:border-netsurit-red/40"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleCardKey}
      data-testid="dashboard-dream-card"
      aria-label={`View ${dream.title} dream`}
    >
      {/* Image - Compact height */}
      <div className="relative flex-shrink-0 overflow-hidden">
        {dream.image ? (
          <img 
            src={dream.image} 
            alt={dream.title} 
            className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-110" 
            draggable={false} 
          />
        ) : (
          <div className="w-full h-36 bg-gradient-to-br from-netsurit-red/10 via-netsurit-coral/10 to-professional-gray-100 flex items-center justify-center">
            <Image className="w-10 h-10 text-professional-gray-400" aria-hidden="true" />
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-2.5 left-2.5">
          <span 
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/95 backdrop-blur-sm text-professional-gray-800 shadow-md border border-white/40"
            data-testid="dream-category"
          >
            {dream.category}
          </span>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true"></div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow p-4 bg-gradient-to-b from-white to-professional-gray-50/30">
        {/* Title */}
        <h3 
          className="text-base font-bold text-professional-gray-900 mb-3 line-clamp-2 leading-snug group-hover:text-netsurit-red transition-colors text-center"
          data-testid="dream-title"
        >
          {dream.title}
        </h3>

        {/* Description */}
        {dream.description && (
          <p className="text-sm text-professional-gray-600 line-clamp-2 leading-relaxed mb-3 text-center">
            {dream.description}
          </p>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          {/* Progress Percentage - Centered above bar */}
          <div className="flex justify-center">
            <span 
              className="text-sm font-bold text-netsurit-red"
              data-testid="dream-progress"
              aria-label={`${dream.progress}% complete`}
            >
              {dream.progress}%
            </span>
          </div>
          <div 
            className="w-full bg-professional-gray-200 rounded-full h-2 overflow-hidden shadow-inner"
            role="progressbar"
            aria-valuenow={dream.progress}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div 
              className="bg-gradient-to-r from-netsurit-red via-netsurit-coral to-netsurit-orange h-full rounded-full transition-all duration-500 ease-out shadow-sm relative overflow-hidden"
              style={{ width: `${dream.progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Milestones Count (if available) */}
        {dream.milestones && dream.milestones.length > 0 && (
          <div className="mt-3 flex items-center justify-between px-3 py-1.5 bg-white rounded-lg shadow-sm border border-professional-gray-200">
            <span className="text-xs font-medium text-professional-gray-600">Milestones</span>
            <span className="text-xs font-bold text-netsurit-red" data-testid="milestones-count">
              {dream.milestones.filter(m => m.completed).length}/{dream.milestones.length}
            </span>
          </div>
        )}
      </div>
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

