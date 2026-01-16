// Dialogue Module - Character Voice Profiles
// Manages dialogue profiles for consistent character voice generation
// Event sourcing: records are append-only, state is computed from history

const { v4: uuid } = require('uuid');

/**
 * Create or update a dialogue profile for an entity
 */
function recordProfile(db, {
  fictionId,
  entityId,
  vocabularyLevel = 'medium',
  formalityLevel = 'casual',
  speechPatterns = [],
  dialect = null,
  quirks = [],
  emotionalBaseline = 'neutral',
  topicsOfInterest = [],
  topicsToAvoid = [],
  relationshipModifiers = {},
  contextModifiers = {},
  voiceHints = {},
  validFrom
}) {
  const id = uuid();
  const createdAt = Date.now();
  const validFromTimestamp = validFrom || createdAt;

  db.prepare(`
    INSERT INTO dialogue_profiles
    (id, fiction_id, entity_id, vocabulary_level, formality_level, speech_patterns,
     dialect, quirks, emotional_baseline, topics_of_interest, topics_to_avoid,
     relationship_modifiers, context_modifiers, voice_hints, valid_from, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, fictionId, entityId, vocabularyLevel, formalityLevel,
    JSON.stringify(speechPatterns), dialect, JSON.stringify(quirks),
    emotionalBaseline, JSON.stringify(topicsOfInterest), JSON.stringify(topicsToAvoid),
    JSON.stringify(relationshipModifiers), JSON.stringify(contextModifiers),
    JSON.stringify(voiceHints), validFromTimestamp, createdAt
  );

  return {
    id,
    fictionId,
    entityId,
    vocabularyLevel,
    formalityLevel,
    speechPatterns,
    dialect,
    quirks,
    emotionalBaseline,
    topicsOfInterest,
    topicsToAvoid,
    relationshipModifiers,
    contextModifiers,
    voiceHints,
    validFrom: validFromTimestamp,
    createdAt
  };
}

/**
 * Get a specific dialogue profile by ID
 */
function getProfile(db, profileId) {
  const row = db.prepare(`
    SELECT * FROM dialogue_profiles WHERE id = ?
  `).get(profileId);

  if (!row) return null;

  return mapRowToProfile(row);
}

/**
 * Get the dialogue profile for an entity at a specific time
 */
function getProfileAt(db, entityId, timestamp) {
  const row = db.prepare(`
    SELECT * FROM dialogue_profiles
    WHERE entity_id = ? AND valid_from <= ?
    ORDER BY valid_from DESC
    LIMIT 1
  `).get(entityId, timestamp);

  if (!row) return null;

  return mapRowToProfile(row);
}

/**
 * Get voice hints for dialogue generation, with context and relationship modifiers applied
 */
function getVoiceHints(db, entityId, timestamp, options = {}) {
  const { targetEntityId, context } = options;

  const profile = getProfileAt(db, entityId, timestamp);

  if (!profile) {
    return {
      entityId,
      timestamp,
      found: false,
      hints: getDefaultVoiceHints()
    };
  }

  // Build base hints from profile
  const hints = {
    vocabularyLevel: profile.vocabularyLevel,
    formalityLevel: profile.formalityLevel,
    speechPatterns: [...profile.speechPatterns],
    dialect: profile.dialect,
    quirks: [...profile.quirks],
    emotionalBaseline: profile.emotionalBaseline,
    topicsOfInterest: [...profile.topicsOfInterest],
    topicsToAvoid: [...profile.topicsToAvoid],
    ...profile.voiceHints
  };

  // Apply relationship modifiers if speaking to a specific entity
  if (targetEntityId && profile.relationshipModifiers[targetEntityId]) {
    const relMod = profile.relationshipModifiers[targetEntityId];
    applyModifiers(hints, relMod);
  }

  // Apply context modifiers if context is specified
  if (context && profile.contextModifiers[context]) {
    const ctxMod = profile.contextModifiers[context];
    applyModifiers(hints, ctxMod);
  }

  return {
    entityId,
    timestamp,
    found: true,
    profile,
    hints
  };
}

/**
 * Get all profiles for an entity (history)
 */
function getProfileHistory(db, entityId) {
  const rows = db.prepare(`
    SELECT * FROM dialogue_profiles
    WHERE entity_id = ?
    ORDER BY valid_from ASC
  `).all(entityId);

  return rows.map(mapRowToProfile);
}

/**
 * Get all profiles in a fiction
 */
function getProfilesInFiction(db, fictionId, timestamp = null) {
  let sql = `
    SELECT * FROM dialogue_profiles
    WHERE fiction_id = ?
  `;
  const params = [fictionId];

  if (timestamp) {
    sql += ' AND valid_from <= ?';
    params.push(timestamp);
  }

  sql += ' ORDER BY valid_from DESC';

  const rows = db.prepare(sql).all(...params);

  // Get latest profile for each entity
  const profileMap = new Map();

  for (const row of rows) {
    if (!profileMap.has(row.entity_id)) {
      profileMap.set(row.entity_id, mapRowToProfile(row));
    }
  }

  return Array.from(profileMap.values());
}

/**
 * Search profiles by speech characteristics
 */
function findByCharacteristics(db, criteria, options = {}) {
  const { fictionId, timestamp } = options;

  let sql = 'SELECT * FROM dialogue_profiles WHERE 1=1';
  const params = [];

  if (fictionId) {
    sql += ' AND fiction_id = ?';
    params.push(fictionId);
  }

  if (timestamp) {
    sql += ' AND valid_from <= ?';
    params.push(timestamp);
  }

  if (criteria.vocabularyLevel) {
    sql += ' AND vocabulary_level = ?';
    params.push(criteria.vocabularyLevel);
  }

  if (criteria.formalityLevel) {
    sql += ' AND formality_level = ?';
    params.push(criteria.formalityLevel);
  }

  if (criteria.dialect) {
    sql += ' AND dialect = ?';
    params.push(criteria.dialect);
  }

  if (criteria.emotionalBaseline) {
    sql += ' AND emotional_baseline = ?';
    params.push(criteria.emotionalBaseline);
  }

  sql += ' ORDER BY valid_from DESC';

  const rows = db.prepare(sql).all(...params);

  // Get latest profile for each entity
  const profileMap = new Map();

  for (const row of rows) {
    if (!profileMap.has(row.entity_id)) {
      profileMap.set(row.entity_id, mapRowToProfile(row));
    }
  }

  return Array.from(profileMap.values());
}

/**
 * Generate a dialogue prompt hint string for AI generation
 */
function generateDialoguePrompt(db, entityId, timestamp, options = {}) {
  const { targetEntityId, context, mood } = options;

  const result = getVoiceHints(db, entityId, timestamp, { targetEntityId, context });

  if (!result.found) {
    return null;
  }

  const { hints } = result;

  const promptParts = [];

  // Vocabulary and formality
  promptParts.push(`Vocabulary: ${hints.vocabularyLevel}, Formality: ${hints.formalityLevel}`);

  // Dialect
  if (hints.dialect) {
    promptParts.push(`Dialect/Accent: ${hints.dialect}`);
  }

  // Emotional baseline (override with mood if provided)
  const emotion = mood || hints.emotionalBaseline;
  promptParts.push(`Emotional tone: ${emotion}`);

  // Speech patterns
  if (hints.speechPatterns.length > 0) {
    promptParts.push(`Speech patterns: ${hints.speechPatterns.join(', ')}`);
  }

  // Quirks
  if (hints.quirks.length > 0) {
    promptParts.push(`Voice quirks: ${hints.quirks.join(', ')}`);
  }

  // Topics
  if (hints.topicsOfInterest.length > 0) {
    promptParts.push(`Tends to discuss: ${hints.topicsOfInterest.join(', ')}`);
  }

  if (hints.topicsToAvoid.length > 0) {
    promptParts.push(`Avoids discussing: ${hints.topicsToAvoid.join(', ')}`);
  }

  return {
    entityId,
    timestamp,
    prompt: promptParts.join('. ') + '.',
    hints
  };
}

/**
 * Apply modifiers to hints object
 */
function applyModifiers(hints, modifiers) {
  if (modifiers.formalityLevel) {
    hints.formalityLevel = modifiers.formalityLevel;
  }
  if (modifiers.emotionalBaseline) {
    hints.emotionalBaseline = modifiers.emotionalBaseline;
  }
  if (modifiers.additionalPatterns) {
    hints.speechPatterns = [...hints.speechPatterns, ...modifiers.additionalPatterns];
  }
  if (modifiers.additionalQuirks) {
    hints.quirks = [...hints.quirks, ...modifiers.additionalQuirks];
  }
  // Apply any other custom modifiers
  for (const key in modifiers) {
    if (!['formalityLevel', 'emotionalBaseline', 'additionalPatterns', 'additionalQuirks'].includes(key)) {
      hints[key] = modifiers[key];
    }
  }
}

/**
 * Get default voice hints for entities without profiles
 */
function getDefaultVoiceHints() {
  return {
    vocabularyLevel: 'medium',
    formalityLevel: 'neutral',
    speechPatterns: [],
    dialect: null,
    quirks: [],
    emotionalBaseline: 'neutral',
    topicsOfInterest: [],
    topicsToAvoid: []
  };
}

/**
 * Map database row to profile object
 */
function mapRowToProfile(row) {
  return {
    id: row.id,
    fictionId: row.fiction_id,
    entityId: row.entity_id,
    vocabularyLevel: row.vocabulary_level,
    formalityLevel: row.formality_level,
    speechPatterns: JSON.parse(row.speech_patterns || '[]'),
    dialect: row.dialect,
    quirks: JSON.parse(row.quirks || '[]'),
    emotionalBaseline: row.emotional_baseline,
    topicsOfInterest: JSON.parse(row.topics_of_interest || '[]'),
    topicsToAvoid: JSON.parse(row.topics_to_avoid || '[]'),
    relationshipModifiers: JSON.parse(row.relationship_modifiers || '{}'),
    contextModifiers: JSON.parse(row.context_modifiers || '{}'),
    voiceHints: JSON.parse(row.voice_hints || '{}'),
    validFrom: row.valid_from,
    createdAt: row.created_at
  };
}

module.exports = {
  recordProfile,
  getProfile,
  getProfileAt,
  getVoiceHints,
  getProfileHistory,
  getProfilesInFiction,
  findByCharacteristics,
  generateDialoguePrompt
};
