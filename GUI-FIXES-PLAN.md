# TripleThink GUI Workflow Fixes - Implementation Plan

> **Plan Created:** 2026-01-12
> **Model Used:** Claude Opus 4.5 for exploration and planning
> **Status:** Ready for implementation
> **Estimated Time:** 1.5-2 hours

---

## Session Context & How to Resume

### Quick Start for New Session
```bash
# 1. Navigate to project directory
cd /app

# 2. Verify you're in the right place
pwd  # Should show: /app
ls   # Should see: api/, gui/, db/, BuildPrompts/, etc.

# 3. Read this plan
cat /root/.claude/plans/quiet-herding-flurry.md

# 4. Start implementation following the phases below
```

### Pre-Implementation Checklist
- [ ] Verify API server is NOT running (`pkill -f "node server.js"`)
- [ ] Verify GUI server is NOT running (pkill any `serve` processes)
- [ ] Confirm you're in `/app` directory
- [ ] Review the Issues Summary below
- [ ] Start with Phase 1 (Critical fixes MUST be done first)

### Environment Information
- **Working Directory:** `/app`
- **Docker Container:** Running on Windows 11 with WSL2
- **Project Location (Host):** `C:\Users\facra\OneDrive\Documents\AI Agent\claude\TripleThink`
- **Volume Mounts:** Changes persist to Windows filesystem
- **Database:** `/app/api/triplethink.db` (SQLite)
- **Technology Stack:**
  - Backend: Node.js 18+ with Express on port 3000
  - Frontend: Plain HTML/CSS/JavaScript served on port 8080
  - Database: SQLite with better-sqlite3

### How to Test After Implementation
```bash
# Terminal 1 - Start API
cd /app/api
node server.js
# Should see: "TripleThink API listening on port 3000"

# Terminal 2 - Start GUI (in new terminal)
cd /app
npx serve -s gui -l 8080
# Should see: "Serving on http://localhost:8080"

# Terminal 3 - Open browser (on Windows host)
# Navigate to: http://localhost:8080
# Run through verification tests at end of this plan
```

### User's Original Request
The user reported three main issues:
1. **Can't create projects/series** - Projects screen shows hardcoded data
2. **Dashboard needs series selector** - No way to select which series to display
3. **Dialog cancel buttons don't work** - Specifically the knowledge modal X button

During exploration with Opus 4.5, we found **8 additional critical issues** that would prevent the GUI from working correctly.

---

## Overview

The TripleThink GUI has multiple critical workflow issues that prevent it from functioning correctly. This plan addresses all identified issues in a logical order, starting with runtime errors that break the application, then missing functionality, and finally incomplete workflows.

### What This Plan Fixes
- **11 total issues** (3 user-reported + 8 discovered)
- **12 files** to be modified
- **4 implementation phases** (logical order)
- **7 end-to-end tests** for verification

## Issues Summary

### Critical (App-Breaking)
1. **`formatters.formatDate()` doesn't exist** - Called in 6 locations but function not defined
2. **API_BASE mismatch** - GUI on port 8080 can't reach API on port 3000
3. **`MetadataModal.show()` incorrect** - Function name mismatch causes errors

### High Priority (Features Don't Work)
4. **No project creation UI** - Projects screen shows hardcoded text
5. **No series selection** - Dashboard can't switch between projects
6. **Knowledge modal X button not wired** - Cannot close modal with X button
7. **Search button not wired** - Header search button does nothing

### Medium Priority (Incomplete Workflows)
8. **Event editor buttons not wired** - Add Phase/Fact/Participant buttons don't work
9. **Timeline list mode loses filters** - Filters not passed to list view
10. **Route conflicts** - Fictions/Characters routes don't filter properly
11. **Scene metadata button broken** - Wrong function name

---

## Implementation Phases

### PHASE 1: Critical Runtime Error Fixes (Required First)

These must be fixed first as they cause JavaScript errors that break the application.

#### 1.1 Fix `formatters.formatDate` Undefined Error

**File:** `/app/gui/js/utils/formatters.js`

**Problem:** Code calls `formatters.formatDate()` in 6 locations but function doesn't exist.

**Affected Locations:**
- `/app/gui/js/screens/epistemic.js:132`
- `/app/gui/js/components/event-mapper.js:122`
- `/app/gui/js/components/timeline-viz.js:204`
- `/app/gui/js/utils/timeline-slider.js:47,97,98`

