/**
 * TripleThink Narrative Routes
 * Book, chapter, scene, and narrative structure operations
 */

const express = require('express');
const router = express.Router();

const {
  asyncHandler,
  NotFoundError,
  ValidationError,
  validateRequired,
  validateTimestamp
} = require('../error-handling');

const { standardRateLimit } = require('../middleware/rate-limit');

// ============================================================
// ROUTES
// ============================================================

/**
 * GET /api/narrative/books
 * List all books in the project
 */
router.get('/books', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');

  const stmt = db.db.prepare(`
    SELECT ns.*, m.author_notes, m.prose_guidance
    FROM narrative_structure ns
    LEFT JOIN metadata m ON ns.meta_id = m.id
    WHERE ns.structure_type = 'book'
    ORDER BY ns.sequence
  `);

  const books = stmt.all().map(book => ({
    ...book,
    author_notes: book.author_notes ? JSON.parse(book.author_notes) : null,
    prose_guidance: book.prose_guidance ? JSON.parse(book.prose_guidance) : null
  }));

  res.json({ data: books });
}));

/**
 * GET /api/narrative/book/:bookId
 * Get book with all acts and chapters
 */
router.get('/book/:bookId', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { bookId } = req.params;

  // Get book
  const bookStmt = db.db.prepare(`
    SELECT * FROM narrative_structure WHERE id = ? AND structure_type = 'book'
  `);
  const book = bookStmt.get(bookId);

  if (!book) {
    throw new NotFoundError('Book', bookId);
  }

  // Get acts
  const actsStmt = db.db.prepare(`
    SELECT * FROM narrative_structure WHERE parent_id = ? AND structure_type = 'act' ORDER BY sequence
  `);
  const acts = actsStmt.all(bookId);

  // Get chapters for each act
  const chaptersStmt = db.db.prepare(`
    SELECT * FROM narrative_structure WHERE parent_id = ? AND structure_type = 'chapter' ORDER BY sequence
  `);

  const actsWithChapters = acts.map(act => ({
    ...act,
    chapters: chaptersStmt.all(act.id)
  }));

  res.json({
    data: {
      ...book,
      acts: actsWithChapters
    }
  });
}));

/**
 * GET /api/narrative/book/:bookId/chapter/:chapterNum
 * Get chapter by book and chapter number
 */
router.get('/book/:bookId/chapter/:chapterNum', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { bookId, chapterNum } = req.params;
  const { include_scenes = 'true', include_events = 'false' } = req.query;

  // Find chapter (may need to search through acts)
  const chapterStmt = db.db.prepare(`
    SELECT c.* FROM narrative_structure c
    JOIN narrative_structure a ON c.parent_id = a.id
    WHERE a.parent_id = ? AND c.structure_type = 'chapter' AND c.sequence = ?
  `);
  const chapter = chapterStmt.get(bookId, parseInt(chapterNum));

  if (!chapter) {
    throw new NotFoundError('Chapter', `${bookId}/chapter/${chapterNum}`);
  }

  let responseData = { ...chapter };

  // Include scenes if requested
  if (include_scenes === 'true') {
    const scenesStmt = db.db.prepare(`
      SELECT s.*, e.name as pov_character_name
      FROM scenes s
      JOIN entities e ON s.pov_character_id = e.id
      WHERE s.chapter_id = ?
      ORDER BY s.sequence
    `);
    const scenes = scenesStmt.all(chapter.id).map(scene => ({
      ...scene,
      epistemic_constraints: JSON.parse(scene.epistemic_constraints)
    }));

    responseData.scenes = scenes;
  }

  // Include events if requested
  if (include_events === 'true') {
    const events = db.getChapterEvents(chapter.id);
    responseData.events = events;
  }

  res.json({ data: responseData });
}));

/**
 * GET /api/narrative/scene/:sceneId
 * Get scene with full context
 */
router.get('/scene/:sceneId', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { sceneId } = req.params;
  const { include_epistemic_context = 'true' } = req.query;

  const scene = db.getSceneData(sceneId, include_epistemic_context === 'true');

  if (!scene) {
    throw new NotFoundError('Scene', sceneId);
  }

  res.json({ data: scene });
}));

/**
 * POST /api/narrative/book
 * Create a new book
 */
router.post('/book', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id, title, sequence, meta_id } = req.body;

  validateRequired(req.body, ['id', 'title', 'sequence']);

  const stmt = db.db.prepare(`
    INSERT INTO narrative_structure (id, structure_type, title, sequence, meta_id)
    VALUES (?, 'book', ?, ?, ?)
  `);

  stmt.run(id, title, sequence, meta_id || null);

  const book = db.db.prepare('SELECT * FROM narrative_structure WHERE id = ?').get(id);

  res.status(201).json({ data: book });
}));

/**
 * POST /api/narrative/act
 * Create a new act
 */
