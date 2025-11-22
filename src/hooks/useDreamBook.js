// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import itemService from '../services/itemService';
import { mockDreams } from '../constants/dreamInspiration';
import currentWeekService from '../services/currentWeekService';
import { getCurrentIsoWeek, monthsToWeeks, dateToWeeks, getWeeksUntilDate } from '../utils/dateUtils';

/**
 * Custom hook for Dream Book data management and business logic
 * Handles all state, handlers, and drag & drop for the Dream Book feature
 */
export function useDreamBook() {
  const { currentUser, dreamCategories, addDream, updateDream, deleteDream, reorderDreams, weeklyGoals, deleteWeeklyGoal } = useApp();
  
  // Form and modal state
  const [editingDream, setEditingDream] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [viewingDream, setViewingDream] = useState(null);
  const [showStockPhotoSearch, setShowStockPhotoSearch] = useState(false);
  const [showInspiration, setShowInspiration] = useState(false);
  const [inspirationCategory, setInspirationCategory] = useState('All');
  const [currentFormData, setCurrentFormData] = useState(null);
  const [formData, setFormData] = useState({ title: '', category: '', description: '', isPublic: false, image: '', firstGoal: { enabled: false, title: '', consistency: 'weekly', targetWeeks: 12, targetMonths: 6, frequency: 1, targetDate: '' } });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [tempDreamId, setTempDreamId] = useState(null);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [inspirationItems, setInspirationItems] = useState(mockDreams);
  const [loadingInspiration, setLoadingInspiration] = useState(false);
  const [inspirationError, setInspirationError] = useState('');

  const maxDreams = 10;
  const dreams = currentUser?.dreamBook || [];

  // Drag and drop handlers
  const handleDragStart = useCallback((e, index) => {
    setDraggingIndex(index);
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    if (dragOverIndex !== index) setDragOverIndex(index);
    e.dataTransfer.dropEffect = 'move';
  }, [dragOverIndex]);

  const handleDrop = useCallback((e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = Number(e.dataTransfer.getData('text/plain'));
    if (!Number.isNaN(sourceIndex) && sourceIndex !== targetIndex) {
      reorderDreams(sourceIndex, targetIndex);
    }
    setDraggingIndex(null);
    setDragOverIndex(null);
  }, [reorderDreams]);

  const handleDragEnd = useCallback(() => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  }, []);

  // Inspiration loading (disabled remote fetching for demo reliability)
  const fetchUnsplashForTitle = useCallback(async (title, category) => '', []);
  const loadInspirationImages = useCallback(async () => {
    setLoadingInspiration(true); 
    setInspirationError('');
    try {
      const updated = await Promise.all(mockDreams.map(async (d) => {
        if (d.image) {
          return d;
        }
        const image = await fetchUnsplashForTitle(d.title, d.category);
        return { ...d, image };
      }));
      setInspirationItems(updated);
    } catch (err) {
      console.error('Failed to load inspiration images:', err);
      setInspirationError('Failed to load inspiration images.'); 
      setInspirationItems(mockDreams);
    } finally { 
      setLoadingInspiration(false); 
    }
  }, [fetchUnsplashForTitle]);

  useEffect(() => { if (showInspiration) { setInspirationCategory('All'); loadInspirationImages(); } }, [showInspiration, loadInspirationImages]);

  const filteredInspiration = useMemo(() => inspirationItems.filter((d) => inspirationCategory === 'All' || d.category === inspirationCategory), [inspirationItems, inspirationCategory]);

  // Dream CRUD handlers
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

  const handleSave = useCallback(async () => {
    if (isCreating) {
      const newDream = {
        id: tempDreamId,
        title: formData.title,
        category: formData.category,
        description: formData.description,
        isPublic: formData.isPublic,
        image: formData.image,
        progress: 25,
        milestones: [],
        notes: [],
        history: []
      };

      // Add first goal if enabled
      if (formData.firstGoal.enabled) {
        const goalId = `goal_${Date.now()}`;
        const nowIso = new Date().toISOString();
        const currentWeekIso = getCurrentIsoWeek();
        
        // Calculate targetWeeks and weeksRemaining for goals (same logic as GoalsTab)
        let targetWeeks, weeksRemaining;
        if (formData.firstGoal.consistency === 'deadline' && formData.firstGoal.targetDate) {
          // For deadline goals: convert targetDate to targetWeeks
          targetWeeks = dateToWeeks(formData.firstGoal.targetDate, currentWeekIso);
          weeksRemaining = targetWeeks; // Initialize with targetWeeks
        } else if (formData.firstGoal.consistency === 'monthly') {
          // Convert months to weeks for unified tracking
          targetWeeks = monthsToWeeks(formData.firstGoal.targetMonths);
          weeksRemaining = targetWeeks;
        } else {
          // Weekly consistency goal
          targetWeeks = formData.firstGoal.targetWeeks;
          weeksRemaining = formData.firstGoal.targetWeeks;
        }
        
        const goal = {
          id: goalId,
          title: formData.firstGoal.title || formData.title,
          type: formData.firstGoal.consistency === 'deadline' ? 'deadline' : 'consistency',
          recurrence: formData.firstGoal.consistency === 'deadline' ? undefined : formData.firstGoal.consistency,
          targetWeeks: targetWeeks, // All goal types now use targetWeeks
          targetMonths: formData.firstGoal.consistency === 'monthly' ? formData.firstGoal.targetMonths : undefined,
          frequency: formData.firstGoal.consistency === 'monthly' 
            ? (formData.firstGoal.frequency || 2) 
            : (formData.firstGoal.consistency === 'weekly' ? (formData.firstGoal.frequency || 1) : undefined),
          startDate: nowIso,
          // targetDate is kept for backward compatibility but targetWeeks is the source of truth
          targetDate: formData.firstGoal.consistency === 'deadline' ? formData.firstGoal.targetDate : undefined,
          weeksRemaining: weeksRemaining,
          active: true,
          completed: false,
          createdAt: nowIso
        };
        
        newDream.goals = [goal];
        
        // Add goal to currentWeek container (NEW SIMPLIFIED SYSTEM)
        console.log('📅 Adding first goal to currentWeek container');
        
        try {
          // Create goal instance for current week (same structure as GoalsTab)
          const newGoalInstance = {
            id: goalId,
            templateId: goalId, // Self-reference for now
            type: goal.type === 'deadline' ? 'deadline' : 'weekly_goal',
            title: goal.title,
            description: '',
            dreamId: tempDreamId,
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
          
          // Get existing current week goals
          const currentWeekResponse = await currentWeekService.getCurrentWeek(currentUser.id);
          const existingGoals = currentWeekResponse.success && currentWeekResponse.data?.goals || [];
          
          // Add new goal to current week
          const updatedGoals = [...existingGoals, newGoalInstance];
          const result = await currentWeekService.saveCurrentWeek(
            currentUser.id,
            currentWeekIso,
            updatedGoals
          );
          
          if (result.success) {
            console.log('✅ First goal added to currentWeek successfully');
          } else {
            console.error('❌ Failed to add first goal to currentWeek:', result.error);
          }
        } catch (error) {
          console.error('❌ Failed to create first goal:', error);
          // Continue anyway - goal is saved to dream
        }
      } else {
        newDream.goals = [];
      }

      await addDream(newDream);

      // Dispatch event to notify other components (like dashboard) that dreams have been updated
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('dreams-updated'));
      }, 100);

      setIsCreating(false);
      setTempDreamId(null);
    } else {
      const updatedDream = dreams.find(d => d.id === editingDream);
      if (updatedDream) {
        updateDream({ 
          ...updatedDream, 
          title: formData.title,
          category: formData.category,
          description: formData.description,
          isPublic: formData.isPublic,
          image: formData.image
        });
      }
      setEditingDream(null);
    }
    
    setFormData({
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
    });
  }, [isCreating, tempDreamId, formData, dreams, editingDream, addDream, updateDream, currentUser]);

  const handleCancel = useCallback(() => {
    setIsCreating(false);
    setEditingDream(null);
    setTempDreamId(null);
    setFormData({
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
    });
  }, []);

  const handleDelete = useCallback(async (dreamId) => {
    if (!window.confirm('Are you sure you want to delete this dream? This will also remove all associated weekly goals.')) {
      return;
    }
    
    console.log(`🗑️ Deleting dream ${dreamId} and all associated weekly goals`);
    
    try {
      const userId = currentUser?.id;
      if (!userId) {
        console.error('❌ No user ID available');
        return;
      }
      
      // Find the dream to get its goals
      const dream = dreams.find(d => d.id === dreamId);
      
      // Step 1: Remove goals from currentWeek container
      const currentWeekIso = getCurrentIsoWeek();
      const currentWeekResult = await currentWeekService.getCurrentWeek(userId);
      
      if (currentWeekResult.success && currentWeekResult.data) {
        const currentWeekGoals = currentWeekResult.data.goals || [];
        // Filter out all goals associated with this dream
        const remainingGoals = currentWeekGoals.filter(g => g.dreamId !== dreamId);
        
        if (remainingGoals.length < currentWeekGoals.length) {
          const removedCount = currentWeekGoals.length - remainingGoals.length;
          console.log(`🗑️ Removing ${removedCount} goals from currentWeek container`);
          
          const saveResult = await currentWeekService.saveCurrentWeek(
            userId,
            currentWeekIso,
            remainingGoals
          );
          
          if (saveResult.success) {
            console.log(`✅ Removed ${removedCount} goals from current week`);
          } else {
            console.error('❌ Failed to remove goals from current week:', saveResult.error);
          }
        }
      }
      
      // Step 2: Delete templates and instances from weeklyGoals state
      if (dream && dream.goals && dream.goals.length > 0) {
        console.log(`🧹 Cleaning up ${dream.goals.length} goals from weekly goals`);
        
        // Delete all weekly goals (templates and instances) associated with this dream's goals
        for (const goal of dream.goals) {
          // Find all weekly goals (templates and instances) that match this goal
          const relatedWeeklyGoals = (weeklyGoals || []).filter(wg => 
            wg.goalId === goal.id || wg.id === goal.id || wg.dreamId === dreamId
          );
          
          console.log(`🗑️ Found ${relatedWeeklyGoals.length} weekly goals for goal ${goal.id}`);
          
          // Delete each one (deleteWeeklyGoal handles templates vs instances)
          for (const weeklyGoal of relatedWeeklyGoals) {
            if (deleteWeeklyGoal) {
              await deleteWeeklyGoal(weeklyGoal.id);
            }
          }
        }
      }
      
      // Also clean up any weekly goals directly associated with the dream (without goalId)
      const dreamWeeklyGoals = (weeklyGoals || []).filter(wg => wg.dreamId === dreamId);
      console.log(`🗑️ Found ${dreamWeeklyGoals.length} direct dream weekly goals`);
      
      for (const weeklyGoal of dreamWeeklyGoals) {
        if (deleteWeeklyGoal) {
          await deleteWeeklyGoal(weeklyGoal.id);
        }
      }
      
      // Step 3: Finally, delete the dream itself (this removes templates from dreams container)
      await deleteDream(dreamId);
      
      console.log(`✅ Successfully deleted dream ${dreamId} and all associated weekly goals`);
      
      // Dispatch custom event to trigger refresh in other components (dashboard, week ahead)
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('goals-updated'));
        window.dispatchEvent(new CustomEvent('dreams-updated'));
      }, 100);
    } catch (error) {
      console.error('❌ Error deleting dream:', error);
      alert(`Failed to delete dream: ${error.message}`);
    }
  }, [dreams, weeklyGoals, deleteDream, deleteWeeklyGoal, currentUser?.id]);

  // Image upload handler
  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('Image size must be less than 5MB');
        return;
      }

      try {
        setUploadingImage(true);
        const dreamId = isCreating ? tempDreamId : editingDream;
        const result = await itemService.uploadDreamPicture(
          currentUser.id,
          dreamId,
          file
        );

        if (result.success) {
          setFormData(prev => ({ ...prev, image: result.data.url }));
          console.log('✅ Dream image uploaded successfully');
        } else {
          console.error('Failed to upload image:', result.error);
          alert('Failed to upload image. Please try again.');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
      } finally {
        setUploadingImage(false);
      }
    }
  }, [isCreating, tempDreamId, editingDream, currentUser]);

  // Dream tracker modal handlers
  const handleViewDream = useCallback((dream) => {
    setViewingDream(dream);
  }, []);

  const handleCloseDreamModal = useCallback(() => {
    setViewingDream(null);
  }, []);

  const handleUpdateDream = useCallback((updatedDream) => {
    updateDream(updatedDream);
    // Update the viewing dream to reflect changes, but keep modal open
    setViewingDream(updatedDream);
  }, [updateDream]);

  // Stock photo search handlers
  const handleOpenStockPhotoSearch = useCallback((formDataContext) => {
    setCurrentFormData(formDataContext);
    setShowStockPhotoSearch(true);
  }, []);

  const handleSelectStockPhoto = useCallback((imageUrl) => {
    if (currentFormData && currentFormData.setFormData) {
      currentFormData.setFormData({ 
        ...currentFormData.formData, 
        image: imageUrl 
      });
    }
    setShowStockPhotoSearch(false);
    setCurrentFormData(null);
  }, [currentFormData]);

  const handleCloseStockPhotoSearch = useCallback(() => {
    setShowStockPhotoSearch(false);
    setCurrentFormData(null);
  }, []);

  // Inspiration modal handlers
  const handleOpenInspiration = useCallback(() => {
    setShowInspiration(true);
  }, []);

  const handleCloseInspiration = useCallback(() => {
    setShowInspiration(false);
  }, []);

  // Loading state
  const loading = !currentUser || !dreamCategories;

  return {
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
    tempDreamId,
    
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
  };
}

