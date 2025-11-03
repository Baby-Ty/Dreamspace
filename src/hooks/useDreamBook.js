// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import itemService from '../services/itemService';
import { mockDreams } from '../constants/dreamInspiration';

/**
 * Custom hook for Dream Book data management and business logic
 * Handles all state, handlers, and drag & drop for the Dream Book feature
 */
export function useDreamBook() {
  const { currentUser, dreamCategories, addDream, updateDream, deleteDream, reorderDreams } = useApp();
  
  // Form and modal state
  const [editingDream, setEditingDream] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [viewingDream, setViewingDream] = useState(null);
  const [showStockPhotoSearch, setShowStockPhotoSearch] = useState(false);
  const [showInspiration, setShowInspiration] = useState(false);
  const [inspirationCategory, setInspirationCategory] = useState('All');
  const [currentFormData, setCurrentFormData] = useState(null);
  const [formData, setFormData] = useState({ title: '', category: '', description: '', isPublic: false, image: '', firstGoal: { enabled: false, title: '', consistency: 'weekly', targetWeeks: 12, targetMonths: 6 } });
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
  const fetchUnsplashForTitle = useCallback(async () => '', []);
  const loadInspirationImages = useCallback(async () => {
    setLoadingInspiration(true); setInspirationError('');
    try {
      const updated = await Promise.all(mockDreams.map(async (d) => d.image ? d : { ...d, image: await fetchUnsplashForTitle(d.title, d.category) }));
      setInspirationItems(updated);
    } catch (err) {
      setInspirationError('Failed to load inspiration images.'); setInspirationItems(mockDreams);
    } finally { setLoadingInspiration(false); }
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
        targetMonths: 6
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
        targetMonths: 6
      }
    });
  }, [dreamCategories]);

  const handleSave = useCallback(() => {
    if (isCreating) {
      const newDream = {
        id: tempDreamId,
        title: formData.title,
        category: formData.category,
        description: formData.description,
        isPublic: formData.isPublic,
        image: formData.image,
        progress: 0,
        milestones: [],
        notes: [],
        history: []
      };

      // Add first goal if enabled
      if (formData.firstGoal.enabled) {
        const goalId = `goal_${Date.now()}`;
        const goal = {
          id: goalId,
          title: formData.firstGoal.title || formData.title,
          type: 'consistency',
          recurrence: formData.firstGoal.consistency,
          startDate: new Date().toISOString(),
          active: true,
          completed: false,
          createdAt: new Date().toISOString()
        };
        
        if (formData.firstGoal.consistency === 'monthly') {
          goal.targetMonths = formData.firstGoal.targetMonths;
        } else {
          goal.targetWeeks = formData.firstGoal.targetWeeks;
        }
        
        newDream.goals = [goal];
      } else {
        newDream.goals = [];
      }

      addDream(newDream);
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
        targetMonths: 6
      }
    });
  }, [isCreating, tempDreamId, formData, dreams, editingDream, addDream, updateDream]);

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
        targetMonths: 6
      }
    });
  }, []);

  const handleDelete = useCallback((dreamId) => {
    if (window.confirm('Are you sure you want to delete this dream?')) {
      deleteDream(dreamId);
    }
  }, [deleteDream]);

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
    setViewingDream(null);
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