router.post('/act', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id, title, sequence, book_id, meta_id } = req.body;

  validateRequired(req.body, ['id', 'title', 'sequence', 'book_id']);

  // Verify book exists
  const book = db.db.prepare(`
    SELECT id FROM narrative_structure WHERE id = ? AND structure_type = 'book'
  `).get(book_id);

  if (!book) {
    throw new NotFoundError('Book', book_id);
  }

  const stmt = db.db.prepare(`
    INSERT INTO narrative_structure (id, parent_id, structure_type, title, sequence, meta_id)
    VALUES (?, ?, 'act', ?, ?, ?)
  `);

  stmt.run(id, book_id, title, sequence, meta_id || null);

  const act = db.db.prepare('SELECT * FROM narrative_structure WHERE id = ?').get(id);

  res.status(201).json({ data: act });
}));

/**
 * POST /api/narrative/chapter
 * Create a new chapter
 */
router.post('/chapter', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id, title, sequence, act_id, meta_id } = req.body;

  validateRequired(req.body, ['id', 'title', 'sequence', 'act_id']);

  // Verify act exists
  const act = db.db.prepare(`
    SELECT id FROM narrative_structure WHERE id = ? AND structure_type = 'act'
  `).get(act_id);

  if (!act) {
    throw new NotFoundError('Act', act_id);
  }

  const stmt = db.db.prepare(`
    INSERT INTO narrative_structure (id, parent_id, structure_type, title, sequence, meta_id)
    VALUES (?, ?, 'chapter', ?, ?, ?)
  `);

  stmt.run(id, act_id, title, sequence, meta_id || null);

  const chapter = db.db.prepare('SELECT * FROM narrative_structure WHERE id = ?').get(id);

  res.status(201).json({ data: chapter });
}));

/**
 * POST /api/narrative/scene
 * Create a new scene
 */
