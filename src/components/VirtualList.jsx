import { forwardRef, useRef } from 'react';
import PropTypes from 'prop-types';
import * as ReactWindow from 'react-window';

const List = ReactWindow.List;

/**
 * Virtual list component for rendering large datasets efficiently
 * Uses react-window for windowing while preserving accessibility and keyboard navigation
 * 
 * @param {Array} items - Array of items to render
 * @param {Function} renderItem - Function to render each item: (item, index, style) => JSX
 * @param {number} itemHeight - Height of each item in pixels
 * @param {number} height - Height of the list container (default: 600)
 * @param {string} className - Optional CSS class for the container
 * @param {string} ariaLabel - Accessibility label for the list
 * @param {string} testId - data-testid for testing
 */
const VirtualList = forwardRef(({ 
  items, 
  renderItem, 
  itemHeight = 80, 
  height = 600,
  className = '',
  ariaLabel = 'Virtual list',
  testId = 'virtual-list'
}, ref) => {
  const listRef = useRef(null);
  
  // Early return for empty lists
  if (!items || items.length === 0) {
    return (
      <div 
        className={`text-center py-8 ${className}`}
        role="status"
        data-testid={`${testId}-empty`}
      >
        <p className="text-professional-gray-500">No items to display</p>
      </div>
    );
  }

  // Row renderer that wraps the user's renderItem
  const Row = ({ index, style }) => {
    const item = items[index];
    
    return (
      <div
        style={style}
        role="listitem"
        aria-setsize={items.length}
        aria-posinset={index + 1}
        tabIndex={0}
        onKeyDown={(e) => {
          // Arrow key navigation
          if (e.key === 'ArrowDown' && index < items.length - 1) {
            e.preventDefault();
            const nextElement = e.currentTarget.nextElementSibling;
            if (nextElement) nextElement.focus();
          } else if (e.key === 'ArrowUp' && index > 0) {
            e.preventDefault();
            const prevElement = e.currentTarget.previousElementSibling;
            if (prevElement) prevElement.focus();
          }
        }}
      >
        {renderItem(item, index, style)}
      </div>
    );
  };

  Row.propTypes = {
    index: PropTypes.number.isRequired,
    style: PropTypes.object.isRequired
  };

  return (
    <div 
      className={className}
      data-testid={testId}
    >
      <List
        ref={listRef}
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        width="100%"
        role="list"
        aria-label={ariaLabel}
        className="focus:outline-none"
      >
        {Row}
      </List>
    </div>
  );
});

VirtualList.displayName = 'VirtualList';

VirtualList.propTypes = {
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired,
  itemHeight: PropTypes.number,
  height: PropTypes.number,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
  testId: PropTypes.string
};

export default VirtualList;
