-- Event Moments for TripleThink v4.1 Phase 1
-- Granular beat tracking within events
-- Event sourcing: tables are append-only, never edit existing records

-- Event moments table for tracking individual story beats within larger events
-- Provides fine-grained causality and pacing control
-- Foundation for Logic Layer causality chains in Phase 2
CREATE TABLE IF NOT EXISTS event_moments (
  moment_uuid TEXT PRIMARY KEY,
  event_uuid TEXT NOT NULL,
  sequence_index INTEGER NOT NULL,
  beat_description TEXT NOT NULL,
  timestamp_offset INTEGER,  -- Optional: offset from event timestamp in seconds
  created_at INTEGER NOT NULL
  -- Note: FOREIGN KEY constraint on event_uuid deferred until Phase 2
  -- when EVENTS table is created. Will be added in future migration.
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_moments_event ON event_moments(event_uuid);
CREATE INDEX IF NOT EXISTS idx_moments_sequence ON event_moments(event_uuid, sequence_index);
