# PROMPT_04 Implementation Plan: GUI Design & Forms

## Purpose
This document provides a complete, self-contained implementation plan for building the TripleThink GUI. Follow these steps sequentially to create all required files.

---

## Prerequisites
- PROMPT_01 complete: `/app/schema/` JSON schema exists
- PROMPT_02 complete: `/app/db/` database layer exists
- PROMPT_03 complete: `/app/api/` REST API exists

---

## Technology Decision: Plain HTML/CSS/JS + Modern Libraries

**Chosen**: Vanilla HTML/CSS/JavaScript with lightweight libraries

**Technology Stack**:
- **Core**: Plain HTML5, CSS3, JavaScript ES6+
- **UI Framework**: None (custom components)
- **CSS Framework**: Custom design system (inspired by Tailwind)
- **Visualization**: D3.js for timelines, vis.js for graphs
- **Rich Text**: SimpleMDE for markdown editing
- **HTTP Client**: Fetch API (native)
- **State Management**: Simple reactive pattern
- **Build**: None required (runs directly in browser)

**Rationale**:
- **No Build Step**: Author opens `index.html` directly
- **Portability**: Works on any machine with browser
- **Fast**: No framework overhead, instant load
- **Simple**: Author can read/modify code easily
- **Sufficient**: HTML forms handle complex data well
- **Maintainable**: No dependency updates

**Rejected Alternatives**:
- React/Vue/Svelte: Requires build step, overkill
- Electron: Unnecessary wrapper, larger footprint
- SPA frameworks: Too complex for needs

---

## Directory Structure

```
/app/gui/
├── index.html              # Main entry point
├── styles/
│   ├── design-system.css   # Color palette, typography, spacing
│   ├── layout.css          # Grid, flexbox, page structure
│   ├── components.css      # Buttons, forms, cards, modals
│   ├── screens.css         # Screen-specific styles
│   └── visualizations.css  # Timeline, graph styles
├── js/
│   ├── app.js              # Main application controller
│   ├── api-client.js       # Fetch wrapper for API calls
│   ├── state.js            # Simple state management
│   ├── router.js           # Client-side routing
│   ├── components/
│   │   ├── entity-list.js      # Entity table component
│   │   ├── entity-editor.js    # Dynamic entity form
│   │   ├── metadata-modal.js   # Metadata editor
│   │   ├── timeline-view.js    # D3.js timeline
│   │   ├── knowledge-editor.js # Epistemic state editor
│   │   ├── fiction-manager.js  # Fiction CRUD
│   │   └── validation-panel.js # Real-time validation
│   ├── screens/
│   │   ├── dashboard.js        # Project dashboard
│   │   ├── entities.js         # Entity list screen
│   │   ├── timeline.js         # Timeline visualization
│   │   └── narrative.js        # Book structure editor
│   └── utils/
│       ├── validators.js       # Form validation
│       ├── formatters.js       # Date/ID formatting
│       ├── toast.js            # Notifications
│       └── shortcuts.js        # Keyboard shortcuts
├── lib/
│   ├── d3.min.js          # Timeline visualization
│   ├── vis.min.js         # Network graphs
│   └── simplemde.min.js   # Markdown editor
├── assets/
│   ├── icons/             # SVG icons
│   └── fonts/             # Inter font
└── USER_GUIDE.md          # How to use GUI
```

---

## Files to Create (in order)

### 1. Design System (`/app/gui/styles/design-system.css`)

Complete CSS custom properties and base styles:

```css
/* ============================================================
   TRIPLETHINK DESIGN SYSTEM
   Color palette, typography, spacing, shadows
   ============================================================ */

:root {
  /* Colors - Primary */
  --color-primary-50: #EEF2FF;
  --color-primary-100: #E0E7FF;
  --color-primary-500: #6366F1;  /* Main primary */
  --color-primary-600: #4F46E5;
  --color-primary-700: #4338CA;

  /* Colors - Semantic */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --color-info: #3B82F6;

  /* Colors - Neutral */
  --color-gray-50: #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-200: #E5E7EB;
  --color-gray-300: #D1D5DB;
  --color-gray-500: #6B7280;
  --color-gray-700: #374151;
  --color-gray-800: #1F2937;
  --color-gray-900: #111827;

  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;

  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;

  /* Spacing */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-base: 250ms ease-in-out;
  --transition-slow: 350ms ease-in-out;

  /* Z-index */
  --z-dropdown: 1000;
  --z-modal: 2000;
  --z-toast: 3000;
}

/* ============================================================
   RESET & BASE
   ============================================================ */

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  color: var(--color-gray-800);
  background-color: var(--color-gray-50);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ============================================================
   TYPOGRAPHY
   ============================================================ */

h1, h2, h3, h4, h5, h6 {
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  color: var(--color-gray-900);
}

h1 { font-size: var(--font-size-2xl); margin-bottom: var(--space-4); }
h2 { font-size: var(--font-size-xl); margin-bottom: var(--space-3); }
h3 { font-size: var(--font-size-lg); margin-bottom: var(--space-3); }

p {
  margin-bottom: var(--space-4);
}

code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background-color: var(--color-gray-100);
  padding: 0.2em 0.4em;
  border-radius: var(--radius-sm);
}

/* ============================================================
   UTILITY CLASSES
   ============================================================ */

/* Text colors */
.text-primary { color: var(--color-primary-600); }
.text-success { color: var(--color-success); }
.text-warning { color: var(--color-warning); }
.text-danger { color: var(--color-danger); }
.text-gray { color: var(--color-gray-500); }

/* Font weights */
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }

/* Spacing */
.mt-1 { margin-top: var(--space-1); }
.mt-2 { margin-top: var(--space-2); }
.mt-4 { margin-top: var(--space-4); }
.mb-4 { margin-bottom: var(--space-4); }
.ml-2 { margin-left: var(--space-2); }
.mr-2 { margin-right: var(--space-2); }

/* Display */
.hidden { display: none; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }

/* Flexbox */
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-2 { gap: var(--space-2); }
.gap-4 { gap: var(--space-4); }
```

