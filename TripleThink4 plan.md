# TripleThink v4.1 Implementation Plan

## Summary

Fresh implementation of TripleThink v4.1 in /app/TripleThink - an event-sourced narrative database with hybrid state architecture, AI orchestration, and 21 database tables.



---

Execution Strategy: Ralph Loop



This is a large task (7+ phases, 105+ files) with clear completion criteria. Use /ralph-loop for each phase.



Ralph Loop Commands by Phase



Phase 1: Foundation (Run first)

/ralph-loop "Implement TripleThink v4.1 Phase 1: Foundation in /app/TripleThink.



TASKS:

1. Create directory structure: /app/TripleThink/{api,db,gui,schema,tests}

2. Create package.json with dependencies (express, better-sqlite3, lru-cache, uuid, jest)

3. Create db/migrations/001\_foundation.sql (projects, entities, metadata, fictions tables)

4. Create db/migrations/002\_hybrid\_state.sql (timeline\_versions, asset\_state\_snapshots, asset\_state\_deltas)

5. Implement db/modules/state-snapshots.js (createSnapshot, getNearestSnapshot, getSnapshotsForAsset)

6. Implement db/modules/state-deltas.js (createDelta, computeDelta, applyDelta, getDeltaChain)

7. Implement db/modules/state-reconstruction.js with LRU cache

8. Create api/server.js Express setup

9. Create api/routes/state.js endpoints

10. Write tests/unit/db/reconstruction.test.js

11. Verify: npm test passes, state reconstruction <100ms for 100 deltas



SUCCESS: All tests pass, API responds at /api/state/:assetId/at/:eventId" --completion-promise "PHASE 1 COMPLETE" --max-iterations 15



Phase 2: Logic Layer

/ralph-loop:ralph-loop 'Implement TripleThink v4.1 Phase 2: Logic Layer in /app/TripleThink. check to see if each step is done, if it is test and repair as need. 

TASKS:
1. Create db/migrations/003\_logic\_layer.sql (causality\_chains, character\_arcs, story\_conflicts, thematic\_elements,motif\_instances, setup\_payoffs, world\_rules)
2. Implement db/modules/causality.js (CRUD, traverseForward, traverseBackward)
3. Implement db/modules/arcs.js (CRUD, advancePhase, getArcSummary)
4. Implement db/modules/conflicts.js (CRUD, escalate, resolve)
5. Implement db/modules/themes.js (CRUD, addManifestation)
6. Implement db/modules/setup-payoffs.js (CRUD, payoff, subvert)
7. Implement db/modules/world-rules.js (CRUD, validate)
8. Create api/routes/logic.js with all endpoints
9. Write tests for each module
SUCCESS: 
All logic layer tests pass, API responds at /api/logic/\*' 
<promise>PHASE 2 is COMPLETE</promise> when done." --max-iterations 7 --completion-promise "PHASE 2 is COMPLETE"




Phase 3: Context Matrix

/ralph-loop:ralph-loop "Implement TripleThink v4.1 Phase 3: Context Matrix in /app/TripleThink. TASKS: 1. Create db/migrations/004\_context\_matrix.sql (epistemic\_fact\_ledger, relationship\_dynamics, dialogue\_profiles) 2. Implement db/modules/epistemic.js (ledger CRUD, queryKnowledgeAt, getDivergence) 3. Implement db/modules/relationships.js (dynamics CRUD, getRelationshipAt) 4. Implement db/modules/dialogue.js (profile CRUD, getVoiceHints) 5. Create api/routes/epistemic.js endpoints 6. Write tests for epistemic queries SUCCESS: Epistemic queries return accurate knowledge states at any timestamp" --completion-promise "PHASE 3 COMPLETE" --max-iterations 4



Phase 4: Orchestration (CRITICAL)

/ralph-loop:ralph-loop "Implement TripleThink v4.1 Phase 4: Orchestration in /app/TripleThink. TASKS: 1. Create db/migrations/005\_narrative.sql (narrative\_scenes enhanced, scene\_transitions, pacing\_checkpoints, vent\_moments) 2. Implement db/modules/scenes.js (CRUD with orchestration fields) 3. Implement db/modules/transitions.js (CRUD, validateContinuity) 4. Implement db/modules/pacing.js (CRUD, getTensionCurve) 5. Implement api/services/orchestrator.js - THE CRITICAL COMPONENT:    - assembleContext(sceneId) returns complete context packet    - Includes: POV state, present characters, relationships, conflicts, themes, dialogue profiles, forbidden reveals 6. Create api/routes/orchestrator.js 7. Write integration test: orchestrator returns valid context for 10-character scene 8. Performance test: context assembly <1s SUCCESS: /api/orchestrator/:sceneId returns complete context packet in <1s" --completion-promise "PHASE 4 COMPLETE" --max-iterations 4



