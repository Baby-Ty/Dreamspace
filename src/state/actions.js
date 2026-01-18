export const loading = (isLoading) => ({
  type: 'LOADING',
  payload: isLoading
});

export const setUser = (user) => ({
  type: 'SET_USER',
  payload: user
});

export const error = (error) => ({
  type: 'ERROR',
  payload: error
});

export const setPrefs = (prefs) => ({
  type: 'SET_PREFS',
  payload: prefs
});
