// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { memo } from 'react';
import PropTypes from 'prop-types';
import { Plus } from 'lucide-react';
import DreamCard from './DreamCard';
import DreamForm from './DreamForm';

/**
 * Presentation component for displaying the dream grid
 * Handles dream card rendering, drag & drop, empty slots, and quick add card
 */
function DreamGrid({ 
  dreams,
  maxDreams,
  editingDream,
  draggingIndex,
  dragOverIndex,
  formData,
  setFormData,
  dreamCategories,
  uploadingImage,
  inputRef,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onSave,
  onCancel,
  onImageUpload,
  onOpenStockPhotoSearch,
  onOpenAIImageGenerator,
  onEdit,
  onDelete,
  onView,
  onCreate,
  onReorder,
  radarChart,
  visionCard
}) {
  return (
    <div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
      data-testid="dream-grid"
    >
      {/* Radar Chart - spans 2 columns */}
      {radarChart && (
        <div className="col-span-1 sm:col-span-2 bg-white rounded-2xl border border-professional-gray-200 shadow-lg min-h-[400px] flex items-center justify-center">
          {radarChart}
        </div>
      )}

      {/* Year Vision Card - spans 2 columns */}
      {visionCard && (
        <div className="col-span-1 sm:col-span-2 bg-white rounded-2xl border border-professional-gray-200 shadow-lg min-h-[400px] hover:shadow-xl transition-shadow duration-300">
          {visionCard}
        </div>
      )}

      {/* Existing Dreams */}
      {dreams.map((dream, index) => (
        <div
          key={dream.id}
          id={`dream-card-${dream.id}`}
          className={`relative h-full ${dragOverIndex === index && draggingIndex !== null ? 'ring-4 ring-netsurit-red ring-opacity-50' : ''}`}
          draggable={editingDream === null}
          onDragStart={(e) => { if (editingDream === null) onDragStart(e, index); }}
          onDragOver={(e) => { if (editingDream === null) onDragOver(e, index); }}
          onDrop={(e) => { if (editingDream === null) onDrop(e, index); }}
          onDragEnd={() => { if (editingDream === null) onDragEnd(); }}
          aria-grabbed={editingDream === null && draggingIndex === index}
          aria-dropeffect={editingDream === null ? 'move' : undefined}
          data-testid={`dream-card-wrapper-${index}`}
        >
          {/* Reorder controls - hidden while editing to allow text selection */}
          {editingDream === null && (
            <div className="absolute -top-4 right-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                type="button"
                onClick={() => { if (index > 0) onReorder(index, index - 1); }}
                title="Move left"
                aria-label="Move dream left"
                data-testid={`move-left-button-${index}`}
                className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl text-professional-gray-700 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-netsurit-red transition-all duration-200 hover:scale-110"
              >
                <span className="text-sm font-bold" aria-hidden="true">◀</span>
              </button>
              <button
                type="button"
                onClick={() => { if (index < dreams.length - 1) onReorder(index, index + 1); }}
                title="Move right"
                aria-label="Move dream right"
                data-testid={`move-right-button-${index}`}
                className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl text-professional-gray-700 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-netsurit-red transition-all duration-200 hover:scale-110"
              >
                <span className="text-sm font-bold" aria-hidden="true">▶</span>
              </button>
            </div>
          )}
          {editingDream === dream.id ? (
            <DreamForm
              formData={formData}
              setFormData={setFormData}
              onSave={onSave}
              onCancel={onCancel}
              onImageUpload={onImageUpload}
              onOpenStockPhotoSearch={onOpenStockPhotoSearch}
              onOpenAIImageGenerator={onOpenAIImageGenerator}
              dreamCategories={dreamCategories}
              isEditing={true}
              inputRef={inputRef}
              uploadingImage={uploadingImage}
            />
          ) : (
            <DreamCard
              dream={dream}
              onEdit={() => onEdit(dream)}
              onDelete={() => onDelete(dream.id)}
              onView={() => onView(dream)}
            />
          )}
        </div>
      ))}

      {/* Quick Add Dream Card (opens modal) */}
      {dreams.length < maxDreams && (
        <button
          type="button"
          onClick={onCreate}
          aria-label="Add new dream"
          data-testid="quick-add-dream-button"
          className="group bg-white rounded-2xl border-2 border-dashed border-netsurit-red/30 hover:border-netsurit-red/60 hover:bg-gradient-to-br hover:from-netsurit-red/5 hover:to-netsurit-coral/5 shadow-lg hover:shadow-2xl p-8 flex items-center justify-center h-full transition-all duration-300 hover:scale-[1.02] min-h-[400px]"
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-netsurit-red/10 group-hover:bg-netsurit-red/20 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
              <Plus className="w-8 h-8 text-netsurit-red group-hover:text-netsurit-coral transition-colors duration-300" aria-hidden="true" />
            </div>
            <p className="text-xl font-bold text-netsurit-red group-hover:text-netsurit-coral transition-colors duration-300 mb-2">Add Dream</p>
            <p className="text-sm text-professional-gray-600 group-hover:text-professional-gray-700 transition-colors duration-300">Create a new dream entry</p>
          </div>
        </button>
      )}

      {/* Empty slots */}
      {Array.from({ length: Math.max(0, maxDreams - dreams.length - (dreams.length < maxDreams ? 1 : 0)) }).map((_, index) => (
        <div
          key={`empty-${index}`}
          className="bg-gradient-to-br from-professional-gray-50 to-professional-gray-100 rounded-2xl border-2 border-dashed border-professional-gray-300 flex items-center justify-center min-h-[400px] hover:border-professional-gray-400 hover:from-professional-gray-100 hover:to-professional-gray-150 transition-all duration-300"
          aria-label={`Empty dream slot ${dreams.length + index + 2}`}
          data-testid={`empty-slot-${index}`}
        >
          <div className="text-center text-professional-gray-400">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-professional-gray-200 flex items-center justify-center">
              <Plus className="w-6 h-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium">Dream slot {dreams.length + index + 2}</p>
            <p className="text-xs text-professional-gray-400 mt-1">Available</p>
          </div>
        </div>
      ))}
    </div>
  );
}

