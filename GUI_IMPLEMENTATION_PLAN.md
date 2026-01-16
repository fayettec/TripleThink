# TripleThink v4.1 GUI Implementation Plan

**Version**: 1.1
**Date**: 2026-01-16
**Status**: Ready for Implementation
**Estimated Effort**: 6 weeks

**Update**: Added reader knowledge tracking (Layer 3) and narrative structure editing with drag-and-drop

---

## Executive Summary

This plan details the implementation of GUI enhancements for TripleThink v4.1, transforming the existing visualization dashboard into a comprehensive narrative management interface that exposes the new Logic Layer, enhanced epistemic features, and hybrid state system.

### Key Approach
- **Salvage 70%** of existing GUI code (~3,860 lines)
- **Add ~2,100 new lines** for v4.1-specific features
- **Two-tier interface**: Simple surface + Power Drawer
- **Three-layer reality**: World Truth, Character Perception, **Reader Knowledge**
- **Narrative editing**: Drag-and-drop reorganization with auto-renumbering
- **No framework migration**: Keep vanilla JavaScript

---

## 1. Design Philosophy

### What the GUI IS For
- Visualization and navigation of story structure
- Light editing (quick fixes, 1-2 field changes)
- Consistency checking and validation
- Project overview and health monitoring
- Timeline exploration with epistemic awareness

### What the GUI is NOT For
- Primary creation tool (authors use Claude Code)
- Prose writing
- Complex data entry
- Real-time collaboration

### Core Principle
> "Show me the story I'm building, let me fix what's broken, hide the database."

---

## 2. Two-Tier Interface Architecture

### Simple Surface (Default View)
- Event names, timestamps, summaries
- Character names, roles, current status
- Scene structure (book/chapter/scene)
- Basic relationships
- Conflict cards (protagonist vs antagonist)
- Setup/payoff status (planted/fired)

### Power Drawer (Slide-out Panel)
Access via "Power Drawer" button; reveals:
- Epistemic state details (full knowledge graphs)
- State deltas and snapshots
- Dialogue profiles
- Causality chains with depth control
- Metadata (author notes, AI guidance)
- Timeline branching
- Thematic analysis

---

## 3. Components to Build

### New Screens (2)

| File | Lines | Purpose |
|------|-------|---------|
| `landing.js` | 150 | Project selection portal (DONE - exists) |
| `story-logic.js` | 300 | Logic layer hub with 6 tabs |

### New Components (10)

| File | Lines | Purpose |
|------|-------|---------|
| `power-drawer.js` | 200 | Slide-out advanced panel |
| `causality-graph.js` | 300 | D3 force-directed cause-effect viz |
| `arc-card.js` | 100 | Character arc display with phases |
| `conflict-card.js` | 100 | Story conflict display |
| `setup-payoff-list.js` | 150 | Chekhov's gun tracker |
| `layer-switcher.js` | 150 | 3-layer reality toggle (includes Reader View) |
| `relationship-map.js` | 200 | Character relationship viz (Vis.js) |
| `narrative-tree-editor.js` ⭐ | 300 | Drag-and-drop chapter/scene editor |
| `reader-knowledge-tracker.js` ⭐ | 150 | Scene revelation tracking |
| `dramatic-irony-panel.js` ⭐ | 100 | Reader vs character comparison |

### Components to Enhance (8)

| File | Enhancement |
|------|-------------|
| `dashboard.js` | Add v4.1 stats (logic layer health) |
| `timeline.js` | Add causality arrows, epistemic toggle |
| `epistemic.js` | Add character comparison, false belief highlighting |
| `characters.js` | Add arc card, "What They Know" button |
| `narrative.js` ⭐ | **MAJOR**: Replace tree with drag-and-drop editor, add revelation tracking |
| `scene-editor.js` ⭐ | Add "Facts Revealed to Reader", dramatic irony warnings |
| `timeline-viz.js` | Add state reconstruction indicators |
| `api-client.js` ⭐ | Add v4.1 endpoints + narrative editing + reader knowledge |

---

## 4. User Journeys

### Journey A: Understanding Character Knowledge
1. User on Timeline finds "AI Reveals Intent" event
2. Clicks event for details panel
3. Sees "Facts Created: AI is malicious"
4. Clicks "Who Knows This?" button
5. Pop-up shows: Captain: No, Engineer: Yes
6. **Result**: Quick epistemic check without leaving timeline

### Journey B: Tracking Character Arc
1. Navigate to Characters, select "Captain"
2. See Arc Card with progress bar
3. View: "Lie: Not responsible -> Truth: Leadership is duty"
4. Progress bar shows "Midpoint phase"
5. Click Power Drawer for full arc timeline
6. **Result**: Arc status visible at glance

