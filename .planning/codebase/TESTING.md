# Testing Patterns

**Analysis Date:** 2026-01-16

## Test Framework

**Runner:**
- Jest 29.6.0
- Config: Inline in `api/package.json` (lines 42-60)

**Assertion Library:**
- Node.js built-in `assert` module (used in `/app/tests/validator.test.js`)
- Jest assertions available but not primary pattern

**Run Commands:**
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

**Working Directory:**
- API tests run from `/app/api/` directory
- Project tests run from `/app/` root directory

## Test File Organization

**Location:**
- Co-located pattern: `/app/tests/` for project-level tests
- API integration tests: `/app/api/tests/integration-tests.js`
- TripleThink module tests: `/app/TripleThink/tests/unit/` and `/app/TripleThink/tests/integration/`

**Naming:**
- Pattern: `*.test.js` (e.g., `validator.test.js`, `phase5-api-integration.test.js`)
- Descriptive names matching module tested

**Structure:**
```
/app/tests/
├── validator.test.js              # 100+ validation rules
├── phase5-api-integration.test.js # API endpoint tests
├── hybrid-state-test.js           # State reconstruction
├── logic-layer-test.js            # Logic layer validation
└── benchmark.js                   # Performance tests
```

## Test Structure

**Suite Organization:**
```javascript
describe('TripleThink Validator v4.1', function() {
  this.timeout(30000);

  let db;
  let validator;

  before(function(done) {
    // Setup test database
  });

  after(function(done) {
    // Cleanup
  });

  describe('Referential Integrity (RI-1 through RI-10)', function() {
    it('RI-1: Should validate entity ID prefixes', function(done) {
      // Test implementation
      done();
    });
  });
});
```

**Patterns:**
- Nested `describe()` blocks for categories
- `before()`/`after()` for test database setup/teardown
- Callback-based tests with `done()` parameter
- Rule-based organization (e.g., "RI-1", "TC-2", "EC-3")

**Example Test:**
```javascript
it('Should validate entity ID prefixes', function(done) {
  db.run(
    `INSERT INTO entities (id, name, type, created_at) VALUES (?, ?, ?, ?)`,
    ['invalid-id', 'Test Entity', 'event', new Date().toISOString()],
    function(err) {
      assert.strictEqual(err, null);
      done();
    }
  );
});
```

## Mocking

**Framework:**
- No dedicated mocking library detected
- Manual mocks and stubs used
- Test database pattern (create, use, destroy)

**Patterns:**
- In-memory SQLite databases for isolation
- Real database with test fixtures preferred over mocks
- API tests use actual HTTP requests to localhost

**Test Database Pattern:**
```javascript
const testDbPath = path.join(__dirname, '../db/test-validator.db');

before(function(done) {
  // Clean up if exists
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  // Create fresh test database
  db = new sqlite3.Database(testDbPath, (err) => {
    if (err) done(err);
    else initializeTestSchema(db, done);
  });
});

after(function(done) {
  db.close(() => {
    fs.unlinkSync(testDbPath);
    done();
  });
});
```

**What to Mock:**
- Not applicable - real database used

**What NOT to Mock:**
- Database operations (use test database instead)
- Core validation logic
- SQLite queries

## Fixtures and Factories

**Test Data:**
```javascript
// Inline test data creation
const eventId = 'evt-temporal1';
db.run(
  `INSERT INTO entities (id, name, type, timestamp, created_at) VALUES (?, ?, ?, ?, ?)`,
  [eventId, 'Temporal Event', 'event', '2026-01-01T00:00:00Z', new Date().toISOString()],
  function(err) { /* ... */ }
);
```

**Patterns:**
- Test data created inline within test cases
- Descriptive IDs for test entities (e.g., `'evt-temporal1'`, `'char-epistemic1'`)
- Schema loaded from `../db/schema.sql` for database tests

**Location:**
- No dedicated fixtures directory
- Test data defined in test files
- Schema fixtures: `/app/db/schema.sql`

## Coverage

**Requirements:**
```json
{
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  }
}
```

**Collection:**
```json
{
  "collectCoverageFrom": [
    "**/*.js",
    "!**/tests/**",
    "!**/node_modules/**"
  ]
}
```

**View Coverage:**
```bash
npm run test:coverage
```

**Target:** 70% across all metrics (branches, functions, lines, statements)

## Test Types

**Unit Tests:**
- Scope: Individual validation rules
- Location: `/app/TripleThink/tests/unit/`
- Pattern: Test single functions or methods in isolation
- Example: Epistemic state reconstruction (`/app/TripleThink/tests/unit/db/epistemic.test.js`)

