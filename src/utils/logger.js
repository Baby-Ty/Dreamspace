/**
 * Lightweight logging utility
 * Wraps console methods with timestamps, module tags, and structured data
 * Future-proof for Azure Application Insights integration
 */

// Log levels (ordered by severity)
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

// Global log level (can be set via environment variable)
let currentLogLevel = import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO;

// Application Insights instance (lazy-loaded when needed)
let appInsights = null;

/**
 * Set the global log level
 * @param {number} level - LogLevel constant
 */
export function setLogLevel(level) {
  currentLogLevel = level;
}

/**
 * Initialize Application Insights (call this in your app setup)
 * @param {Object} aiInstance - Application Insights instance
 */
export function initializeAppInsights(aiInstance) {
  appInsights = aiInstance;
  logger.info('logger', 'Application Insights initialized');
}

/**
 * Format timestamp for logs
 */
function getTimestamp() {
  const now = new Date();
  return now.toISOString();
}

/**
 * Get color for log level (for console styling)
 */
function getLogColor(level) {
  switch (level) {
    case LogLevel.DEBUG:
      return '#6b7280'; // gray
    case LogLevel.INFO:
      return '#3b82f6'; // blue
    case LogLevel.WARN:
      return '#f59e0b'; // amber
    case LogLevel.ERROR:
      return '#ef4444'; // red
    case LogLevel.CRITICAL:
      return '#dc2626'; // dark red
    default:
      return '#000000';
  }
}

/**
 * Get emoji for log level
 */
function getLogEmoji(level) {
  switch (level) {
    case LogLevel.DEBUG:
      return '🔍';
    case LogLevel.INFO:
      return 'ℹ️';
    case LogLevel.WARN:
      return '⚠️';
    case LogLevel.ERROR:
      return '❌';
    case LogLevel.CRITICAL:
      return '🔥';
    default:
      return '📝';
  }
}

/**
 * Format log message for console
 */
function formatConsoleMessage(level, module, message, data) {
  const timestamp = getTimestamp();
  const emoji = getLogEmoji(level);
  const color = getLogColor(level);
  
  return {
    prefix: `%c${emoji} [${timestamp}] [${module}]`,
    style: `color: ${color}; font-weight: bold;`,
    message,
    data
  };
}

/**
 * Send log to Application Insights
 */
function sendToAppInsights(level, module, message, data) {
  if (!appInsights) return;

  const properties = {
    module,
    timestamp: getTimestamp(),
    ...(data || {})
  };

  try {
    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        appInsights.trackTrace({
          message: `[${module}] ${message}`,
          severityLevel: level === LogLevel.DEBUG ? 0 : 1,
          properties
        });
        break;

      case LogLevel.WARN:
        appInsights.trackTrace({
          message: `[${module}] ${message}`,
          severityLevel: 2,
          properties
        });
        break;

      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        appInsights.trackException({
          exception: new Error(`[${module}] ${message}`),
          severityLevel: level === LogLevel.CRITICAL ? 4 : 3,
          properties
        });
        break;
    }
  } catch (error) {
    console.error('Failed to send log to Application Insights:', error);
  }
}

/**
 * Core logging function
 */
function log(level, module, message, data) {
  // Skip if below current log level
  if (level < currentLogLevel) return;

  const { prefix, style, message: msg, data: logData } = formatConsoleMessage(
    level,
    module,
    message,
    data
  );

  // Console output
  if (logData && Object.keys(logData).length > 0) {
    console.log(prefix, style, msg, logData);
  } else {
    console.log(prefix, style, msg);
  }

  // Send to Application Insights in production
  if (import.meta.env.PROD || appInsights) {
    sendToAppInsights(level, module, message, data);
  }
}

/**
 * Main logger object with convenience methods
 */
