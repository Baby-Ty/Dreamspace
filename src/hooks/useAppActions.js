import { loading, setUser, error, setPrefs } from '../state/actions.js';

export function useAppActions(dispatch) {
  return {
    loading: (isLoading) => dispatch(loading(isLoading)),
    setUser: (user) => dispatch(setUser(user)),
    error: (err) => dispatch(error(err)),
    setPrefs: (prefs) => dispatch(setPrefs(prefs))
  };
}