**Solution:** Add `formatDate` alias method after line 52:

```javascript
  // Add alias for backward compatibility
  formatDate(isoString) {
    return this.date(isoString);
  },
```

**Verification:**
- Open Epistemic screen → select character → no console errors
- Open Timeline visualization → tooltips show dates correctly
- Use timeline slider → dates display without errors

---

#### 1.2 Fix API_BASE Prefix Mismatch

**File:** `/app/gui/js/api-client.js`

**Problem:** When GUI is served on port 8080, API calls go to `http://localhost:8080/api` instead of `http://localhost:3000/api`. The API IS using `/api` prefix (confirmed in server.js:204-235), but GUI needs to point to different port.

**Current Code (line 6):**
```javascript
const API_BASE = '/api';
```

**Solution:** Replace line 6 with dynamic detection:

```javascript
// Determine API base URL based on how GUI is being served
const API_BASE = (function() {
  const currentPort = window.location.port;
  // If on port 8080 (GUI server), point to API on port 3000
  if (currentPort === '8080') {
    return 'http://localhost:3000/api';
  }
  // If served from same Express server (port 3000), use relative path
  return '/api';
})();
```

**Verification:**
- Start GUI on 8080, API on 3000
- Open browser console → should see successful API calls
- Dashboard loads stats without 404 errors

---

#### 1.3 Fix `MetadataModal.show()` Method Call

**File:** `/app/gui/js/components/scene-editor.js`

**Problem:** Line 196 calls `MetadataModal.show('${scene.id}', 'scene')` but function is `showMetadataModal()`.

**Solution:** Find the button with `onclick="MetadataModal.show(...)` and replace with:

```javascript
onclick="showMetadataModal('${scene.id}')"
```

**Verification:**
- Open scene in Scene Editor
- Click Metadata tab → click "Edit Metadata" button
- Modal should open without errors

---

### PHASE 2: Wire Up Missing Event Handlers

#### 2.1 Wire Up Search Button in Header

**File:** `/app/gui/js/app.js`

**Problem:** Search button (`#search-btn`) in header has no click listener.

**Solution:** Add to `setupGlobalListeners()` function (after existing listeners):

```javascript
  // Search button
  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      QuickSearch.show();
    });
  }
```

**Verification:**
- Click "Search" button in header
- QuickSearch modal opens

---

#### 2.2 Wire Up Knowledge Modal Close Button

**File:** `/app/gui/js/components/knowledge-editor.js`

**Problem:** X button (`#knowledge-modal-close`) has no event listener.

**Solution:** Add at end of file (after line 276):

```javascript
// Setup modal close button handler
if (document.getElementById('knowledge-modal-close')) {
  document.getElementById('knowledge-modal-close').addEventListener('click', closeKnowledgeModal);
}
```

**Verification:**
- Open Epistemic screen → select character
- Click X button on knowledge modal → modal closes

---

#### 2.3 Wire Up Event Editor Buttons (Phases, Facts, Participants)

**File:** `/app/gui/js/components/entity-editor.js`

**Problem:** Buttons for "Add Phase", "Add Fact", "Add Participant" have no handlers.

**Solution A:** In `setupEntityFormHandlers()` function, add event listeners for event type:

```javascript
  // Event-specific button handlers
  if (type === 'event') {
    const addPhaseBtn = document.getElementById('add-phase-btn');
    if (addPhaseBtn) {
      addPhaseBtn.addEventListener('click', () => addPhaseRow());
    }

    const addFactBtn = document.getElementById('add-fact-btn');
    if (addFactBtn) {
      addFactBtn.addEventListener('click', () => addFactRow());
    }

    const addParticipantBtn = document.getElementById('add-participant-btn');
    if (addParticipantBtn) {
      addParticipantBtn.addEventListener('click', () => addParticipantRow());
    }
  }
```

**Solution B:** Add these three functions to create dynamic form rows:

