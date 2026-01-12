# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is the **implementation repository** for TripleThink, an event-sourced narrative construction system for managing multi-book fiction series. TripleThink is the evolution of Cawa (Claude Author Writing Assistant).

**Current Status**: TripleThink has been implemented with a Node.js/Express API and HTML/JavaScript GUI. The application is functional and ready to run.

## Repository Contents

### BuildPrompts/
Sequential prompts for building TripleThink:
- `PROMPT_01.md` - JSON Schema design with separated metadata architecture
- `PROMPT_02.md` - Database schema and storage layer design
- `PROMPT_03.md` - API endpoints and integration layer design
- `PROMPT_04.md` - GUI design and HTML forms specification

These prompts are designed to be executed sequentially to build the complete system.

### Dockerfile
Docker environment setup for running Claude Code with Node.js 20, providing:
- Git and basic CLI tools
- Claude Code CLI installed globally
- Working directory at `/app`

## Development Environment

### Current Setup (Windows 11)

**Host System:**
- Windows 11 running Docker Desktop with WSL2 backend
- Project location: `C:\Users\facra\OneDrive\Documents\AI Agent\claude\TripleThink`
- Docker container name: `triple-think`

**Docker Configuration:**
```cmd
docker run -it ^
  -v "C:\Users\facra\OneDrive\Documents\AI Agent\claude\TripleThink:/app" ^
  -v "%USERPROFILE%\.claude:/root/.claude" ^
  -p 3000:3000 ^
  -p 8080:8080 ^
  triple-think
```

**Port Mappings:**
- `3000` → API server (Express/Node.js)
- `8080` → GUI server (static HTML)

**Volume Mounts:**
- Project files: Windows directory ↔ `/app` in container
- Claude config: `%USERPROFILE%\.claude` ↔ `/root/.claude`

### Technology Stack (Implemented)

**Backend (API):**
- Node.js 18+ with Express 4.x
- better-sqlite3 for database
- CORS and Helmet for security
- Database: `api/triplethink.db` (SQLite)

**Frontend (GUI):**
- Plain HTML/CSS/JavaScript (no framework)
- Served via `serve` package on port 8080
- Location: `/app/gui/`

**Project Structure:**
```
/app/
├── api/                      # Backend API
│   ├── server.js            # Express server (port 3000)
│   ├── routes/              # API route handlers
│   ├── middleware/          # Auth, cache, rate-limit
│   ├── ai-query-layer.js    # AI integration
│   ├── error-handling.js    # Error middleware
│   ├── triplethink.db       # SQLite database
│   ├── package.json         # API dependencies
│   └── restart.sh           # API restart script
├── gui/                      # Frontend GUI
│   ├── index.html           # Main entry point
│   ├── js/                  # JavaScript modules
│   │   ├── screens/         # Screen components
│   │   ├── components/      # UI components
│   │   └── utils/           # Utility functions
│   ├── styles/              # CSS stylesheets
│   └── lib/                 # Third-party libraries
├── db/                       # Database layer
│   └── api-functions.js     # Database API
├── BuildPrompts/            # Original build specs
├── start.sh                 # Start both servers (Docker)
├── run-docker.sh           # Launch Docker container
└── package.json            # Root dependencies
```

## Running TripleThink

### Option 1: Inside Docker (Current Setup)

**Start the application:**
```bash
# Inside Docker container at /app
./start.sh
```

This will:
1. Start API server on port 3000 (background)
2. Start GUI server on port 8080 (foreground)

**Access the application:**
- GUI: http://localhost:8080
- API: http://localhost:3000
- API Docs: http://localhost:3000/api-docs

**Manual start (if start.sh fails):**
```bash
# Start API
cd /app/api
npm start &

# Start GUI (in separate terminal or foreground)
cd /app
npx serve -s gui -l 8080
```

### Option 2: Outside Docker (Windows Native)

**Prerequisites:**
1. Install Node.js 18+ from https://nodejs.org/
2. Open PowerShell or Command Prompt
3. Navigate to project directory

**First-time setup:**
```cmd
cd "C:\Users\facra\OneDrive\Documents\AI Agent\claude\TripleThink"

:: Install root dependencies
npm install

:: Install API dependencies
cd api
npm install
cd ..
```

**Start the application:**
```cmd
:: Start API server (Terminal 1)
cd api
node server.js

:: Start GUI server (Terminal 2 - open new window)
npx serve -s gui -l 8080
```

**Access the application:**
- GUI: http://localhost:8080
- API: http://localhost:3000

**Troubleshooting Windows:**
- If `npm` not found: Add Node.js to PATH and restart terminal
- If port in use: `netstat -ano | findstr :3000` to find process, then `taskkill /PID <pid> /F`
- If SQLite errors: Make sure `better-sqlite3` builds correctly (`npm rebuild better-sqlite3`)

### Stopping the Application

**Inside Docker:**
```bash
# Stop GUI (Ctrl+C in terminal running serve)
# Stop API
pkill -f "node server.js"
```

**On Windows:**
```cmd
:: Stop servers with Ctrl+C in each terminal
:: Or force kill:
taskkill /F /IM node.exe
```

## TripleThink Architecture Overview

### Core Concepts

**Event-Sourced Architecture:**
- Immutable event log as single source of truth
- Nothing is "edited" - only new events are added
- Time-travel queries by replaying events
- Every state change has timestamp and causal reference

**Three Layers of Reality:**
```
LAYER 1: World Truth (What Actually Happened)
    ↓
LAYER 2: Character Perception (What Each Character Believes)
    ↓
LAYER 3: Narrative Presentation (What Reader Sees When)
```

**Separated Metadata Architecture:**
- Entities table (lean): Core facts only, loaded by default
- Metadata table (rich): Author notes, AI guidance, loaded on-demand
- `read_metadata_mandatory` flag determines loading behavior
- 87% token savings for simple queries

