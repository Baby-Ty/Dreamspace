// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useState } from 'react';
import { X, Calendar, MapPin, Copy, CheckCircle } from 'lucide-react';
import ConnectStatusBadge from './ConnectStatusBadge';
import { parseIsoWeek } from '../../utils/dateUtils';

/**
 * ConnectDetailModal Component (Simplified)
 * Displays full connect details and allows status updates
 * Props:
 * - connect: Connect object with all details
 * - onClose: Callback to close modal
 * - onUpdateStatus: Callback when status is updated (connectId, newStatus) => void
 * - recipientName: Name of the person being connected with (for Teams message)
 */
export default function ConnectDetailModal({ connect, onClose, onUpdateStatus, recipientName, currentUser }) {
  const [copied, setCopied] = useState(false);

  if (!connect) return null;

  const formatWeekDisplay = (weekValue) => {
    const { year, week } = parseIsoWeek(weekValue);
    // Get Monday of the week
    const jan4 = new Date(year, 0, 4);
    const jan4Day = jan4.getDay() || 7;
    const monday = new Date(year, 0, 4 + (1 - jan4Day) + (week - 1) * 7);
    
    return monday.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleStatusUpdate = async (newStatus) => {
    await onUpdateStatus(connect.id, newStatus);
    // Note: Modal will be closed by parent component after update
  };

  const generateTeamsMessage = () => {
    const name = recipientName || connect.withWhom || connect.name || 'there';
    let message = `Hi ${name}! 👋\n\n`;
    
    if (connect.agenda) {
      message += `I'd like to connect with you about: ${connect.agenda}\n\n`;
    } else {
      message += `I'd like to connect with you!\n\n`;
    }

    if (connect.proposedWeeks && connect.proposedWeeks.length > 0) {
      message += `I'm available these weeks - let me know what works best for you:\n`;
      connect.proposedWeeks.forEach((week) => {
        message += `• Week of ${formatWeekDisplay(week)}\n`;
      });
      message += `\nOr suggest alternatives! Looking forward to connecting.\n\n`;
    }

    if (connect.notes) {
      message += `${connect.notes}\n\n`;
    }

    message += `${connect.userId?.split('@')[0] || 'Me'}`;
    return message;
  };

  const handleCopyTeamsMessage = async () => {
    const message = generateTeamsMessage();
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy message. Please copy manually.');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-labelledby="connect-detail-title"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-professional-gray-200 overflow-hidden flex flex-col">
        {/* Modal Header - Clean white header like DreamTracker */}
        <div className="p-4 border-b border-professional-gray-200 bg-white flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 id="connect-detail-title" className="text-xl font-bold text-professional-gray-900">
                {(() => {
                  // Format as "FirstName x FirstName" for both users
                  const getFirstName = (fullName) => {
                    if (!fullName) return '';
                    return fullName.split(' ')[0];
                  };
                  
                  if (!currentUser) {
                    return 'Connect Details';
                  }
                  
                  const currentUserFirstName = getFirstName(currentUser?.name || '');
                  const otherUserName = connect.withWhom || connect.name || '';
                  const otherUserFirstName = getFirstName(otherUserName);
                  
                  const isSender = connect.userId === (currentUser?.email || currentUser?.id);
                  
                  if (isSender) {
                    return currentUserFirstName && otherUserFirstName 
                      ? `${currentUserFirstName} x ${otherUserFirstName}`
                      : 'Connect Details';
                  } else {
                    return otherUserFirstName && currentUserFirstName
                      ? `${otherUserFirstName} x ${currentUserFirstName}`
                      : 'Connect Details';
                  }
                })()}
              </h3>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <ConnectStatusBadge status={connect.status || 'pending'} />
              <button
                onClick={onClose}
                className="p-1.5 text-professional-gray-600 hover:text-professional-gray-900 hover:bg-professional-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-professional-gray-500"
                aria-label="Close modal"
                data-testid="close-detail-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Connect With */}
          <div>
            <label className="block text-sm font-bold text-professional-gray-700 mb-2">
              Connect With
            </label>
            {(() => {
              // Helper functions
              const getFirstName = (fullName) => {
                if (!fullName) return '';
                return fullName.split(' ')[0];
              };
              
              if (!currentUser) {
                return (
                  <div className="p-3 bg-professional-gray-50 rounded-lg border border-professional-gray-200">
                    <p className="text-professional-gray-600">{connect.withWhom || connect.name || 'Unknown'}</p>
                  </div>
                );
              }
              
              // Determine user roles
              const isSender = connect.userId === (currentUser?.email || currentUser?.id);
              const currentUserFirstName = getFirstName(currentUser?.name || '');
              const otherUserName = connect.withWhom || connect.name || '';
              const otherUserFirstName = getFirstName(otherUserName);
              
              // Helper to get valid avatar URL - blob URLs don't work, use fallback
              const getAvatarUrl = (avatar, name, defaultColor = 'EC4B5C') => {
                if (!avatar || typeof avatar !== 'string') {
                  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=${defaultColor}&color=fff&size=48`;
                }
                const trimmed = avatar.trim();
                // Blob URLs are temporary and cause security errors - use fallback instead
                if (trimmed.startsWith('blob:')) {
                  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=${defaultColor}&color=fff&size=48`;
                }
                // Only use http/https URLs
                if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
                  return trimmed;
                }
                return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=${defaultColor}&color=fff&size=48`;
              };
              
              // Get avatars
              const currentUserAvatar = getAvatarUrl(
                currentUser?.avatar,
                currentUser?.name || 'User',
                'EC4B5C'
              );
              const otherUserAvatar = getAvatarUrl(
                connect.avatar,
                otherUserName || 'User',
                '6366f1'
              );
              
              // Get locations
              const currentUserLocation = currentUser?.office || 'Unknown';
              const otherUserLocation = connect.office || 'Unknown';
              
              // Determine display order (User 1 is always the sender)
              const user1Name = isSender ? currentUser?.name : otherUserName;
              const user1FirstName = isSender ? currentUserFirstName : otherUserFirstName;
              const user1Avatar = isSender ? currentUserAvatar : otherUserAvatar;
              const user1Location = isSender ? currentUserLocation : otherUserLocation;
              
              const user2Name = isSender ? otherUserName : currentUser?.name;
              const user2FirstName = isSender ? otherUserFirstName : currentUserFirstName;
              const user2Avatar = isSender ? otherUserAvatar : currentUserAvatar;
              const user2Location = isSender ? otherUserLocation : currentUserLocation;
              
              return (
                <div className="p-4 bg-professional-gray-50 rounded-lg border border-professional-gray-200 space-y-3">
                  {/* User 1 pic + name | User 2 pic + name */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <img
                        src={user1Avatar}
                        alt={user1Name}
                        className="w-8 h-8 rounded-full ring-2 ring-white object-cover flex-shrink-0"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user1Name || 'User')}&background=EC4B5C&color=fff&size=48`;
                        }}
                      />
                      <p className="text-sm font-medium text-professional-gray-900 truncate">
                        {user1Name}
                      </p>
                    </div>
                    <div className="w-px h-8 bg-professional-gray-300"></div>
                    <div className="flex items-center gap-2 flex-1">
                      <img
                        src={user2Avatar}
                        alt={user2Name}
                        className="w-8 h-8 rounded-full ring-2 ring-white object-cover flex-shrink-0"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user2Name || 'User')}&background=6366f1&color=fff&size=48`;
                        }}
                      />
                      <p className="text-sm font-medium text-professional-gray-900 truncate">
                        {user2Name}
                      </p>
                    </div>
                  </div>
                  
                  {/* Bottom: User 1 location | User 2 location */}
                  <div className="flex items-center justify-between gap-4 pt-2 border-t border-professional-gray-200">
                    <div className="flex items-center gap-1 flex-1">
                      <MapPin className="w-3 h-3 text-professional-gray-500 flex-shrink-0" />
                      <p className="text-xs text-professional-gray-600 truncate">
                        {user1Location}
                      </p>
                    </div>
                    <div className="w-px h-4 bg-professional-gray-300"></div>
                    <div className="flex items-center gap-1 flex-1">
                      <MapPin className="w-3 h-3 text-professional-gray-500 flex-shrink-0" />
                      <p className="text-xs text-professional-gray-600 truncate">
                        {user2Location}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Agenda */}
          {connect.agenda && (
            <div>
              <label className="block text-sm font-bold text-professional-gray-700 mb-2">
                Agenda / Topics
              </label>
              <p className="p-3 bg-professional-gray-50 rounded-lg border border-professional-gray-200 text-professional-gray-800">
                {connect.agenda}
              </p>
            </div>
          )}

          {/* Proposed Weeks */}
          {connect.proposedWeeks && connect.proposedWeeks.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-professional-gray-700 mb-2">
                Available Weeks
              </label>
              <div className="space-y-2">
                {connect.proposedWeeks.map((week, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-professional-gray-50 rounded-lg border border-professional-gray-200"
                  >
                    <Calendar className="w-4 h-4 text-professional-gray-600" />
                    <span className="text-sm font-medium text-professional-gray-800">
                      Week of {formatWeekDisplay(week)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {connect.notes && (
            <div>
              <label className="block text-sm font-bold text-professional-gray-700 mb-2">
                Notes
              </label>
              <p className="p-3 bg-professional-gray-50 rounded-lg border border-professional-gray-200 text-professional-gray-800 whitespace-pre-wrap">
                {connect.notes}
              </p>
            </div>
          )}

          {/* Date Created */}
          {connect.createdAt && (
            <div>
              <label className="block text-sm font-bold text-professional-gray-700 mb-2">
                Created
              </label>
              <p className="text-sm text-professional-gray-600">
                {new Date(connect.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-professional-gray-200 flex gap-2 flex-shrink-0">
          {/* Status Update Button - Left, Red, Large */}
          {connect.status === 'pending' && (
            <button
              onClick={() => handleStatusUpdate('completed')}
              className="flex-1 px-4 py-2 bg-netsurit-red text-white rounded-lg hover:bg-netsurit-red focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              data-testid="mark-completed-button"
            >
              Mark as Completed
            </button>
          )}
          
          {/* Send Teams Message Button - Right, Grey, Small */}
          <button
            onClick={handleCopyTeamsMessage}
            className="px-4 py-2 bg-professional-gray-600 text-white rounded-lg hover:bg-professional-gray-700 focus:outline-none focus:ring-2 focus:ring-professional-gray-500 transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center gap-2"
            data-testid="copy-teams-message"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Send Teams Message
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
