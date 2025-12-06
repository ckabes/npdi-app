/**
 * In-Memory Caching Service
 *
 * Simple caching layer for frequently-accessed, rarely-changing data
 * (templates, form configurations, etc.)
 *
 * Features:
 * - TTL-based expiration
 * - Size limits to prevent memory issues
 * - Cache invalidation by key or pattern
 * - LRU eviction when size limit reached
 */

class CacheService {
  constructor(options = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 5 * 60 * 1000; // Default: 5 minutes
    this.maxSize = options.maxSize || 100; // Default: max 100 entries
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Generate cache key from namespace and identifier
   */
  _generateKey(namespace, id) {
    return `${namespace}:${id}`;
  }

  /**
   * Get value from cache
   */
  get(namespace, id) {
    const key = this._generateKey(namespace, id);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Update access time for LRU
    entry.lastAccessed = Date.now();
    this.hits++;
    return entry.value;
  }

  /**
   * Set value in cache with optional TTL override
   */
  set(namespace, id, value, ttl = null) {
    const key = this._generateKey(namespace, id);
    const expiresAt = Date.now() + (ttl || this.ttl);

    // Evict oldest entry if at max size
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this._evictOldest();
    }

    this.cache.set(key, {
      value,
      expiresAt,
      lastAccessed: Date.now(),
      createdAt: Date.now()
    });

    return true;
  }

  /**
   * Delete specific cache entry
   */
  delete(namespace, id) {
    const key = this._generateKey(namespace, id);
    return this.cache.delete(key);
  }

  /**
   * Clear entire namespace or specific pattern
   */
  invalidate(namespace, pattern = null) {
    let deletedCount = 0;

    for (const key of this.cache.keys()) {
      if (pattern) {
        // Match pattern within namespace
        const regex = new RegExp(`^${namespace}:${pattern}`);
        if (regex.test(key)) {
          this.cache.delete(key);
          deletedCount++;
        }
      } else {
        // Clear entire namespace
        if (key.startsWith(`${namespace}:`)) {
          this.cache.delete(key);
          deletedCount++;
        }
      }
    }

    return deletedCount;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    return size;
  }

  /**
   * Evict least recently used entry
   */
  _evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(2) : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`,
      ttl: this.ttl
    };
  }

  /**
   * Get or set pattern (fetch if not cached)
   */
  async getOrSet(namespace, id, fetchFunction, ttl = null) {
    // Try to get from cache
    const cached = this.get(namespace, id);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const value = await fetchFunction();
    this.set(namespace, id, value, ttl);
    return value;
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let deletedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }
}

// Create singleton instance
const cacheService = new CacheService({
  ttl: 10 * 60 * 1000, // 10 minutes for templates/forms (rarely change)
  maxSize: 200 // Allow up to 200 cached entries
});

// Run cleanup every 5 minutes
setInterval(() => {
  const deleted = cacheService.cleanup();
  if (deleted > 0) {
    console.log(`[Cache] Cleaned up ${deleted} expired entries`);
  }
}, 5 * 60 * 1000);

// Export singleton
module.exports = cacheService;