```javascript
function addPhaseRow() {
  const container = document.getElementById('phases-container');
  const phaseIndex = container.querySelectorAll('.phase-row').length;

  const row = document.createElement('div');
  row.className = 'phase-row';
  row.style.cssText = 'padding: var(--space-3); border: 1px solid var(--color-gray-200); border-radius: var(--radius-md); margin-bottom: var(--space-2);';
  row.innerHTML = `
    <div class="form-group">
      <label class="form-label">Phase Name</label>
      <input type="text" class="form-input" name="phase_${phaseIndex}_name" placeholder="e.g., preparation">
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea class="form-textarea" name="phase_${phaseIndex}_description" rows="2"></textarea>
    </div>
    <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">Remove</button>
  `;
  container.insertBefore(row, container.querySelector('button'));
}

function addFactRow() {
  const container = document.getElementById('facts-container');
  const factIndex = container.querySelectorAll('.fact-row').length;

  const row = document.createElement('div');
  row.className = 'fact-row';
  row.style.cssText = 'padding: var(--space-3); border: 1px solid var(--color-gray-200); border-radius: var(--radius-md); margin-bottom: var(--space-2);';
  row.innerHTML = `
    <div class="form-group">
      <label class="form-label">Fact ID</label>
      <input type="text" class="form-input" name="fact_${factIndex}_id" placeholder="e.g., fact-discovery">
    </div>
    <div class="form-group">
      <label class="form-label">Content</label>
      <textarea class="form-textarea" name="fact_${factIndex}_content" rows="2"></textarea>
    </div>
    <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">Remove</button>
  `;
  container.insertBefore(row, container.querySelector('button'));
}

function addParticipantRow() {
  const container = document.getElementById('participants-container');
  const participantIndex = container.querySelectorAll('.participant-row').length;

  const row = document.createElement('div');
  row.className = 'participant-row';
  row.style.cssText = 'padding: var(--space-3); border: 1px solid var(--color-gray-200); border-radius: var(--radius-md); margin-bottom: var(--space-2);';
  row.innerHTML = `
    <div class="form-group">
      <label class="form-label">Character ID</label>
      <input type="text" class="form-input" name="participant_${participantIndex}_id" placeholder="e.g., char-john">
    </div>
    <div class="form-group">
      <label class="form-label">Role</label>
      <select class="form-select" name="participant_${participantIndex}_role">
        <option value="active">Active</option>
        <option value="passive">Passive</option>
        <option value="observer">Observer</option>
      </select>
    </div>
    <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">Remove</button>
  `;
  container.insertBefore(row, container.querySelector('button'));
}
```

**Solution C:** Update `saveEntity()` function to collect phase/fact/participant data:

```javascript
async function saveEntity(type, form) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // For events, collect phases, facts, and participants
  if (type === 'event') {
    // Collect phases
    const phases = [];
    const phaseRows = document.querySelectorAll('.phase-row');
    phaseRows.forEach((row, idx) => {
      const name = formData.get(`phase_${idx}_name`);
      const description = formData.get(`phase_${idx}_description`);
      if (name) {
        phases.push({ name, description: description || '' });
      }
    });
    if (phases.length > 0) {
      data.phases = phases;
    }

    // Collect facts
    const facts = [];
    const factRows = document.querySelectorAll('.fact-row');
    factRows.forEach((row, idx) => {
      const id = formData.get(`fact_${idx}_id`);
      const content = formData.get(`fact_${idx}_content`);
      if (id) {
        facts.push({ id, content: content || '' });
      }
    });
    if (facts.length > 0) {
      data.facts_created = facts;
    }

    // Collect participants
    const participants = [];
    const participantRows = document.querySelectorAll('.participant-row');
    participantRows.forEach((row, idx) => {
      const id = formData.get(`participant_${idx}_id`);
      const role = formData.get(`participant_${idx}_role`);
      if (id) {
        participants.push({ character_id: id, role: role || 'active' });
      }
    });
    if (participants.length > 0) {
      data.participants = participants;
    }
  }

  // ... rest of existing save logic ...
}
```

**Verification:**
- Create new Event → go to Phases tab → click "Add Phase" → form row appears
- Same for Facts and Participants tabs
- Save event → data includes phases/facts/participants

---

#### 2.4 Fix Timeline List Mode Filter Passing

**File 1:** `/app/gui/js/screens/timeline.js`

**Problem:** Line 133 doesn't pass filters to `TimelineView.render()`.

**Solution:** Update line 133 to include filters:

```javascript
await TimelineView.render('timeline-container', startDate, endDate, filters);
```