### Journey C: Finding Unfired Setups
1. Navigate to Story Logic -> Setups & Payoffs tab
2. See warning: "Engineer's secret" planted Ch 3, unfired
3. Click setup for original plant event details
4. **Result**: Prevents abandoned plot threads

### Journey D: Validating Consistency
1. Validation screen -> "Run All Checks"
2. Results: 2 errors, 5 warnings by category
3. Click error -> Jump to relevant view
4. Power Drawer confirms knowledge timeline
5. **Result**: Catches errors before publication

---

## 5. Technical Architecture

### Frontend Stack
**Keep vanilla JavaScript** - Rationale:
- Clean working codebase exists
- No build step complexity
- D3.js and Vis.js already integrated
- Framework migration would waste working code

### State Management Enhancements
Add to `state.js`:
```javascript
{
  currentProjectId: null,      // Multi-project support
  currentTimestamp: null,      // Epistemic time travel
  selectedCharacter: null,     // Character-filtered views
  viewMode: 'world_truth',     // 'character_view' or 'scene_view'
  powerDrawerOpen: false,      // Advanced panel state
  causalityDepth: 3,           // Causality graph depth
  activeTab: null              // Multi-tab screens
}
```

### API Client Extensions
Add to `api-client.js`:
```javascript
// Logic layer
api.getCharacterArcs(characterId)
api.getCausality(eventId, maxDepth)
api.getConflicts(status)
api.getSetupPayoffs(status)

// Epistemic enhancements
api.getCharacterKnowledge(characterId, timestamp, format)
api.compareKnowledge(char1, char2, timestamp)

// State queries
api.getAssetStateAt(assetId, eventId)
api.getStateDelta(assetId, fromEvent, toEvent)
```

---

## 6. Visual Design Patterns

### Epistemic Visualization (Color-Coded)
- **Green border**: True belief (matches ground truth)
- **Orange border**: False belief (with correction shown)
- **Gray**: Unknown to character
- **Blue badge**: Confidence level

### Timeline State Indicators
- **Camera icon**: Snapshot anchor point
- **Delta symbol**: Delta between snapshots
- **Warning badge**: Significant state change
- **Arrows**: Causal relationships (color-coded)

### Causality Graph (D3)
- **Solid red**: Direct cause (strength 9)
- **Dashed blue**: Enabling condition (strength 6)
- **Dotted green**: Motivation (strength 7)
- **Wavy purple**: Psychological trigger
- Default depth: 3, max: 10, limit: 50 nodes

### Character Arc Progress Bar
```
Setup  Catalyst  Debate  B2  Fun&Games  Midpoint  Bad Guys  All Lost  Dark  B3  Finale
  ■       ■        ■     ■       ■         ■         □         □       □    □     □
                                           ^ Current Phase
```

### Setup/Payoff Status
- **Planted**: Setup established
- **Referenced**: Building anticipation
- **Fired**: Payoff delivered
- **Unfired**: Warning - too long since plant

---

## 7. Implementation Roadmap (6 Weeks)

### Week 1: Foundation
**Goals**: Fix remaining bugs, build core infrastructure
- [ ] Verify/fix 11 bugs from GUI-FIXES-PLAN.md
- [ ] Enhance `state.js` with v4.1 fields
- [ ] Extend `api-client.js` with logic layer endpoints
- [ ] Create `power-drawer.js` component (core UX pattern)

**Deliverables**:
- power-drawer.js (200 lines)
- Updated state.js
- Updated api-client.js

### Week 2: Logic Layer UI
**Goals**: Build Story Logic screen and supporting components
- [ ] Create `story-logic.js` screen with 6 tabs
- [ ] Build `arc-card.js` component
- [ ] Build `conflict-card.js` component
- [ ] Build `causality-graph.js` D3 visualization
- [ ] Build `setup-payoff-list.js` tracker

**Deliverables**:
- story-logic.js (300 lines)
- arc-card.js (100 lines)
- conflict-card.js (100 lines)
- causality-graph.js (300 lines)
- setup-payoff-list.js (150 lines)

### Week 3: Narrative Structure Editing ⭐
**Goals**: Build drag-and-drop editor with auto-renumbering
- [ ] Build `narrative-tree-editor.js` with drag-and-drop
- [ ] Implement auto-renumbering logic for chapters/scenes
- [ ] Add split/merge chapter operations
- [ ] Add rename/delete with confirmations
- [ ] Integrate into `narrative.js` screen

