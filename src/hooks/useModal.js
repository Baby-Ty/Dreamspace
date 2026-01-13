// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useCallback } from 'react';

/**
 * useModal - Reusable hook for modal state management
 * 
 * Eliminates repeated modal state boilerplate across the application
 * 
 * Usage:
 *   const { isOpen, data, open, close } = useModal();
 *   
 *   // Open modal with data
 *   open({ userId: '123', name: 'John' });
 *   
 *   // Close modal
 *   close();
 *   
 *   // Render modal
 *   {isOpen && <Modal data={data} onClose={close} />}
 * 
 * @param {any} initialData - Initial data for the modal (optional)
 * @returns {object} Modal state and handlers
 */
export function useModal(initialData = null) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(initialData);

  /**
   * Open modal with optional data
   * @param {any} modalData - Data to pass to modal
   */
  const open = useCallback((modalData = null) => {
    if (modalData !== null) {
      setData(modalData);
    }
    setIsOpen(true);
  }, []);

  /**
   * Close modal and optionally clear data
   * @param {boolean} clearData - Whether to clear data on close (default: true)
   */
  const close = useCallback((clearData = true) => {
    setIsOpen(false);
    if (clearData) {
      setData(initialData);
    }
  }, [initialData]);

  /**
   * Toggle modal open/closed
   */
  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  /**
   * Update data without closing modal
   * @param {any} newData - New data to set
   */
  const updateData = useCallback((newData) => {
    setData(newData);
  }, []);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    updateData
  };
}

/**
 * useMultiModal - Manage multiple modals with a single hook
 * 
 * Usage:
 *   const modals = useMultiModal(['user', 'confirm', 'edit']);
 *   
 *   modals.user.open({ userId: '123' });
 *   modals.confirm.open();
 *   modals.edit.close();
 * 
 * @param {string[]} modalNames - Array of modal names
 * @returns {object} Object with modal state for each named modal
 */
export function useMultiModal(modalNames) {
  const modals = {};
  
  modalNames.forEach(name => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    modals[name] = useModal();
  });
  
  return modals;
}

export default useModal;
