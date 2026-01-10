# TripleThink GUI User Guide

Welcome to TripleThink, a narrative construction system designed for multi-book fiction series with event-sourced architecture.

## Getting Started

### Prerequisites
- A web browser (Chrome, Firefox, Safari, or Edge)
- TripleThink API server running on http://localhost:3000

### Starting the System

1. **Start the API Server**
   ```bash
   cd /app/api
   npm start
   ```
   The server should be running on `http://localhost:3000`

2. **Open the GUI**
   Simply open `/app/gui/index.html` in your web browser, or serve it via a local server:
   ```bash
   cd /app/gui
   python3 -m http.server 8080
   ```
   Then navigate to `http://localhost:8080/`

## Navigation

The sidebar on the left provides access to all major sections:

- **Dashboard**: Overview of your project with statistics and quick actions
- **Timeline**: Chronological view of all events in your narrative
- **Entities**: Complete list of all events, characters, objects, and locations
- **Characters**: Filtered view of character entities
- **Fictions**: Manage false narrative systems (lies, deceptions, misunderstandings)
- **Narrative Structure**: Organize books, chapters, and scenes
- **Validation**: Check for narrative consistency issues

## Creating Entities

### Events

Events are the core building blocks of your narrative - anything that happens in the world.

1. Click **Dashboard → New Event** or use **Entities → + New**
2. Fill in the event details:
   - **Event ID**: Must start with `evt-` (e.g., `evt-harry-learns-truth`)
   - **Timestamp**: When the event occurs (ISO 8601 format)
   - **Type**:
     - `information_transfer` - Someone learns something
     - `deception_event` - A lie is told
     - `complex_multi_phase` - A multi-step event
     - `state_change` - Something changes state
   - **Summary**: Brief description of what happens

3. **Advanced Options** (optional):
   - **Phases**: Break complex events into phases
   - **Facts**: What new facts this event creates
   - **Participants**: Who was involved

4. Click **Save Event**

### Characters

Characters represent entities that can perceive, act, and hold beliefs.

1. Click **Dashboard → New Character** or use **Entities → + New**
2. Fill in character details:
   - **Character ID**: Must start with `char-` (e.g., `char-harry-potter`)
   - **Name**: Full name of the character
   - **Role**: `protagonist`, `antagonist`, or `supporting`

3. Click **Save Character**

### Fictions

Fictions are false narratives - stories that are believed by some characters but contradict the world truth.

1. Click **Dashboard → New Fiction** or use **Entities → + New**
2. Fill in fiction details:
   - **Fiction ID**: Must start with `fiction-` (e.g., `fiction-harry-is-bad`)
   - **Name**: Name of the false narrative
   - **Description**: What characters believe in this fiction

3. Click **Save Fiction**

## Managing Entities

### Viewing Entities

The **Entities** screen shows all entities in a searchable, filterable table.

- **Search**: Type in the search box to find entities by ID or name
- **Filter by Type**: Use the dropdown to show only specific types
- **Sort**: Click column headers to sort (if implemented)

### Editing Entities

1. Click on any entity in the list or click the **Edit** button
2. Modify the fields as needed
3. Click **Save**

### Deleting Entities

1. Click the **Delete** button next to an entity
2. Confirm the deletion in the dialog
3. The entity is permanently deleted

**Note**: Deletion is permanent. Consider archiving instead of deleting.

## Timeline View

The **Timeline** screen shows all events in chronological order.

1. Select start and end dates
2. Click **Load Events**
3. Events are displayed as a chronological list with:
   - Timestamp
   - Event name/ID
   - Summary

**Advanced Features** (coming soon):
- Interactive D3.js visualization
- Zoom and pan controls
- Event filtering by type or participant

## Validation

The **Validation** screen checks for consistency issues in your narrative.

1. Click **Validation** in the sidebar
2. Click **Run Validation**
3. The system checks for:
   - Epistemic consistency (character knowledge matches events)
   - Fiction constraints (audience isolation maintained)
   - Temporal consistency (events in proper order)
   - Reference validity (all references point to existing entities)

**Issues Found**:
- **Errors**: Critical issues that must be fixed
- **Warnings**: Potential problems worth reviewing

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | Create new entity |
| `Esc` | Close any open modal |
| `/` | Focus search (on Entities screen) |