**File 2:** `/app/gui/js/components/timeline-view.js`

**Solution:** Update `render()` function signature and add filter parameters to URL:

```javascript
const TimelineView = {
  async render(containerId, startDate, endDate, filters = {}) {
    const container = document.getElementById(containerId);

    try {
      let url = `/temporal/events?from=${startDate}&to=${endDate}`;

      if (filters.type) {
        url += `&type=${filters.type}`;
      }
      if (filters.participant) {
        url += `&participant=${filters.participant}`;
      }

      const response = await api.request(url);
      // ... rest of existing code ...
```

**Verification:**
- Open Timeline → switch to List view
- Apply filter (e.g., Event Type = "event")
- List shows only matching events

---

### PHASE 3: Project Management Implementation

#### 3.1 Add Project State Management

**File:** `/app/gui/js/state.js`

**Problem:** No way to track which project is currently selected.

**Solution:** Add `currentProjectId` to initial state (around line 58):

```javascript
const state = new State({
  currentRoute: 'dashboard',
  selectedEntity: null,
  entities: [],
  loading: false,
  project: null,
  currentProjectId: null,  // Add this line
});
```

---

#### 3.2 Implement Project Creation/Editing UI

**File:** `/app/gui/js/screens/projects.js`

**Problem:** Lines 12-31 show hardcoded project info with no forms or CRUD functionality.

**Solution:** Complete rewrite of `renderProjects()` function and add project management functions:

**Key Changes:**
1. Replace hardcoded project info with dynamic project list loaded from `/projects` API
2. Add "New Project" button that opens creation modal
3. Add project selection functionality (click to select)
4. Show selected project as "Current Project" with edit button
5. Add edit/delete buttons for each project
6. Auto-select newly created projects

**New Functions to Add:**
- `loadProjects()` - Fetch and display project list
- `selectProject(projectId)` - Set current project in state
- `showCurrentProjectInfo(project)` - Display selected project details
- `showNewProjectModal()` - Open creation form
- `createProject(form)` - Submit new project
- `editProject(projectId)` - Open edit form
- `updateProject(projectId, form)` - Submit updates
- `editCurrentProject()` - Shortcut to edit selected project
- `deleteProject(projectId, projectName)` - Delete with confirmation

**Form Fields:**
- Project ID (unique identifier, e.g., "project-my-series")
- Name (display name)
- Author (optional)
- Description (optional)

**Verification:**
- Projects screen shows list of projects or empty state
- Click "New Project" → form opens
- Fill and submit → project appears in list
- Click project → becomes "Current Project"
- Edit/Delete buttons work correctly

---

#### 3.3 Add Project Selector to Dashboard

**File:** `/app/gui/js/screens/dashboard.js`

**Problem:** Dashboard has no indication of which project is active or way to switch.

**Solution:** Add project info card at top of dashboard (after line ~20):

```javascript
    // Get current project info
    const currentProjectId = state.get('currentProjectId');
    let currentProjectName = 'No project selected';

    if (currentProjectId) {
      try {
        const projectResponse = await api.request(`/projects/${currentProjectId}`);
        currentProjectName = projectResponse.data?.name || currentProjectId;
      } catch (e) {
        // Project may not exist
      }
    }

    container.innerHTML = `
      <!-- Project Selector Card -->
      <div class="card" style="margin-bottom: var(--space-6);">
        <div class="card-header">
          <h3 class="card-title">Current Project</h3>
          <button class="btn btn-secondary btn-sm" onclick="router.navigate('projects')">
            Change Project
          </button>
        </div>
        <div style="padding: var(--space-4);">
          <div style="font-size: var(--font-size-lg); font-weight: 600;">
            ${currentProjectName}
          </div>
          ${!currentProjectId ? '<p class="text-gray" style="margin-top: var(--space-2);">Select a project in the Projects screen to get started.</p>' : ''}
        </div>
      </div>

      <!-- Existing Stats Grid -->
      <div class="grid-3">
        <!-- ... existing stats ... -->
      </div>

      <!-- ... rest of dashboard ... -->
    `;
```

**Verification:**
- Dashboard shows current project name
- "Change Project" button navigates to Projects screen
- If no project selected, shows guidance message

---

### PHASE 4: Route and Navigation Fixes

#### 4.1 Fix Characters Route Filter