Phase 5: API \& AI Integration

/raalph-loop:ralph-loop "Implement TripleThink v4.1 Phase 5: API \& AI Integration in /app/TripleThink. TASKS: 1. Complete all remaining CRUD routes (entities, fictions, projects, metadata) 2. Implement api/routes/temporal.js (time-travel queries) 3. Implement api/routes/search.js (full-text search) 4. Implement api/routes/export-import.js 5. Implement api/routes/ai.js with MCP-style functions:    - getContextForScene, queryKnowledgeState, getCausalChain, validateConsistency, batchQuery 6. Write integration tests SUCCESS: All API endpoints respond correctly, AI functions work" --completion-promise "PHASE 5 Is COMPLETE" --max-iterations 15



Phase 6: Validation

/ralph-loop:ralph-loop "Implement TripleThink v4.1 Phase 6: Validation in /app/TripleThink. TASKS: 1. Implement api/services/validator.js with 100+ rules:    - Referential integrity (10 rules)    - Temporal consistency (12 rules)   - Epistemic consistency (7 rules)    - Fiction system (7 rules)    - Narrative consistency (8 rules)   - Logic layer (15 rules)   - State integrity (10 rules)    - Cross-entity (10 rules) 2. Create api/routes/validation.js 3. Create schema/validation-rules.md 4. Write validation test suite 5. Run performance benchmarks:    - State reconstruction <100ms    - Epistemic query <100ms    - Orchestrator <1s SUCCESS: All validation rules implemented and tested, performance targets met" --completion-promise "PHASE 6 COMPLETE" --max-iterations 5



Phase 7: Migration \& Launch

/ralph-loop "Implement TripleThink v4.1 Phase 7: Migration \& Launch in /app/TripleThink.



TASKS:

1. Implement api/services/migrator.js:

   - migrateFromV1(v1DbPath) - migrates v1.0 database to v4.1

   - Maps entities, generates snapshots, migrates fictions, knowledge states, relationships

2. Create start.sh (API:3000, GUI:8080)

3. Create schema/schema.json with complete v4.1 schema

4. Create schema/schema-documentation.md

5. Create README.md with setup and usage

6. Run end-to-end test:

   - Create project, characters, events, fictions

   - Generate scenes via orchestrator

   - Verify all queries work



SUCCESS: Migration works, documentation complete, full system operational" --completion-promise "PHASE 7 COMPLETE - TRIPLETHINK v4.1 READY" --max-iterations 15



Between Phases



After each Ralph Loop completes:

1. Verify the promise was output

2. Run npm test to confirm all tests pass

3. Start next phase's Ralph Loop



---

Phase 1: Foundation (Weeks 1-3)



Week 1: Core Infrastructure + Hybrid State System



Files to Create:

/app/TripleThink/

├── package.json

├── start.sh

├── api/

│   ├── server.js

│   ├── error-handling.js

│   ├── middleware/{auth,cache,rate-limit,validation}.js

│   └── routes/{health,projects,entities,state,timelines}.js

├── db/

│   ├── index.js

│   ├── connection.js

│   ├── api-functions.js

│   ├── modules/{entities,projects,state-snapshots,state-deltas,state-reconstruction}.js

│   └── migrations/{001\_foundation,002\_hybrid\_state}.sql

└── tests/unit/db/{snapshots,deltas,reconstruction}.test.js



Key Tasks:

1. Create 001\_foundation.sql - projects, entities, metadata tables

2. Create 002\_hybrid\_state.sql - timeline\_versions, asset\_state\_snapshots, asset\_state\_deltas

3. Implement state-snapshots.js: createSnapshot, getNearestSnapshot, getSnapshotsForAsset

4. Implement state-deltas.js: createDelta, computeDelta, applyDelta, getDeltaChain

5. Implement state-reconstruction.js with LRU cache

6. Create /api/state routes

7. Performance test: <100ms for 100-delta reconstruction



Success Criteria:

- State reconstruction works with snapshot + delta chain

- Performance: <100ms for 100 deltas

- API returns reconstructed state at any event



Week 2: Timeline Branching



Files to Create:

- db/modules/timelines.js

- api/routes/timelines.js



Key Tasks:

1. Timeline version CRUD

2. Branch creation from any event

3. Branch switching

4. Active timeline tracking



Week 3: Event Moments + Polish



Files to Create:

- Migration 003\_event\_moments.sql

