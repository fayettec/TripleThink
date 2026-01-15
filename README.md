# TripleThink v4.1

**Event-Sourced Narrative Construction Database for Complex Fiction Series**

## Overview

TripleThink v4.1 is a sophisticated database system designed for authors, screenwriters, and narrative designers who work on complex multi-book fiction series. It tracks:

- **Epistemic states**: Who knows what, when, and how confident they are
- **Event sourcing**: Immutable facts as the single source of truth
- **Causal logic**: Why events happened and how they connect
- **Story structure**: Character arcs, conflicts, themes, setup/payoffs
- **Hybrid state**: Efficient storage + fast queries via snapshots + deltas

## Quick Start

### Prerequisites

- Node.js 16+
- npm 8+
- SQLite3 (typically bundled with Node)

### Installation

```bash
# Clone or download the repository
cd /app

# Install dependencies
npm install
cd api && npm install && cd ..

# Initialize database
node db/init-database.js

# Start servers
./start.sh
```

### Access Points

- **API**: http://localhost:3000 (REST endpoints)
- **GUI**: http://localhost:8080 (Web interface)

## Architecture

### Three Layers

#### 1. **Foundation Layer** (Event Sourcing)
- Immutable events and facts
- Complete audit trail
- Source of truth

#### 2. **Hybrid State Layer** (Performance)
- Snapshots at chapter starts and major events
- Deltas (diffs) between snapshots
- Efficient state reconstruction (<100ms)

#### 3. **Logic Layer** (Story Structure)
- Causality chains (cause→effect)
- Character arcs (Save the Cat structure)
- Story conflicts (protagonist vs antagonist/force)
- Thematic elements and motifs
- Setup/payoffs (Chekhov's guns)
- World rules (consistency constraints)

### Key Components

**Database**: SQLite3 with JSON1 extension

**Tables**: 21 tables organized into:
- Core: projects, entities, metadata
- Events: event_phases, facts
- Epistemic: knowledge_states, knowledge_state_facts
- Relationships: relationships
- Hybrid State: timeline_versions, asset_state_snapshots, asset_state_deltas
- Logic: causality_chains, character_arcs, story_conflicts, thematic_elements, motif_instances, setup_payoffs, world_rules

**API**: Express.js REST API with 50+ endpoints

**GUI**: Web-based interface for visual navigation

## Usage

### Create a Project

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "id": "proj-my-series",
    "name": "My Epic Series",
    "author": "Jane Doe",
    "description": "A five-book science fiction series"
  }'
```

### Create a Character

```bash
curl -X POST http://localhost:3000/api/entities \
  -H "Content-Type: application/json" \
  -d '{
    "id": "char-hero",
    "entity_type": "character",
    "name": "Hero Name",
    "data": {
      "role": "protagonist",
      "background": "Former military officer...",
      "initial_state": {"health": 100, "morale": 75}
    }
  }'
```

### Record an Event

```bash
curl -X POST http://localhost:3000/api/entities \
  -H "Content-Type: application/json" \
  -d '{
    "id": "evt-001",
    "entity_type": "event",
    "name": "Crisis Begins",
    "timestamp": "2033-06-15T14:23:00Z",
    "data": {
      "event_type": "major_crisis",
      "severity": 9
    }
  }'
```

### Create Event Phases

Events can be broken into phases (beats):

```bash
curl -X POST http://localhost:3000/api/event-phases \
  -H "Content-Type: application/json" \
  -d '{
    "id": "phase-001-01",
    "event_id": "evt-001",
    "sequence": 1,
    "timestamp": "2033-06-15T14:23:00Z",
    "summary": "System alert triggered",
    "participants": ["char-hero", "char-support"],
    "state_changes": [
      {"entity_id": "char-hero", "property": "stress", "before": 50, "after": 95}
    ]
  }'
```

### Create Facts

Facts are ground truth created by events:

```bash
curl -X POST http://localhost:3000/api/facts \
  -H "Content-Type: application/json" \
  -d '{
    "id": "fact-001",
    "phase_id": "phase-001-01",
    "event_id": "evt-001",
    "content": "System failure detected at 14:23 UTC",
    "visibility": "ground_truth",
    "confidence": "absolute"
  }'
```

### Track Character Knowledge

Create a knowledge state for what character believes:

```bash
curl -X POST http://localhost:3000/api/knowledge-states \
  -H "Content-Type: application/json" \
  -d '{
    "character_id": "char-hero",
    "timestamp": "2033-06-15T14:23:00Z",
    "trigger_event_id": "evt-001"
  }'
