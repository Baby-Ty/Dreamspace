// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useCallback } from 'react';
import coachingService from '../services/coachingService';
import { toast } from '../utils/toast';

/**
 * useCoachNotes - Manages coach messaging for a dream
 * 
 * Extracted from useDreamTracker to reduce complexity
 * Handles: adding coach messages, adding user messages, note management
 * 
 * @param {object} localDream - Current dream state
 * @param {function} setLocalDream - Update dream state
 * @param {function} setHasChanges - Mark dream as changed
 * @param {boolean} isCoachViewing - Whether coach is viewing (vs user)
 * @param {object} teamMember - Team member being viewed (in coach mode)
 * @param {object} currentUser - Current user
 * @param {boolean} canEdit - Whether editing is allowed
 * @returns {object} Note state and handlers
 */
export function useCoachNotes(localDream, setLocalDream, setHasChanges, isCoachViewing, teamMember, currentUser, canEdit) {
  // Note state
  const [newNote, setNewNote] = useState('');

  /**
   * Add a coach message to the dream
   * @param {string} message - Message text
   */
  const addCoachMessage = useCallback(async (message) => {
    if (!message.trim()) {
      toast.warning('Please enter a message');
      return;
    }

    try {
      // Determine who's sending the message
      const isUserMessage = !isCoachViewing; // If not coach viewing, it's a user message
      const coachId = isUserMessage ? null : currentUser?.id;
      const memberId = isCoachViewing ? teamMember?.id : currentUser?.id;

      console.log('💬 Adding coach message:', {
        isCoachViewing,
        isUserMessage,
        coachId: coachId || 'user',
        memberId,
        dreamId: localDream.id
      });

      // Save message via coaching service
      const result = await coachingService.addCoachMessageToMemberDream(
        memberId,
        localDream.id,
        message.trim(),
        coachId
      );

      if (result.success) {
        // Create message object
        const newMessage = {
          id: `note_${Date.now()}`,
          text: message.trim(),
          timestamp: new Date().toISOString(),
          isCoachNote: true,
          coachId: coachId,
          coachName: isUserMessage ? null : (currentUser?.name || 'Coach')
        };

        // Update local state
        const updatedCoachNotes = [...(localDream.coachNotes || []), newMessage];
        const updatedDream = {
          ...localDream,
          coachNotes: updatedCoachNotes
        };
        setLocalDream(updatedDream);
        setHasChanges(true);

        // Clear input
        setNewNote('');

        console.log('✅ Coach message added successfully');
      } else {
        console.error('❌ Failed to add coach message:', result.error);
        toast.error('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error adding coach message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  }, [localDream, setLocalDream, setHasChanges, isCoachViewing, teamMember, currentUser]);

  /**
   * Add a regular note (for backward compatibility)
   * @param {string} noteText - Note text
   */
  const addNote = useCallback((noteText) => {
    if (!canEdit) return;
    if (!noteText.trim()) return;

    const newNoteObj = {
      id: `note_${Date.now()}`,
      text: noteText.trim(),
      timestamp: new Date().toISOString(),
      isCoachNote: false
    };

    const updatedNotes = [...(localDream.notes || []), newNoteObj];
    const updatedDream = {
      ...localDream,
      notes: updatedNotes,
      history: [
        ...localDream.history,
        {
          timestamp: new Date().toISOString(),
          action: 'Note added',
          note: noteText.trim()
        }
      ]
    };
    setLocalDream(updatedDream);
    setHasChanges(true);
    setNewNote('');
  }, [localDream, setLocalDream, setHasChanges, canEdit]);

  return {
    // State
    newNote,
    setNewNote,

    // Handlers
    addCoachMessage,
    addNote
  };
}

export default useCoachNotes;
