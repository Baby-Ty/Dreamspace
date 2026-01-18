import { useEffect, useRef } from 'react';

export function usePersistence(state, debounceMs = 500) {
  const timeoutRef = useRef(null);

  // Save to localStorage on state change (debounced)
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        const toSave = {
          user: state.user,
          prefs: state.prefs
        };
        localStorage.setItem('appState', JSON.stringify(toSave));
      } catch (err) {
        console.error('Failed to save state to localStorage:', err);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state.user, state.prefs, debounceMs]);
}

export function loadPersistedState() {
  try {
    const saved = localStorage.getItem('appState');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
  }
  return null;
}
