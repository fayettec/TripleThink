# TripleThink Database Layer - File Index

## Quick Navigation

### Core Database Files

#### Schema Definition
- **`schema.sql`** (280 lines) - Complete database schema with 16 tables
  - Tables: projects, metadata, entities, event_phases, facts, knowledge_states, knowledge_state_facts, relationships, state_timeline, fictions, causal_links, narrative_structure, scenes, scene_events, event_participants, schema_migrations
  - PRAGMA settings for performance
  - Foreign key relationships

#### Indexes
- **`indexes.sql`** (64 lines) - 25+ optimized indexes
  - Primary indexes for epistemic queries
  - Composite indexes for temporal queries
  - Participant lookup optimization

#### Data Integrity
- **`validation-triggers.sql`** (88 lines) - 9 validation triggers
  - Automatic timestamp management
  - Temporal consistency checks
  - State validation

### JavaScript Implementation

#### Data Access Layer
- **`api-functions.js`** (745 lines) - TripleThinkDB class
  - CRUD operations
  - Epistemic query engine
  - Temporal queries
  - Fiction management
  - Transaction support
  - Exports: `TripleThinkDB` class

#### Backup & Export
- **`backup.js`** (337 lines) - BackupManager class
  - JSON export/import
  - Timestamped backups
  - Dependency-ordered restoration
  - Exports: `BackupManager` class

### Database Management

#### Migrations
- **`migrations/001_initial_schema.sql`** (280 lines) - Initial migration
  - Complete schema as first migration
  - Versioning support

- **`migrations/migration-runner.js`** (197 lines) - MigrationRunner class
  - Automatic migration discovery
  - Version tracking
  - Rollback capability
  - CLI interface
  - Exports: `MigrationRunner` class

### Documentation

#### Reference Guides
- **`README.md`** (111 lines) - Quick reference
  - Quick start examples
  - API overview
  - Common operations
  - Performance targets

- **`performance-guide.md`** (155 lines) - Optimization guide
  - Performance targets and benchmarks
  - Index strategy explained
  - Query optimization patterns
  - Memory considerations
  - Scaling recommendations

#### Implementation Info
- **`IMPLEMENTATION_SUMMARY.md`** (184 lines) - Implementation overview
  - Files delivered
  - Architecture highlights
  - Performance metrics
  - Compliance checklist

- **`INDEX.md`** (this file) - File navigation guide

## File Organization

```
/app/db/
├── Database Files (SQL)
│   ├── schema.sql
│   ├── indexes.sql
│   └── validation-triggers.sql
│
├── API Layer (JavaScript)
│   ├── api-functions.js
│   └── backup.js
│
├── Database Management
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── migration-runner.js
│
└── Documentation
    ├── README.md
    ├── performance-guide.md
    ├── IMPLEMENTATION_SUMMARY.md
    └── INDEX.md
```

## Usage Quick Links

### Initialize Database
```bash
node migrations/migration-runner.js migrate
```

### Use Data Layer
```javascript
const TripleThinkDB = require('./api-functions');
const db = new TripleThinkDB('./triplethink.db');
```

### Query Examples
```javascript
// Epistemic: Who knows what?
db.whoKnowsFact('fact-id', '2033-07-05');

// Temporal: State at time T
db.getEntityStateAtTime('char-id', '2033-07-05');

// Fiction: Active fictions
db.getFictionsActiveAtTime('2033-07-05');
```

### Backup/Restore
```javascript
const BackupManager = require('./backup');
const bm = new BackupManager('./triplethink.db');
bm.createBackup('proj-main');
```

## Key Statistics

| Metric | Value |
|--------|-------|
| Total Files | 9 |
| Total Lines | 2,441 |
| SQL Lines | 712 |
| JavaScript Lines | 1,279 |
| Documentation Lines | 450 |
| Tables | 16 |
| Indexes | 25+ |
| Triggers | 9 |
| API Methods | 30+ |

## Next Steps

1. **Test**: Load schema and test queries
2. **Integrate**: Connect with PROMPT_03 (API endpoints)
3. **Benchmark**: Run performance tests
4. **Deploy**: Integrate with PROMPT_04 (GUI)

## Architecture Compliance

- ✓ Event-sourcing design
- ✓ Separated metadata architecture
- ✓ Epistemic state tracking
- ✓ Fiction isolation
- ✓ Temporal queries
- ✓ Causal link tracking
- ✓ Three layers of reality

## Support Files

All files contain comprehensive inline documentation:
- SQL files have detailed comments explaining each table and trigger
- JavaScript files have JSDoc comments for all methods
- Markdown files provide examples and explanations

See individual files for detailed documentation.
