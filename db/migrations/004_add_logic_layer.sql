-- ============================================================
-- MIGRATION: 004_add_logic_layer
-- Adds v4.1 Logic Layer for story structure tracking
-- ============================================================

-- 1. CAUSALITY_CHAINS
-- Tracks cause-effect relationships between events
CREATE TABLE causality_chains (
    id TEXT PRIMARY KEY,                    -- 'causal-xxx'
    cause_event_id TEXT NOT NULL,
    effect_event_id TEXT NOT NULL,
    type TEXT CHECK(type IN (
        'direct_cause',
        'enabling_condition',
        'motivation',
        'psychological_trigger'
    )),
    strength INTEGER CHECK(strength BETWEEN 1 AND 10),
    explanation TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (cause_event_id) REFERENCES entities(id),
    FOREIGN KEY (effect_event_id) REFERENCES entities(id)
);

CREATE INDEX idx_causality_cause ON causality_chains(cause_event_id);
CREATE INDEX idx_causality_effect ON causality_chains(effect_event_id);

-- 2. CHARACTER_ARCS
-- Tracks character transformation arcs
CREATE TABLE character_arcs (
    id TEXT PRIMARY KEY,                    -- 'arc-xxx'
    character_id TEXT NOT NULL,
    archetype TEXT,                         -- 'hero', 'anti-hero', 'tragic hero', etc.
    lie_belief TEXT,                        -- The lie the character believes
    truth_belief TEXT,                      -- The truth they need to learn
    want_external TEXT,                     -- What they think they want
    need_internal TEXT,                     -- What they actually need
    current_phase TEXT CHECK(current_phase IN (
        'setup', 'catalyst', 'debate', 'break_into_two',
        'fun_and_games', 'midpoint', 'bad_guys_close_in',
        'all_is_lost', 'dark_night', 'break_into_three',
        'finale', 'final_image'
    )),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (character_id) REFERENCES entities(id)
);

CREATE INDEX idx_character_arcs_character ON character_arcs(character_id);

-- 3. STORY_CONFLICTS
-- Tracks active conflicts, stakes, and opposition
CREATE TABLE story_conflicts (
    id TEXT PRIMARY KEY,                    -- 'conflict-xxx'
    project_id TEXT NOT NULL,
    type TEXT CHECK(type IN (
        'internal', 'interpersonal', 'societal', 'environmental'
    )),
    protagonist_id TEXT NOT NULL,
    antagonist_source TEXT,                 -- Can be character, force, society
    stakes_success TEXT,                    -- What happens if protagonist wins
    stakes_fail TEXT,                       -- What happens if protagonist fails
    status TEXT CHECK(status IN (
        'latent', 'active', 'escalating', 'climactic', 'resolved'
    )) DEFAULT 'latent',
    intensity INTEGER CHECK(intensity BETWEEN 1 AND 10) DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (protagonist_id) REFERENCES entities(id)
);

CREATE INDEX idx_conflicts_protagonist ON story_conflicts(protagonist_id);
CREATE INDEX idx_conflicts_status ON story_conflicts(status);

-- 4. THEMATIC_ELEMENTS
-- Tracks recurring themes and big ideas
CREATE TABLE thematic_elements (
    id TEXT PRIMARY KEY,                    -- 'theme-xxx'
    project_id TEXT NOT NULL,
    statement TEXT NOT NULL,                -- "Power corrupts", "Love conquers all"
    question TEXT,                          -- The thematic question being explored
    primary_symbol_id TEXT,                 -- Optional link to symbolic asset
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (primary_symbol_id) REFERENCES entities(id)
);

CREATE INDEX idx_themes_project ON thematic_elements(project_id);

-- 5. MOTIF_INSTANCES
-- Tracks recurring patterns (visual, dialogue, situational)
CREATE TABLE motif_instances (
    id TEXT PRIMARY KEY,                    -- 'motif-xxx'
    project_id TEXT NOT NULL,
    motif_name TEXT NOT NULL,               -- Name of the recurring pattern
    motif_type TEXT CHECK(motif_type IN (
        'visual', 'dialogue', 'situational', 'symbolic', 'musical'
    )),
    event_id TEXT NOT NULL,                 -- Where this instance appears
    description TEXT,                       -- How it manifests
    variation_notes TEXT,                   -- How this instance varies from others
    thematic_element_id TEXT,               -- Optional link to theme
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (event_id) REFERENCES entities(id),
    FOREIGN KEY (thematic_element_id) REFERENCES thematic_elements(id)
);

CREATE INDEX idx_motif_project ON motif_instances(project_id);
CREATE INDEX idx_motif_event ON motif_instances(event_id);
CREATE INDEX idx_motif_name ON motif_instances(motif_name);

-- 6. SETUP_PAYOFFS
-- Tracks Chekhov's guns, foreshadowing, and plant/payoff pairs
CREATE TABLE setup_payoffs (
    id TEXT PRIMARY KEY,                    -- 'setup-xxx'
    project_id TEXT NOT NULL,
    setup_event_id TEXT NOT NULL,           -- Where the gun is planted
    payoff_event_id TEXT,                   -- Where it fires (NULL if unfired)
    setup_type TEXT CHECK(setup_type IN (
        'chekhov_gun', 'foreshadowing', 'promise', 'clue', 'red_herring'
    )),
    setup_description TEXT NOT NULL,
    payoff_description TEXT,
    status TEXT CHECK(status IN (
        'planted', 'referenced', 'fired', 'abandoned'
    )) DEFAULT 'planted',
    importance INTEGER CHECK(importance BETWEEN 1 AND 10) DEFAULT 5,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (setup_event_id) REFERENCES entities(id),
    FOREIGN KEY (payoff_event_id) REFERENCES entities(id)
);

CREATE INDEX idx_setup_payoff_project ON setup_payoffs(project_id);
CREATE INDEX idx_setup_payoff_setup ON setup_payoffs(setup_event_id);
CREATE INDEX idx_setup_payoff_status ON setup_payoffs(status);

-- 7. WORLD_RULES
-- Tracks universe consistency rules (magic systems, tech limits, cultural norms)
CREATE TABLE world_rules (
    id TEXT PRIMARY KEY,                    -- 'rule-xxx'
    project_id TEXT NOT NULL,
    category TEXT CHECK(category IN (
        'physics', 'magic_system', 'technology', 'cultural',
        'historical', 'biological', 'societal', 'metaphysical'
    )),
    rule_name TEXT NOT NULL,
    rule_statement TEXT NOT NULL,           -- Clear statement of the rule
    constraints TEXT,                        -- Limitations and edge cases
    consequences TEXT,                       -- What happens when violated
    exceptions TEXT,                         -- Known exceptions to the rule
    established_event_id TEXT,              -- Event where rule is established
    is_hard_rule INTEGER DEFAULT 1,         -- 1 = cannot be broken, 0 = can bend
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (established_event_id) REFERENCES entities(id)
);

CREATE INDEX idx_world_rules_project ON world_rules(project_id);
CREATE INDEX idx_world_rules_category ON world_rules(category);
