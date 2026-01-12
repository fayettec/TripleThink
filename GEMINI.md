# TripleThink

TripleThink is a narrative construction system for managing multi-book fiction series. It uses an event-sourced architecture to track "who knows what, when," allowing for complex narrative analysis and consistency checking.

## Project Overview

The project is a three-tier web application:

*   **GUI (Graphical User Interface):** A single-page application built with HTML, CSS, and vanilla JavaScript. It provides a user-friendly interface for authors to manage their narrative data, including events, characters, and "fictions" (false narratives).
*   **API (Application Programming Interface):** A RESTful API built with Node.js and Express. It provides endpoints for creating, reading, updating, and deleting narrative entities, as well as specialized endpoints for epistemic (knowledge-based) and temporal (time-based) queries.
*   **Database:** A SQLite database that stores all narrative data. The schema is designed to support the event-sourced architecture and includes tables for entities, events, facts, knowledge states, and more.

## Core Concepts

### Event-Sourced Architecture
- Immutable event log as single source of truth
- Nothing is "edited" - only new events are added
- Time-travel queries by replaying events
- Every state change has timestamp and causal reference

### Three Layers of Reality
1.  **World Truth:** What actually happened.
2.  **Character Perception:** What each character believes.
3.  **Narrative Presentation:** What the reader sees and when.

### Separated Metadata Architecture
- **Entities table (lean):** Core facts only, loaded by default.
- **Metadata table (rich):** Author notes, AI guidance, loaded on-demand.
- `read_metadata_mandatory` flag determines loading behavior.
- This approach can result in significant token savings for simple queries.

### ID-Based Referencing
- Every entity has a unique ID (e.g., `char-name`, `evt-description`, `fact-id`).
- Data is not duplicated; entities are referenced by their ID.

## Key Entity Types

*   **World Events:** The objective timeline of what actually happened.
*   **Characters:** Entities that can perceive, act, and hold beliefs.
*   **Fictions:** False narrative systems with specific target audiences.
*   **Epistemic State:** Tracks who knows what, when, and with what confidence.

## Critical System Rules

1.  **Single Source of Truth:** Each fact exists in exactly one place.
2.  **No Duplication:** Reference by ID, never copy data.
3.  **Immutable Events:** Add new events, never edit existing ones.
4.  **Epistemic Precision:** Always track who knows/believes what at each point.
5.  **Fiction Isolation:** Each fiction has an explicit target audience; its scope should not be expanded.

## Building and Running

### Prerequisites

*   Node.js (version 18 or higher)
*   npm (Node Package Manager)

### Running the Application

1.  **Start the API Server:**

    ```bash
    cd /app/api
    npm install
    npm start
    ```

    The API server will be running at `http://localhost:3000`.

2.  **Open the GUI:**

    Open the `gui/index.html` file in a web browser. The GUI will connect to the API server running on `localhost:3000`.

## Development Conventions

### Code Style

*   **API:** The API code follows standard JavaScript conventions. `eslint` is used for linting.
*   **Database:** The database schema is defined in `db/schema.sql`. SQL statements are written in uppercase.

### Testing

*   **API:** Integration tests for the API are located in `api/tests/integration-tests.js` and can be run with `npm test` in the `api` directory. The tests use Jest and Supertest.

### Key Commands

*   `npm install`: Install dependencies for the API.
*   `npm start`: Start the API server.
*   `npm run dev`: Start the API server in development mode with `nodemon`.
*   `npm test`: Run the API integration tests.
*   `npm run lint`: Lint the API code.
*   `node db/migrations/migration-runner.js status`: Check the status of database migrations.
*   `node db/migrations/migration-runner.js migrate`: Apply pending database migrations.