**Deliverables**:
- narrative-tree-editor.js (300 lines)
- Full narrative outline editing (move, split, merge, reorder)

### Week 4: Reader Knowledge Tracking ⭐
**Goals**: Implement Layer 3 (Reader Knowledge)
- [ ] Build `reader-knowledge-tracker.js` component
- [ ] Build `dramatic-irony-panel.js` for reader vs character comparison
- [ ] Enhance `scene-editor.js` with "Facts Revealed to Reader"
- [ ] Enhance `layer-switcher.js` with Reader View mode
- [ ] Add reader knowledge filter to `timeline.js`

**Deliverables**:
- reader-knowledge-tracker.js (150 lines)
- dramatic-irony-panel.js (100 lines)
- Complete Layer 3 tracking

### Week 5: Epistemic Enhancements
**Goals**: Enhance epistemic visualization and add layer switching
- [ ] Add character comparison to `epistemic.js`
- [ ] Add reader knowledge comparison mode
- [ ] Enhance `timeline.js` with epistemic toggle
- [ ] Add false belief highlighting to `epistemic-graph.js`
- [ ] Build `power-drawer.js` component

**Deliverables**:
- Enhanced epistemic.js with reader/character comparison
- power-drawer.js (200 lines)

### Week 6: Advanced Features & Polish
**Goals**: Final components, integration, testing
- [ ] Build `relationship-map.js` visualization
- [ ] Integrate power drawer into timeline, character, epistemic screens
- [ ] Add state reconstruction view to power drawer
- [ ] Improve validation screen with category tabs
- [ ] Add pacing visualization
- [ ] Create COMPONENT_GUIDE.md and NARRATIVE_EDITING_GUIDE.md

**Deliverables**:
- relationship-map.js (200 lines)
- Production-ready GUI with all v4.1 features
- Complete documentation

---

## 8. File Structure

```
/app/gui/
├── js/
│   ├── app.js                   # Keep
│   ├── router.js                # Keep
│   ├── state.js                 # Enhance
│   ├── api-client.js            # Enhance
│   ├── screens/
│   │   ├── landing.js           # Keep (exists)
│   │   ├── dashboard.js         # Enhance
│   │   ├── timeline.js          # Enhance
│   │   ├── characters.js        # Rename from entities.js
│   │   ├── epistemic.js         # Enhance
│   │   ├── narrative.js         # Enhance
│   │   ├── fictions.js          # Keep
│   │   ├── story-logic.js       # NEW
│   │   └── validation.js        # Keep
│   ├── components/
│   │   ├── entity-editor.js     # Keep
│   │   ├── metadata-modal.js    # Keep
│   │   ├── timeline-view.js     # Keep
│   │   ├── timeline-viz.js      # Enhance
│   │   ├── epistemic-graph.js   # Enhance
│   │   ├── knowledge-editor.js  # Keep
│   │   ├── fiction-manager.js   # Keep
│   │   ├── scene-editor.js      # Keep
│   │   ├── validation-panel.js  # Keep
│   │   ├── quick-search.js      # Keep
│   │   ├── power-drawer.js      # NEW
│   │   ├── arc-card.js          # NEW
│   │   ├── conflict-card.js     # NEW
│   │   ├── causality-graph.js   # NEW
│   │   ├── setup-payoff-list.js # NEW
│   │   ├── layer-switcher.js    # NEW
│   │   └── relationship-map.js  # NEW
│   └── utils/
│       ├── formatters.js        # Keep
│       ├── validators.js        # Keep
│       ├── toast.js             # Keep
│       └── shortcuts.js         # Keep
└── styles/
    ├── design-system.css        # Keep
    ├── layout.css               # Keep
    ├── components.css           # Keep
    └── visualizations.css       # Keep
```

---

## 9. API Endpoint Requirements

### Existing (GUI Already Uses)
- `/api/projects` - Project CRUD
- `/api/entities` - Entity CRUD
- `/api/metadata` - Metadata CRUD
- `/api/epistemic/character/:id/knowledge`
- `/api/temporal/events`
- `/api/narrative/books`
- `/api/fictions`
- `/api/validate`
- `/api/search`

### New (Need GUI Support)
- `/api/logic/arcs` - Character arcs
- `/api/logic/conflicts` - Story conflicts
- `/api/logic/causality` - Causality chains
- `/api/logic/causality/chain/:eventId` - Full causal chain
- `/api/logic/setup-payoffs` - Setups and payoffs
- `/api/logic/themes` - Thematic elements
- `/api/logic/motifs` - Motif instances
- `/api/logic/world-rules` - World rules
- `/api/temporal/state/:assetId/at/:eventId` - State reconstruction
- `/api/epistemic/compare` - Character knowledge comparison