---

### 2. Layout Styles (`/app/gui/styles/layout.css`)

Page structure, grid, navigation:

```css
/* ============================================================
   LAYOUT SYSTEM
   ============================================================ */

.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ============================================================
   SIDEBAR NAVIGATION
   ============================================================ */

.sidebar {
  width: 240px;
  background-color: white;
  border-right: 1px solid var(--color-gray-200);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-gray-200);
}

.sidebar-header h1 {
  font-size: var(--font-size-lg);
  margin: 0;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
}

.nav-item {
  display: flex;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-gray-700);
  text-decoration: none;
  transition: background-color var(--transition-fast);
  cursor: pointer;
  margin-bottom: var(--space-1);
}

.nav-item:hover {
  background-color: var(--color-gray-100);
}

.nav-item.active {
  background-color: var(--color-primary-50);
  color: var(--color-primary-600);
  font-weight: var(--font-weight-medium);
}

.nav-item-icon {
  width: 20px;
  height: 20px;
  margin-right: var(--space-2);
}

/* ============================================================
   MAIN CONTENT AREA
   ============================================================ */

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  background-color: white;
  border-bottom: 1px solid var(--color-gray-200);
  padding: var(--space-4) var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.content-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6);
}

/* ============================================================
   GRID LAYOUTS
   ============================================================ */

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

/* ============================================================
   CARDS
   ============================================================ */

.card {
  background-color: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-4);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.card-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}
```

---

### 3. Component Styles (`/app/gui/styles/components.css`)

Buttons, forms, modals, tables:

```css
/* ============================================================
   BUTTONS
   ============================================================ */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--color-primary-600);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-700);
}

.btn-secondary {
  background-color: white;
  color: var(--color-gray-700);
  border: 1px solid var(--color-gray-300);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-gray-50);
}

.btn-danger {
  background-color: var(--color-danger);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #DC2626;
}

.btn-sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
}

.btn-icon {
  padding: var(--space-2);
  width: 36px;
  height: 36px;
}

/* ============================================================
   FORM ELEMENTS
   ============================================================ */

.form-group {
  margin-bottom: var(--space-4);
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-700);
  margin-bottom: var(--space-2);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  background-color: white;
  transition: border-color var(--transition-fast);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-50);
}

.form-input.error {
  border-color: var(--color-danger);
}

.form-error {
  color: var(--color-danger);
  font-size: var(--font-size-xs);
  margin-top: var(--space-1);
}

.form-help {
  color: var(--color-gray-500);
  font-size: var(--font-size-xs);
  margin-top: var(--space-1);
}

.form-checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.form-checkbox input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* ============================================================
   TABS
   ============================================================ */

.tabs {
  border-bottom: 1px solid var(--color-gray-200);
  margin-bottom: var(--space-6);
}

.tab-list {
  display: flex;
  gap: var(--space-2);
  list-style: none;
}

.tab-button {
  padding: var(--space-3) var(--space-4);
  border: none;
  background: none;
  color: var(--color-gray-600);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all var(--transition-fast);
}

.tab-button:hover {
  color: var(--color-gray-900);
}

.tab-button.active {
  color: var(--color-primary-600);
  border-bottom-color: var(--color-primary-600);
}

.tab-content {
  display: none;
}

.tab-content.active {
  display: block;
}

/* ============================================================
   MODALS
   ============================================================ */

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
}

.modal-overlay.hidden {
  display: none;
}

.modal-content {
  background-color: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: var(--space-6);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}

.modal-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  color: var(--color-gray-400);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.modal-close:hover {
  background-color: var(--color-gray-100);
  color: var(--color-gray-600);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-gray-200);
}

/* ============================================================
   TABLES
   ============================================================ */

.table-container {
  overflow-x: auto;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-gray-200);
}

.table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
}

.table thead {
  background-color: var(--color-gray-50);
}

.table th {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-700);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-gray-200);
}

.table td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-gray-200);
  font-size: var(--font-size-sm);
}

.table tbody tr:hover {
  background-color: var(--color-gray-50);
  cursor: pointer;
}

.table tbody tr:last-child td {
  border-bottom: none;
}

/* ============================================================
   BADGES
   ============================================================ */

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-full);
}

.badge-primary {
  background-color: var(--color-primary-100);
  color: var(--color-primary-700);
}

.badge-success {
  background-color: #D1FAE5;
  color: #065F46;
}

.badge-warning {
  background-color: #FEF3C7;
  color: #92400E;
}

.badge-danger {
  background-color: #FEE2E2;
  color: #991B1B;
}

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */

.toast-container {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.toast {
  min-width: 300px;
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-success {
  background-color: var(--color-success);
  color: white;
}

.toast-error {
  background-color: var(--color-danger);
  color: white;
}

.toast-warning {
  background-color: var(--color-warning);
  color: white;
}

.toast-info {
  background-color: var(--color-info);
  color: white;
}
```

