# Narrative Editing Guide

**Component:** narrative-tree-editor.js
**Feature:** Drag-and-Drop Chapter/Scene Reordering
**Phase:** 10 - Advanced Narrative Management

---

## Introduction

The Narrative Tree Editor is a visual, hierarchical editor for managing chapter and scene structure. It provides drag-and-drop reordering, split/merge operations for chapters, and rename/delete actions for both chapters and scenes.

**What it does:**
- Display chapter hierarchy with nested scenes
- Drag scenes to reorder within or across chapters
- Split chapters into two at any scene
- Merge adjacent chapters
- Rename and delete scenes (chapter operations have limitations)

**When to use:**
- Restructuring narrative flow during outlining
- Reordering scenes after drafting
- Splitting overly long chapters
- Merging short chapters into cohesive units
- Managing "unassigned" scenes before chapter assignment

**When NOT to use:**
- Fine-grained scene content editing (use Scene Editor instead)
- Character or plot logic editing (use Story Logic screens)
- Timeline management (use Narrative Timeline screen)

---

## Workflow Overview

The narrative tree editor follows this pattern:

1. **Load Tree:** Fetch all scenes for fiction, group by chapter
2. **Display Hierarchy:** Render chapters with nested scenes
3. **Drag Scene:** Click and drag scene to new position
4. **Drop Scene:** Release on target (scene or chapter)
5. **Auto-Renumber:** System renumbers scenes sequentially
6. **Persist Changes:** Changes saved immediately via API

---

## Reordering Workflow

### How Drag-and-Drop Works

The component uses **HTML5 Drag and Drop API** for native browser support:

- **dragstart** event: Stores dragged node ID and type
- **dragover** event: Prevents default to allow drop, shows visual feedback
- **dragleave** event: Removes visual feedback
- **drop** event: Handles the drop, updates database
- **dragend** event: Cleanup (remove classes, reset state)

### Visual Feedback During Drag