**File:** `/app/gui/js/screens/entities.js`

**Problem:** Line 145 - Characters route shows all entities instead of filtering to characters.

**Solution:** Update route to auto-apply character filter:

```javascript
router.register('characters', () => {
  renderEntities();
  // Auto-select character filter after render
  setTimeout(() => {
    const typeFilter = document.getElementById('entity-type-filter');
    if (typeFilter) {
      typeFilter.value = 'character';
      filterEntities();
    }
  }, 100);
});
```

**Verification:**
- Navigate to Characters → only characters shown in list

---

#### 4.2 Fix Fictions Route

**File:** `/app/gui/js/screens/entities.js`

**Problem:** Similar to characters - shows all entities instead of fictions only.

**Solution:** Update fictions route (line 146):

```javascript
router.register('fictions', () => {
  renderEntities();
  setTimeout(() => {
    const typeFilter = document.getElementById('entity-type-filter');
    if (typeFilter) {
      typeFilter.value = 'fiction';
      filterEntities();
    }
  }, 100);
});
```

**Verification:**
- Navigate to Fictions → only fictions shown in list

---

## Critical Files to Modify

### Must Edit (Critical Fixes)
1. `/app/gui/js/utils/formatters.js` - Add formatDate alias
2. `/app/gui/js/api-client.js` - Fix API_BASE port detection
3. `/app/gui/js/components/scene-editor.js` - Fix MetadataModal.show call

### Must Edit (Event Handlers)
4. `/app/gui/js/app.js` - Wire search button
5. `/app/gui/js/components/knowledge-editor.js` - Wire close button
6. `/app/gui/js/components/entity-editor.js` - Wire phase/fact/participant buttons + update saveEntity

### Must Edit (Features)
7. `/app/gui/js/state.js` - Add currentProjectId
8. `/app/gui/js/screens/projects.js` - Complete rewrite for project CRUD
9. `/app/gui/js/screens/dashboard.js` - Add project selector
10. `/app/gui/js/screens/timeline.js` - Pass filters to list view
11. `/app/gui/js/components/timeline-view.js` - Accept and use filters
12. `/app/gui/js/screens/entities.js` - Fix character/fiction route filters

---

## End-to-End Verification Plan

### Test 1: Application Startup
1. Start API: `cd /app/api && node server.js`
2. Start GUI: `cd /app && npx serve -s gui -l 8080`
3. Open http://localhost:8080
4. **Expected:** Dashboard loads without console errors

### Test 2: Project Management Flow
1. Navigate to Projects screen
2. Click "New Project"
3. Fill form: ID=`project-test`, Name=`Test Series`
4. Submit
5. **Expected:** Project appears in list, auto-selected as current
6. Click "Edit" → modify name → save
7. **Expected:** Changes reflected immediately
8. Navigate to Dashboard
9. **Expected:** Shows "Test Series" as current project

### Test 3: Event Creation with Phases/Facts/Participants
1. Navigate to Entities
2. Click "New Entity" → select Event type
3. Fill basic info
4. Go to Phases tab → click "Add Phase" → fill phase info
5. Go to Facts tab → click "Add Fact" → fill fact info
6. Go to Participants tab → click "Add Participant" → fill participant info
7. Save
8. **Expected:** Event created with all sub-entities, no console errors

### Test 4: Timeline Filtering
1. Navigate to Timeline
2. Apply date range filter
3. Switch to List view
4. Apply Event Type filter
5. **Expected:** List shows only matching events
6. Switch to Visualization view
7. **Expected:** Visualization also shows filtered results

### Test 5: Epistemic Graph
1. Navigate to Epistemic Graph
2. Select a character from dropdown
3. **Expected:** Knowledge details load, dates formatted correctly (no formatDate errors)
4. Click X button on knowledge modal
5. **Expected:** Modal closes

### Test 6: Search
1. Click Search button in header (or press Ctrl+K)
2. Type search query
3. **Expected:** Results appear
4. Click result
5. **Expected:** Entity details open

### Test 7: Navigation Routes
1. Click Characters in nav
2. **Expected:** Only characters shown
3. Click Fictions in nav
4. **Expected:** Only fictions shown

---

## Implementation Order Summary

