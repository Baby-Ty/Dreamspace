// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useMemo } from 'react';
import { useApp } from '../context/AppContext';

/**
 * Custom hook for career data and actions
 * Centralizes all career-related business logic
 */
export function useCareerData() {
  const {
    currentUser,
    updateCareerGoal,
    updateDevelopmentPlan,
    updateCareerProfile,
    addCareerHighlight,
    updateSkill,
    addSkill,
    addCareerGoal,
    addDevelopmentPlan
  } = useApp();

  // Loading state
  const isLoading = !currentUser;

  // Error state (could be expanded based on app context)
  const error = null;

  // Memoized selectors
  const careerProfile = useMemo(
    () => currentUser?.careerProfile || {},
    [currentUser]
  );

  const careerGoals = useMemo(
    () => currentUser?.careerGoals || [],
    [currentUser]
  );

  const developmentPlan = useMemo(
    () => currentUser?.developmentPlan || [],
    [currentUser]
  );

  const skills = useMemo(
    () => careerProfile.skills || [],
    [careerProfile]
  );

  const careerHighlights = useMemo(
    () => careerProfile.highlights || [],
    [careerProfile]
  );

  // Actions
  const actions = useMemo(
    () => ({
      updateCareerGoal,
      updateDevelopmentPlan,
      updateCareerProfile,
      addCareerHighlight,
      updateSkill,
      addSkill,
      addCareerGoal,
      addDevelopmentPlan
    }),
    [
      updateCareerGoal,
      updateDevelopmentPlan,
      updateCareerProfile,
      addCareerHighlight,
      updateSkill,
      addSkill,
      addCareerGoal,
      addDevelopmentPlan
    ]
  );

  return {
    // Data
    currentUser,
    careerProfile,
    careerGoals,
    developmentPlan,
    skills,
    careerHighlights,
    
    // States
    isLoading,
    error,
    
    // Actions
    ...actions
  };
}

