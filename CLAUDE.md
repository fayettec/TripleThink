# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is the **design and planning repository** for TripleThink, an event-sourced narrative construction system for managing multi-book fiction series. TripleThink is the evolution of Cawa (Claude Author Writing Assistant).

**Current Status**: This repository contains architectural specifications and build prompts. The actual TripleThink application has not been implemented yet.

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

Build and run the Docker container:
```bash
docker build -t triplethink-dev .
docker run -it -v $(pwd):/app triplethink-dev
```

### Git Operations

Standard git workflow:
```bash
git status
git add .
git commit -m "Description"
git push
```

## Working with BuildPrompts

The four prompts are designed to be executed sequentially:

1. **PROMPT_01** → Generate complete JSON schema with separated metadata
2. **PROMPT_02** → Design database schema (evaluate SQLite vs PostgreSQL)
3. **PROMPT_03** → Design REST API and AI query interface
4. **PROMPT_04** → Design GUI (evaluate React vs Svelte vs plain HTML)

When implementing, follow the sequence and ensure each stage is complete before proceeding.

## Implementation Guidance

### When Building the System

**Technology Decisions Needed:**
- Database: SQLite (portable) vs PostgreSQL (powerful)
- API: Node.js/Express vs Python/FastAPI vs Go
- GUI: Plain HTML vs React vs Svelte vs Electron

**Key Features to Implement:**
- Epistemic query engine (who knows what when)
- Time-travel queries (entity state at timestamp T)
- Fiction audience constraint validation
- Metadata loading optimization
- Token-efficient AI query interface

**Performance Targets:**
- Support 10-book series (2,000+ events, 150+ characters)
- Get entity by ID: < 10ms
- Epistemic queries: < 100ms
- Complex joins: < 200ms

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

## Future Directory Structure

When implementation begins, expected structure:
```
/schema/          - JSON schema definitions
/db/              - Database schema and migrations
/api/             - API implementation
/gui/             - Frontend application
/docs/            - Documentation
/tests/           - Test suites
/examples/        - Example projects
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

## Critical Reminders

- **This is a design repository** - Implementation does not exist yet
- **Follow sequential prompts** - Each builds on previous stage
- **Maintain architectural principles** - Event-sourcing, separated metadata, epistemic precision
- **Token efficiency matters** - Optimize for AI query patterns
- **Fiction scope is critical** - Never expand target audiences without explicit design
- **Epistemic consistency** - Always track who knows/believes what at each timestamp