**Time Estimates:**
- Phase 1 (Critical): ~15 minutes
- Phase 2 (Handlers): ~30 minutes
- Phase 3 (Projects): ~45 minutes
- Phase 4 (Routes): ~10 minutes
- **Total:** ~1.5-2 hours

**Logical Sequence:**
1. Phase 1.1-1.3 (Critical runtime errors) - MUST be done first
2. Phase 2 (Event handlers) - Can be done in parallel with Phase 3
3. Phase 3 (Project management) - Core feature implementation
4. Phase 4 (Routes) - Minor fixes, can be done last

**Risk Areas:**
- Project CRUD in Phase 3.2 is the most complex change (major rewrite)
- Entity editor changes in Phase 2.3 require careful testing
- API_BASE fix in Phase 1.2 is critical - if wrong, entire app breaks

**Success Criteria:**
- All 7 end-to-end tests pass
- No JavaScript console errors
- All buttons/links respond to clicks
- Data persists correctly through API

---

## Additional Context for New Session

### Codebase Structure Overview

```
/app/
├── api/                          # Backend API (Express)
│   ├── server.js                # Main server file (port 3000)
│   ├── routes/                  # API route handlers
│   │   ├── projects.js         # Project CRUD endpoints
│   │   ├── entities.js         # Entity CRUD endpoints
│   │   ├── fictions.js         # Fiction CRUD endpoints
│   │   └── ... (more routes)
│   ├── middleware/              # Auth, cache, rate-limit
│   ├── triplethink.db          # SQLite database file
│   └── package.json
├── gui/                          # Frontend GUI (served on 8080)
│   ├── index.html               # Main entry point
│   ├── js/
│   │   ├── app.js              # App initialization, global listeners
│   │   ├── router.js           # Client-side routing
│   │   ├── state.js            # Global state management
│   │   ├── api-client.js       # API wrapper (needs Phase 1.2 fix)
│   │   ├── screens/            # Screen components
│   │   │   ├── dashboard.js   # Dashboard screen (Phase 3.3)
│   │   │   ├── projects.js    # Projects screen (Phase 3.2 - major rewrite)
│   │   │   ├── entities.js    # Entities list (Phase 4.1, 4.2)
│   │   │   ├── timeline.js    # Timeline screen (Phase 2.4)
│   │   │   └── epistemic.js   # Epistemic graph (uses formatDate)
│   │   ├── components/         # Reusable UI components
│   │   │   ├── entity-editor.js        # Entity modal (Phase 2.3 - complex)
│   │   │   ├── knowledge-editor.js     # Knowledge modal (Phase 2.2)
│   │   │   ├── scene-editor.js         # Scene editor (Phase 1.3)
│   │   │   ├── timeline-view.js        # Timeline list view (Phase 2.4)
│   │   │   ├── timeline-viz.js         # Timeline visualization (uses formatDate)
│   │   │   └── metadata-modal.js       # Metadata modal
│   │   └── utils/
│   │       ├── formatters.js           # Date/value formatters (Phase 1.1 - critical)
│   │       └── timeline-slider.js      # Timeline slider (uses formatDate)
│   ├── styles/
│   └── lib/
├── db/                           # Database layer
│   └── api-functions.js         # Database API functions
└── CLAUDE.md                     # Project documentation (read this!)
```

### Key Architectural Points

**TripleThink Architecture:**
- **Event-sourced system** - Immutable event log as source of truth
- **Three Layers of Reality:**
  1. World Truth (what actually happened)
  2. Character Perception (what each character believes)
  3. Narrative Presentation (what reader sees when)
- **Separated Metadata Architecture:**
  - Entities table: Core facts (loaded by default)
  - Metadata table: Author notes, AI guidance (loaded on-demand)
  - 87% token savings for simple queries
- **ID-Based Referencing:** Every entity has unique ID, no data duplication

**GUI State Management:**
- Global state in `/app/gui/js/state.js` using simple observer pattern
- Router in `/app/gui/js/router.js` handles client-side navigation
- Each screen is a module that registers routes and renders to `#screen-container`

**API Communication:**
- All routes mounted under `/api` prefix (confirmed in server.js:204-235)
- REST API with JSON payloads
- Error handling via middleware
- Authentication and rate-limiting in place

### Common Pitfalls to Avoid

