/**
 * TripleThink API Server
 * Express-based REST API for the TripleThink narrative construction system
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Database
const TripleThinkDB = require('../db/api-functions');

// Error handling
const {
  errorHandler,
  notFoundHandler
} = require('./error-handling');

// Middleware
const { authMiddleware, isAuthEnabled } = require('./middleware/auth');
const { getCacheStats, clearAllCaches } = require('./middleware/cache');
const { getRateLimitStats, clearAllLimiters } = require('./middleware/rate-limit');

// Routes
const projectsRouter = require('./routes/projects');
const fictionsRouter = require('./routes/fictions');
const entitiesRouter = require('./routes/entities');
const metadataRouter = require('./routes/metadata');
const epistemicRouter = require('./routes/epistemic');
const temporalRouter = require('./routes/temporal');
const narrativeRouter = require('./routes/narrative');
const validationRouter = require('./routes/validation');
const exportImportRouter = require('./routes/export-import');
const searchRouter = require('./routes/search');
const aiRouter = require('./routes/ai');

// ============================================================
// SERVER CONFIGURATION
// ============================================================

const DEFAULT_CONFIG = {
  port: process.env.PORT || 3000,
  dbPath: process.env.DB_PATH || './triplethink.db',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
  },
  logRequests: process.env.LOG_REQUESTS !== 'false',
  prettyJson: process.env.NODE_ENV !== 'production'
};

// ============================================================
// CREATE SERVER
// ============================================================

function createServer(config = {}) {
  const options = { ...DEFAULT_CONFIG, ...config };
  const app = express();

  // ==========================================
  // MIDDLEWARE - Order matters!
  // ==========================================

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"]
      }
    }
  }));

  // CORS
  app.use(cors(options.cors));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Pretty JSON in development
  if (options.prettyJson) {
    app.set('json spaces', 2);
  }

  // Request logging
  if (options.logRequests) {
    app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(
          `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
        );
      });
      next();
    });
  }

  // Authentication
  app.use(authMiddleware);

  // ==========================================
  // STATIC FILE SERVING (GUI)
  // ==========================================

  // Serve GUI static files
  const guiPath = path.join(__dirname, '..', 'gui');
  app.use(express.static(guiPath));

  // Redirect root to GUI
  app.get('/', (req, res) => {
    res.sendFile(path.join(guiPath, 'index.html'));
  });

  // ==========================================
  // DATABASE CONNECTION
  // ==========================================

  let db;
  try {
    db = new TripleThinkDB(options.dbPath);
    app.set('db', db);
    console.log(`Database connected: ${options.dbPath}`);
  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    console.log('Server will start without database. Some endpoints may not work.');
  }

  // ==========================================
  // HEALTH & STATUS ENDPOINTS
  // ==========================================

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: db ? 'connected' : 'disconnected'
    });
  });

  app.get('/api/status', (req, res) => {
    // Get entity counts
    let stats = { events: 0, characters: 0, fictions: 0, locations: 0, objects: 0, systems: 0 };
    if (db) {
      try {
        const countStmt = db.db.prepare(`
          SELECT entity_type, COUNT(*) as count
          FROM entities
          GROUP BY entity_type
        `);
        const counts = countStmt.all();
        counts.forEach(row => {
          stats[row.entity_type + 's'] = row.count;
        });

        // Get fiction count from fictions table
        const fictionStmt = db.db.prepare('SELECT COUNT(*) as count FROM fictions');
        const fictionCount = fictionStmt.get();
        stats.fictions = fictionCount.count;
      } catch (err) {
        console.error('Error getting stats:', err);
      }
    }

    res.json({
      version: '1.0.0',
      name: 'TripleThink API',
      description: 'Event-sourced narrative construction system',
      auth_enabled: isAuthEnabled(),
      database: {
        connected: !!db,
        path: options.dbPath
      },
      stats: stats,
      cache: getCacheStats(),
      rate_limits: getRateLimitStats()
    });
  });

  // Admin endpoint to clear caches
  app.post('/api/admin/clear-cache', (req, res) => {
    clearAllCaches();
    res.json({ success: true, message: 'All caches cleared' });
  });

  // Admin endpoint to reset rate limits
  app.post('/api/admin/reset-rate-limits', (req, res) => {
    clearAllLimiters();
    res.json({ success: true, message: 'All rate limiters reset' });
  });

  // ==========================================
  // API ROUTES
  // ==========================================

  // Project (Series) CRUD
  app.use('/api/projects', projectsRouter);

  // Fictions CRUD
  app.use('/api/fictions', fictionsRouter);

  // Entity CRUD
  app.use('/api/entities', entitiesRouter);

  // Metadata CRUD
  app.use('/api/metadata', metadataRouter);

  // Epistemic queries (Power Feature)
  app.use('/api/epistemic', epistemicRouter);

  // Temporal queries
  app.use('/api/temporal', temporalRouter);

  // Narrative structure
  app.use('/api/narrative', narrativeRouter);

  // Validation
  app.use('/api/validate', validationRouter);

  // Export/Import
  app.use('/api/export', exportImportRouter);
  app.use('/api/import', exportImportRouter);

  // Search
  app.use('/api/search', searchRouter);

  // AI-optimized endpoints
  app.use('/api/ai', aiRouter);

  // Serve OpenAPI spec
  app.get('/api/openapi.yaml', (req, res) => {
    const specPath = path.join(__dirname, 'api-spec.yaml');
    res.sendFile(specPath);
  });

  // API documentation redirect
  app.get('/api/docs', (req, res) => {
    res.redirect('/api/openapi.yaml');
  });

  // ==========================================
  // ERROR HANDLING
  // ==========================================

  // Handle 404 for API routes
  app.use('/api/*', notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  // ==========================================
  // GRACEFUL SHUTDOWN
  // ==========================================

  function shutdown() {
    console.log('\nShutting down server...');

    if (db) {
      console.log('Closing database connection...');
      db.close();
    }

    process.exit(0);
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return app;
}

// ============================================================
// START SERVER
// ============================================================

function startServer(config = {}) {
  const app = createServer(config);
  const port = config.port || DEFAULT_CONFIG.port;

  const server = app.listen(port, '0.0.0.0', () => {
    console.log('');
    console.log('='.repeat(50));
    console.log('  TripleThink API Server');
    console.log('='.repeat(50));
    console.log(`  Port:     ${port}`);
    console.log(`  Database: ${config.dbPath || DEFAULT_CONFIG.dbPath}`);
    console.log(`  Auth:     ${isAuthEnabled() ? 'Enabled' : 'Disabled'}`);
    console.log('='.repeat(50));
    console.log('');
    console.log('GUI:');
    console.log(`  \x1b[32m\x1b[1m→ Open in browser: http://localhost:${port}/\x1b[0m`);
    console.log('');
    console.log('API Endpoints:');
    console.log(`  Health:    http://localhost:${port}/api/health`);
    console.log(`  Status:    http://localhost:${port}/api/status`);
    console.log(`  Docs:      http://localhost:${port}/api/docs`);
    console.log('');
    console.log('Routes:');
    console.log(`  /api/entities     - Entity CRUD operations`);
    console.log(`  /api/metadata     - Metadata operations`);
    console.log(`  /api/epistemic    - Knowledge state queries`);
    console.log(`  /api/temporal     - Time-travel queries`);
    console.log(`  /api/narrative    - Narrative structure`);
    console.log(`  /api/validate     - Consistency validation`);
    console.log(`  /api/export       - Data export`);
    console.log(`  /api/import       - Data import`);
    console.log(`  /api/search       - Search & discovery`);
    console.log(`  /api/ai           - AI-optimized queries`);
    console.log('');
  });

  return server;
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createServer,
  startServer,
  DEFAULT_CONFIG
};

// ============================================================
// RUN DIRECTLY
// ============================================================

if (require.main === module) {
  startServer();
}
