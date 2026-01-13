/**
 * Custom hook to auto-save profile data to localStorage
 * Uses debouncing to avoid excessive writes
 * Note: Items (dreams, goals, connects) are saved via itemService, not here
 */

import { useEffect, useRef } from 'react';
import { saveUserData } from '../../utils/appDataHelpers.js';

export function useAutosave(state) {
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (state.currentUser?.id && state.currentUser?.dataStructureVersion) {
        const { 
          dreamCategories,
          dreamBook,
          weeklyGoals: _wg,
          scoringHistory: _sh,
          connects,
          careerGoals,
          developmentPlan,
          ...profileData 
        } = state.currentUser;
        
        const dataToSave = {
          ...profileData,
          dataStructureVersion: profileData.dataStructureVersion || 2,
          lastUpdated: new Date().toISOString()
        };
        
        saveUserData(dataToSave, state.currentUser.id);
      }
    }, 300);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    state.isAuthenticated, 
    state.currentUser?.id, 
    state.currentUser?.name, 
    state.currentUser?.email, 
    state.currentUser?.office, 
    state.currentUser?.score
  ]);
}
