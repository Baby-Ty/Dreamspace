/**
 * Update dream progress action
 * Handles optimistic update, persistence, and completion scoring
 */

import { actionTypes } from '../../state/appReducer.js';
import itemService from '../../services/itemService';

export async function updateDreamProgressAction(dreamId, newProgress, state, dispatch) {
  if (!state.currentUser?.dreamBook) return;
  
  const dream = state.currentUser.dreamBook.find(d => d.id === dreamId);
  if (!dream) return;
  
  const updatedDream = { ...dream, progress: newProgress };
  
  // Optimistic update
  dispatch({ type: actionTypes.UPDATE_DREAM, payload: updatedDream });
  
  // Persist to database
  const userId = state.currentUser?.id;
  if (userId) {
    const updatedDreams = state.currentUser.dreamBook.map(d => 
      d.id === dreamId ? updatedDream : d
    );
    
    const templates = state.weeklyGoals?.filter(g => 
      g.type === 'weekly_goal_template'
    ) || [];
    
    const result = await itemService.saveDreams(userId, updatedDreams, templates);
    if (!result.success) {
      console.error('Failed to update dream progress in database:', result.error);
      return;
    }
  }
  
  // Check if dream is completed (award points)
  if (newProgress === 100 && dream.progress !== 100) {
    const completionEntry = {
      id: Date.now() + 1,
      type: 'dreamCompleted',
      title: `Completed "${dream.title}"`,
      points: state.scoringRules.dreamCompleted,
      date: new Date().toISOString().split('T')[0],
      category: dream.category
    };
    dispatch({ type: actionTypes.ADD_SCORING_ENTRY, payload: completionEntry });
    
    const completionScore = state.currentUser.score + state.scoringRules.dreamCompleted;
    dispatch({ type: actionTypes.UPDATE_USER_SCORE, payload: completionScore });
  }
}
