// Orchestrator Service - THE CRITICAL COMPONENT
// Assembles complete context packets for narrative generation
// Combines POV state, characters, relationships, conflicts, themes, dialogue profiles, forbidden reveals

const scenes = require('../../db/modules/scenes');
const epistemic = require('../../db/modules/epistemic');
const relationships = require('../../db/modules/relationships');
const dialogue = require('../../db/modules/dialogue');
const pacing = require('../../db/modules/pacing');
const transitions = require('../../db/modules/transitions');
const createAPI = require('../../db/api-functions');

/**
 * Assemble complete context packet for a scene
 * This is the primary function for narrative generation
 *
 * @param {Database} db - SQLite database instance
 * @param {string} sceneId - Scene ID to assemble context for
 * @returns {Object} Complete context packet
 */
async function assembleContext(db, sceneId) {
  const startTime = Date.now();

  // Get the scene
  const scene = scenes.getScene(db, sceneId);
  if (!scene) {
    throw new Error(`Scene not found: ${sceneId}`);
  }

  const narrativeTime = scene.narrativeTime;
  const fictionId = scene.fictionId;

  // Get all present entities
  const presentEntityIds = scenes.getAllPresentEntities(db, sceneId);

  // Assemble context in parallel where possible
  const [
    povContext,
    characterContexts,
    relationshipMatrix,
    activeConflicts,
    activeThemes,
    characterArcs,
    forbiddenReveals,
    pacingContext,
    transitionContext
  ] = await Promise.all([
    // POV character's full context
    assemblePOVContext(db, scene.povEntityId, narrativeTime, fictionId),

    // All present characters' basic info and dialogue profiles
    assembleCharacterContexts(db, presentEntityIds, narrativeTime, fictionId),

    // Relationship matrix between all present characters
    assembleRelationshipMatrix(db, presentEntityIds, narrativeTime),

    // Active conflicts from scene
    assembleConflicts(db, scene.activeConflictIds || [], narrativeTime),

    // Active themes from scene
    assembleThemes(db, scene.activeThemeIds || []),

    // Character arcs for all present characters
    assembleCharacterArcs(db, presentEntityIds),

    // Forbidden reveals - facts that must NOT be revealed yet
    assembleForbiddenReveals(db, scene.forbiddenRevealIds, scene.povEntityId, narrativeTime),

    // Pacing context - tension curve position
    assemblePacingContext(db, sceneId, fictionId, narrativeTime),

    // Transition context - what came before
    assembleTransitionContext(db, sceneId, fictionId)
  ]);

  const assemblyTime = Date.now() - startTime;

  return {
    meta: {
      sceneId,
      fictionId,
      narrativeTime,
      assembledAt: Date.now(),
      assemblyTimeMs: assemblyTime
    },

    scene: {
      id: scene.id,
      title: scene.title,
      summary: scene.summary,
      sceneNumber: scene.sceneNumber,
      locationId: scene.locationId,
      mood: scene.mood,
      tensionLevel: scene.tensionLevel,
      stakes: scene.stakes,
      sceneGoal: scene.sceneGoal,
      status: scene.status
    },

    pov: povContext,

    characters: {
      present: characterContexts,
      count: characterContexts.length,
      entering: scene.enteringEntityIds,
      exiting: scene.exitingEntityIds
    },

    relationships: relationshipMatrix,

    conflicts: activeConflicts,

    themes: activeThemes,

    logicLayer: {
      conflicts: activeConflicts,
      characterArcs: characterArcs,
      themes: activeThemes
    },

    forbiddenReveals,

    pacing: pacingContext,

    previousScene: transitionContext
  };
}

/**
 * Assemble POV character's complete context
 */
async function assemblePOVContext(db, povEntityId, narrativeTime, fictionId) {
  if (!povEntityId) {
    return null;
  }

  // Get POV's knowledge state
  const knowledge = epistemic.queryKnowledgeAt(db, povEntityId, narrativeTime, { fictionId });

  // Get POV's false beliefs (for dramatic irony)
  const falseBeliefs = epistemic.getFalseBeliefs(db, povEntityId, narrativeTime, { fictionId });

  // Get POV's dialogue profile
  const voiceHints = dialogue.getVoiceHints(db, povEntityId, narrativeTime);

  // Get POV's relationships
  const povRelationships = relationships.getRelationshipsFor(db, povEntityId, narrativeTime, { fictionId });

  return {
    entityId: povEntityId,
    knowledge: {
      facts: knowledge,
      factCount: knowledge.length,
      // Organize by fact type for easier access
      byType: groupByFactType(knowledge)
    },
    falseBeliefs: {
      facts: falseBeliefs,
      count: falseBeliefs.length
    },
    voice: voiceHints,
    relationships: povRelationships.map(rel => ({
      otherEntityId: rel.entityAId === povEntityId ? rel.entityBId : rel.entityAId,
      type: rel.relationshipType,
      sentiment: rel.sentiment,
      trustLevel: rel.trustLevel,
      status: rel.status
    }))
  };
}

/**
 * Assemble context for all present characters
 */
