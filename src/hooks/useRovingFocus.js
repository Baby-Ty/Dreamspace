// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Roving tabindex hook for keyboard navigation in lists and grids
 * Implements ARIA roving tabindex pattern:
 * - Only one item has tabIndex=0 (focusable)
 * - All others have tabIndex=-1 (not in tab order)
 * - Arrow keys move focus between items
 * 
 * @param {number} itemCount - Total number of items
 * @param {Object} options - Configuration options
 * @param {boolean} options.loop - Whether to loop from end to start (default: true)
 * @param {string} options.direction - 'vertical', 'horizontal', or 'both' (default: 'vertical')
 * @param {number} options.columnsCount - For grid navigation (default: 1)
 * @returns {Object} - { focusedIndex, setFocusedIndex, getItemProps, onKeyDown }
 */
export function useRovingFocus(itemCount, options = {}) {
  const {
    loop = true,
    direction = 'vertical',
    columnsCount = 1
  } = options;

  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef(new Map());

  // Register/unregister item refs
  const registerItem = useCallback((index, element) => {
    if (element) {
      itemRefs.current.set(index, element);
    } else {
      itemRefs.current.delete(index);
    }
  }, []);

  // Focus an item by index
  const focusItem = useCallback((index) => {
    const element = itemRefs.current.get(index);
    if (element) {
      element.focus();
      setFocusedIndex(index);
    }
  }, []);

  // Navigate to next item
  const moveNext = useCallback(() => {
    let nextIndex = focusedIndex + 1;
    if (nextIndex >= itemCount) {
      nextIndex = loop ? 0 : itemCount - 1;
    }
    focusItem(nextIndex);
  }, [focusedIndex, itemCount, loop, focusItem]);

  // Navigate to previous item
  const movePrevious = useCallback(() => {
    let prevIndex = focusedIndex - 1;
    if (prevIndex < 0) {
      prevIndex = loop ? itemCount - 1 : 0;
    }
    focusItem(prevIndex);
  }, [focusedIndex, itemCount, loop, focusItem]);

  // Navigate down in grid
  const moveDown = useCallback(() => {
    let nextIndex = focusedIndex + columnsCount;
    if (nextIndex >= itemCount) {
      if (loop) {
        nextIndex = nextIndex % itemCount;
      } else {
        nextIndex = focusedIndex; // Stay at current position
      }
    }
    focusItem(nextIndex);
  }, [focusedIndex, columnsCount, itemCount, loop, focusItem]);

  // Navigate up in grid
  const moveUp = useCallback(() => {
    let prevIndex = focusedIndex - columnsCount;
    if (prevIndex < 0) {
      if (loop) {
        prevIndex = itemCount + prevIndex; // Wrap around
      } else {
        prevIndex = focusedIndex; // Stay at current position
      }
    }
    focusItem(prevIndex);
  }, [focusedIndex, columnsCount, itemCount, loop, focusItem]);

  // Navigate to start
  const moveToStart = useCallback(() => {
    focusItem(0);
  }, [focusItem]);

  // Navigate to end
  const moveToEnd = useCallback(() => {
    focusItem(itemCount - 1);
  }, [itemCount, focusItem]);

  // Keyboard event handler
  const onKeyDown = useCallback((event) => {
    const isVertical = direction === 'vertical' || direction === 'both';
    const isHorizontal = direction === 'horizontal' || direction === 'both';
    const isGrid = columnsCount > 1;

    switch (event.key) {
      case 'ArrowDown':
        if (isVertical) {
          event.preventDefault();
          if (isGrid) {
            moveDown();
          } else {
            moveNext();
          }
        }
        break;

      case 'ArrowUp':
        if (isVertical) {
          event.preventDefault();
          if (isGrid) {
            moveUp();
          } else {
            movePrevious();
          }
        }
        break;

      case 'ArrowRight':
        if (isHorizontal) {
          event.preventDefault();
          moveNext();
        }
        break;

      case 'ArrowLeft':
        if (isHorizontal) {
          event.preventDefault();
          movePrevious();
        }
        break;

      case 'Home':
        event.preventDefault();
        moveToStart();
        break;

      case 'End':
        event.preventDefault();
        moveToEnd();
        break;

      default:
        break;
    }
  }, [direction, columnsCount, moveDown, moveUp, moveNext, movePrevious, moveToStart, moveToEnd]);

  // Get props for each item
  const getItemProps = useCallback((index) => ({
    tabIndex: index === focusedIndex ? 0 : -1,
    ref: (element) => registerItem(index, element),
    onFocus: () => setFocusedIndex(index),
    'data-roving-index': index
  }), [focusedIndex, registerItem]);

  // Auto-focus first item on mount
  useEffect(() => {
    if (itemCount > 0 && focusedIndex === 0) {
      const firstElement = itemRefs.current.get(0);
      if (firstElement && document.activeElement !== firstElement) {
        // Don't auto-focus unless explicitly requested
        // This prevents stealing focus from other elements
      }
    }
  }, [itemCount, focusedIndex]);

  return {
    focusedIndex,
    setFocusedIndex,
    getItemProps,
    onKeyDown,
    focusItem
  };
}

export default useRovingFocus;

