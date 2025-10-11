# Virtual List Implementation Summary

## Overview
Added `react-window` for efficient rendering of large lists (100+ items).

## What Changed

### 1. New Component: `src/components/VirtualList.jsx`
- Wraps `react-window`'s `List` component
- Preserves accessibility (ARIA, keyboard nav)
- Handles empty states
- Supports arrow key navigation between items
- Auto-applies virtualization only when needed

### 2. Updated: `src/pages/people/CoachList.jsx`
- Added intelligent threshold: uses virtual list for 100+ coaches
- Extracted `renderCoachCard` function for reusability
- Conditional rendering:
  - **< 100 coaches**: Regular rendering (better for small lists)
  - **>= 100 coaches**: Virtual rendering (performance boost)
- Preserves all existing features:
  - Expand/collapse team members
  - Click handlers
  - Keyboard navigation
  - ARIA attributes

## Performance Benefits

### Before (>100 coaches):
- DOM nodes: ~100-500+ (all rendered)
- Initial render: Slow
- Scroll performance: Laggy
- Memory: High

### After (>100 coaches):
- DOM nodes: ~10-15 (only visible items)
- Initial render: Fast
- Scroll performance: Smooth
- Memory: Low

## Accessibility Preserved
- ✅ `role="list"` and `role="listitem"`
- ✅ `aria-label` and `aria-posinset`/`aria-setsize`
- ✅ Keyboard navigation (Arrow Up/Down)
- ✅ Tab focus management
- ✅ Screen reader announcements

## Usage Example

```jsx
import VirtualList from '../../components/VirtualList';

// Render a large list
<VirtualList
  items={coaches}
  renderItem={(coach, index, style) => (
    <div style={style}>
      {/* Your component */}
    </div>
  )}
  itemHeight={120}
  height={600}
  ariaLabel="Coach teams list"
  testId="coach-list-virtual"
/>
```

## When to Use Virtual Lists
- ✅ Lists with 100+ items
- ✅ Uniform or predictable item heights
- ✅ Scrollable containers
- ❌ Small lists (<100 items) - regular rendering is better
- ❌ Complex nested interactions (unless carefully managed)

## Testing
- Run dev server: `npm run dev`
- Navigate to People Dashboard
- With <100 coaches: Regular rendering (instant expand/collapse)
- With 100+ coaches: Virtual rendering (smooth scrolling)

## Other Large Lists Reviewed
- **DreamConnect**: Already uses pagination (no virtualization needed)
- **TeamMembers in CoachList**: Nested within expandable cards (acceptable performance)

## Future Enhancements (if needed)
- Add `VariableSizeList` support for dynamic heights
- Add horizontal virtualization for grid layouts
- Add `react-window-infinite-loader` for infinite scroll with real-time data
- Consider virtualization for TeamMembers if teams exceed 50 members

## Files Modified
1. ✅ `src/components/VirtualList.jsx` (new)
2. ✅ `src/pages/people/CoachList.jsx` (updated)

## Dependencies
- `react-window` - List virtualization library (installed)

---

**Result**: Large coach lists now render smoothly with minimal performance impact! 🚀

