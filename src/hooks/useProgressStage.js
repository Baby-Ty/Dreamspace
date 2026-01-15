import { useState, useEffect, useCallback } from 'react';

/**
 * Progress stages for dream tracking
 */
const SELF_PROGRESS_STAGES = [
  {
    id: 0,
    label: 'Just Started',
    description: 'You\'ve begun your journey. This dream is taking shape and you\'re ready to move forward.',
    shortLabel: 'Just Started',
  },
  {
    id: 1,
    label: 'In Motion',
    description: 'You\'re actively working on this dream. Progress is happening and momentum is building.',
    shortLabel: 'In Motion',
  },
  {
    id: 2,
    label: 'Almost There',
    description: 'You\'re close to achieving this dream. Final steps are in sight and completion is near.',
    shortLabel: 'Almost There',
  },
  {
    id: 3,
    label: 'Done',
    description: 'Congratulations! You\'ve achieved this dream. Time to celebrate and reflect on your success.',
    shortLabel: 'Done',
  },
];

/**
 * Custom hook for managing dream progress stage state
 * Maps between numeric progress (0-100) and discrete stages (0-3)
 * 
 * @param {Object} dream - Dream object with progress property
 * @param {Function} handleProgressChange - Callback to update progress in parent
 * @returns {Object} Progress stage control object
 * 
 * @example
 * const {
 *   selfProgressStage,
 *   activeStage,
 *   handleStageChange,
 *   SELF_PROGRESS_STAGES
 * } = useProgressStage(dream, handleProgressChange);
 */
export function useProgressStage(dream, handleProgressChange) {
  // Initialize stage from numeric progress
  const [selfProgressStage, setSelfProgressStage] = useState(() => {
    const numericProgress = typeof dream?.progress === 'number' ? dream.progress : 25;

    if (numericProgress >= 87.5) return 3; // 75-100% = Done
    if (numericProgress >= 62.5) return 2;  // 50-75% = Almost There
    if (numericProgress >= 37.5) return 1;  // 25-50% = In Motion
    return 0; // 0-25% = Just Started (but should start at 25%)
  });

  // Get active stage object
  const activeStage = SELF_PROGRESS_STAGES[selfProgressStage] || SELF_PROGRESS_STAGES[0];

  // Sync with external dream progress changes
  useEffect(() => {
    const numericProgress = typeof dream?.progress === 'number' ? dream.progress : 25;
    
    let newStage;
    if (numericProgress >= 87.5) newStage = 3;
    else if (numericProgress >= 62.5) newStage = 2;
    else if (numericProgress >= 37.5) newStage = 1;
    else newStage = 0;

    if (newStage !== selfProgressStage) {
      setSelfProgressStage(newStage);
    }
  }, [dream?.progress]);

  // Handle stage change and map to numeric progress
  const handleStageChange = useCallback((newStage) => {
    setSelfProgressStage(newStage);
    
    // Map stage to numeric progress for persistence (4 stages: 25%, 50%, 75%, 100%)
    const stageToProgress = [25, 50, 75, 100];
    const newProgress = stageToProgress[newStage] || 25;
    
    // Call handleProgressChange from the hook to trigger save
    if (handleProgressChange) {
      handleProgressChange(newProgress);
    }
  }, [handleProgressChange]);

  return {
    selfProgressStage,
    activeStage,
    handleStageChange,
    SELF_PROGRESS_STAGES
  };
}

export default useProgressStage;
