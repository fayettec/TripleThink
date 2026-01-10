/**
 * TripleThink Authentication Middleware
 * Simple API key authentication for local use
 */

const { ErrorCodes } = require('../error-handling');

// ============================================================
// CONFIGURATION
// ============================================================

/**
 * Auth configuration
 * For a single-user local system, auth is optional
 */
const config = {
  // Enable/disable authentication
  enabled: process.env.TRIPLETHINK_AUTH_ENABLED === 'true',

  // API key (from environment variable or default for development)
  apiKey: process.env.TRIPLETHINK_API_KEY || null,

  // Header name for API key
  headerName: 'X-API-Key',

  // Paths that don't require authentication
  publicPaths: [
    '/api/health',
    '/api/docs',
    '/api/openapi.yaml'
  ]
};

// ============================================================
// MIDDLEWARE
// ============================================================

/**
 * Authentication middleware
 * Checks for valid API key in header
 */
function authMiddleware(req, res, next) {
  // Skip if auth is disabled
  if (!config.enabled) {
    return next();
  }

  // Skip for public paths
  if (config.publicPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Check for API key
  const providedKey = req.get(config.headerName);

  if (!providedKey) {
    return res.status(401).json({
      error: {
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
        suggestion: `Provide API key in ${config.headerName} header`
      }
    });
  }

  // Validate API key
  if (providedKey !== config.apiKey) {
    return res.status(401).json({
      error: {
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Invalid API key',
        timestamp: new Date().toISOString(),
        suggestion: 'Check your API key configuration'
      }
    });
  }

  next();
}

/**
 * Optional auth middleware - allows unauthenticated requests
 * but attaches user info if authenticated
 */
function optionalAuthMiddleware(req, res, next) {
  if (!config.enabled) {
    req.authenticated = false;
    return next();
  }

  const providedKey = req.get(config.headerName);

  if (providedKey && providedKey === config.apiKey) {
    req.authenticated = true;
  } else {
    req.authenticated = false;
  }

  next();
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Check if authentication is enabled
 */
function isAuthEnabled() {
  return config.enabled;
}

/**
 * Generate a random API key
 */
function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'tt_';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

/**
 * Set API key programmatically
 */
function setApiKey(key) {
  config.apiKey = key;
  config.enabled = true;
}

/**
 * Disable authentication
 */
function disableAuth() {
  config.enabled = false;
}

/**
 * Enable authentication
 */
function enableAuth(apiKey = null) {
  if (apiKey) {
    config.apiKey = apiKey;
  } else if (!config.apiKey) {
    config.apiKey = generateApiKey();
    console.log(`Generated API key: ${config.apiKey}`);
  }
  config.enabled = true;
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  isAuthEnabled,
  generateApiKey,
  setApiKey,
  disableAuth,
  enableAuth,
  config
};
