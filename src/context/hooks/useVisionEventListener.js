/**
 * Custom hook to listen for vision-updated events
 * Syncs year vision changes from external components
 */

import { useEffect, useRef } from 'react';
import { actionTypes } from '../../state/appReducer.js';

export function useVisionEventListener(state, dispatch) {
  const currentUserRef = useRef(null);
  
  // Update ref when user/vision changes
  useEffect(() => {
    currentUserRef.current = state.currentUser;
  }, [state.currentUser?.id, state.currentUser?.yearVision]);
  
  // Register event listener
  useEffect(() => {
    const handleVisionUpdated = (event) => {
      const newVision = event.detail?.vision || '';
      const currentUser = currentUserRef.current;
      
      if (currentUser && currentUser.yearVision !== newVision) {
        dispatch({
          type: actionTypes.SET_USER_DATA,
          payload: {
            ...currentUser,
            yearVision: newVision
          }
        });
      }
    };

    window.addEventListener('vision-updated', handleVisionUpdated);
    return () => {
      window.removeEventListener('vision-updated', handleVisionUpdated);
    };
  }, [dispatch]); // Empty deps for event listener (uses ref instead)
}
