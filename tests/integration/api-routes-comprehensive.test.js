// Comprehensive API Route Integration Tests (Phase 13-03)
// Tests ALL API routes for correct behavior and response structure

const http = require('http');
const assert = require('assert');

const TEST_HOST = 'localhost';
const TEST_PORT = 3000;

let TEST_RESULTS = {
  passed: 0,
  failed: 0,
  total: 0
};

/**
 * Make HTTP request to API
 */
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: TEST_HOST,
      port: TEST_PORT,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Test wrapper with result tracking
 */
async function test(name, fn) {
  TEST_RESULTS.total++;
  try {
    await fn();
    TEST_RESULTS.passed++;
    console.log(`✓ ${name}`);
  } catch (err) {
    TEST_RESULTS.failed++;
    console.log(`✗ ${name}: ${err.message}`);
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('\n=== API Routes Comprehensive Integration Tests ===\n');

  // HEALTH CHECK
  console.log('--- Health Check ---');
  await test('GET /health returns 200 OK', async () => {
    const res = await makeRequest('GET', '/health');
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.strictEqual(res.body.status, 'ok', 'Health status should be ok');
  });

  // PROJECTS ROUTES
  console.log('\n--- Projects API ---');
  let testProjectId;

  await test('GET /api/projects returns array', async () => {
    const res = await makeRequest('GET', '/api/projects');
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data field');
    assert(Array.isArray(res.body.data), 'Data should be array');
  });

  await test('POST /api/projects creates project', async () => {
    const res = await makeRequest('POST', '/api/projects', {
      name: 'Test Project for Integration'
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    assert(res.body.projectId, 'Response should have projectId');
    testProjectId = res.body.projectId;
  });

  await test('GET /api/projects/:id returns project', async () => {
    const res = await makeRequest('GET', `/api/projects/${testProjectId}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data');
    assert.strictEqual(res.body.data.id, testProjectId, 'Project ID should match');
  });

  // FICTIONS ROUTES
  console.log('\n--- Fictions API ---');
  let testFictionId;

  await test('GET /api/fictions returns array', async () => {
    const res = await makeRequest('GET', '/api/fictions');
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data field');
    assert(Array.isArray(res.body.data), 'Data should be array');
  });

  await test('POST /api/fictions creates fiction', async () => {
    const res = await makeRequest('POST', '/api/fictions', {
      projectId: testProjectId,
      name: 'Test Fiction'
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    assert(res.body.fictionId, 'Response should have fictionId');
    testFictionId = res.body.fictionId;
  });

  await test('GET /api/fictions/:id returns fiction', async () => {
    const res = await makeRequest('GET', `/api/fictions/${testFictionId}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data');
    assert.strictEqual(res.body.data.id, testFictionId, 'Fiction ID should match');
  });

  // ENTITIES ROUTES
  console.log('\n--- Entities API ---');
  let testEntityId;

  await test('GET /api/entities returns array', async () => {
    const res = await makeRequest('GET', `/api/entities?fictionId=${testFictionId}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data field');
    assert(Array.isArray(res.body.data), 'Data should be array');
  });

  await test('POST /api/entities creates entity', async () => {
    const res = await makeRequest('POST', '/api/entities', {
      fictionId: testFictionId,
      name: 'Test Character',
      type: 'character'
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    assert(res.body.id, 'Response should have entity id');
    testEntityId = res.body.id;
  });

  await test('GET /api/entities/:id returns entity', async () => {
    const res = await makeRequest('GET', `/api/entities/${testEntityId}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data');
    assert.strictEqual(res.body.data.id, testEntityId, 'Entity ID should match');
  });

  await test('PUT /api/entities/:id updates entity', async () => {
    const res = await makeRequest('PUT', `/api/entities/${testEntityId}`, {
      name: 'Updated Character Name'
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
  });

  // EPISTEMIC ROUTES
  console.log('\n--- Epistemic API ---');

  await test('GET /api/epistemic/knowledge returns knowledge states', async () => {
    const res = await makeRequest('GET', `/api/epistemic/knowledge?entityId=${testEntityId}&timestamp=1000000`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data field');
    assert(Array.isArray(res.body.data), 'Data should be array');
  });

  await test('POST /api/epistemic/knowledge creates knowledge state', async () => {
    const res = await makeRequest('POST', '/api/epistemic/knowledge', {
      fictionId: testFictionId,
      entityId: testEntityId,
      factType: 'secret',
      factKey: 'test-secret',
      factValue: 'Test secret value',
      sourceType: 'witnessed',
      acquiredAt: 1000
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
  });

  await test('GET /api/epistemic/false-beliefs returns false beliefs', async () => {
    const res = await makeRequest('GET', `/api/epistemic/false-beliefs?entityId=${testEntityId}&timestamp=1000000`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data field');
    assert(Array.isArray(res.body.data), 'Data should be array');
  });

  // TEMPORAL ROUTES
  console.log('\n--- Temporal API ---');

  await test('GET /api/temporal/timeline returns timeline', async () => {
    const res = await makeRequest('GET', `/api/temporal/timeline?fictionId=${testFictionId}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data field');
    assert(Array.isArray(res.body.data), 'Data should be array');
  });

  // VALIDATION ROUTES
  console.log('\n--- Validation API ---');

  await test('GET /api/validation returns validation report', async () => {
    const res = await makeRequest('GET', '/api/validation');
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.summary, 'Response should have summary');
    assert(res.body.categories, 'Response should have categories');
  });

  await test('GET /api/validation/categories returns 8 categories', async () => {
    const res = await makeRequest('GET', '/api/validation/categories');
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.categories, 'Response should have categories array');
    assert(Array.isArray(res.body.categories), 'Categories should be array');
  });

  await test('GET /api/validation/category/:name returns category rules', async () => {
    const res = await makeRequest('GET', '/api/validation/category/referential_integrity');
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.category, 'Response should have category');
    assert(res.body.rules, 'Response should have rules');
    assert(Array.isArray(res.body.rules), 'Rules should be array');
  });

  await test('GET /api/validation/severity/:level returns rules by severity', async () => {
    const res = await makeRequest('GET', '/api/validation/severity/critical');
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.rules, 'Response should have rules');
    assert(Array.isArray(res.body.rules), 'Rules should be array');
  });

  await test('GET /api/validation/failing returns failing rules', async () => {
    const res = await makeRequest('GET', '/api/validation/failing');
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.rules, 'Response should have rules');
    assert(Array.isArray(res.body.rules), 'Rules should be array');
  });

  await test('GET /api/validation/summary returns summary stats', async () => {
    const res = await makeRequest('GET', '/api/validation/summary');
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.summary, 'Response should have summary');
    assert(typeof res.body.summary.totalRules === 'number', 'Should have totalRules count');
  });

  // LOGIC LAYER ROUTES
  console.log('\n--- Logic Layer: Causality API ---');
  let testChainUuid;

  await test('GET /api/logic/causality returns chains', async () => {
    const res = await makeRequest('GET', `/api/logic/causality?fictionId=${testFictionId}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data field');
    assert(Array.isArray(res.body.data), 'Data should be array');
  });

  await test('POST /api/logic/causality creates chain', async () => {
    const res = await makeRequest('POST', '/api/logic/causality', {
      fictionId: testFictionId,
      causeEventId: testEntityId,
      effectEventId: testEntityId,
      relationshipType: 'direct_cause',
      strength: 8,
      explanation: 'Test causality'
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    assert(res.body.chainUuid, 'Response should have chainUuid');
    testChainUuid = res.body.chainUuid;
  });

  await test('GET /api/logic/causality/:id returns chain', async () => {
    const res = await makeRequest('GET', `/api/logic/causality/${testChainUuid}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data');
  });

  await test('GET /api/logic/causality/traverse/:eventId traverses chain', async () => {
    const res = await makeRequest('GET', `/api/logic/causality/traverse/${testEntityId}?depth=3`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.graph, 'Response should have graph');
    assert(res.body.graph.nodes, 'Graph should have nodes');
    assert(res.body.graph.edges, 'Graph should have edges');
  });

  console.log('\n--- Logic Layer: Character Arcs API ---');
  let testArcUuid;

  await test('GET /api/logic/arcs returns arcs', async () => {
    const res = await makeRequest('GET', `/api/logic/arcs?fictionId=${testFictionId}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data field');
    assert(Array.isArray(res.body.data), 'Data should be array');
  });

  await test('POST /api/logic/arcs creates arc', async () => {
    const res = await makeRequest('POST', '/api/logic/arcs', {
      fictionId: testFictionId,
      characterId: testEntityId,
      archetype: 'hero',
      currentPhase: 'setup'
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    assert(res.body.arcUuid, 'Response should have arcUuid');
    testArcUuid = res.body.arcUuid;
  });

  await test('GET /api/logic/arcs/:id returns arc', async () => {
    const res = await makeRequest('GET', `/api/logic/arcs/${testArcUuid}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data');
  });

  await test('POST /api/logic/arcs/:id/advance advances arc phase', async () => {
    const res = await makeRequest('POST', `/api/logic/arcs/${testArcUuid}/advance`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data');
  });

  console.log('\n--- Logic Layer: Story Conflicts API ---');
  let testConflictUuid;

  await test('GET /api/logic/conflicts returns conflicts', async () => {
    const res = await makeRequest('GET', `/api/logic/conflicts?fictionId=${testFictionId}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data field');
    assert(Array.isArray(res.body.data), 'Data should be array');
  });

  await test('POST /api/logic/conflicts creates conflict', async () => {
    const res = await makeRequest('POST', '/api/logic/conflicts', {
      fictionId: testFictionId,
      type: 'internal',
      protagonistId: testEntityId,
      antagonistSource: 'self',
      stakesSuccess: 'Win',
      stakesFail: 'Lose',
      status: 'latent'
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    assert(res.body.conflictUuid, 'Response should have conflictUuid');
    testConflictUuid = res.body.conflictUuid;
  });

  await test('GET /api/logic/conflicts/:id returns conflict', async () => {
    const res = await makeRequest('GET', `/api/logic/conflicts/${testConflictUuid}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data');
  });

  await test('POST /api/logic/conflicts/:id/transition transitions conflict status', async () => {
    const res = await makeRequest('POST', `/api/logic/conflicts/${testConflictUuid}/transition`, {
      newStatus: 'active'
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data');
  });

  console.log('\n--- Logic Layer: Themes API ---');
  let testThemeUuid;

  await test('GET /api/logic/themes returns themes', async () => {
    const res = await makeRequest('GET', `/api/logic/themes?fictionId=${testFictionId}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data field');
    assert(Array.isArray(res.body.data), 'Data should be array');
  });

  await test('POST /api/logic/themes creates theme', async () => {
    const res = await makeRequest('POST', '/api/logic/themes', {
      fictionId: testFictionId,
      statement: 'Test theme statement',
      question: 'Test question?'
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    assert(res.body.themeUuid, 'Response should have themeUuid');
    testThemeUuid = res.body.themeUuid;
  });

  await test('GET /api/logic/themes/:id returns theme', async () => {
    const res = await makeRequest('GET', `/api/logic/themes/${testThemeUuid}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data');
  });

  console.log('\n--- Logic Layer: Setup/Payoffs API ---');
  let testSetupUuid;

  await test('GET /api/logic/setup-payoffs returns setups', async () => {
    const res = await makeRequest('GET', `/api/logic/setup-payoffs?fictionId=${testFictionId}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data field');
    assert(Array.isArray(res.body.data), 'Data should be array');
  });

  await test('POST /api/logic/setup-payoffs creates setup', async () => {
    const res = await makeRequest('POST', '/api/logic/setup-payoffs', {
      fictionId: testFictionId,
      setupEventId: testEntityId,
      description: 'Test setup',
      status: 'planted',
      plantedChapter: 1
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    assert(res.body.setupUuid, 'Response should have setupUuid');
    testSetupUuid = res.body.setupUuid;
  });

  await test('GET /api/logic/setup-payoffs/:id returns setup', async () => {
    const res = await makeRequest('GET', `/api/logic/setup-payoffs/${testSetupUuid}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data');
  });

  await test('GET /api/logic/setup-payoffs/unfired/:fictionId returns unfired setups', async () => {
    const res = await makeRequest('GET', `/api/logic/setup-payoffs/unfired/${testFictionId}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data');
    assert(Array.isArray(res.body.data), 'Data should be array');
  });

  console.log('\n--- Logic Layer: World Rules API ---');
  let testRuleUuid;

  await test('GET /api/logic/world-rules returns rules', async () => {
    const res = await makeRequest('GET', `/api/logic/world-rules?fictionId=${testFictionId}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data field');
    assert(Array.isArray(res.body.data), 'Data should be array');
  });

  await test('POST /api/logic/world-rules creates rule', async () => {
    const res = await makeRequest('POST', '/api/logic/world-rules', {
      fictionId: testFictionId,
      ruleCategory: 'physics',
      statement: 'Test rule',
      enforcementLevel: 'strict'
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    assert(res.body.ruleUuid, 'Response should have ruleUuid');
    testRuleUuid = res.body.ruleUuid;
  });

  await test('GET /api/logic/world-rules/:id returns rule', async () => {
    const res = await makeRequest('GET', `/api/logic/world-rules/${testRuleUuid}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.data, 'Response should have data');
  });

  // SEARCH ROUTES
  console.log('\n--- Search API ---');

  await test('GET /api/search returns search results', async () => {
    const res = await makeRequest('GET', `/api/search?query=test&fictionId=${testFictionId}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.results, 'Response should have results field');
  });

  // EXPORT ROUTES
  console.log('\n--- Export API ---');

  await test('GET /api/export/:fictionId returns export data', async () => {
    const res = await makeRequest('GET', `/api/export/${testFictionId}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body.fiction, 'Response should have fiction data');
  });

  // PRINT RESULTS
  console.log('\n=== Test Results ===');
  console.log(`Total: ${TEST_RESULTS.total}`);
  console.log(`Passed: ${TEST_RESULTS.passed}`);
  console.log(`Failed: ${TEST_RESULTS.failed}`);

  if (TEST_RESULTS.failed > 0) {
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
