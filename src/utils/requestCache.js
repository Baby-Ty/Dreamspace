// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

/**
 * Request cache with TTL and deduplication
 * Prevents duplicate concurrent requests and caches responses
 * 
 * @example
 * const result = await requestCache.fetch('myKey', async () => {
 *   return await fetchData();
 * }, 30000);
 */
class RequestCache {
  constructor() {
    this.cache = new Map(); // { key: { data, timestamp } }
    this.pendingRequests = new Map(); // { key: Promise }
  }

  /**
   * Fetch with caching and deduplication
   * @param {string} key - Cache key (should be unique per request)
   * @param {Function} fetchFn - Async function that returns data
   * @param {number} ttl - Time to live in milliseconds (default 30s)
   * @returns {Promise<any>} - The fetched or cached data
   */
  async fetch(key, fetchFn, ttl = 30000) {
    // Return pending request if already in flight (deduplication)
    if (this.pendingRequests.has(key)) {
      console.log(`📦 Request deduplication: ${key}`);
      return this.pendingRequests.get(key);
    }

    // Return cached data if still fresh
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      const age = Math.round((Date.now() - cached.timestamp) / 1000);
      console.log(`✅ Cache hit: ${key} (age: ${age}s)`);
      return cached.data;
    }

    // Execute new request
    console.log(`🔄 Cache miss: ${key}, fetching...`);
    const promise = fetchFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);

    try {
      const data = await promise;
      this.cache.set(key, { data, timestamp: Date.now() });
      console.log(`💾 Cached: ${key}`);
      return data;
    } catch (error) {
      // Don't cache errors
      this.cache.delete(key);
      throw error;
    }
  }

  /**
   * Invalidate cache entries matching pattern
   * @param {string} keyPattern - Pattern to match against cache keys
   * @returns {number} - Number of entries invalidated
   */
  invalidate(keyPattern) {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    if (count > 0) {
      console.log(`🗑️ Invalidated ${count} cache entries matching: ${keyPattern}`);
    }
    return count;
  }

  /**
   * Clear all cache entries
   * @returns {number} - Number of entries cleared
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.pendingRequests.clear();
    if (size > 0) {
      console.log(`🗑️ Cleared ${size} cache entries`);
    }
    return size;
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache stats
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const requestCache = new RequestCache();

// Also export class for testing
export { RequestCache };

