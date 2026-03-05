
/**
 * Simple toast notification system
 * Replace with your preferred toast library (react-toastify, react-hot-toast, etc.)
 */

let toastContainer = null;

// Initialize toast container
function initToastContainer() {
  if (toastContainer) return toastContainer;

  toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  `;
  document.body.appendChild(toastContainer);
  return toastContainer;
}

/**
 * Show a toast notification
 * @param {string} message - Toast message
 * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in ms (default: 4000). Use 0 to disable auto-dismiss.
 * @param {object} options - Optional: { actionLabel, onAction, onDismiss }
 *   actionLabel: label for the action button (e.g. 'Retry')
 *   onAction: called when the action button is clicked (toast closes first)
 *   onDismiss: called when toast closes WITHOUT the action button being used
 */
export function showToast(message, type = 'info', duration = 4000, options = {}) {
  const { actionLabel, onAction, onDismiss } = options;
  const container = initToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Color scheme based on type
  const colors = {
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  toast.style.cssText = `
    background: ${colors[type] || colors.info};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 500;
    max-width: 350px;
    pointer-events: auto;
    cursor: pointer;
    animation: slideIn 0.3s ease-out;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  // Create icon span
  const iconSpan = document.createElement('span');
  iconSpan.style.cssText = 'font-size: 16px; font-weight: bold; flex-shrink: 0;';
  iconSpan.textContent = icons[type] || icons.info;
  
  // Create message span - use textContent to prevent XSS
  const messageSpan = document.createElement('span');
  messageSpan.style.cssText = 'flex: 1;';
  messageSpan.textContent = message;
  
  toast.appendChild(iconSpan);
  toast.appendChild(messageSpan);

  // Track whether the action button was used, to avoid calling onDismiss in that case
  let actionTriggered = false;
  let callbackFired = false;

  const fireOnDismiss = () => {
    if (!callbackFired && !actionTriggered && onDismiss) {
      callbackFired = true;
      onDismiss();
    }
  };

  // Optional action button (e.g. "Retry")
  if (actionLabel && onAction) {
    const button = document.createElement('button');
    button.textContent = actionLabel;
    button.style.cssText = `
      background: rgba(255, 255, 255, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.5);
      color: white;
      padding: 3px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
      flex-shrink: 0;
      font-family: inherit;
    `;
    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(255, 255, 255, 0.4)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(255, 255, 255, 0.25)';
    });
    button.addEventListener('click', (e) => {
      e.stopPropagation(); // don't trigger the toast body click
      actionTriggered = true;
      callbackFired = true;
      removeToast(toast);
      onAction();
    });
    toast.appendChild(button);
  }

  // Add animation keyframes
  if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Click on toast body to dismiss (fires onDismiss if action wasn't used)
  toast.addEventListener('click', () => {
    fireOnDismiss();
    removeToast(toast);
  });

  container.appendChild(toast);

  // Auto remove after duration (0 = no auto-dismiss)
  if (duration > 0) {
    const timeoutId = setTimeout(() => {
      fireOnDismiss();
      removeToast(toast);
    }, duration);
    toast.dataset.timeoutId = timeoutId;
  }
}

function removeToast(toast) {
  if (!toast || !toast.parentElement) return;

  // Clear timeout if exists
  if (toast.dataset.timeoutId) {
    clearTimeout(parseInt(toast.dataset.timeoutId));
  }

  // Animate out
  toast.style.animation = 'slideOut 0.3s ease-out';
  
  setTimeout(() => {
    if (toast.parentElement) {
      toast.parentElement.removeChild(toast);
    }
  }, 300);
}

/**
 * Toast shortcuts
 */
export const toast = {
  success: (message, duration) => showToast(message, 'success', duration),
  error: (message, duration) => showToast(message, 'error', duration),
  warning: (message, duration) => showToast(message, 'warning', duration),
  info: (message, duration) => showToast(message, 'info', duration),

  /**
   * Error toast with a Retry button.
   * Keeps the user's changes on screen until they decide.
   * @param {string} message - Error message
   * @param {function} onRetry - Called when user clicks Retry
   * @param {function} onGiveUp - Called when user dismisses without retrying
   */
  errorWithRetry: (message, onRetry, onGiveUp) =>
    showToast(message, 'error', 0, {
      actionLabel: 'Retry',
      onAction: onRetry,
      onDismiss: onGiveUp
    })
};

export default showToast;
