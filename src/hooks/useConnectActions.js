
import { useCallback, useRef, useEffect } from 'react';
import connectService from '../services/connectService';
import scoringService from '../services/scoringService';
import { actionTypes } from '../state/appReducer';

/**
 * Custom hook for connect operations
 * Extracts business logic from AppContext for connect management
 */
export function useConnectActions(state, dispatch) {
  // Use refs to avoid stale closures in async callbacks
  const currentUserRef = useRef(state.currentUser);
  const currentScoreRef = useRef(state.currentUser?.score || 0);
  
  useEffect(() => {
    currentUserRef.current = state.currentUser;
    currentScoreRef.current = state.currentUser?.score || 0;
  }, [state.currentUser?.id, state.currentUser?.email, state.currentUser?.score]);
  
  /**
   * Add a connect
   */
  const addConnect = useCallback(async (connect) => {
    // Use email as userId for connects (connects are saved with email format in Cosmos DB)
    const userId = currentUserRef.current?.email || currentUserRef.current?.id;
    
    if (userId) {
      const result = await connectService.saveConnect(userId, connect);
      if (!result.success) {
        console.error('Failed to save connect to database:', result.error);
        return;
      }
      
      // Add connect to local state immediately
      const savedConnect = result.data || connect;
      dispatch({ type: actionTypes.ADD_CONNECT, payload: savedConnect });
      
      // Reload connects from API after a short delay for eventual consistency
      setTimeout(async () => {
        try {
          const reloadResult = await connectService.getConnects(userId);
          if (reloadResult.success && Array.isArray(reloadResult.data)) {
            const currentUser = currentUserRef.current;
            if (currentUser) {
              dispatch({
                type: actionTypes.SET_USER_DATA,
                payload: {
                  ...currentUser,
                  connects: reloadResult.data
                }
              });
            }
          }
        } catch (reloadError) {
          console.error('Error reloading connects after save:', reloadError);
        }
      }, 1000);
    } else {
      // If no userId, still add to local state (for offline/dev scenarios)
      dispatch({ type: actionTypes.ADD_CONNECT, payload: connect });
    }
    
    // Add scoring entry via scoring service
    const currentYear = new Date().getFullYear();
    const points = scoringService.calculateConnectScoring(connect);
    const entry = scoringService.createScoringEntry(
      'connect',
      points,
      `Dream Connect with ${connect.withWhom}`,
      { connectId: connect.id, dreamId: connect.dreamId }
    );
    
    if (userId) {
      await scoringService.addScoringEntry(userId, currentYear, entry);
    }
    
    // Update local state
    dispatch({ type: actionTypes.ADD_SCORING_ENTRY, payload: entry });
    const newScore = currentScoreRef.current + points;
    dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: newScore });
  }, [dispatch]);

  /**
   * Update a connect status
   */
  const updateConnect = useCallback(async (connectId, status) => {
    const userId = currentUserRef.current?.email || currentUserRef.current?.id;
    if (!userId) return;

    const result = await connectService.updateConnectStatus(userId, connectId, status);
    if (!result.success) {
      console.error('Failed to update connect:', result.error);
      return;
    }

    // Reload all connects to ensure we have the latest data
    const reloadResult = await connectService.getConnects(userId);
    if (reloadResult.success && Array.isArray(reloadResult.data)) {
      const currentUser = currentUserRef.current;
      if (currentUser) {
        dispatch({
          type: actionTypes.SET_USER_DATA,
          payload: {
            ...currentUser,
            connects: reloadResult.data
          }
        });
      }
    } else {
      // Fallback: update local state with the updated connect
      const updatedConnect = result.data;
      dispatch({ type: actionTypes.UPDATE_CONNECT, payload: updatedConnect });
    }
  }, [dispatch]);

  /**
   * Manually reload connects from the API
   */
  const reloadConnects = useCallback(async () => {
    const userId = currentUserRef.current?.email || currentUserRef.current?.id;
    if (!userId) {
      console.warn('⚠️ Cannot reload connects: no user ID');
      return;
    }

    try {
      const result = await connectService.getConnects(userId);
      if (result.success && Array.isArray(result.data)) {
        const currentUser = currentUserRef.current;
        if (currentUser) {
          dispatch({
            type: actionTypes.SET_USER_DATA,
            payload: {
              ...currentUser,
              connects: result.data
            }
          });
        }
      } else {
        console.error('Failed to reload connects:', result.error);
      }
    } catch (error) {
      console.error('Error reloading connects:', error);
    }
  }, [dispatch]);

  return {
    addConnect,
    updateConnect,
    reloadConnects
  };
}
