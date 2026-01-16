# Coding Conventions

**Analysis Date:** 2026-01-16

## Naming Patterns

**Files:**
- Routes: kebab-case (e.g., `export-import.js`, `logic-layer.js`, `validation.js`)
- Services: kebab-case (e.g., `validator.js`, `migrator.js`)
- Database: kebab-case (e.g., `api-functions.js`)
- GUI components: kebab-case (e.g., `entity-editor.js`, `timeline-view.js`)
- Test files: kebab-case with `.test.js` suffix (e.g., `validator.test.js`, `phase5-api-integration.test.js`)

**Functions:**
- camelCase for functions (e.g., `createEntity()`, `getCharacterKnowledge()`, `validateRequired()`)
- async functions clearly marked with `async` keyword
- Validation helpers prefixed with `validate` (e.g., `validateRequired()`, `validateTimestamp()`)

**Variables:**
- camelCase for local variables (e.g., `entityId`, `validationFn`, `startTime`)
- SCREAMING_SNAKE_CASE for constants (e.g., `API_BASE`, `DEFAULT_CONFIG`, `ERROR_CODES`)
- Destructuring used for req params: `const { id } = req.params`

**Classes:**
- PascalCase for classes (e.g., `TripleThinkValidator`, `ValidationError`, `APIClient`)
- Class properties in camelCase (e.g., `this.dbPath`, `this.errors`)

**Database Columns:**
- snake_case for all database columns (e.g., `entity_id`, `created_at`, `target_audience`)

## Code Style

**Formatting:**
- No dedicated formatter detected (no .prettierrc found)
- Indentation: 2 spaces (consistent across all files)
- String literals: Single quotes for JavaScript ('string')
- Template literals: Backticks for SQL queries and multi-line strings
- Line length: Generally kept under 100-120 characters

**Linting:**
- ESLint configured in `api/package.json`
- Run with: `npm run lint`
- No project-root .eslintrc detected (using default or inline config)

**Semicolons:**
- Used consistently at end of statements

**Braces:**
- K&R style (opening brace on same line)
- Always use braces, even for single-line if statements

**Comments:**
- JSDoc-style header comments for files and classes
- Section dividers with `// ============================================================`
- Inline comments for complex logic
- Route handlers have JSDoc-style comments explaining endpoint purpose

## Import Organization

**Order:**
1. Node.js built-ins (e.g., `const express = require('express')`)
2. Third-party modules (e.g., `const cors = require('cors')`, `const helmet = require('helmet')`)
3. Local modules grouped by type:
   - Database/core utilities first
   - Error handling
   - Middleware
   - Routes

**Pattern:**
```javascript
const express = require('express');
const cors = require('cors');

const TripleThinkDB = require('../db/api-functions');
const { errorHandler } = require('./error-handling');
const { authMiddleware } = require('./middleware/auth');
```

**Path Aliases:**
- Relative paths used throughout (e.g., `../db/api-functions`, `./routes/validation`)
- No path alias configuration detected

## Error Handling

**Patterns:**
- Custom error classes extending `TripleThinkError` (in `api/error-handling.js`)
- Async route handlers wrapped with `asyncHandler()` middleware
- Errors thrown, not returned
- All API responses include standardized error format:
```javascript
{
  error: {
    code: 'ERROR_CODE',
    message: 'Human readable message',
    timestamp: '2026-01-16T...',
    details: { /* optional */ },
    suggestion: 'How to fix'
  }
}
```

**Error Classes Used:**
- `ValidationError` - Invalid input (400)
- `NotFoundError` - Resource not found (404)
- `EpistemicViolationError` - Knowledge state conflicts (422)
- `TemporalInconsistencyError` - Timeline conflicts (422)
- `ConstraintViolationError` - Business rule violations (422)
- `DatabaseError` - DB operation failures (500)

