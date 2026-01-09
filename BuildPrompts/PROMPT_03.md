● Four Sequential Prompts for Building TripleThink

  System Name Proposal: TripleThink

  TripleThink - An event-sourced narrative construction system for multi-book series

  Why "TripleThink"?
  - a play of 1984's DoubleThink and the Ministry Of Truth
  - Memorable, professional, distinct from CAWA

  Alternative tagline: "TripleThink: Where Story Becomes Simulation"

  ---

  # PROMPT 3: API Endpoints & Integration Layer

  Task: Design TripleThink API Endpoints & Integration Layer

  This is Prompt 3 of 4 (API Design). The database schema from Prompt 2 is now implemented.

  Context

  We have:
  - Complete JSON schema (Prompt 1)
  - Database implementation (Prompt 2)

  Now we need the API layer that sits between the database and:
  - GUI (HTML forms for authors)
  - AI query system (Claude accessing data)
  - Export/import tools

  Your Task

  Design the complete REST API and integration layer for TripleThink.

  1. API Architecture

  Technology Stack Decision:

  Evaluate and recommend:
  - Node.js + Express (JavaScript ecosystem)
  - Python + FastAPI (Python ecosystem, type hints)
  - Go + Gin (performance, compiled)
  - Embedded in GUI (no separate server)

  Requirements:
  - Must handle HTTP requests from GUI
  - Must support AI query patterns (may be different from GUI)
  - Must support real-time updates (if editing while AI queries)
  - Must be portable (author runs locally)

  Provide recommendation with rationale.

  2. Core REST Endpoints

  Design all endpoints:

  # ENTITIES

  GET    /api/entities/{id}
         ?include_metadata=auto|always|never
         ?at_timestamp=ISO8601  // Time-travel query

  POST   /api/entities
         body: {type, data, metadata}

  PUT    /api/entities/{id}
         body: {data}

  DELETE /api/entities/{id}
         ?cascade=true|false  // Delete related data?

  GET    /api/entities
         ?type=event|character|object|location|fiction
         ?date_range=start,end
         ?participant={characterId}
         ?search={query}

  # METADATA

  GET    /api/metadata/{id}
  POST   /api/metadata
  PUT    /api/metadata/{id}
  DELETE /api/metadata/{id}

  # EPISTEMIC QUERIES (The Power Feature)

  GET    /api/epistemic/character/{id}/knowledge
         ?at_timestamp=ISO8601
         Returns: What character knows/believes at time T

  GET    /api/epistemic/fact/{id}/believers
         ?at_timestamp=ISO8601
         Returns: Who believes fact at time T (+ divergence)

  GET    /api/epistemic/fiction/{id}/audience
         ?at_timestamp=ISO8601
         Returns: Who believes fiction at time T

  POST   /api/epistemic/validate-scene
         body: {sceneId, characterPOV, timestamp}
         Returns: Validation errors (epistemic violations)

  # TEMPORAL QUERIES

  GET    /api/temporal/entity/{id}/states
         ?from=ISO8601&to=ISO8601
         Returns: All state changes in time range

  GET    /api/temporal/events
         ?from=ISO8601&to=ISO8601
         ?type=event_type
         Returns: Events in time range

  # NARRATIVE QUERIES

  GET    /api/narrative/book/{bookId}/chapter/{num}
         Returns: All events/scenes in chapter

  GET    /api/narrative/scene/{sceneId}
         ?include_epistemic_context=true
         Returns: Scene data + character knowledge states

  POST   /api/narrative/generate-outline
         body: {bookId, chapterRange}
         Returns: Chapter outline based on events

  # VALIDATION

  POST   /api/validate/consistency
         body: {entityId, proposedChanges}
         Returns: Consistency violations

  GET    /api/validate/timeline
         ?bookId={id}
         Returns: Timeline gaps, overlaps, errors

  # EXPORT/IMPORT

  GET    /api/export/project
         ?format=json|sql
         Returns: Complete project data

  POST   /api/import/project
         body: {format, data}
         Returns: Import results, conflicts

  POST   /api/export/entities
         body: {entityIds}
         Returns: Subset export (for sharing)

  # SEARCH & DISCOVERY

  GET    /api/search
         ?q={query}
         &type=entity_type
         &date_range=start,end
         Returns: Relevant entities

  GET    /api/relationships/{entityId}
         ?depth=1|2|3
         Returns: Related entities (graph traversal)

  For each endpoint:
  - Request parameters
  - Request body schema
  - Response schema
  - Status codes (200, 400, 404, 500)
  - Example requests/responses

  3. AI Query Interface (Special)

  Design AI-optimized endpoints:

  # These differ from GUI endpoints - optimized for token efficiency

  POST   /api/ai/query
         body: {
           query_type: "character_knowledge" | "event_facts" | "scene_context",
           params: {...},
           format: "minimal" | "detailed"
         }

         Returns: Exactly what AI needs, no more

         Examples:

         # Minimal response (87% token savings)
         {
           "character_id": "char-eric",
           "timestamp": "2033-07-05",
           "believes": [
             {"fact_id": "fact-ms0001-crash", "belief": "false", "alternative": "7 died"}
           ]
         }

         # vs Detailed response (includes all context)
         {
           "character_id": "char-eric",
           "knowledge_state": {... full object ...},
           "metadata": {... full metadata ...},
           "related_events": [...]
         }

  POST   /api/ai/validate-prose
         body: {
           prose: "Eric mentioned the crash to his mother...",
           sceneId: "scene-ch12-s3",
           timestamp: "2033-08-15"
         }

         Returns: {
           valid: false,
           violations: [
             {
               type: "epistemic_error",
               message: "Eric's mother doesn't know about crash (Fiction 2 is Eric-only)",
               severity: "critical"
             }
           ]
         }

  4. Error Handling & Responses

  Standard error format:

  {
    "error": {
      "code": "EPISTEMIC_VIOLATION",
      "message": "Character knowledge state conflict",
      "details": {
        "character_id": "char-eric",
        "fact_id": "fact-ms0001-crash",
        "timestamp": "2033-07-05",
        "violation": "Eric cannot know this fact at this time"
      },
      "suggestion": "Check Fiction 2 audience constraints"
    }
  }

  Error types:
  - VALIDATION_ERROR (400)
  - NOT_FOUND (404)
  - EPISTEMIC_VIOLATION (422)
  - TEMPORAL_INCONSISTENCY (422)
  - CONSTRAINT_VIOLATION (422)
  - INTERNAL_ERROR (500)

  5. Authentication & Access Control

  Design auth system (if multi-user):

  # Simple token-based auth
  POST   /api/auth/login
         body: {username, password}
         Returns: {token, userId}

  # Or: No auth (single-user local system)
  # Which approach for TripleThink?

  Provide recommendation.

  6. Real-Time Updates (Optional)

  If GUI updates while AI queries:

  # WebSocket endpoint for live updates
  WS     /api/ws

         Events:
         - entity_created
         - entity_updated
         - entity_deleted
         - metadata_updated

         Use case: Author edits Fiction 2 in GUI while AI writes Chapter 7
         AI receives update, re-queries, adjusts prose

  Is this needed? Provide analysis.

  7. Rate Limiting & Caching

  Query optimization:

  // Cache frequently accessed entities
  GET /api/entities/char-eric
  → Cache for 5 minutes
  → Invalidate on UPDATE

  // Rate limit expensive queries
  GET /api/epistemic/...
  → Max 100/minute

  // Batch queries for AI
  POST /api/ai/batch
  body: [
    {query_type: "...", params: {...}},
    {query_type: "...", params: {...}}
  ]
  → Single round-trip, multiple results

  8. OpenAPI / Swagger Documentation

  Generate API docs:

  openapi: 3.0.0
  info:
    title: TripleThink API
    version: 1.0.0
    description: Event-sourced narrative construction system

  paths:
    /api/entities/{id}:
      get:
        summary: Get entity by ID
        parameters:
          - name: id
            in: path
            required: true
            schema:
              type: string
          - name: include_metadata
            in: query
            schema:
              type: string
              enum: [auto, always, never]
        responses:
          200:
            description: Entity found
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/Entity'

  Provide complete OpenAPI spec.

  9. Integration Tests

  Design test suites:

  // Test: Epistemic query correctness
  test('Character knowledge at timestamp', async () => {
    const knowledge = await api.get('/api/epistemic/character/char-eric/knowledge?at_timestamp=2033-07-05');

    expect(knowledge.believes).toContainEqual({
      fact_id: 'fact-ms0001-crash',
      belief: 'false',
      alternative: '7 died in crash'
    });
  });

  // Test: Fiction 2 audience constraint
  test('Fiction 2 is Eric-only', async () => {
    const response = await api.post('/api/validate/consistency', {
      entityId: 'evt-eric-tells-crew',
      proposedChanges: {information_transfer: {to: 'crew-members'}}
    });

    expect(response.violations).toContainEqual({
      type: 'EPISTEMIC_VIOLATION',
      message: 'Fiction 2 is Eric-only, cannot be shared with crew'
    });
  });

  10. Deliverables

  Provide:
  1. api-spec.yaml - Complete OpenAPI 3.0 specification
  2. api-implementation.js - Express/FastAPI implementation
  3. ai-query-layer.js - AI-optimized query interface
  4. error-handling.js - Error types and handlers
  5. integration-tests.js - Test suite for all endpoints
  6. api-documentation.md - Usage guide with examples

  Success Criteria

  - API covers all use cases (GUI, AI, export)
  - Epistemic queries are powerful and correct
  - Error messages are helpful
  - Performance is acceptable (< 200ms for complex queries)
  - Documentation is complete

  Begin.

 