DreamGrid.propTypes = {
  /** Array of dream objects */
  dreams: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    image: PropTypes.string,
    progress: PropTypes.number.isRequired,
  })).isRequired,
  /** Maximum number of dreams allowed */
  maxDreams: PropTypes.number.isRequired,
  /** ID of dream currently being edited */
  editingDream: PropTypes.string,
  /** Index of dream being dragged */
  draggingIndex: PropTypes.number,
  /** Index of dream being dragged over */
  dragOverIndex: PropTypes.number,
  /** Form data for editing */
  formData: PropTypes.object.isRequired,
  /** Function to update form data */
  setFormData: PropTypes.func.isRequired,
  /** Array of dream categories */
  dreamCategories: PropTypes.arrayOf(PropTypes.string).isRequired,
  /** Whether image is uploading */
  uploadingImage: PropTypes.bool.isRequired,
  /** Ref for input focus */
  inputRef: PropTypes.object,
  /** Drag start handler */
  onDragStart: PropTypes.func.isRequired,
  /** Drag over handler */
  onDragOver: PropTypes.func.isRequired,
  /** Drop handler */
  onDrop: PropTypes.func.isRequired,
  /** Drag end handler */
  onDragEnd: PropTypes.func.isRequired,
  /** Save handler */
  onSave: PropTypes.func.isRequired,
  /** Cancel handler */
  onCancel: PropTypes.func.isRequired,
  /** Image upload handler */
  onImageUpload: PropTypes.func.isRequired,
  /** Stock photo search handler */
  onOpenStockPhotoSearch: PropTypes.func.isRequired,
  /** AI image generator handler */
  onOpenAIImageGenerator: PropTypes.func.isRequired,
  /** Edit dream handler */
  onEdit: PropTypes.func.isRequired,
  /** Delete dream handler */
  onDelete: PropTypes.func.isRequired,
  /** View dream handler */
  onView: PropTypes.func.isRequired,
  /** Create dream handler */
  onCreate: PropTypes.func.isRequired,
  /** Reorder handler */
  onReorder: PropTypes.func.isRequired,
  /** Optional radar chart component to display as first grid item */
  radarChart: PropTypes.node,
  /** Optional year vision card component to display next to radar chart */
  visionCard: PropTypes.node,
};

// Memoize to prevent unnecessary re-renders
export default memo(DreamGrid);

