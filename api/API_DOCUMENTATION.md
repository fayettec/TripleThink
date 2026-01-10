# TripleThink API Documentation

## Overview

The TripleThink API provides a comprehensive REST interface for the event-sourced narrative construction system. It enables authors and AI assistants to manage complex multi-book fiction series with precise epistemic tracking.

### Key Features

- **Epistemic Queries**: Track who knows what, when, with what confidence
- **Fiction Management**: Manage false narratives with strict audience constraints
- **Time-Travel Queries**: Query entity state at any historical timestamp
- **Token-Efficient AI Interface**: Optimized endpoints for AI integration with 87% token savings
- **Validation**: Automatic consistency checking for timeline and epistemic constraints

## Getting Started

### Installation

```bash
cd /app/api
npm install
```

### Starting the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start

# With custom configuration
PORT=4000 DB_PATH=./my-project.db npm start
```

### Server Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `PORT` | 3000 | Server port |
| `DB_PATH` | ./triplethink.db | SQLite database path |
| `CORS_ORIGIN` | * | Allowed CORS origins |
| `LOG_REQUESTS` | true | Enable request logging |
| `TRIPLETHINK_AUTH_ENABLED` | false | Enable API key auth |
| `TRIPLETHINK_API_KEY` | (generated) | API key for auth |
| `TRIPLETHINK_RATE_LIMIT` | true | Enable rate limiting |

### Health Check

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-09T12:00:00.000Z",
  "uptime": 123.456,
  "database": "connected"
}
```

## Authentication

Authentication is optional and disabled by default. When enabled, include the API key in the `X-API-Key` header:

```bash
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/entities
```

## Core Concepts

### Entity Types

- **event**: World events with phases, facts, and participants
- **character**: Characters with knowledge states and relationships
- **object**: Physical objects in the story world
- **location**: Places in the story world
- **system**: AI systems or non-character entities
- **fiction**: False narratives with target audiences

### Separated Metadata

Metadata is stored separately from entities for token efficiency:

- **Entity** (lean): Core facts, loaded by default
- **Metadata** (rich): Author notes, AI guidance, loaded on-demand

Use `include_metadata=auto|always|never` to control loading:
- `auto` (default): Load only if `read_metadata_mandatory` is true
- `always`: Always load metadata
- `never`: Never load metadata (87% token savings)

### Epistemic States

Track what characters believe at specific points in time:

```json
{
  "character_id": "char-eric",
  "timestamp": "2033-07-05T14:00:00Z",
  "facts_known": [
    {
      "fact_id": "fact-ms0001-all-survived",
      "belief": "false",
      "believed_alternative": "7 crew members died",
      "confidence": "absolute",
      "source": "char-stella"
    }
  ]
}
```

### Fictions

False narratives with strict audience constraints:

```json
{
  "fiction_id": "fiction-2-crash-lie",
  "target_audience": ["char-eric"],
  "facts_contradicted": [
    {
      "ground_truth_fact_id": "fact-ms0001-all-survived",
      "fictional_alternative": "7 crew members died"
    }
  ],
  "constraints": ["Eric must never discuss crash with crew"],
  "exposure_triggers": [
    {
      "trigger": "Eric mentions crash to crew",
      "consequence": "Fiction collapses"
    }
  ]
}
```

## API Endpoints

### Entities

#### List Entities
```
GET /api/entities
  ?type=character|event|object|location|system|fiction
  ?date_range=2033-01-01T00:00:00Z,2033-12-31T23:59:59Z
  ?participant=char-eric
  ?search=query
  ?include_metadata=auto|always|never
  ?limit=100
  ?offset=0
```

#### Get Entity
```
GET /api/entities/{id}
  ?include_metadata=auto|always|never
  ?at_timestamp=2033-07-05T14:00:00Z  // Time-travel query
```

#### Create Entity
```
POST /api/entities
Content-Type: application/json

{
  "type": "character",
  "data": {
    "id": "char-new",
    "name": "New Character",
    "summary": "Description"
  },
  "metadata": {
    "author_notes": { "creative_intent": "..." }
  }
}
```

#### Update Entity
```
PUT /api/entities/{id}
Content-Type: application/json

{
  "data": { "summary": "Updated summary" },
  "metadata": { "author_notes": { "themes": ["new theme"] } }
}
```

#### Delete Entity
```
DELETE /api/entities/{id}?cascade=false
```

### Epistemic Queries (Power Feature)

#### Get Character Knowledge at Timestamp
```
GET /api/epistemic/character/{id}/knowledge
  ?at_timestamp=2033-07-05T14:00:00Z
  ?format=minimal|detailed
```

**Minimal format** (87% token savings):
```json
{
  "data": {
    "character_id": "char-eric",
    "timestamp": "2033-07-05T14:00:00Z",
    "believes": [
      { "fact_id": "fact-1", "belief": "true" },
      { "fact_id": "fact-2", "belief": "false", "alternative": "7 died" }
    ]
  }
}
```

