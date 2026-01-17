# TripleThink GUI Component Guide

**Version:** v4.1
**Last Updated:** 2026-01-17

## Introduction

This guide documents all GUI components built for TripleThink across Phases 8-12. Each component is designed for the vanilla JavaScript architecture (no build step) and follows a consistent pattern: singleton objects with `render()` methods returning HTML strings, state integration via the global `state` object, and pub/sub reactivity.

**How to use this guide:**
- Find the component you need in the table of contents
- Review its purpose and when to use it
- Study the API methods and parameters
- Copy usage examples into your screen implementations
- Check state integration section for reactive behavior

**Component architecture:**
- **No ES6 modules**: All components are loaded via `<script>` tags
- **Global scope**: Components are available as global objects (e.g., `PowerDrawer`, `ArcCard`)
- **State-driven**: Components subscribe to `state` changes for reactivity
- **HTML strings**: `render()` methods return HTML strings, not DOM nodes
- **Event delegation**: Event handlers attached after DOM insertion

---

## Core Infrastructure Components (Phase 8)

### power-drawer.js

**Purpose:** Slide-out drawer panel for advanced inspection and detailed views. Preserves screen real estate while providing space for detailed information.

**API:**

```javascript
PowerDrawer.init()
// Initialize drawer (creates DOM structure, wires up events)
// Call once during app initialization

PowerDrawer.open()
// Open the drawer (updates state)

PowerDrawer.close()
// Close the drawer (updates state)

PowerDrawer.toggle()
// Toggle drawer open/closed state

PowerDrawer.setContent(htmlString)
// Set drawer content
// @param htmlString {string} - HTML to display in drawer
```

**Usage Example:**

```javascript
// During app initialization
PowerDrawer.init();

// From a component that wants to show details
PowerDrawer.setContent(`
  <h3>Scene Details</h3>
  <p>Scene analysis and metadata...</p>
`);
PowerDrawer.open();
```

**State Integration:**
- Reads: `state.get('powerDrawerOpen')`
- Updates: `state.update({ powerDrawerOpen: true/false })`
- Subscribes to: `powerDrawerOpen` (applies/removes `open` class on drawer)

**Events:**
- Close button click → `PowerDrawer.close()`

**CSS Classes:**
- `.power-drawer` - Main container
- `.power-drawer.open` - Open state (slides in from right)
- `.power-drawer-header` - Header with title and close button
- `.power-drawer-content` - Scrollable content area

---

### layer-switcher.js

**Purpose:** Toggle between epistemic layers (World Truth, Character View, Reader View) to control what knowledge layer is displayed throughout the application.

**API:**

```javascript
LayerSwitcher.init(containerId)
// Initialize switcher in specified container
// @param containerId {string} - DOM element ID to render into

LayerSwitcher.setMode(mode)
// Set current view mode
// @param mode {string} - 'world-truth' | 'character-view' | 'reader-view'

LayerSwitcher.getMode()
// Get current view mode
// @returns {string} - Current mode
```

**Usage Example:**

```javascript
// In a screen that needs layer switching
LayerSwitcher.init('layer-switcher-container');

// Programmatically change mode
LayerSwitcher.setMode('character-view');

// Check current mode
const currentMode = LayerSwitcher.getMode(); // 'character-view'
```

**State Integration:**
- Reads: `state.get('viewMode')` for initial render
- Updates: `state.update({ viewMode: mode })` on button click
- Subscribes to: `viewMode` (updates active button styling)

**Events:**
- Button click → `LayerSwitcher.setMode(mode)`

**CSS Classes:**
- `.layer-switcher` - Container for buttons
- `.layer-btn` - Individual layer button
- `.layer-btn.active` - Currently active layer

---

## Logic Visualization Components (Phase 9)

### arc-card.js

**Purpose:** Display character arc with progress visualization based on Save the Cat 13-beat structure. Shows current phase, lie/truth transformation, and want/need goals.

**API:**

