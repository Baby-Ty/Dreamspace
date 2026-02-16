
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import itemService from '../services/itemService';
import currentWeekService from '../services/currentWeekService';
import { getCurrentIsoWeek, monthsToWeeks, dateToWeeks, getWeeksUntilDate } from '../utils/dateUtils';
import { toast } from '../utils/toast';

// Import split hooks for maintainability
import { useDreamDragDrop } from './dream-book/useDreamDragDrop';
import { useDreamInspiration } from './dream-book/useDreamInspiration';
import { useDreamForm } from './dream-book/useDreamForm';
import { useDreamModals } from './dream-book/useDreamModals';

/**
 * Custom hook for Dream Book data management and business logic
 * Orchestrates smaller focused hooks for form, modals, drag-drop, and inspiration
 */
export function useDreamBook() {
  const { currentUser, dreamCategories, addDream, updateDream, deleteDream, reorderDreams, weeklyGoals, deleteWeeklyGoal } = useApp();
  
  const maxDreams = 10;
  const dreams = (currentUser?.dreamBook || []).filter(d => !d.isSystem);

  // Year vision state with optimistic updates
  const [localYearVision, setLocalYearVision] = useState(() => {
    const rawYearVision = currentUser?.yearVision;
    return typeof rawYearVision === 'string' ? rawYearVision : '';
  });
  
  useEffect(() => {
    const rawYearVision = currentUser?.yearVision;
    const syncedVision = typeof rawYearVision === 'string' ? rawYearVision : '';
    if (syncedVision !== localYearVision) {
      setLocalYearVision(syncedVision);
    }
  }, [currentUser?.yearVision]);

  // Use split hooks
  const dragDrop = useDreamDragDrop(reorderDreams);
  const form = useDreamForm(dreamCategories);
  const inspiration = useDreamInspiration(false); // Will be controlled by modals
  
  const modals = useDreamModals({
    currentUser,
    isCreating: form.isCreating,
    tempDreamId: form.tempDreamId,
    editingDream: form.editingDream,
    setUploadingImage: form.setUploadingImage,
    updateDream
  });

  // Reload inspiration when modal opens
  const inspirationState = useDreamInspiration(modals.showInspiration);

  // Dream save handler (creates or updates)
  const handleSave = useCallback(async () => {
    // Don't save while another save is in progress or image is uploading
    if (form.isSaving || form.uploadingImage) {
      console.log('⏳ Save blocked - isSaving:', form.isSaving, 'uploadingImage:', form.uploadingImage);
      return;
    }
    form.setIsSaving(true);
    
    try {
      if (form.isCreating) {
        const newDream = {
          id: form.tempDreamId,
          title: form.formData.title,
          category: form.formData.category,
          description: form.formData.description,
          isPublic: form.formData.isPublic,
          image: form.formData.image,
          progress: 25,
          milestones: [],
          notes: [],
          history: [],
          goals: []
        };

        // Add first goal if enabled
        if (form.formData.firstGoal.enabled) {
          const goal = createFirstGoal(form.formData, form.tempDreamId);
          newDream.goals = [goal];
          
          // Add goal to currentWeek container
          await addGoalToCurrentWeek(goal, form.formData, form.tempDreamId, currentUser?.id);
        }

        await addDream(newDream);
        setTimeout(() => window.dispatchEvent(new CustomEvent('dreams-updated')), 100);
        
        form.setIsCreating(false);
        form.setTempDreamId(null);
      } else {
        const updatedDream = dreams.find(d => d.id === form.editingDream);
        if (updatedDream) {
          await updateDream({ 
            ...updatedDream, 
            title: form.formData.title,
            category: form.formData.category,
            description: form.formData.description,
            isPublic: form.formData.isPublic,
            image: form.formData.image
          });
        }
        form.setEditingDream(null);
      }
      
      form.resetForm();
    } finally {
      form.setIsSaving(false);
    }
  }, [form, dreams, addDream, updateDream, currentUser?.id]);

  // Dream delete handler
  const handleDelete = useCallback(async (dreamId) => {
    if (!window.confirm('Are you sure you want to delete this dream? This will also remove all associated weekly goals.')) {
      return;
    }
    
    try {
      const userId = currentUser?.id;
      if (!userId) return;
      
      const dream = dreams.find(d => d.id === dreamId);
      
      // Remove goals from currentWeek container
      const currentWeekIso = getCurrentIsoWeek();
      const currentWeekResult = await currentWeekService.getCurrentWeek(userId);
      
      if (currentWeekResult.success && currentWeekResult.data) {
        const currentWeekGoals = currentWeekResult.data.goals || [];
        const remainingGoals = currentWeekGoals.filter(g => g.dreamId !== dreamId);
        
        if (remainingGoals.length < currentWeekGoals.length) {
          await currentWeekService.saveCurrentWeek(userId, currentWeekIso, remainingGoals);
        }
      }
      
      // Clean up weekly goals
      if (dream?.goals?.length > 0) {
        for (const goal of dream.goals) {
          const relatedWeeklyGoals = (weeklyGoals || []).filter(wg => 
            wg.goalId === goal.id || wg.id === goal.id || wg.dreamId === dreamId
          );
          for (const weeklyGoal of relatedWeeklyGoals) {
            if (deleteWeeklyGoal) await deleteWeeklyGoal(weeklyGoal.id);
          }
        }
      }
      
      // Clean up direct dream weekly goals
      const dreamWeeklyGoals = (weeklyGoals || []).filter(wg => wg.dreamId === dreamId);
      for (const weeklyGoal of dreamWeeklyGoals) {
        if (deleteWeeklyGoal) await deleteWeeklyGoal(weeklyGoal.id);
      }
      
      await deleteDream(dreamId);
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('goals-updated'));
        window.dispatchEvent(new CustomEvent('dreams-updated'));
      }, 100);
    } catch (error) {
      console.error('Error deleting dream:', error);
      toast.error(`Failed to delete dream: ${error.message}`);
    }
  }, [dreams, weeklyGoals, deleteDream, deleteWeeklyGoal, currentUser?.id]);

  // Image upload handler
  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.warning('Please select an image file');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.warning('Image size must be less than 5MB');
      return;
    }

    try {
      form.setUploadingImage(true);
      const dreamId = form.isCreating ? form.tempDreamId : form.editingDream;
      const result = await itemService.uploadDreamPicture(currentUser.id, dreamId, file);

      if (result.success) {
        form.setFormData(prev => ({ ...prev, image: result.data.url }));
      } else {
        toast.error('Failed to upload image. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      form.setUploadingImage(false);
    }
  }, [form, currentUser]);

  // Vision save handler
  const handleSaveVision = useCallback(async (visionText) => {
    if (!currentUser?.id) return;
    
    setLocalYearVision(visionText);
    
    try {
      const result = await itemService.saveYearVision(currentUser.id, visionText);
      if (result.success) {
        window.dispatchEvent(new CustomEvent('vision-updated', { detail: { vision: visionText } }));
      } else {
        const rawYearVision = currentUser?.yearVision;
        setLocalYearVision(typeof rawYearVision === 'string' ? rawYearVision : '');
      }
    } catch (error) {
      console.error('Error saving vision:', error);
      const rawYearVision = currentUser?.yearVision;
      setLocalYearVision(typeof rawYearVision === 'string' ? rawYearVision : '');
    }
  }, [currentUser?.id, currentUser?.yearVision]);

  const loading = !currentUser || !dreamCategories;

  return {
    // Data
    dreams,
    maxDreams,
    currentUser,
    dreamCategories,
    yearVision: localYearVision,
    loading,
    
    // Form state (from useDreamForm)
    editingDream: form.editingDream,
    isCreating: form.isCreating,
    formData: form.formData,
    setFormData: form.setFormData,
    uploadingImage: form.uploadingImage,
    isSaving: form.isSaving,
    tempDreamId: form.tempDreamId,
    
    // Modal state (from useDreamModals)
    viewingDream: modals.viewingDream,
    showStockPhotoSearch: modals.showStockPhotoSearch,
    showAIImageGenerator: modals.showAIImageGenerator,
    showInspiration: modals.showInspiration,
    
    // Drag state (from useDreamDragDrop)
    draggingIndex: dragDrop.draggingIndex,
    dragOverIndex: dragDrop.dragOverIndex,
    
    // Inspiration state (from useDreamInspiration)
    inspirationCategory: inspirationState.inspirationCategory,
    setInspirationCategory: inspirationState.setInspirationCategory,
    filteredInspiration: inspirationState.filteredInspiration,
    loadingInspiration: inspirationState.loadingInspiration,
    inspirationError: inspirationState.inspirationError,
    
    // Dream CRUD handlers
    handleEdit: form.handleEdit,
    handleCreate: form.handleCreate,
    handleSave,
    handleCancel: form.handleCancel,
    handleDelete,
    
    // Image handlers
    handleImageUpload,
    
    // Dream tracker handlers (from useDreamModals)
    handleViewDream: modals.handleViewDream,
    handleCloseDreamModal: modals.handleCloseDreamModal,
    handleUpdateDream: modals.handleUpdateDream,
    
    // Stock photo handlers (from useDreamModals)
    handleOpenStockPhotoSearch: modals.handleOpenStockPhotoSearch,
    handleSelectStockPhoto: modals.handleSelectStockPhoto,
    handleCloseStockPhotoSearch: modals.handleCloseStockPhotoSearch,
    
    // AI image generator handlers (from useDreamModals)
    handleOpenAIImageGenerator: modals.handleOpenAIImageGenerator,
    handleSelectAIImage: modals.handleSelectAIImage,
    handleCloseAIImageGenerator: modals.handleCloseAIImageGenerator,
    
    // Inspiration handlers (from useDreamModals)
    handleOpenInspiration: modals.handleOpenInspiration,
    handleCloseInspiration: modals.handleCloseInspiration,
    
    // Vision handler
    handleSaveVision,
    
    // Drag & drop handlers (from useDreamDragDrop)
    handleDragStart: dragDrop.handleDragStart,
    handleDragOver: dragDrop.handleDragOver,
    handleDrop: dragDrop.handleDrop,
    handleDragEnd: dragDrop.handleDragEnd,
    
    // Reorder actions
    reorderDreams
  };
}

