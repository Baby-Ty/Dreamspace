// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.

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
 * @param {number} duration - Duration in ms (default: 4000)
 */
export function showToast(message, type = 'info', duration = 4000) {
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
  iconSpan.style.cssText = 'font-size: 16px; font-weight: bold;';
  iconSpan.textContent = icons[type] || icons.info;
  
  // Create message span - use textContent to prevent XSS
  const messageSpan = document.createElement('span');
  messageSpan.style.cssText = 'flex: 1;';
  messageSpan.textContent = message;  // Safe: textContent escapes HTML
  
  toast.appendChild(iconSpan);
  toast.appendChild(messageSpan);

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

  // Click to dismiss
  toast.addEventListener('click', () => {
    removeToast(toast);
  });

  container.appendChild(toast);

  // Auto remove after duration
  const timeoutId = setTimeout(() => {
    removeToast(toast);
  }, duration);

  // Store timeout ID so it can be cleared if manually dismissed
  toast.dataset.timeoutId = timeoutId;
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
  info: (message, duration) => showToast(message, 'info', duration)
};

export default showToast;