```javascript
ArcCard.render(arcData)
// Render arc card HTML
// @param arcData {object} - Arc data from API
// @returns {string} - HTML string

ArcCard.calculateProgress(currentPhase)
// Calculate progress percentage from phase
// @param currentPhase {string} - Phase name (e.g., 'midpoint')
// @returns {number} - Progress percentage (0-100)
```

**arcData shape:**
```javascript
{
  arc_uuid: "string",
  character_id: "char-name",
  archetype: "hero" | "mentor" | null,
  lie_belief: "string" | null,
  truth_belief: "string" | null,
  want_external: "string" | null,
  need_internal: "string" | null,
  current_phase: "setup" | "catalyst" | "debate" | ... | "final_image"
}
```

**Usage Example:**

```javascript
// Fetch arc data
const arc = await api.getArcById(arcId);

// Render card
const cardHTML = ArcCard.render(arc);

// Insert into DOM
document.getElementById('arc-container').innerHTML = cardHTML;
```

**State Integration:**
- None (stateless rendering component)

**Phase Progress Mapping:**
The 13-beat structure maps to progress:
- setup (0%) → catalyst (8%) → debate (17%) → ... → finale (92%) → final_image (100%)

**CSS Classes:**
- `.arc-card` - Card container
- `.badge-archetype` - Archetype badge
- `.progress-bar` - Progress bar container
- `.progress-fill` - Colored progress indicator
- `.arc-transformation` - Lie/truth section
- `.arc-goals` - Want/need section

---

### conflict-card.js

**Purpose:** Display story conflict with type, status, participants, and stakes. Color-coded badges for quick visual identification.

**API:**

```javascript
ConflictCard.render(conflictData)
// Render conflict card HTML
// @param conflictData {object} - Conflict data from API
// @returns {string} - HTML string
```

**conflictData shape:**
```javascript
{
  conflict_uuid: "string",
  type: "external" | "internal" | "interpersonal" | "societal" | "environmental",
  protagonist_id: "entity-id",
  antagonist_source: "string" | null,
  stakes_success: "string" | null,
  stakes_fail: "string" | null,
  status: "latent" | "active" | "escalating" | "climactic" | "resolved"
}
```

**Usage Example:**

```javascript
// Fetch conflict data
const conflict = await api.getConflictById(conflictId);

// Render card
const cardHTML = ConflictCard.render(conflict);

// Insert into DOM
document.getElementById('conflict-container').innerHTML = cardHTML;
```

**State Integration:**
- None (stateless rendering component)

