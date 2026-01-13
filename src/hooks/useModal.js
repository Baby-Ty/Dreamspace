import { useState, useCallback } from 'react';

/**
 * Custom hook for managing modal state with associated data
 * Eliminates repetitive modal state management patterns
 * 
 * @param {boolean} initialState - Initial open/closed state (default: false)
 * @returns {Object} Modal control object
 * @returns {boolean} isOpen - Whether modal is currently open
 * @returns {*} data - Associated data passed when opening modal
 * @returns {Function} open - Function to open modal with optional data
 * @returns {Function} close - Function to close modal and clear data
 * 
 * @example
 * const editModal = useModal();
 * 
 * // Open modal with user data
 * editModal.open(userData);
 * 
 * // In JSX
 * {editModal.isOpen && (
 *   <EditModal
 *     data={editModal.data}
 *     onClose={editModal.close}
 *   />
 * )}
 */
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const [data, setData] = useState(null);
  
  const open = useCallback((payload = null) => {
    setData(payload);
    setIsOpen(true);
  }, []);
  
  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);
  
  return { isOpen, data, open, close };
}

export default useModal;
