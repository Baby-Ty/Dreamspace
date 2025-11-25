// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { memo } from 'react';
import PropTypes from 'prop-types';
import { Pencil, Trash, Sparkles, ChevronRight } from 'lucide-react';

/**
 * Presentation component for displaying a single dream card
 * Displays dream image, title, description, category, and progress
 * Refactored to match DashboardDreamCard full-card style
 */
function DreamCard({ dream, onEdit, onDelete, onView }) {
  const handleCardKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onView();
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
      className="group relative flex flex-col h-full min-h-[360px] cursor-pointer select-none overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]"
      onClick={onView}
      role="button"
      tabIndex={0}
      onKeyDown={handleCardKey}
      data-testid="dream-card"
      aria-label={`View ${dream.title} dream`}
    >
      {/* Full-bleed Background Image */}
      <div className="absolute inset-0">
        {dream.image ? (
          <img 
            src={dream.image} 
            alt={dream.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            draggable={false} 
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" aria-hidden="true"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true"></div>
      </div>

      {/* Top Controls Section */}
      <div className="relative z-10 flex justify-between items-start p-4">
        {/* Category Badge */}
        <span 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/90 backdrop-blur-md text-professional-gray-800 shadow-lg border border-white/50 transition-all duration-300 group-hover:bg-white group-hover:shadow-xl"
          data-testid="dream-category"
        >
          <Sparkles className="w-3 h-3 text-netsurit-coral" aria-hidden="true" />
          {dream.category}
        </span>

        {/* Edit/Delete Buttons */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            title="Edit dream"
            aria-label={`Edit ${dream.title}`}
            data-testid="edit-dream-button"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-professional-gray-800 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red transition-all duration-200"
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete dream"
            aria-label={`Delete ${dream.title}`}
            data-testid="delete-dream-button"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md hover:bg-red-500 text-white hover:text-white shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
          >
            <Trash className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Spacer to push content down */}
      <div className="flex-grow"></div>

      {/* Content Overlay - Bottom */}
      <div className="relative z-10 p-5 pt-2">
        {/* Title */}
        <h3 className="text-2xl font-bold text-white mb-3 line-clamp-2 leading-tight drop-shadow-lg text-center group-hover:scale-105 transition-transform duration-300">
          {dream.title}
        </h3>
        
        {/* Description */}
        <p className="text-base text-white/90 line-clamp-2 leading-relaxed mb-5 text-center drop-shadow-md font-medium">
          {dream.description}
        </p>

        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div 
              className="flex-grow h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm"
              role="progressbar"
              aria-valuenow={dream.progress}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label={`Dream progress: ${dream.progress}%`}
            >
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${getProgressColor(dream.progress)} relative overflow-hidden`}
                style={{ width: `${dream.progress}%` }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-shimmer" aria-hidden="true"></div>
              </div>
            </div>
            <span 
              className="text-sm font-bold text-white tabular-nums min-w-[3ch] drop-shadow-md"
              data-testid="dream-progress"
            >
              {dream.progress}%
            </span>
          </div>
          
          {/* Progress Milestones */}
          <div className="flex justify-between px-1">
             {[25, 50, 75].map((milestone) => (
                <div
                  key={milestone}
                  className={`w-1 h-1 rounded-full transition-colors duration-300 ${
                    dream.progress >= milestone 
                      ? 'bg-white shadow-sm scale-125' 
                      : 'bg-white/20'
                  }`}
                />
             ))}
          </div>

          {/* Click for more indicator */}
          <div className="text-[10px] font-medium uppercase tracking-widest flex items-center justify-center gap-1.5 opacity-60 group-hover:opacity-100 text-white mt-4 pt-2 border-t border-white/20 transition-opacity duration-300">
            <ChevronRight className="w-3 h-3" aria-hidden="true" />
            Click for more
          </div>
        </div>
      </div>
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl ring-2 ring-white/0 group-hover:ring-white/30 transition-all duration-500 pointer-events-none" aria-hidden="true"></div>
    </div>
  );
}

DreamCard.propTypes = {
  /** Dream object with all dream data */
  dream: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    image: PropTypes.string,
    progress: PropTypes.number.isRequired,
  }).isRequired,
  /** Callback when edit button is clicked */
  onEdit: PropTypes.func.isRequired,
  /** Callback when delete button is clicked */
  onDelete: PropTypes.func.isRequired,
  /** Callback when card is clicked to view details */
  onView: PropTypes.func.isRequired,
};

// Memoize to prevent unnecessary re-renders
export default memo(DreamCard);
