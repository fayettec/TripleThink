# TripleThink v4.1 API Documentation

**Base URL:** `http://localhost:3000`
**Version:** 4.1.0
**Authentication:** Optional (via `TRIPLETHINK_API_KEY` environment variable)

## Table of Contents

1. [Introduction](#introduction)
2. [Response Format](#response-format)
3. [Error Handling](#error-handling)
4. [Core Endpoints](#core-endpoints)
5. [Epistemic Endpoints](#epistemic-endpoints)
6. [Logic Layer Endpoints](#logic-layer-endpoints)
7. [Orchestrator Endpoints](#orchestrator-endpoints)
8. [Validation Endpoints](#validation-endpoints)
9. [State Management Endpoints](#state-management-endpoints)
10. [Utility Endpoints](#utility-endpoints)

---

## Introduction

The TripleThink API provides comprehensive access to an event-sourced narrative database designed for complex fiction series. The API enables tracking of character knowledge (epistemic states), story structure (logic layer), and temporal state reconstruction.

### Key Capabilities

- **Epistemic Tracking:** Who knows what, when
- **QACS Workflow:** Query-Assemble-Context-Supply for AI-driven scene generation
- **Logic Layer:** Causality chains, character arcs, conflicts, themes, motifs, setups, world rules
- **Temporal Navigation:** State reconstruction at any point in narrative time
- **Validation:** 106 rules across 8 categories ensuring database consistency

---

## Response Format

All API responses use JSON format with the following structure:

### Success Response
```json
{
  "data": { ... },
  "timestamp": 1234567890
}
```

For most endpoints, the response is the data object directly (not wrapped).

### List Responses
```json
{
  "fictionId": "fiction-123",
  "scenes": [ ... ],
  "count": 5
}
```

---

## Error Handling

### Error Response Format
```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET/PUT request |
| 201 | Created | Successful POST request |
| 204 | No Content | Successful DELETE request |
| 400 | Bad Request | Missing required fields or invalid parameters |
| 404 | Not Found | Resource does not exist |
| 500 | Internal Server Error | Database error or unexpected failure |

### Common Error Scenarios

- **400 Bad Request:** Missing required fields, invalid enum values, immutable field updates
- **404 Not Found:** Resource ID doesn't exist in database
- **500 Internal Error:** Database constraint violations, unexpected errors

---

## Core Endpoints

### Entities

**Note:** Entity endpoints are currently stubs, returning placeholder responses.

#### List Entities
```http
GET /api/entities
```

**Response:**
```json
{
  "message": "Entities endpoint - implementation pending",
  "status": "stub",
  "availableIn": "future phase"
}
```

---

### Projects

**Note:** Project endpoints are currently stubs.

#### List Projects
```http
GET /api/projects
```

**Response:**
```json
{
  "message": "Projects endpoint - implementation pending",
  "status": "stub",
  "availableIn": "future phase"
}
```

---

### Fictions

**Note:** Fiction endpoints are currently stubs.

#### List Fictions
```http
GET /api/fictions
```

**Response:**
```json
{
  "message": "Fictions endpoint - implementation pending",
  "status": "stub",
  "availableIn": "future phase"
}
```

---

## Epistemic Endpoints

The epistemic system tracks character knowledge, relationships, and dialogue profiles.

### Knowledge Facts

#### Record a Fact
```http
POST /api/epistemic/facts
```

**Request Body:**
```json
{
  "entityId": "char-001",
  "fictionId": "fiction-123",
  "factType": "secret",
  "factKey": "murder_weapon",
  "factValue": "knife in library",
  "timestamp": 1000,
  "confidence": 1.0,
  "isTrue": true
}
```

**Response:** `201 Created`
```json
{
  "factId": "fact-uuid-123",
  "entityId": "char-001",
  "factType": "secret",
  "factKey": "murder_weapon",
  "factValue": "knife in library",
  "timestamp": 1000,
  "confidence": 1.0,
  "isTrue": true
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/epistemic/facts \
  -H "Content-Type: application/json" \
  -d '{
    "entityId": "char-001",
    "fictionId": "fiction-123",
    "factType": "secret",
    "factKey": "murder_weapon",
    "factValue": "knife in library",
    "timestamp": 1000,
    "confidence": 1.0,
    "isTrue": true
  }'
```

---

#### Get Fact by ID
```http
GET /api/epistemic/facts/:factId
```

**Response:** `200 OK`
```json
{
  "factId": "fact-uuid-123",
  "entityId": "char-001",
  "factType": "secret",
  "factKey": "murder_weapon",
  "factValue": "knife in library"
}
```

**Errors:**
- `404 Not Found` - Fact does not exist

---

#### Query Entity Knowledge at Time
```http
GET /api/epistemic/entities/:entityId/knowledge?timestamp=1000
```

**Query Parameters:**
- `timestamp` (required): Narrative time to query
- `factType` (optional): Filter by fact type
- `factKey` (optional): Filter by fact key
- `fictionId` (optional): Filter by fiction

**Response:** `200 OK`
```json
{
  "entityId": "char-001",
  "timestamp": 1000,
  "facts": [
    {
      "factType": "secret",
      "factKey": "murder_weapon",
      "factValue": "knife in library",
      "confidence": 1.0,
      "isTrue": true
    }
  ],
  "count": 1
}
```

**Errors:**
- `400 Bad Request` - Missing timestamp parameter

**Example:**
```bash
curl "http://localhost:3000/api/epistemic/entities/char-001/knowledge?timestamp=1000&fictionId=fiction-123"
```

---

#### Get Specific Fact at Time
```http
GET /api/epistemic/entities/:entityId/knowledge/:factType/:factKey?timestamp=1000
```

**Response:** `200 OK`
```json
{
  "factType": "secret",
  "factKey": "murder_weapon",
  "factValue": "knife in library",
  "confidence": 1.0,
  "isTrue": true,
  "timestamp": 1000
}
```

**Errors:**
- `400 Bad Request` - Missing timestamp
- `404 Not Found` - Fact not known by entity at this time

---

#### Get Knowledge Divergence
```http
GET /api/epistemic/divergence/:entityAId/:entityBId?timestamp=1000&fictionId=fiction-123
```

**Purpose:** Compare knowledge states between two characters (dramatic irony detection).

**Response:** `200 OK`
```json
{
  "entityA": "char-001",
  "entityB": "char-002",
  "timestamp": 1000,
  "onlyAKnows": [
    { "factType": "secret", "factKey": "murder_weapon", "factValue": "knife" }
  ],
  "onlyBKnows": [
    { "factType": "event", "factKey": "alibi", "factValue": "at party" }
  ],
  "sharedKnowledge": [
    { "factType": "identity", "factKey": "victim_name", "factValue": "John Doe" }
  ],
  "divergenceCount": 2
}
```

**Errors:**
- `400 Bad Request` - Missing timestamp

---

#### Get All Knowers of a Fact
```http
GET /api/epistemic/knowers/:factType/:factKey?timestamp=1000&fictionId=fiction-123
```

**Response:** `200 OK`
```json
{
  "factType": "secret",
  "factKey": "murder_weapon",
  "timestamp": 1000,
  "knowers": [
    "char-001",
    "char-003"
  ],
  "count": 2
}
```

---

#### Get False Beliefs (Dramatic Irony)
```http
GET /api/epistemic/entities/:entityId/false-beliefs?timestamp=1000&fictionId=fiction-123
```

**Purpose:** Get facts the character believes that aren't true (for dramatic irony).

**Response:** `200 OK`
```json
{
  "entityId": "char-001",
  "timestamp": 1000,
  "falseBeliefs": [
    {
      "factType": "identity",
      "factKey": "killer",
      "factValue": "char-002",
      "isTrue": false,
      "confidence": 0.8
    }
  ],
  "count": 1
}
```

---

### Relationships

#### Record a Relationship
```http
POST /api/epistemic/relationships
```

**Request Body:**
```json
{
  "entityAId": "char-001",
  "entityBId": "char-002",
  "fictionId": "fiction-123",
  "relationshipType": "romantic",
  "timestamp": 1000,
  "sentiment": 0.7,
  "trustLevel": 0.8,
  "powerBalance": 0.5,
  "conflictLevel": 0.2,
  "status": "active"
}
```

**Response:** `201 Created`
```json
{
  "relationshipId": "rel-uuid-123",
  "entityAId": "char-001",
  "entityBId": "char-002",
  "relationshipType": "romantic",
  "timestamp": 1000,
  "sentiment": 0.7,
  "trustLevel": 0.8
}
```

---

#### Get Relationship by ID
```http
GET /api/epistemic/relationships/:relationshipId
```

**Response:** `200 OK`

**Errors:**
- `404 Not Found` - Relationship does not exist

---

#### Get Relationship Between Entities at Time
```http
GET /api/epistemic/relationships/between/:entityAId/:entityBId?timestamp=1000
```

**Query Parameters:**
- `timestamp` (required)
- `relationshipType` (optional)

**Response:** `200 OK`
```json
{
  "entityAId": "char-001",
  "entityBId": "char-002",
  "relationshipType": "romantic",
  "sentiment": 0.7,
  "trustLevel": 0.8,
  "powerBalance": 0.5,
  "conflictLevel": 0.2,
  "status": "active"
}
```

**Errors:**
- `400 Bad Request` - Missing timestamp
- `404 Not Found` - No relationship found

---

#### Get All Relationships for Entity
```http
GET /api/epistemic/entities/:entityId/relationships?timestamp=1000
```

**Query Parameters:**
- `timestamp` (required)
- `fictionId` (optional)
- `relationshipType` (optional)
- `status` (optional)

**Response:** `200 OK`
```json
{
  "entityId": "char-001",
  "timestamp": 1000,
  "relationships": [ ... ],
  "count": 3
}
```

---

#### Find Conflicts
```http
GET /api/epistemic/relationships/conflicts?timestamp=1000&minConflictLevel=0.5
```

**Query Parameters:**
- `timestamp` (required)
- `minConflictLevel` (optional, default: 0.5)
- `fictionId` (optional)

**Response:** `200 OK`
```json
{
  "timestamp": 1000,
  "minConflictLevel": 0.5,
  "conflicts": [
    {
      "entityAId": "char-001",
      "entityBId": "char-003",
      "conflictLevel": 0.8,
      "relationshipType": "adversarial"
    }
  ],
  "count": 1
}
```

---

#### Get Relationship Delta
```http
GET /api/epistemic/relationships/delta/:entityAId/:entityBId?fromTimestamp=1000&toTimestamp=2000
```

**Purpose:** Track how relationship changed over time.

**Response:** `200 OK`
```json
{
  "entityAId": "char-001",
  "entityBId": "char-002",
  "fromTimestamp": 1000,
  "toTimestamp": 2000,
  "changes": {
    "sentiment": { "from": 0.7, "to": 0.3 },
    "trustLevel": { "from": 0.8, "to": 0.4 }
  }
}
```

**Errors:**
- `400 Bad Request` - Missing fromTimestamp or toTimestamp
- `404 Not Found` - No relationship found in time range

---

### Dialogue Profiles

#### Record a Dialogue Profile
```http
POST /api/epistemic/dialogue-profiles
```

**Request Body:**
```json
{
  "entityId": "char-001",
  "fictionId": "fiction-123",
  "timestamp": 1000,
  "formality": 0.3,
  "emotionality": 0.7,
  "verbosity": 0.5,
  "vocabularyComplexity": 0.6,
  "sentenceStructure": "varied",
  "quirks": "uses metaphors, interrupts self"
}
```

**Response:** `201 Created`

---

#### Get Profile by ID
```http
GET /api/epistemic/dialogue-profiles/:profileId
```

**Response:** `200 OK`

**Errors:**
- `404 Not Found`

---

#### Get Profile for Entity at Time
```http
GET /api/epistemic/entities/:entityId/dialogue-profile?timestamp=1000
```

**Response:** `200 OK`
```json
{
  "entityId": "char-001",
  "timestamp": 1000,
  "formality": 0.3,
  "emotionality": 0.7,
  "quirks": "uses metaphors, interrupts self"
}
```

**Errors:**
- `400 Bad Request` - Missing timestamp
- `404 Not Found` - No profile found

---

#### Get Voice Hints
```http
GET /api/epistemic/entities/:entityId/voice-hints?timestamp=1000
```

**Purpose:** Get dialogue generation hints for AI.

**Query Parameters:**
- `timestamp` (required)
- `targetEntityId` (optional)
- `context` (optional)

**Response:** `200 OK`
```json
{
  "found": true,
  "hints": {
    "formality": 0.3,
    "emotionality": 0.7,
    "quirks": "uses metaphors, interrupts self",
    "examplePhrases": [ ... ]
  }
}
```

---

#### Generate Dialogue Prompt
```http
GET /api/epistemic/entities/:entityId/dialogue-prompt?timestamp=1000
```

**Purpose:** Get AI-ready prompt for dialogue generation.

**Query Parameters:**
- `timestamp` (required)
- `targetEntityId` (optional)
- `context` (optional)
- `mood` (optional)

**Response:** `200 OK`
```json
{
  "prompt": "Generate dialogue for a character with low formality (0.3), high emotionality (0.7)...",
  "profile": { ... }
}
```

**Errors:**
- `404 Not Found` - No profile exists

---

#### Get All Profiles in Fiction
```http
GET /api/epistemic/fictions/:fictionId/dialogue-profiles?timestamp=1000
```

**Response:** `200 OK`
```json
{
  "fictionId": "fiction-123",
  "timestamp": 1000,
  "profiles": [ ... ],
  "count": 5
}
```

---

## Logic Layer Endpoints

The Logic Layer tracks story structure: causality chains, character arcs, conflicts, themes, motifs, setups/payoffs, and world rules.

### Causality Chains

#### Create Causality Chain
```http
POST /api/logic/causality
```

**Request Body:**
```json
{
  "cause_event_id": "event-001",
  "effect_event_id": "event-002",
  "type": "direct_cause",
  "strength": 8,
  "explanation": "Event A directly caused Event B"
}
```

**Valid Types:**
- `direct_cause`
- `enabling_condition`
- `motivation`
- `psychological_trigger`

**Response:** `201 Created`
```json
{
  "chain_uuid": "chain-123",
  "cause_event_id": "event-001",
  "effect_event_id": "event-002",
  "type": "direct_cause",
  "strength": 8,
  "explanation": "Event A directly caused Event B"
}
```

**Errors:**
- `400 Bad Request` - Missing required fields or invalid type

**Example:**
```bash
curl -X POST http://localhost:3000/api/logic/causality \
  -H "Content-Type: application/json" \
  -d '{
    "cause_event_id": "event-001",
    "effect_event_id": "event-002",
    "type": "direct_cause",
    "strength": 8
  }'
```

---

#### Get Chain by ID
```http
GET /api/logic/causality/:chainId
```

**Response:** `200 OK`

**Errors:**
- `404 Not Found`

---

#### Traverse Causal Chain
```http
GET /api/logic/causality/chain/:eventId?depth=3
```

**Purpose:** Get complete causal graph (upstream causes and downstream effects).

**Query Parameters:**
- `depth` (optional, default: 3, max: 10): How many levels to traverse

**Response:** `200 OK`
```json
{
  "rootEvent": "event-002",
  "depth": 3,
  "nodes": [
    { "id": "event-001", "level": -1 },
    { "id": "event-002", "level": 0 },
    { "id": "event-003", "level": 1 }
  ],
  "edges": [
    {
      "from": "event-001",
      "to": "event-002",
      "type": "direct_cause",
      "strength": 8
    }
  ],
  "nodeCount": 3,
  "edgeCount": 2
}
```

**Errors:**
- `400 Bad Request` - Depth must be between 1 and 10

**Example:**
```bash
curl "http://localhost:3000/api/logic/causality/chain/event-002?depth=5"
```

---

#### Update Chain
```http
PUT /api/logic/causality/:chainId
```

**Request Body:**
```json
{
  "strength": 9,
  "explanation": "Updated explanation"
}
```

**Note:** `type` field is immutable and cannot be updated.

**Response:** `200 OK`

**Errors:**
- `400 Bad Request` - Attempting to update immutable field
- `404 Not Found`

---

#### Delete Chain
```http
DELETE /api/logic/causality/:chainId
```

**Response:** `204 No Content`

**Errors:**
- `404 Not Found`

---

### Character Arcs

Character arcs use the Save the Cat 13-beat structure.

#### Create Character Arc
```http
POST /api/logic/arcs
```

**Request Body:**
```json
{
  "character_id": "char-001",
  "archetype": "hero",
  "lie_belief": "I must be strong alone",
  "truth_belief": "Strength comes from community",
  "want_external": "Defeat the villain",
  "need_internal": "Learn to trust others",
  "current_phase": "setup"
}
```

**Valid Phases:**
- `setup`
- `catalyst`
- `debate`
- `midpoint`
- `all_is_lost`
- `finale`

**Response:** `201 Created`
```json
{
  "arc_uuid": "arc-123",
  "character_id": "char-001",
  "archetype": "hero",
  "lie_belief": "I must be strong alone",
  "truth_belief": "Strength comes from community",
  "current_phase": "setup"
}
```

**Errors:**
- `400 Bad Request` - Missing character_id or invalid phase

---

#### Get Arcs by Project
```http
GET /api/logic/arcs/project/:projectId
```

**Response:** `200 OK`
```json
[
  {
    "arc_uuid": "arc-123",
    "character_id": "char-001",
    "current_phase": "midpoint",
    "archetype": "hero"
  }
]
```

---

#### Get Arc by Character
```http
GET /api/logic/arcs/character/:characterId
```

**Response:** `200 OK`

**Errors:**
- `404 Not Found`

---

#### Get Arc by ID
```http
GET /api/logic/arcs/:arcId
```

**Response:** `200 OK`

**Errors:**
- `404 Not Found`

---

#### Update Arc
```http
PUT /api/logic/arcs/:arcId
```

**Request Body:**
```json
{
  "current_phase": "midpoint",
  "lie_belief": "Updated lie"
}
```

**Note:** `character_id` is immutable.

**Response:** `200 OK`

**Errors:**
- `400 Bad Request` - Invalid phase or attempting to update character_id
- `404 Not Found`

---

#### Advance Arc Phase
```http
POST /api/logic/arcs/:arcId/advance
```

**Purpose:** Helper endpoint to advance arc to next phase sequentially.

**Response:** `200 OK`
```json
{
  "arc_uuid": "arc-123",
  "character_id": "char-001",
  "current_phase": "catalyst"
}
```

**Errors:**
- `404 Not Found`

---

#### Delete Arc
```http
DELETE /api/logic/arcs/:arcId
```

**Response:** `204 No Content`

**Errors:**
- `404 Not Found`

---

### Story Conflicts

#### Create Story Conflict
```http
POST /api/logic/conflicts
```

**Request Body:**
```json
{
  "project_id": "project-123",
  "type": "internal",
  "protagonist_id": "char-001",
  "antagonist_source": "self-doubt",
  "stakes_success": "Inner peace",
  "stakes_fail": "Breakdown",
  "status": "latent"
}
```

**Valid Types:**
- `internal`
- `interpersonal`
- `societal`
- `environmental`
- `supernatural`

**Valid Statuses:**
- `latent`
- `active`
- `escalating`
- `climactic`
- `resolved`

**Response:** `201 Created`

**Errors:**
- `400 Bad Request` - Missing required fields or invalid type/status

---

#### Get Conflict by ID
```http
GET /api/logic/conflicts/:conflictId
```

**Response:** `200 OK`

**Errors:**
- `404 Not Found`

---

#### Get Conflicts by Project
```http
GET /api/logic/conflicts/project/:projectId
```

**Response:** `200 OK`
```json
[
  {
    "conflict_uuid": "conflict-123",
    "type": "internal",
    "status": "active",
    "protagonist_id": "char-001"
  }
]
```

---

#### Update Conflict
```http
PUT /api/logic/conflicts/:conflictId
```

**Request Body:**
```json
{
  "status": "escalating",
  "stakes_fail": "Updated stakes"
}
```

**Note:** `conflict_uuid`, `project_id`, and `protagonist_id` are immutable.

**Response:** `200 OK`

**Errors:**
- `400 Bad Request` - Attempting to update immutable fields
- `404 Not Found`

---

#### Transition Conflict Status
```http
POST /api/logic/conflicts/:conflictId/transition
```

**Purpose:** Helper endpoint to transition conflict status.

**Request Body:**
```json
{
  "new_status": "climactic"
}
```

**Response:** `200 OK`

**Errors:**
- `400 Bad Request` - Missing new_status or invalid status
- `404 Not Found`

---

#### Delete Conflict
```http
DELETE /api/logic/conflicts/:conflictId
```

**Response:** `204 No Content`

**Errors:**
- `404 Not Found`

---

### Thematic Elements

#### Create Theme
```http
POST /api/logic/themes
```

**Request Body:**
```json
{
  "project_id": "project-123",
  "statement": "Power corrupts absolutely",
  "primary_symbol_id": "crown",
  "question": "Can power be wielded justly?",
  "manifestations": ["Scene 1: King refuses advice", "Scene 5: Betrayal"]
}
```

**Response:** `201 Created`

**Errors:**
- `400 Bad Request` - Missing project_id or statement

---

#### Get Theme by ID
```http
GET /api/logic/themes/:themeId
```

**Response:** `200 OK`

**Errors:**
- `404 Not Found`

---

#### Get Themes by Project
```http
GET /api/logic/themes/project/:projectId
```

**Response:** `200 OK`

---

#### Update Theme
```http
PUT /api/logic/themes/:themeId
```

**Request Body:**
```json
{
  "statement": "Updated statement",
  "question": "Updated question"
}
```

**Response:** `200 OK`

**Errors:**
- `404 Not Found`

---

#### Add Manifestation
```http
POST /api/logic/themes/:themeId/manifestations
```

**Request Body:**
```json
{
  "manifestation": "Scene 10: Final confrontation"
}
```

**Response:** `200 OK` (returns updated theme)

**Errors:**
- `400 Bad Request` - Missing manifestation
- `404 Not Found`

---

#### Remove Manifestation
```http
DELETE /api/logic/themes/:themeId/manifestations/:index
```

**Response:** `200 OK` (returns updated theme)

**Errors:**
- `400 Bad Request` - Invalid index
- `404 Not Found`

---

#### Delete Theme
```http
DELETE /api/logic/themes/:themeId
```

**Response:** `204 No Content`

**Errors:**
- `404 Not Found`

---

### Motif Instances

#### Create Motif Instance
```http
POST /api/logic/motifs
```

**Request Body:**
```json
{
  "project_id": "project-123",
  "motif_type": "visual",
  "linked_entity_id": "obj-001",
  "description": "Red scarf appears repeatedly",
  "significance": "Symbol of lost love"
}
```

**Valid Types:**
- `visual`
- `auditory`
- `symbolic`
- `narrative_pattern`
- `recurring_phrase`

**Response:** `201 Created`

**Errors:**
- `400 Bad Request` - Missing required fields or invalid type

---

#### Get Motif by ID
```http
GET /api/logic/motifs/:motifId
```

**Response:** `200 OK`

**Errors:**
- `404 Not Found`

---

#### Get Motifs by Type
```http
GET /api/logic/motifs/type/:type?project_id=project-123
```

**Query Parameters:**
- `project_id` (required)

**Response:** `200 OK`

**Errors:**
- `400 Bad Request` - Missing project_id

---

#### Get Motifs by Project
```http
GET /api/logic/motifs/project/:projectId
```

**Response:** `200 OK`

---

#### Update Motif
```http
PUT /api/logic/motifs/:motifId
```

**Response:** `200 OK`

**Errors:**
- `404 Not Found`

---

#### Delete Motif
```http
DELETE /api/logic/motifs/:motifId
```

**Response:** `204 No Content`

**Errors:**
- `404 Not Found`

---

### Setup/Payoffs (Chekhov's Gun)

#### Create Setup/Payoff
```http
POST /api/logic/setup-payoffs
```

**Request Body:**
```json
{
  "project_id": "project-123",
  "setup_event_id": "event-001",
  "payoff_event_id": "event-010",
  "description": "Gun on mantelpiece",
  "status": "planted",
  "planted_chapter": "ch-1",
  "fired_chapter": "ch-10"
}
```

**Valid Statuses:**
- `planted`
- `referenced`
- `fired`
- `unfired`

**Response:** `201 Created`

**Errors:**
- `400 Bad Request` - Missing required fields or invalid status

---

#### Get Setup by ID
```http
GET /api/logic/setup-payoffs/:setupId
```

**Response:** `200 OK`

**Errors:**
- `404 Not Found`

---

#### Get Setups by Project
```http
GET /api/logic/setup-payoffs/project/:projectId
```

**Response:** `200 OK`

---

#### Get Unfired Setups
```http
GET /api/logic/setup-payoffs/unfired?project_id=project-123
```

**Purpose:** Track Chekhov's guns that haven't fired yet.

**Query Parameters:**
- `project_id` (required)

**Response:** `200 OK`
```json
[
  {
    "setup_uuid": "setup-123",
    "description": "Gun on mantelpiece",
    "status": "planted",
    "planted_chapter": "ch-1"
  }
]
```

**Errors:**
- `400 Bad Request` - Missing project_id

---

#### Fire Setup
```http
POST /api/logic/setup-payoffs/:setupId/fire
```

**Purpose:** Helper endpoint to mark setup as fired.

**Request Body:**
```json
{
  "payoff_event_id": "event-010",
  "fired_chapter": "ch-10"
}
```

**Response:** `200 OK`

**Errors:**
- `400 Bad Request` - Missing required fields
- `404 Not Found`

---

#### Update Setup
```http
PUT /api/logic/setup-payoffs/:setupId
```

**Response:** `200 OK`

**Errors:**
- `404 Not Found`

---

#### Delete Setup
```http
DELETE /api/logic/setup-payoffs/:setupId
```

**Response:** `204 No Content`

**Errors:**
- `404 Not Found`

---

### World Rules

#### Create World Rule
```http
POST /api/logic/world-rules
```

**Request Body:**
```json
{
  "project_id": "project-123",
  "rule_category": "physics",
  "statement": "Magic requires sacrifice",
  "exceptions": "Ancient artifacts bypass this rule",
  "enforcement_level": "strict"
}
```

**Valid Categories:**
- `physics`
- `magic`
- `technology`
- `social`
- `biological`
- `metaphysical`

**Valid Enforcement Levels:**
- `strict` (immutable laws)
- `flexible` (social norms with exceptions)
- `guideline` (soft suggestions)

**Response:** `201 Created`

**Errors:**
- `400 Bad Request` - Missing required fields or invalid category/level

---

#### Get Rule by ID
```http
GET /api/logic/world-rules/:ruleId
```

**Response:** `200 OK`

**Errors:**
- `404 Not Found`

---

#### Get Rules by Category
```http
GET /api/logic/world-rules/category/:category?project_id=project-123
```

**Query Parameters:**
- `project_id` (required)

**Response:** `200 OK`

**Errors:**
- `400 Bad Request` - Missing project_id

---

#### Get Rules by Project
```http
GET /api/logic/world-rules/project/:projectId
```

**Response:** `200 OK`

---

#### Update Rule
```http
PUT /api/logic/world-rules/:ruleId
```

**Response:** `200 OK`

**Errors:**
- `404 Not Found`

---

#### Delete Rule
```http
DELETE /api/logic/world-rules/:ruleId
```

**Response:** `204 No Content`

**Errors:**
- `404 Not Found`

---

## Orchestrator Endpoints

The Orchestrator assembles complete context packets for AI-driven scene generation using the QACS workflow (Query-Assemble-Context-Supply).

### Assemble Context for Scene

```http
GET /api/orchestrator/:sceneId
```

**Purpose:** THE PRIMARY ENDPOINT for narrative generation. Assembles complete zero-knowledge context packet.

**Response:** `200 OK`
```json
{
  "meta": {
    "sceneId": "scene-001",
    "fictionId": "fiction-123",
    "narrativeTime": 1000,
    "assembledAt": 1234567890,
    "assemblyTimeMs": 24
  },
  "scene": {
    "id": "scene-001",
    "title": "The Confrontation",
    "summary": "Hero confronts villain",
    "sceneNumber": 5,
    "locationId": "loc-001",
    "mood": "tense",
    "tensionLevel": 0.8,
    "stakes": "Life or death",
    "sceneGoal": "Extract confession",
    "status": "draft"
  },
  "pov": {
    "entityId": "char-001",
    "knowledge": {
      "facts": [ ... ],
      "factCount": 25,
      "byType": {
        "secret": [ ... ],
        "event": [ ... ]
      }
    },
    "falseBeliefs": {
      "facts": [ ... ],
      "count": 2
    },
    "voice": {
      "formality": 0.3,
      "emotionality": 0.7,
      "quirks": "uses metaphors"
    },
    "relationships": [ ... ]
  },
  "characters": {
    "present": [
      {
        "entityId": "char-002",
        "voice": { ... },
        "knowledgeCount": 18,
        "keySecrets": ["murder_weapon"]
      }
    ],
    "count": 2,
    "entering": [],
    "exiting": []
  },
  "relationships": {
    "pairs": {
      "char-001:char-002": {
        "entityA": "char-001",
        "entityB": "char-002",
        "type": "adversarial",
        "sentiment": -0.8,
        "trustLevel": 0.1,
        "powerBalance": 0.6,
        "conflictLevel": 0.9,
        "status": "active"
      }
    },
    "pairCount": 1
  },
  "conflicts": [
    {
      "id": "conflict-123",
      "type": "interpersonal",
      "status": "climactic",
      "protagonist": "char-001",
      "antagonist": "char-002",
      "stakes": {
        "success": "Justice served",
        "failure": "Killer escapes"
      }
    }
  ],
  "themes": [
    {
      "id": "theme-123",
      "statement": "Justice vs revenge",
      "question": "Can justice be achieved without vengeance?",
      "primarySymbol": "scales",
      "manifestations": ["Scene 1: ...", "Scene 5: ..."]
    }
  ],
  "logicLayer": {
    "conflicts": [ ... ],
    "characterArcs": [
      {
        "characterId": "char-001",
        "archetype": "hero",
        "currentPhase": "midpoint",
        "lie": "I must be strong alone",
        "truth": "Strength comes from community",
        "want": "Defeat the villain",
        "need": "Learn to trust"
      }
    ],
    "themes": [ ... ]
  },
  "forbiddenReveals": {
    "facts": [
      {
        "factKey": "secret:true_killer",
        "factType": "secret",
        "key": "true_killer",
        "povAlreadyKnows": false,
        "criticality": "high"
      }
    ],
    "count": 1,
    "criticalCount": 1
  },
  "pacing": {
    "currentCheckpoint": {
      "type": "midpoint",
      "tensionTarget": 0.7,
      "emotionalBeat": "false_victory"
    },
    "nextCheckpoint": {
      "type": "all_is_lost",
      "tensionTarget": 0.9,
      "timeUntil": 500
    },
    "tensionStats": {
      "mean": 0.6,
      "stdDev": 0.2
    },
    "ventMoments": [
      {
        "entityId": "char-001",
        "type": "humor",
        "emotionalPeak": 0.5
      }
    ],
    "recommendedTensionDirection": "increase"
  },
  "previousScene": {
    "previousSceneId": "scene-004",
    "previousSceneTitle": "The Discovery",
    "transitionType": "cut",
    "timeGap": 30,
    "carriedTensions": "Unresolved argument",
    "locationChanged": true,
    "povChanged": false,
    "continuityNotes": "Character still holding weapon"
  }
}
```

**Errors:**
- `404 Not Found` - Scene does not exist
- `500 Internal Server Error` - Assembly failed

**Example:**
```bash
curl http://localhost:3000/api/orchestrator/scene-001
```

---

### Assemble Quick Context

```http
GET /api/orchestrator/:sceneId/quick
```

**Purpose:** Lightweight context for performance-critical paths (dialogue generation only).

**Response:** `200 OK`
```json
{
  "meta": {
    "sceneId": "scene-001",
    "assemblyTimeMs": 8,
    "mode": "quick"
  },
  "scene": {
    "id": "scene-001",
    "title": "The Confrontation",
    "mood": "tense",
    "tensionLevel": 0.8
  },
  "characters": [
    {
      "entityId": "char-001",
      "voice": { ... }
    }
  ],
  "forbiddenReveals": ["secret:true_killer"]
}
```

---

### Scene Management

#### Create Scene
```http
POST /api/orchestrator/scenes
```

**Request Body:**
```json
{
  "fictionId": "fiction-123",
  "sceneNumber": 5,
  "title": "The Confrontation",
  "summary": "Hero confronts villain",
  "narrativeTime": 1000,
  "povEntityId": "char-001",
  "locationId": "loc-001",
  "chapterId": "ch-1",
  "presentEntityIds": ["char-001", "char-002"],
  "mood": "tense",
  "tensionLevel": 0.8,
  "stakes": "Life or death",
  "sceneGoal": "Extract confession",
  "status": "draft"
}
```

**Response:** `201 Created`

---

#### Get Scene by ID
```http
GET /api/orchestrator/scenes/:sceneId
```

**Response:** `200 OK`

**Errors:**
- `404 Not Found`

---

#### Get Scenes in Fiction
```http
GET /api/orchestrator/fictions/:fictionId/scenes?chapterId=ch-1&status=draft&limit=10&offset=0
```

**Query Parameters:**
- `chapterId` (optional)
- `status` (optional)
- `limit` (optional)
- `offset` (optional)

**Response:** `200 OK`
```json
{
  "fictionId": "fiction-123",
  "scenes": [ ... ],
  "count": 5
}
```

---

#### Update Scene
```http
PATCH /api/orchestrator/scenes/:sceneId
```

**Request Body:**
```json
{
  "status": "final",
  "tensionLevel": 0.9
}
```

**Response:** `200 OK`

**Errors:**
- `404 Not Found`

---

#### Delete Scene
```http
DELETE /api/orchestrator/scenes/:sceneId
```

**Response:** `204 No Content`

**Errors:**
- `404 Not Found`

---

#### Get Scene Stats
```http
GET /api/orchestrator/fictions/:fictionId/scenes/stats
```

**Response:** `200 OK`
```json
{
  "totalScenes": 25,
  "byStatus": {
    "draft": 10,
    "final": 15
  },
  "avgTensionLevel": 0.6
}
```

---

#### Batch Update Scenes
```http
PATCH /api/orchestrator/scenes/batch
```

**Purpose:** Renumber scenes after drag-and-drop reordering.

**Request Body:**
```json
{
  "updates": [
    { "sceneId": "scene-001", "sceneNumber": 1, "chapterId": "ch-1" },
    { "sceneId": "scene-002", "sceneNumber": 2, "chapterId": "ch-1" }
  ]
}
```

**Response:** `200 OK`
```json
{
  "updated": 2,
  "scenes": [ ... ]
}
```

---

### Chapter Management

#### Split Chapter
```http
POST /api/orchestrator/chapters/:chapterId/split
```

**Request Body:**
```json
{
  "splitIndex": 3
}
```

**Purpose:** Split chapter at scene index (scenes 1-2 stay, 3+ move to new chapter).

**Response:** `200 OK`
```json
{
  "originalChapter": "ch-1",
  "newChapter": "ch-1234567890",
  "scenesMoved": 5,
  "scenesRemaining": 2
}
```

**Errors:**
- `400 Bad Request` - Invalid splitIndex

---

#### Merge Chapters
```http
POST /api/orchestrator/chapters/merge
```

**Request Body:**
```json
{
  "chapter1Id": "ch-1",
  "chapter2Id": "ch-2"
}
```

**Response:** `200 OK`
```json
{
  "mergedChapter": "ch-1",
  "deletedChapter": "ch-2",
  "totalScenes": 10
}
```

**Errors:**
- `400 Bad Request` - Missing chapter IDs

---

#### Rename Chapter
```http
PATCH /api/orchestrator/chapters/:chapterId
```

**Note:** Chapters are ID-based logical groupings without separate titles.

**Request Body:**
```json
{
  "title": "New Chapter Title"
}
```

**Response:** `200 OK`
```json
{
  "chapterId": "ch-1",
  "message": "Chapter ID is immutable. To change chapter organization, use split/merge operations.",
  "sceneCount": 5,
  "requestedTitle": "New Chapter Title"
}
```

---

#### Delete Chapter
```http
DELETE /api/orchestrator/chapters/:chapterId
```

**Purpose:** Deletes chapter and all scenes within it.

**Response:** `200 OK`
```json
{
  "chapterId": "ch-1",
  "deletedScenes": 5,
  "message": "Chapter ch-1 and its 5 scene(s) deleted"
}
```

**Errors:**
- `404 Not Found`

---

### Transitions

#### Create Transition
```http
POST /api/orchestrator/transitions
```

**Request Body:**
```json
{
  "fromSceneId": "scene-001",
  "toSceneId": "scene-002",
  "transitionType": "cut",
  "timeGapMinutes": 30,
  "carriedTensions": "Unresolved argument",
  "locationChange": true,
  "povChange": false,
  "continuityNotes": "Character still holding weapon"
}
```

**Response:** `201 Created`

---

#### Get Transition by ID
```http
GET /api/orchestrator/transitions/:transitionId
```

**Response:** `200 OK`

**Errors:**
- `404 Not Found`

---

#### Validate Transition
```http
POST /api/orchestrator/transitions/:transitionId/validate
```

**Purpose:** Check continuity between scenes.

**Response:** `200 OK`
```json
{
  "valid": true,
  "warnings": [],
  "errors": []
}
```

---

#### Validate All Transitions in Fiction
```http
POST /api/orchestrator/fictions/:fictionId/transitions/validate
```

**Response:** `200 OK`

---

#### Auto-Create Transitions
```http
POST /api/orchestrator/fictions/:fictionId/transitions/auto-create
```

**Purpose:** Generate transitions between all sequential scenes.

**Response:** `201 Created`
```json
{
  "created": 10,
  "transitions": [ ... ]
}
```

---

### Pacing

#### Create Pacing Checkpoint
```http
POST /api/orchestrator/checkpoints
```

**Request Body:**
```json
{
  "fictionId": "fiction-123",
  "narrativeTime": 1000,
  "checkpointType": "midpoint",
  "tensionTarget": 0.7,
  "emotionalBeat": "false_victory"
}
```

**Response:** `201 Created`

---

#### Get Tension Curve
```http
GET /api/orchestrator/fictions/:fictionId/tension-curve?startTime=0&endTime=5000
```

**Response:** `200 OK`
```json
{
  "points": [
    { "time": 0, "tension": 0.3 },
    { "time": 1000, "tension": 0.5 }
  ],
  "stats": {
    "mean": 0.6,
    "stdDev": 0.2
  }
}
```

---

#### Analyze Pacing
```http
GET /api/orchestrator/fictions/:fictionId/pacing/analyze
```

**Response:** `200 OK`
```json
{
  "overallPacing": "good",
  "issues": [],
  "recommendations": ["Increase tension before climax"]
}
```

---

#### Create Vent Moment
```http
POST /api/orchestrator/vent-moments
```

**Request Body:**
```json
{
  "sceneId": "scene-001",
  "entityId": "char-001",
  "ventType": "humor",
  "emotionalPeak": 0.5,
  "description": "Comic relief moment"
}
```

**Response:** `201 Created`

---

#### Get Vent Moments in Scene
```http
GET /api/orchestrator/scenes/:sceneId/vent-moments
```

**Response:** `200 OK`
```json
{
  "sceneId": "scene-001",
  "ventMoments": [ ... ],
  "count": 2
}
```

---

## Validation Endpoints

The validation system runs 106 rules across 8 categories to ensure database consistency.

### Run Full Validation

```http
GET /api/validation
```

**Purpose:** Run all 106 validation rules and return comprehensive report.

**Response:** `200 OK`
```json
{
  "timestamp": "2026-01-17T10:30:00Z",
  "summary": {
    "total_rules": 106,
    "passed": 98,
    "failed": 5,
    "skipped": 3
  },
  "critical": [
    {
      "rule": "EPIST-001",
      "severity": "critical",
      "message": "Fact recorded before entity created",
      "details": { ... }
    }
  ],
  "errors": [
    {
      "rule": "CAUSAL-002",
      "severity": "error",
      "message": "Circular causality chain detected",
      "details": { ... }
    }
  ],
  "warnings": [
    {
      "rule": "ARC-005",
      "severity": "warning",
      "message": "Character arc phase skipped",
      "details": { ... }
    }
  ],
  "categories": {
    "epistemic": { "passed": 12, "failed": 1 },
    "causality": { "passed": 10, "failed": 0 },
    "arcs": { "passed": 8, "failed": 1 },
    "conflicts": { "passed": 9, "failed": 0 },
    "setup_payoffs": { "passed": 7, "failed": 2 },
    "world_rules": { "passed": 5, "failed": 0 },
    "narrative": { "passed": 15, "failed": 1 },
    "performance": { "passed": 32, "failed": 0 }
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/validation
```

---

### Get Validation Summary

```http
GET /api/validation/summary
```

**Purpose:** Return summary stats only (faster than full report).

**Response:** `200 OK`
```json
{
  "timestamp": "2026-01-17T10:30:00Z",
  "summary": {
    "total_rules": 106,
    "passed": 98,
    "failed": 5,
    "skipped": 3
  },
  "critical_count": 1,
  "error_count": 4,
  "warning_count": 12
}
```

---

### Get Errors Only

```http
GET /api/validation/errors
```

**Response:** `200 OK`
```json
{
  "timestamp": "2026-01-17T10:30:00Z",
  "critical": [ ... ],
  "errors": [ ... ],
  "total": 5
}
```

---

### Get Warnings Only

```http
GET /api/validation/warnings
```

**Response:** `200 OK`
```json
{
  "timestamp": "2026-01-17T10:30:00Z",
  "warnings": [ ... ],
  "total": 12
}
```

---

### Get Results by Category

```http
GET /api/validation/category/:category
```

**Valid Categories:**
- `epistemic`
- `causality`
- `arcs`
- `conflicts`
- `setup_payoffs`
- `world_rules`
- `narrative`
- `performance`

**Response:** `200 OK`
```json
{
  "timestamp": "2026-01-17T10:30:00Z",
  "category": "epistemic",
  "results": {
    "passed": 12,
    "failed": 1,
    "issues": [ ... ]
  }
}
```

**Errors:**
- `400 Bad Request` - Invalid category

---

### List Validation Categories

```http
GET /api/validation/categories
```

**Response:** `200 OK`
```json
{
  "total_categories": 8,
  "total_rules": 106,
  "categories": [
    {
      "key": "epistemic",
      "name": "Epistemic",
      "rule_count": 13,
      "rules": [
        {
          "id": "EPIST-001",
          "name": "Fact timestamp after entity creation",
          "severity": "critical"
        }
      ]
    }
  ]
}
```

---

### Health Check

```http
GET /api/validation/health
```

**Purpose:** Quick health check (critical and error rules only).

**Response:** `200 OK`
```json
{
  "timestamp": "2026-01-17T10:30:00Z",
  "status": "healthy",
  "critical_issues": 0,
  "error_issues": 0,
  "warning_issues": 12,
  "issues": []
}
```

**Status values:**
- `healthy` - No critical or error issues
- `degraded` - Error issues present
- `critical` - Critical issues present

---

### Run Validation (Job-based)

```http
POST /api/validation/run
```

**Purpose:** Trigger validation and return job status (structured for future async support).

**Response:** `200 OK`
```json
{
  "job_id": "val-1234567890",
  "status": "complete",
  "started_at": "2026-01-17T10:30:00Z",
  "completed_at": "2026-01-17T10:30:02Z",
  "duration_ms": 1523,
  "summary": { ... },
  "critical_count": 0,
  "error_count": 0,
  "warning_count": 5
}
```

---

## State Management Endpoints

### Get Asset State at Event

```http
GET /api/state/:assetId/at/:eventId
```

**Purpose:** Time-travel - reconstruct asset state at specific event using hybrid state system.

**Response:** `200 OK`
```json
{
  "assetId": "asset-001",
  "eventId": "event-005",
  "state": {
    "field1": "value1",
    "field2": "value2"
  },
  "timestamp": 1234567890
}
```

**Example:**
```bash
curl http://localhost:3000/api/state/asset-001/at/event-005
```

---

### Get Current State

```http
GET /api/state/:assetId
```

**Purpose:** Get latest state for asset.

**Response:** `200 OK`
```json
{
  "assetId": "asset-001",
  "eventId": "event-010",
  "state": { ... },
  "timestamp": 1234567890
}
```

**Errors:**
- `404 Not Found` - Asset does not exist

---

### Get Cache Stats

```http
GET /api/state/stats/cache
```

**Purpose:** Performance monitoring - check state reconstruction cache statistics.

**Response:** `200 OK`
```json
{
  "cacheHits": 1250,
  "cacheMisses": 45,
  "hitRate": 0.965,
  "cacheSize": 150
}
```

---

## Utility Endpoints

### Event Moments

#### Create Moment
```http
POST /api/moments
```

**Request Body:**
```json
{
  "event_uuid": "event-001",
  "sequence_index": 1,
  "beat_description": "Hero enters room",
  "timestamp_offset": 100
}
```

**Response:** `201 Created`

**Errors:**
- `400 Bad Request` - Missing required fields

---

#### Get Moments by Event
```http
GET /api/moments/:eventUuid
```

**Response:** `200 OK`
```json
[
  {
    "moment_uuid": "moment-123",
    "event_uuid": "event-001",
    "sequence_index": 1,
    "beat_description": "Hero enters room",
    "timestamp_offset": 100
  }
]
```

---

#### Update Moment
```http
PUT /api/moments/:momentUuid
```

**Request Body:**
```json
{
  "beat_description": "Updated description",
  "timestamp_offset": 150
}
```

**Response:** `200 OK`

**Errors:**
- `404 Not Found`

---

#### Delete Moment
```http
DELETE /api/moments/:momentUuid
```

**Response:** `204 No Content`

**Errors:**
- `404 Not Found`

---

### Temporal (Stub)

**Note:** Temporal endpoints are currently stubs.

```http
GET /api/temporal
```

**Response:**
```json
{
  "message": "Temporal endpoint - implementation pending",
  "status": "stub",
  "availableIn": "future phase"
}
```

---

### Search (Stub)

**Note:** Search endpoints are currently stubs.

```http
GET /api/search
```

**Response:**
```json
{
  "message": "Search endpoint - implementation pending",
  "status": "stub",
  "availableIn": "future phase"
}
```

---

### Export (Stub)

**Note:** Export endpoints are currently stubs.

```http
GET /api/export
```

**Response:**
```json
{
  "message": "Export endpoint - implementation pending",
  "status": "stub",
  "availableIn": "future phase"
}
```

---

## Appendix: Enum Values Reference

### Causality Chain Types
- `direct_cause` - Event A directly caused Event B
- `enabling_condition` - Event A enabled Event B to happen
- `motivation` - Event A motivated Event B
- `psychological_trigger` - Event A psychologically triggered Event B

### Character Arc Phases (Save the Cat)
- `setup` - Introduction and status quo
- `catalyst` - Inciting incident
- `debate` - Internal/external debate
- `midpoint` - False victory/defeat
- `all_is_lost` - Darkest moment
- `finale` - Climax and resolution

### Conflict Types
- `internal` - Within character's psyche
- `interpersonal` - Between characters
- `societal` - Against social structures
- `environmental` - Against nature/setting
- `supernatural` - Against supernatural forces

### Conflict Statuses
- `latent` - Present but not active
- `active` - Currently in play
- `escalating` - Increasing in intensity
- `climactic` - At peak
- `resolved` - Concluded

### Motif Types
- `visual` - Visual recurring element
- `auditory` - Sound/music pattern
- `symbolic` - Symbolic representation
- `narrative_pattern` - Story structure pattern
- `recurring_phrase` - Repeated dialogue/text

### Setup/Payoff Statuses
- `planted` - Setup established
- `referenced` - Setup mentioned again
- `fired` - Payoff delivered
- `unfired` - Not yet paid off

### World Rule Categories
- `physics` - Physical laws
- `magic` - Magical system rules
- `technology` - Tech limitations
- `social` - Social norms
- `biological` - Biological constraints
- `metaphysical` - Metaphysical principles

### World Rule Enforcement Levels
- `strict` - Immutable laws (never broken)
- `flexible` - Social norms (exceptions allowed)
- `guideline` - Soft suggestions

---

## Performance Targets

- **State Reconstruction:** <100ms for 100-delta chains
- **Context Assembly:** <1s for 10-character scenes
- **Validation:** <2s for full 106-rule run
- **Storage:** <50MB for 10-book series

---

## Rate Limiting

Currently no rate limiting is implemented. For production deployments, consider implementing rate limiting at the reverse proxy level.

---

## Versioning

API version is included in response headers:
```
X-API-Version: 4.1.0
```

Breaking changes will increment the major version number.

---

## Support

For issues, feature requests, or questions:
- GitHub Issues: [repository URL]
- Documentation: See USAGE_MANUAL_v4.1.md
- Migration Guide: See MIGRATION_GUIDE.md
