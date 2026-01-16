// Entities API Routes
// Entity CRUD operations (characters, objects, locations, systems)
// TODO: Implement full functionality in future phases

const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // GET /api/entities - Placeholder endpoint
  router.get('/', (req, res) => {
    res.json({
      message: 'Entities endpoint - implementation pending',
      status: 'stub',
      availableIn: 'future phase'
    });
  });

  return router;
};