**While dragging:**
- Dragged element: `.dragging` class (semi-transparent)
- Valid drop targets: `.drop-target` class (highlighted border)
- Invalid targets: No highlight (e.g., can't drop chapter on scene)

**After drop:**
- Loading state (brief)
- Tree refreshes with new order
- Scenes renumbered sequentially within chapters

### Scene-to-Scene Drop

**Scenario:** Drag Scene 3 onto Scene 5 (same chapter)

**What happens:**
1. Scene 3 removed from position 3
2. Scene 3 inserted at position 5
3. All scenes renumbered: [1, 2, 4, 5 (was 3), 6...]
4. API call: `api.updateSceneSequence(sceneId, { chapterId, sceneNumber })`
5. API call: `api.batchUpdateScenes(updatedScenes)` for renumbering

**Scenario:** Drag Scene 3 (Chapter 1) onto Scene 2 (Chapter 2)

**What happens:**
1. Scene 3 removed from Chapter 1
2. Scene 3 inserted at Chapter 2, position 2
3. Chapter 1 scenes renumbered: [1, 2, 4→3, 5→4, ...]
4. Chapter 2 scenes renumbered: [1, 3→2 (dragged), 2→3, ...]
5. Both chapters updated via batch API

### Scene-to-Chapter Drop

**Scenario:** Drag Scene 5 (Chapter 1) onto Chapter 3 header

**What happens:**
1. Scene 5 removed from Chapter 1
2. Scene 5 moved to end of Chapter 3 (becomes last scene)
3. Chapter 1 renumbered: [1, 2, 3, 4, 6→5, ...]
4. Chapter 3 renumbered: [..., N, N+1 (dragged)]

**Use case:** Quickly move scene to different chapter without precise positioning

### Chapters vs Scenes

**Draggable:**
- Scenes: Always draggable
- Chapters: Draggable (except "Unassigned Scenes")

**Current implementation:**
- Chapter-to-chapter reordering: Not yet implemented (logs "not yet implemented")
- Scene reordering: Fully functional

**"Unassigned Scenes" chapter:**
- Not draggable (`draggable="false"`)
- No action buttons (can't split/merge/delete)
- Scenes within are draggable (can be moved to named chapters)
- Acts as holding area for scenes without chapter assignment

---

## Split Chapter Operation

### What Split Does

Splits a single chapter into two chapters at a specified scene number.

**Example:**

**Before:**
```
Chapter 3 (8 scenes)
  - Scene 1
  - Scene 2
  - Scene 3
  - Scene 4
  - Scene 5
  - Scene 6
  - Scene 7
  - Scene 8

Chapter 4 (5 scenes)
Chapter 5 (3 scenes)
```

**User action:** Split Chapter 3 at Scene 5

**After:**
```
Chapter 3 (4 scenes)
  - Scene 1
  - Scene 2
  - Scene 3
  - Scene 4

Chapter 4 (4 scenes)  ← NEW, created from split
  - Scene 1 (was Ch3 Scene 5)
  - Scene 2 (was Ch3 Scene 6)
  - Scene 3 (was Ch3 Scene 7)
  - Scene 4 (was Ch3 Scene 8)

Chapter 5 (5 scenes)  ← OLD Chapter 4, renumbered
Chapter 6 (3 scenes)  ← OLD Chapter 5, renumbered
```

### When to Use Split

- Chapter is too long (>10 scenes, varies by project)
- Natural narrative break occurs mid-chapter
- Act structure requires new chapter boundary
- Pacing adjustment needed (separate high/low tension sequences)

### How Renumbering Works

**Chapter IDs:**
- Original chapter keeps its ID (e.g., `ch-3`)
- New chapter gets timestamped ID (e.g., `ch-1768669731000`)
- Subsequent chapters keep IDs but display numbers shift

**Scene Numbers:**
- First half (staying in original chapter): No change
- Second half (moving to new chapter): Renumbered from 1
- Example: Ch3 Scene 5 becomes Ch4 Scene 1

**Display:**
- Chapter display names updated: "Chapter 4" (new), "Chapter 5" (was 4)
- Tree re-renders automatically after split

### Step-by-Step Instructions

1. **Locate chapter to split** in narrative tree
2. **Click split button** (✂️ icon) on chapter header
3. **Prompt appears:** "Split chapter 'Chapter 3' at scene number (2-8):"
4. **Enter scene number** where split should occur (e.g., 5)
   - Scenes 1-4 remain in original chapter
   - Scenes 5-8 move to new chapter
5. **Confirm** (click OK)
6. **System processes:**
   - Creates new chapter with timestamped ID
   - Moves scenes 5-8 to new chapter
   - Renumbers scenes in new chapter (1-4)
   - Renumbers subsequent chapters in display
7. **Tree refreshes** with updated structure

**Validation:**
- Chapter must have at least 2 scenes to split
- Split index must be between 2 and scene count (can't split before scene 1 or after last scene)

---

## Merge Chapter Operation

### What Merge Does

Combines two adjacent chapters into the first chapter, deleting the second.

**Example:**

**Before:**
```
Chapter 2 (3 scenes)
  - Scene 1
  - Scene 2
  - Scene 3

Chapter 3 (5 scenes)
  - Scene 1
  - Scene 2
  - Scene 3
  - Scene 4
  - Scene 5

Chapter 4 (4 scenes)
Chapter 5 (2 scenes)
```

**User action:** Merge Chapter 2 with Chapter 3

**After:**
```
Chapter 2 (8 scenes)  ← Combined
  - Scene 1
  - Scene 2
  - Scene 3
  - Scene 4 (was Ch3 Scene 1)
  - Scene 5 (was Ch3 Scene 2)
  - Scene 6 (was Ch3 Scene 3)
  - Scene 7 (was Ch3 Scene 4)
  - Scene 8 (was Ch3 Scene 5)

Chapter 3 (4 scenes)  ← OLD Chapter 4, renumbered
Chapter 4 (2 scenes)  ← OLD Chapter 5, renumbered
```

### When to Use Merge

- Chapters are too short (combined still makes cohesive unit)
- Artificial chapter break disrupts flow
- Restructuring act boundaries
- Simplifying structure during revision

### How Renumbering Works

**Chapter IDs:**
- First chapter keeps its ID (e.g., `ch-2`)
- Second chapter deleted (e.g., `ch-3` removed)
- Subsequent chapters keep IDs but display numbers shift

**Scene Numbers:**
- First chapter scenes: No change (1, 2, 3)
- Second chapter scenes: Renumbered to continue sequence (4, 5, 6, 7, 8)

### Step-by-Step Instructions

1. **Locate first chapter** in pair to merge
2. **Click merge button** (🔗 icon) on chapter header
   - Note: Merge button only appears if chapter is not the last chapter
3. **Confirmation dialog:** "Merge 'Chapter 2' with 'Chapter 3'? This will combine all scenes into Chapter 2."
4. **Confirm** (click OK)
5. **System processes:**
   - Moves all scenes from Chapter 3 into Chapter 2
   - Renumbers combined scenes sequentially
   - Deletes Chapter 3
   - Renumbers subsequent chapters in display
6. **Tree refreshes** with updated structure

**Validation:**
- Can't merge last chapter (no next chapter to merge with)
- Merge operates on adjacent chapters only

---

## Rename/Delete Operations

### Rename Chapter

**Current limitation:** Chapters are ID-based logical groupings, not database entities with titles.

**What happens when you click rename chapter (✏️ icon):**
1. Prompt appears: "Rename chapter:"
2. Enter new name
3. API call: `api.renameNarrativeNode(chapterId, 'chapter', newTitle)`
4. API returns: "Chapters are ID-based groupings. Title changes not supported."
5. User sees message explaining limitation

**Workaround:** Chapter "titles" are derived from chapter IDs (e.g., `ch-3` → "Chapter 3"). To truly rename, you would need to change the chapter ID itself, which would break references. This is intentionally not supported to maintain referential integrity.

### Rename Scene

**What happens when you click rename scene (✏️ icon):**
1. Prompt appears: "Rename scene:" with current title
2. Enter new title
3. API call: `api.renameNarrativeNode(sceneId, 'scene', newTitle)`
4. Scene title updated in database
5. Tree refreshes with new title

**Use case:** Update scene titles during outlining or revision

### Delete Chapter

**What happens when you click delete chapter (🗑️ icon):**
1. Confirmation dialog: "Delete chapter 'Chapter 3'? This will also delete 8 scenes. This action cannot be undone."
   - Scene count warning prevents accidental loss of work
2. Confirm (click OK) or Cancel
3. If confirmed:
   - API call: `api.deleteNarrativeNode(chapterId, 'chapter')`
   - Chapter deleted from database
   - All scenes with that chapter_id also deleted
   - Tree refreshes with updated structure

**Warning:** This is a destructive operation. All scenes in the chapter are permanently deleted.

**Use case:** Removing entire chapter arc during major restructuring

### Delete Scene

**What happens when you click delete scene (🗑️ icon on scene):**
1. Confirmation dialog: "Delete scene 'Scene title'? This action cannot be undone."
2. Confirm (click OK) or Cancel
3. If confirmed:
   - API call: `api.deleteNarrativeNode(sceneId, 'scene')`
   - Scene deleted from database
   - Remaining scenes in chapter renumbered
   - Tree refreshes with updated structure

**Use case:** Removing individual scenes during revision

---

## Best Practices

### When to Reorder vs Create New

**Reorder existing scenes:**
- Scene content already written
- Adjusting flow/pacing of existing material
- Fixing narrative sequence during revision

**Create new scenes:**
- Adding content to fill gaps
- Expanding storylines
- Adding missing setup/payoff beats

**Don't:** Drag-and-drop to create copies. Each scene is unique. Use API to create new scenes, then reorder as needed.

### Chapter Grouping Strategies

**Act-based structure:**
```
Chapter 1-3: Act I (Setup)
Chapter 4-8: Act II (Confrontation)
Chapter 9-12: Act III (Resolution)
```

**POV-based structure:**
```
Chapter 1: Alice POV (3 scenes)
Chapter 2: Bob POV (3 scenes)
Chapter 3: Alice POV (3 scenes)
[Alternating pattern]
```

**Location-based structure:**
```
Chapter 1: London scenes
Chapter 2: Paris scenes
Chapter 3: Return to London
```

**Timeline-based structure:**
```
Chapter 1: Past (flashback)
Chapter 2: Present
Chapter 3: Past (flashback)
Chapter 4: Present (resolution)
```

### Handling "Unassigned" Scenes

**What "unassigned" means:**
- Scene exists but has `chapterId = null`
- Appears in "Unassigned Scenes" group at bottom of tree
- Often newly created scenes or orphaned scenes from deleted chapters

**Workflow for assigning:**
1. Review scene in "Unassigned Scenes" group
2. Identify correct chapter placement
3. Drag scene onto target chapter header (moves to end of chapter)
4. OR drag scene onto specific scene within chapter (inserts at that position)
5. Scene now has chapter assignment

**Tip:** Use "Unassigned Scenes" as staging area during major restructuring:
1. Move scenes you're unsure about to unassigned
2. Reorganize chapters without those scenes
3. Reintegrate unassigned scenes one by one into finalized structure

---

## Implementation Details

### API Endpoints Used

**Scene reordering:**
```javascript
// Update individual scene position
PATCH /api/scenes/:sceneId/sequence
Body: { chapterId: "ch-3", sceneNumber: 5 }

// Batch update multiple scenes (for renumbering)
POST /api/scenes/batch-update
Body: [
  { sceneId: "uuid-1", sceneNumber: 1, chapterId: "ch-2" },
  { sceneId: "uuid-2", sceneNumber: 2, chapterId: "ch-2" },
  ...
]
```

**Chapter operations:**
```javascript
// Split chapter
POST /api/chapters/:chapterId/split
Body: { splitIndex: 5 }

// Merge chapters
POST /api/chapters/:chapterId/merge
Body: { targetChapterId: "ch-4" }

// Rename node
PATCH /api/narrative-nodes/:nodeId/rename
Body: { type: "scene"|"chapter", newTitle: "New Title" }

// Delete node
DELETE /api/narrative-nodes/:nodeId
Query: ?type=scene|chapter
```

### State Updates After Operations

After any operation (reorder/split/merge/rename/delete):

1. **API call completes** (success or error)
2. **Tree refresh triggered:** `NarrativeTreeEditor.refreshTree()`
3. **Data re-fetched:** `api.getScenesByFiction(fictionId)`
4. **Scenes re-grouped** by chapter
5. **Tree re-rendered** with new HTML
6. **Drag handlers re-attached:** `setupDragHandlers()`

**Result:** User sees updated tree with changes persisted

### Error Handling

**API errors:**
```javascript
try {
  await api.splitChapter(chapterId, splitIndex);
  await this.refreshTree();
} catch (err) {
  console.error('Split chapter failed:', err);
  alert(`Failed to split chapter: ${err.message}`);
  // Tree remains in pre-operation state
}
```

**User sees:**
- Alert with error message
- Tree unchanged (operation rolled back)
- Console error for debugging

**Validation errors:**
- Handled before API call
- Alert with helpful message (e.g., "Chapter must have at least 2 scenes to split")
- No API call made

---

## Troubleshooting

### Drag-and-drop not working

**Symptom:** Can't drag scenes, no visual feedback

**Causes:**
1. `setupDragHandlers()` not called after render
2. HTML not inserted into DOM before setup
3. Browser doesn't support HTML5 drag-and-drop (very old browser)

**Fix:**
```javascript
// Correct order:
const html = await NarrativeTreeEditor.render(fictionId);
document.getElementById('container').innerHTML = html;
NarrativeTreeEditor.setupDragHandlers(); // MUST be after DOM insertion
```

### Scenes not renumbering after drop

**Symptom:** Scenes moved but keep old numbers

**Causes:**
1. `renumberScenes()` not called
2. API batch update failed
3. Tree not refreshed after update

**Fix:** Check console for API errors. Ensure `refreshTree()` called after successful drop.

### Split/merge buttons not appearing

**Symptom:** Missing action buttons on chapter headers

**Causes:**
1. Chapter is "unassigned" (no buttons rendered for unassigned)
2. Merge button hidden on last chapter (can't merge with non-existent next chapter)
3. CSS hiding buttons (check `.chapter-actions` styles)

**Fix:** Verify chapter is not unassigned. For merge, ensure not last chapter. Check CSS.

### Chapter rename not working

**Symptom:** Rename prompt appears but nothing changes

**Expected:** This is correct behavior. Chapters are ID-based, not named. API returns limitation message.

**Workaround:** Chapter display names derived from IDs. To change chapter numbering, reorganize chapters in sequence.

### Deleted scenes reappearing

**Symptom:** Deleted scene comes back after refresh

**Causes:**
1. Delete API call failed (check console)
2. Scene not actually deleted from database
3. Caching issue (rare)

**Fix:** Check API response. Verify scene deleted in database. Hard refresh browser (Ctrl+Shift+R).

---

## Advanced Usage

### Batch Restructuring Workflow

**Scenario:** Restructure 20 scenes across 5 chapters

**Approach:**
1. **Move to unassigned:** Drag all 20 scenes to "Unassigned Scenes" chapter
   - Now have blank slate for restructuring
2. **Create new chapter structure:**
   - Split/merge existing chapters as needed
   - Or work with existing chapter boundaries
3. **Reassign scenes one by one:**
   - Drag scenes from unassigned into new chapter positions
   - Tree auto-renumbers as you go
4. **Verify structure:**
   - Review entire tree for logical flow
   - Adjust any misplaced scenes

**Benefit:** Avoids cascading renumbering issues, provides clean mental model

### Keyboard Shortcuts (Future Enhancement)

**Currently:** Mouse-only drag-and-drop

**Potential future shortcuts:**
- `Ctrl+↑/↓`: Move scene up/down within chapter
- `Ctrl+Shift+↑/↓`: Move scene to previous/next chapter
- `Ctrl+D`: Delete selected scene
- `Ctrl+R`: Rename selected scene

**Accessibility note:** Current implementation requires mouse. Keyboard navigation would improve accessibility for screen reader users.

### Undo/Redo (Not Implemented)

**Current state:** No undo mechanism

**Workaround:** Manual reconstruction:
1. Keep notes of original structure before major changes
2. Use git for database backups (if using file-based SQLite)
3. Test restructuring in copy of project

**Future enhancement:** Event sourcing approach would enable full undo/redo

---

## Related Components

**Scene Editor (scene-editor.js):**
- Click scene card in tree to open Scene Editor
- Edit scene content, reader knowledge, dramatic irony
- Complementary to structural editing in tree

**Narrative Timeline (narrative-timeline.js):**
- Chronological view of scenes
- Timeline-based reordering (Phase 11 feature)
- Alternative to hierarchical tree view

**Story Logic Screens:**
- Character arcs, conflicts, setup/payoffs
- Editing logic doesn't change scene structure
- Structure changes here may affect logic screens

---

## See Also

- **COMPONENT_GUIDE.md** - Full documentation of all GUI components
- **gui/js/components/narrative-tree-editor.js** - Implementation source
- **gui/js/components/scene-editor.js** - Scene content editing
- **api/routes/scenes.js** - Scene API endpoints
- **api/routes/chapters.js** - Chapter API endpoints