---

### 4. Main HTML (`/app/gui/index.html`)

Complete application structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TripleThink - Narrative Construction System</title>

  <!-- Styles -->
  <link rel="stylesheet" href="styles/design-system.css">
  <link rel="stylesheet" href="styles/layout.css">
  <link rel="stylesheet" href="styles/components.css">
  <link rel="stylesheet" href="styles/screens.css">
  <link rel="stylesheet" href="styles/visualizations.css">

  <!-- External libraries -->
  <script src="lib/d3.min.js" defer></script>
  <script src="lib/vis.min.js" defer></script>

  <!-- Application scripts -->
  <script src="js/utils/validators.js" defer></script>
  <script src="js/utils/formatters.js" defer></script>
  <script src="js/utils/toast.js" defer></script>
  <script src="js/utils/shortcuts.js" defer></script>
  <script src="js/api-client.js" defer></script>
  <script src="js/state.js" defer></script>
  <script src="js/router.js" defer></script>
  <script src="js/components/entity-list.js" defer></script>
  <script src="js/components/entity-editor.js" defer></script>
  <script src="js/components/metadata-modal.js" defer></script>
  <script src="js/components/timeline-view.js" defer></script>
  <script src="js/components/knowledge-editor.js" defer></script>
  <script src="js/components/fiction-manager.js" defer></script>
  <script src="js/components/validation-panel.js" defer></script>
  <script src="js/screens/dashboard.js" defer></script>
  <script src="js/screens/entities.js" defer></script>
  <script src="js/screens/timeline.js" defer></script>
  <script src="js/screens/narrative.js" defer></script>
  <script src="js/app.js" defer></script>
</head>
<body>
  <!-- Toast Container -->
  <div class="toast-container" id="toast-container"></div>

  <!-- Main App Container -->
  <div class="app-container">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1>TripleThink</h1>
        <p class="text-gray" style="font-size: var(--font-size-xs); margin: 0;">Narrative Construction</p>
      </div>

      <nav class="sidebar-nav">
        <a href="#dashboard" class="nav-item active" data-route="dashboard">
          <span class="nav-item-icon">📊</span>
          Dashboard
        </a>
        <a href="#timeline" class="nav-item" data-route="timeline">
          <span class="nav-item-icon">⏱️</span>
          Timeline
        </a>
        <a href="#entities" class="nav-item" data-route="entities">
          <span class="nav-item-icon">📦</span>
          Entities
        </a>
        <a href="#characters" class="nav-item" data-route="characters">
          <span class="nav-item-icon">👤</span>
          Characters
        </a>
        <a href="#fictions" class="nav-item" data-route="fictions">
          <span class="nav-item-icon">🎭</span>
          Fictions
        </a>
        <a href="#narrative" class="nav-item" data-route="narrative">
          <span class="nav-item-icon">📖</span>
          Narrative Structure
        </a>
        <a href="#validation" class="nav-item" data-route="validation">
          <span class="nav-item-icon">✓</span>
          Validation
        </a>
      </nav>

      <div style="padding: var(--space-4); border-top: 1px solid var(--color-gray-200);">
        <button class="btn btn-secondary" style="width: 100%;" id="export-btn">
          Export Project
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="main-content">
      <header class="content-header">
        <div>
          <h1 id="screen-title">Dashboard</h1>
          <p class="text-gray" id="screen-subtitle">Project Overview</p>
        </div>
        <div class="flex items-center gap-4">
          <button class="btn btn-secondary btn-sm" id="search-btn">
            <span>Search</span>
            <kbd>/</kbd>
          </button>
          <button class="btn btn-primary" id="new-entity-btn">
            + New Entity
          </button>
        </div>
      </header>

      <div class="content-body" id="screen-container">
        <!-- Dynamic content loaded here -->
      </div>
    </main>
  </div>

  <!-- Entity Editor Modal -->
  <div class="modal-overlay hidden" id="entity-modal">
    <div class="modal-content" style="max-width: 900px;">
      <div class="modal-header">
        <h2 class="modal-title" id="entity-modal-title">New Entity</h2>
        <button class="modal-close" id="entity-modal-close">&times;</button>
      </div>
      <div id="entity-modal-body">
        <!-- Entity form loaded dynamically -->
      </div>
    </div>
  </div>

  <!-- Metadata Editor Modal -->
  <div class="modal-overlay hidden" id="metadata-modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Metadata Editor</h2>
        <button class="modal-close" id="metadata-modal-close">&times;</button>
      </div>
      <div id="metadata-modal-body">
        <!-- Metadata form loaded dynamically -->
      </div>
    </div>
  </div>

  <!-- Knowledge Editor Modal -->
  <div class="modal-overlay hidden" id="knowledge-modal">
    <div class="modal-content" style="max-width: 1000px;">
      <div class="modal-header">
        <h2 class="modal-title">Knowledge State Editor</h2>
        <button class="modal-close" id="knowledge-modal-close">&times;</button>
      </div>
      <div id="knowledge-modal-body">
        <!-- Knowledge editor loaded dynamically -->
      </div>
    </div>
  </div>
