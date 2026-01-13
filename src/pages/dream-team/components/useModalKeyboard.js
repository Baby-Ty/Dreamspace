import { useEffect } from 'react';

/**
 * Custom hook for modal keyboard and focus management
 * Handles Escape key and initial focus
 */
export function useModalKeyboard(onClose, closeButtonRef) {
  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Focus management
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, [closeButtonRef]);
}
