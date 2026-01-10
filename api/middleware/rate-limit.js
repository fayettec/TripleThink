/**
 * TripleThink Rate Limiting Middleware
 * Token bucket rate limiting for API endpoints
 */

// ============================================================
// TOKEN BUCKET IMPLEMENTATION
// ============================================================

class TokenBucket {
  constructor(capacity, refillRate, refillIntervalMs = 1000) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;           // Tokens per interval
    this.refillIntervalMs = refillIntervalMs;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume tokens
   * @param {number} count - Number of tokens to consume
   * @returns {boolean} True if tokens were available and consumed
   */
  consume(count = 1) {
    this.refill();

    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }

    return false;
  }

  /**
   * Refill tokens based on elapsed time
   */
  refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const intervals = Math.floor(elapsed / this.refillIntervalMs);

    if (intervals > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + (intervals * this.refillRate));
      this.lastRefill = now;
    }
  }

  /**
   * Get current state
   */
  getState() {
    this.refill();
    return {
      tokens: Math.floor(this.tokens),
      capacity: this.capacity,
      refillRate: this.refillRate,
      refillIntervalMs: this.refillIntervalMs
    };
  }

  /**
   * Time until next token available (in ms)
   */
  timeUntilToken() {
    this.refill();

    if (this.tokens >= 1) {
      return 0;
    }

    const tokensNeeded = 1 - this.tokens;
    return Math.ceil((tokensNeeded / this.refillRate) * this.refillIntervalMs);
  }
}

// ============================================================
// RATE LIMITERS BY ENDPOINT CATEGORY
// ============================================================

const limiters = {
  // Standard CRUD operations: 1000/minute
  standard: new Map(),
  standardConfig: { capacity: 1000, refillRate: 17, refillIntervalMs: 1000 },

  // Epistemic queries: 100/minute (more expensive)
  epistemic: new Map(),
  epistemicConfig: { capacity: 100, refillRate: 2, refillIntervalMs: 1000 },

  // Batch queries: 10/minute (very expensive)
  batch: new Map(),
  batchConfig: { capacity: 10, refillRate: 1, refillIntervalMs: 6000 },

  // Export operations: 20/minute
  export: new Map(),
  exportConfig: { capacity: 20, refillRate: 1, refillIntervalMs: 3000 },

  // Search queries: 60/minute
  search: new Map(),
  searchConfig: { capacity: 60, refillRate: 1, refillIntervalMs: 1000 }
};

/**
 * Get or create bucket for a client
 */
function getBucket(category, clientId) {
  const buckets = limiters[category];
  const config = limiters[`${category}Config`];

  if (!buckets || !config) {
    throw new Error(`Unknown rate limit category: ${category}`);
  }

  if (!buckets.has(clientId)) {
    buckets.set(clientId, new TokenBucket(config.capacity, config.refillRate, config.refillIntervalMs));
  }

  return buckets.get(clientId);
}

/**
 * Get client identifier from request
 */
function getClientId(req) {
  // Use API key if authenticated
  const apiKey = req.get('X-API-Key');
  if (apiKey) {
    return `key:${apiKey.substring(0, 8)}`;
  }

  // Use IP address as fallback
  return `ip:${req.ip || req.connection.remoteAddress || 'unknown'}`;
}

// ============================================================
// MIDDLEWARE
// ============================================================

/**
 * Rate limit middleware factory
 * @param {string} category - Rate limit category
 */
function rateLimitMiddleware(category = 'standard') {
  return (req, res, next) => {
    // Skip rate limiting if disabled
    if (process.env.TRIPLETHINK_RATE_LIMIT === 'false') {
      return next();
    }

    const clientId = getClientId(req);
    const bucket = getBucket(category, clientId);

    // Try to consume a token
    if (bucket.consume(1)) {
      // Add rate limit headers
      const state = bucket.getState();
      res.set('X-RateLimit-Limit', state.capacity.toString());
      res.set('X-RateLimit-Remaining', state.tokens.toString());
      res.set('X-RateLimit-Category', category);
      return next();
    }

    // Rate limited
    const retryAfter = Math.ceil(bucket.timeUntilToken() / 1000);
    const state = bucket.getState();

    res.set('X-RateLimit-Limit', state.capacity.toString());
    res.set('X-RateLimit-Remaining', '0');
    res.set('X-RateLimit-Category', category);
    res.set('Retry-After', retryAfter.toString());

    return res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: `Rate limit exceeded for ${category} operations`,
        timestamp: new Date().toISOString(),
        details: {
          category,
          limit: state.capacity,
          retry_after_seconds: retryAfter
        },
        suggestion: `Wait ${retryAfter} seconds before retrying. Consider using batch operations for multiple queries.`
      }
    });
  };
}

/**
 * Standard rate limit middleware
 */
function standardRateLimit() {
  return rateLimitMiddleware('standard');
}

/**
 * Epistemic rate limit middleware (more restrictive)
 */
function epistemicRateLimit() {
  return rateLimitMiddleware('epistemic');
}

/**
 * Batch rate limit middleware (most restrictive)
 */
function batchRateLimit() {
  return rateLimitMiddleware('batch');
}

/**
 * Export rate limit middleware
 */
function exportRateLimit() {
  return rateLimitMiddleware('export');
}

/**
 * Search rate limit middleware
 */
function searchRateLimit() {
  return rateLimitMiddleware('search');
}

// ============================================================
// MANAGEMENT FUNCTIONS
// ============================================================

/**
 * Reset rate limits for a client
 */
function resetClientLimits(clientId) {
  for (const category of ['standard', 'epistemic', 'batch', 'export', 'search']) {
    limiters[category].delete(clientId);
  }
}

/**
 * Clear all rate limiters
 */
function clearAllLimiters() {
  for (const category of ['standard', 'epistemic', 'batch', 'export', 'search']) {
    limiters[category].clear();
  }
}

/**
 * Get rate limit statistics
 */
function getRateLimitStats() {
  const stats = {};

  for (const category of ['standard', 'epistemic', 'batch', 'export', 'search']) {
    const buckets = limiters[category];
    const config = limiters[`${category}Config`];

    stats[category] = {
      config,
      activeClients: buckets.size,
      clients: {}
    };

    for (const [clientId, bucket] of buckets.entries()) {
      stats[category].clients[clientId] = bucket.getState();
    }
  }

  return stats;
}

/**
 * Update rate limit configuration
 */
function updateRateLimitConfig(category, config) {
  const configKey = `${category}Config`;
  if (!limiters[configKey]) {
    throw new Error(`Unknown rate limit category: ${category}`);
  }

  limiters[configKey] = { ...limiters[configKey], ...config };

  // Clear existing buckets so new ones use new config
  limiters[category].clear();
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Middleware
  rateLimitMiddleware,
  standardRateLimit,
  epistemicRateLimit,
  batchRateLimit,
  exportRateLimit,
  searchRateLimit,

  // Management
  resetClientLimits,
  clearAllLimiters,
  getRateLimitStats,
  updateRateLimitConfig,

  // Classes for testing
  TokenBucket,
  getBucket,
  getClientId
};
