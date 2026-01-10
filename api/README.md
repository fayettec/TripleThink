# TripleThink API

REST API for the TripleThink event-sourced narrative construction system.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

The server will start at `http://localhost:3000`.

## Directory Structure

```
/app/api/
├── server.js              # Main Express server
├── api-spec.yaml          # OpenAPI 3.0 specification
├── ai-query-layer.js      # AI-optimized query interface
├── error-handling.js      # Error types and handlers
├── package.json           # Dependencies and scripts
├── API_DOCUMENTATION.md   # Full API documentation
├── README.md              # This file
├── middleware/
│   ├── auth.js            # API key authentication
│   ├── cache.js           # LRU caching
│   └── rate-limit.js      # Token bucket rate limiting
├── routes/
│   ├── entities.js        # Entity CRUD
│   ├── metadata.js        # Metadata CRUD
│   ├── epistemic.js       # Knowledge state queries
│   ├── temporal.js        # Time-travel queries
│   ├── narrative.js       # Narrative structure
│   ├── validation.js      # Consistency validation
│   ├── export-import.js   # Data export/import
│   ├── search.js          # Search and discovery
│   └── ai.js              # AI-optimized endpoints
└── tests/
    └── integration-tests.js  # Jest test suite
```

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express 4.x
- **Database**: SQLite via better-sqlite3
- **Testing**: Jest + Supertest

## Key Features

### Epistemic Queries (Power Feature)
Track who knows what, when, with what confidence:
```bash
curl "http://localhost:3000/api/epistemic/character/char-eric/knowledge?at_timestamp=2033-07-05T14:00:00Z"
```

### Token-Efficient AI Interface
87% token savings with minimal format:
```bash
curl -X POST http://localhost:3000/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query_type":"character_knowledge","params":{"character_id":"char-eric","timestamp":"2033-07-05T14:00:00Z"},"format":"minimal"}'
```

### Fiction Scope Validation
Prevent accidental expansion of fiction audiences:
```bash
curl -X POST http://localhost:3000/api/validate/fiction-scope \
  -H "Content-Type: application/json" \
  -d '{"fiction_id":"fiction-2","proposed_audience":["char-eric","char-stella"]}'
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `DB_PATH` | ./triplethink.db | Database path |
| `TRIPLETHINK_AUTH_ENABLED` | false | Enable API key auth |
| `TRIPLETHINK_API_KEY` | (generated) | API key |

## Endpoints

| Path | Description |
|------|-------------|
| `/api/health` | Health check |
| `/api/status` | Server status |
| `/api/entities` | Entity CRUD |
| `/api/metadata` | Metadata CRUD |
| `/api/epistemic` | Knowledge queries |
| `/api/temporal` | Time-travel queries |
| `/api/narrative` | Narrative structure |
| `/api/validate` | Consistency validation |
| `/api/export` | Data export |
| `/api/import` | Data import |
| `/api/search` | Search & discovery |
| `/api/ai` | AI-optimized queries |

## Documentation

- [Full API Documentation](API_DOCUMENTATION.md)
- [OpenAPI Specification](api-spec.yaml)

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## License

MIT