async function assembleCharacterContexts(db, entityIds, narrativeTime, fictionId) {
  const contexts = [];

  for (const entityId of entityIds) {
    // Get dialogue profile with voice hints
    const voiceHints = dialogue.getVoiceHints(db, entityId, narrativeTime);

    // Get key knowledge (limited for non-POV characters)
    const knowledge = epistemic.queryKnowledgeAt(db, entityId, narrativeTime, { fictionId });

    contexts.push({
      entityId,
      voice: voiceHints.found ? voiceHints.hints : null,
      knowledgeCount: knowledge.length,
      // Include key facts (secrets they know)
      keySecrets: knowledge.filter(f => f.factType === 'secret').map(f => f.factKey)
    });
  }

  return contexts;
}

/**
 * Assemble relationship matrix between all present characters
 */
async function assembleRelationshipMatrix(db, entityIds, narrativeTime) {
  const matrix = {};

  // For each pair of entities
  for (let i = 0; i < entityIds.length; i++) {
    for (let j = i + 1; j < entityIds.length; j++) {
      const entityA = entityIds[i];
      const entityB = entityIds[j];

      const rel = relationships.getRelationshipAt(db, entityA, entityB, narrativeTime);

      if (rel) {
        const key = `${entityA}:${entityB}`;
        matrix[key] = {
          entityA,
          entityB,
          type: rel.relationshipType,
          sentiment: rel.sentiment,
          trustLevel: rel.trustLevel,
          powerBalance: rel.powerBalance,
          conflictLevel: rel.conflictLevel,
          status: rel.status
        };
      }
    }
  }

  return {
    pairs: matrix,
    pairCount: Object.keys(matrix).length
  };
}

/**
 * Assemble active conflicts for scene
 * @param {Object} db - Database instance
 * @param {Array<string>} conflictIds - Conflict IDs from scene
 * @param {number} narrativeTime - Current narrative time (unused but kept for signature consistency)
 * @returns {Array<Object>} Conflict details with status, stakes, participants
 */
async function assembleConflicts(db, conflictIds, narrativeTime) {
  if (!conflictIds || conflictIds.length === 0) return [];

  const api = createAPI(db);
  const conflicts = [];

  for (const conflictId of conflictIds) {
    const conflict = api.storyConflicts.getConflictById(conflictId);
    if (conflict) {
      conflicts.push({
        id: conflict.conflict_uuid,
        type: conflict.type,
        status: conflict.status,
        protagonist: conflict.protagonist_id,
        antagonist: conflict.antagonist_source,
        stakes: {
          success: conflict.stakes_success,
          failure: conflict.stakes_fail
        }
      });
    }
  }

  return conflicts;
}

/**
 * Assemble active themes for scene
 * @param {Object} db - Database instance
 * @param {Array<string>} themeIds - Theme IDs from scene
 * @returns {Array<Object>} Theme details with statement, question, manifestations
 */
async function assembleThemes(db, themeIds) {
  if (!themeIds || themeIds.length === 0) return [];

  const api = createAPI(db);
  const themes = [];

  for (const themeId of themeIds) {
    const theme = api.thematicElements.getThemeById(themeId);
    if (theme) {
      themes.push({
        id: theme.theme_uuid,
        statement: theme.statement,
        question: theme.question,
        primarySymbol: theme.primary_symbol_id,
        manifestations: theme.manifestations ? JSON.parse(theme.manifestations) : []
      });
    }
  }

  return themes;
}

/**
 * Assemble character arcs for present characters
 * @param {Object} db - Database instance
 * @param {Array<string>} characterIds - Character IDs
 * @returns {Array<Object>} Arc details with phase, lie/truth, want/need
 */
async function assembleCharacterArcs(db, characterIds) {
  if (!characterIds || characterIds.length === 0) return [];

  const api = createAPI(db);
  const arcs = [];

  for (const charId of characterIds) {
    try {
      const arc = api.characterArcs.getArcByCharacter(charId);
      if (arc) {
        arcs.push({
          characterId: arc.character_id,
          archetype: arc.archetype,
          currentPhase: arc.current_phase,
          lie: arc.lie_belief,
          truth: arc.truth_belief,
          want: arc.want_external,
          need: arc.need_internal
        });
      }
    } catch (err) {
      // Character may not have an arc yet - that's ok
      continue;
    }
  }

  return arcs;
}

/**
 * Assemble forbidden reveals - facts that must NOT be revealed yet
 */
async function assembleForbiddenReveals(db, forbiddenRevealIds, povEntityId, narrativeTime) {
  const forbidden = [];

  for (const factKey of forbiddenRevealIds) {
    // Check if POV already knows this fact
    const [factType, key] = factKey.includes(':') ? factKey.split(':') : ['secret', factKey];

    const povKnows = povEntityId
      ? epistemic.knowsFact(db, povEntityId, factType, key, narrativeTime)
      : false;

    forbidden.push({
      factKey,
      factType,
      key,
      povAlreadyKnows: povKnows,
      // If POV already knows, this is less critical to avoid
      criticality: povKnows ? 'low' : 'high'
    });
  }

  return {
    facts: forbidden,
    count: forbidden.length,
    criticalCount: forbidden.filter(f => f.criticality === 'high').length
  };
}