---

## 10. Verification & Testing

### End-to-End Tests

**Project Setup**:
- [ ] Create new project from landing screen
- [ ] Switch between projects
- [ ] View dashboard with v4.1 stats
- [ ] Export project as JSON

**Timeline & Events**:
- [ ] View timeline visualization
- [ ] Filter timeline by character
- [ ] See causality arrows between events
- [ ] Toggle epistemic mode
- [ ] Switch layers (World Truth / Character View / Reader View)
- [ ] Open power drawer for state deltas

**Characters & Epistemic**:
- [ ] View character list and profile
- [ ] See character arc card with progress
- [ ] Click "What They Know" button
- [ ] Compare knowledge between characters
- [ ] Identify false beliefs (orange highlighting)

**Story Logic (NEW)**:
- [ ] Navigate to Story Logic screen
- [ ] View character arcs with phases
- [ ] View conflicts with stakes
- [ ] Explore causality graph
- [ ] Check setup/payoff tracker
- [ ] View themes, motifs, world rules

**Validation**:
- [ ] Run all validation checks
- [ ] View errors by category
- [ ] Click error to jump to view
- [ ] Verify error location correct

### Performance Targets
- Page load: < 1 second
- API calls: < 200ms average
- D3 visualization render: < 500ms
- State reconstruction: < 100ms
- Timeline navigation: < 100ms render

---

## 11. Success Criteria

### User Experience
- User can answer "What happened when?" in < 10 seconds
- User can answer "What does Character X know?" in < 15 seconds
- User can find consistency errors in < 30 seconds
- Light edits take < 5 clicks
- Advanced features discoverable via Power Drawer

### Technical
- Maintain < 5,500 total lines of JS
- Reuse 70% of existing code
- New components follow existing patterns
- No framework dependencies

---

## 12. Risk Assessment

**Risk Level: LOW**

**Mitigating Factors**:
- Leveraging existing working code (70% reuse)
- No framework migration
- Incremental enhancement approach
- Clear user stories guide implementation
- v4.1 API already production-ready
- Design patterns proven (D3, Vis.js integrated)

**Potential Challenges**:
- Causality graph complexity (mitigated by depth limiting)
- Epistemic visualization clarity (mitigated by color-coding)
- State reconstruction performance (already meets <100ms target)

---

## 13. Open Design Decisions

### Timeline Branching UI
**Decision**: Hide in v1
- API exists but GUI won't expose it
- Single timeline sufficient for most authors
- Can add in v2 if requested

### State Reconstruction Display
**Decision**: Plain language with toggle
- Default: "Health: 80 -> 60, Location: Bridge -> Medbay"
- Power drawer has "View Technical Details" for JSON

### Causality Graph Complexity
**Decision**: Depth 3 default, collapsible
- Slider to increase (up to 10)
- Collapsible branches
- Limit: 50 nodes max

### Mobile Support
**Decision**: Desktop only
- Development tool, not reader-facing
- Complex visualizations need screen space

---

## Appendix A: Component Dependencies

```
app.js
  ├─ router.js
  ├─ state.js
  └─ api-client.js

Screens:
  ├─ landing.js        → api-client (projects)
  ├─ dashboard.js      → api-client (stats), state
  ├─ timeline.js       → timeline-viz, causality-graph, layer-switcher
  ├─ characters.js     → entity-editor, arc-card, relationship-map
  ├─ epistemic.js      → epistemic-graph, layer-switcher
  ├─ narrative.js      → narrative-tree, scene-editor
  ├─ fictions.js       → fiction-manager
  ├─ story-logic.js    → arc-card, conflict-card, causality-graph, setup-payoff-list
  └─ validation.js     → validation-panel

Components:
  ├─ power-drawer.js   → standalone (used by multiple screens)
  ├─ layer-switcher.js → state (viewMode)
  ├─ causality-graph.js → D3.js
  └─ relationship-map.js → Vis.js
```

---

## Appendix B: Keyboard Shortcuts

**Global**:
- `/` - Focus search
- `Ctrl+N` - New entity
- `Esc` - Close modal/drawer
- `Ctrl+K` - Quick search

**Timeline**:
- `Arrow keys` - Navigate timeline
- `C` - Toggle causality
- `E` - Toggle epistemic mode

**Character**:
- `K` - What Character Knows
- `R` - Relationships
- `A` - Arc details

**Story Logic**:
- `1-6` - Switch tabs
- `G` - Causality graph
- `S` - Setup/payoff tracker

---

**END OF IMPLEMENTATION PLAN**
