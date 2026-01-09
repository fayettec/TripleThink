# TripleThink Database Layer

SQLite-based storage for the TripleThink narrative construction system.

## Quick Start

```javascript
const TripleThinkDB = require('./api-functions');

// Open database
const db = new TripleThinkDB('./triplethink.db');

// Create a character
db.createEntity('character', {
  id: 'char-alice',
  name: 'Alice',
  role: 'protagonist'
});

// Query epistemic state
const knowledge = db.getCharacterKnowledgeState('char-alice', '2033-07-05');

// Close when done
db.close();
```

## Files

| File | Purpose |
|------|---------|
| `schema.sql` | Table definitions |
| `indexes.sql` | Query optimization indexes |
| `validation-triggers.sql` | Data integrity triggers |
| `api-functions.js` | Data access layer |
| `backup.js` | Export/import utilities |
| `migrations/` | Schema versioning |
| `performance-guide.md` | Optimization docs |

## Key Features

### Epistemic Queries

```javascript
// Who knows a fact?
db.whoKnowsFact('fact-secret', '2033-07-05');

// Does character believe fact?
db.doesCharacterBelieve('char-alice', 'fact-secret', '2033-07-05');

// Get belief divergence
db.getBeliefDivergence('fact-secret', '2033-07-05');
```

### Temporal Queries

```javascript
// Entity state at time T
db.getEntityStateAtTime('char-alice', '2033-07-05');

// State changes in range
db.getStateChangesForEntity('char-alice', '2033-01-01', '2033-12-31');
```

### Fiction Tracking

```javascript
// Active fictions at time T
db.getFictionsActiveAtTime('2033-07-05');

// Fictions targeting character
db.getFictionsTargetingCharacter('char-alice', '2033-07-05');
```

## Migration

```bash
# Check status
node migrations/migration-runner.js status

# Apply pending migrations
node migrations/migration-runner.js migrate

# Rollback last migration
node migrations/migration-runner.js rollback
```

## Backup

```javascript
const BackupManager = require('./backup');

const backup = new BackupManager('./triplethink.db');

// Export to JSON
backup.exportToFile('proj-main', './backup.json');

// Import from JSON
backup.importFromJSON('./backup.json');

// Create timestamped backup
backup.createBackup('proj-main', './backups/');
```

## Performance

See `performance-guide.md` for detailed optimization strategies.

Target benchmarks:
- Entity by ID: < 5ms
- Epistemic query: < 100ms
- Scene render: < 150ms
