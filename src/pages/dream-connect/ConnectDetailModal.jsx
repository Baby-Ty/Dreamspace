// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useState } from 'react';
import { X, Calendar, Users, MapPin, Copy, CheckCircle } from 'lucide-react';
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
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-netsurit-red to-netsurit-coral p-4 text-white flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-white/20"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 id="connect-detail-title" className="text-lg font-bold">
                  Connect Details
                </h3>
                <p className="text-white/90 text-sm">View and manage your connection</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
              aria-label="Close modal"
              data-testid="close-detail-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-bold text-professional-gray-700 mb-2">
                Status
              </label>
              <ConnectStatusBadge status={connect.status || 'pending'} />
            </div>
            <button
              onClick={handleCopyTeamsMessage}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-sm font-medium"
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
                  Copy Teams Message
                </>
              )}
            </button>
          </div>

          {/* Connect With */}
          <div>
            <label className="block text-sm font-bold text-professional-gray-700 mb-2">
              Connect With
            </label>
            <div className="flex items-center gap-3 p-3 bg-professional-gray-50 rounded-lg border border-professional-gray-200">
              <img
                src={connect.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(connect.withWhom || connect.name || 'User')}&background=EC4B5C&color=fff&size=40`}
                alt={connect.withWhom || connect.name}
                className="w-10 h-10 rounded-full ring-2 ring-white object-cover"
                onError={(e) => {
                  const name = connect.withWhom || connect.name || 'User';
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=EC4B5C&color=fff&size=40`;
                }}
              />
              <div>
                <p className="font-semibold text-professional-gray-900">
                  {(() => {
                    // Format as "FirstName x FirstName" for both users
                    const getFirstName = (fullName) => {
                      if (!fullName) return '';
                      return fullName.split(' ')[0];
                    };
                    
                    if (!currentUser) {
                      return connect.withWhom || connect.name || 'Unknown';
                    }
                    
                    const currentUserFirstName = getFirstName(currentUser?.name || '');
                    const otherUserName = connect.withWhom || connect.name || '';
                    const otherUserFirstName = getFirstName(otherUserName);
                    
                    // If user is the sender (userId matches), show "CurrentUser x OtherUser"
                    // If user is the recipient (withWhomId matches), show "OtherUser x CurrentUser"
                    const isSender = connect.userId === (currentUser?.email || currentUser?.id);
                    
                    if (isSender) {
                      return currentUserFirstName && otherUserFirstName 
                        ? `${currentUserFirstName} x ${otherUserFirstName}`
                        : otherUserName || 'Unknown';
                    } else {
                      return otherUserFirstName && currentUserFirstName
                        ? `${otherUserFirstName} x ${currentUserFirstName}`
                        : otherUserName || 'Unknown';
                    }
                  })()}
                </p>
                {connect.office && (
                  <p className="text-sm text-professional-gray-600 flex items-center mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {connect.office}
                  </p>
                )}
              </div>
            </div>
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
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-professional-gray-100 text-professional-gray-700 rounded-lg hover:bg-professional-gray-200 focus:outline-none focus:ring-2 focus:ring-professional-gray-300 transition-all duration-200 font-medium"
            data-testid="close-detail-button"
          >
            Close
          </button>
          
          {/* Status Update Button */}
          {connect.status === 'pending' && (
            <button
              onClick={() => handleStatusUpdate('completed')}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 font-medium"
              data-testid="mark-completed-button"
            >
              Mark as Completed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
