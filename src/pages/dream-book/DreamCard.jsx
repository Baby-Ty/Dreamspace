// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { memo } from 'react';
import PropTypes from 'prop-types';
import { Pencil, Trash, Image } from 'lucide-react';

/**
 * Presentation component for displaying a single dream card
 * Displays dream image, title, description, category, and progress
 */
function DreamCard({ dream, onEdit, onDelete, onView }) {
  const handleCardKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onView();
    }
  };

  return (
    <div
      className="group relative flex flex-col h-full cursor-pointer select-none overflow-hidden rounded-2xl bg-white border border-professional-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-netsurit-red/20"
      onClick={onView}
      role="button"
      tabIndex={0}
      onKeyDown={handleCardKey}
      data-testid="dream-card"
      aria-label={`View ${dream.title} dream`}
    >
      {/* Top-right icon buttons */}
      <div className="absolute top-3 right-3 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          title="Edit dream"
          aria-label={`Edit ${dream.title}`}
          data-testid="edit-dream-button"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red transition-all duration-200"
        >
          <Pencil className="w-4 h-4 text-professional-gray-700" aria-hidden="true" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete dream"
          aria-label={`Delete ${dream.title}`}
          data-testid="delete-dream-button"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
        >
          <Trash className="w-4 h-4 text-red-600" aria-hidden="true" />
        </button>
      </div>

      {/* Image */}
      <div className="relative flex-shrink-0 overflow-hidden">
        {dream.image ? (
          <img 
            src={dream.image} 
            alt={dream.title} 
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" 
            draggable={false} 
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-professional-gray-100 to-professional-gray-200 flex items-center justify-center">
            <Image className="w-12 h-12 text-professional-gray-400" aria-hidden="true" />
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span 
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-professional-gray-800 shadow-md border border-white/20"
            data-testid="dream-category"
          >
            {dream.category}
          </span>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true"></div>
      </div>

      {/* Content */}
      <div className="flex flex-col h-full p-5">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-professional-gray-900 mb-3 line-clamp-2 group-hover:text-netsurit-red transition-colors duration-200">
            {dream.title}
          </h3>
          <p className="text-sm text-professional-gray-600 line-clamp-3 leading-relaxed mb-4">
            {dream.description}
          </p>
        </div>

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-professional-gray-700">Progress</span>
            <span 
              className="text-sm font-bold text-netsurit-red"
              data-testid="dream-progress"
              aria-label={`${dream.progress}% complete`}
            >
              {dream.progress}%
            </span>
          </div>
          
          {/* Enhanced Progress Bar */}
          <div className="relative">
            <div 
              className="w-full bg-professional-gray-200 rounded-full h-2 overflow-hidden"
              role="progressbar"
              aria-valuenow={dream.progress}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label={`Dream progress: ${dream.progress}%`}
            >
              <div
                className="bg-gradient-to-r from-netsurit-red via-netsurit-coral to-netsurit-orange h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                style={{ width: `${dream.progress}%` }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer" aria-hidden="true"></div>
              </div>
            </div>
            
            {/* Progress milestone indicators */}
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-between px-1" aria-hidden="true">
              {[25, 50, 75].map((milestone) => (
                <div
                  key={milestone}
                  className={`w-1 h-4 rounded-full transition-colors duration-300 ${
                    dream.progress >= milestone 
                      ? 'bg-white shadow-sm' 
                      : 'bg-professional-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5">
          <button
            onClick={(e) => { e.stopPropagation(); onView(); }}
            aria-label={`View details for ${dream.title}`}
            data-testid="view-dream-button"
            className="w-full py-3 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-xl font-semibold text-sm hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            View Details
          </button>
        </div>
      </div>
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


