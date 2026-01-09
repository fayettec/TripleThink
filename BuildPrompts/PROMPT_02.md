● Four Sequential Prompts for Building TripleThink

  System Name Proposal: TripleThink

  TripleThink - An event-sourced narrative construction system for multi-book series

  Why "TripleThink"?
  - a play of 1984's DoubleThink and the Ministry Of Truth
  - Memorable, professional, distinct from CAWA

  Alternative tagline: "TripleThink: Where Story Becomes Simulation"

  ---

  # PROMPT 2: Database Schema & Implementation

  Task: Design TripleThink Database Schema & Storage Layer

  This is Prompt 2 of 4 (Database Design). The JSON schema from Prompt 1 is now complete.

  Context

  We have the TripleThink JSON schema with separated metadata architecture. Now we need to design the actual database layer that will store and query this data efficiently.

  Your Task

  Design the complete database schema and storage implementation for TripleThink.

  1. Database Technology Decision

  Evaluate and recommend:
  - Pure JSON files + filesystem (simple, portable, no server)
  - SQLite (embedded, serverless, SQL queries)
  - PostgreSQL (powerful, JSONB support, full-featured)
  - Hybrid (SQLite + JSON files for certain data)

  Criteria:
  - Must support complex queries (epistemic states, temporal queries)
  - Must handle 10-book series (1000+ events, 100+ characters)
  - Must be portable (author can move project)
  - Must support GUI access (forms will query this)
  - Must enable AI queries (fast, efficient)

  Provide recommendation with rationale.

  2. SQL Schema Design

  Core Tables:

  -- Design complete CREATE TABLE statements for:

  1. projects (series metadata)
  2. books (book-level info)
  3. entities (polymorphic: events, characters, objects, locations, fictions)
  4. metadata (separated metadata with references)
  5. entity_relationships (character relationships, object ownership, etc.)
  6. knowledge_states (epistemic tracking)
  7. narrative_mappings (book/chapter → event mappings)
  8. indexes (pre-computed query helpers)

  For each table:
  - Primary keys and foreign keys
  - Indexes for common queries
  - JSON columns where appropriate (for flexible data)
  - Timestamps (created_at, updated_at)
  - Constraints (NOT NULL, UNIQUE, CHECK)

  3. Query Optimization

  Design indexes for common queries:

  -- Example queries to optimize:

  1. "Get all events on date X"
     → Index on timestamp

  2. "Get all events where character X participated"
     → Index on entity_relationships(entity_id, related_entity_id)

  3. "What does character X believe at timestamp T?"
     → Index on knowledge_states(character_id, timestamp)

  4. "Get metadata for entity X (if mandatory)"
     → Index on entities(meta_id), metadata(entity_id)

  5. "List all fictions active at time T"
     → Index on fictions(created_date, collapse_date)

  Provide:
  - Index definitions (CREATE INDEX statements)
  - Query performance estimates
  - Trade-offs (write speed vs read speed)

  4. Data Access Layer (API)

  Design function signatures:

  // Core CRUD operations
  createEntity(type, data)
  getEntity(id, options = {includeMetadata: 'auto'})
  updateEntity(id, data)
  deleteEntity(id)

  // Metadata operations
  getMetadata(metaId)
  updateMetadata(metaId, data)

  // Complex queries
  getEventsInTimeRange(startDate, endDate)
  getCharacterKnowledgeState(characterId, timestamp)
  getEventsWithParticipant(characterId)
  getFictionsActiveAtTime(timestamp)

  // Epistemic queries (the power feature)
  whoKnowsFact(factId, timestamp)
  doesCharacterBelieve(characterId, factId, timestamp)
  getBeliefDivergence(fact_id, timestamp) // Returns who believes what

  // Temporal queries
  getEntityStateAtTime(entityId, timestamp)
  getStateChangesForEntity(entityId, startDate, endDate)

  // Narrative queries
  getChapterEvents(bookId, chapterNumber)
  getSceneData(sceneId, includeEpistemicContext = true)

  For each function:
  - Input parameters
  - Return type
  - SQL query implementation
  - Performance considerations

  5. Migration Strategy

  Design schema versioning:

  -- Migrations table
  CREATE TABLE schema_migrations (
    version INTEGER PRIMARY KEY,
    name VARCHAR(255),
    applied_at TIMESTAMP,
    rollback_sql TEXT
  );

  -- Example migration
  -- v1_initial_schema.sql
  -- v2_add_prose_guidance_to_metadata.sql
  -- v3_add_narrative_significance_enum.sql

  Provide:
  - Migration framework design
  - Rollback strategy
  - Version compatibility rules

  6. Data Integrity & Validation

  Design validation rules:

  -- Examples:

  1. Foreign key integrity
     → metadata.entity_id must exist in entities.id

  2. Temporal consistency
     → knowledge_state.timestamp >= character.creation_date

  3. Epistemic consistency
     → If character believes fiction, fact must be in their knowledge_state

  4. Fiction audience constraints
     → Fiction 2 target_audience must contain ONLY ["char-eric"]

  Provide:
  - CHECK constraints
  - Triggers for complex validation
  - Application-level validation (if needed)

  7. Backup & Export

  Design backup strategy:
  - Export to JSON (portable format)
  - Incremental backups (timestamp-based)
  - Import from JSON (restore)
  - Diff/merge for collaboration

  Provide:
  - Export/import function signatures
  - JSON file structure
  - Merge conflict resolution strategy

  8. Performance Benchmarks

  Estimate performance:

  Dataset: 10-book series
  - 2,000 events
  - 150 characters
  - 50,000 knowledge state entries
  - 100 fictions

  Query benchmarks:
  - Get entity by ID: < 10ms
  - Get events in date range: < 50ms
  - Epistemic query (who knows what): < 100ms
  - Complex join (event + participants + metadata): < 200ms

  9. Deliverables

  Provide:
  1. schema.sql - Complete CREATE TABLE statements
  2. indexes.sql - All CREATE INDEX statements
  3. api-functions.js - Data access layer implementation
  4. migrations/ - Migration framework + initial migration
  5. validation-rules.md - All integrity constraints
  6. performance-guide.md - Query optimization guide

  Success Criteria

  - Schema supports all JSON schema features from Prompt 1
  - Queries are optimized for common access patterns
  - API layer is clean and intuitive
  - Validation prevents data corruption
  - Performance scales to 10-book series

  Begin.

  