1. **Don't run servers before making changes** - Easier to test after all fixes applied
2. **Phase 1 is critical** - Without these fixes, app won't load at all
3. **Test in browser console** - Many errors only visible in DevTools (F12)
4. **Project CRUD is complex** - Phase 3.2 is the biggest change, test thoroughly
5. **Don't forget to restart servers** - Changes won't be visible without restart
6. **Port conflicts** - If 3000 or 8080 in use, `pkill` processes first

### Troubleshooting Tips

**If GUI won't load:**
- Check browser console for JavaScript errors (F12 → Console tab)
- Verify API is running: `curl http://localhost:3000/api/health`
- Verify GUI is being served: `curl http://localhost:8080`
- Check Phase 1.2 fix - if API_BASE is wrong, nothing will work

**If API calls fail with 404:**
- Phase 1.2 not applied correctly
- API server not running on port 3000
- Check Network tab in DevTools to see actual URLs being called

**If database errors occur:**
- Check `/app/api/triplethink.db` exists
- Verify better-sqlite3 is installed: `cd /app/api && npm list better-sqlite3`
- Check API server console for error messages

**If modals don't close:**
- Phase 2.2 not applied (knowledge modal)
- Check for JavaScript errors in console
- Verify event listeners are attached after DOM loads

### Key API Endpoints (For Testing)

```bash
# Health check
curl http://localhost:3000/api/health

# Get all projects
curl http://localhost:3000/api/projects

# Create a project
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"id":"project-test","name":"Test Series","author":"Test Author"}'

# Get project by ID
curl http://localhost:3000/api/projects/project-test

# Get status/stats
curl http://localhost:3000/api/status

# Search entities
curl "http://localhost:3000/api/entities?type=character"
```

### References

- **Main Documentation:** `/app/CLAUDE.md` - Comprehensive project guide
- **Build Prompts:** `/app/BuildPrompts/PROMPT_*.md` - Original specifications
- **API Routes:** `/app/api/server.js` (lines 200-240) - All endpoint definitions
- **Database Schema:** `/app/api/routes/projects.js` - See SQL queries for schema structure

### Files Modified in This Plan (Quick Reference)

**Critical (Phase 1):**
1. `/app/gui/js/utils/formatters.js` - Add formatDate method
2. `/app/gui/js/api-client.js` - Fix API_BASE for port 8080
3. `/app/gui/js/components/scene-editor.js` - Fix MetadataModal.show call

**Event Handlers (Phase 2):**
4. `/app/gui/js/app.js` - Wire search button
5. `/app/gui/js/components/knowledge-editor.js` - Wire close button
6. `/app/gui/js/components/entity-editor.js` - Wire phase/fact/participant buttons (complex)
7. `/app/gui/js/screens/timeline.js` - Pass filters to list view
8. `/app/gui/js/components/timeline-view.js` - Accept filters parameter

**Project Management (Phase 3):**
9. `/app/gui/js/state.js` - Add currentProjectId
10. `/app/gui/js/screens/projects.js` - Complete rewrite (most complex change)
11. `/app/gui/js/screens/dashboard.js` - Add project selector

**Routes (Phase 4):**
12. `/app/gui/js/screens/entities.js` - Fix character/fiction route filters

### Post-Implementation Tasks

After completing all phases:
1. Run all 7 verification tests
2. Test on Windows host browser (http://localhost:8080)
3. Check for console errors
4. Test project creation/editing flow thoroughly
5. Test event creation with phases/facts/participants
6. Verify timeline filtering works in both views
7. Test all navigation routes (dashboard, projects, timeline, entities, characters, fictions, narrative, epistemic, validation)
8. Create a test project and add sample entities
9. Export project to verify export functionality works

### Known Limitations (Not Fixed in This Plan)

These issues exist but are not addressed in this plan:
- Import project functionality (shows "coming soon" message)
- Remove event from scene (shows toast instead of removing)
- Scene event mapping (incomplete implementation)
- Export/import project validation

These can be addressed in a future session if needed.

---

## Ready to Implement

This plan is complete and ready for implementation. Start with Phase 1 and work through sequentially. Each phase builds on the previous ones, so order matters.

**Questions? Check:**
1. This plan file (you're reading it)
2. `/app/CLAUDE.md` for project architecture
3. Browser DevTools Console (F12) for JavaScript errors
4. API server console for backend errors

**Good luck! The implementation should take approximately 1.5-2 hours.**
