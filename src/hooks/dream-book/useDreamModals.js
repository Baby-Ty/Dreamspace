import { useCallback } from 'react';
import { useModal } from '../useModal';
import itemService from '../../services/itemService';
import { toast } from '../../utils/toast';

/**
 * Hook for managing dream-related modals
 * Handles DreamTracker, StockPhoto, and AIImage modals
 */
export function useDreamModals({ 
  currentUser, 
  isCreating, 
  tempDreamId, 
  editingDream,
  setUploadingImage,
  updateDream 
}) {
  // Modal state (using useModal for cleaner management)
  const dreamTrackerModal = useModal();
  const stockPhotoModal = useModal();
  const aiImageModal = useModal();
  const inspirationModal = useModal();

  // Dream tracker modal handlers
  const handleViewDream = useCallback((dream) => {
    dreamTrackerModal.open(dream);
  }, [dreamTrackerModal]);

  const handleCloseDreamModal = useCallback(() => {
    dreamTrackerModal.close();
  }, [dreamTrackerModal]);

  const handleUpdateDream = useCallback((updatedDream) => {
    updateDream(updatedDream);
    dreamTrackerModal.updateData(updatedDream);
  }, [updateDream, dreamTrackerModal]);

  // Stock photo search handlers
  const handleOpenStockPhotoSearch = useCallback((formDataContext) => {
    stockPhotoModal.open(formDataContext);
  }, [stockPhotoModal]);

  const handleSelectStockPhoto = useCallback((imageUrl) => {
    if (stockPhotoModal.data && stockPhotoModal.data.setFormData) {
      // Use functional update to ensure we get the latest form state
      stockPhotoModal.data.setFormData(prev => ({ 
        ...prev, 
        image: imageUrl 
      }));
    }
    stockPhotoModal.close();
  }, [stockPhotoModal]);

  const handleCloseStockPhotoSearch = useCallback(() => {
    stockPhotoModal.close();
  }, [stockPhotoModal]);

  // AI image generator handlers
  const handleOpenAIImageGenerator = useCallback((formDataContext) => {
    aiImageModal.open(formDataContext);
  }, [aiImageModal]);

  const handleSelectAIImage = useCallback(async (imageUrl) => {
    if (!aiImageModal.data || !aiImageModal.data.setFormData) {
      return;
    }

    try {
      setUploadingImage(true);

      // Upload to blob storage via backend
      const dreamId = isCreating ? tempDreamId : editingDream;
      const result = await itemService.uploadDreamPictureFromUrl(
        currentUser.id,
        dreamId,
        imageUrl
      );

      if (result.success) {
        const newImageUrl = result.data.url;
        
        // Update form data with the new image URL
        // Use functional update to ensure we get the latest form state
        aiImageModal.data.setFormData(prev => ({ 
          ...prev, 
          image: newImageUrl 
        }));
        
        console.log('✅ DALL-E image uploaded to blob storage successfully:', newImageUrl);
        
        // Close AI modal after successful upload
        // Small delay to ensure state update has propagated
        await new Promise(resolve => setTimeout(resolve, 100));
        aiImageModal.close();
      } else {
        console.error('Failed to upload DALL-E image:', result.error);
        toast.error('Failed to upload image. Please try again.');
        aiImageModal.close();
      }
    } catch (error) {
      console.error('Error uploading DALL-E image:', error);
      toast.error('Failed to upload image. Please try again.');
      aiImageModal.close();
    } finally {
      setUploadingImage(false);
    }
  }, [aiImageModal, isCreating, tempDreamId, editingDream, currentUser, setUploadingImage]);

  const handleCloseAIImageGenerator = useCallback(() => {
    aiImageModal.close();
  }, [aiImageModal]);

  // Inspiration modal handlers
  const handleOpenInspiration = useCallback(() => {
    inspirationModal.open();
  }, [inspirationModal]);

  const handleCloseInspiration = useCallback(() => {
    inspirationModal.close();
  }, [inspirationModal]);

  return {
    // Modal state
    viewingDream: dreamTrackerModal.data,
    showStockPhotoSearch: stockPhotoModal.isOpen,
    showAIImageGenerator: aiImageModal.isOpen,
    showInspiration: inspirationModal.isOpen,
    
    // Dream tracker handlers
    handleViewDream,
    handleCloseDreamModal,
    handleUpdateDream,
    
    // Stock photo handlers
    handleOpenStockPhotoSearch,
    handleSelectStockPhoto,
    handleCloseStockPhotoSearch,
    
    // AI image handlers
    handleOpenAIImageGenerator,
    handleSelectAIImage,
    handleCloseAIImageGenerator,
    
    // Inspiration handlers
    handleOpenInspiration,
    handleCloseInspiration
  };
}
