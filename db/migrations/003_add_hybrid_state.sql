-- ============================================================
-- MIGRATION: 003_add_hybrid_state
-- Adds support for v4.1 Hybrid State Architecture
-- ============================================================

-- 1. TIMELINE_VERSIONS
-- Enables branching narratives
CREATE TABLE timeline_versions (
    id TEXT PRIMARY KEY,                    -- 'ver-xxx'
    project_id TEXT NOT NULL,
    parent_version_id TEXT,
    branch_point_event_id TEXT,             -- Where divergence occurred
    name TEXT NOT NULL,
    is_active INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 2. ASSET_STATE_SNAPSHOTS
-- Full state dumps at anchor points
CREATE TABLE asset_state_snapshots (
    id TEXT PRIMARY KEY,                    -- 'snap-xxx'
    timeline_version_id TEXT NOT NULL,
    asset_id TEXT NOT NULL,
    anchor_event_id TEXT NOT NULL,
    snapshot_type TEXT NOT NULL CHECK (snapshot_type IN (
        'chapter_start', 'major_event', 'periodic', 'manual'
    )),
    state_json TEXT NOT NULL,               -- Full JSON state
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (timeline_version_id) REFERENCES timeline_versions(id),
    FOREIGN KEY (asset_id) REFERENCES entities(id),
    FOREIGN KEY (anchor_event_id) REFERENCES entities(id)
);

CREATE INDEX idx_snapshot_lookup ON asset_state_snapshots(asset_id, anchor_event_id);

-- 3. ASSET_STATE_DELTAS
-- Incremental changes between snapshots
CREATE TABLE asset_state_deltas (
    id TEXT PRIMARY KEY,                    -- 'delta-xxx'
    timeline_version_id TEXT NOT NULL,
    asset_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    previous_snapshot_id TEXT,              
    changes_json TEXT NOT NULL,             -- ONLY the diff
    change_category TEXT CHECK (change_category IN (
        'physical', 'psychological', 'knowledge', 'relationship', 'location', 'mixed'
    )),
    magnitude INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (timeline_version_id) REFERENCES timeline_versions(id),
    FOREIGN KEY (asset_id) REFERENCES entities(id),
    FOREIGN KEY (event_id) REFERENCES entities(id),
    FOREIGN KEY (previous_snapshot_id) REFERENCES asset_state_snapshots(id)
);

CREATE INDEX idx_delta_chain ON asset_state_deltas(asset_id, event_id);

-- 4. Create default timeline version for existing project
-- This ensures existing data isn't orphaned from the versioning system
INSERT INTO timeline_versions (id, project_id, name, is_active)
SELECT 
    'ver-default-' || hex(randomblob(4)), 
    id, 
    'Main Timeline', 
    1 
FROM projects;