// Helper: Create first goal object
function createFirstGoal(formData, dreamId) {
  const goalId = `goal_${Date.now()}`;
  const nowIso = new Date().toISOString();
  const currentWeekIso = getCurrentIsoWeek();
  
  let targetWeeks, weeksRemaining;
  if (formData.firstGoal.consistency === 'deadline' && formData.firstGoal.targetDate) {
    targetWeeks = dateToWeeks(formData.firstGoal.targetDate, currentWeekIso);
    weeksRemaining = targetWeeks;
  } else if (formData.firstGoal.consistency === 'monthly') {
    targetWeeks = monthsToWeeks(formData.firstGoal.targetMonths);
    weeksRemaining = targetWeeks;
  } else {
    targetWeeks = formData.firstGoal.targetWeeks;
    weeksRemaining = formData.firstGoal.targetWeeks;
  }
  
  return {
    id: goalId,
    title: formData.firstGoal.title || formData.title,
    type: formData.firstGoal.consistency === 'deadline' ? 'deadline' : 'consistency',
    recurrence: formData.firstGoal.consistency === 'deadline' ? undefined : formData.firstGoal.consistency,
    targetWeeks,
    targetMonths: formData.firstGoal.consistency === 'monthly' ? formData.firstGoal.targetMonths : undefined,
    frequency: formData.firstGoal.consistency === 'monthly' 
      ? (formData.firstGoal.frequency || 2) 
      : (formData.firstGoal.consistency === 'weekly' ? (formData.firstGoal.frequency || 1) : undefined),
    startDate: nowIso,
    targetDate: formData.firstGoal.consistency === 'deadline' ? formData.firstGoal.targetDate : undefined,
    weeksRemaining,
    active: true,
    completed: false,
    createdAt: nowIso
  };
}