router.post('/scene', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const {
    id, chapter_id, title, sequence,
    pov_character_id, temporal_start, temporal_end,
    epistemic_constraints
  } = req.body;

  validateRequired(req.body, [
    'id', 'chapter_id', 'title', 'sequence',
    'pov_character_id', 'temporal_start', 'temporal_end'
  ]);

  validateTimestamp(temporal_start, 'temporal_start');
  validateTimestamp(temporal_end, 'temporal_end');

  // Verify chapter exists
  const chapter = db.db.prepare(`
    SELECT id FROM narrative_structure WHERE id = ? AND structure_type = 'chapter'
  `).get(chapter_id);

  if (!chapter) {
    throw new NotFoundError('Chapter', chapter_id);
  }

  // Verify POV character exists
  const character = db.getEntity(pov_character_id, { includeMetadata: 'never' });
  if (!character) {
    throw new NotFoundError('Character', pov_character_id);
  }

  const stmt = db.db.prepare(`
    INSERT INTO scenes (id, chapter_id, title, sequence, pov_character_id, temporal_start, temporal_end, epistemic_constraints)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const defaultConstraints = {
    reader_knows: [],
    pov_character_knows: [],
    dramatic_irony: []
  };

  stmt.run(
    id, chapter_id, title, sequence,
    pov_character_id, temporal_start, temporal_end,
    JSON.stringify(epistemic_constraints || defaultConstraints)
  );

  const scene = db.getSceneData(id, true);

  res.status(201).json({ data: scene });
}));

/**
 * POST /api/narrative/scene/:sceneId/events
 * Add events to a scene
 */
router.post('/scene/:sceneId/events', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { sceneId } = req.params;
  const { event_ids, phase_ids } = req.body;

  validateRequired(req.body, ['event_ids']);

  // Verify scene exists
  const sceneCheck = db.db.prepare('SELECT id FROM scenes WHERE id = ?').get(sceneId);
  if (!sceneCheck) {
    throw new NotFoundError('Scene', sceneId);
  }

  // Add events
  const stmt = db.db.prepare(`
    INSERT INTO scene_events (scene_id, event_id, phase_id)
    VALUES (?, ?, ?)
  `);

  const added = [];
  for (let i = 0; i < event_ids.length; i++) {
    const eventId = event_ids[i];
    const phaseId = phase_ids ? phase_ids[i] : null;

    // Verify event exists
    const eventCheck = db.getEntity(eventId, { includeMetadata: 'never' });
    if (!eventCheck) {
      throw new NotFoundError('Event', eventId);
    }

    stmt.run(sceneId, eventId, phaseId);
    added.push({ event_id: eventId, phase_id: phaseId });
  }

  const scene = db.getSceneData(sceneId, true);

  res.status(201).json({
    data: scene,
    added_events: added
  });
}));

/**
 * POST /api/narrative/generate-outline
 * Generate chapter outline based on events
 */
router.post('/generate-outline', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { book_id, chapter_range, character_focus } = req.body;

  validateRequired(req.body, ['book_id']);

  // Verify book exists
  const book = db.db.prepare(`
    SELECT * FROM narrative_structure WHERE id = ? AND structure_type = 'book'
  `).get(book_id);

  if (!book) {
    throw new NotFoundError('Book', book_id);
  }

  // Get all chapters in range
  let chaptersQuery = `
    SELECT c.* FROM narrative_structure c
    JOIN narrative_structure a ON c.parent_id = a.id
    WHERE a.parent_id = ? AND c.structure_type = 'chapter'
  `;
  const params = [book_id];

  if (chapter_range) {
    const [start, end] = chapter_range.split('-').map(n => parseInt(n));
    chaptersQuery += ' AND c.sequence >= ? AND c.sequence <= ?';
    params.push(start, end);
  }

  chaptersQuery += ' ORDER BY a.sequence, c.sequence';

  const chapters = db.db.prepare(chaptersQuery).all(...params);

  // Build outline for each chapter
  const outline = [];

  for (const chapter of chapters) {
    // Get scenes in chapter
    const scenes = db.db.prepare(`
      SELECT s.*, e.name as pov_character_name
      FROM scenes s
      JOIN entities e ON s.pov_character_id = e.id
      WHERE s.chapter_id = ?
      ORDER BY s.sequence
    `).all(chapter.id);

    // Get events for chapter
    const events = db.getChapterEvents(chapter.id);

    // Filter by character focus if specified
    let relevantEvents = events;
    if (character_focus) {
      relevantEvents = events.filter(e => {
        const participants = e.data.participants || [];
        return participants.includes(character_focus);
      });
    }

    // Get key facts created in this chapter
    const factsStmt = db.db.prepare(`
      SELECT DISTINCT f.* FROM facts f
      JOIN event_phases ep ON f.phase_id = ep.id
      WHERE ep.event_id IN (${events.map(() => '?').join(',') || "''"})
    `);
    const facts = events.length > 0 ? factsStmt.all(...events.map(e => e.id)) : [];

    outline.push({
      chapter_id: chapter.id,
      chapter_title: chapter.title,
      sequence: chapter.sequence,
      scenes: scenes.map(s => ({
        scene_id: s.id,
        title: s.title,
        pov_character: s.pov_character_name,
        time_range: {
          start: s.temporal_start,
          end: s.temporal_end
        }
      })),
      events: relevantEvents.map(e => ({
        event_id: e.id,
        name: e.name,
        timestamp: e.timestamp,
        type: e.data.type
      })),
      facts_created: facts.map(f => ({
        fact_id: f.id,
        content: f.content,
        visibility: f.visibility
      })),
      summary: {
        scene_count: scenes.length,
        event_count: relevantEvents.length,
        fact_count: facts.length
      }
    });
  }

  res.json({
    data: {
      book_id,
      book_title: book.title,
      chapter_range,
      character_focus,
      outline,
      total_chapters: outline.length
    }
  });
}));

/**
 * PUT /api/narrative/scene/:sceneId/epistemic-constraints
 * Update scene epistemic constraints
 */
router.put('/scene/:sceneId/epistemic-constraints', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { sceneId } = req.params;
  const { epistemic_constraints } = req.body;

  validateRequired(req.body, ['epistemic_constraints']);

  // Verify scene exists
  const sceneCheck = db.db.prepare('SELECT id FROM scenes WHERE id = ?').get(sceneId);
  if (!sceneCheck) {
    throw new NotFoundError('Scene', sceneId);
  }

  const stmt = db.db.prepare(`
    UPDATE scenes SET epistemic_constraints = ? WHERE id = ?
  `);

  stmt.run(JSON.stringify(epistemic_constraints), sceneId);

  const scene = db.getSceneData(sceneId, true);

  res.json({ data: scene });
}));

/**
 * GET /api/narrative/character/:charId/scenes
 * Get all scenes featuring a character (as POV or participant)
 */
router.get('/character/:charId/scenes', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { charId } = req.params;
  const { pov_only = 'false' } = req.query;

  // Verify character exists
  const character = db.getEntity(charId, { includeMetadata: 'never' });
  if (!character) {
    throw new NotFoundError('Character', charId);
  }

  let scenes;

  if (pov_only === 'true') {
    // Only scenes where character is POV
    const stmt = db.db.prepare(`
      SELECT s.*, c.title as chapter_title
      FROM scenes s
      JOIN narrative_structure c ON s.chapter_id = c.id
      WHERE s.pov_character_id = ?
      ORDER BY s.temporal_start
    `);
    scenes = stmt.all(charId);
  } else {
    // Scenes where character is POV or participant in events
    const stmt = db.db.prepare(`
      SELECT DISTINCT s.*, c.title as chapter_title
      FROM scenes s
      JOIN narrative_structure c ON s.chapter_id = c.id
      LEFT JOIN scene_events se ON s.id = se.scene_id
      LEFT JOIN event_participants ep ON se.event_id = ep.event_id
      WHERE s.pov_character_id = ? OR ep.participant_id = ?
      ORDER BY s.temporal_start
    `);
    scenes = stmt.all(charId, charId);
  }

  res.json({
    data: {
      character_id: charId,
      character_name: character.name,
      pov_only: pov_only === 'true',
      scenes: scenes.map(s => ({
        ...s,
        epistemic_constraints: JSON.parse(s.epistemic_constraints)
      })),
      total_scenes: scenes.length
    }
  });
}));

// ============================================================
// EXPORTS
// ============================================================

module.exports = router;
