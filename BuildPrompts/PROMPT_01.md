● Four Sequential Prompts for Building TripleThink

  System Name Proposal: TripleThink

  TripleThink - An event-sourced narrative construction system for multi-book series

  Why "TripleThink"?
  - a play of 1984's DoubleThink and the Ministry Of Truth
  - Memorable, professional, distinct from CAWA

  Alternative tagline: "TripleThink: Where Story Becomes Simulation"

  ---
  PROMPT 1: Complete JSON Schema with Separated Metadata

  # Task: Build Complete TripleThink JSON Schema v1.0

  I'm building TripleThink, an event-sourced narrative construction system for multi-book series. This is Prompt 1 of 4 (Schema Design).

  ## Context
  We've designed a system where:
  - World events are source of truth (objective timeline)
  - Character knowledge states track "who knows what when" (epistemic states)
  - Fictions track incompatible narratives (like "Fiction 2: Eric-only crash lie")
  - Metadata is SEPARATED from entities (not embedded)
  - Query optimization via meta_id references and read_metadata_mandatory flags

  ## Your Task
  Create the complete TripleThink v1.0 JSON schema with these specifications:

  ### 1. Top-Level Structure
  ```json
  {
    "$schema": "https://TripleThink-engine.dev/v1/schema",
    "schema_version": "1.0.0",
    "project": {...},
    "world_events": [...],
    "assets": {...},
    "metadata": [...],
    "narrative_director": {...},
    "indexes": {...}
  }

  2. Core Requirements

  A. World Events (Source of Truth)
  - Event ID, timestamp, type, summary
  - Multi-phase structure (events have stages)
  - Facts created (ground truth + visibility levels)
  - Participants (character references)
  - State changes triggered (before/after values)
  - Causal links (causes[] and effects[])
  - Metadata reference: meta_id + read_metadata_mandatory flag

  B. Assets
  - Characters (identity, traits, knowledge_state_timeline, relationships, state_timeline)
  - Objects (specs, state_timeline, ownership)
  - Locations (properties, parent references)
  - Fictions (false narratives with target audiences, collapse triggers)

  C. Metadata Table (Separated)
  - ID + entity_id reference
  - author_notes (creative intent, constraints)
  - ai_guidance (operational instructions)
  - dev_status (completeness, todo, uncertainties, warnings)
  - version_info (created, modified, changelog)
  - prose_guidance (voice, tone, pacing)
  - consistency_rules (constraints that must hold)

  D. Narrative Director
  - Books/acts/chapters structure
  - Scene-to-event mapping
  - POV character assignments
  - Epistemic constraints per scene
  - Dramatic irony setup (reader knows vs character believes)

  E. Indexes
  - epistemic_states_by_character (who knows what when)
  - events_by_participant (character → events)
  - fictions_timeline (when each fiction is active)

  3. Specific Features to Include

  Knowledge State Timeline:
  "knowledge_state": [
    {
      "timestamp": "2033-07-05",
      "trigger_event_id": "evt-fiction2-told",
      "facts_known": [
        {
          "fact_id": "fact-ms0001-all-survived",
          "belief": "false",
          "believed_alternative": "7 died in crash",
          "confidence": "absolute",
          "source": "char-stella"
        }
      ]
    }
  ]

  Fiction Structure:
  {
    "id": "fiction-2-crash-lie",
    "target_audience": ["char-eric"],  // ONLY ERIC
    "core_narrative": "...",
    "facts_contradicted": ["fact-ms0001-all-survived"],
    "constraints": ["Eric must never discuss with MS-0014 crew"],
    "exposure_triggers": ["Eric mentions crash to anyone who knows truth"]
  }

  Metadata Separation:
  // In entity:
  {
    "id": "evt-fiction2-confession",
    "meta_id": "meta-evt-confession",
    "read_metadata_mandatory": true
  }

  // In metadata table:
  {
    "id": "meta-evt-confession",
    "entity_id": "evt-fiction2-confession",
    "author_notes": "...",
    "ai_guidance": "..."
  }

  4. Example Data to Include

  Provide 3 complete examples:
  1. MS-0001 Entry Event (multi-phase crisis, consciousness emergence, successful landing)
  2. Fiction 2 Creation & Delivery (shows epistemic state change for Eric)
  3. Eric Character (with knowledge_state changes, relationships timeline)

  5. Documentation to Add

  For each section, include:
  - Purpose: Why this section exists
  - Query patterns: How this data is accessed
  - Relationships: How this connects to other sections
  - Constraints: Rules that must be maintained

  6. Output Format

  Deliver as:
  1. Complete schema.json file (valid JSON, no comments)
  2. Separate schema-documentation.md explaining each section
  3. List of validation rules that must be checked

  Success Criteria

  - Schema is complete and internally consistent
  - All entity types include meta_id + read_metadata_mandatory
  - Metadata table is separate with proper references
  - Example data demonstrates all key features
  - Documentation is clear and comprehensive

  Begin.

  