-- Logic Layer for TripleThink v4.1 Phase 2
-- Story structure tracking: causality, arcs, conflicts, themes, motifs, setup/payoffs, world rules
-- Event sourcing: tables are append-only, never edit existing records

-- ============================================================================
-- CAUSALITY_CHAINS - Cause-effect relationship tracking
-- ============================================================================
-- Tracks how events influence each other (direct causes, enabling conditions,
-- motivations, psychological triggers). Enables "why this happened" analysis.
CREATE TABLE IF NOT EXISTS causality_chains (
  chain_uuid TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  cause_event_id TEXT NOT NULL,  -- References events.event_uuid (when created in future phase)
  effect_event_id TEXT NOT NULL,  -- References events.event_uuid (when created in future phase)
  type TEXT NOT NULL CHECK(type IN ('direct_cause', 'enabling_condition', 'motivation', 'psychological_trigger')),
  strength INTEGER NOT NULL CHECK(strength >= 1 AND strength <= 10),
  explanation TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Indexes for causality queries
CREATE INDEX IF NOT EXISTS idx_causality_project ON causality_chains(project_id);
CREATE INDEX IF NOT EXISTS idx_causality_cause ON causality_chains(cause_event_id);
CREATE INDEX IF NOT EXISTS idx_causality_effect ON causality_chains(effect_event_id);

-- ============================================================================
-- CHARACTER_ARCS - Character transformation tracking
-- ============================================================================
-- Tracks character development following Save the Cat beat structure.
-- Stores arc fundamentals: lie/truth, want/need, and current phase.
CREATE TABLE IF NOT EXISTS character_arcs (
  arc_uuid TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  character_id TEXT NOT NULL,  -- References entities where entity_type='character'
  archetype TEXT,  -- e.g., 'hero', 'mentor', 'shadow', 'trickster'
  lie_belief TEXT,  -- False belief character holds at story start
  truth_belief TEXT,  -- Truth character must learn
  want_external TEXT,  -- External goal character pursues
  need_internal TEXT,  -- Internal need character must fulfill
  current_phase TEXT CHECK(current_phase IN (
    'setup', 'catalyst', 'debate', 'break_into_two', 'b_story',
    'fun_and_games', 'midpoint', 'bad_guys_close_in', 'all_is_lost',
    'dark_night_of_soul', 'break_into_three', 'finale', 'final_image'
  )),
  created_at INTEGER NOT NULL
);

-- Indexes for arc queries
CREATE INDEX IF NOT EXISTS idx_arcs_project ON character_arcs(project_id);
CREATE INDEX IF NOT EXISTS idx_arcs_character ON character_arcs(character_id);

-- ============================================================================
-- STORY_CONFLICTS - Conflict escalation tracking
-- ============================================================================
-- Tracks conflicts across 5 types with clear stakes and status progression.
-- Central to plot structure and tension management.
CREATE TABLE IF NOT EXISTS story_conflicts (
  conflict_uuid TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('internal', 'interpersonal', 'societal', 'environmental', 'supernatural')),
  protagonist_id TEXT NOT NULL,  -- References entities where entity_type='character'
  antagonist_source TEXT NOT NULL,  -- Can be character ID, system ID, or descriptive string
  stakes_success TEXT NOT NULL,  -- What protagonist gains if they win
  stakes_fail TEXT NOT NULL,  -- What protagonist loses if they fail
  status TEXT NOT NULL DEFAULT 'latent' CHECK(status IN ('latent', 'active', 'escalating', 'climactic', 'resolved')),
  created_at INTEGER NOT NULL
);