**Validation Pattern:**
```javascript
// At route entry point
validateRequired(req.body, ['entity_id', 'timestamp']);
validateTimestamp(timestamp, 'timestamp');

// Throw errors immediately
if (!entity) {
  throw new NotFoundError('Entity', id);
}
```

## Logging

**Framework:** console (no dedicated logging library)

**Patterns:**
- Request logging in middleware: `[timestamp] METHOD /path STATUS duration`
- Error logging: `console.error('[ERROR]', JSON.stringify(logEntry))`
- Info logging: `console.log()` for startup messages and validation progress
- No log levels or structured logging framework detected

**Example:**
```javascript
console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
```

## Comments

**When to Comment:**
- File headers explaining module purpose
- Section dividers for logical code blocks
- Complex business logic (e.g., validation rules, epistemic state calculations)
- API endpoint documentation
- TODO/FIXME for known issues (seen in route files)

**JSDoc/TSDoc:**
- Used for class constructors and public methods
- Not consistently applied to all functions
- Route handlers have summary comments:
```javascript
/**
 * GET /api/projects/:id
 * Get single project by ID
 */
```

**Header Format:**
```javascript
/**
 * TripleThink Validation Routes
 * Consistency validation for entities, timelines, and epistemic states
 * Enhanced with 100+ validation rules in v4.1
 */
```

## Function Design

**Size:**
- Route handlers: 20-50 lines typical
- Validation functions: 10-30 lines per rule
- Helper functions: 5-20 lines
- Large functions broken into subfunctions (e.g., validation categories)

**Parameters:**
- Destructuring used for objects: `function validate({ entity_id, timestamp })`
- Default parameters for optional args: `function request(endpoint, options = {})`
- Options object pattern for multiple optional params

**Return Values:**
- API routes return promises (async/await)
- Explicit return of JSON via `res.json()`
- Validation helpers throw errors instead of returning error objects
- Database queries return arrays or single objects

**Async Pattern:**
```javascript
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const entity = await db.getEntity(id);
  res.json({ data: entity });
}));
```

## Module Design

**Exports:**
- CommonJS `module.exports` used throughout
- Export objects for multiple exports:
```javascript
module.exports = {
  errorHandler,
  asyncHandler,
  ValidationError,
  NotFoundError
};
```
- Single default export for routers: `module.exports = router`

**Barrel Files:**
- Not used (no index.js re-exports detected)
- Each module imported directly by path

## Database Interaction

**Pattern:**
- Direct SQLite prepared statements
- Database wrapper class: `TripleThinkDB` in `/app/db/api-functions.js`
- Access via: `const db = req.app.get('db')`
- Prepared statements for all queries:
```javascript
const stmt = db.db.prepare('SELECT * FROM entities WHERE id = ?');
const entity = stmt.get(id);
```

**Query Style:**
- Multi-line template literals for complex queries
- Parameterized queries (never string interpolation)
- snake_case for all column names

## API Response Format

**Success:**
```javascript
res.json({ data: result });
```

**Created:**
```javascript
res.status(201).json({ data: newEntity });
```

**Error:**
```javascript
res.status(statusCode).json({
  error: {
    code: 'ERROR_CODE',
    message: 'Description',
    timestamp: ISO8601,
    details: { /* optional */ },
    suggestion: 'How to fix'
  }
});
```

## Frontend Conventions

**Framework:**
- Vanilla JavaScript (no framework)
- Component pattern with functions (no classes)
- Global `state` object for app state
- Global `api` client instance

**Naming:**
- Component functions: camelCase (e.g., `showEntityEditor()`, `renderEventForm()`)
- Event handlers: `on` prefix (e.g., `onClick`, `onSubmit`)
- DOM elements: camelCase (e.g., `entityModal`, `tabButton`)

**Structure:**
- Components in `/app/gui/js/components/`
- Screens in `/app/gui/js/screens/`
- Utilities in `/app/gui/js/utils/`
- Single `app.js` entry point

---

*Convention analysis: 2026-01-16*
