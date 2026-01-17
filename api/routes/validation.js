// Validation API Routes
// Consistency validation for entities, timelines, epistemic states
// Provides comprehensive database validation with 106 rules across 8 categories

const express = require('express');
const TripleThinkValidator = require('../services/validator');

module.exports = (db) => {
  const router = express.Router();

  // GET /api/validation - Run full validation and return comprehensive report
  router.get('/', async (req, res) => {
    try {
      const validator = new TripleThinkValidator(db);
      const report = await validator.validateDatabase();
      res.json(report);
    } catch (error) {
      res.status(500).json({
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // GET /api/validation/summary - Return summary stats only
  router.get('/summary', async (req, res) => {
    try {
      const validator = new TripleThinkValidator(db);
      const report = await validator.validateDatabase();

      res.json({
        timestamp: report.timestamp,
        summary: report.summary,
        critical_count: report.critical.length,
        error_count: report.errors.length,
        warning_count: report.warnings.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/validation/errors - Return only errors
  router.get('/errors', async (req, res) => {
    try {
      const validator = new TripleThinkValidator(db);
      const report = await validator.validateDatabase();

      res.json({
        timestamp: report.timestamp,
        critical: report.critical,
        errors: report.errors,
        total: report.critical.length + report.errors.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/validation/warnings - Return only warnings
  router.get('/warnings', async (req, res) => {
    try {
      const validator = new TripleThinkValidator(db);
      const report = await validator.validateDatabase();

      res.json({
        timestamp: report.timestamp,
        warnings: report.warnings,
        total: report.warnings.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/validation/category/:category - Return results for specific category
  router.get('/category/:category', async (req, res) => {
    try {
      const { category } = req.params;

      const validator = new TripleThinkValidator(db);
      const validCategories = Object.keys(validator.rules);

      if (!validCategories.includes(category)) {
        return res.status(400).json({
          error: 'Invalid category',
          validCategories
        });
      }

      const report = await validator.validateDatabase();

      res.json({
        timestamp: report.timestamp,
        category: category,
        results: report.categories[category]
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/validation/categories - List all validation categories
  router.get('/categories', (req, res) => {
    try {
      const validator = new TripleThinkValidator(db);
      const categories = Object.keys(validator.rules).map(key => {
        const rules = validator.rules[key];
        return {
          key: key,
          name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          rule_count: rules.length,
          rules: rules.map(r => ({
            id: r.id,
            name: r.name,
            severity: r.severity
          }))
        };
      });

      res.json({
        total_categories: categories.length,
        total_rules: categories.reduce((sum, cat) => sum + cat.rule_count, 0),
        categories
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/validation/health - Quick health check (run critical rules only)
  router.get('/health', async (req, res) => {
    try {
      const validator = new TripleThinkValidator(db);
      const report = await validator.validateDatabase();

      // Filter for critical and error severity issues
      const criticalIssues = report.critical || [];
      const errorIssues = report.errors || [];

      const health = {
        timestamp: report.timestamp,
        status: criticalIssues.length === 0 && errorIssues.length === 0 ? 'healthy' :
                criticalIssues.length > 0 ? 'critical' : 'degraded',
        critical_issues: criticalIssues.length,
        error_issues: errorIssues.length,
        warning_issues: report.warnings.length,
        issues: [...criticalIssues, ...errorIssues].slice(0, 10) // First 10 issues
      };

      res.json(health);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/validation/run - Trigger validation and return job status
  // Note: For now this is synchronous, but structured for future async job support
  router.post('/run', async (req, res) => {
    try {
      const startTime = Date.now();
      const validator = new TripleThinkValidator(db);
      const report = await validator.validateDatabase();
      const duration = Date.now() - startTime;

      res.json({
        job_id: `val-${Date.now()}`,
        status: 'complete',
        started_at: new Date(startTime).toISOString(),
        completed_at: report.timestamp,
        duration_ms: duration,
        summary: report.summary,
        critical_count: report.critical.length,
        error_count: report.errors.length,
        warning_count: report.warnings.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