- db/modules/moments.js



Key Tasks:

1. Event moments (granular beats within events)

2. Enhanced event phases

3. Performance tuning

4. Core GUI scaffold



---

Phase 2: Logic Layer (Weeks 4-7)



Week 4: Causality + Setup/Payoffs



Tables:

- causality\_chains (cause\_event\_id, effect\_event\_id, chain\_type, strength)

- setup\_payoffs (setup\_event\_id, payoff\_event\_id, status, visibility)



Files:

- db/modules/{causality,setup-payoffs}.js

- api/routes/logic.js



Week 5: Character Arcs



Table: character\_arcs

- arc\_type, lie\_belief, truth\_belief, want\_external, need\_internal

- ghost\_wound, current\_phase, phase\_progression



Files:

- db/modules/arcs.js



Week 6: Story Conflicts



Table: story\_conflicts

- conflict\_type, protagonist\_id, antagonist\_source

- stakes\_success, stakes\_fail, escalation\_events



Files:

- db/modules/conflicts.js



Week 7: Themes + World Rules



Tables:

- thematic\_elements (theme\_type, content, manifestations)

- motif\_instances (motif\_type, pattern\_description, occurrences)

- world\_rules (rule\_category, rule\_statement, constraints, exceptions)



Files:

- db/modules/{themes,world-rules}.js



---

Phase 3: Context Matrix (Weeks 8-10)



Week 8: Enhanced Epistemic



Table: epistemic\_fact\_ledger

- belief\_status, believed\_content, confidence\_level

- source\_type, source\_entity\_id, acquired\_timestamp



Files:

- db/modules/epistemic.js

- api/routes/epistemic.js



Week 9: Relationship Dynamics



Table: relationship\_dynamics

- Multidimensional: trust, fear, respect, affection, power\_balance

- public\_relationship, private\_reality, secrets\_held



Files:

- db/modules/relationships.js



Week 10: Dialogue Profiles



Table: dialogue\_profiles

- vocabulary\_level, sentence\_patterns, speech\_tics

- forbidden\_words, catchphrases, emotional\_modifiers



Files:

- db/modules/dialogue.js



---

Phase 4: Orchestration (Weeks 11-13) - CRITICAL



Week 11: Enhanced Scenes



Table: narrative\_scenes (enhanced)

- context\_config, pacing\_directive, emotional\_arc

- required\_beats, forbidden\_reveals



Files:

- db/modules/scenes.js

- api/routes/narrative.js



Week 12: THE ORCHESTRATOR (Critical AI Integration)



Service: api/services/orchestrator.js



Context Packet Assembly:

{

  scene\_metadata: {...},

  pov\_character: {...},

  present\_characters: \[...],

  location\_state: {...},

  active\_conflicts: \[...],

  relevant\_themes: \[...],

  character\_knowledge: {...},

  relationship\_dynamics: {...},

  dialogue\_profiles: {...},

  setup\_payoffs\_active: \[...],

  world\_rules\_applicable: \[...],

  forbidden\_reveals: \[...],

  pacing\_directive: '...'

}



Files:

- api/services/orchestrator.js

- api/routes/orchestrator.js



Success Criteria:

- Context assembly <1s for 10-character scene

- Respects POV character knowledge limits

- Includes all relevant story elements



Week 13: Transitions + Pacing



Tables:

- scene\_transitions (transition\_type, character\_continuity, emotional\_bridge)

- pacing\_checkpoints (tension\_level, reader\_knowledge\_state, dramatic\_irony)



---

Phase 5: API \& AI Integration (Weeks 14-15)



Week 14: Complete REST API



Endpoints:

- /api/entities - Full CRUD

- /api/fictions - Fiction management (PRESERVED from v1.0)

- /api/epistemic - Knowledge queries

- /api/temporal - Time-travel queries

- /api/logic/\* - All logic layer endpoints

- /api/narrative/\* - Scene, transition, pacing

- /api/orchestrator - Context assembly

- /api/export, /api/import - Data transfer

- /api/search - Full-text search



Week 15: MCP-Style AI Functions



File: api/routes/ai.js



Functions:

- getContextForScene(sceneId) - Returns orchestrator packet

- queryKnowledgeState(characterId, timestamp) - Epistemic query

- getCausalChain(eventId, direction, depth) - Causality traversal

- validateConsistency(entityIds) - Check rules

- batchQuery(queries) - Token-efficient batching



---

Phase 6: Validation \& Testing (Weeks 16-17)



Week 16: 100+ Validation Rules



Categories:

1. Referential Integrity (10 rules) - ID uniqueness, FK constraints

