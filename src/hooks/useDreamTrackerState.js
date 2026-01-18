
import { useState, useCallback, useMemo } from 'react';

/**
 * useDreamTrackerState - Manages core dream state and content updates
 * 
 * Extracted from useDreamTracker to reduce complexity
 * Handles: dream state, progress, completion, content updates (what/why/how), privacy
 * 
 * @param {object} dream - Dream object
 * @param {function} onUpdate - Callback when dream is updated
 * @param {boolean} canEdit - Whether editing is allowed
 * @returns {object} State and handlers
 */
export function useDreamTrackerState(dream, onUpdate, canEdit) {
  // Local dream state
  const [localDream, setLocalDream] = useState({
    ...dream,
    goals: dream.goals || [],
    notes: dream.notes || [],
    coachNotes: dream.coachNotes || [],
    history: dream.history || []
  });

  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [hasChanges, setHasChanges] = useState(false);

  // Progress Management - uses functional update to ensure immediate UI feedback
  const handleProgressChange = useCallback((newProgress) => {
    if (!canEdit) return;
    setLocalDream(prev => ({
      ...prev,
      progress: newProgress,
      history: [
        ...prev.history,
        {
          id: `history-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Progress updated',
          from: prev.progress,
          to: newProgress
        }
      ]
    }));
    setHasChanges(true);
  }, [canEdit]);

  const toggleComplete = useCallback(() => {
    if (!canEdit) return;
    setLocalDream(prev => {
      const newCompleted = !prev.completed;
      return {
        ...prev,
        completed: newCompleted,
        progress: newCompleted ? 100 : prev.progress,
        completedAt: newCompleted ? new Date().toISOString() : null,
        history: [
          ...prev.history,
          {
            id: `history-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: newCompleted ? 'Dream completed' : 'Dream reopened',
            completed: newCompleted
          }
        ]
      };
    });
    setHasChanges(true);
  }, [canEdit]);

  // Privacy Management
  const handlePrivacyChange = useCallback((isPublic) => {
    if (!canEdit) return;
    setLocalDream(prev => ({
      ...prev,
      isPublic
    }));
    setHasChanges(true);
  }, [canEdit]);

  // Content Updates (What/Why/How) - use functional update for immediate UI feedback
  const handleUpdateDescription = useCallback(async (description) => {
    if (!canEdit) return;
    let updatedDream;
    setLocalDream(prev => {
      updatedDream = {
        ...prev,
        description: description.trim()
      };
      return updatedDream;
    });

    // Immediately persist
    try {
      await onUpdate(updatedDream);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save description:', error);
      setHasChanges(true);
    }
  }, [canEdit, onUpdate]);

  const handleUpdateMotivation = useCallback(async (motivation) => {
    if (!canEdit) return;
    let updatedDream;
    setLocalDream(prev => {
      updatedDream = {
        ...prev,
        motivation: motivation.trim()
      };
      return updatedDream;
    });

    try {
      await onUpdate(updatedDream);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save motivation:', error);
      setHasChanges(true);
    }
  }, [canEdit, onUpdate]);

  const handleUpdateApproach = useCallback(async (approach) => {
    if (!canEdit) return;
    let updatedDream;
    setLocalDream(prev => {
      updatedDream = {
        ...prev,
        approach: approach.trim()
      };
      return updatedDream;
    });

    try {
      await onUpdate(updatedDream);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save approach:', error);
      setHasChanges(true);
    }
  }, [canEdit, onUpdate]);

  const handleUpdateTitle = useCallback((title) => {
    if (!canEdit) return;
    setLocalDream(prev => ({
      ...prev,
      title: title.trim()
    }));
    setHasChanges(true);
  }, [canEdit]);

  // Save all changes
  const handleSave = useCallback(async () => {
    if (!hasChanges) return;
    try {
      await onUpdate(localDream);
      setHasChanges(false);
      console.log('✅ Dream saved successfully');
    } catch (error) {
      console.error('❌ Failed to save dream:', error);
    }
  }, [localDream, hasChanges, onUpdate]);

  // Helper functions
  const getCategoryIcon = useCallback((category) => {
    const icons = {
      'Health': '💪',
      'Travel': '✈️',
      'Career': '💼',
      'Learning': '📚',
      'Creative': '🎨',
      'Financial': '💰',
      'Relationships': '👥',
      'Adventure': '⚡',
      'Spiritual': '🙏',
      'Community': '🤝'
    };
    return icons[category] || '🎯';
  }, []);

  const getProgressColor = useCallback((progress) => {
    if (progress >= 80) return 'bg-netsurit-red';
    if (progress >= 50) return 'bg-netsurit-coral';
    if (progress >= 20) return 'bg-netsurit-orange';
    return 'bg-professional-gray-400';
  }, []);

  const formatDate = useCallback((timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Coach notes (from coachNotes array or fallback to notes with isCoachNote flag)
  const coachNotes = useMemo(() => {
    if (localDream.coachNotes && localDream.coachNotes.length > 0) {
      return localDream.coachNotes;
    }
    // Fallback to old format for backward compatibility
    return (localDream.notes || []).filter(note => note.isCoachNote);
  }, [localDream.coachNotes, localDream.notes]);

  return {
    // State
    localDream,
    setLocalDream,
    activeTab,
    setActiveTab,
    hasChanges,
    setHasChanges,

    // Progress handlers
    handleProgressChange,
    toggleComplete,

    // Privacy handler
    handlePrivacyChange,

    // Content update handlers
    handleUpdateDescription,
    handleUpdateMotivation,
    handleUpdateApproach,
    handleUpdateTitle,

    // Save handler
    handleSave,

    // Helpers
    getCategoryIcon,
    getProgressColor,
    formatDate,

    // Computed
    coachNotes
  };
}

export default useDreamTrackerState;