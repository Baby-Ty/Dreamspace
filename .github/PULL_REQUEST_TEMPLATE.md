## Description

<!-- Provide a brief description of the changes in this PR -->

## Type of Change

- [ ] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Style/UI changes
- [ ] Tests
- [ ] Documentation
- [ ] Chore (dependencies, tooling)

## Related Issues

<!-- Link to related issues: Closes #123, Fixes #456 -->

---

## Definition of Done Checklist

Every new/modified file **MUST** comply with our [Coding Standards](../CODING_STANDARDS.md):

### DoD Compliance
- [ ] DoD comment at top of each new file
- [ ] No fetch/API calls in components (use services/hooks)
- [ ] All files < 400 lines
- [ ] Early returns for loading/error states
- [ ] ARIA attributes on all interactive elements
- [ ] Components accept minimal props (no excessive prop drilling)
- [ ] Key testable elements have `data-testid` attributes

### Architecture
- [ ] Follows three-layer pattern (data/orchestration/presentation)
- [ ] Business logic extracted to custom hooks
- [ ] Components are pure/presentational where possible
- [ ] Uses thin wrapper if refactoring existing file

### Error Handling
- [ ] Services return `{ success, data?, error? }` format
- [ ] Uses `ok()` and `fail()` helpers from `utils/errorHandling`
- [ ] Error codes from `constants/errors.js`
- [ ] No unhandled exceptions or bare `throw` statements in services

### Accessibility
- [ ] Semantic HTML used (nav, main, article, section, etc.)
- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus management for modals/overlays
- [ ] Tested with screen reader (or confirmed structure is correct)

### Testing
- [ ] Tests written for new functionality
- [ ] All tests pass locally (`npm test`)
- [ ] Critical paths have test coverage
- [ ] Tests use `data-testid` for reliable selection

### Performance
- [ ] Expensive calculations use `useMemo`
- [ ] Callbacks use `useCallback` where needed
- [ ] Pure components use `memo()`
- [ ] No obvious performance regressions

### Documentation
- [ ] JSDoc comments on exported functions
- [ ] PropTypes defined on components
- [ ] Clear variable/function names (self-documenting)
- [ ] Complex logic has explanatory comments

---

## Testing Performed

<!-- Describe how you tested these changes -->

- [ ] Tested locally in development mode
- [ ] Tested production build
- [ ] Tested on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Tested keyboard navigation
- [ ] Tested responsive design (mobile, tablet, desktop)
- [ ] Tested with screen reader (if UI changes)

---

## Screenshots/Videos

<!-- If applicable, add screenshots or videos to demonstrate the changes -->

---

## Checklist Before Merge

- [ ] Code follows our [Coding Standards](../CODING_STANDARDS.md)
- [ ] All DoD criteria met
- [ ] Build succeeds (`npm run build`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] All tests pass (`npm test`)
- [ ] No console errors or warnings
- [ ] PR reviewed and approved
- [ ] Branch is up to date with main

---

## Deployment Notes

<!-- Any special deployment considerations, environment variables, migrations, etc. -->

---

## Reviewer Notes

<!-- Any specific areas you want reviewers to focus on -->

