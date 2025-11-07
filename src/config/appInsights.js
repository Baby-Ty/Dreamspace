/**
 * Application Insights Configuration
 * Simple monitoring setup for DreamSpace
 */

import { ApplicationInsights } from '@microsoft/applicationinsights-web';

// Only initialize if connection string is provided
const connectionString = import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING;

let appInsights = null;

if (connectionString && connectionString !== 'undefined') {
  appInsights = new ApplicationInsights({
    config: {
      connectionString: connectionString,
      // Automatically track React Router navigation
      enableAutoRouteTracking: true,
      // Track how long users spend on each page
      autoTrackPageVisitTime: true,
      // Enable correlation between frontend and backend requests
      enableCorsCorrelation: true,
      // Track AJAX calls
      disableFetchTracking: false,
      disableAjaxTracking: false,
    }
  });

  appInsights.loadAppInsights();
  appInsights.trackPageView(); // Track initial page view
} else {
  
  // Create mock object for local development
  appInsights = {
    trackEvent: () => {},
    trackException: () => {},
    trackTrace: () => {},
    trackPageView: () => {},
  };
}

// Helper functions for easy tracking
export const trackEvent = (name, properties = {}) => {
  if (appInsights) {
    appInsights.trackEvent({ name, properties });
  }
};

export const trackError = (error, properties = {}) => {
  if (appInsights) {
    appInsights.trackException({ 
      exception: error, 
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
      }
    });
  }
};

export const trackMetric = (name, value) => {
  if (appInsights) {
    appInsights.trackMetric({ name, average: value });
  }
};

export default appInsights;

