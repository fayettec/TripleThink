# TripleThink v4.1 Usage Manual (AI & Human)

## 1. Introduction
TripleThink v4.1 is an event-sourced narrative engine designed to manage complex, multi-book fiction series. It tracks "who knows what, when" using a sophisticated epistemic model and provides an orchestration layer for generating narrative content.

**Current Status:** Production Ready (Phase 7 Complete).
**Version:** 4.1.0

## 2. Architecture Overview

### Three Layers of Reality
1.  **Foundation Layer (Ground Truth):** Event sourcing with immutable facts. The objective "what happened."
2.  **Hybrid State Layer (Performance):** Uses "Snapshots" (full state at anchor points) and "Deltas" (changes) to allow <100ms state reconstruction.
3.  **Logic Layer (Story Structure):** Tracks narrative meta-structures:
    *   **Causality:** Cause-and-effect chains.
    *   **Arcs:** Character development (Save the Cat structure).
    *   **Conflicts:** Protagonist vs. Antagonist dynamics.
    *   **Themes & Motifs:** Abstract concepts and recurring patterns.

### Key Systems
*   **Epistemic System:** Tracks character knowledge, beliefs, and false beliefs (who knows what, when).
*   **Orchestrator:** An AI-focused service that assembles all necessary context for a scene into a single JSON packet.
*   **Context Matrix:** Tracks relationships, dialogue profiles, and social dynamics.

## 3. Getting Started (Humans)

### Prerequisites
*   Node.js v18+
*   npm
*   SQLite3

### Installation
```bash
cd /app/TripleThink
npm install
```

### Database Setup
Initialize the database and apply migrations:
```bash
node db/init-database.js
```

### Running the System
TripleThink includes a production startup script that launches both the API (port 3000) and GUI (port 8080).
```bash
./start.sh
```
*   **API:** `http://localhost:3000`
*   **GUI:** `http://localhost:8080`

### Migration
To migrate from v1.0:
```javascript
const TripleThinkMigrator = require('./api/services/migrator');
const migrator = new TripleThinkMigrator('/path/to/v1.0.db', '/path/to/v4.1.db');
await migrator.migrateFromV1();
```

## 4. AI Integration Guide

AI agents interact with TripleThink primarily through the **AI Functions** and **Orchestrator** endpoints.

### AI-Optimized Endpoints (`/api/ai`)
These endpoints are designed as MCP-style functions for direct LLM usage.

*   `GET /api/ai/context/:sceneId`
    *   **Returns:** Complete narrative context packet (POV, knowledge, relationships, pacing).
    *   **Use for:** Generating scene text or analyzing a specific moment.
*   `GET /api/ai/knowledge/:entityId?timestamp=...`
    *   **Returns:** Detailed belief state of a character.
    *   **Use for:** Checking if a character knows a secret or has a false belief.
*   `GET /api/ai/causality/:eventId`
    *   **Returns:** Upstream causes and downstream effects.
    *   **Use for:** Understanding "why" something happened.
*   `POST /api/ai/validate`
    *   **Returns:** Consistency report for a set of narrative facts.
    *   **Use for:** Checking if a proposed plot twist contradicts established lore.

### The Orchestrator (`/api/orchestrator`)
(Alias for `/api/ai/context`)
*   **Payload Includes:**
    *   POV Character details & Epistemic State
    *   Present characters & their current states
    *   Active Story Conflicts & Thematic elements
    *   Relationship dynamics (trust, affection, power)
    *   Recent relevant events & Pacing directives

## 5. API Reference (Key Endpoints)

### State Management
*   `POST /api/state/events` - Submit a new event (moves time forward).
*   `GET /api/state/:assetId/at/:eventId` - Time-travel: Get state at a specific past event.

### Logic Layer
*   `POST /api/logic/causality-chains` - Link cause → effect.
*   `POST /api/logic/character-arcs` - Define/Update character arcs.
*   `POST /api/logic/story-conflicts` - Manage narrative tension.
*   `POST /api/logic/setup-payoffs` - Track Chekhov's guns.

### Epistemic & Context
*   `GET /api/epistemic/divergence/:charA/:charB` - Find knowledge gaps between characters (e.g., Dramatic Irony).
*   `GET /api/temporal/timeline/:id` - Navigate branching timelines.

### System
*   `GET /api/search?q=...` - Semantic/Full-text search.
*   `GET /api/export` - Export project data.

## 6. Directory Structure
*   `api/` - Express server, routes, and services.
    *   `services/migrator.js` - Migration logic.
    *   `routes/ai.js` - AI-specific endpoints.
*   `db/` - Database logic and modules.
    *   `migrations/` - SQL schema definitions (001-004).
*   `gui/` - Web frontend (served on port 8080).
*   `schema/` - JSON schema and detailed documentation.
*   `tests/` - Unit, Integration, and E2E tests.

## 7. Performance Targets
*   **State Reconstruction:** <100ms (Hybrid State)
*   **Context Assembly:** <1s
*   **Storage:** <50MB for a 10-book series.

## 8. Troubleshooting
*   **"Database not found":** Run `node db/init-database.js`.
*   **"Port in use":** Check if `start.sh` is already running or edit the ports in the script.
*   **Performance:** The system automatically manages snapshots. If queries are slow, ensure `asset_state_snapshots` is populating.