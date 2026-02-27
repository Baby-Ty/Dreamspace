/**
 * Custom hook to sync initialUser prop changes to AppContext state
 * Preserves yearVision if it exists in state
 */

import { useEffect, useRef } from 'react';
import { actionTypes } from '../../state/appReducer.js';

export function useInitialUserSync(initialUser, state, dispatch) {
  const prevInitialUserRef = useRef(null);
  
  useEffect(() => {
    if (!initialUser || !state.currentUser?.id || initialUser.id !== state.currentUser.id) {
      prevInitialUserRef.current = initialUser;
      return;
    }
    
    // Only update if initialUser actually changed
    const prevInitialUser = prevInitialUserRef.current;
    if (prevInitialUser && JSON.stringify(prevInitialUser) === JSON.stringify(initialUser)) {
      return;
    }
    
    prevInitialUserRef.current = initialUser;
    
    const existingYearVision = state.currentUser?.yearVision;
    const newYearVision = initialUser.yearVision;
    
    if (existingYearVision && !newYearVision) {
      // #region agent log
      fetch('http://127.0.0.1:7704/ingest/e75213ad-3612-4b22-b4c9-9c008803f475',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'109e04'},body:JSON.stringify({sessionId:'109e04',location:'useInitialUserSync.js:branch-noVision',message:'dispatch branch: no newYearVision',data:{initialBookLen:initialUser.dreamBook?.length,stateBookLen:state.currentUser.dreamBook?.length},timestamp:Date.now(),hypothesisId:'staleBook'})}).catch(()=>{});
      // #endregion
      dispatch({
        type: actionTypes.SET_USER_DATA,
        payload: {
          ...initialUser,
          yearVision: existingYearVision,
          dreamBook: state.currentUser.dreamBook || initialUser.dreamBook || [],
          connects: initialUser.connects || state.currentUser.connects || []
        }
      });
      return;
    }
    
    // Only dispatch if there are actual changes
    const hasChanges = 
      initialUser.name !== state.currentUser.name ||
      initialUser.email !== state.currentUser.email ||
      initialUser.office !== state.currentUser.office ||
      (initialUser.yearVision && initialUser.yearVision !== state.currentUser.yearVision) ||
      (initialUser.dreamBook && JSON.stringify(initialUser.dreamBook) !== JSON.stringify(state.currentUser.dreamBook)) ||
      (initialUser.connects && JSON.stringify(initialUser.connects) !== JSON.stringify(state.currentUser.connects));
    
    // #region agent log
    fetch('http://127.0.0.1:7704/ingest/e75213ad-3612-4b22-b4c9-9c008803f475',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'109e04'},body:JSON.stringify({sessionId:'109e04',location:'useInitialUserSync.js:hasChanges-check',message:'hasChanges evaluated',data:{hasChanges,initialBookLen:initialUser.dreamBook?.length,stateBookLen:state.currentUser.dreamBook?.length,bookDiverged:initialUser.dreamBook?.length!==state.currentUser.dreamBook?.length},timestamp:Date.now(),hypothesisId:'staleBook'})}).catch(()=>{});
    // #endregion

    if (hasChanges) {
      // #region agent log
      fetch('http://127.0.0.1:7704/ingest/e75213ad-3612-4b22-b4c9-9c008803f475',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'109e04'},body:JSON.stringify({sessionId:'109e04',location:'useInitialUserSync.js:dispatch',message:'DISPATCHING SET_USER_DATA - dreamBook source',data:{usingStateBook:true,initialBookLen:initialUser.dreamBook?.length,stateBookLen:state.currentUser.dreamBook?.length},timestamp:Date.now(),hypothesisId:'staleBook'})}).catch(()=>{});
      // #endregion
      dispatch({
        type: actionTypes.SET_USER_DATA,
        payload: {
          ...initialUser,
          yearVision: initialUser.yearVision || state.currentUser?.yearVision || '',
          dreamBook: state.currentUser.dreamBook || initialUser.dreamBook || [],
          connects: initialUser.connects || state.currentUser.connects || []
        }
      });
    }
  }, [
    initialUser?.id, 
    initialUser?.name, 
    initialUser?.email, 
    initialUser?.office, 
    initialUser?.yearVision,
    initialUser?.dreamBook,
    initialUser?.connects,
    state.currentUser?.id, 
    state.currentUser?.name, 
    state.currentUser?.email, 
    state.currentUser?.office,
    state.currentUser?.dreamBook,
    state.currentUser?.connects,
    dispatch
  ]);
}