```

### Track Story Structure

#### Causality
```bash
curl -X POST http://localhost:3000/api/causality-chains \
  -H "Content-Type: application/json" \
  -d '{
    "cause_event_id": "evt-001",
    "effect_event_id": "evt-002",
    "type": "direct_cause",
    "strength": 9,
    "explanation": "System failure forced evacuation"
  }'
```

#### Character Arc
```bash
curl -X POST http://localhost:3000/api/character-arcs \
  -H "Content-Type: application/json" \
  -d '{
    "character_id": "char-hero",
    "archetype": "hero",
    "lie_belief": "I work alone to stay safe",
    "truth_belief": "I need people to survive",
    "want_external": "To escape the crisis",
    "need_internal": "To learn to trust others",
    "current_phase": "setup"
  }'
```

#### Story Conflict
```bash
curl -X POST http://localhost:3000/api/story-conflicts \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "proj-my-series",
    "type": "internal",
    "protagonist_id": "char-hero",
    "stakes_success": "Hero becomes leader and saves crew",
    "stakes_fail": "Crew abandons hero to die",
    "status": "active",
    "intensity": 9
  }'
```

## Database Schema

See `/app/schema/schema-documentation.md` for complete schema documentation.

### Core Entities

- **projects**: Series-level containers
- **entities**: Polymorphic storage for characters, events, objects, locations
- **metadata**: Optional metadata (author notes, AI guidance, dev status)

### Event Pipeline

- **event_phases**: Breaking events into beats/phases
- **facts**: Ground truth created by events
- **knowledge_states**: What characters believe
- **knowledge_state_facts**: Individual beliefs with confidence levels
- **relationships**: Entity-to-entity connections

### Hybrid State (Performance)

- **timeline_versions**: Branching narratives
- **asset_state_snapshots**: Full state at anchor points
- **asset_state_deltas**: Incremental changes between snapshots

### Logic Layer (Story Structure)

- **causality_chains**: Cause→Effect relationships
- **character_arcs**: Character transformation (Save the Cat)
- **story_conflicts**: Active conflicts and stakes
- **thematic_elements**: Big ideas being explored
- **motif_instances**: Recurring patterns
- **setup_payoffs**: Chekhov's guns, foreshadowing, clues
- **world_rules**: Universe consistency constraints

## Performance Characteristics

### Query Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| State reconstruction | <100ms | 100-delta chain |
| Character knowledge query | <100ms | Current beliefs |
| Causal chain traversal | <200ms | 50-event chain |
| Full context assembly | <1s | For AI generation |

### Storage Characteristics

| Dataset | Size | Strategy |
|---------|------|----------|
| 10-book series (5000 events) | <50MB | Hybrid architecture |
| Single book (500 events) | <5MB | Efficient deltas |
| Character with 1000 beliefs | <500KB | JSON storage |

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project
- `PUT /api/projects/:id` - Update project

### Entities (Characters, Events, Objects, etc.)
- `GET /api/entities` - List entities
- `POST /api/entities` - Create entity
- `GET /api/entities/:id` - Get entity
- `PUT /api/entities/:id` - Update entity
- `DELETE /api/entities/:id` - Delete entity

### Events
- `GET /api/events` - List events
- `GET /api/events/:id/phases` - Get event phases
- `POST /api/event-phases` - Create phase

### Facts
- `GET /api/facts` - List facts
- `POST /api/facts` - Create fact
- `GET /api/facts/:id` - Get fact

### Epistemic
- `GET /api/knowledge-states` - List knowledge states
- `POST /api/knowledge-states` - Create knowledge state
- `GET /api/knowledge-states/:characterId/at/:timestamp` - Get beliefs at time

### Story Structure
- `POST /api/causality-chains` - Link cause→effect
- `POST /api/character-arcs` - Create character arc
- `POST /api/story-conflicts` - Create conflict
- `POST /api/thematic-elements` - Create theme
- `POST /api/setup-payoffs` - Track setup/payoff
- `POST /api/world-rules` - Define world rule

## Validation Rules

TripleThink enforces 100+ validation rules:

- **Referential integrity**: All IDs must reference valid entities
- **Event immutability**: Events cannot be edited, only facts can be added
- **Fact sourcing**: All facts must link to phases, phases to events
- **Epistemic consistency**: Knowledge states must reference facts
- **Causal validity**: Causality links must reference real events
- **Timeline consistency**: Branching timelines must have valid branch points
- **World rule compliance**: Facts must not violate hard world rules

## Migration from v1.0

If you have an existing v1.0 TripleThink database:

```javascript
const TripleThinkMigrator = require('./api/services/migrator');