/**
 * Assemble pacing context
 */
async function assemblePacingContext(db, sceneId, fictionId, narrativeTime) {
  // Get nearby checkpoints
  const checkpoints = pacing.getCheckpointsInFiction(db, fictionId);

  // Find the current position in the story arc
  const beforeCheckpoints = checkpoints.filter(cp => cp.narrativeTime <= narrativeTime);
  const afterCheckpoints = checkpoints.filter(cp => cp.narrativeTime > narrativeTime);

  const currentCheckpoint = beforeCheckpoints.length > 0
    ? beforeCheckpoints[beforeCheckpoints.length - 1]
    : null;

  const nextCheckpoint = afterCheckpoints.length > 0
    ? afterCheckpoints[0]
    : null;

  // Get vent moments in this scene
  const ventMoments = pacing.getVentMomentsInScene(db, sceneId);

  // Get tension curve stats
  const tensionCurve = pacing.getTensionCurve(db, fictionId);

  return {
    currentCheckpoint: currentCheckpoint ? {
      type: currentCheckpoint.checkpointType,
      tensionTarget: currentCheckpoint.tensionTarget,
      emotionalBeat: currentCheckpoint.emotionalBeat
    } : null,

    nextCheckpoint: nextCheckpoint ? {
      type: nextCheckpoint.checkpointType,
      tensionTarget: nextCheckpoint.tensionTarget,
      timeUntil: nextCheckpoint.narrativeTime - narrativeTime
    } : null,

    tensionStats: tensionCurve.stats,

    ventMoments: ventMoments.map(vm => ({
      entityId: vm.entityId,
      type: vm.ventType,
      emotionalPeak: vm.emotionalPeak
    })),

    recommendedTensionDirection: calculateRecommendedDirection(currentCheckpoint, nextCheckpoint)
  };
}

/**
 * Assemble transition context - what came before
 */
async function assembleTransitionContext(db, sceneId, fictionId) {
  // Get transitions leading to this scene
  const incomingTransitions = transitions.getTransitionsTo(db, sceneId);

  if (incomingTransitions.length === 0) {
    return null;
  }

  const transition = incomingTransitions[0];
  const previousScene = scenes.getScene(db, transition.fromSceneId);

  if (!previousScene) {
    return null;
  }

  return {
    previousSceneId: previousScene.id,
    previousSceneTitle: previousScene.title,
    transitionType: transition.transitionType,
    timeGap: transition.timeGapMinutes,
    carriedTensions: transition.carriedTensions,
    locationChanged: transition.locationChange,
    povChanged: transition.povChange,
    continuityNotes: transition.continuityNotes
  };
}

/**
 * Calculate recommended tension direction based on checkpoints
 */
function calculateRecommendedDirection(current, next) {
  if (!current || !next) {
    return 'maintain';
  }

  const currentTension = current.tensionTarget || 0.5;
  const nextTension = next.tensionTarget || 0.5;

  if (nextTension > currentTension + 0.1) {
    return 'increase';
  } else if (nextTension < currentTension - 0.1) {
    return 'decrease';
  }

  return 'maintain';
}

/**
 * Group facts by fact type for easier access
 */
function groupByFactType(facts) {
  const grouped = {};

  for (const fact of facts) {
    if (!grouped[fact.factType]) {
      grouped[fact.factType] = [];
    }
    grouped[fact.factType].push({
      key: fact.factKey,
      value: fact.factValue,
      confidence: fact.confidence,
      isTrue: fact.isTrue
    });
  }

  return grouped;
}

/**
 * Quick context assembly - lighter version for performance-critical paths
 */
async function assembleQuickContext(db, sceneId) {
  const startTime = Date.now();

  const scene = scenes.getScene(db, sceneId);
  if (!scene) {
    throw new Error(`Scene not found: ${sceneId}`);
  }

  const presentEntityIds = scenes.getAllPresentEntities(db, sceneId);

  // Get voice hints for all characters in parallel
  const voicePromises = presentEntityIds.map(entityId =>
    dialogue.getVoiceHints(db, entityId, scene.narrativeTime)
  );

  const voiceResults = await Promise.all(voicePromises);

  const assemblyTime = Date.now() - startTime;

  return {
    meta: {
      sceneId,
      assemblyTimeMs: assemblyTime,
      mode: 'quick'
    },
    scene: {
      id: scene.id,
      title: scene.title,
      mood: scene.mood,
      tensionLevel: scene.tensionLevel
    },
    characters: presentEntityIds.map((entityId, i) => ({
      entityId,
      voice: voiceResults[i].found ? voiceResults[i].hints : null
    })),
    forbiddenReveals: scene.forbiddenRevealIds
  };
}

module.exports = {
  assembleContext,
  assembleQuickContext,
  assemblePOVContext,
  assembleCharacterContexts,
  assembleRelationshipMatrix
};