-- Indexes for conflict queries
CREATE INDEX IF NOT EXISTS idx_conflicts_project ON story_conflicts(project_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_protagonist ON story_conflicts(protagonist_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_status ON story_conflicts(status);

-- ============================================================================
-- THEMATIC_ELEMENTS - Theme and symbolic meaning tracking
-- ============================================================================
-- Tracks thematic statements, questions, and how themes manifest through
-- symbols and story events. Enables thematic consistency analysis.
CREATE TABLE IF NOT EXISTS thematic_elements (
  theme_uuid TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  statement TEXT NOT NULL,  -- The thematic statement or message
  primary_symbol_id TEXT,  -- Optional reference to entity used as primary symbol
  question TEXT,  -- Thematic question story explores
  manifestations TEXT,  -- JSON array of ways theme appears in story
  created_at INTEGER NOT NULL
);

-- Indexes for theme queries
CREATE INDEX IF NOT EXISTS idx_themes_project ON thematic_elements(project_id);

-- ============================================================================
-- MOTIF_INSTANCES - Recurring pattern tracking
-- ============================================================================
-- Tracks recurring visual, dialogue, situational, symbolic, or musical patterns.
-- Essential for layered storytelling and reader/viewer pattern recognition.
CREATE TABLE IF NOT EXISTS motif_instances (
  motif_uuid TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  motif_type TEXT NOT NULL CHECK(motif_type IN ('visual', 'dialogue', 'situational', 'symbolic', 'musical')),
  linked_entity_id TEXT,  -- Optional reference to entity if motif is object-based
  description TEXT NOT NULL,
  significance TEXT,  -- What the recurring pattern means/represents
  created_at INTEGER NOT NULL
);

-- Indexes for motif queries
CREATE INDEX IF NOT EXISTS idx_motifs_project ON motif_instances(project_id);
CREATE INDEX IF NOT EXISTS idx_motifs_type ON motif_instances(motif_type);

-- ============================================================================
-- SETUP_PAYOFFS - Chekhov's gun tracking
-- ============================================================================
-- Tracks planted setups and their eventual payoffs. Ensures narrative promises
-- are fulfilled and prevents dangling story threads.
CREATE TABLE IF NOT EXISTS setup_payoffs (
  setup_payoff_uuid TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  setup_event_id TEXT NOT NULL,  -- References events.event_uuid (when created in future phase)
  payoff_event_id TEXT,  -- References events.event_uuid, NULL until fired
  description TEXT NOT NULL,  -- What was set up / what pays off
  status TEXT NOT NULL DEFAULT 'planted' CHECK(status IN ('planted', 'referenced', 'fired', 'unfired')),
  planted_chapter TEXT,  -- Chapter/scene where setup planted
  fired_chapter TEXT,  -- Chapter/scene where setup fires, NULL until fired
  created_at INTEGER NOT NULL
);

-- Indexes for setup/payoff queries
CREATE INDEX IF NOT EXISTS idx_setup_payoffs_project ON setup_payoffs(project_id);
CREATE INDEX IF NOT EXISTS idx_setup_payoffs_status ON setup_payoffs(status);
CREATE INDEX IF NOT EXISTS idx_setup_payoffs_setup_event ON setup_payoffs(setup_event_id);

-- ============================================================================
-- WORLD_RULES - Universe consistency rules
-- ============================================================================
-- Tracks physics, magic, technology, social, biological, and metaphysical rules
-- that govern the story world. Essential for internal consistency.
CREATE TABLE IF NOT EXISTS world_rules (
  rule_uuid TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  rule_category TEXT NOT NULL CHECK(rule_category IN ('physics', 'magic', 'technology', 'social', 'biological', 'metaphysical')),
  statement TEXT NOT NULL,  -- The rule definition
  exceptions TEXT,  -- Documented exceptions to the rule
  enforcement_level TEXT NOT NULL DEFAULT 'strict' CHECK(enforcement_level IN ('strict', 'flexible', 'guideline')),
  created_at INTEGER NOT NULL
);

-- Indexes for world rules queries
CREATE INDEX IF NOT EXISTS idx_world_rules_project ON world_rules(project_id);
CREATE INDEX IF NOT EXISTS idx_world_rules_category ON world_rules(rule_category);

-- ============================================================================
-- Migration Notes
-- ============================================================================
-- All tables follow event sourcing principles (append-only, never edit).
-- Foreign key constraints to EVENTS table are deferred - EVENTS table will be
-- created in a future phase. When EVENTS table exists, add constraints via:
--   ALTER TABLE causality_chains ADD FOREIGN KEY (cause_event_id) REFERENCES events(event_uuid);
--   ALTER TABLE causality_chains ADD FOREIGN KEY (effect_event_id) REFERENCES events(event_uuid);
--   ALTER TABLE setup_payoffs ADD FOREIGN KEY (setup_event_id) REFERENCES events(event_uuid);
--   ALTER TABLE setup_payoffs ADD FOREIGN KEY (payoff_event_id) REFERENCES events(event_uuid);
--
-- These tables enable Phase 3 (module creation) and Phase 7 (API exposure).
