// Projects API Routes
// Project CRUD operations
// TODO: Implement full functionality in future phases

const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // GET /api/projects - Placeholder endpoint
  router.get('/', (req, res) => {
    res.json({
      message: 'Projects endpoint - implementation pending',
      status: 'stub',
      availableIn: 'future phase'
    });
  });

  return router;
};
