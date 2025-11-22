// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useRef, useEffect } from 'react';
import { BookOpen, Plus, X } from 'lucide-react';
import { useDreamBook } from '../../hooks/useDreamBook';
import DreamGrid from './DreamGrid';
import DreamForm from './DreamForm';
import InspirationModal from './InspirationModal';
import DreamTrackerModal from '../../components/DreamTrackerModal';
import StockPhotoSearch from '../../components/StockPhotoSearch';
import HelpTooltip from '../../components/HelpTooltip';
import { buildTemplateFromInspiration } from '../../constants/dreamInspiration';

/**
 * Main orchestration component for Dream Book feature
 * Manages all modal states and composes child components
 */
export default function DreamBookLayout() {
  const {
    // Data
    dreams,
    maxDreams,
    currentUser,
    dreamCategories,
    loading,
    
    // Form state
    editingDream,
    isCreating,
    formData,
    setFormData,
    uploadingImage,
    
    // Modal state
    viewingDream,
    showStockPhotoSearch,
    showInspiration,
    
    // Drag state
    draggingIndex,
    dragOverIndex,
    
    // Inspiration state
    inspirationCategory,
    setInspirationCategory,
    filteredInspiration,
    loadingInspiration,
    inspirationError,
    
    // Dream CRUD handlers
    handleEdit,
    handleCreate,
    handleSave,
    handleCancel,
    handleDelete,
    
    // Image handlers
    handleImageUpload,
    
    // Dream tracker handlers
    handleViewDream,
    handleCloseDreamModal,
    handleUpdateDream,
    
    // Stock photo handlers
    handleOpenStockPhotoSearch,
    handleSelectStockPhoto,
    handleCloseStockPhotoSearch,
    
    // Inspiration handlers
    handleOpenInspiration,
    handleCloseInspiration,
    
    // Drag & drop handlers
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    
    // Reorder actions
    reorderDreams
  } = useDreamBook();

  const editTitleRef = useRef(null);

  // Focus title input and scroll the editing card into view when editing starts
  useEffect(() => {
    if (!editingDream) return;
    const el = document.getElementById(`dream-card-${editingDream}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Slight delay to ensure input mounted
    setTimeout(() => {
      if (editTitleRef.current) {
        editTitleRef.current.focus({ preventScroll: true });
      }
    }, 50);
  }, [editingDream]);

  // Handle adding dream from inspiration
  const handleAddFromInspiration = (item) => {
    if (dreams.length >= maxDreams) return;
    
    const tpl = buildTemplateFromInspiration(item);
    const newDream = {
      id: `dream_${Date.now()}`,
      title: item.title,
      category: tpl.category,
      description: tpl.description,
      progress: 25,
      image: item.image,
      milestones: tpl.milestones,
      notes: tpl.notes,
      history: [],
      goals: []
    };
    
    // The useDreamBook hook handles adding through handleEdit
    // which will add the dream via the context
    handleCloseInspiration();
    // Trigger create mode with pre-filled data
    handleCreate();
    // Update form data with inspiration content
    setFormData({
      title: newDream.title,
      category: newDream.category,
      description: newDream.description,
      isPublic: false,
      image: newDream.image,
      firstGoal: {
        enabled: false,
        title: '',
        consistency: 'weekly',
        targetWeeks: 12,
        targetMonths: 6
      }
    });
  };

  // Early return for loading state
  if (loading) {
    return (
      <div 
        className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]"
        role="status"
        aria-live="polite"
        data-testid="dream-book-loading"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dream-blue mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-gray-600">Loading Dream Book...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-4 sm:space-y-4"
      data-testid="dream-book-layout"
    >
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col justify-center">
            <div className="flex items-center space-x-3 mb-2">
              <BookOpen className="h-8 w-8 text-netsurit-red" aria-hidden="true" />
              <h1 className="text-2xl sm:text-3xl font-bold text-professional-gray-900">
                My Dream Book
              </h1>
              <HelpTooltip 
                title="Dream Book Guide"
                content="Create up to 10 personal or professional dreams. Add titles, categories, descriptions, and images. Track progress from 0-100%. Click on any dream to view details and update progress. Drag to reorder your dreams."
              />
            </div>
            <p className="text-professional-gray-600">
              Document and track your personal dreams ({dreams.length}/{maxDreams} dreams)
            </p>
          </div>

          <div className="flex items-center gap-3">
            {dreams.length < maxDreams && !isCreating && (
              <button
                onClick={handleCreate}
                aria-label="Add new dream"
                data-testid="add-dream-button"
                className="inline-flex items-center justify-center px-6 py-3 bg-netsurit-red text-white rounded-xl hover:bg-netsurit-red focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium space-x-2"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
                <span>Add Dream</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenInspiration}
              aria-label="Find inspiration for dreams"
              data-testid="find-inspiration-button"
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-professional-gray-600 to-professional-gray-700 text-white rounded-xl hover:from-professional-gray-700 hover:to-professional-gray-800 focus:outline-none focus:ring-2 focus:ring-professional-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              Find Inspiration
            </button>
          </div>
        </div>
      </div>

      {/* Dreams Grid */}
      <DreamGrid
        dreams={dreams}
        maxDreams={maxDreams}
        editingDream={editingDream}
        draggingIndex={draggingIndex}
        dragOverIndex={dragOverIndex}
        formData={formData}
        setFormData={setFormData}
        dreamCategories={dreamCategories}
        uploadingImage={uploadingImage}
        inputRef={editTitleRef}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        onSave={handleSave}
        onCancel={handleCancel}
        onImageUpload={handleImageUpload}
        onOpenStockPhotoSearch={handleOpenStockPhotoSearch}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleViewDream}
        onCreate={handleCreate}
        onReorder={reorderDreams}
      />

      {/* Create Dream Modal */}
      {isCreating && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-dream-title"
          data-testid="create-dream-modal"
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-professional-gray-200">
              <h3 
                id="create-dream-title"
                className="text-xl font-semibold text-professional-gray-900"
              >
                Add New Dream
              </h3>
              <button
                type="button"
                onClick={handleCancel}
                aria-label="Close modal"
                data-testid="close-create-modal"
                className="p-2 text-professional-gray-400 hover:text-professional-gray-600 hover:bg-professional-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="p-6">
              <DreamForm
                formData={formData}
                setFormData={setFormData}
                onSave={handleSave}
                onCancel={handleCancel}
                onImageUpload={handleImageUpload}
                onOpenStockPhotoSearch={handleOpenStockPhotoSearch}
                dreamCategories={dreamCategories}
                isEditing={false}
                inputRef={editTitleRef}
                uploadingImage={uploadingImage}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dream Tracker Modal */}
      {viewingDream && (
        <DreamTrackerModal
          dream={viewingDream}
          onClose={handleCloseDreamModal}
          onUpdate={handleUpdateDream}
        />
      )}

      {/* Stock Photo Search Modal */}
      {showStockPhotoSearch && (
        <StockPhotoSearch
          searchTerm=""
          onSelectImage={handleSelectStockPhoto}
          onClose={handleCloseStockPhotoSearch}
        />
      )}

      {/* Inspiration Modal */}
      <InspirationModal
        isOpen={showInspiration}
        onClose={handleCloseInspiration}
        filteredInspiration={filteredInspiration}
        inspirationCategory={inspirationCategory}
        setInspirationCategory={setInspirationCategory}
        loadingInspiration={loadingInspiration}
        inspirationError={inspirationError}
        onAddDream={handleAddFromInspiration}
        canAddDream={dreams.length < maxDreams}
      />
    </div>
  );
}

