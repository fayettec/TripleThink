# Technology Stack

**Analysis Date:** 2026-01-16

## Languages

**Primary:**
- JavaScript (ES6+) - Backend API and frontend GUI

**Secondary:**
- Python 3 - Schema utility scripts (ID generation)
- SQL - Database schema and migrations
- Bash - Startup and deployment scripts

## Runtime

**Environment:**
- Node.js 20.19.6 (required: >=18.0.0)

**Package Manager:**
- npm 10.8.2
- Lockfile: present (`/app/api/package-lock.json`, `/app/package-lock.json`)

## Frameworks

**Core:**
- Express 4.18.2 - REST API server (`/app/api/server.js`)

**Testing:**
- Jest 29.6.0 - Unit and integration testing
- Supertest 6.3.3 - API endpoint testing

**Build/Dev:**
- nodemon 3.0.1 - Development server with hot reload
- serve - Static file server for GUI (installed at runtime via `npm install -g serve`)
- eslint 8.45.0 - Code linting
- swagger-cli 4.0.4 - OpenAPI spec validation

## Key Dependencies

**Critical:**
- better-sqlite3 9.0.0 - Primary database driver (native module requiring build-essential and python3)
- sqlite3 5.1.7 - Additional SQLite driver (used in root package)
- uuid 13.0.0 - Unique ID generation for entities

**Infrastructure:**
- cors 2.8.5 - Cross-origin resource sharing middleware
- helmet 7.0.0 - Security headers for Express
- lru-cache 11.2.4 - In-memory caching layer

**Visualization (Frontend):**
- D3.js (minified) - Timeline and graph visualizations (`/app/gui/lib/d3.min.js`)
- vis.js (minified) - Network graph rendering (`/app/gui/lib/vis.min.js`)
- SimpleMDE (CDN) - Markdown editor for narrative content (loaded from `https://cdn.jsdelivr.net/simplemde/latest/`)

## Configuration

**Environment:**
- Configuration via environment variables (no `.env` files committed)
- Optional env vars:
  - `PORT` - API server port (default: 3000)
  - `DB_PATH` - SQLite database path (default: `./api/triplethink.db`)
  - `CORS_ORIGIN` - CORS allowed origins (default: `*`)
  - `LOG_REQUESTS` - Request logging toggle (default: true)
  - `NODE_ENV` - Environment mode (affects JSON formatting)
  - `TRIPLETHINK_AUTH_ENABLED` - Enable API key auth (default: false)
  - `TRIPLETHINK_API_KEY` - API key for authentication (optional)

**Build:**
- No build step required (plain JavaScript)
- Jest config embedded in `/app/api/package.json`
- Separate Jest config at `/app/TripleThink/jest.config.js`
- ESLint config assumed (referenced but not found in exploration)

## Platform Requirements

**Development:**
- Node.js >=18.0.0
- Build tools for native modules (better-sqlite3):
  - build-essential (Linux)
  - python3
- git, curl, unzip (for Docker image)
- jq (for ralph-loop plugin support)

**Production:**
- Docker container based on `node:20-slim` (`/app/Dockerfile`)
- Exposes ports 3000 (API) and 8080 (GUI)
- SQLite database with WAL mode enabled
- Startup script: `/app/start.sh`

**Database:**
- SQLite 3 with JSON1 extension
- Pragmas: `foreign_keys = ON`, `journal_mode = WAL`
- Migration system in `/app/db/migrations/`

## AI Tooling

**Installed Globally in Docker:**
- @anthropic-ai/claude-code - Claude Code CLI
- @google/gemini-cli - Google Gemini CLI

---

*Stack analysis: 2026-01-16*
