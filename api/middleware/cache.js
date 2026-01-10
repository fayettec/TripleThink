/**
 * TripleThink Caching Middleware
 * LRU cache for frequently accessed entities
 */

// ============================================================
// SIMPLE LRU CACHE IMPLEMENTATION
// ============================================================

class LRUCache {
  constructor(maxSize = 100, ttlMs = 300000) { // Default: 100 items, 5 min TTL
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  /**
   * Get item from cache
   * @returns {any|undefined} Cached value or undefined if not found/expired
   */
  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      return undefined;
    }

    // Check expiration
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);

    return item.value;
  }

  /**
   * Set item in cache
   */
  set(key, value, ttlMs = null) {
    // Delete if exists to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest if at capacity
    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs || this.ttlMs),
      createdAt: Date.now()
    });
  }

  /**
   * Delete item from cache
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Delete items matching a pattern
   */
  deletePattern(pattern) {
    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  /**
   * Clear all items
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  stats() {
    let expired = 0;
    const now = Date.now();

    for (const item of this.cache.values()) {
      if (now > item.expiresAt) {
        expired++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expired,
      ttlMs: this.ttlMs
    };
  }
}

// ============================================================
// CACHE INSTANCES
// ============================================================

// Cache instances for different data types
const caches = {
  entities: new LRUCache(200, 300000),      // 200 entities, 5 min TTL
  metadata: new LRUCache(100, 600000),       // 100 metadata, 10 min TTL
  epistemic: new LRUCache(50, 60000),        // 50 epistemic queries, 1 min TTL
  temporal: new LRUCache(50, 60000),         // 50 temporal queries, 1 min TTL
  search: new LRUCache(30, 30000)            // 30 searches, 30 sec TTL
};

// ============================================================
// CACHE KEY GENERATORS
// ============================================================

const cacheKeys = {
  entity: (id, includeMetadata) => `entity:${id}:meta=${includeMetadata}`,
  entityAtTime: (id, timestamp) => `entity:${id}:at=${timestamp}`,
  metadata: (id) => `metadata:${id}`,
  characterKnowledge: (charId, timestamp) => `epistemic:${charId}:${timestamp}`,
  factBelievers: (factId, timestamp) => `believers:${factId}:${timestamp}`,
  fictionAudience: (fictionId, timestamp) => `fiction:${fictionId}:${timestamp}`,
  entityStates: (entityId, from, to) => `states:${entityId}:${from}:${to}`,
  search: (query, type, dateRange) => `search:${query}:${type}:${dateRange}`
};

// ============================================================
// MIDDLEWARE
// ============================================================

/**
 * Cache middleware factory
 * @param {string} cacheType - Which cache to use
 * @param {function} keyGenerator - Function to generate cache key from request
 * @param {number} ttlMs - Optional TTL override
 */
function cacheMiddleware(cacheType, keyGenerator, ttlMs = null) {
  const cache = caches[cacheType];

  if (!cache) {
    throw new Error(`Unknown cache type: ${cacheType}`);
  }

  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if cache is disabled
    if (req.query.no_cache === 'true') {
      return next();
    }

    const key = keyGenerator(req);

    // Check cache
    const cached = cache.get(key);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, body, ttlMs);
      }
      res.set('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
}

/**
 * Invalidate cache entries for an entity
 */
function invalidateEntityCache(entityId) {
  caches.entities.deletePattern(entityId);
  caches.epistemic.deletePattern(entityId);
  caches.temporal.deletePattern(entityId);
  caches.search.clear(); // Search results may be affected
}

/**
 * Invalidate cache entries for metadata
 */
function invalidateMetadataCache(metaId, entityId) {
  caches.metadata.delete(cacheKeys.metadata(metaId));
  if (entityId) {
    caches.entities.deletePattern(entityId);
  }
}

/**
 * Clear all caches
 */
function clearAllCaches() {
  for (const cache of Object.values(caches)) {
    cache.clear();
  }
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  const stats = {};
  for (const [name, cache] of Object.entries(caches)) {
    stats[name] = cache.stats();
  }
  return stats;
}

// ============================================================
// SPECIFIC MIDDLEWARE FACTORIES
// ============================================================

/**
 * Entity cache middleware
 */
function entityCacheMiddleware() {
  return cacheMiddleware('entities', (req) =>
    cacheKeys.entity(req.params.id, req.query.include_metadata || 'auto')
  );
}

/**
 * Metadata cache middleware
 */
function metadataCacheMiddleware() {
  return cacheMiddleware('metadata', (req) =>
    cacheKeys.metadata(req.params.id)
  );
}

/**
 * Epistemic cache middleware
 */
function epistemicCacheMiddleware() {
  return cacheMiddleware('epistemic', (req) => {
    const { id } = req.params;
    const timestamp = req.query.at_timestamp || 'latest';
    return cacheKeys.characterKnowledge(id, timestamp);
  });
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Cache instances
  caches,

  // Key generators
  cacheKeys,

  // Middleware
  cacheMiddleware,
  entityCacheMiddleware,
  metadataCacheMiddleware,
  epistemicCacheMiddleware,

  // Invalidation
  invalidateEntityCache,
  invalidateMetadataCache,
  clearAllCaches,

  // Stats
  getCacheStats,

  // LRU class for testing
  LRUCache
};
