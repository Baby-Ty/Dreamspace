// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { Component } from 'react';
import { trackError } from '../config/appInsights';
import AnimatedBackground from './AnimatedBackground';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
    
    // Track error in Application Insights
    trackError(error, {
      componentStack: info.componentStack,
      errorBoundary: this.props.name || 'ErrorBoundary',
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 relative">
          <AnimatedBackground />
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-professional-gray-200 p-8 text-center relative z-10">
            <h2 className="text-2xl font-bold text-professional-gray-900 mb-4">Something went wrong</h2>
            <p className="text-professional-gray-600 mb-6">
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-netsurit-red text-white rounded-xl hover:bg-netsurit-coral transition-colors font-semibold shadow-lg"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


