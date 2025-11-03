// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { memo } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import { inspirationCategories } from '../../constants/dreamInspiration';

/**
 * Modal component for browsing and adding dream inspiration templates
 * Allows users to filter by category and add pre-built dream templates
 */
function InspirationModal({
  isOpen,
  onClose,
  filteredInspiration,
  inspirationCategory,
  setInspirationCategory,
  loadingInspiration,
  inspirationError,
  onAddDream,
  canAddDream
}) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspiration-modal-title"
      data-testid="inspiration-modal"
    >
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden">
        {/* Modal Header with horizontally scrollable category pills */}
        <div className="flex items-center gap-3 p-5 border-b border-professional-gray-200">
          <h3 
            id="inspiration-modal-title"
            className="text-xl font-semibold text-professional-gray-900 shrink-0"
          >
            Find Inspiration
          </h3>
          <div className="flex-1 overflow-x-auto horizontal-scroll pb-2 -mb-2">
            <div 
              className="flex items-center gap-2 whitespace-nowrap pr-2"
              role="group"
              aria-label="Filter by category"
            >
              {inspirationCategories.map((c) => (
                <button
                  key={c}
                  onClick={() => setInspirationCategory(c)}
                  aria-pressed={inspirationCategory === c}
                  data-testid={`category-filter-${c.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`rounded-full px-4 py-1 text-sm transition-colors ${
                    inspirationCategory === c
                      ? 'bg-netsurit-red/10 text-netsurit-red font-semibold'
                      : 'bg-professional-gray-100 text-professional-gray-700 hover:bg-professional-gray-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close inspiration modal"
            data-testid="close-inspiration-button"
            className="p-2 text-professional-gray-400 hover:text-professional-gray-600 hover:bg-professional-gray-100 rounded-lg shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto overscroll-contain scrollbar-clean">

          {loadingInspiration && (
            <div 
              className="text-center text-professional-gray-600 py-6"
              role="status"
              aria-live="polite"
            >
              Loading images…
            </div>
          )}
          {inspirationError && (
            <div 
              className="text-center text-red-600 py-4 text-sm"
              role="alert"
            >
              {inspirationError}
            </div>
          )}
          {/* Grid */}
          <div 
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
            data-testid="inspiration-grid"
          >
            {filteredInspiration.map((item) => (
              <div 
                key={item.id} 
                className="rounded-xl border border-professional-gray-200 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full"
                data-testid={`inspiration-item-${item.id}`}
              >
                <div className="relative">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-40 object-cover" 
                    />
                  ) : (
                    <div className="w-full h-40 bg-professional-gray-200 flex items-center justify-center text-professional-gray-500 text-sm">
                      No image
                    </div>
                  )}
                  <span className="absolute top-2 left-2 bg-white px-2 py-1 rounded-full text-xs font-medium">
                    {item.category}
                  </span>
                </div>
                <div className="p-4 flex flex-col gap-2 h-full">
                  <h4 className="font-semibold text-professional-gray-900 truncate text-center">
                    {item.title}
                  </h4>
                  <button
                    type="button"
                    onClick={() => onAddDream(item)}
                    disabled={!canAddDream}
                    aria-label={`Add ${item.title} to dream book`}
                    data-testid={`add-inspiration-${item.id}`}
                    className="mt-auto w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add to My Dream Book
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredInspiration.length === 0 && !loadingInspiration && !inspirationError && (
            <div 
              className="text-center text-professional-gray-500 py-12"
              role="status"
            >
              <p className="text-lg font-medium mb-2">No inspiration found</p>
              <p className="text-sm">Try selecting a different category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

InspirationModal.propTypes = {
  /** Whether modal is open */
  isOpen: PropTypes.bool.isRequired,
  /** Callback to close modal */
  onClose: PropTypes.func.isRequired,
  /** Filtered inspiration items to display */
  filteredInspiration: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    owner: PropTypes.string,
    status: PropTypes.string,
    image: PropTypes.string,
  })).isRequired,
  /** Currently selected category filter */
  inspirationCategory: PropTypes.string.isRequired,
  /** Function to set category filter */
  setInspirationCategory: PropTypes.func.isRequired,
  /** Whether inspiration is loading */
  loadingInspiration: PropTypes.bool.isRequired,
  /** Error message if loading failed */
  inspirationError: PropTypes.string,
  /** Callback when dream is added */
  onAddDream: PropTypes.func.isRequired,
  /** Whether user can add more dreams */
  canAddDream: PropTypes.bool.isRequired,
};

// Memoize to prevent unnecessary re-renders
export default memo(InspirationModal);

