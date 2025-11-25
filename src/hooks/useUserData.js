// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.

import { useEffect, useRef } from 'react';
import connectService from '../services/connectService';
import scoringService from '../services/scoringService';
import { createEmptyUser, loadUserData } from '../utils/appDataHelpers';
import { dreamCategories } from '../data/mockData';
import { actionTypes } from '../state/appReducer';

/**
 * Custom hook for user data loading
 * Extracts data loading logic from AppContext
 */
export function useUserData(initialUser, dispatch, state) {
  
  // Track if we've already loaded data to prevent duplicate loads
  const hasLoadedRef = useRef(false);
  const userId = initialUser ? (initialUser.id || initialUser.userId) : null;

  // Load persisted data on mount
  useEffect(() => {
    if (!userId) return;
    
    // Prevent duplicate loads - only load once per userId
    if (hasLoadedRef.current) {
      return;
    }
    
    hasLoadedRef.current = true;
    
    // Skip redundant database call for demo user
    const isDemoUser = initialUser?.email === 'sarah.johnson@netsurit.com' || userId === 'sarah.johnson@netsurit.com';
    if (isDemoUser && initialUser?.dreamBook && initialUser.dreamBook.length > 0) {
      return;
    }
    
    // If initialUser already has dreams from AuthContext, use those instead of loading
    if (initialUser?.dreamBook && initialUser.dreamBook.length > 0) {
      const loadData = async () => {
        const persistedData = await loadUserData(userId);
        if (persistedData) {
          const userData = persistedData.currentUser || persistedData;
          const weeklyGoalsData = persistedData.weeklyGoals || userData.weeklyGoals || [];
          const scoringHistoryData = persistedData.scoringHistory || userData.scoringHistory || [];
          
          const migratedUser = {
            ...createEmptyUser(initialUser),
            ...initialUser,
            ...userData,
            dreamBook: initialUser.dreamBook,
            yearVision: initialUser.yearVision || userData.yearVision || '',
            connects: initialUser.connects || userData.connects || [],
            dreamCategories: dreamCategories
          };
          
          dispatch({
            type: actionTypes.LOAD_PERSISTED_DATA,
            payload: {
              isAuthenticated: true,
              currentUser: migratedUser,
              weeklyGoals: Array.isArray(weeklyGoalsData) ? weeklyGoalsData : [],
              scoringHistory: Array.isArray(scoringHistoryData) ? scoringHistoryData : []
            }
          });
        }
      };
      loadData();
      return;
    }
    
    const loadData = async () => {
      const persistedData = await loadUserData(userId);
      
      let userData = null;
      let weeklyGoalsData = [];
      let scoringHistoryData = [];
      
      if (persistedData) {
        if (persistedData.currentUser) {
          userData = persistedData.currentUser;
          weeklyGoalsData = persistedData.weeklyGoals || [];
          scoringHistoryData = persistedData.scoringHistory || [];
        } else if (persistedData.id && persistedData.email) {
          userData = persistedData;
          weeklyGoalsData = persistedData.weeklyGoals || [];
          scoringHistoryData = persistedData.scoringHistory || [];
        }
      }
      
      if (userData) {
        const migratedUser = {
          ...createEmptyUser(initialUser),
          ...userData,
          dreamBook: userData.dreamBook || [],
          yearVision: initialUser.yearVision || userData.yearVision || '',
          connects: userData.connects || [],
          dreamCategories: dreamCategories
        };
        
        const finalWeeklyGoals = Array.isArray(weeklyGoalsData) ? weeklyGoalsData : 
                                (Array.isArray(initialUser?.weeklyGoals) ? initialUser.weeklyGoals : []);
        
        dispatch({
          type: actionTypes.LOAD_PERSISTED_DATA,
          payload: {
            isAuthenticated: true,
            currentUser: migratedUser,
            weeklyGoals: finalWeeklyGoals,
            scoringHistory: Array.isArray(scoringHistoryData) ? scoringHistoryData : []
          }
        });
        
        // Load all-time scoring from API
        const allScoringResult = await scoringService.getAllYearsScoring(userId);
        if (allScoringResult.success) {
          const allEntries = allScoringResult.data.allYears.flatMap(yearDoc => 
            (yearDoc.entries || []).map(entry => ({ ...entry, year: yearDoc.year }))
          );
          
          dispatch({
            type: actionTypes.SET_SCORING_HISTORY,
            payload: {
              allYearsScoring: allScoringResult.data.allYears,
              allTimeScore: allScoringResult.data.allTimeTotal,
              scoringHistory: allEntries
            }
          });
          
          if (migratedUser) {
            migratedUser.score = allScoringResult.data.allTimeTotal;
          }
        }
      }
    };
    
    loadData();
    
    return () => {
      hasLoadedRef.current = false;
    };
  }, [userId, initialUser, dispatch]);

  // Load connects from API on mount and when user changes
  const currentUserIdRef = useRef(null);
  const currentUserRef = useRef(null);
  
  useEffect(() => {
    currentUserIdRef.current = state.currentUser?.id;
    currentUserRef.current = state.currentUser;
  }, [state.currentUser?.id, state.currentUser?.email]);
  
  useEffect(() => {
    const userId = currentUserIdRef.current || (currentUserRef.current?.email || currentUserRef.current?.id);
    if (!userId) return;

    let isMounted = true;

    const loadConnects = async () => {
      try {
        const result = await connectService.getConnects(userId);
        if (!isMounted) return;

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
        }
      } catch (error) {
        console.error('Error loading connects:', error);
      }
    };

    loadConnects();
    return () => {
      isMounted = false;
    };
  }, [state.currentUser?.id, state.currentUser?.email, dispatch]);
}

