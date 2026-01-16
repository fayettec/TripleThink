// Express API Server
// REST API for TripleThink v4.1

const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const dbPath = path.join(__dirname, '../db/triplethink.db');
let db;

try {
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
} catch (err) {
  console.error('Failed to open database:', err.message);
  process.exit(1);
}

// Middleware
app.use(express.json());

// Import routes
const stateRoutes = require('./routes/state');
const epistemicRoutes = require('./routes/epistemic');
const momentsRoutes = require('./routes/moments');
const orchestratorRoutes = require('./routes/orchestrator');
const logicLayerRoutes = require('./routes/logic-layer');
const validationRoutes = require('./routes/validation');
const projectsRoutes = require('./routes/projects');
const fictionsRoutes = require('./routes/fictions');
const entitiesRoutes = require('./routes/entities');
const temporalRoutes = require('./routes/temporal');
const searchRoutes = require('./routes/search');
const exportRoutes = require('./routes/export');

// ============================================================
// Core Data Routes
// ============================================================
app.use('/api/entities', entitiesRoutes(db));
app.use('/api/projects', projectsRoutes(db));
app.use('/api/fictions', fictionsRoutes(db));

// ============================================================
// Temporal & State Routes
// ============================================================
app.use('/api/temporal', temporalRoutes(db));
app.use('/api/state', stateRoutes(db));
app.use('/api/epistemic', epistemicRoutes(db));

// ============================================================
// Logic Layer Routes
// ============================================================
app.use('/api/moments', momentsRoutes(db));
app.use('/api/orchestrator', orchestratorRoutes(db));
app.use('/api/logic', logicLayerRoutes(db));

// ============================================================
// Utility Routes
// ============================================================
app.use('/api/validation', validationRoutes(db));
app.use('/api/search', searchRoutes(db));
app.use('/api/export', exportRoutes(db));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Start server only if run directly (not imported by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`TripleThink API running on port ${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    db.close();
    process.exit(0);
  });
}

module.exports = app;
