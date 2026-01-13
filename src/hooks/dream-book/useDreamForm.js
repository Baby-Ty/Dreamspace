import { useState, useCallback } from 'react';

const INITIAL_FORM_DATA = {
  title: '',
  category: '',
  description: '',
  isPublic: false,
  image: '',
  firstGoal: {
    enabled: false,
    title: '',
    consistency: 'weekly',
    targetWeeks: 12,
    targetMonths: 6,
    frequency: 2,
    targetDate: ''
  }
};

/**
 * Hook for dream form state management
 * Handles form data, editing state, and form actions
 */
export function useDreamForm(dreamCategories) {
  const [editingDream, setEditingDream] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [tempDreamId, setTempDreamId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = useCallback((dream) => {
    setEditingDream(dream.id);
    setFormData({
      title: dream.title,
      category: dream.category,
      description: dream.description,
      isPublic: dream.isPublic || false,
      image: dream.image,
      firstGoal: {
        enabled: false,
        title: '',
        consistency: 'weekly',
        targetWeeks: 12,
        targetMonths: 6,
        frequency: 2,
        targetDate: ''
      }
    });
  }, []);

  const handleCreate = useCallback(() => {
    setIsCreating(true);
    const newTempId = `dream_${Date.now()}`;
    setTempDreamId(newTempId);
    setFormData({
      title: '',
      category: dreamCategories?.[0] || 'Health',
      description: '',
      isPublic: false,
      image: '',
      firstGoal: {
        enabled: false,
        title: '',
        consistency: 'weekly',
        targetWeeks: 12,
        targetMonths: 6,
        frequency: 2,
        targetDate: ''
      }
    });
  }, [dreamCategories]);

  const handleCancel = useCallback(() => {
    setIsCreating(false);
    setEditingDream(null);
    setTempDreamId(null);
    setFormData(INITIAL_FORM_DATA);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
  }, []);

  return {
    // State
    editingDream,
    setEditingDream,
    isCreating,
    setIsCreating,
    formData,
    setFormData,
    tempDreamId,
    setTempDreamId,
    uploadingImage,
    setUploadingImage,
    isSaving,
    setIsSaving,
    
    // Handlers
    handleEdit,
    handleCreate,
    handleCancel,
    resetForm
  };
}