export const logger = {
  /**
   * Debug log (verbose, development only)
   * @param {string} module - Module name (e.g., 'auth', 'api', 'ui')
   * @param {string} message - Log message
   * @param {Object} data - Optional structured data
   */
  debug(module, message, data) {
    log(LogLevel.DEBUG, module, message, data);
  },

  /**
   * Info log (general information)
   * @param {string} module - Module name
   * @param {string} message - Log message
   * @param {Object} data - Optional structured data
   */
  info(module, message, data) {
    log(LogLevel.INFO, module, message, data);
  },

  /**
   * Warning log (potential issues)
   * @param {string} module - Module name
   * @param {string} message - Log message
   * @param {Object} data - Optional structured data
   */
  warn(module, message, data) {
    log(LogLevel.WARN, module, message, data);
  },

  /**
   * Error log (errors that need attention)
   * @param {string} module - Module name
   * @param {string} message - Log message
   * @param {Object} data - Optional structured data or Error object
   */
  error(module, message, data) {
    // If data is an Error object, extract useful info
    if (data instanceof Error) {
      data = {
        errorName: data.name,
        errorMessage: data.message,
        errorStack: data.stack
      };
    }
    log(LogLevel.ERROR, module, message, data);
  },

  /**
   * Critical log (severe errors, system failures)
   * @param {string} module - Module name
   * @param {string} message - Log message
   * @param {Object} data - Optional structured data or Error object
   */
  critical(module, message, data) {
    if (data instanceof Error) {
      data = {
        errorName: data.name,
        errorMessage: data.message,
        errorStack: data.stack
      };
    }
    log(LogLevel.CRITICAL, module, message, data);
  },

  /**
   * Track custom event (for Application Insights)
   * @param {string} name - Event name
   * @param {Object} properties - Event properties
   */
  event(name, properties = {}) {
    logger.info('event', name, properties);

    if (appInsights) {
      try {
        appInsights.trackEvent({
          name,
          properties: {
            ...properties,
            timestamp: getTimestamp()
          }
        });
      } catch (error) {
        console.error('Failed to track event:', error);
      }
    }
  },

  /**
   * Track page view (for Application Insights)
   * @param {string} name - Page name
   * @param {string} url - Page URL
   * @param {Object} properties - Additional properties
   */
  pageView(name, url, properties = {}) {
    logger.debug('pageview', `${name} - ${url}`, properties);

    if (appInsights) {
      try {
        appInsights.trackPageView({
          name,
          uri: url,
          properties: {
            ...properties,
            timestamp: getTimestamp()
          }
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    }
  },

  /**
   * Track metric (for Application Insights)
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {Object} properties - Additional properties
   */
  metric(name, value, properties = {}) {
    logger.debug('metric', `${name}: ${value}`, properties);

    if (appInsights) {
      try {
        appInsights.trackMetric({
          name,
          average: value,
          properties: {
            ...properties,
            timestamp: getTimestamp()
          }
        });
      } catch (error) {
        console.error('Failed to track metric:', error);
      }
    }
  },

  /**
   * Start performance timer
   * @param {string} operation - Operation name
   * @returns {Function} Stop function that logs duration
   */
  startTimer(operation) {
    const startTime = performance.now();
    const module = 'perf';

    logger.debug(module, `Started: ${operation}`);

    return () => {
      const duration = performance.now() - startTime;
      logger.info(module, `Completed: ${operation}`, {
        duration: `${duration.toFixed(2)}ms`
      });

      // Send to Application Insights
      if (appInsights) {
        try {
          appInsights.trackMetric({
            name: `performance_${operation}`,
            average: duration,
            properties: {
              operation,
              timestamp: getTimestamp()
            }
          });
        } catch (error) {
          console.error('Failed to track performance metric:', error);
        }
      }

      return duration;
    };
  }
};

/**
 * Create a module-scoped logger
 * Convenience function to avoid repeating module name
 * 
 * @param {string} module - Module name
 * @returns {Object} Logger with module pre-filled
 */
export function createLogger(module) {
  return {
    debug: (message, data) => logger.debug(module, message, data),
    info: (message, data) => logger.info(module, message, data),
    warn: (message, data) => logger.warn(module, message, data),
    error: (message, data) => logger.error(module, message, data),
    critical: (message, data) => logger.critical(module, message, data),
    startTimer: (operation) => logger.startTimer(`${module}:${operation}`)
  };
}

export default logger;
