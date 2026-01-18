
import React from 'react';
import PropTypes from 'prop-types';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

/**
 * DataBoundary - Handles loading, error, and empty states for data-driven components
 * 
 * Eliminates repeated loading/error JSX across the application
 * 
 * Usage:
 *   <DataBoundary loading={isLoading} error={error} onRetry={refetch}>
 *     <YourComponent data={data} />
 *   </DataBoundary>
 */
export function DataBoundary({ 
  loading, 
  error, 
  onRetry, 
  children,
  loadingMessage = 'Loading...',
  errorTitle = 'Error Loading Data',
  emptyMessage = null,
  isEmpty = false,
  className = '',
  fullScreen = false
}) {
  // Loading state
  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'min-h-[400px]'} ${className}`}
        data-testid="data-boundary-loading"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="text-center">
          <Loader2 
            className="h-12 w-12 text-netsurit-red animate-spin mx-auto mb-4" 
            aria-hidden="true"
          />
          <h2 className="text-xl font-semibold text-professional-gray-900 mb-2">
            {loadingMessage}
          </h2>
          <p className="text-professional-gray-600">
            Please wait...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'min-h-[400px]'} ${className}`}
        data-testid="data-boundary-error"
        role="alert"
        aria-live="assertive"
      >
        <div className="text-center max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-professional-gray-200 p-8">
            <div className="w-16 h-16 bg-netsurit-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-netsurit-red" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-semibold text-professional-gray-900 mb-2">
              {errorTitle}
            </h2>
            <p className="text-professional-gray-600 mb-4">
              {typeof error === 'string' ? error : error?.message || 'An unexpected error occurred'}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-6 py-2 rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center mx-auto"
                aria-label="Retry loading data"
              >
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                <span>Try Again</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Empty state (optional)
  if (isEmpty && emptyMessage) {
    return (
      <div 
        className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'min-h-[400px]'} ${className}`}
        data-testid="data-boundary-empty"
        role="status"
      >
        <div className="text-center">
          <p className="text-professional-gray-600 text-lg">
            {emptyMessage}
          </p>
        </div>
      </div>
    );
  }

  // Success state - render children
  return children;
}

DataBoundary.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      message: PropTypes.string
    })
  ]),
  onRetry: PropTypes.func,
  children: PropTypes.node.isRequired,
  loadingMessage: PropTypes.string,
  errorTitle: PropTypes.string,
  emptyMessage: PropTypes.string,
  isEmpty: PropTypes.bool,
  className: PropTypes.string,
  fullScreen: PropTypes.bool
};

export default DataBoundary;