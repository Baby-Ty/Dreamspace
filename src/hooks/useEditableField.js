import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing inline editable field state
 * Handles edit/save/cancel patterns with async save support
 * 
 * @param {*} initialValue - Initial value for the field
 * @param {Function} onSave - Async function to call when saving (receives new value)
 * @param {Object} options - Configuration options
 * @param {Function} options.onCancel - Optional callback when edit is cancelled
 * @param {Function} options.onEditStart - Optional callback when edit starts
 * @param {boolean} options.resetOnSave - Reset to editing mode after save (default: false)
 * @param {Function} options.validator - Optional validation function (returns true if valid)
 * @returns {Object} Editable field control object
 * 
 * @example
 * const titleField = useEditableField(dream.title, async (newTitle) => {
 *   await dreamService.updateTitle(dreamId, newTitle);
 * });
 * 
 * // In JSX
 * {titleField.isEditing ? (
 *   <input
 *     value={titleField.value}
 *     onChange={(e) => titleField.setValue(e.target.value)}
 *     onKeyDown={(e) => {
 *       if (e.key === 'Enter') titleField.save();
 *       if (e.key === 'Escape') titleField.cancel();
 *     }}
 *   />
 * ) : (
 *   <span onClick={titleField.startEdit}>{titleField.value}</span>
 * )}
 */
export function useEditableField(initialValue, onSave, options = {}) {
  const {
    onCancel,
    onEditStart,
    resetOnSave = false,
    validator
  } = options;

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [originalValue, setOriginalValue] = useState(initialValue);

  // Sync with external changes to initialValue
  useEffect(() => {
    if (!isEditing) {
      setValue(initialValue);
      setOriginalValue(initialValue);
    }
  }, [initialValue, isEditing]);

  const startEdit = useCallback(() => {
    setOriginalValue(value);
    setIsEditing(true);
    onEditStart?.();
  }, [value, onEditStart]);

  const cancel = useCallback(() => {
    setValue(originalValue);
    setIsEditing(false);
    onCancel?.();
  }, [originalValue, onCancel]);

  const save = useCallback(async () => {
    // Validate if validator provided
    if (validator && !validator(value)) {
      return false;
    }

    // Don't save if value hasn't changed
    if (value === originalValue) {
      setIsEditing(false);
      return true;
    }

    setIsSaving(true);
    try {
      await onSave(value);
      setOriginalValue(value);
      if (!resetOnSave) {
        setIsEditing(false);
      }
      return true;
    } catch (error) {
      console.error('Error saving field:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [value, originalValue, onSave, resetOnSave, validator]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setOriginalValue(initialValue);
    setIsEditing(false);
  }, [initialValue]);

  return {
    isEditing,
    value,
    setValue,
    isSaving,
    hasChanges: value !== originalValue,
    startEdit,
    cancel,
    save,
    reset
  };
}

export default useEditableField;
