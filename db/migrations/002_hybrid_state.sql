-- Hybrid state tables for efficient reconstruction
-- Combines snapshots and deltas for performance

CREATE TABLE IF NOT EXISTS timeline_versions (
  id TEXT PRIMARY KEY,
  fiction_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  event_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (fiction_id) REFERENCES fictions(id),
  UNIQUE (fiction_id, version_number)
);

CREATE TABLE IF NOT EXISTS asset_state_snapshots (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  state_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (asset_id) REFERENCES entities(id)
);

CREATE TABLE IF NOT EXISTS asset_state_deltas (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  previous_event_id TEXT,
  delta_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (asset_id) REFERENCES entities(id)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_asset ON asset_state_snapshots(asset_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_event ON asset_state_snapshots(event_id);
CREATE INDEX IF NOT EXISTS idx_deltas_asset ON asset_state_deltas(asset_id);
CREATE INDEX IF NOT EXISTS idx_deltas_event ON asset_state_deltas(event_id);
CREATE INDEX IF NOT EXISTS idx_timeline_fiction ON timeline_versions(fiction_id);
