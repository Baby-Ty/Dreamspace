// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { loading, setUser, error, setPrefs } from '../state/actions.js';

export function useAppActions(dispatch) {
  return {
    loading: (isLoading) => dispatch(loading(isLoading)),
    setUser: (user) => dispatch(setUser(user)),
    error: (err) => dispatch(error(err)),
    setPrefs: (prefs) => dispatch(setPrefs(prefs))
  };
}