**Integration Tests:**
- Scope: API endpoints, database operations
- Location: `/app/tests/phase5-api-integration.test.js`, `/app/api/tests/integration-tests.js`
- Pattern: Full request/response cycle
- Example:
```javascript
await test('GET /api/projects returns array', async () => {
  const res = await makeRequest('GET', '/api/projects');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(Array.isArray(res.body.data), 'Response should have data array');
});
```

**E2E Tests:**
- Framework: Custom HTTP client in integration tests
- Pattern: Start server, make real HTTP requests, verify responses
- Example: `/app/tests/phase5-api-integration.test.js` (21 tests covering full API surface)

## Common Patterns

**Async Testing:**
```javascript
// Callback pattern
it('Should create entity', function(done) {
  db.run('INSERT ...', function(err) {
    assert.strictEqual(err, null);
    done();
  });
});

// Promise pattern
await test('Health endpoint returns 200 OK', async () => {
  const res = await makeRequest('GET', '/api/health');
  assert(res.status === 200);
});
```

**Error Testing:**
```javascript
it('Should detect critical severity errors', function(done) {
  const error = {
    rule: 'RI-1',
    severity: 'critical',
    entity: 'evt-test',
    message: 'Invalid ID prefix'
  };

  assert.strictEqual(error.severity, 'critical');
  done();
});
```

**Validation Testing:**
```javascript
describe('Validation Report Generation', function() {
  it('Should generate a comprehensive validation report', function(done) {
    validator = new TripleThinkValidator(testDbPath);
    const validationFn = validator.run(db);

    validationFn().then((report) => {
      assert.ok(report);
      assert.ok(report.summary);
      assert.ok(report.stats);
      assert.ok(report.summary.rulesChecked > 0);
      done();
    }).catch(done);
  });
});
```

**HTTP Request Helper:**
```javascript
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: JSON.parse(data)
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}
```

## Test Organization by Category

**Validator Tests (`/app/tests/validator.test.js`):**
- 8 validation categories with 100+ total rules:
  - Referential Integrity (RI-1 to RI-10): 10 rules
  - Temporal Consistency (TC-1 to TC-12): 12 rules
  - Epistemic Consistency (EC-1 to EC-7): 7 rules
  - Fiction System (FS-1 to FS-7): 7 rules
  - Narrative Consistency (NC-1 to NC-8): 8 rules
  - Logic Layer (LL-1 to LL-15): 15 rules
  - State Integrity (SI-1 to SI-10): 10 rules
  - Cross-Entity (XE-1 to XE-10): 10 rules

**API Integration Tests (`/app/tests/phase5-api-integration.test.js`):**
- 21 endpoint tests covering:
  - Health check
  - Projects CRUD
  - Fictions CRUD
  - Entities CRUD
  - Metadata operations
  - Epistemic queries
  - Temporal queries
  - Search
  - Validation
  - Export
  - Logic layer

**Performance Tests (`/app/tests/benchmark.js`):**
- Performance targets:
  - State reconstruction: <100ms
  - Epistemic queries: <100ms
  - Orchestrator operations: <1s
  - Full validation: <30s

## Test Utilities

**Custom Test Runner:**
```javascript
function test(name, fn) {
  return fn()
    .then(() => {
      TEST_RESULTS.passed++;
      console.log(`✓ ${name}`);
    })
    .catch(err => {
      TEST_RESULTS.failed++;
      console.log(`✗ ${name}: ${err.message}`);
    });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}
```

**Test Result Tracking:**
```javascript
const TEST_RESULTS = {
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
};
```

## Running Tests

**Prerequisites:**
- Server must be running on port 3001 for integration tests
- Test database automatically created/destroyed

**Test Execution:**
```bash
# Unit tests (validator)
cd /app
npm test

# API integration tests
node /app/tests/phase5-api-integration.test.js

# With Jest runner
cd /app/api
npm test
```

**CI/CD:**
- No CI configuration detected
- Tests run locally via npm scripts
- Sequential execution required (runInBand) to avoid database conflicts

## Coverage Gaps

**Known Limitations:**
- GUI code not covered by automated tests
- Some validation rules have placeholder implementations (`assert.ok(true)`)
- No visual regression testing for GUI components
- Limited negative test cases (primarily happy path testing)
- Mock data used instead of production-like scenarios in some tests

---

*Testing analysis: 2026-01-16*
