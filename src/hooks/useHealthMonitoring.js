
import { useState, useEffect, useCallback } from 'react';
import healthService from '../services/healthService.js';
import { logger } from '../utils/logger.js';

/**
 * Custom hook for health monitoring
 * Handles polling backend health status and managing state
 * 
 * @param {number} pollInterval - Polling interval in milliseconds (default: 60000 = 1 minute)
 * @returns {Object} Health monitoring state and actions
 */
export function useHealthMonitoring(pollInterval = 60000) {
  const [status, setStatus] = useState('unknown');
  const [healthData, setHealthData] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch health status from service
   */
  const fetchHealth = useCallback(async () => {
    try {
      logger.debug('useHealthMonitoring', 'Fetching health status');
      
      const result = await healthService.getHealthStatus();
      
      if (result.success) {
        setHealthData(result.data);
        setStatus(result.data.status || 'unknown');
        setError(null);
        logger.info('useHealthMonitoring', 'Health status updated', {
          status: result.data.status
        });
      } else {
        setError(result.error);
        setStatus('unknown');
        setHealthData(null);
        logger.warn('useHealthMonitoring', 'Health check failed', {
          error: result.error
        });
      }
      
      setLastChecked(new Date());
    } catch (err) {
      logger.error('useHealthMonitoring', 'Unexpected error fetching health', {
        error: err.message
      });
      setError(err.message);
      setStatus('unknown');
      setHealthData(null);
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(() => {
    setLoading(true);
    fetchHealth();
  }, [fetchHealth]);

  // Initial fetch on mount
  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Set up polling if interval is provided
  useEffect(() => {
    if (pollInterval <= 0) return;

    const intervalId = setInterval(() => {
      logger.debug('useHealthMonitoring', 'Auto-refresh triggered');
      fetchHealth();
    }, pollInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [pollInterval, fetchHealth]);

  return {
    status,
    healthData,
    lastChecked,
    loading,
    error,
    refresh
  };
}
