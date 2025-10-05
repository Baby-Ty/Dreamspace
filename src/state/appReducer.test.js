// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { describe, it, expect } from 'vitest';
import { appReducer, initialAppState } from './appReducer.js';

describe('appReducer', () => {
  describe('initialAppState', () => {
    it('should have the correct initial state', () => {
      expect(initialAppState).toEqual({
        loading: false,
        user: null,
        error: null,
        prefs: {}
      });
    });
  });

  describe('LOADING action', () => {
    it('should set loading to true', () => {
      const action = { type: 'LOADING', payload: true };
      const newState = appReducer(initialAppState, action);

      expect(newState.loading).toBe(true);
      expect(newState.error).toBe(null);
    });

    it('should set loading to false', () => {
      const currentState = { ...initialAppState, loading: true };
      const action = { type: 'LOADING', payload: false };
      const newState = appReducer(currentState, action);

      expect(newState.loading).toBe(false);
    });

    it('should clear error when loading starts', () => {
      const currentState = { 
        ...initialAppState, 
        error: 'Some error' 
      };
      const action = { type: 'LOADING', payload: true };
      const newState = appReducer(currentState, action);

      expect(newState.error).toBe(null);
      expect(newState.loading).toBe(true);
    });
  });

  describe('SET_USER action', () => {
    it('should set user data', () => {
      const user = { 
        id: '123', 
        name: 'Test User', 
        email: 'test@example.com' 
      };
      const action = { type: 'SET_USER', payload: user };
      const newState = appReducer(initialAppState, action);

      expect(newState.user).toEqual(user);
      expect(newState.loading).toBe(false);
      expect(newState.error).toBe(null);
    });

    it('should update existing user', () => {
      const currentState = {
        ...initialAppState,
        user: { id: '123', name: 'Old Name' }
      };
      const newUser = { id: '123', name: 'New Name', email: 'new@example.com' };
      const action = { type: 'SET_USER', payload: newUser };
      const newState = appReducer(currentState, action);

      expect(newState.user).toEqual(newUser);
    });

    it('should clear loading and error when user is set', () => {
      const currentState = {
        ...initialAppState,
        loading: true,
        error: 'Some error'
      };
      const user = { id: '123', name: 'Test User' };
      const action = { type: 'SET_USER', payload: user };
      const newState = appReducer(currentState, action);

      expect(newState.user).toEqual(user);
      expect(newState.loading).toBe(false);
      expect(newState.error).toBe(null);
    });

    it('should handle null user', () => {
      const action = { type: 'SET_USER', payload: null };
      const newState = appReducer(initialAppState, action);

      expect(newState.user).toBe(null);
      expect(newState.loading).toBe(false);
    });
  });

  describe('ERROR action', () => {
    it('should set error message', () => {
      const error = 'Something went wrong';
      const action = { type: 'ERROR', payload: error };
      const newState = appReducer(initialAppState, action);

      expect(newState.error).toBe(error);
      expect(newState.loading).toBe(false);
    });

    it('should handle error object', () => {
      const error = { message: 'Error', code: 500 };
      const action = { type: 'ERROR', payload: error };
      const newState = appReducer(initialAppState, action);

      expect(newState.error).toEqual(error);
      expect(newState.loading).toBe(false);
    });

    it('should clear loading when error is set', () => {
      const currentState = { ...initialAppState, loading: true };
      const action = { type: 'ERROR', payload: 'Error occurred' };
      const newState = appReducer(currentState, action);

      expect(newState.error).toBe('Error occurred');
      expect(newState.loading).toBe(false);
    });

    it('should preserve user data when error occurs', () => {
      const user = { id: '123', name: 'Test User' };
      const currentState = { ...initialAppState, user };
      const action = { type: 'ERROR', payload: 'Error' };
      const newState = appReducer(currentState, action);

      expect(newState.user).toEqual(user);
      expect(newState.error).toBe('Error');
    });
  });

  describe('SET_PREFS action', () => {
    it('should set preferences', () => {
      const prefs = { theme: 'dark', language: 'en' };
      const action = { type: 'SET_PREFS', payload: prefs };
      const newState = appReducer(initialAppState, action);

      expect(newState.prefs).toEqual(prefs);
    });

    it('should merge preferences with existing ones', () => {
      const currentState = {
        ...initialAppState,
        prefs: { theme: 'light', fontSize: 14 }
      };
      const newPrefs = { theme: 'dark', language: 'en' };
      const action = { type: 'SET_PREFS', payload: newPrefs };
      const newState = appReducer(currentState, action);

      expect(newState.prefs).toEqual({
        theme: 'dark',
        fontSize: 14,
        language: 'en'
      });
    });

    it('should not affect other state properties', () => {
      const currentState = {
        loading: true,
        user: { id: '123' },
        error: null,
        prefs: { theme: 'light' }
      };
      const action = { type: 'SET_PREFS', payload: { theme: 'dark' } };
      const newState = appReducer(currentState, action);

      expect(newState.loading).toBe(true);
      expect(newState.user).toEqual({ id: '123' });
      expect(newState.error).toBe(null);
      expect(newState.prefs.theme).toBe('dark');
    });

    it('should handle empty preferences', () => {
      const action = { type: 'SET_PREFS', payload: {} };
      const newState = appReducer(initialAppState, action);

      expect(newState.prefs).toEqual({});
    });
  });

  describe('Unknown action', () => {
    it('should return current state for unknown action', () => {
      const currentState = {
        loading: true,
        user: { id: '123' },
        error: null,
        prefs: { theme: 'dark' }
      };
      const action = { type: 'UNKNOWN_ACTION', payload: 'test' };
      const newState = appReducer(currentState, action);

      expect(newState).toEqual(currentState);
    });

    it('should not mutate original state', () => {
      const currentState = {
        loading: false,
        user: { id: '123', name: 'Test' },
        error: null,
        prefs: { theme: 'light' }
      };
      const action = { type: 'SET_USER', payload: { id: '456', name: 'New' } };
      const newState = appReducer(currentState, action);

      // Original state should remain unchanged
      expect(currentState.user).toEqual({ id: '123', name: 'Test' });
      // New state should have updated user
      expect(newState.user).toEqual({ id: '456', name: 'New' });
    });
  });

  describe('State immutability', () => {
    it('should not mutate state when setting user', () => {
      const currentState = { ...initialAppState };
      const action = { type: 'SET_USER', payload: { id: '123' } };
      const newState = appReducer(currentState, action);

      expect(newState).not.toBe(currentState);
    });

    it('should not mutate state when setting error', () => {
      const currentState = { ...initialAppState };
      const action = { type: 'ERROR', payload: 'Error' };
      const newState = appReducer(currentState, action);

      expect(newState).not.toBe(currentState);
    });

    it('should not mutate state when setting preferences', () => {
      const currentState = { ...initialAppState, prefs: { theme: 'light' } };
      const action = { type: 'SET_PREFS', payload: { theme: 'dark' } };
      const newState = appReducer(currentState, action);

      expect(newState).not.toBe(currentState);
      expect(newState.prefs).not.toBe(currentState.prefs);
    });
  });

  describe('Complex scenarios', () => {
    it('should handle loading -> success flow', () => {
      let state = initialAppState;

      // Start loading
      state = appReducer(state, { type: 'LOADING', payload: true });
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);

      // Load user successfully
      const user = { id: '123', name: 'Test User' };
      state = appReducer(state, { type: 'SET_USER', payload: user });
      expect(state.loading).toBe(false);
      expect(state.user).toEqual(user);
      expect(state.error).toBe(null);
    });

    it('should handle loading -> error flow', () => {
      let state = initialAppState;

      // Start loading
      state = appReducer(state, { type: 'LOADING', payload: true });
      expect(state.loading).toBe(true);

      // Error occurs
      state = appReducer(state, { type: 'ERROR', payload: 'Failed to load' });
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to load');
      expect(state.user).toBe(null);
    });

    it('should handle multiple preference updates', () => {
      let state = initialAppState;

      state = appReducer(state, { 
        type: 'SET_PREFS', 
        payload: { theme: 'dark' } 
      });
      expect(state.prefs.theme).toBe('dark');

      state = appReducer(state, { 
        type: 'SET_PREFS', 
        payload: { language: 'en' } 
      });
      expect(state.prefs).toEqual({ theme: 'dark', language: 'en' });

      state = appReducer(state, { 
        type: 'SET_PREFS', 
        payload: { theme: 'light' } 
      });
      expect(state.prefs).toEqual({ theme: 'light', language: 'en' });
    });
  });
});
