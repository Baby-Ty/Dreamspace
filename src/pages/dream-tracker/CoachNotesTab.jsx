
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { MessageSquare, Send, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

/**
 * Coach Notes Tab - Chat-like interface for coach-user conversations
 * @component
 */
export function CoachNotesTab({ coachNotes, formatDate, onAddMessage, currentUser, isCoach, teamMember }) {
  const { currentUser: appCurrentUser } = useApp();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Determine the actual current user (coach viewing member's dream vs user viewing own dream)
  const actualCurrentUser = currentUser || appCurrentUser;
  const actualIsCoach = isCoach !== undefined ? isCoach : (actualCurrentUser?.isCoach || actualCurrentUser?.role === 'coach');

  // Sort messages by timestamp (oldest first for chat-like display)
  const sortedMessages = [...(coachNotes || [])].sort((a, b) => {
    const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
    const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
    return timeA - timeB;
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sortedMessages.length]);

  // Group messages by date for better readability
  const groupedMessages = sortedMessages.reduce((groups, message) => {
    const date = new Date(message.timestamp || message.createdAt);
    const dateKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {});

  const handleSendMessage = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      // Determine coachId - if coach is viewing, use THEIR actual ID (appCurrentUser); if user is responding, null
      const coachId = actualIsCoach ? appCurrentUser?.id || appCurrentUser?.userId : null;
      
      console.log('💬 CoachNotesTab: Sending message:', {
        message: newMessage.trim(),
        actualIsCoach,
        coachId,
        hasOnAddMessage: !!onAddMessage,
        appCurrentUserId: appCurrentUser?.id || appCurrentUser?.userId,
        appCurrentUserName: appCurrentUser?.name
      });
      
      if (onAddMessage) {
        const result = await onAddMessage(newMessage.trim(), coachId);
        console.log('💬 CoachNotesTab: Message sent, result:', result);
        setNewMessage('');
      } else {
        console.error('❌ CoachNotesTab: onAddMessage is not defined!');
      }
    } catch (error) {
      console.error('❌ CoachNotesTab: Error sending message:', error);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSendMessage(e);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-professional-gray-900">Coach Notes</h3>
        <span className="text-xs text-professional-gray-600 bg-netsurit-light-coral/20 text-netsurit-red px-2 py-1 rounded-md font-medium">
          {sortedMessages.length} message{sortedMessages.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {sortedMessages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-professional-gray-300" />
            <p className="text-professional-gray-500 text-sm">No messages yet.</p>
            <p className="text-xs mt-2 text-professional-gray-500">
              {actualIsCoach 
                ? 'Start a conversation with your team member about their dream progress.'
                : 'Your coach will add insights and feedback here to help guide your progress.'}
            </p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([dateKey, messages]) => (
            <div key={dateKey} className="space-y-3">
              {/* Date Separator */}
              <div className="flex items-center justify-center my-4">
                <div className="flex-1 border-t border-professional-gray-200"></div>
                <span className="px-3 text-xs text-professional-gray-500 font-medium">{dateKey}</span>
                <div className="flex-1 border-t border-professional-gray-200"></div>
              </div>

              {/* Messages for this date */}
              {messages.map((message) => {
                const isCoachMessage = !!message.coachId;
                // Check if message is from the actual logged-in user (appCurrentUser)
                const isFromCurrentUser = actualIsCoach 
                  ? isCoachMessage && (message.coachId === (appCurrentUser?.id || appCurrentUser?.userId))
                  : !isCoachMessage;

                // Determine sender name to display
                let senderName;
                if (isCoachMessage) {
                  // Coach message - show coach's name
                  senderName = message.coachName || 'Coach';
                } else {
                  // User message - show team member name or "You"
                  if (actualIsCoach) {
                    // Coach viewing: show team member's name
                    senderName = teamMember?.name || 'User';
                  } else {
                    // User viewing their own: show "You"
                    senderName = 'You';
                  }
                }

                return (
                  <div
                    key={message.id}
                    className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                    data-testid={`coach-note-message-${message.id}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                        isFromCurrentUser
                          ? 'bg-netsurit-red text-white'
                          : isCoachMessage
                          ? 'bg-professional-gray-100 text-professional-gray-900'
                          : 'bg-professional-gray-50 text-professional-gray-800'
                      }`}
                    >
                      {/* Sender Name */}
                      <div className="flex items-center space-x-2 mb-1">
                        <User className={`w-3 h-3 ${isFromCurrentUser ? 'text-white/80' : 'text-professional-gray-500'}`} />
                        <span className={`text-xs font-medium ${
                          isFromCurrentUser ? 'text-white/90' : 'text-professional-gray-600'
                        }`}>
                          {senderName}
                        </span>
                      </div>

                      {/* Message Text */}
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                        isFromCurrentUser ? 'text-white' : 'text-professional-gray-800'
                      }`}>
                        {message.message || message.note || message.text}
                      </p>

                      {/* Timestamp */}
                      <div className={`text-xs mt-1.5 ${
                        isFromCurrentUser ? 'text-white/70' : 'text-professional-gray-500'
                      }`}>
                        {formatDate(message.timestamp || message.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-professional-gray-200 pt-3">
        <div className="flex items-end space-x-2">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={actualIsCoach 
              ? "Add a message to guide your team member..."
              : "Reply to your coach..."}
            className="flex-1 px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 resize-none text-sm min-h-[60px] max-h-[120px]"
            rows={2}
            disabled={isSending}
            data-testid="coach-note-input"
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
            aria-label="Send message"
            data-testid="coach-note-send"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}

CoachNotesTab.propTypes = {
  coachNotes: PropTypes.array.isRequired,
  formatDate: PropTypes.func.isRequired,
  onAddMessage: PropTypes.func,
  currentUser: PropTypes.shape({
    id: PropTypes.string,
    userId: PropTypes.string,
    name: PropTypes.string,
    isCoach: PropTypes.bool,
    role: PropTypes.string
  }),
  isCoach: PropTypes.bool,
  teamMember: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string
  })
};

export default React.memo(CoachNotesTab);