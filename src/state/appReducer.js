// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
export const initialAppState = {
  loading: false,
  user: null,
  error: null,
  prefs: {}
};

export function appReducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: action.payload, error: null };
    
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false, error: null };
    
    case 'ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_PREFS':
      return { ...state, prefs: { ...state.prefs, ...action.payload } };
    
    default:
      return state;
  }
}