#### Get Fact Believers
```
GET /api/epistemic/fact/{id}/believers
  ?at_timestamp=2033-07-05T14:00:00Z
```

Returns who believes/disbelieves a fact:
```json
{
  "data": {
    "fact_id": "fact-ms0001-all-survived",
    "believers": [
      { "character_id": "char-stella", "confidence": "absolute" }
    ],
    "disbelievers": [
      { "character_id": "char-eric", "believed_alternative": "7 died" }
    ]
  }
}
```

#### Get Fiction Audience
```
GET /api/epistemic/fiction/{id}/audience
  ?at_timestamp=2033-07-05T14:00:00Z
```

#### Validate Scene
```
POST /api/epistemic/validate-scene
Content-Type: application/json

{
  "scene_id": "scene-1",
  "character_pov": "char-eric",
  "timestamp": "2033-07-05T14:00:00Z",
  "proposed_facts": [
    { "fact_id": "fact-1", "is_revealed": true, "character_knows": true }
  ]
}
```

Response:
```json
{
  "data": {
    "valid": false,
    "violations": [
      {
        "type": "FICTION_VIOLATION",
        "fact_id": "fact-1",
        "message": "Character believes this fact is false",
        "severity": "critical"
      }
    ],
    "warnings": [...]
  }
}
```

#### Quick Belief Check
```
GET /api/epistemic/character/{charId}/believes/{factId}
  ?at_timestamp=2033-07-05T14:00:00Z
```

#### Find Epistemic Divergences
```
GET /api/epistemic/divergences
  ?at_timestamp=2033-07-05T14:00:00Z
  ?character_id=char-eric
```

### Temporal Queries

#### Get Entity State History
```
GET /api/temporal/entity/{id}/states
  ?from=2033-01-01T00:00:00Z
  ?to=2033-12-31T23:59:59Z
  ?property=emotional_state
```

#### Get Entity State at Timestamp
```
GET /api/temporal/entity/{id}/at/{timestamp}
```

#### Get Events in Time Range
```
GET /api/temporal/events
  ?from=2033-01-01T00:00:00Z
  ?to=2033-12-31T23:59:59Z
  ?type=multi_phase_crisis
  ?participant=char-eric
```

#### Get Causal Chain
```
GET /api/temporal/causal-chain/{eventId}
  ?depth=2
```

#### Validate Causal Link
```
POST /api/temporal/validate-causality
Content-Type: application/json

{
  "cause_event_id": "evt-1",
  "effect_event_id": "evt-2"
}
```

#### Find Timeline Gaps
```
GET /api/temporal/gaps
  ?from=2033-01-01T00:00:00Z
  ?to=2033-12-31T23:59:59Z
  ?min_gap_hours=24
```

### Narrative Queries

#### List Books
```
GET /api/narrative/books
```

#### Get Book Structure
```
GET /api/narrative/book/{bookId}
```

#### Get Chapter
```
GET /api/narrative/book/{bookId}/chapter/{chapterNum}
  ?include_scenes=true
  ?include_events=false
```

#### Get Scene with Epistemic Context
```
GET /api/narrative/scene/{sceneId}
  ?include_epistemic_context=true
```

#### Generate Chapter Outline
```
POST /api/narrative/generate-outline
Content-Type: application/json

{
  "book_id": "book-1",
  "chapter_range": "1-5",
  "character_focus": "char-eric"
}
```

### Validation

#### Validate Entity Changes
```
POST /api/validate/consistency
Content-Type: application/json

{
  "entity_id": "char-eric",
  "proposed_changes": { "name": "Eric Updated" }
}
```

#### Validate Timeline
```
GET /api/validate/timeline
  ?book_id=book-1
```

#### Validate Fiction Scope
```
POST /api/validate/fiction-scope
Content-Type: application/json

{
  "fiction_id": "fiction-2",
  "proposed_audience": ["char-eric", "char-stella"]
}
```

#### Project Health Check
```
GET /api/validate/project-health
```

### Export/Import

#### Export Project
```
GET /api/export/project
  ?format=json
  ?include_metadata=true
```

#### Export Specific Entities
```
POST /api/export/entities
Content-Type: application/json

{
  "entity_ids": ["char-eric", "evt-1"],
  "include_metadata": true,
  "include_related": true
}
```

#### Import Project
```
POST /api/import/project
Content-Type: application/json

{
  "data": { ... exported data ... },
  "mode": "merge|skip|replace",
  "dry_run": true
}
```

### Search

#### Full-Text Search
```
GET /api/search
  ?q=Eric
  ?type=character
  ?date_range=2033-01-01,2033-12-31
  ?include_metadata=false
```

#### Get Related Entities
```
GET /api/search/relationships/{entityId}
  ?depth=2
  ?relationship_type=colleague
```

