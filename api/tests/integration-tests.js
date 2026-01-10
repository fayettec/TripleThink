/**
 * TripleThink API Integration Tests
 * Comprehensive test suite for all API endpoints
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs');
const { createServer } = require('../server');

// Test database path
const TEST_DB_PATH = path.join(__dirname, 'test-triplethink.db');

// Test server instance
let app;

// ============================================================
// TEST SETUP AND TEARDOWN
// ============================================================

beforeAll(async () => {
  // Remove existing test database
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  // Create test server
  app = createServer({
    dbPath: TEST_DB_PATH,
    logRequests: false
  });

  // Initialize database with schema
  const db = app.get('db');

  // Create test data
  await setupTestData(db);
});

afterAll(async () => {
  // Close database
  const db = app.get('db');
  if (db) {
    db.close();
  }

  // Remove test database
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
});

// ============================================================
// TEST DATA SETUP
// ============================================================

async function setupTestData(db) {
  // Create test character: Eric
  db.createEntity('character', {
    id: 'char-eric',
    name: 'Eric',
    summary: 'Test protagonist',
    data: {
      identity: { full_name: 'Eric Chen', age: 34 }
    }
  });

  // Create test character: Stella
  db.createEntity('character', {
    id: 'char-stella',
    name: 'Stella',
    summary: 'Test commander',
    data: {
      identity: { full_name: 'Commander Stella Rodriguez', age: 42 }
    }
  });

  // Create test event
  db.createEvent({
    id: 'evt-test-event',
    name: 'Test Event',
    timestamp: '2033-06-15T14:00:00Z',
    summary: 'A test event',
    phases: [
      {
        phase_id: 'phase-test-1',
        timestamp: '2033-06-15T14:00:00Z',
        summary: 'Test phase',
        participants: ['char-eric', 'char-stella'],
        facts_created: [
          {
            fact_id: 'fact-test-1',
            content: 'Test fact 1',
            visibility: 'ground_truth',
            confidence: 'absolute'
          }
        ]
      }
    ]
  });

  // Create knowledge state for Eric
  db.createKnowledgeState('char-eric', '2033-06-15T14:00:00Z', 'evt-test-event', [
    {
      fact_id: 'fact-test-1',
      belief: 'true',
      confidence: 'absolute',
      source: 'direct_experience'
    }
  ]);

  // Create test fiction
  db.createFiction({
    id: 'fiction-test',
    name: 'Test Fiction',
    core_narrative: 'A test false narrative',
    target_audience: ['char-eric'],
    created_by: ['char-stella'],
    facts_contradicted: [
      {
        ground_truth_fact_id: 'fact-test-1',
        fictional_alternative: 'Alternative fact'
      }
    ],
    active_start: '2033-07-01T00:00:00Z',
    status: 'active'
  });

  // Create test metadata
  db.saveMetadata({
    id: 'meta-char-eric',
    entity_id: 'char-eric',
    entity_type: 'character',
    author_notes: {
      creative_intent: 'Test character for unit tests'
    },
    ai_guidance: {
      tone: 'analytical'
    },
    version_info: {
      created: '2026-01-09T00:00:00Z',
      modified: '2026-01-09T00:00:00Z'
    },
    prose_guidance: {
      voice: 'close third person'
    }
  });

  // Link metadata to character
  db.updateEntity('char-eric', { meta_id: 'meta-char-eric', read_metadata_mandatory: 1 });
}

// ============================================================
// HEALTH TESTS
// ============================================================

describe('Health Endpoints', () => {
  test('GET /api/health returns ok status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.database).toBe('connected');
  });

  test('GET /api/status returns server info', async () => {
    const response = await request(app).get('/api/status');

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('TripleThink API');
    expect(response.body.version).toBe('1.0.0');
  });
});

// ============================================================
// ENTITY TESTS
// ============================================================

describe('Entity Endpoints', () => {
  test('GET /api/entities lists entities', async () => {
    const response = await request(app).get('/api/entities');

    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.pagination).toBeDefined();
  });

  test('GET /api/entities with type filter', async () => {
    const response = await request(app)
      .get('/api/entities')
      .query({ type: 'character' });

    expect(response.status).toBe(200);
    expect(response.body.data.every(e => e.entity_type === 'character')).toBe(true);
  });

  test('GET /api/entities/:id returns entity', async () => {
    const response = await request(app).get('/api/entities/char-eric');

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe('char-eric');
    expect(response.body.data.name).toBe('Eric');
  });

  test('GET /api/entities/:id with include_metadata=always', async () => {
    const response = await request(app)
      .get('/api/entities/char-eric')
      .query({ include_metadata: 'always' });

    expect(response.status).toBe(200);
    expect(response.body.data.metadata).toBeDefined();
    expect(response.body.data.metadata.author_notes).toBeDefined();
  });

  test('GET /api/entities/:id returns 404 for non-existent', async () => {
    const response = await request(app).get('/api/entities/non-existent');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  test('POST /api/entities creates entity', async () => {
    const response = await request(app)
      .post('/api/entities')
      .send({
        type: 'character',
        data: {
          id: 'char-test-new',
          name: 'New Test Character',
          summary: 'Created in test'
        }
      });

    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe('char-test-new');
  });

  test('POST /api/entities validates required fields', async () => {
    const response = await request(app)
      .post('/api/entities')
      .send({
        type: 'character',
        data: { id: 'char-missing-name' }
        // Missing 'name' field
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('PUT /api/entities/:id updates entity', async () => {
    const response = await request(app)
      .put('/api/entities/char-test-new')
      .send({
        data: {
          summary: 'Updated summary'
        }
      });

    expect(response.status).toBe(200);
  });

  test('DELETE /api/entities/:id deletes entity', async () => {
    const response = await request(app)
      .delete('/api/entities/char-test-new');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

// ============================================================
// EPISTEMIC TESTS (POWER FEATURE)
// ============================================================

describe('Epistemic Endpoints', () => {
  test('GET /api/epistemic/character/:id/knowledge returns knowledge state', async () => {
    const response = await request(app)
      .get('/api/epistemic/character/char-eric/knowledge')
      .query({ at_timestamp: '2033-06-15T14:30:00Z' });

    expect(response.status).toBe(200);
    expect(response.body.data.character_id).toBe('char-eric');
  });

  test('GET /api/epistemic/character/:id/knowledge with minimal format', async () => {
    const response = await request(app)
      .get('/api/epistemic/character/char-eric/knowledge')
      .query({
        at_timestamp: '2033-06-15T14:30:00Z',
        format: 'minimal'
      });

    expect(response.status).toBe(200);
    expect(response.body.data.believes).toBeInstanceOf(Array);
  });

  test('GET /api/epistemic/fact/:id/believers returns believers', async () => {
    const response = await request(app)
      .get('/api/epistemic/fact/fact-test-1/believers')
      .query({ at_timestamp: '2033-06-15T14:30:00Z' });

    expect(response.status).toBe(200);
    expect(response.body.data.fact_id).toBe('fact-test-1');
    expect(response.body.data.believers).toBeInstanceOf(Array);
  });

  test('GET /api/epistemic/fiction/:id/audience returns audience beliefs', async () => {
    const response = await request(app)
      .get('/api/epistemic/fiction/fiction-test/audience')
      .query({ at_timestamp: '2033-07-15T00:00:00Z' });

    expect(response.status).toBe(200);
    expect(response.body.data.fiction_id).toBe('fiction-test');
    expect(response.body.data.target_audience).toContain('char-eric');
  });

  test('POST /api/epistemic/validate-scene validates scene', async () => {
    const response = await request(app)
      .post('/api/epistemic/validate-scene')
      .send({
        character_pov: 'char-eric',
        timestamp: '2033-06-15T14:30:00Z',
        proposed_facts: [
          {
            fact_id: 'fact-test-1',
            is_revealed: true,
            character_knows: true
          }
        ]
      });

    expect(response.status).toBe(200);
    expect(response.body.data.valid).toBeDefined();
    expect(response.body.data.violations).toBeInstanceOf(Array);
  });

  test('GET /api/epistemic/character/:charId/believes/:factId checks belief', async () => {
    const response = await request(app)
      .get('/api/epistemic/character/char-eric/believes/fact-test-1')
      .query({ at_timestamp: '2033-06-15T14:30:00Z' });

    expect(response.status).toBe(200);
    expect(response.body.data.known).toBe(true);
    expect(response.body.data.believes).toBe(true);
  });

  test('GET /api/epistemic/divergences finds false beliefs', async () => {
    const response = await request(app)
      .get('/api/epistemic/divergences')
      .query({ at_timestamp: '2033-07-15T00:00:00Z' });

    expect(response.status).toBe(200);
    expect(response.body.data.divergences).toBeInstanceOf(Array);
  });
});

// ============================================================
// TEMPORAL TESTS
// ============================================================

describe('Temporal Endpoints', () => {
  test('GET /api/temporal/events returns events in range', async () => {
    const response = await request(app)
      .get('/api/temporal/events')
      .query({
        from: '2033-01-01T00:00:00Z',
        to: '2033-12-31T23:59:59Z'
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
  });

  test('GET /api/temporal/entity/:id/at/:timestamp returns state', async () => {
    const response = await request(app)
      .get('/api/temporal/entity/char-eric/at/2033-06-15T14:30:00Z');

    expect(response.status).toBe(200);
    expect(response.body.data.entity_id).toBe('char-eric');
  });

  test('GET /api/temporal/causal-chain/:eventId returns causal links', async () => {
    const response = await request(app)
      .get('/api/temporal/causal-chain/evt-test-event')
      .query({ depth: 2 });

    expect(response.status).toBe(200);
    expect(response.body.data.event_id).toBe('evt-test-event');
    expect(response.body.data.causes).toBeInstanceOf(Array);
    expect(response.body.data.effects).toBeInstanceOf(Array);
  });

  test('POST /api/temporal/validate-causality validates causal link', async () => {
    // First create another event
    const db = app.get('db');
    db.createEvent({
      id: 'evt-effect',
      name: 'Effect Event',
      timestamp: '2033-06-16T00:00:00Z',
      summary: 'An effect event',
      phases: [{
        phase_id: 'phase-effect',
        timestamp: '2033-06-16T00:00:00Z',
        summary: 'Effect phase',
        participants: []
      }]
    });

    const response = await request(app)
      .post('/api/temporal/validate-causality')
      .send({
        cause_event_id: 'evt-test-event',
        effect_event_id: 'evt-effect'
      });

    expect(response.status).toBe(200);
    expect(response.body.data.valid).toBe(true);
  });
});

// ============================================================
// METADATA TESTS
// ============================================================

describe('Metadata Endpoints', () => {
  test('GET /api/metadata lists metadata', async () => {
    const response = await request(app).get('/api/metadata');

    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
  });

  test('GET /api/metadata/:id returns metadata', async () => {
    const response = await request(app).get('/api/metadata/meta-char-eric');

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe('meta-char-eric');
    expect(response.body.data.author_notes).toBeDefined();
  });

  test('POST /api/metadata creates metadata', async () => {
    const response = await request(app)
      .post('/api/metadata')
      .send({
        id: 'meta-char-stella',
        entity_id: 'char-stella',
        entity_type: 'character',
        author_notes: { creative_intent: 'Test metadata' },
        version_info: {
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        }
      });

    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe('meta-char-stella');
  });

  test('PATCH /api/metadata/:id/author-notes updates author notes', async () => {
    const response = await request(app)
      .patch('/api/metadata/meta-char-eric/author-notes')
      .send({
        author_notes: {
          themes: ['test', 'integration']
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.data.author_notes.themes).toContain('test');
  });
});

// ============================================================
// VALIDATION TESTS
// ============================================================

describe('Validation Endpoints', () => {
  test('POST /api/validate/consistency validates entity changes', async () => {
    const response = await request(app)
      .post('/api/validate/consistency')
      .send({
        entity_id: 'char-eric',
        proposed_changes: {
          name: 'Eric Updated'
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.data.valid).toBeDefined();
  });

  test('GET /api/validate/timeline validates timeline', async () => {
    const response = await request(app).get('/api/validate/timeline');

    expect(response.status).toBe(200);
    expect(response.body.data.valid).toBeDefined();
    expect(response.body.data.violations).toBeInstanceOf(Array);
  });

  test('POST /api/validate/fiction-scope validates fiction scope', async () => {
    const response = await request(app)
      .post('/api/validate/fiction-scope')
      .send({
        fiction_id: 'fiction-test'
      });

    expect(response.status).toBe(200);
    expect(response.body.data.valid).toBeDefined();
  });

  test('POST /api/validate/fiction-scope detects audience expansion', async () => {
    const response = await request(app)
      .post('/api/validate/fiction-scope')
      .send({
        fiction_id: 'fiction-test',
        proposed_audience: ['char-eric', 'char-stella']
      });

    expect(response.status).toBe(200);
    expect(response.body.data.violations.length).toBeGreaterThan(0);
    expect(response.body.data.violations[0].type).toBe('AUDIENCE_EXPANSION');
  });

  test('GET /api/validate/project-health returns health check', async () => {
    const response = await request(app).get('/api/validate/project-health');

    expect(response.status).toBe(200);
    expect(response.body.data.entities.total).toBeGreaterThan(0);
    expect(response.body.data.score).toBeDefined();
  });
});

// ============================================================
// AI QUERY TESTS
// ============================================================

describe('AI Query Endpoints', () => {
  test('POST /api/ai/query with character_knowledge', async () => {
    const response = await request(app)
      .post('/api/ai/query')
      .send({
        query_type: 'character_knowledge',
        params: {
          character_id: 'char-eric',
          timestamp: '2033-06-15T14:30:00Z'
        },
        format: 'minimal'
      });

    expect(response.status).toBe(200);
    expect(response.body.query_type).toBe('character_knowledge');
    expect(response.body.format).toBe('minimal');
  });

  test('POST /api/ai/query with event_facts', async () => {
    const response = await request(app)
      .post('/api/ai/query')
      .send({
        query_type: 'event_facts',
        params: {
          event_id: 'evt-test-event'
        },
        format: 'minimal'
      });

    expect(response.status).toBe(200);
    expect(response.body.data.e).toBe('evt-test-event');
    expect(response.body.data.f).toBeInstanceOf(Array);
  });

  test('POST /api/ai/batch executes multiple queries', async () => {
    const response = await request(app)
      .post('/api/ai/batch')
      .send({
        queries: [
          {
            query_type: 'character_knowledge',
            params: {
              character_id: 'char-eric',
              timestamp: '2033-06-15T14:30:00Z'
            }
          },
          {
            query_type: 'event_facts',
            params: {
              event_id: 'evt-test-event'
            }
          }
        ],
        format: 'minimal'
      });

    expect(response.status).toBe(200);
    expect(response.body.batch_size).toBe(2);
    expect(response.body.results.length).toBe(2);
    expect(response.body.results[0].success).toBe(true);
    expect(response.body.results[1].success).toBe(true);
  });

  test('POST /api/ai/validate-prose validates prose', async () => {
    const response = await request(app)
      .post('/api/ai/validate-prose')
      .send({
        prose: 'Eric remembered the test event clearly.',
        pov_character_id: 'char-eric',
        timestamp: '2033-06-15T14:30:00Z',
        mentioned_facts: ['fact-test-1']
      });

    expect(response.status).toBe(200);
    expect(response.body.valid).toBeDefined();
    expect(response.body.pov_character_id).toBe('char-eric');
  });
});

// ============================================================
// EXPORT/IMPORT TESTS
// ============================================================

describe('Export/Import Endpoints', () => {
  test('GET /api/export/project exports project', async () => {
    const response = await request(app).get('/api/export/project');

    expect(response.status).toBe(200);
    expect(response.body.export_info.format).toBe('triplethink-export-v1');
    expect(response.body.entities).toBeInstanceOf(Array);
    expect(response.body.summary).toBeDefined();
  });

  test('POST /api/export/entities exports specific entities', async () => {
    const response = await request(app)
      .post('/api/export/entities')
      .send({
        entity_ids: ['char-eric', 'char-stella'],
        include_related: true
      });

    expect(response.status).toBe(200);
    expect(response.body.entities.length).toBe(2);
  });

  test('POST /api/import/project with dry_run', async () => {
    const exportResponse = await request(app).get('/api/export/project');

    const response = await request(app)
      .post('/api/import/project')
      .send({
        data: exportResponse.body,
        mode: 'skip',
        dry_run: true
      });

    expect(response.status).toBe(200);
    expect(response.body.data.dry_run).toBe(true);
    expect(response.body.data.would_import).toBeDefined();
  });
});

// ============================================================
// SEARCH TESTS
// ============================================================

describe('Search Endpoints', () => {
  test('GET /api/search searches entities', async () => {
    const response = await request(app)
      .get('/api/search')
      .query({ q: 'Eric' });

    expect(response.status).toBe(200);
    expect(response.body.data.results).toBeInstanceOf(Array);
    expect(response.body.data.results.length).toBeGreaterThan(0);
  });

  test('GET /api/search with type filter', async () => {
    const response = await request(app)
      .get('/api/search')
      .query({ q: 'Eric', type: 'character' });

    expect(response.status).toBe(200);
    expect(response.body.data.results.every(r => r.entity_type === 'character')).toBe(true);
  });

  test('GET /api/search validates minimum query length', async () => {
    const response = await request(app)
      .get('/api/search')
      .query({ q: 'a' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('GET /api/search/relationships/:entityId returns relationships', async () => {
    const response = await request(app)
      .get('/api/search/relationships/char-eric')
      .query({ depth: 1 });

    expect(response.status).toBe(200);
    expect(response.body.data.entity_id).toBe('char-eric');
  });

  test('GET /api/search/events/by-participant/:characterId returns events', async () => {
    const response = await request(app)
      .get('/api/search/events/by-participant/char-eric');

    expect(response.status).toBe(200);
    expect(response.body.data.character_id).toBe('char-eric');
    expect(response.body.data.events).toBeInstanceOf(Array);
  });
});

// ============================================================
// ERROR HANDLING TESTS
// ============================================================

describe('Error Handling', () => {
  test('Invalid JSON returns 400', async () => {
    const response = await request(app)
      .post('/api/entities')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }');

    expect(response.status).toBe(400);
  });

  test('Unknown route returns 404', async () => {
    const response = await request(app).get('/api/unknown-endpoint');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  test('Missing required fields returns validation error', async () => {
    const response = await request(app)
      .post('/api/epistemic/validate-scene')
      .send({
        // Missing required 'timestamp' field
        character_pov: 'char-eric'
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ============================================================
// RATE LIMIT TESTS
// ============================================================

describe('Rate Limiting', () => {
  test('Rate limit headers are present', async () => {
    const response = await request(app).get('/api/entities');

    expect(response.headers['x-ratelimit-limit']).toBeDefined();
    expect(response.headers['x-ratelimit-remaining']).toBeDefined();
  });
});

// ============================================================
// CACHE TESTS
// ============================================================

describe('Caching', () => {
  test('Cache header indicates miss on first request', async () => {
    // Clear cache first
    await request(app).post('/api/admin/clear-cache');

    const response = await request(app).get('/api/entities/char-eric');

    expect(response.headers['x-cache']).toBe('MISS');
  });

  test('Cache header indicates hit on second request', async () => {
    // First request
    await request(app).get('/api/entities/char-eric');

    // Second request should hit cache
    const response = await request(app).get('/api/entities/char-eric');

    expect(response.headers['x-cache']).toBe('HIT');
  });

  test('no_cache query parameter bypasses cache', async () => {
    const response = await request(app)
      .get('/api/entities/char-eric')
      .query({ no_cache: 'true' });

    expect(response.headers['x-cache']).toBeUndefined();
  });
});

// ============================================================
// FICTION CONSTRAINT TESTS
// ============================================================

describe('Fiction Constraints', () => {
  test('Fiction 2 is Eric-only (scope validation)', async () => {
    const response = await request(app)
      .post('/api/validate/fiction-scope')
      .send({
        fiction_id: 'fiction-test',
        proposed_audience: ['char-eric', 'char-stella']
      });

    expect(response.status).toBe(200);
    expect(response.body.data.violations).toContainEqual(
      expect.objectContaining({
        type: 'AUDIENCE_EXPANSION'
      })
    );
  });

  test('Knowledge transfer validation detects fiction exposure', async () => {
    // Create knowledge state for Stella knowing ground truth
    const db = app.get('db');
    db.createKnowledgeState('char-stella', '2033-07-01T00:00:00Z', 'evt-test-event', [
      {
        fact_id: 'fact-test-1',
        belief: 'true',
        confidence: 'absolute',
        source: 'direct_experience'
      }
    ]);

    // Create Eric's knowledge state with false belief (after fiction)
    db.createKnowledgeState('char-eric', '2033-07-15T00:00:00Z', 'evt-test-event', [
      {
        fact_id: 'fact-test-1',
        belief: 'false',
        believed_alternative: 'Alternative fact',
        confidence: 'absolute',
        source: 'char-stella'
      }
    ]);

    const response = await request(app)
      .post('/api/validate/knowledge-transfer')
      .send({
        from_character_id: 'char-stella',
        to_character_id: 'char-eric',
        fact_ids: ['fact-test-1'],
        timestamp: '2033-07-15T00:00:00Z'
      });

    expect(response.status).toBe(200);
    // Stella knows truth, Eric believes fiction - transfer would expose
    expect(response.body.data.violations).toContainEqual(
      expect.objectContaining({
        type: 'FICTION_EXPOSURE'
      })
    );
  });
});