**ID-Based Referencing:**
- Every entity has unique ID: `char-name`, `evt-description`, `fact-id`
- No data duplication - reference by ID
- Changes propagate automatically

### Key Entity Types

**World Events:**
- Objective timeline of what actually happened
- Multi-phase structure for complex events
- Facts created, state changes, causal links
- Participant tracking

**Characters:**
- Identity and core traits
- Knowledge state timeline (epistemic tracking)
- Relationship timeline
- State timeline

**Fictions:**
- False narrative systems with specific target audiences
- Facts contradicted
- Exposure/collapse triggers
- Must maintain strict audience boundaries

**Epistemic State Tracking:**
- Who knows what, when, and with what confidence
- Belief vs. ground truth
- Source of knowledge
- False beliefs explicitly tracked

### Critical System Rules

1. **Single Source of Truth** - Each fact exists in exactly one place
2. **No Duplication** - Reference by ID, never copy data
3. **Immutable Events** - Add new events, never edit existing ones
4. **Epistemic Precision** - Always track who knows/believes what at each point
5. **Fiction Isolation** - Each fiction has explicit target audience; never expand scope

## Development Commands

### Docker Environment

Build the Docker image:
```bash
docker build -t triple-think .
```

Run the container (Windows CMD):
```cmd
docker run -it ^
  -v "C:\Users\facra\OneDrive\Documents\AI Agent\claude\TripleThink:/app" ^
  -v "%USERPROFILE%\.claude:/root/.claude" ^
  -p 3000:3000 ^
  -p 8080:8080 ^
  triple-think
```

Run the container (Linux/Mac):
```bash
docker run -it \
  -v "$(pwd):/app" \
  -v ~/.claude:/root/.claude \
  -p 3000:3000 \
  -p 8080:8080 \
  triple-think
```

### Git Operations

Standard git workflow:
```bash
git status
git add .
git commit -m "Description"
git push
```

## Implementation Status

### Technology Decisions (Finalized)

✅ **Database:** SQLite (better-sqlite3)
- Portable, single-file database
- Perfect for desktop/local use
- Full SQL support with good performance

✅ **API:** Node.js with Express 4.x
- RESTful API design
- Comprehensive error handling
- Middleware for auth, caching, rate-limiting

✅ **GUI:** Plain HTML/CSS/JavaScript
- No framework dependencies
- Fast and lightweight
- Served via `serve` package

### Key Features (Implemented)

✅ **Core Functionality:**
- Epistemic query engine (who knows what when)
- Time-travel queries (entity state at timestamp T)
- Fiction audience constraint validation
- Metadata loading optimization
- Token-efficient AI query interface
- Project management (multi-book support)
- Character tracking with knowledge states
- Event timeline with causal links
- Search and filtering
- Export/import functionality

**Performance Targets:**
- Support 10-book series (2,000+ events, 150+ characters)
- Get entity by ID: < 10ms
- Epistemic queries: < 100ms
- Complex joins: < 200ms

**Current Implementation:**
- Fully functional REST API with comprehensive endpoints
- Web-based GUI with multiple screens (Projects, Timeline, Narrative, Epistemic)
- SQLite database with optimized schema
- Authentication and rate-limiting middleware
- AI integration layer for natural language queries

### Token Efficiency

**Leverage separated metadata:**
- Simple fact lookups: Skip metadata (87% savings)
- Writing scenes: Load mandatory metadata only
- Bulk operations: Load metadata selectively

**Query patterns:**
```
"What does Character X know about Event Y at time T?"
→ Query character's knowledge_state at timestamp
→ Returns only relevant epistemic data

"Find all events involving Character X"
→ Query events_by_participant index
→ Returns lean event list
```

## Documentation Standards

### Problem/Solution Tracking
Document solved technical problems in `/dev/problems-solved.md`:
- Problem description
- Investigation steps
- Actual solution that worked

### Work Session Tracking
Track work in `/dev/work/yyyymmdd-HHmm-title.md` files:
- Format: `yyyymmdd-HHmm` (24-hour time) + descriptive title
- Example: `/dev/work/20260109-1430-database-schema-design.md`
- Include: task overview, decisions made, blockers, outcomes

## Critical Reminders for Claude

### Environment Context
- **Running in Docker on Windows 11** - You are inside a Linux container, but user is on Windows
- **Volume mounts** - Files you modify persist to Windows filesystem at `C:\Users\facra\OneDrive\Documents\AI Agent\claude\TripleThink`
- **Ports** - API on 3000, GUI on 8080 (mapped to host)
- **Database location** - `/app/api/triplethink.db` (SQLite, persists to Windows)

### Architecture Principles
- **Event-sourcing** - Never edit events, only add new ones
- **Separated metadata** - Load on-demand for token efficiency
- **Epistemic precision** - Always track who knows/believes what at each timestamp
- **ID-based references** - No data duplication, reference by ID
- **Fiction isolation** - Never expand target audiences without explicit design

### Common Tasks
- **Start app in Docker**: `./start.sh` or manually start API and GUI servers
- **Start app on Windows**: Run API (`node server.js`) and GUI (`npx serve -s gui -l 8080`) in separate terminals
- **Check if running**: Visit http://localhost:8080 for GUI, http://localhost:3000 for API
- **Database queries**: Use SQLite at `/app/api/triplethink.db`
- **Logs**: API logs to console, check terminal running `node server.js`

### When Helping User
- User hasn't seen app running yet - priority is getting it to launch successfully
- Check for missing dependencies before running
- If errors occur, check both API and GUI server logs
- Windows users need Node.js installed for native execution
- Docker users just need `./start.sh` to work