#### Get Events by Participant
```
GET /api/search/events/by-participant/{characterId}
  ?from=2033-01-01T00:00:00Z
  ?to=2033-12-31T23:59:59Z
```

## AI Query Interface

The AI interface provides token-efficient endpoints optimized for AI integration.

### Unified Query Endpoint
```
POST /api/ai/query
Content-Type: application/json

{
  "query_type": "character_knowledge|event_facts|scene_context|fiction_status|relationship_state|entity_state|timeline_slice",
  "params": { ... },
  "format": "minimal|detailed"
}
```

### Batch Queries
```
POST /api/ai/batch
Content-Type: application/json

{
  "queries": [
    { "query_type": "character_knowledge", "params": { ... } },
    { "query_type": "event_facts", "params": { ... } }
  ],
  "format": "minimal"
}
```

### Validate Prose
```
POST /api/ai/validate-prose
Content-Type: application/json

{
  "prose": "Eric mentioned the crash to his mother...",
  "scene_id": "scene-12-3",
  "pov_character_id": "char-eric",
  "timestamp": "2033-08-15T00:00:00Z",
  "mentioned_facts": ["fact-crash"],
  "mentioned_characters": ["char-mother"]
}
```

Response:
```json
{
  "valid": false,
  "violations": [
    {
      "type": "FICTION_EXPOSURE_RISK",
      "message": "Character knows truth that contradicts POV's fiction-based beliefs"
    }
  ],
  "warnings": [...],
  "suggestions": [...]
}
```

### Get Writing Context
```
GET /api/ai/writing-context/{sceneId}
  ?format=minimal
```

Returns aggregated writing context:
```json
{
  "scene_id": "scene-1",
  "pov": {
    "id": "char-eric",
    "name": "Eric",
    "voice": "analytical, vulnerable",
    "speech": "precise, technical"
  },
  "time": { "start": "...", "end": "..." },
  "knows": [...],
  "fictions": [...],
  "irony": [...]
}
```

## Error Handling

All errors follow a standard format:

```json
{
  "error": {
    "code": "EPISTEMIC_VIOLATION",
    "message": "Character knowledge state conflict",
    "details": {
      "character_id": "char-eric",
      "fact_id": "fact-crash"
    },
    "suggestion": "Check Fiction 2 audience constraints",
    "timestamp": "2026-01-09T12:00:00.000Z"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input |
| `UNAUTHORIZED` | 401 | Authentication required |
| `NOT_FOUND` | 404 | Resource not found |
| `EPISTEMIC_VIOLATION` | 422 | Knowledge state conflict |
| `TEMPORAL_INCONSISTENCY` | 422 | Timeline conflict |
| `CONSTRAINT_VIOLATION` | 422 | Business rule violation |
| `FICTION_SCOPE_VIOLATION` | 422 | Fiction audience violation |
| `CAUSAL_VIOLATION` | 422 | Causal link conflict |
| `INTERNAL_ERROR` | 500 | Unexpected error |

## Rate Limiting

Rate limits are applied by category:

| Category | Limit | Description |
|----------|-------|-------------|
| Standard | 1000/min | Normal CRUD operations |
| Epistemic | 100/min | Knowledge state queries |
| Batch | 10/min | Batch AI queries |
| Export | 20/min | Data export operations |
| Search | 60/min | Search queries |

Rate limit headers:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Category`: Rate limit category
- `Retry-After`: Seconds until reset (when limited)

## Caching

Entity and metadata queries are cached:

- Entity cache: 5 minutes TTL, 200 items
- Metadata cache: 10 minutes TTL, 100 items
- Epistemic cache: 1 minute TTL, 50 items

Cache headers:
- `X-Cache: HIT` - Served from cache
- `X-Cache: MISS` - Fetched from database

Bypass cache with `?no_cache=true`.

Clear cache: `POST /api/admin/clear-cache`

## Best Practices

### For GUI Development

1. Use `include_metadata=auto` to leverage separated metadata
2. Implement optimistic updates with validation
3. Use WebSocket events for real-time updates (future)
4. Cache entity lookups locally

### For AI Integration

1. Always use `format=minimal` for token efficiency
2. Use batch queries to reduce round-trips
3. Validate prose before finalizing scenes
4. Query writing context for complete scene setup
5. Check fiction constraints before character interactions

### For Consistency

1. Always validate before committing changes
2. Check timeline consistency periodically
3. Never expand fiction audiences without design
4. Track epistemic state changes with events

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:
- `/api/openapi.yaml` - YAML format
- `/api/docs` - Redirects to spec

Validate the spec:
```bash
npm run validate-spec
```

## Changelog

### v1.0.0 (2026-01-09)
- Initial API release
- Complete entity CRUD
- Epistemic query system
- Temporal queries
- Narrative structure
- Validation system
- Export/Import
- AI query interface
- Token-efficient responses
