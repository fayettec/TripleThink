-- Migration 002: Add ID counters table for sequential ID generation
-- This table tracks the current counter value for each entity type

CREATE TABLE IF NOT EXISTS id_counters (
    entity_type TEXT PRIMARY KEY,
    current_value INTEGER NOT NULL DEFAULT 0
);

-- Initialize counters for all entity types
INSERT OR IGNORE INTO id_counters (entity_type, current_value) VALUES
    ('project', 0),
    ('event', 0),
    ('character', 0),
    ('location', 0),
    ('object', 0),
    ('fiction', 0),
    ('book', 0),
    ('act', 0),
    ('chapter', 0),
    ('scene', 0);