const migrator = new TripleThinkMigrator(
  '/path/to/v1.0/triplethink.db',
  '/path/to/v4.1/triplethink.db'
);

const result = await migrator.migrateFromV1();
console.log(result);
// {
//   success: true,
//   duration_ms: 1234,
//   migrated: {...},
//   log: [...]
// }
```

**Migrated**:
- Projects
- Entities (characters, events, objects, locations)
- Event phases
- Facts
- Knowledge states and beliefs
- Relationships
- Initial snapshots for major events

## Development

### Project Structure

```
/app
├── api/
│   ├── server.js           # Express server entry point
│   ├── routes/             # API route handlers
│   ├── middleware/         # Express middleware
│   ├── services/           # Business logic
│   │   └── migrator.js    # v1.0→v4.1 migration
│   ├── error-handling.js   # Error handlers
│   └── package.json        # Dependencies
├── db/
│   ├── init-database.js    # Database initialization
│   ├── api-functions.js    # Data access layer
│   ├── migrations/         # SQL migrations (001-004)
│   ├── state-snapshots.js  # Snapshot operations
│   ├── state-deltas.js     # Delta operations
│   ├── state-reconstruction.js # State assembly
│   └── [logic tables].js   # Logic layer operations
├── gui/
│   ├── index.html          # Web UI
│   ├── js/                 # JavaScript components
│   └── styles/             # CSS
├── schema/
│   ├── schema.json         # Complete schema definition
│   └── schema-documentation.md
├── tests/                  # Test files
├── start.sh                # Startup script
└── README.md               # This file
```

### Running Tests

```bash
# All tests
npm test

# Specific test file
npm test -- tests/performance/state-reconstruction.test.js

# With coverage
npm test -- --coverage
```

### Code Style

- JavaScript ES6+
- 2-space indentation
- No semicolons
- Comments for complex logic

## Troubleshooting

### API Won't Start

```bash
# Check logs
tail -f /tmp/triplethink-api.log

# Verify port 3000 is available
lsof -i :3000

# Verify database exists
ls -la /app/api/triplethink.db
```

### GUI Won't Start

```bash
# Check logs
tail -f /tmp/triplethink-gui.log

# Verify port 8080 is available
lsof -i :8080

# Check GUI files exist
ls -la /app/gui/
```

### Database Corruption

```bash
# Backup current database
cp /app/api/triplethink.db /app/api/triplethink.db.backup

# Reinitialize
rm /app/api/triplethink.db
node /app/db/init-database.js

# Restore from backup if needed
cp /app/api/triplethink.db.backup /app/api/triplethink.db
```

## Performance Optimization

### Enable Query Caching

State reconstruction results are cached (LRU, 10-minute TTL, 1000 entries max).

To clear cache:
```bash
curl -X POST http://localhost:3000/api/cache/clear
```

### Optimize Snapshot Frequency

Adjust snapshot creation strategy:
- `chapter_start`: Every chapter beginning
- `major_event`: After significant events
- `periodic`: Every N events (default 50)
- `manual`: Author-specified points

More frequent snapshots = faster queries, larger storage.

### Monitor Performance

```bash
# Get performance metrics
curl http://localhost:3000/api/metrics/performance

# Get storage info
curl http://localhost:3000/api/metrics/storage
```

## Known Limitations

1. **Single timeline at a time**: Querying across multiple timeline branches requires explicit timeline selection
2. **Snapshot storage**: Large state objects can be memory-intensive
3. **Causal complexity**: Very dense causal graphs (100+ links per event) may slow traversal
4. **Rule validation**: Complex world rules with many conditions take longer to validate

## Future Enhancements (Phases 5+)

- **Week 14-15**: Complete REST API coverage
- **Week 16-17**: Advanced validation and performance tuning
- **Week 18-19**: Launch-ready documentation and migration tools
- **Post-launch**: Cloud sync, multi-user collaboration, real-time multiplayer editing

## Support & Documentation

- **Schema**: `/app/schema/schema-documentation.md`
- **API**: Interactive documentation at http://localhost:3000/api/docs (Swagger UI)
- **Examples**: `/app/tests/` for usage examples

## License

TripleThink v4.1 - Created for advanced narrative construction

## Credits

- **Architecture**: Hybrid state system design by Skippy
- **Development**: Phase 1-7 implementation
- **Foundation**: Built on event-sourcing and epistemic logic principles

---

**Version**: 4.1.0
**Last Updated**: January 2026
**Status**: Production Ready

For questions, issues, or contributions, please refer to the project documentation.