</body>
</html>
```

---

### 5. API Client (`/app/gui/js/api-client.js`)

Fetch wrapper for all API calls:

```javascript
/**
 * API Client for TripleThink REST API
 * Handles all HTTP requests with error handling
 */

const API_BASE = 'http://localhost:3000/api';

class APIClient {
  constructor(baseURL = API_BASE) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error: ${endpoint}`, error);
      throw error;
    }
  }

  // Entity operations
  async getEntity(id, options = {}) {
    const params = new URLSearchParams(options);
    return this.request(`/entities/${id}?${params}`);
  }

  async listEntities(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/entities?${params}`);
  }

  async createEntity(type, data) {
    return this.request('/entities', {
      method: 'POST',
      body: JSON.stringify({ type, ...data }),
    });
  }

  async updateEntity(id, data) {
    return this.request(`/entities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEntity(id) {
    return this.request(`/entities/${id}`, {
      method: 'DELETE',
    });
  }

  // Metadata operations
  async getMetadata(id) {
    return this.request(`/metadata/${id}`);
  }

  async saveMetadata(data) {
    return this.request('/metadata', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Epistemic queries
  async getCharacterKnowledge(characterId, timestamp) {
    return this.request(
      `/epistemic/character/${characterId}/knowledge?at_timestamp=${timestamp}`
    );
  }

  async getFactBelievers(factId, timestamp) {
    return this.request(
      `/epistemic/fact/${factId}/believers?at_timestamp=${timestamp}`
    );
  }

  async validateScene(sceneData) {
    return this.request('/epistemic/validate-scene', {
      method: 'POST',
      body: JSON.stringify(sceneData),
    });
  }

  // Timeline operations
  async getEventsInRange(startDate, endDate) {
    return this.request(`/temporal/events?from=${startDate}&to=${endDate}`);
  }

  async getEntityStates(entityId, startDate, endDate) {
    return this.request(
      `/temporal/entity/${entityId}/states?from=${startDate}&to=${endDate}`
    );
  }

  // Export/Import
  async exportProject(format = 'json') {
    return this.request(`/export/project?format=${format}`);
  }

  async importProject(data, format = 'json') {
    return this.request('/import/project', {
      method: 'POST',
      body: JSON.stringify({ format, data }),
    });
  }

  // Search
  async search(query, filters = {}) {
    const params = new URLSearchParams({ q: query, ...filters });
    return this.request(`/search?${params}`);
  }
}

// Global instance
const api = new APIClient();
```

---

### 6. State Management (`/app/gui/js/state.js`)

Simple reactive state:

```javascript
/**
 * Simple State Management
 * Reactive state with change listeners
 */

class State {
  constructor(initialState = {}) {
    this._state = initialState;
    this._listeners = new Map();
  }

  get(key) {
    return this._state[key];
  }

  set(key, value) {
    const oldValue = this._state[key];
    this._state[key] = value;

    // Notify listeners
    if (this._listeners.has(key)) {
      this._listeners.get(key).forEach(callback => {
        callback(value, oldValue);
      });
    }
  }

  update(updates) {
    Object.keys(updates).forEach(key => {
      this.set(key, updates[key]);
    });
  }

  subscribe(key, callback) {
    if (!this._listeners.has(key)) {
      this._listeners.set(key, []);
    }
    this._listeners.get(key).push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this._listeners.get(key);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  getAll() {
    return { ...this._state };
  }
}

// Global state
const state = new State({
  currentRoute: 'dashboard',
  selectedEntity: null,
  entities: [],
  loading: false,
  project: null,
});
```

---

### 7. Router (`/app/gui/js/router.js`)

Client-side routing:

```javascript
/**
 * Simple Client-Side Router
 * Handles navigation without page reloads
 */

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;

    window.addEventListener('hashchange', () => this.handleRouteChange());
    window.addEventListener('load', () => this.handleRouteChange());
  }

  register(path, handler) {
    this.routes.set(path, handler);
  }

  navigate(path) {
    window.location.hash = path;
  }

  handleRouteChange() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    const route = hash.split('/')[0];

    if (this.routes.has(route)) {
      this.currentRoute = route;
      state.set('currentRoute', route);

      // Update navigation
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.route === route) {
          item.classList.add('active');
        }
      });

      // Call route handler
      this.routes.get(route)();
    } else {
      console.warn(`Route not found: ${route}`);
      this.navigate('dashboard');
    }
  }
}

const router = new Router();
```

---

### 8. Toast Notifications (`/app/gui/js/utils/toast.js`)

```javascript
/**
 * Toast Notification System
 */

class Toast {
  constructor() {
    this.container = document.getElementById('toast-container');
  }

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        this.container.removeChild(toast);
      }, 300);
    }, duration);
  }

  success(message) {
    this.show(message, 'success');
  }

  error(message) {
    this.show(message, 'error');
  }

  warning(message) {
    this.show(message, 'warning');
  }

  info(message) {
    this.show(message, 'info');
  }
}

const toast = new Toast();
```

---

### 9. Validators (`/app/gui/js/utils/validators.js`)

```javascript
/**
 * Form Validation Utilities
 */

const validators = {
  // Validate ID format
  entityId(value, type) {
    const prefixes = {
      event: 'evt-',
      character: 'char-',
      object: 'obj-',
      location: 'loc-',
      fiction: 'fiction-',
      system: 'sys-',
    };

    const prefix = prefixes[type];
    if (!prefix) return { valid: false, message: 'Invalid entity type' };

    if (!value.startsWith(prefix)) {
      return {
        valid: false,
        message: `ID must start with '${prefix}'`,
      };
    }

    if (!/^[a-z0-9-]+$/.test(value)) {
      return {
        valid: false,
        message: 'ID can only contain lowercase letters, numbers, and hyphens',
      };
    }

    return { valid: true };
  },

  // Validate ISO 8601 timestamp
  timestamp(value) {
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3})?Z?$/;

    if (!iso8601Regex.test(value)) {
      return {
        valid: false,
        message: 'Must be ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)',
      };
    }

    return { valid: true };
  },

  // Validate required field
  required(value, fieldName) {
    if (!value || value.trim() === '') {
      return {
        valid: false,
        message: `${fieldName} is required`,
      };
    }

    return { valid: true };
  },

  // Validate reference exists
  async entityExists(entityId) {
    try {
      await api.getEntity(entityId);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: `Entity '${entityId}' not found`,
      };
    }
  },
};
```

---

### 10. Dashboard Screen (`/app/gui/js/screens/dashboard.js`)

```javascript
/**
 * Dashboard Screen
 * Project overview with stats
 */

async function renderDashboard() {
  const container = document.getElementById('screen-container');

  document.getElementById('screen-title').textContent = 'Dashboard';
  document.getElementById('screen-subtitle').textContent = 'Project Overview';

  state.set('loading', true);

  try {
    // Fetch project data
    const project = await api.request('/status');
    state.set('project', project);

    container.innerHTML = `
      <div class="grid-3">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Events</h3>
          </div>
          <div style="font-size: 2rem; font-weight: bold; color: var(--color-primary-600);">
            ${project.stats?.events || 0}
          </div>
          <p class="text-gray" style="margin: 0;">World events tracked</p>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Characters</h3>
          </div>
          <div style="font-size: 2rem; font-weight: bold; color: var(--color-success);">
            ${project.stats?.characters || 0}
          </div>
          <p class="text-gray" style="margin: 0;">Characters defined</p>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Fictions</h3>
          </div>
          <div style="font-size: 2rem; font-weight: bold; color: var(--color-warning);">
            ${project.stats?.fictions || 0}
          </div>
          <p class="text-gray" style="margin: 0;">Active narrative systems</p>
        </div>
      </div>

      <div class="card" style="margin-top: var(--space-6);">
        <div class="card-header">
          <h3 class="card-title">Quick Actions</h3>
        </div>
        <div class="flex gap-4">
          <button class="btn btn-primary" onclick="showNewEntityModal('event')">
            + New Event
          </button>
          <button class="btn btn-primary" onclick="showNewEntityModal('character')">
            + New Character
          </button>
          <button class="btn btn-primary" onclick="showNewEntityModal('fiction')">
            + New Fiction
          </button>
          <button class="btn btn-secondary" onclick="router.navigate('timeline')">
            View Timeline
          </button>
        </div>
      </div>

      <div class="card" style="margin-top: var(--space-6);">
        <div class="card-header">
          <h3 class="card-title">Recent Activity</h3>
        </div>
        <div id="recent-activity">
          <p class="text-gray">Loading recent changes...</p>
        </div>
      </div>
    `;

    state.set('loading', false);
  } catch (error) {
    console.error('Dashboard error:', error);
    toast.error('Failed to load dashboard');
    state.set('loading', false);
  }
}

router.register('dashboard', renderDashboard);
```

---

### 11. Entity List Screen (`/app/gui/js/screens/entities.js`)

```javascript
/**
 * Entity List Screen
 * Searchable, filterable table of all entities
 */

async function renderEntities() {
  const container = document.getElementById('screen-container');

  document.getElementById('screen-title').textContent = 'Entities';
  document.getElementById('screen-subtitle').textContent = 'All Events, Characters, Objects';

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="form-group" style="margin: 0; flex: 1;">
          <input
            type="text"
            class="form-input"
            id="entity-search"
            placeholder="Search entities..."
          />
        </div>
        <div class="flex gap-2">
          <select class="form-select" id="entity-type-filter">
            <option value="">All Types</option>
            <option value="event">Events</option>
            <option value="character">Characters</option>
            <option value="object">Objects</option>
            <option value="location">Locations</option>
            <option value="fiction">Fictions</option>
            <option value="system">Systems</option>
          </select>
          <button class="btn btn-primary" onclick="showNewEntityModal()">
            + New
          </button>
        </div>
      </div>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Timestamp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="entity-table-body">
            <tr>
              <td colspan="5" style="text-align: center;">Loading...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Load entities
  loadEntities();

  // Setup filters
  document.getElementById('entity-search').addEventListener('input', filterEntities);
  document.getElementById('entity-type-filter').addEventListener('change', filterEntities);
}

async function loadEntities(filters = {}) {
  try {
    const entities = await api.listEntities(filters);
    state.set('entities', entities);
    renderEntityTable(entities);
  } catch (error) {
    console.error('Failed to load entities:', error);
    toast.error('Failed to load entities');
  }
}

function renderEntityTable(entities) {
  const tbody = document.getElementById('entity-table-body');

  if (entities.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: var(--space-8);">
          No entities found
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = entities.map(entity => `
    <tr onclick="editEntity('${entity.id}')">
      <td><code>${entity.id}</code></td>
      <td>${entity.name}</td>
      <td>
        <span class="badge badge-primary">${entity.entity_type}</span>
      </td>
      <td>${entity.timestamp || '-'}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); editEntity('${entity.id}')">
          Edit
        </button>
        <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteEntity('${entity.id}')">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

function filterEntities() {
  const search = document.getElementById('entity-search').value.toLowerCase();
  const type = document.getElementById('entity-type-filter').value;

  const filtered = state.get('entities').filter(entity => {
    const matchesSearch = entity.name.toLowerCase().includes(search) ||
                         entity.id.toLowerCase().includes(search);
    const matchesType = !type || entity.entity_type === type;
    return matchesSearch && matchesType;
  });

  renderEntityTable(filtered);
}

async function deleteEntity(id) {
  if (!confirm(`Delete entity ${id}?`)) return;

  try {
    await api.deleteEntity(id);
    toast.success('Entity deleted');
    loadEntities();
  } catch (error) {
    console.error('Delete failed:', error);
    toast.error('Failed to delete entity');
  }
}

router.register('entities', renderEntities);
router.register('characters', () => renderEntities({ type: 'character' }));
router.register('fictions', () => renderEntities({ type: 'fiction' }));
```

---

### 12. Entity Editor Component (`/app/gui/js/components/entity-editor.js`)

```javascript
/**
 * Entity Editor Component
 * Dynamic form based on entity type
 */

function showNewEntityModal(type = 'event') {
  state.set('selectedEntity', null);
  showEntityEditor(type, null);
}

async function editEntity(id) {
  try {
    const entity = await api.getEntity(id, { include_metadata: 'auto' });
    state.set('selectedEntity', entity);
    showEntityEditor(entity.entity_type, entity);
  } catch (error) {
    console.error('Failed to load entity:', error);
    toast.error('Failed to load entity');
  }
}

function showEntityEditor(type, entityData) {
  const modal = document.getElementById('entity-modal');
  const title = document.getElementById('entity-modal-title');
  const body = document.getElementById('entity-modal-body');

  title.textContent = entityData ? `Edit ${type}` : `New ${type}`;

  // Render form based on type
  body.innerHTML = renderEntityForm(type, entityData);

  // Show modal
  modal.classList.remove('hidden');

  // Setup form handlers
  setupEntityFormHandlers(type, entityData);
}

function renderEntityForm(type, data) {
  if (type === 'event') {
    return renderEventForm(data);
  } else if (type === 'character') {
    return renderCharacterForm(data);
  } else if (type === 'fiction') {
    return renderFictionForm(data);
  } else {
    return renderGenericForm(type, data);
  }
}

function renderEventForm(data) {
  return `
    <form id="entity-form">
      <div class="tabs">
        <ul class="tab-list">
          <li><button type="button" class="tab-button active" data-tab="basic">Basic Info</button></li>
          <li><button type="button" class="tab-button" data-tab="phases">Phases</button></li>
          <li><button type="button" class="tab-button" data-tab="facts">Facts</button></li>
          <li><button type="button" class="tab-button" data-tab="participants">Participants</button></li>
        </ul>
      </div>

      <div class="tab-content active" id="tab-basic">
        <div class="form-group">
          <label class="form-label">Event ID</label>
          <input type="text" class="form-input" name="id" value="${data?.id || 'evt-'}" required>
          <div class="form-help">Must start with 'evt-'</div>
        </div>

        <div class="form-group">
          <label class="form-label">Timestamp</label>
          <input type="datetime-local" class="form-input" name="timestamp" value="${data?.timestamp || ''}" required>
        </div>

        <div class="form-group">
          <label class="form-label">Type</label>
          <select class="form-select" name="type">
            <option>information_transfer</option>
            <option>deception_event</option>
            <option>complex_multi_phase</option>
            <option>state_change</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Summary</label>
          <textarea class="form-textarea" name="summary" rows="3">${data?.summary || ''}</textarea>
        </div>
      </div>

      <div class="tab-content" id="tab-phases">
        <div id="phases-container">
          <button type="button" class="btn btn-secondary" id="add-phase-btn">+ Add Phase</button>
        </div>
      </div>

      <div class="tab-content" id="tab-facts">
        <div id="facts-container">
          <button type="button" class="btn btn-secondary" id="add-fact-btn">+ Add Fact</button>
        </div>
      </div>

      <div class="tab-content" id="tab-participants">
        <div id="participants-container">
          <button type="button" class="btn btn-secondary" id="add-participant-btn">+ Add Participant</button>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeEntityModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Event</button>
      </div>
    </form>
  `;
}

function renderCharacterForm(data) {
  return `
    <form id="entity-form">
      <div class="form-group">
        <label class="form-label">Character ID</label>
        <input type="text" class="form-input" name="id" value="${data?.id || 'char-'}" required>
      </div>

      <div class="form-group">
        <label class="form-label">Name</label>
        <input type="text" class="form-input" name="name" value="${data?.name || ''}" required>
      </div>

      <div class="form-group">
        <label class="form-label">Role</label>
        <select class="form-select" name="role">
          <option>protagonist</option>
          <option>antagonist</option>
          <option>supporting</option>
        </select>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeEntityModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Character</button>
      </div>
    </form>
  `;
}

function setupEntityFormHandlers(type, data) {
  // Tab switching
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });

  // Form submission
  document.getElementById('entity-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveEntity(type, e.target);
  });
}

