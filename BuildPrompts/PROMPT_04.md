● Four Sequential Prompts for Building TripleThink

  System Name Proposal: TripleThink

  TripleThink - An event-sourced narrative construction system for multi-book series

  Why "TripleThink"?
  - a play of 1984's DoubleThink and the Ministry Of Truth
  - Memorable, professional, distinct from CAWA

  Alternative tagline: "TripleThink: Where Story Becomes Simulation"

   ---

  # PROMPT 4: GUI Design & Forms

  Task: Design TripleThink GUI & HTML Forms

  This is Prompt 4 of 4 (GUI Design). The API from Prompt 3 is now implemented.

  Context

  We have:
  - Complete JSON schema (Prompt 1)
  - Database implementation (Prompt 2)
  - REST API (Prompt 3)

  Now we need the author-facing GUI for creating and editing TripleThink projects.

  Your Task

  Design the complete GUI for TripleThink.

  1. Technology Stack

  Evaluate and recommend:
  - Plain HTML/CSS/JS (no build step, simple)
  - React + Tailwind (modern, component-based)
  - Svelte (reactive, smaller bundle)
  - Electron app (desktop native)
  - Web app (browser-based)

  Requirements:
  - Must run locally (author's machine)
  - Must be fast and responsive
  - Must handle complex forms (events, characters, knowledge states)
  - Must visualize relationships (timelines, epistemic graphs)
  - Must support markdown/rich text (for notes fields)

  Provide recommendation with rationale.

  2. Screen Designs (Wireframes)

  Core Screens:

  1. PROJECT DASHBOARD
     - Project name, description
     - Books list (with status)
     - Quick stats (# events, characters, chapters)
     - Recent activity
     - Actions: New Book, Export, Settings

  2. TIMELINE VIEW (Visual)
     - Horizontal timeline (date axis)
     - Events as nodes
     - Color-coded by type
     - Click to edit
     - Filter: event type, date range, participant

  3. ENTITY LIST (Table)
     - Columns: ID, Name, Type, Status, Last Modified
     - Filters: Type, Completeness, Date Range
     - Search bar
     - Actions: New, Edit, Delete, Batch operations

  4. ENTITY EDITOR (Form)
     - Tabs: Basic Info, Timeline Data, Metadata
     - Dynamic fields based on entity type
     - Validation indicators
     - Save/Cancel buttons
     - Related entities sidebar

  5. CHARACTER KNOWLEDGE VIEW (Special)
     - Character selector
     - Timeline slider
     - Knowledge state at time T
     - Facts believed (true/false)
     - Related events that changed beliefs
     - Epistemic graph (visual)

  6. FICTION MANAGER (Special)
     - List all fictions
     - Audience visualization
     - Collapse triggers
     - Consistency rule checker
     - Warning indicators

  7. NARRATIVE DIRECTOR (Book Structure)
     - Tree view: Books → Acts → Chapters → Scenes
     - Drag-drop reordering
     - Event mapping (scene → events)
     - POV assignment
     - Epistemic constraints per scene

  8. METADATA EDITOR (Modal)
     - Separate from entity editor
     - Rich text for author_notes
     - Markdown preview
     - TODO list widget
     - Version changelog

  Provide wireframe sketches (ASCII art or HTML mockups).

  3. Form Designs

  A. Event Editor Form:

  <form id="event-editor">
    <h2>Event Editor</h2>

    <!-- Basic Info Tab -->
    <div class="tab-content" id="basic-info">
      <label>Event ID</label>
      <input type="text" name="id" value="evt-" required>

      <label>Timestamp</label>
      <input type="datetime-local" name="timestamp" required>

      <label>Type</label>
      <select name="type">
        <option>information_transfer</option>
        <option>deception_event</option>
        <option>complex_multi_phase</option>
        <option>state_change</option>
      </select>

      <label>Summary</label>
      <textarea name="summary" rows="3"></textarea>
    </div>

    <!-- Phases Tab (for multi-phase events) -->
    <div class="tab-content" id="phases">
      <h3>Phases</h3>
      <div id="phases-list">
        <!-- Repeatable phase fields -->
        <div class="phase">
          <input name="phase_id" placeholder="phase-1-opening">
          <input name="time_offset" placeholder="+0m">
          <input name="duration" placeholder="5m">
          <textarea name="description"></textarea>
          <button type="button" class="remove-phase">×</button>
        </div>
      </div>
      <button type="button" id="add-phase">+ Add Phase</button>
    </div>

    <!-- Facts Created Tab -->
    <div class="tab-content" id="facts">
      <h3>Facts Created</h3>
      <div id="facts-list">
        <div class="fact">
          <input name="fact_id" placeholder="fact-something-happened">
          <select name="type">
            <option>ground_truth</option>
            <option>secret</option>
            <option>false_belief_propagated</option>
          </select>
          <textarea name="content" placeholder="What fact is created?"></textarea>
          <input name="visibility" placeholder="world_truth | stella_only | etc">
          <button type="button" class="remove-fact">×</button>
        </div>
      </div>
      <button type="button" id="add-fact">+ Add Fact</button>
    </div>

    <!-- Participants Tab -->
    <div class="tab-content" id="participants">
      <h3>Participants</h3>
      <div id="participants-list">
        <div class="participant">
          <select name="character_id">
            <!-- Populated from character list -->
          </select>
          <input name="role" placeholder="protagonist | witness | etc">
          <input name="participation_type" placeholder="primary | secondary">
          <button type="button" class="remove-participant">×</button>
        </div>
      </div>
      <button type="button" id="add-participant">+ Add Participant</button>
    </div>

    <!-- Metadata Tab -->
    <div class="tab-content" id="metadata">
      <label>
        <input type="checkbox" name="read_metadata_mandatory">
        Mandatory Metadata (AI must always load)
      </label>

      <button type="button" id="edit-metadata-modal">
        Edit Metadata (Notes, Guidance, Rules)
      </button>

      <div class="metadata-preview">
        <!-- Shows snippet of metadata if exists -->
      </div>
    </div>

    <!-- Actions -->
    <div class="form-actions">
      <button type="submit" class="primary">Save Event</button>
      <button type="button" class="secondary">Cancel</button>
      <button type="button" class="danger">Delete</button>
    </div>
  </form>

  B. Character Editor Form:

  <form id="character-editor">
    <h2>Character Editor</h2>

    <!-- Identity -->
    <fieldset>
      <legend>Identity</legend>
      <input name="id" placeholder="char-eric">
      <input name="name" placeholder="Eric Chen">
      <select name="type">
        <option>human</option>
        <option>artificial_intelligence</option>
      </select>
      <input type="date" name="birth_date">
    </fieldset>

    <!-- Traits -->
    <fieldset>
      <legend>Traits</legend>
      <textarea name="core_traits" placeholder="creative, compassionate, etc"></textarea>
      <textarea name="voice_style" placeholder="Introverted, artistic metaphors"></textarea>
    </fieldset>

    <!-- Knowledge State Timeline -->
    <fieldset>
      <legend>Knowledge State Timeline</legend>
      <button type="button" id="knowledge-timeline-editor">
        Edit Knowledge States (Advanced Editor)
      </button>
      <!-- This opens a specialized timeline editor -->
    </fieldset>

    <!-- Relationships -->
    <fieldset>
      <legend>Relationships</legend>
      <button type="button" id="relationship-editor">
        Manage Relationships
      </button>
    </fieldset>
  </form>

  C. Metadata Modal:

  <div class="modal" id="metadata-modal">
    <div class="modal-content">
      <h2>Metadata for: <span id="entity-name"></span></h2>

      <!-- Author Notes -->
      <label>Author Notes (Creative Intent, Constraints)</label>
      <textarea name="author_notes" rows="5"
                placeholder="Why this exists, what's sacred, creative decisions..."></textarea>

      <!-- AI Guidance -->
      <label>AI Guidance (Operational Instructions)</label>
      <textarea name="ai_guidance" rows="5"
                placeholder="How AI should handle this entity, voice guidance, consistency checks..."></textarea>

      <!-- Development Status -->
      <fieldset>
        <legend>Development Status</legend>
        <select name="completeness">
          <option>complete</option>
          <option>partial</option>
          <option>placeholder</option>
          <option>needs_validation</option>
        </select>

        <label>TODOs</label>
        <div id="todo-list">
          <!-- Repeatable TODO items -->
        </div>

        <label>Uncertainties</label>
        <textarea name="uncertainties" rows="3"></textarea>

        <label>Warnings</label>
        <textarea name="warnings" rows="3"
                  placeholder="Don't change without understanding X..."></textarea>
      </fieldset>

      <!-- Prose Guidance (for events/characters) -->
      <fieldset>
        <legend>Prose Guidance</legend>
        <input name="pacing" placeholder="slow_intimate | fast_action">
        <input name="emotional_tone" placeholder="cold horror | tender">
        <textarea name="voice_examples" rows="4"
                  placeholder="Good: Example 1&#10;Bad: Example 2"></textarea>
      </fieldset>

      <!-- Consistency Rules (for fictions/events) -->
      <fieldset>
        <legend>Consistency Rules</legend>
        <div id="consistency-rules-list">
          <!-- Repeatable rule fields -->
        </div>
      </fieldset>

      <!-- Version Info (read-only) -->
      <fieldset>
        <legend>Version Info</legend>
        <div class="readonly">
          <p>Created: <span id="created"></span></p>
          <p>Modified: <span id="modified"></span></p>
          <p>Modified By: <span id="modified-by"></span></p>
        </div>

        <label>Changelog</label>
        <textarea name="changelog" rows="3"
                  placeholder="What changed and why"></textarea>
      </fieldset>

      <div class="modal-actions">
        <button type="button" class="primary" id="save-metadata">Save</button>
        <button type="button" class="secondary" id="cancel-metadata">Cancel</button>
      </div>
    </div>
  </div>

  4. Specialized Views

  A. Knowledge State Timeline Editor:

  Visual: Horizontal timeline with events
  - Character selector dropdown
  - Date range slider
  - Events that changed knowledge (markers)
  - Click event → see knowledge change
  - Add knowledge state button
  - Visual indicator: green=knows truth, red=believes lie

  B. Fiction Manager:

  Table view:
  | Fiction ID | Name | Target Audience | Status | Collapse Date |
  |------------|------|-----------------|--------|---------------|
  | fiction-2  | Crash Lie | Eric ONLY | Active | TBD |

  Click row → expands details:
  - Core narrative
  - Facts contradicted
  - Constraints
  - Exposure triggers
  - Consistency warnings (if violated)

  C. Epistemic Validation Panel:

  Sidebar widget (always visible):
  - "Check Knowledge State" button
  - Input: Character, Timestamp
  - Output:
    - Facts believed (list)
    - Fictions active (list)
    - Related events (timeline)
    - Warnings (if conflicts)

  5. Interaction Patterns

  A. Entity Creation Workflow:
  1. User clicks "New Event"
  2. Modal opens with empty form
  3. User fills basic info
  4. Auto-generated ID suggestion
  5. User adds phases/facts/participants
  6. User optionally sets metadata_mandatory flag
  7. User saves → API POST /api/entities
  8. Success → close modal, refresh list
  9. Offer: "Edit metadata now?" button

  B. Epistemic Query Workflow:
  1. User writing Chapter 7 (Eric POV)
  2. Clicks "Check Eric's Knowledge at 2033-07-05"
  3. Sidebar shows:
     - Eric believes: "7 died in crash"
     - Source: STELLA confession
     - Warning: "Fiction 2 is Eric-ONLY"
  4. User writes scene with confidence

  C. Timeline Navigation:
  1. User drags timeline slider
  2. Events in range highlight
  3. Click event → quick preview popup
  4. Double-click → open full editor
  5. Filter by participant → events involving Eric
  6. Export view → timeline PDF

  6. Styling & UX

  Design System:

  /* Color palette */
  :root {
    --primary: #4F46E5;  /* Indigo */
    --success: #10B981;  /* Green */
    --warning: #F59E0B;  /* Amber */
    --danger: #EF4444;   /* Red */
    --text: #1F2937;     /* Gray 800 */
    --bg: #F9FAFB;       /* Gray 50 */
    --border: #E5E7EB;   /* Gray 200 */
  }

  /* Typography */
  body {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.5;
  }

  h1 { font-size: 24px; font-weight: 700; }
  h2 { font-size: 20px; font-weight: 600; }
  h3 { font-size: 16px; font-weight: 600; }

  /* Forms */
  input, textarea, select {
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 14px;
  }

  /* Buttons */
  .button-primary {
    background: var(--primary);
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
  }

  Provide complete CSS framework.

  7. Validation & Feedback

  Real-time validation:

  // As user types, validate:
  - ID format (evt-*, char-*, etc)
  - Date format (ISO 8601)
  - Required fields
  - Reference integrity (character_id exists?)

  // Show indicators:
  ✓ Valid (green check)
  ⚠ Warning (yellow warning)
  ✗ Error (red X with message)

  Success/Error Messages:

  // Toast notifications
  toast.success("Event created successfully");
  toast.error("Failed to save: Character ID not found");
  toast.warning("Metadata is mandatory but empty");

  8. Keyboard Shortcuts

  Ctrl+N: New entity
  Ctrl+S: Save current form
  Ctrl+K: Quick search
  Ctrl+E: Toggle epistemic panel
  Escape: Close modal
  /: Focus search bar

  9. Data Visualization

  Timeline Visualization:
  - D3.js timeline chart
  - Zoom/pan support
  - Event nodes color-coded by type
  - Hover for preview

  Relationship Graph:
  - Vis.js or Cytoscape.js
  - Character → Event → Character connections
  - Fiction → Target Audience visualization

  Knowledge State Graph:
  - Sankey diagram showing belief changes
  - Green (truth) vs Red (lie) flows

  10. Deliverables

  Provide:
  1. index.html - Main GUI structure
  2. styles.css - Complete styling
  3. app.js - Application logic and API integration
  4. components/ - Reusable UI components
  5. wireframes.pdf - Screen mockups
  6. user-guide.md - How to use the GUI

  Success Criteria

  - GUI is intuitive for non-technical authors
  - Forms handle complex data structures
  - Epistemic queries are easy to access
  - Timeline visualization is clear
  - Metadata editing is straightforward
  - Performance is fast (< 100ms interactions)

  Begin.