// Helper: Add goal to current week container
async function addGoalToCurrentWeek(goal, formData, dreamId, userId) {
  if (!userId) return;
  
  const currentWeekIso = getCurrentIsoWeek();
  const nowIso = new Date().toISOString();
  
  try {
    const newGoalInstance = {
      id: goal.id,
      templateId: goal.id,
      type: goal.type === 'deadline' ? 'deadline' : 'weekly_goal',
      title: goal.title,
      description: '',
      dreamId,
      dreamTitle: formData.title,
      dreamCategory: formData.category,
      recurrence: goal.type === 'consistency' ? goal.recurrence : undefined,
      targetWeeks: goal.targetWeeks,
      targetMonths: goal.targetMonths,
      targetDate: goal.targetDate,
      frequency: goal.type === 'consistency' && goal.recurrence === 'monthly' 
        ? (goal.frequency || 2) 
        : (goal.type === 'consistency' && goal.recurrence === 'weekly' ? (goal.frequency || 1) : null),
      completionCount: 0,
      completionDates: [],
      completed: false,
      completedAt: null,
      skipped: false,
      weeksRemaining: goal.type === 'deadline' && goal.targetDate
        ? getWeeksUntilDate(goal.targetDate, currentWeekIso)
        : (goal.targetWeeks || null),
      monthsRemaining: goal.targetMonths || null,
      weekId: currentWeekIso,
      createdAt: nowIso
    };
    
    const currentWeekResponse = await currentWeekService.getCurrentWeek(userId);
    const existingGoals = currentWeekResponse.success && currentWeekResponse.data?.goals || [];
    
    const updatedGoals = [...existingGoals, newGoalInstance];
    const result = await currentWeekService.saveCurrentWeek(userId, currentWeekIso, updatedGoals);
    
    if (result.success) {
      console.log('✅ First goal added to currentWeek successfully');
    } else {
      console.error('❌ Failed to add first goal to currentWeek:', result.error);
    }
  } catch (error) {
    console.error('❌ Failed to create first goal:', error);
  }
}