async function saveEntity(type, form) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  try {
    if (state.get('selectedEntity')) {
      await api.updateEntity(data.id, data);
      toast.success('Entity updated');
    } else {
      await api.createEntity(type, data);
      toast.success('Entity created');
    }

    closeEntityModal();
    loadEntities();
  } catch (error) {
    console.error('Save failed:', error);
    toast.error('Failed to save entity');
  }
}

function closeEntityModal() {
  document.getElementById('entity-modal').classList.add('hidden');
}

// Modal close handlers
document.getElementById('entity-modal-close').addEventListener('click', closeEntityModal);
```

---

### 13. Main Application (`/app/gui/js/app.js`)

```javascript
/**
 * Main Application Entry Point
 * Initializes all components and routing
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('TripleThink GUI initialized');

  // Setup global event listeners
  setupGlobalListeners();

  // Initialize router
  router.handleRouteChange();

  // Check API connection
  checkAPIConnection();
});

function setupGlobalListeners() {
  // New entity button
  document.getElementById('new-entity-btn').addEventListener('click', () => {
    showNewEntityModal('event');
  });

  // Export button
  document.getElementById('export-btn').addEventListener('click', async () => {
    try {
      const data = await api.exportProject();
      downloadJSON(data, 'triplethink-export.json');
      toast.success('Project exported');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed');
    }
  });

  // Modal overlays close on click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.add('hidden');
      }
    });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl+N: New entity
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      showNewEntityModal();
    }

    // Escape: Close modals
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    }

    // /: Focus search
    if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
      const searchInput = document.getElementById('entity-search');
      if (searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
    }
  });
}

async function checkAPIConnection() {
  try {
    const status = await api.request('/health');
    console.log('API connected:', status);
  } catch (error) {
    console.error('API connection failed:', error);
    toast.error('Cannot connect to API server. Please start the server.');
  }
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## Execution Checklist

When implementing this plan:

1. [ ] Create `/app/gui/` directory structure
2. [ ] Create CSS files:
   - [ ] `styles/design-system.css`
   - [ ] `styles/layout.css`
   - [ ] `styles/components.css`
   - [ ] `styles/screens.css` (empty, for custom screen styles)
   - [ ] `styles/visualizations.css` (empty, for D3/vis.js styles)
3. [ ] Create main `index.html`
4. [ ] Create JavaScript utilities:
   - [ ] `js/utils/validators.js`
   - [ ] `js/utils/formatters.js`
   - [ ] `js/utils/toast.js`
   - [ ] `js/utils/shortcuts.js` (can be empty if shortcuts in app.js)
5. [ ] Create core JS files:
   - [ ] `js/api-client.js`
   - [ ] `js/state.js`
   - [ ] `js/router.js`
6. [ ] Create components:
   - [ ] `js/components/entity-list.js`
   - [ ] `js/components/entity-editor.js`
   - [ ] `js/components/metadata-modal.js`
   - [ ] `js/components/timeline-view.js` (placeholder with D3)
   - [ ] `js/components/knowledge-editor.js` (placeholder)
   - [ ] `js/components/fiction-manager.js` (placeholder)
   - [ ] `js/components/validation-panel.js` (placeholder)
7. [ ] Create screens:
   - [ ] `js/screens/dashboard.js`
   - [ ] `js/screens/entities.js`
   - [ ] `js/screens/timeline.js` (placeholder)
   - [ ] `js/screens/narrative.js` (placeholder)
8. [ ] Create main `js/app.js`
9. [ ] Download external libraries to `lib/`:
   - [ ] `d3.min.js` (from https://d3js.org)
   - [ ] `vis.min.js` (from https://visjs.org) - optional
10. [ ] Create `USER_GUIDE.md`

---

## Verification Steps

After implementation:

1. **Open in Browser**
   ```bash
   # Simply open index.html in browser
   open /app/gui/index.html
   # Or serve with Python
   cd /app/gui
   python3 -m http.server 8080
   ```

2. **Check API Connection**
   - Start API server: `cd /app/api && npm start`
   - Verify GUI can connect to http://localhost:3000

3. **Test Core Functions**
   - Navigate between screens (Dashboard, Entities, Timeline)
   - Create a new event
   - Edit an existing entity
   - Search and filter entities
   - Export project

4. **Test Modals**
   - Entity editor opens/closes
   - Form validation works
   - Toast notifications appear

---

## Notes for Haiku

**Simplified vs Full Implementation**:

This plan provides a **minimal viable GUI** with:
- ✅ Core screens (dashboard, entities list)
- ✅ Entity CRUD operations
- ✅ Modal forms
- ✅ API integration
- ✅ Routing and state management
- ⚠️ Basic timeline (placeholder for D3 visualization)
- ⚠️ Basic knowledge editor (placeholder for complex UI)
- ⚠️ Basic fiction manager (placeholder)

**What's Simplified**:
- Timeline uses simple list instead of D3 visualization
- Knowledge editor is basic form instead of visual timeline
- Fiction manager is table instead of graph visualization
- No WebSocket real-time updates (not critical for MVP)

**To Create Full Implementation**:
You would need to add:
1. D3.js timeline visualization with zoom/pan
2. vis.js relationship graphs
3. Complex knowledge state timeline editor
4. Narrative structure tree view with drag-drop
5. Real-time validation panel

**For MVP, the simplified version is sufficient and functional.**

---

## User Guide Outline

Create `/app/gui/USER_GUIDE.md`:

```markdown
# TripleThink GUI User Guide

## Getting Started

1. Start the API server:
   ```bash
   cd /app/api
   npm start
   ```

2. Open GUI:
   ```bash
   open /app/gui/index.html
   ```

## Navigation

- **Dashboard**: Project overview with quick stats
- **Timeline**: Visual timeline of all events
- **Entities**: List and manage all entities
- **Characters**: Filter to characters only
- **Fictions**: Manage false narrative systems
- **Narrative Structure**: Organize books/chapters/scenes
- **Validation**: Check consistency

## Creating Entities

1. Click "+ New Entity" or "+ New Event/Character"
2. Fill in required fields (ID must match type prefix)
3. Add phases, facts, participants as needed
4. Click "Save"

## Keyboard Shortcuts

- `Ctrl+N`: New entity
- `Ctrl+S`: Save current form
- `/`: Focus search
- `Esc`: Close modal

## Tips

- IDs must start with correct prefix (evt-, char-, fiction-, etc.)
- Timestamps must be ISO 8601 format
- Metadata is optional but recommended for complex entities
- Use Fiction Manager to enforce audience constraints
```