2. Temporal Consistency (12 rules) - Event ordering, causal order

3. Epistemic Consistency (7 rules) - Knowledge state validity

4. Fiction System (7 rules) - Audience constraints, exposure logic

5. Narrative Consistency (8 rules) - Scene/chapter ordering

6. Logic Layer (15 rules) - Arc phases, conflict states

7. State Integrity (10 rules) - Snapshot/delta consistency

8. Cross-Entity (10 rules) - Relationship symmetry



Files:

- api/services/validator.js

- api/routes/validation.js

- schema/validation-rules.md



Week 17: Performance Benchmarks



Targets:

┌───────────────────────────────────┬────────┐

│             Operation             │ Target │

├───────────────────────────────────┼────────┤

│ State reconstruction (100 deltas) │ <100ms │

├───────────────────────────────────┼────────┤

│ Epistemic query                   │ <100ms │

├───────────────────────────────────┼────────┤

│ Causal chain (50 events)          │ <200ms │

├───────────────────────────────────┼────────┤

│ Orchestrator context assembly     │ <1s    │

├───────────────────────────────────┼────────┤

│ Storage (10-book series)          │ <50MB  │

└───────────────────────────────────┴────────┘

---

Phase 7: Migration \& Launch (Weeks 18-19)



Week 18: Migration Scripts



File: api/services/migrator.js



Tasks:

1. Map v1.0 entities → v4.1 entities

2. Generate baseline snapshots

3. Migrate fictions (critical - preserve exactly)

4. Migrate knowledge states → epistemic\_fact\_ledger

5. Migrate relationships → relationship\_dynamics



Week 19: Documentation



Files:

- schema/schema.json - Complete v4.1 schema

- schema/schema-documentation.md - All 21 tables documented

- README.md - Setup, usage, API reference



---

Database Schema Summary (21 Tables)



Foundation (5)



1. projects - Series/project container

2. timeline\_versions - Branch management

3. entities - Polymorphic (events, characters, objects, locations, systems)

4. asset\_state\_snapshots - Full state at anchor points

5. asset\_state\_deltas - Incremental changes



Logic Layer (7)



6. causality\_chains - Cause-effect relationships

7. character\_arcs - Transformation tracking

8. story\_conflicts - Protagonist/antagonist dynamics

9. thematic\_elements - Big ideas and questions

10. motif\_instances - Recurring patterns

11. setup\_payoffs - Chekhov's guns, foreshadowing

12. world\_rules - Universe consistency rules



Context Matrix (4)



13. metadata - Author notes, AI guidance

14. epistemic\_fact\_ledger - Who knows what when

15. relationship\_dynamics - Multidimensional relationships

16. dialogue\_profiles - Character voice patterns



Narrative Layer (5)



17. narrative\_scenes - Enhanced with orchestration

18. scene\_transitions - Continuity tracking

19. pacing\_checkpoints - Tension curve management

20. event\_moments - Granular beats

21. fictions - False narratives (PRESERVED from v1.0)



---

Verification Plan



After Each Phase:



1. Run unit tests: npm test

2. Run performance benchmarks: npm run bench

3. Manual API testing via curl/Postman

4. GUI smoke testing



End-to-End Test (Week 17):



1. Create project with 3 characters

2. Create 50 events with causal chains

3. Establish character arcs and conflicts

4. Create fiction with 2-character audience

5. Generate 5 scenes via orchestrator

6. Verify state reconstruction accuracy

7. Verify epistemic queries

8. Verify fiction exposure detection

9. Export/import round-trip

10. Run full validation suite



Performance Verification:



npm run bench:reconstruction   # Target: <100ms

npm run bench:orchestrator     # Target: <1s

npm run bench:storage          # Target: <50MB for 10 books



---

Critical Warnings



DO NOT:

- Remove or break the FICTIONS system (unique to TripleThink)

- Skip performance testing

- Proceed to Phase N+1 before Phase N passes tests



DO:

- Test after each major component

- Cache aggressively for state queries

- Preserve v1.0 event sourcing principles (never edit, only add)



---

Estimated File Count



- API: ~25 files

- DB: ~25 files

- GUI: ~30 files

- Tests: ~20 files

- Schema/Docs: ~5 files



Total: ~105 files across 7 phases

╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌



Requested permissions:

  · Bash(prompt: run npm install to install dependencies)

  · Bash(prompt: run npm test to execute tests)

  · Bash(prompt: run database migrations)

  · Bash(prompt: start the API server)

  · Bash(prompt: start the GUI server)

  · Bash(prompt: run performance benchmarks)

  · Bash(prompt: create directories)