## Tips and Best Practices

### ID Naming Conventions

IDs must follow these prefixes and patterns:

```
Events:         evt-short-description
Characters:     char-first-last-or-alias
Objects:        obj-object-description
Locations:      loc-location-name
Fictions:       fiction-false-claim
Systems:        sys-system-name
```

**Rules**:
- Use lowercase letters and hyphens only
- Start with the required prefix
- Be descriptive but concise
- Use hyphens to separate words

### Timestamps

All timestamps must be in ISO 8601 format:

```
2024-01-15T14:30:00Z
2024-12-31T23:59:59Z
```

**Note**: Z at the end indicates UTC timezone.

### Metadata

For complex entities, add metadata:

1. Click **Edit** on an entity
2. Look for the **Metadata** button (if available)
3. Add:
   - Author notes explaining your design decisions
   - AI context for query guidance
   - Mark as "mandatory" to always load with entity

### Epistemic State (Character Knowledge)

Track what each character knows at different points:

1. Edit a character
2. Click the **Knowledge Timeline** tab
3. Add entries showing:
   - When they learned something
   - What they know (or falsely believe)
   - Their confidence level

This enables powerful queries like:
- "What would Character X do at this point?"
- "Does Character X know about Event Y?"
- "What false beliefs does Character X have?"

### Fictions Management

Fictions are crucial for managing multiple narrative perspectives:

1. Create a fiction for each false narrative system
2. Specify the target audience (characters who believe it)
3. Track which facts are contradicted in this fiction
4. The system will validate that audience separation is maintained

**Example**:
- **Fiction ID**: `fiction-snape-is-villain`
- **Target Audience**: Harry, Ron, Hermione (until Deathly Hallows)
- **Contradicted Facts**: Snape protecting Harry, Snape's true loyalty

## Project Export and Import

### Exporting

1. Click **Export Project** in the sidebar
2. Your project is downloaded as a JSON file
3. Back up this file regularly

### Importing

(Coming soon in future version)

## Troubleshooting

### "Cannot connect to API server"

The GUI needs the API running on port 3000.

**Fix**:
```bash
cd /app/api
npm start
```

Ensure the server starts without errors. Check that port 3000 is not blocked.

### Changes not appearing

The GUI caches data. Try:
1. Refresh the page (Ctrl+R or Cmd+R)
2. Clear your browser cache
3. Hard reload (Ctrl+Shift+R or Cmd+Shift+R)

### Form validation errors

Check that:
- **IDs** start with the correct prefix and use only lowercase letters/numbers/hyphens
- **Timestamps** are in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
- **Required fields** are filled in
- **References** point to existing entities

### Lost changes

Changes are only saved when you click the **Save** button. Make sure to save before navigating away.

## Advanced Features

### Epistemic Queries

Once characters' knowledge is defined, you can query:

- "What does Character X know at time T?"
- "Who knows about Event Y at time T?"
- "What are the contradictions in Fiction Z?"

These queries are the foundation for:
- AI-generated dialogue (characters only know what they should)
- Realistic reactions (characters respond to their knowledge, not the truth)
- Tension management (readers know more or less than characters)

### Time-Travel Queries

The event-sourced architecture supports querying any point in time:

- "What was Character X's state at time T?"
- "What events had occurred by date D?"
- "Replay from event E1 to E2"

### Fiction Audience Constraints

Fictions automatically maintain audience boundaries:

- Information flows correctly between books
- No spoiler leakage to restricted audiences
- Consistent false beliefs across all books

## Getting Help

For detailed technical information, see:
- `/app/CLAUDE.md` - System architecture
- `/app/BuildPrompts/PROMPT_*.md` - Design specifications

For issues or feature requests, document them with:
- What you were trying to do
- What happened instead
- What you expected to happen
- Your browser and version

## Next Steps

1. Create your project structure:
   - Define all major events
   - Create character profiles
   - Map out epistemic states

2. Add complexity:
   - Define false narratives (fictions)
   - Track character knowledge evolution
   - Set up validation constraints

3. Export and integrate:
   - Export your project as JSON
   - Use the data in your writing tools
   - Query via the API for AI assistance

Happy writing!