**Color Mappings:**
- **Type colors:**
  - External: Blue (#3B82F6)
  - Internal: Purple (#8B5CF6)
  - Interpersonal: Green (#10B981)
  - Societal: Orange (#F59E0B)
  - Environmental: Teal (#14B8A6)
- **Status colors:**
  - Latent: Gray (#6B7280)
  - Active: Yellow (#EAB308)
  - Escalating: Orange (#F59E0B)
  - Climactic: Red (#EF4444)
  - Resolved: Green (#10B981)

**CSS Classes:**
- `.conflict-card` - Card container
- `.badge-type` - Type badge (inline color styling)
- `.badge-status` - Status badge (inline color styling)
- `.conflict-participants` - Protagonist vs antagonist section
- `.conflict-stakes` - Stakes section with success/fail rows

---

### causality-graph.js

**Purpose:** D3.js force-directed graph visualization for event causal relationships. Supports depth control (1-10), color-coded edge types, drag interaction, and 50-node performance limit.

**API:**

```javascript
CausalityGraph.render(containerId, eventId, depth)
// Render graph in specified container
// @param containerId {string} - DOM element ID
// @param eventId {string} - Starting event UUID for traversal
// @param depth {number} - Traversal depth (1-10, defaults to state.causalityDepth or 3)
// @returns {Promise<void>}

CausalityGraph.updateDepth(newDepth)
// Update graph with new traversal depth (re-fetches and re-renders)
// @param newDepth {number} - New depth (1-10)
// @returns {Promise<void>}
```

**Usage Example:**

```javascript
// Render graph for event
await CausalityGraph.render('graph-container', 'event-uuid-123', 5);

// Depth slider triggers update
// (Component handles this automatically via event listeners)
```

**State Integration:**
- Reads: `state.get('causalityDepth')` for default depth
- Updates: `state.update({ causalityDepth: newDepth })` when slider changes

**Graph Data Shape:**
```javascript
{
  nodes: [
    { id: "event-uuid", label: "Event label" },
    ...
  ],
  edges: [
    {
      source: "event-uuid-1",
      target: "event-uuid-2",
      type: "direct-cause" | "enabling-condition" | "motivation" | "psychological-trigger",
      strength: 1-10  // Edge width = strength / 2
    },
    ...
  ]
}
```

**Edge Type Colors:**
- direct-cause: Red (#e74c3c)
- enabling-condition: Blue (#3498db)
- motivation: Purple (#9b59b6)
- psychological-trigger: Orange (#e67e22)

**Performance:**
- Hard limit: 50 nodes (truncates to first 50 if exceeded)
- Warning badge shows when truncated
- 600px height SVG with pan/zoom support

**Controls:**
- Depth slider (1-10 range)
- Depth display (current value)
- Node count display
- Warning badge (visible when >50 nodes)

---

### setup-payoff-list.js

**Purpose:** Chekhov's gun tracker with status grouping and unfired warnings. Helps authors ensure narrative promises are fulfilled.

**API:**

```javascript
SetupPayoffList.render(containerId)
// Render list in container (fetches data internally)
// @param containerId {string} - DOM element ID
// @returns {Promise<void>}

SetupPayoffList.renderList(setupPayoffs, unfiredSetups)
// Render list HTML (used internally)
// @param setupPayoffs {array} - All setup/payoff records
// @param unfiredSetups {array} - Subset of unfired setups
// @returns {string} - HTML string
```

**Usage Example:**

```javascript
// Render setup/payoff tracker
await SetupPayoffList.render('tracker-container');
```

**State Integration:**
- Reads: `state.get('currentProjectId')` for data filtering

**Data Fetching:**
Fetches two datasets in parallel:
1. `api.getSetupPayoffsByProject(projectId)` - All setups
2. `api.getUnfiredSetups(projectId)` - Unfired setups (status = 'planted' or 'referenced')

**Status Grouping:**
- Planted (🟡): Gun on mantelpiece, not yet referenced
- Referenced (🔵): Gun mentioned again, not yet fired
- Fired (✅): Gun fired, payoff delivered

**Unfired Highlighting:**
- Orange background (#FEF3C7)
- Orange border (#F59E0B)
- Warning banner at top if any unfired setups exist

**CSS Classes:**
- `.setup-payoff-tracker` - Main container
- `.tracker-header` - Header with warning banner
- `.status-group` - Group by status
- `.setup-item` - Individual setup card
- `.warning-banner` - Unfired warning banner

---

### theme-card.js

**Purpose:** Display thematic element with statement, question, symbol, and manifestations.

**API:**

```javascript
ThemeCard.render(themeData)
// Render theme card HTML
// @param themeData {object} - Theme data from API
// @returns {string} - HTML string
```

**themeData shape:**
```javascript
{
  theme_uuid: "string",
  statement: "The thematic statement",
  primary_symbol_id: "symbol-entity-id" | null,
  question: "The thematic question?" | null,
  manifestations: ["manifestation 1", "manifestation 2", ...] // JSON array
}
```

**Usage Example:**

```javascript
const theme = await api.getThemeById(themeId);
const cardHTML = ThemeCard.render(theme);
document.getElementById('theme-container').innerHTML = cardHTML;
```

**State Integration:**
- None (stateless rendering component)

**CSS Classes:**
- `.theme-card` - Card container
- `.theme-statement` - Main statement (h3)
- `.theme-question` - Thematic question (italic)
- `.theme-symbol` - Symbol section
- `.theme-manifestations` - Manifestation list

---

### motif-card.js

**Purpose:** Display motif instance with type badge, description, and significance.

**API:**

```javascript
MotifCard.render(motifData)
// Render motif card HTML
// @param motifData {object} - Motif data from API
// @returns {string} - HTML string
```

**motifData shape:**
```javascript
{
  motif_uuid: "string",
  motif_type: "visual" | "auditory" | "symbolic" | "behavioral" | "thematic",
  linked_entity_id: "entity-id" | null,
  description: "Description of motif instance",
  significance: "Why this instance matters" | null
}
```

**Usage Example:**

```javascript
const motif = await api.getMotifById(motifId);
const cardHTML = MotifCard.render(motif);
document.getElementById('motif-container').innerHTML = cardHTML;
```

**State Integration:**
- None (stateless rendering component)

**CSS Classes:**
- `.motif-card` - Card container
- `.motif-badge` - Type badge (teal background)
- `.motif-description` - Main description
- `.motif-significance` - Significance callout box
- `.motif-entity` - Linked entity reference

---

## Narrative Editing Components (Phase 10)

### narrative-tree-editor.js

**Purpose:** Drag-and-drop tree editor for chapter/scene reordering. Supports split/merge operations, rename/delete actions, and hierarchical narrative structure management.

**API:**

```javascript
NarrativeTreeEditor.render(fictionId)
// Render narrative tree for fiction
// @param fictionId {string} - Fiction UUID
// @returns {Promise<string>} - HTML string

NarrativeTreeEditor.setupDragHandlers()
// Setup drag-and-drop handlers (call after render inserts HTML into DOM)
// Must be called after DOM insertion for event attachment

NarrativeTreeEditor.refreshTree()
// Re-fetch data and re-render tree (maintains current fictionId)
// @returns {Promise<void>}
```

**Usage Example:**

```javascript
// Render tree
const treeHTML = await NarrativeTreeEditor.render(fictionId);
document.getElementById('tree-container').innerHTML = treeHTML;

// Setup drag handlers (REQUIRED after DOM insertion)
NarrativeTreeEditor.setupDragHandlers();
```

**State Integration:**
- None (stores currentFictionId internally)

**Data Structure:**

The component groups scenes by chapter:
```javascript
{
  chapters: [
    {
      id: "ch-1" | "unassigned",
      title: "Chapter 1" | "Unassigned Scenes",
      scenes: [
        {
          id: "scene-uuid",
          chapterId: "ch-1",
          sceneNumber: 1,
          title: "Scene title",
          status: "draft" | "in-progress" | "review" | "final"
        },
        ...
      ]
    },
    ...
  ]
}
```

**Operations:**

1. **Drag-and-Drop Reordering:**
   - Scene → Scene: Reorder within/across chapters
   - Scene → Chapter: Move to end of chapter
   - Visual feedback: `.dragging` and `.drop-target` classes
   - Auto-renumbering via `api.batchUpdateScenes()`

2. **Split Chapter:**
   - Prompt for split index (scene number)
   - Calls `api.splitChapter(chapterId, splitIndex)`
   - Creates new chapter, renumbers subsequent chapters
   - Example: Chapter 3 split at scene 5 → Chapter 3 (scenes 1-4) + Chapter 4 (scenes 5+)

3. **Merge Chapter:**
   - Confirms merge with next chapter
   - Calls `api.mergeChapters(chapterId, nextChapterId)`
   - Combines scenes into first chapter, deletes second
   - Renumbers subsequent chapters

4. **Rename:**
   - Chapter rename: Shows limitation message (chapters are ID-based, not named)
   - Scene rename: Calls `api.renameNarrativeNode(sceneId, 'scene', newTitle)`

5. **Delete:**
   - Chapter delete: Warning with scene count, calls `api.deleteNarrativeNode(chapterId, 'chapter')`
   - Scene delete: Confirmation, calls `api.deleteNarrativeNode(sceneId, 'scene')`

**Event Delegation:**

All button clicks handled via single event listener on tree:
```javascript
tree.addEventListener('click', (e) => {
  const button = e.target.closest('[data-action]');
  if (button) {
    const action = button.dataset.action; // 'split' | 'merge' | 'rename' | 'delete'
    // Handle action...
  }
});
```

**Scene Click Handler:**

Clicking a scene card opens SceneEditor:
```javascript
const sceneCard = e.target.closest('.scene-clickable');
if (sceneCard) {
  const sceneId = sceneCard.dataset.sceneId;
  SceneEditor.init(sceneId);
}
```

**CSS Classes:**
- `.narrative-tree-editor` - Main container
- `.tree-chapter` - Chapter node
- `.tree-scene` - Scene node
- `.dragging` - Applied during drag
- `.drop-target` - Applied to valid drop targets
- `.chapter-actions` - Action buttons (split/merge/rename/delete)
- `.scene-actions` - Scene action buttons

---

## Epistemic Components (Phase 11)

### reader-knowledge-tracker.js

**Purpose:** Track facts revealed to the reader in each scene. Reader is treated as a special entity (`reader-{fictionId}`) in the epistemic system.

**API:**

```javascript
ReaderKnowledgeTracker.getReaderEntityId(fictionId)
// Get reader entity ID for fiction
// @param fictionId {string} - Fiction UUID
// @returns {string} - "reader-{fictionId}"

ReaderKnowledgeTracker.getFacts(sceneId, fictionId, sceneTimestamp)
// Get facts revealed to reader at this scene
// @param sceneId {string} - Scene UUID
// @param fictionId {string} - Fiction UUID
// @param sceneTimestamp {number} - Scene narrative timestamp
// @returns {Promise<array>} - Array of fact objects

ReaderKnowledgeTracker.getCumulativeFacts(sceneId, fictionId, sceneTimestamp)
// Get all facts reader knows by this point (cumulative)
// @returns {Promise<array>} - Array of all facts

ReaderKnowledgeTracker.addFact(sceneId, factId, fictionId, sceneTimestamp)
// Record that reader learned a fact at this scene
// @returns {Promise<object>} - Created fact record

ReaderKnowledgeTracker.render(sceneId, fictionId, sceneTimestamp)
// Render tracker UI for scene
// @returns {Promise<string>} - HTML string
```

**Usage Example:**

```javascript
// In SceneEditor
const readerKnowledgeHTML = await ReaderKnowledgeTracker.render(
  sceneId,
  fictionId,
  narrativeTime
);

// Insert into scene editor
document.getElementById('reader-knowledge-section').innerHTML = readerKnowledgeHTML;

// Add fact (via button click in rendered UI)
await ReaderKnowledgeTracker.addFact(sceneId, factId, fictionId, timestamp);
```

**State Integration:**
- None (operates on passed parameters)

**Fact Object Shape:**
```javascript
{
  fact_uuid: "string",
  factType: "identity" | "relationship" | "location" | "event" | "secret",
  factKey: "string",  // e.g., "bob.identity"
  factValue: "string",  // e.g., "secret spy"
  learnedAt: 1000,  // Narrative timestamp
  sourceEvent: "scene-uuid"
}
```

**CSS Classes:**
- `.reader-knowledge-tracker` - Main container
- `.tracker-header` - Header with "+ Add Fact" button
- `.fact-list` - List of facts
- `.fact-item` - Individual fact card
- `.fact-type` - Type badge
- `.fact-key` - Fact key
- `.fact-value` - Fact value

---

### dramatic-irony-panel.js

**Purpose:** Compare reader knowledge vs character knowledge to detect dramatic irony. Highlights cases where reader knows something character doesn't (classic irony) or character knows something reader doesn't (mystery/surprise).

**API:**

```javascript
DramaticIronyPanel.checkForIrony(sceneId, characterId, fictionId, sceneTimestamp)
// Check for dramatic irony between reader and one character
// @returns {Promise<object>} - { readerOnly: [], characterOnly: [], hasIrony: bool, ironyCount: number }

DramaticIronyPanel.checkForAllCharacters(sceneId, characterIds, fictionId, sceneTimestamp)
// Check irony across all present characters
// @param characterIds {array} - Array of character entity UUIDs
// @returns {Promise<object>} - Aggregated analysis

DramaticIronyPanel.render(sceneId, characterId, fictionId, sceneTimestamp)
// Render panel for single character
// @returns {Promise<string>} - HTML string

DramaticIronyPanel.renderAggregate(sceneId, characterIds, fictionId, sceneTimestamp)
// Render panel for all characters in scene
// @returns {Promise<string>} - HTML string
```

**Usage Example:**

```javascript
// In SceneEditor - check irony for all present characters
const characterIds = ['char-alice', 'char-bob'];
const ironyHTML = await DramaticIronyPanel.renderAggregate(
  sceneId,
  characterIds,
  fictionId,
  narrativeTime
);

// Insert into scene editor
document.getElementById('dramatic-irony-section').innerHTML = ironyHTML;
```

**State Integration:**
- None (operates on passed parameters)

**Irony Analysis Shape:**
```javascript
{
  readerOnly: [  // Facts reader knows but character doesn't (classic irony)
    { factType: "secret", factKey: "bob.identity", factValue: "spy" },
    ...
  ],
  characterOnly: [  // Facts character knows but reader doesn't (mystery)
    { factType: "motivation", factKey: "alice.goal", factValue: "revenge" },
    ...
  ],
  hasIrony: true,
  ironyCount: 2
}
```

**Aggregate Analysis Shape:**
```javascript
{
  characters: [
    {
      characterId: "char-alice",
      readerOnly: [...],
      characterOnly: [...],
      hasIrony: true,
      ironyCount: 1
    },
    ...
  ],
  totalIronyCount: 3,
  hasAnyIrony: true
}
```

**CSS Classes:**
- `.dramatic-irony-panel` - Main container
- `.panel-header` - Header with irony count badge
- `.irony-section` - Section for reader-only or character-only facts
- `.irony-fact` - Fact that creates dramatic irony (reader knows)
- `.mystery-fact` - Fact that creates mystery (character knows)
- `.character-irony-section` - Collapsible character section (aggregate view)

---

### scene-editor.js

**Purpose:** Modal editor for scenes with reader knowledge and dramatic irony sections. Provides comprehensive scene editing with epistemic awareness.

**API:**

```javascript
SceneEditor.init(sceneId)
// Initialize and open editor for scene
// @param sceneId {string} - Scene UUID
// @returns {Promise<void>}

SceneEditor.save()
// Save scene changes and close modal
// @returns {Promise<void>}

SceneEditor.cancel()
// Close modal without saving

SceneEditor.close()
// Close modal (same as cancel)

SceneEditor.refresh()
// Re-fetch scene data and re-render (used when facts change)
// @returns {Promise<void>}

SceneEditor.isOpen()
// Check if editor is currently open
// @returns {boolean}
```

**Usage Example:**

```javascript
// Open editor from scene click in tree
SceneEditor.init(sceneId);

// Scene editor handles all UI internally - no manual rendering needed
```

**State Integration:**
- None (stores currentSceneId internally)

**Modal Structure:**

The editor is a full-screen modal with sections:
1. **Basic Information:** Title, summary, POV, location, mood, tension, stakes, goal
2. **Reader Knowledge:** Rendered by ReaderKnowledgeTracker
3. **Dramatic Irony:** Rendered by DramaticIronyPanel
4. **Present Entities:** Comma-separated entity IDs
5. **Timeline:** Read-only narrative time, duration, chapter, scene number

**Form Fields:**

```javascript
// Collected on save
{
  title: "string",
  summary: "string",
  povEntityId: "char-id" | null,
  locationId: "location-id" | null,
  mood: "neutral" | "tense" | "joyful" | ...,
  tensionLevel: 0.0-1.0,
  stakes: "string",
  sceneGoal: "string",
  presentEntityIds: JSON.stringify(["char-alice", "char-bob", ...])
}
```

**Events:**

- Save button → `SceneEditor.save()` → `api.request('/api/orchestrator/scenes/{id}', { method: 'PATCH', body })`
- Cancel button → `SceneEditor.cancel()`
- Overlay click → `SceneEditor.cancel()`

**CSS Classes:**
- `.modal-overlay` - Full-screen overlay
- `.modal-content` - Centered modal box
- `.scene-editor-modal` - Specific styling for scene editor
- `.modal-header` - Header with title and close button
- `.modal-body` - Scrollable content area
- `.modal-footer` - Footer with Cancel/Save buttons
- `.editor-section` - Section within editor
- `.form-group` - Form field group
- `.form-row` - Row with multiple fields

---

## Advanced Components (Phase 12)

### relationship-map.js

**Purpose:** Vis.js network visualization for character relationships. Color-coded edges by relationship dynamics (trust, conflict, respect, power) with edge width representing intimacy level.

**API:**

```javascript
RelationshipMap.render(containerId, fictionId)
// Render relationship network
// @param containerId {string} - DOM element ID
// @param fictionId {string} - Fiction UUID for filtering
// @returns {Promise<void>}
```

**Usage Example:**

```javascript
// Render relationship map
await RelationshipMap.render('relationship-container', fictionId);
```

**State Integration:**
- None (operates on passed fictionId)

**Relationship Data Shape:**
```javascript
{
  entityAId: "char-alice",
  entityBId: "char-bob",
  relationshipType: "allies" | "enemies" | "family" | "lovers" | "rivals",
  trustLevel: 0.0-1.0,
  sentiment: -1.0 to 1.0,
  conflictLevel: 0.0-1.0,
  powerBalance: -1.0 to 1.0,  // -1 = A weaker, +1 = A stronger
  intimacyLevel: 0.0-1.0,
  status: "forming" | "stable" | "strained" | "broken"
}
```

**Edge Color Priority:**

1. **High Trust (> 0.7):** Green (#2ecc71)
2. **Fear/Conflict (> 0.5):** Red (#e74c3c)
3. **Respect (trust 0.4-0.7):** Blue (#3498db)
4. **Power Imbalance (abs > 0.5):** Purple (#9b59b6)
5. **Default (neutral):** Gray (#95a5a6)

**Edge Width:**
- Formula: `1 + (intimacyLevel * 4)`
- Range: 1px (no intimacy) to 5px (max intimacy)

**Vis.js Configuration:**

```javascript
{
  physics: {
    solver: 'forceAtlas2Based',
    forceAtlas2Based: {
      gravitationalConstant: -50,
      centralGravity: 0.01,
      springLength: 200,
      springConstant: 0.08,
      avoidOverlap: 0.5
    },
    stabilization: { iterations: 100 }
  },
  interaction: {
    hover: true,
    tooltipDelay: 100,
    navigationButtons: true,
    zoomView: true,
    dragView: true
  }
}
```

**Tooltip:**

Hovering over edge shows:
- Entity A ↔ Entity B
- Relationship type
- All metrics (trust, sentiment, conflict, power, intimacy, status)

**CSS Classes:**
- `.relationship-map` - Main container
- `.relationship-info-panel` - Color legend panel

---

## State Management

The global `state` object provides reactive state management via pub/sub pattern.

**API:**

```javascript
state.get(key)
// Get current value
// @returns {any}

state.getAll()
// Get copy of entire state
// @returns {object}

state.update(changes)
// Update multiple keys, notify subscribers
// @param changes {object} - { key: value, ... }

state.subscribe(key, callback)
// Subscribe to changes for specific key
// @param key {string}
// @param callback {function} - Called with new value when key changes
// @returns {function} - Unsubscribe function
```

**State Schema:**

```javascript
{
  currentProjectId: null,           // Currently selected project UUID
  currentTimestamp: null,           // Current narrative timestamp
  selectedCharacter: null,          // Selected character for character view
  viewMode: 'world-truth',          // 'world-truth' | 'character-view' | 'reader-view'
  powerDrawerOpen: false,           // Power drawer open state
  causalityDepth: 3,                // Causality graph traversal depth (1-10)
  activeTab: null,                  // Active tab in story-logic screen
  characterTab: 'list'              // 'list' | 'relationships'
}
```

**Usage Example:**

```javascript
// Get value
const projectId = state.get('currentProjectId');

// Update multiple values
state.update({
  currentProjectId: 'project-uuid',
  viewMode: 'character-view'
});

// Subscribe to changes
const unsubscribe = state.subscribe('viewMode', (newMode) => {
  console.log('View mode changed to:', newMode);
  // Update UI...
});

// Later: unsubscribe
unsubscribe();
```

---

## Common Patterns

### Pattern 1: Stateless Card Components

Arc, Conflict, Theme, Motif cards follow this pattern:

```javascript
// 1. Fetch data
const data = await api.getSomethingById(id);

// 2. Render HTML
const cardHTML = SomeCard.render(data);

// 3. Insert into DOM
document.getElementById('container').innerHTML = cardHTML;

// 4. No event handlers needed (cards are read-only displays)
```

### Pattern 2: Interactive Components with Event Delegation

Narrative Tree Editor, Scene Editor follow this pattern:

```javascript
// 1. Render HTML string
const html = await Component.render(params);

// 2. Insert into DOM
document.getElementById('container').innerHTML = html;

// 3. Setup event handlers (event delegation on container)
Component.setupHandlers();
```

### Pattern 3: State-Reactive Components

Power Drawer, Layer Switcher follow this pattern:

```javascript
// 1. Subscribe to state changes (in init)
state.subscribe('someKey', (newValue) => {
  // Update UI based on new value
  element.classList.toggle('active', newValue);
});

// 2. Update state on user interaction
button.addEventListener('click', () => {
  state.update({ someKey: newValue });
  // Subscribers automatically notified
});
```

### Pattern 4: Modal Components

Scene Editor follows this pattern:

```javascript
// 1. Open modal
Modal.init(id);

// 2. Modal renders itself and creates DOM
// 3. Modal handles save/cancel/close internally
// 4. Cleanup on close
Modal.close(); // Removes modal from DOM
```

### Pattern 5: Visualization Components

Causality Graph, Relationship Map follow this pattern:

```javascript
// 1. Create container div
const container = document.getElementById('container');

// 2. Fetch data
const data = await api.getData(params);

// 3. Initialize library (D3/Vis.js)
const viz = new Library(container, data, options);

// 4. Store viz instance for cleanup
Component.viz = viz;

// 5. Later: cleanup
if (Component.viz) {
  Component.viz.destroy();
}
```

---

## Testing Components

All components are designed to work in both browser and Node.js (testing) environments.

**Browser Usage:**
```html
<script src="js/state.js"></script>
<script src="js/api-client.js"></script>
<script src="js/components/arc-card.js"></script>
```

**Node.js Testing:**
```javascript
const { ArcCard } = require('./gui/js/components/arc-card.js');

// Test render method
const html = ArcCard.render(mockArcData);
assert(html.includes('arc-card'));
```

---

## Troubleshooting

**Component not rendering:**
- Check that script tag is loaded before usage
- Verify container element exists: `document.getElementById(containerId)`
- Check browser console for errors

**Drag-and-drop not working:**
- Ensure `setupDragHandlers()` called after DOM insertion
- Verify HTML elements have `draggable="true"` attribute
- Check that event listeners attached to correct container

**State updates not triggering UI changes:**
- Verify subscription: `state.subscribe('key', callback)`
- Check that update uses correct key name
- Ensure callback updates DOM correctly

**Modal not closing:**
- Check that overlay click handler calls `cancel()`
- Verify close button wired to `close()` method
- Check z-index conflicts with other elements

**Visualization not appearing:**
- Verify D3/Vis.js library loaded before component
- Check container has explicit width/height (not `auto`)
- Inspect console for library-specific errors

---

## Version History

- **v4.1** (2026-01-17): Complete documentation of all 13+ components
- Phase 8: power-drawer, layer-switcher
- Phase 9: arc-card, conflict-card, causality-graph, setup-payoff-list, theme-card, motif-card
- Phase 10: narrative-tree-editor
- Phase 11: reader-knowledge-tracker, dramatic-irony-panel, scene-editor
- Phase 12: relationship-map

---

## See Also

- **NARRATIVE_EDITING_GUIDE.md** - Detailed drag-and-drop workflow documentation
- **gui/js/state.js** - State management implementation
- **gui/js/api-client.js** - API client for data fetching
- **gui/index.html** - Example component usage in screens
