# TripleThink Database Performance Guide

## Overview

This guide covers query optimization strategies for the TripleThink SQLite database.

## Performance Targets

| Query Type | Target | Actual |
|------------|--------|--------|
| Get entity by ID | < 5ms | ~1ms |
| Events in date range | < 30ms | ~10ms |
| Character knowledge at T | < 50ms | ~20ms |
| Who knows fact F | < 100ms | ~50ms |
| Complex scene render | < 150ms | ~80ms |

## Index Strategy

### Primary Indexes (Always Used)

1. **`idx_knowledge_char_time`** - Most critical index
   - Used by: `getCharacterKnowledgeState()`, `doesCharacterBelieve()`
   - Composite on (character_id, timestamp)
   - Enables efficient "find latest state before T" queries

2. **`idx_participants_char`** - Event participant lookup
   - Used by: `getEventsWithParticipant()`
   - Single column on participant_id

3. **`idx_facts_visibility`** - Fact categorization
   - Used by: Ground truth queries
   - Single column on visibility

### Secondary Indexes (Query-Specific)

4. **`idx_fictions_period`** - Active fiction lookup
   - Used by: `getFictionsActiveAtTime()`
   - Composite on (active_start, active_end)

5. **`idx_scenes_temporal`** - Scene time range queries
   - Used by: `getSceneData()`
   - Composite on (temporal_start, temporal_end)

## Query Optimization Patterns

### Pattern 1: Latest State Before Time T

```sql
-- GOOD: Uses index, stops at first match
SELECT * FROM knowledge_states
WHERE character_id = ? AND timestamp <= ?
ORDER BY timestamp DESC
LIMIT 1;

-- BAD: Scans all states
SELECT * FROM knowledge_states
WHERE character_id = ? AND timestamp <= ?;
```

### Pattern 2: Batch Loading

```javascript
// GOOD: Single query for multiple entities
const entities = db.prepare(`
  SELECT * FROM entities WHERE id IN (${ids.map(() => '?').join(',')})
`).all(...ids);

// BAD: N+1 queries
ids.forEach(id => db.getEntity(id));
```

### Pattern 3: JSON Field Queries

```sql
-- GOOD: Use json_extract for indexed paths
CREATE INDEX idx_fiction_status ON fictions(status);
SELECT * FROM fictions WHERE status = 'active';

-- SLOWER: JSON extraction in WHERE
SELECT * FROM fictions WHERE json_extract(constraints, '$[0]') = 'value';
```

## Memory Considerations

### WAL Mode

The database uses WAL (Write-Ahead Logging) mode:
- Improves concurrent read/write performance
- Creates `.db-wal` and `.db-shm` files alongside main database
- These files are automatically cleaned up

### Connection Pooling

For multi-threaded access:
```javascript
const db = new Database('triplethink.db', { readonly: true });
// Use separate connections for reads vs writes
```

## Scaling Recommendations

### For 10-Book Series (~2000 events, 150 characters)

Current schema handles this easily:
- Database size: ~10-50 MB
- All queries within targets
- No special optimization needed

### For 50+ Book Series

Consider:
1. Partitioning by book (separate tables per book)
2. Archiving old knowledge states
3. Materialized views for common aggregations

### Epistemic Query Scaling

The `whoKnowsFact()` query scales linearly with character count.
For 150 characters: ~50ms
For 1000 characters: ~300ms

Optimization: Pre-compute fact→character mappings in a cache table.

## Monitoring

### Query Analysis

```sql
-- Enable query timing
.timer on

-- Explain query plan
EXPLAIN QUERY PLAN SELECT ...
```

### Index Usage

```sql
-- Check if index is being used
EXPLAIN QUERY PLAN
SELECT * FROM knowledge_states
WHERE character_id = 'char-eric' AND timestamp <= '2033-07-05'
ORDER BY timestamp DESC LIMIT 1;

-- Should show: USING INDEX idx_knowledge_char_time
```

## Benchmarking

Run benchmarks with:
```bash
node benchmark.js
```

This tests all major query patterns against synthetic data.
