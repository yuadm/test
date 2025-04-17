/**
 * Simple client-side caching utility for API responses
 */
export const DataCache = {
  cache: new Map<string, { data: any; timestamp: number }>(),
  
  /**
   * Set data in cache with expiration
   * @param key Cache key
   * @param data Data to cache
   * @param expirationMs Time in milliseconds until cache expires (default: 5 minutes)
   */
  set(key: string, data: any, expirationMs = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + expirationMs
    });
  },
  
  /**
   * Get data from cache if not expired
   * @param key Cache key
   * @returns Cached data or null if expired/not found
   */
  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.timestamp) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  },
  
  /**
   * Clear specific key or entire cache
   * @param key Optional specific key to clear
   */
  clear(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
};
