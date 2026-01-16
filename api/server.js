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

// Register routes
app.use('/api/state', stateRoutes(db));
app.use('/api/epistemic', epistemicRoutes(db));
app.use('/api/moments', momentsRoutes(db));
app.use('/api/orchestrator', orchestratorRoutes(db));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`TripleThink API running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  db.close();
  process.exit(0);
});

module.exports = app;
