// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import PropTypes from 'prop-types';
import { X, MapPin, Calendar, Users, Send, Loader2 } from 'lucide-react';
import TimeSlotSelector from './TimeSlotSelector';

/**
 * Modal for creating a new connect request
 */
export default function ConnectRequestModal({
  isOpen,
  selectedUser,
  currentUser,
  requestMessage,
  agenda,
  proposedWeeks,
  schedulingOption,
  isSaving,
  onMessageChange,
  onAgendaChange,
  onWeeksChange,
  onSchedulingChange,
  onSend,
  onClose
}) {
  if (!isOpen || !selectedUser) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-labelledby="connect-modal-title"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-professional-gray-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-professional-gray-200 bg-white flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 id="connect-modal-title" className="text-xl font-bold text-professional-gray-900">
                Connect with {selectedUser.name}
              </h3>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={onClose}
                className="p-1.5 text-professional-gray-600 hover:text-professional-gray-900 hover:bg-professional-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-professional-gray-500"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-5">
            {/* User Info */}
            <div>
              <label className="block text-sm font-bold text-professional-gray-700 mb-2">
                Connect With
              </label>
              <div className="p-4 bg-professional-gray-50 rounded-lg border border-professional-gray-200 space-y-3">
                {/* User avatars and names */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <img
                      src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=EC4B5C&color=fff&size=48`}
                      alt={currentUser?.name}
                      className="w-8 h-8 rounded-full ring-2 ring-white object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=EC4B5C&color=fff&size=48`;
                      }}
                    />
                    <p className="text-sm font-medium text-professional-gray-900 truncate">
                      {currentUser?.name}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-professional-gray-300"></div>
                  <div className="flex items-center gap-2 flex-1">
                    <img
                      src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name || 'User')}&background=6366f1&color=fff&size=48`}
                      alt={selectedUser.name}
                      className="w-8 h-8 rounded-full ring-2 ring-white object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name || 'User')}&background=6366f1&color=fff&size=48`;
                      }}
                    />
                    <p className="text-sm font-medium text-professional-gray-900 truncate">
                      {selectedUser.name}
                    </p>
                  </div>
                </div>
                
                {/* User locations */}
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-professional-gray-200">
                  <div className="flex items-center gap-1 flex-1">
                    <MapPin className="w-3 h-3 text-professional-gray-500 flex-shrink-0" />
                    <p className="text-xs text-professional-gray-600 truncate">
                      {currentUser?.office || 'Unknown'}
                    </p>
                  </div>
                  <div className="w-px h-4 bg-professional-gray-300"></div>
                  <div className="flex items-center gap-1 flex-1">
                    <MapPin className="w-3 h-3 text-professional-gray-500 flex-shrink-0" />
                    <p className="text-xs text-professional-gray-600 truncate">
                      {selectedUser.office || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shared Categories */}
            {selectedUser.sharedCategories && selectedUser.sharedCategories.length > 0 && (
              <div>
                <p className="text-sm font-bold text-professional-gray-700 mb-2">
                  Shared interests:
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedUser.sharedCategories.map((category) => (
                    <span
                      key={category}
                      className="px-2 py-1 bg-professional-gray-50 text-professional-gray-600 text-xs font-medium rounded-full border border-professional-gray-200"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Agenda */}
            <div>
              <label 
                htmlFor="connect-agenda"
                className="block text-sm font-bold text-professional-gray-700 mb-2"
              >
                Agenda / Topics <span className="text-netsurit-red">*</span>
              </label>
              <input
                id="connect-agenda"
                type="text"
                value={agenda}
                onChange={(e) => onAgendaChange(e.target.value)}
                className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-transparent text-sm"
                placeholder="e.g., Discuss marathon training tips, share career advice..."
                required
                data-testid="agenda-input"
              />
              <p className="text-xs text-professional-gray-500 mt-1">
                What would you like to discuss during this connect?
              </p>
            </div>

            {/* Week Selector */}
            <div>
              <TimeSlotSelector
                value={proposedWeeks}
                onChange={onWeeksChange}
                maxWeeks={3}
              />
            </div>

            {/* Message */}
            <div>
              <label 
                htmlFor="request-message"
                className="block text-sm font-bold text-professional-gray-700 mb-2"
              >
                Optional message:
              </label>
              <textarea
                id="request-message"
                value={requestMessage}
                onChange={(e) => onMessageChange(e.target.value)}
                className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-transparent h-16 resize-none text-sm leading-relaxed"
                placeholder="Share why you'd like to connect..."
              />
            </div>

            {/* Scheduling Option */}
            <div>
              <label className="block text-sm font-bold text-professional-gray-700 mb-2">
                Preferred meeting method:
              </label>
              <div className="space-y-2">
                <label className="flex items-center p-2 rounded-lg border border-professional-gray-200 hover:bg-professional-gray-50 cursor-pointer transition-all duration-200">
                  <input
                    type="radio"
                    value="teams"
                    checked={schedulingOption === 'teams'}
                    onChange={(e) => onSchedulingChange(e.target.value)}
                    className="mr-2 text-netsurit-red focus:ring-netsurit-red"
                  />
                  <div className="w-6 h-6 bg-netsurit-red/10 rounded-lg flex items-center justify-center mr-2">
                    <Calendar className="w-3 h-3 text-netsurit-red" />
                  </div>
                  <span className="text-sm font-medium text-professional-gray-800">
                    Microsoft Teams
                  </span>
                </label>
                <label className="flex items-center p-2 rounded-lg border border-professional-gray-200 hover:bg-professional-gray-50 cursor-pointer transition-all duration-200">
                  <input
                    type="radio"
                    value="inperson"
                    checked={schedulingOption === 'inperson'}
                    onChange={(e) => onSchedulingChange(e.target.value)}
                    className="mr-2 text-netsurit-red focus:ring-netsurit-red"
                  />
                  <div className="w-6 h-6 bg-netsurit-coral/10 rounded-lg flex items-center justify-center mr-2">
                    <Users className="w-3 h-3 text-netsurit-coral" />
                  </div>
                  <span className="text-sm font-medium text-professional-gray-800">
                    In Person
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-professional-gray-200 flex gap-2 flex-shrink-0">
          <button
            onClick={onSend}
            disabled={!requestMessage.trim() || !agenda.trim() || proposedWeeks.length === 0 || isSaving}
            className="flex-1 px-4 py-2 bg-netsurit-red text-white rounded-lg hover:bg-netsurit-red focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            data-testid="send-connect-request-button"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Request
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-2 bg-professional-gray-600 text-white rounded-lg hover:bg-professional-gray-700 focus:outline-none focus:ring-2 focus:ring-professional-gray-500 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

ConnectRequestModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  selectedUser: PropTypes.object,
  currentUser: PropTypes.object,
  requestMessage: PropTypes.string.isRequired,
  agenda: PropTypes.string.isRequired,
  proposedWeeks: PropTypes.array.isRequired,
  schedulingOption: PropTypes.string.isRequired,
  isSaving: PropTypes.bool.isRequired,
  onMessageChange: PropTypes.func.isRequired,
  onAgendaChange: PropTypes.func.isRequired,
  onWeeksChange: PropTypes.func.isRequired,
  onSchedulingChange: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};
