# External Integrations

**Analysis Date:** 2026-01-16

## APIs & External Services

**Content Delivery Networks:**
- SimpleMDE Markdown Editor - CDN-hosted library
  - URL: `https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.js`
  - CSS: `https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.css`
  - Usage: Markdown editing in GUI (`/app/gui/index.html`)
  - No auth required

**AI Services:**
- Anthropic Claude Code - Installed globally in Docker environment
  - Package: `@anthropic-ai/claude-code`
  - Auth: Via ANTHROPIC_API_KEY (environment variable, not currently configured in codebase)
- Google Gemini CLI - Installed globally in Docker environment
  - Package: `@google/gemini-cli`
  - Auth: Via GOOGLE_AI_API_KEY (environment variable, not currently configured in codebase)

**No External API Integrations:**
The TripleThink system is fully self-contained with no external API calls for core functionality. All narrative processing, epistemic tracking, and validation happens locally.

## Data Storage

**Databases:**
- SQLite 3
  - Connection: Local file at `${DB_PATH}` (default: `/app/api/triplethink.db`)
  - Client: better-sqlite3 9.0.0
  - Mode: WAL (Write-Ahead Logging)
  - Schema version: 1.0.0
  - Migrations: `/app/db/migrations/*.sql`

**File Storage:**
- Local filesystem only
- Database file: SQLite on disk
- GUI static assets: `/app/gui/`
- Schema files: `/app/schema/`

**Caching:**
- In-memory LRU cache via lru-cache 11.2.4
  - Implementation: `/app/api/middleware/cache.js`
  - Scopes: Epistemic queries, entity lookups
  - Admin endpoint: `POST /api/admin/clear-cache`

## Authentication & Identity

**Auth Provider:**
- Custom API key authentication (optional, disabled by default)
  - Implementation: `/app/api/middleware/auth.js`
  - Header: `X-API-Key`
  - Enable: Set `TRIPLETHINK_AUTH_ENABLED=true`
  - Key: Set `TRIPLETHINK_API_KEY` or auto-generate
  - Public paths: `/api/health`, `/api/docs`, `/api/openapi.yaml`

**No External Identity Providers:**
Single-user local system with optional self-managed API keys. No OAuth, SAML, or third-party auth integrations.

## Monitoring & Observability

**Error Tracking:**
- None (local console logging only)
- Custom error handling in `/app/api/error-handling.js`
- Error types: ValidationError, NotFoundError, EpistemicViolationError

**Logs:**
- Console output to stdout/stderr
- Request logging to `/tmp/triplethink-api.log` (via start.sh)
- GUI logs to `/tmp/triplethink-gui.log` (via start.sh)
- Structured format: `[timestamp] METHOD path status duration_ms`

**Health Checks:**
- `GET /api/health` - Basic health status
- `GET /api/status` - Detailed system status including entity counts, cache stats, rate limits

## CI/CD & Deployment

**Hosting:**
- Local Docker container (self-hosted)
  - Image: Custom based on `node:20-slim`
  - Dockerfile: `/app/Dockerfile`
  - Ports: 3000 (API), 8080 (GUI)

**CI Pipeline:**
- None detected (no GitHub Actions, GitLab CI, Jenkins configs found)
- Testing: Manual via `npm test` in `/app/api/`

**Deployment Process:**
- Docker build and run
- Startup script: `/app/start.sh`
- Database auto-initialization via `/app/db/init-database.js`

## Environment Configuration

**Required env vars:**
None required for basic operation (all have defaults)

**Optional env vars:**
- `PORT` - API port (default: 3000)
- `DB_PATH` - Database location (default: `./api/triplethink.db`)
- `CORS_ORIGIN` - CORS configuration (default: `*`)
- `LOG_REQUESTS` - Enable request logging (default: true)
- `NODE_ENV` - Environment mode (affects JSON formatting)
- `TRIPLETHINK_AUTH_ENABLED` - Enable API auth (default: false)
- `TRIPLETHINK_API_KEY` - API key for auth (optional)

**Secrets location:**
- Environment variables only
- No secrets management system
- No `.env` files in repository

## Webhooks & Callbacks

**Incoming:**
None - No webhook endpoints configured

**Outgoing:**
None - No external webhook calls made

## Rate Limiting

**Implementation:**
- Custom in-memory rate limiting
  - Middleware: `/app/api/middleware/rate-limit.js`
  - Tiers: standard, epistemic, batch
  - Admin endpoint: `POST /api/admin/reset-rate-limits`
  - Stats: `GET /api/status` includes rate limit info

**No External Rate Limiting Services:**
All rate limiting handled in-process (no Redis, no external services)

## Static Asset Serving

**GUI Hosting:**
- Served by Express static middleware from `/app/gui/`
- Also served by `serve` package on port 8080 (via start.sh)
- Root path `/` redirects to GUI
- Content-Security-Policy configured via helmet middleware

## Development Tools

**API Specification:**
- OpenAPI/Swagger spec at `/app/api/api-spec.yaml`
- Validation: swagger-cli 4.0.4
- Endpoint: `GET /api/openapi.yaml`
- Docs redirect: `GET /api/docs`

---

*Integration audit: 2026-01-16*
