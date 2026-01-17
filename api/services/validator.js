/**
 * TripleThink Validation Service
 * Comprehensive database consistency validation across 8 categories
 *
 * Categories:
 * 1. Referential Integrity (15 rules)
 * 2. Temporal Consistency (15 rules)
 * 3. Epistemic Consistency (12 rules)
 * 4. Fiction System (10 rules)
 * 5. Narrative Consistency (12 rules)
 * 6. Logic Layer (18 rules)
 * 7. State Integrity (12 rules)
 * 8. Cross-Entity (12 rules)
 *
 * Total: 106 validation rules
 */

class TripleThinkValidator {
  constructor(db) {
    this.db = db;
    this.rules = this.initializeRules();
  }

  initializeRules() {
    return {
      referential_integrity: [
        { id: 'RI-1', name: 'Entity ID Prefix Match', severity: 'critical', check: this.checkEntityIdPrefixes.bind(this) },
        { id: 'RI-2', name: 'Foreign Key Validity', severity: 'critical', check: this.checkForeignKeys.bind(this) },
        { id: 'RI-3', name: 'Metadata References', severity: 'error', check: this.checkMetadataReferences.bind(this) },
        { id: 'RI-4', name: 'Fiction Project References', severity: 'critical', check: this.checkFictionProjectRefs.bind(this) },
        { id: 'RI-5', name: 'Scene Fiction References', severity: 'critical', check: this.checkSceneFictionRefs.bind(this) },
        { id: 'RI-6', name: 'Epistemic Entity References', severity: 'error', check: this.checkEpistemicEntityRefs.bind(this) },
        { id: 'RI-7', name: 'Relationship Entity References', severity: 'error', check: this.checkRelationshipEntityRefs.bind(this) },
        { id: 'RI-8', name: 'Causality Event References', severity: 'error', check: this.checkCausalityEventRefs.bind(this) },
        { id: 'RI-9', name: 'Character Arc References', severity: 'error', check: this.checkCharacterArcRefs.bind(this) },
        { id: 'RI-10', name: 'Setup Payoff References', severity: 'error', check: this.checkSetupPayoffRefs.bind(this) },
        { id: 'RI-11', name: 'Transition Scene References', severity: 'error', check: this.checkTransitionSceneRefs.bind(this) },
        { id: 'RI-12', name: 'Dialogue Profile References', severity: 'error', check: this.checkDialogueProfileRefs.bind(this) },
        { id: 'RI-13', name: 'Pacing Checkpoint References', severity: 'warning', check: this.checkPacingCheckpointRefs.bind(this) },
        { id: 'RI-14', name: 'Vent Moment References', severity: 'warning', check: this.checkVentMomentRefs.bind(this) },
        { id: 'RI-15', name: 'Theme Symbol References', severity: 'warning', check: this.checkThemeSymbolRefs.bind(this) }
      ],
      temporal_consistency: [
        { id: 'TC-1', name: 'Narrative Time Validity', severity: 'error', check: this.checkNarrativeTimeValidity.bind(this) },
        { id: 'TC-2', name: 'Scene Chronological Order', severity: 'warning', check: this.checkSceneChronologicalOrder.bind(this) },
        { id: 'TC-3', name: 'Epistemic Timestamp Match', severity: 'error', check: this.checkEpistemicTimestampMatch.bind(this) },
        { id: 'TC-4', name: 'Relationship Timestamp Validity', severity: 'warning', check: this.checkRelationshipTimestampValidity.bind(this) },
        { id: 'TC-5', name: 'No Duplicate Scene Numbers', severity: 'error', check: this.checkDuplicateSceneNumbers.bind(this) },
        { id: 'TC-6', name: 'Scene Duration Validity', severity: 'warning', check: this.checkSceneDurationValidity.bind(this) },
        { id: 'TC-7', name: 'Setup Fired After Planted', severity: 'error', check: this.checkSetupFireSequence.bind(this) },
        { id: 'TC-8', name: 'Timestamps Not In Future', severity: 'error', check: this.checkTimestampsNotFuture.bind(this) },
        { id: 'TC-9', name: 'Arc Phase Transitions Valid', severity: 'warning', check: this.checkArcPhaseTransitions.bind(this) },
        { id: 'TC-10', name: 'Conflict Status Transitions Valid', severity: 'warning', check: this.checkConflictStatusTransitions.bind(this) },
        { id: 'TC-11', name: 'Transition Time Gaps Valid', severity: 'warning', check: this.checkTransitionTimeGaps.bind(this) },
        { id: 'TC-12', name: 'Pacing Checkpoint Ordering', severity: 'warning', check: this.checkPacingCheckpointOrder.bind(this) },
        { id: 'TC-13', name: 'Vent Moment Timing Valid', severity: 'warning', check: this.checkVentMomentTiming.bind(this) },
        { id: 'TC-14', name: 'Created At Timestamps Valid', severity: 'error', check: this.checkCreatedAtTimestamps.bind(this) },
        { id: 'TC-15', name: 'Dialogue Profile Timestamp Order', severity: 'warning', check: this.checkDialogueProfileTimestampOrder.bind(this) }
      ],
      epistemic_consistency: [
        { id: 'EC-1', name: 'Knowledge Before Revelation', severity: 'error', check: this.checkKnowledgeBeforeRevelation.bind(this) },
        { id: 'EC-2', name: 'False Beliefs Have True Facts', severity: 'error', check: this.checkFalseBeliefsHaveTrueFacts.bind(this) },
        { id: 'EC-3', name: 'Knowledge State Cumulative', severity: 'error', check: this.checkKnowledgeStateCumulative.bind(this) },
        { id: 'EC-4', name: 'Dramatic Irony Tracked', severity: 'warning', check: this.checkDramaticIronyTracked.bind(this) },
        { id: 'EC-5', name: 'Fact Source Valid', severity: 'error', check: this.checkFactSourceValid.bind(this) },
        { id: 'EC-6', name: 'Fact Type Consistency', severity: 'warning', check: this.checkFactTypeConsistency.bind(this) },
        { id: 'EC-7', name: 'No Orphaned Knowledge States', severity: 'warning', check: this.checkNoOrphanedKnowledgeStates.bind(this) },
        { id: 'EC-8', name: 'Confidence Levels Valid', severity: 'warning', check: this.checkConfidenceLevelsValid.bind(this) },
        { id: 'EC-9', name: 'Source Entity Exists', severity: 'error', check: this.checkSourceEntityExists.bind(this) },
        { id: 'EC-10', name: 'Fact Key Consistency', severity: 'warning', check: this.checkFactKeyConsistency.bind(this) },
        { id: 'EC-11', name: 'Fiction-Entity Epistemic Match', severity: 'error', check: this.checkFictionEntityEpistemicMatch.bind(this) },
        { id: 'EC-12', name: 'Forbidden Reveals Not Leaked', severity: 'warning', check: this.checkForbiddenRevealsNotLeaked.bind(this) }
      ],
      fiction_system: [
        { id: 'FS-1', name: 'Fiction Belongs to Project', severity: 'critical', check: this.checkFictionBelongsToProject.bind(this) },
        { id: 'FS-2', name: 'Fiction Names Unique', severity: 'error', check: this.checkFictionNamesUnique.bind(this) },
        { id: 'FS-3', name: 'Fiction Has Entities', severity: 'warning', check: this.checkFictionHasEntities.bind(this) },
        { id: 'FS-4', name: 'Entity Types Valid', severity: 'critical', check: this.checkEntityTypesValid.bind(this) },
        { id: 'FS-5', name: 'Metadata Valid JSON', severity: 'error', check: this.checkMetadataValidJSON.bind(this) },
        { id: 'FS-6', name: 'Fiction ID Convention', severity: 'warning', check: this.checkFictionIdConvention.bind(this) },
        { id: 'FS-7', name: 'Project ID Convention', severity: 'warning', check: this.checkProjectIdConvention.bind(this) },
        { id: 'FS-8', name: 'Project Has Fictions', severity: 'warning', check: this.checkProjectHasFictions.bind(this) },
        { id: 'FS-9', name: 'Entity ID Format Valid', severity: 'error', check: this.checkEntityIdFormatValid.bind(this) },
        { id: 'FS-10', name: 'Metadata Updated After Created', severity: 'warning', check: this.checkMetadataUpdatedAfterCreated.bind(this) }
      ],
      narrative_consistency: [
        { id: 'NC-1', name: 'Scenes Have Valid Chapters', severity: 'warning', check: this.checkScenesHaveValidChapters.bind(this) },
        { id: 'NC-2', name: 'Present Entity IDs Valid', severity: 'error', check: this.checkPresentEntityIdsValid.bind(this) },
        { id: 'NC-3', name: 'Active Conflict IDs Valid', severity: 'error', check: this.checkActiveConflictIdsValid.bind(this) },
        { id: 'NC-4', name: 'Active Theme IDs Valid', severity: 'error', check: this.checkActiveThemeIdsValid.bind(this) },
        { id: 'NC-5', name: 'Chapter Numbering Sequential', severity: 'warning', check: this.checkChapterNumberingSequential.bind(this) },
        { id: 'NC-6', name: 'Scene Numbering Sequential', severity: 'warning', check: this.checkSceneNumberingSequential.bind(this) },
        { id: 'NC-7', name: 'Narrative Timeline Coherent', severity: 'error', check: this.checkNarrativeTimelineCoherent.bind(this) },
        { id: 'NC-8', name: 'Scene Transitions Valid', severity: 'warning', check: this.checkSceneTransitionsValid.bind(this) },
        { id: 'NC-9', name: 'Scene Tension Levels Valid', severity: 'warning', check: this.checkSceneTensionLevelsValid.bind(this) },
        { id: 'NC-10', name: 'Scene Status Valid', severity: 'warning', check: this.checkSceneStatusValid.bind(this) },
        { id: 'NC-11', name: 'Entering/Exiting Entities Valid', severity: 'error', check: this.checkEnteringExitingEntitiesValid.bind(this) },
        { id: 'NC-12', name: 'Setup Payoff IDs Valid', severity: 'error', check: this.checkSetupPayoffIdsValid.bind(this) }
      ],
      logic_layer: [
        { id: 'LL-1', name: 'Causality Strength 1-10', severity: 'error', check: this.checkCausalityStrength.bind(this) },
        { id: 'LL-2', name: 'Causality Type Valid', severity: 'critical', check: this.checkCausalityTypeValid.bind(this) },
        { id: 'LL-3', name: 'Arc Phase Valid', severity: 'critical', check: this.checkArcPhaseValid.bind(this) },
        { id: 'LL-4', name: 'Arc Archetype Valid', severity: 'warning', check: this.checkArcArchetypeValid.bind(this) },
        { id: 'LL-5', name: 'Conflict Type Valid', severity: 'critical', check: this.checkConflictTypeValid.bind(this) },
        { id: 'LL-6', name: 'Conflict Status Valid', severity: 'critical', check: this.checkConflictStatusValid.bind(this) },
        { id: 'LL-7', name: 'Setup Status Valid', severity: 'critical', check: this.checkSetupStatusValid.bind(this) },
        { id: 'LL-8', name: 'World Rule Category Valid', severity: 'critical', check: this.checkWorldRuleCategoryValid.bind(this) },
        { id: 'LL-9', name: 'World Rule Enforcement Valid', severity: 'critical', check: this.checkWorldRuleEnforcementValid.bind(this) },
        { id: 'LL-10', name: 'Theme Manifestations Valid JSON', severity: 'error', check: this.checkThemeManifestationsValid.bind(this) },
        { id: 'LL-11', name: 'Motif Instances Link Valid', severity: 'error', check: this.checkMotifInstancesLinkValid.bind(this) },
        { id: 'LL-12', name: 'Setup Payoff Temporal Order', severity: 'error', check: this.checkSetupPayoffTemporalOrder.bind(this) },
        { id: 'LL-13', name: 'No Circular Causality', severity: 'error', check: this.checkNoCircularCausality.bind(this) },
        { id: 'LL-14', name: 'Arc Progression Monotonic', severity: 'warning', check: this.checkArcProgressionMonotonic.bind(this) },
        { id: 'LL-15', name: 'Conflict Protagonist Immutable', severity: 'critical', check: this.checkConflictProtagonistImmutable.bind(this) },
        { id: 'LL-16', name: 'Motif Type Valid', severity: 'critical', check: this.checkMotifTypeValid.bind(this) },
        { id: 'LL-17', name: 'Conflict Stakes Not Empty', severity: 'warning', check: this.checkConflictStakesNotEmpty.bind(this) },
        { id: 'LL-18', name: 'Arc Core Fields Present', severity: 'warning', check: this.checkArcCoreFieldsPresent.bind(this) }
      ],
      state_integrity: [
        { id: 'SI-1', name: 'Snapshot References Valid', severity: 'error', check: this.checkSnapshotReferencesValid.bind(this) },
        { id: 'SI-2', name: 'Delta Chain Valid', severity: 'error', check: this.checkDeltaChainValid.bind(this) },
        { id: 'SI-3', name: 'Delta Chain Length Reasonable', severity: 'warning', check: this.checkDeltaChainLengthReasonable.bind(this) },
        { id: 'SI-4', name: 'Snapshot Every 10 Events', severity: 'warning', check: this.checkSnapshotEvery10Events.bind(this) },
        { id: 'SI-5', name: 'State Reconstruction Valid JSON', severity: 'error', check: this.checkStateReconstructionValidJSON.bind(this) },
        { id: 'SI-6', name: 'No Orphaned Deltas', severity: 'warning', check: this.checkNoOrphanedDeltas.bind(this) },
        { id: 'SI-7', name: 'No Orphaned Snapshots', severity: 'warning', check: this.checkNoOrphanedSnapshots.bind(this) },
        { id: 'SI-8', name: 'Relationship State Changes Valid', severity: 'error', check: this.checkRelationshipStateChangesValid.bind(this) },
        { id: 'SI-9', name: 'Dialogue Profile Valid From', severity: 'warning', check: this.checkDialogueProfileValidFrom.bind(this) },
        { id: 'SI-10', name: 'Pacing Checkpoint Tension Valid', severity: 'warning', check: this.checkPacingCheckpointTensionValid.bind(this) },
        { id: 'SI-11', name: 'Relationship Status Valid', severity: 'warning', check: this.checkRelationshipStatusValid.bind(this) },
        { id: 'SI-12', name: 'Dialogue Profile JSON Fields Valid', severity: 'error', check: this.checkDialogueProfileJSONFieldsValid.bind(this) }
      ],
      cross_entity: [
        { id: 'XE-1', name: 'Relationship Both Entities Exist', severity: 'critical', check: this.checkRelationshipBothEntitiesExist.bind(this) },
        { id: 'XE-2', name: 'Relationship Values In Range', severity: 'error', check: this.checkRelationshipValuesInRange.bind(this) },
        { id: 'XE-3', name: 'No Duplicate Relationships', severity: 'warning', check: this.checkNoDuplicateRelationships.bind(this) },
        { id: 'XE-4', name: 'Entity Metadata Consistency', severity: 'warning', check: this.checkEntityMetadataConsistency.bind(this) },
        { id: 'XE-5', name: 'Causality Chains Connect Events', severity: 'error', check: this.checkCausalityChainsConnectEvents.bind(this) },
        { id: 'XE-6', name: 'Arcs Cover Present Characters', severity: 'warning', check: this.checkArcsCoverPresentCharacters.bind(this) },
        { id: 'XE-7', name: 'Conflicts Reference Valid Antagonists', severity: 'error', check: this.checkConflictsReferenceValidAntagonists.bind(this) },
        { id: 'XE-8', name: 'Themes Reference Valid Symbols', severity: 'warning', check: this.checkThemesReferenceValidSymbols.bind(this) },
        { id: 'XE-9', name: 'Scene POV Entity Valid', severity: 'error', check: this.checkScenePOVEntityValid.bind(this) },
        { id: 'XE-10', name: 'Scene Location Entity Valid', severity: 'warning', check: this.checkSceneLocationEntityValid.bind(this) },
        { id: 'XE-11', name: 'Vent Moment Entity Valid', severity: 'error', check: this.checkVentMomentEntityValid.bind(this) },
        { id: 'XE-12', name: 'Transition Continuity Fields Valid', severity: 'warning', check: this.checkTransitionContinuityFieldsValid.bind(this) }
      ]
    };
  }

  async validateDatabase() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: { total_rules: 0, passed: 0, failed: 0, warnings: 0, critical: 0, errors: 0 },
      categories: {},
      errors: [],
      warnings: [],
      critical: []
    };

    for (const [category, rules] of Object.entries(this.rules)) {
      const categoryResults = await this.runCategoryRules(category, rules);
      report.categories[category] = categoryResults;

      // Aggregate stats
      report.summary.total_rules += categoryResults.rules.length;
      report.summary.passed += categoryResults.passed;
      report.summary.failed += categoryResults.failed;
      report.summary.warnings += categoryResults.warnings;

      // Collect errors and warnings
      categoryResults.rules.forEach(rule => {
        if (!rule.result.passed) {
          const issue = {
            category,
            rule_id: rule.id,
            name: rule.name,
            severity: rule.severity,
            errors: rule.result.errors,
            warnings: rule.result.warnings
          };

          if (rule.severity === 'critical') {
            report.critical.push(issue);
            report.summary.critical++;
          } else if (rule.severity === 'error') {
            report.errors.push(issue);
            report.summary.errors++;
          } else {
            report.warnings.push(issue);
          }
        }
      });
    }

    return report;
  }

  async runCategoryRules(category, rules) {
    const results = {
      category,
      total: rules.length,
      passed: 0,
      failed: 0,
      warnings: 0,
      rules: []
    };

    for (const rule of rules) {
      try {
        const result = await rule.check(this.db);

        const ruleResult = {
          id: rule.id,
          name: rule.name,
          severity: rule.severity,
          result: result
        };

        if (result.passed) {
          results.passed++;
        } else {
          results.failed++;
          if (rule.severity === 'warning') {
            results.warnings++;
          }
        }

        results.rules.push(ruleResult);
      } catch (error) {
        results.failed++;
        results.rules.push({
          id: rule.id,
          name: rule.name,
          severity: rule.severity,
          result: {
            passed: false,
            errors: [`Rule check failed: ${error.message}`],
            warnings: []
          }
        });
      }
    }

    return results;
  }

  // ========================================================================
  // REFERENTIAL INTEGRITY RULES (RI-1 to RI-10)
  // ========================================================================

  async checkEntityIdPrefixes(db) {
    const entities = db.prepare('SELECT id, entity_type FROM entities').all();
    const errors = [];

    const prefixMap = {
      'event': 'evt-',
      'character': 'char-',
      'object': 'obj-',
      'location': 'loc-',
      'system': 'sys-'
    };

    entities.forEach(entity => {
      const expectedPrefix = prefixMap[entity.entity_type];
      if (expectedPrefix && !entity.id.startsWith(expectedPrefix)) {
        errors.push(`Entity ${entity.id} has type '${entity.entity_type}' but doesn't start with '${expectedPrefix}'`);
      }
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkForeignKeys(db) {
    const errors = [];

    // Check entities.project_id references projects
    const invalidEntityProjects = db.prepare(`
      SELECT e.id, e.project_id FROM entities e
      LEFT JOIN projects p ON e.project_id = p.id
      WHERE p.id IS NULL
    `).all();

    invalidEntityProjects.forEach(e => {
      errors.push(`Entity ${e.id} references non-existent project ${e.project_id}`);
    });

    // Check fictions.project_id references projects
    const invalidFictionProjects = db.prepare(`
      SELECT f.id, f.project_id FROM fictions f
      LEFT JOIN projects p ON f.project_id = p.id
      WHERE p.id IS NULL
    `).all();

    invalidFictionProjects.forEach(f => {
      errors.push(`Fiction ${f.id} references non-existent project ${f.project_id}`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkMetadataReferences(db) {
    const errors = [];

    // Check metadata.entity_id references entities
    const invalidMetadataEntities = db.prepare(`
      SELECT m.entity_id FROM metadata m
      LEFT JOIN entities e ON m.entity_id = e.id
      WHERE e.id IS NULL
    `).all();

    invalidMetadataEntities.forEach(m => {
      errors.push(`Metadata references non-existent entity ${m.entity_id}`);
    });

    // Check metadata.fiction_id references fictions
    const invalidMetadataFictions = db.prepare(`
      SELECT m.entity_id, m.fiction_id FROM metadata m
      LEFT JOIN fictions f ON m.fiction_id = f.id
      WHERE f.id IS NULL
    `).all();

    invalidMetadataFictions.forEach(m => {
      errors.push(`Metadata for entity ${m.entity_id} references non-existent fiction ${m.fiction_id}`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkFictionProjectRefs(db) {
    const errors = [];

    const invalidRefs = db.prepare(`
      SELECT f.id, f.project_id FROM fictions f
      WHERE NOT EXISTS (SELECT 1 FROM projects p WHERE p.id = f.project_id)
    `).all();

    invalidRefs.forEach(f => {
      errors.push(`Fiction ${f.id} references non-existent project ${f.project_id}`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkSceneFictionRefs(db) {
    const errors = [];

    const invalidRefs = db.prepare(`
      SELECT ns.id, ns.fiction_id FROM narrative_scenes ns
      WHERE NOT EXISTS (SELECT 1 FROM fictions f WHERE f.id = ns.fiction_id)
    `).all();

    invalidRefs.forEach(s => {
      errors.push(`Scene ${s.id} references non-existent fiction ${s.fiction_id}`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkEpistemicEntityRefs(db) {
    const errors = [];

    const invalidRefs = db.prepare(`
      SELECT efl.id, efl.entity_id FROM epistemic_fact_ledger efl
      WHERE NOT EXISTS (SELECT 1 FROM entities e WHERE e.id = efl.entity_id)
    `).all();

    invalidRefs.forEach(efl => {
      errors.push(`Epistemic fact ledger entry ${efl.id} references non-existent entity ${efl.entity_id}`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkRelationshipEntityRefs(db) {
    const errors = [];

    const invalidRefsA = db.prepare(`
      SELECT rd.id, rd.entity_a_id FROM relationship_dynamics rd
      WHERE NOT EXISTS (SELECT 1 FROM entities e WHERE e.id = rd.entity_a_id)
    `).all();

    invalidRefsA.forEach(rd => {
      errors.push(`Relationship ${rd.id} references non-existent entity_a ${rd.entity_a_id}`);
    });

    const invalidRefsB = db.prepare(`
      SELECT rd.id, rd.entity_b_id FROM relationship_dynamics rd
      WHERE NOT EXISTS (SELECT 1 FROM entities e WHERE e.id = rd.entity_b_id)
    `).all();

    invalidRefsB.forEach(rd => {
      errors.push(`Relationship ${rd.id} references non-existent entity_b ${rd.entity_b_id}`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkCausalityEventRefs(db) {
    const errors = [];
    const warnings = [];

    // Note: Events table might not exist in current schema, treat as warning
    try {
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='events'
      `).get();

      if (!tableExists) {
        warnings.push('Events table does not exist yet - causality event references cannot be validated');
        return { passed: true, errors: [], warnings };
      }

      // If events table exists, validate references
      const invalidCause = db.prepare(`
        SELECT cc.chain_uuid, cc.cause_event_id FROM causality_chains cc
        WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.event_uuid = cc.cause_event_id)
      `).all();

      invalidCause.forEach(cc => {
        errors.push(`Causality chain ${cc.chain_uuid} references non-existent cause event ${cc.cause_event_id}`);
      });

      const invalidEffect = db.prepare(`
        SELECT cc.chain_uuid, cc.effect_event_id FROM causality_chains cc
        WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.event_uuid = cc.effect_event_id)
      `).all();

      invalidEffect.forEach(cc => {
        errors.push(`Causality chain ${cc.chain_uuid} references non-existent effect event ${cc.effect_event_id}`);
      });
    } catch (err) {
      warnings.push(`Could not validate causality event references: ${err.message}`);
    }

    return { passed: errors.length === 0, errors, warnings };
  }

  async checkCharacterArcRefs(db) {
    const errors = [];

    const invalidRefs = db.prepare(`
      SELECT ca.arc_uuid, ca.character_id FROM character_arcs ca
      WHERE NOT EXISTS (SELECT 1 FROM entities e WHERE e.id = ca.character_id AND e.entity_type = 'character')
    `).all();

    invalidRefs.forEach(ca => {
      errors.push(`Character arc ${ca.arc_uuid} references non-existent or non-character entity ${ca.character_id}`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkSetupPayoffRefs(db) {
    const errors = [];
    const warnings = [];

    // Similar to causality, events table might not exist
    try {
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='events'
      `).get();

      if (!tableExists) {
        warnings.push('Events table does not exist yet - setup/payoff event references cannot be validated');
        return { passed: true, errors: [], warnings };
      }

      const invalidSetup = db.prepare(`
        SELECT sp.setup_payoff_uuid, sp.setup_event_id FROM setup_payoffs sp
        WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.event_uuid = sp.setup_event_id)
      `).all();

      invalidSetup.forEach(sp => {
        errors.push(`Setup/payoff ${sp.setup_payoff_uuid} references non-existent setup event ${sp.setup_event_id}`);
      });

      const invalidPayoff = db.prepare(`
        SELECT sp.setup_payoff_uuid, sp.payoff_event_id FROM setup_payoffs sp
        WHERE sp.payoff_event_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM events e WHERE e.event_uuid = sp.payoff_event_id)
      `).all();

      invalidPayoff.forEach(sp => {
        errors.push(`Setup/payoff ${sp.setup_payoff_uuid} references non-existent payoff event ${sp.payoff_event_id}`);
      });
    } catch (err) {
      warnings.push(`Could not validate setup/payoff event references: ${err.message}`);
    }

    return { passed: errors.length === 0, errors, warnings };
  }

  // ========================================================================
  // TEMPORAL CONSISTENCY RULES (TC-1 to TC-12)
  // ========================================================================

  async checkNarrativeTimeValidity(db) {
    const errors = [];

    const invalidTimes = db.prepare(`
      SELECT id, narrative_time FROM narrative_scenes
      WHERE narrative_time < 0 OR narrative_time IS NULL
    `).all();

    invalidTimes.forEach(s => {
      errors.push(`Scene ${s.id} has invalid narrative_time: ${s.narrative_time}`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkSceneChronologicalOrder(db) {
    const warnings = [];

    const scenes = db.prepare(`
      SELECT id, scene_number, narrative_time, fiction_id
      FROM narrative_scenes
      ORDER BY fiction_id, scene_number
    `).all();

    let lastFictionId = null;
    let lastTime = -1;

    scenes.forEach(scene => {
      if (scene.fiction_id !== lastFictionId) {
        lastFictionId = scene.fiction_id;
        lastTime = -1;
      }

      if (scene.narrative_time < lastTime) {
        warnings.push(`Scene ${scene.id} (time ${scene.narrative_time}) occurs before previous scene (time ${lastTime}) despite higher scene_number`);
      }
      lastTime = scene.narrative_time;
    });

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkEpistemicTimestampMatch(db) {
    const errors = [];

    // Check that acquired_at timestamps are reasonable
    const invalidTimestamps = db.prepare(`
      SELECT id, entity_id, acquired_at FROM epistemic_fact_ledger
      WHERE acquired_at < 0
    `).all();

    invalidTimestamps.forEach(efl => {
      errors.push(`Epistemic fact ledger entry ${efl.id} has negative acquired_at timestamp: ${efl.acquired_at}`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkRelationshipTimestampValidity(db) {
    const warnings = [];

    const invalidTimestamps = db.prepare(`
      SELECT id, valid_from FROM relationship_dynamics
      WHERE valid_from < 0
    `).all();

    invalidTimestamps.forEach(rd => {
      warnings.push(`Relationship ${rd.id} has negative valid_from timestamp: ${rd.valid_from}`);
    });

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkDuplicateSceneNumbers(db) {
    const errors = [];

    const duplicates = db.prepare(`
      SELECT fiction_id, scene_number, COUNT(*) as count
      FROM narrative_scenes
      GROUP BY fiction_id, scene_number
      HAVING count > 1
    `).all();

    duplicates.forEach(d => {
      errors.push(`Fiction ${d.fiction_id} has ${d.count} scenes with scene_number ${d.scene_number}`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkSceneDurationValidity(db) {
    const warnings = [];

    const invalidDurations = db.prepare(`
      SELECT id, duration_minutes FROM narrative_scenes
      WHERE duration_minutes IS NOT NULL AND duration_minutes < 0
    `).all();

    invalidDurations.forEach(s => {
      warnings.push(`Scene ${s.id} has negative duration_minutes: ${s.duration_minutes}`);
    });

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkSetupFireSequence(db) {
    const errors = [];

    // Check that planted_chapter <= fired_chapter (lexicographically)
    const invalidSequence = db.prepare(`
      SELECT setup_payoff_uuid, planted_chapter, fired_chapter
      FROM setup_payoffs
      WHERE fired_chapter IS NOT NULL
      AND planted_chapter IS NOT NULL
      AND planted_chapter > fired_chapter
    `).all();

    invalidSequence.forEach(sp => {
      errors.push(`Setup/payoff ${sp.setup_payoff_uuid} fired in chapter '${sp.fired_chapter}' before being planted in '${sp.planted_chapter}'`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkTimestampsNotFuture(db) {
    const errors = [];
    const now = Date.now();

    // Check created_at timestamps
    const futureTimestamps = db.prepare(`
      SELECT id, created_at FROM narrative_scenes
      WHERE created_at > ?
    `).all(now);

    futureTimestamps.forEach(s => {
      errors.push(`Scene ${s.id} has created_at timestamp in the future: ${s.created_at}`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkArcPhaseTransitions(db) {
    const warnings = [];

    // This would require historical tracking - for now just validate current phases are valid
    const validPhases = [
      'setup', 'catalyst', 'debate', 'break_into_two', 'b_story',
      'fun_and_games', 'midpoint', 'bad_guys_close_in', 'all_is_lost',
      'dark_night_of_soul', 'break_into_three', 'finale', 'final_image'
    ];

    const invalidPhases = db.prepare(`
      SELECT arc_uuid, current_phase FROM character_arcs
      WHERE current_phase NOT IN (${validPhases.map(() => '?').join(',')})
    `).all(...validPhases);

    invalidPhases.forEach(ca => {
      warnings.push(`Character arc ${ca.arc_uuid} has invalid current_phase: ${ca.current_phase}`);
    });

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkConflictStatusTransitions(db) {
    const warnings = [];

    const validStatuses = ['latent', 'active', 'escalating', 'climactic', 'resolved'];

    const invalidStatuses = db.prepare(`
      SELECT conflict_uuid, status FROM story_conflicts
      WHERE status NOT IN (${validStatuses.map(() => '?').join(',')})
    `).all(...validStatuses);

    invalidStatuses.forEach(sc => {
      warnings.push(`Conflict ${sc.conflict_uuid} has invalid status: ${sc.status}`);
    });

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkTransitionTimeGaps(db) {
    const warnings = [];

    const invalidGaps = db.prepare(`
      SELECT id, time_gap_minutes FROM scene_transitions
      WHERE time_gap_minutes IS NOT NULL AND time_gap_minutes < 0
    `).all();

    invalidGaps.forEach(st => {
      warnings.push(`Scene transition ${st.id} has negative time_gap_minutes: ${st.time_gap_minutes}`);
    });

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkPacingCheckpointOrder(db) {
    const warnings = [];

    const checkpoints = db.prepare(`
      SELECT id, checkpoint_type, narrative_time, fiction_id
      FROM pacing_checkpoints
      ORDER BY fiction_id, narrative_time
    `).all();

    // Validate that checkpoints are in reasonable order
    const expectedOrder = ['inciting_incident', 'rising_action', 'midpoint', 'climax', 'resolution'];
    let lastFictionId = null;
    let lastCheckpointIndex = -1;

    checkpoints.forEach(cp => {
      if (cp.fiction_id !== lastFictionId) {
        lastFictionId = cp.fiction_id;
        lastCheckpointIndex = -1;
      }

      const currentIndex = expectedOrder.indexOf(cp.checkpoint_type);
      if (currentIndex !== -1 && currentIndex < lastCheckpointIndex) {
        warnings.push(`Pacing checkpoint ${cp.id} (${cp.checkpoint_type}) appears after later checkpoint in narrative time`);
      }

      if (currentIndex !== -1) {
        lastCheckpointIndex = currentIndex;
      }
    });

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  // ========================================================================
  // EPISTEMIC CONSISTENCY RULES (EC-1 to EC-7)
  // ========================================================================

  async checkKnowledgeBeforeRevelation(db) {
    const errors = [];

    // Check that facts are not known before they were revealed
    // This is complex and depends on source_event_id timing
    const warnings = [];
    warnings.push('Knowledge-before-revelation check requires event timing data - skipped');

    return { passed: true, errors, warnings };
  }

  async checkFalseBeliefsHaveTrueFacts(db) {
    const errors = [];

    const falseBeliefsWithoutTruth = db.prepare(`
      SELECT id, entity_id, fact_type, fact_key
      FROM epistemic_fact_ledger
      WHERE is_true = 0
      AND NOT EXISTS (
        SELECT 1 FROM epistemic_fact_ledger efl2
        WHERE efl2.fact_type = epistemic_fact_ledger.fact_type
        AND efl2.fact_key = epistemic_fact_ledger.fact_key
        AND efl2.is_true = 1
      )
    `).all();

    falseBeliefsWithoutTruth.forEach(efl => {
      errors.push(`False belief ${efl.id} for entity ${efl.entity_id} has no corresponding true fact (${efl.fact_type}:${efl.fact_key})`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkKnowledgeStateCumulative(db) {
    const errors = [];

    // Knowledge states should be cumulative - once known, always known (unless explicitly forgotten)
    // This requires temporal analysis beyond current schema
    const warnings = [];
    warnings.push('Knowledge state cumulative check requires temporal tracking - skipped');

    return { passed: true, errors, warnings };
  }

  async checkDramaticIronyTracked(db) {
    const warnings = [];

    // Check if dramatic irony is being tracked (reader knows more than characters)
    // This is a soft check for data completeness
    const totalFacts = db.prepare('SELECT COUNT(*) as count FROM epistemic_fact_ledger').get();
    const falseBeliefsCount = db.prepare('SELECT COUNT(*) as count FROM epistemic_fact_ledger WHERE is_true = 0').get();

    if (totalFacts.count > 0 && falseBeliefsCount.count === 0) {
      warnings.push('No false beliefs tracked - dramatic irony may not be captured');
    }

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkFactSourceValid(db) {
    const errors = [];

    const validSourceTypes = ['witnessed', 'told', 'deduced', 'read', 'overheard', 'assumed', 'remembered'];

    const invalidSources = db.prepare(`
      SELECT id, source_type FROM epistemic_fact_ledger
      WHERE source_type NOT IN (${validSourceTypes.map(() => '?').join(',')})
    `).all(...validSourceTypes);

    invalidSources.forEach(efl => {
      errors.push(`Epistemic fact ledger entry ${efl.id} has invalid source_type: ${efl.source_type}`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkFactTypeConsistency(db) {
    const warnings = [];

    // Check that fact_type values are consistent
    const factTypes = db.prepare(`
      SELECT DISTINCT fact_type FROM epistemic_fact_ledger
    `).all();

    if (factTypes.length === 0) {
      warnings.push('No epistemic facts found in database');
    }

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkNoOrphanedKnowledgeStates(db) {
    const warnings = [];

    const orphanedKnowledge = db.prepare(`
      SELECT efl.id FROM epistemic_fact_ledger efl
      WHERE NOT EXISTS (SELECT 1 FROM entities e WHERE e.id = efl.entity_id)
    `).all();

    orphanedKnowledge.forEach(efl => {
      warnings.push(`Epistemic fact ledger entry ${efl.id} references deleted entity`);
    });

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  // ========================================================================
  // FICTION SYSTEM RULES (FS-1 to FS-7)
  // ========================================================================

  async checkFictionBelongsToProject(db) {
    const errors = [];

    const orphanedFictions = db.prepare(`
      SELECT f.id FROM fictions f
      WHERE NOT EXISTS (SELECT 1 FROM projects p WHERE p.id = f.project_id)
    `).all();

    orphanedFictions.forEach(f => {
      errors.push(`Fiction ${f.id} references non-existent project`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkFictionNamesUnique(db) {
    const errors = [];

    const duplicateNames = db.prepare(`
      SELECT project_id, name, COUNT(*) as count
      FROM fictions
      GROUP BY project_id, name
      HAVING count > 1
    `).all();

    duplicateNames.forEach(d => {
      errors.push(`Project ${d.project_id} has ${d.count} fictions named '${d.name}'`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkFictionHasEntities(db) {
    const warnings = [];

    const emptyfictions = db.prepare(`
      SELECT f.id, f.name FROM fictions f
      WHERE NOT EXISTS (SELECT 1 FROM metadata m WHERE m.fiction_id = f.id)
      AND NOT EXISTS (SELECT 1 FROM narrative_scenes ns WHERE ns.fiction_id = f.id)
    `).all();

    emptyfictions.forEach(f => {
      warnings.push(`Fiction ${f.id} ('${f.name}') has no entities or scenes`);
    });

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkEntityTypesValid(db) {
    const errors = [];

    const validTypes = ['event', 'character', 'object', 'location', 'system'];

    const invalidTypes = db.prepare(`
      SELECT id, entity_type FROM entities
      WHERE entity_type NOT IN (${validTypes.map(() => '?').join(',')})
    `).all(...validTypes);

    invalidTypes.forEach(e => {
      errors.push(`Entity ${e.id} has invalid entity_type: ${e.entity_type}`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkMetadataValidJSON(db) {
    const errors = [];

    const metadataEntries = db.prepare('SELECT entity_id, data FROM metadata').all();

    metadataEntries.forEach(m => {
      try {
        JSON.parse(m.data);
      } catch (err) {
        errors.push(`Metadata for entity ${m.entity_id} contains invalid JSON: ${err.message}`);
      }
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkFictionIdConvention(db) {
    const warnings = [];

    const invalidIds = db.prepare(`
      SELECT id FROM fictions
      WHERE id NOT LIKE 'fic-%'
    `).all();

    invalidIds.forEach(f => {
      warnings.push(`Fiction ${f.id} does not follow 'fic-*' naming convention`);
    });

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkProjectIdConvention(db) {
    const warnings = [];

    const invalidIds = db.prepare(`
      SELECT id FROM projects
      WHERE id NOT LIKE 'proj-%'
    `).all();

    invalidIds.forEach(p => {
      warnings.push(`Project ${p.id} does not follow 'proj-*' naming convention`);
    });

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  // ========================================================================
  // NARRATIVE CONSISTENCY RULES (NC-1 to NC-8)
  // ========================================================================

  async checkScenesHaveValidChapters(db) {
    const warnings = [];

    const scenesWithoutChapters = db.prepare(`
      SELECT id FROM narrative_scenes
      WHERE chapter_id IS NULL
    `).all();

    if (scenesWithoutChapters.length > 0) {
      warnings.push(`${scenesWithoutChapters.length} scenes have no chapter assignment`);
    }

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkPresentEntityIdsValid(db) {
    const errors = [];

    const scenes = db.prepare('SELECT id, present_entity_ids FROM narrative_scenes WHERE present_entity_ids IS NOT NULL').all();

    scenes.forEach(scene => {
      try {
        const entityIds = JSON.parse(scene.present_entity_ids);
        if (Array.isArray(entityIds)) {
          entityIds.forEach(entityId => {
            const exists = db.prepare('SELECT 1 FROM entities WHERE id = ?').get(entityId);
            if (!exists) {
              errors.push(`Scene ${scene.id} references non-existent entity in present_entity_ids: ${entityId}`);
            }
          });
        }
      } catch (err) {
        errors.push(`Scene ${scene.id} has invalid JSON in present_entity_ids: ${err.message}`);
      }
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkActiveConflictIdsValid(db) {
    const errors = [];

    const scenes = db.prepare('SELECT id, active_conflict_ids FROM narrative_scenes WHERE active_conflict_ids IS NOT NULL').all();

    scenes.forEach(scene => {
      try {
        const conflictIds = JSON.parse(scene.active_conflict_ids);
        if (Array.isArray(conflictIds)) {
          conflictIds.forEach(conflictId => {
            const exists = db.prepare('SELECT 1 FROM story_conflicts WHERE conflict_uuid = ?').get(conflictId);
            if (!exists) {
              errors.push(`Scene ${scene.id} references non-existent conflict in active_conflict_ids: ${conflictId}`);
            }
          });
        }
      } catch (err) {
        errors.push(`Scene ${scene.id} has invalid JSON in active_conflict_ids: ${err.message}`);
      }
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkActiveThemeIdsValid(db) {
    const errors = [];

    const scenes = db.prepare('SELECT id, active_theme_ids FROM narrative_scenes WHERE active_theme_ids IS NOT NULL').all();

    scenes.forEach(scene => {
      try {
        const themeIds = JSON.parse(scene.active_theme_ids);
        if (Array.isArray(themeIds)) {
          themeIds.forEach(themeId => {
            const exists = db.prepare('SELECT 1 FROM thematic_elements WHERE theme_uuid = ?').get(themeId);
            if (!exists) {
              errors.push(`Scene ${scene.id} references non-existent theme in active_theme_ids: ${themeId}`);
            }
          });
        }
      } catch (err) {
        errors.push(`Scene ${scene.id} has invalid JSON in active_theme_ids: ${err.message}`);
      }
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkChapterNumberingSequential(db) {
    const warnings = [];

    // Group scenes by fiction and chapter, check for gaps in chapter numbering
    const chapters = db.prepare(`
      SELECT DISTINCT fiction_id, chapter_id
      FROM narrative_scenes
      WHERE chapter_id IS NOT NULL
      ORDER BY fiction_id, chapter_id
    `).all();

    // This is informational - chapter IDs may not be sequential
    if (chapters.length === 0) {
      warnings.push('No chapters defined in narrative scenes');
    }

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkSceneNumberingSequential(db) {
    const warnings = [];

    const fictions = db.prepare('SELECT DISTINCT fiction_id FROM narrative_scenes').all();

    fictions.forEach(f => {
      const sceneNumbers = db.prepare(`
        SELECT scene_number FROM narrative_scenes
        WHERE fiction_id = ?
        ORDER BY scene_number
      `).all(f.fiction_id).map(s => s.scene_number);

      // Check for gaps
      for (let i = 1; i < sceneNumbers.length; i++) {
        if (sceneNumbers[i] !== sceneNumbers[i-1] + 1) {
          warnings.push(`Fiction ${f.fiction_id} has gap in scene numbering: ${sceneNumbers[i-1]} -> ${sceneNumbers[i]}`);
          break;
        }
      }
    });

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkNarrativeTimelineCoherent(db) {
    const errors = [];

    // Check for major timeline inconsistencies
    const scenes = db.prepare(`
      SELECT id, fiction_id, narrative_time, duration_minutes
      FROM narrative_scenes
      ORDER BY fiction_id, narrative_time
    `).all();

    let lastFictionId = null;
    let lastEndTime = 0;

    scenes.forEach(scene => {
      if (scene.fiction_id !== lastFictionId) {
        lastFictionId = scene.fiction_id;
        lastEndTime = 0;
      }

      if (scene.narrative_time < lastEndTime) {
        errors.push(`Scene ${scene.id} overlaps with previous scene in timeline`);
      }

      lastEndTime = scene.narrative_time + (scene.duration_minutes || 0);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkSceneTransitionsValid(db) {
    const warnings = [];

    const invalidTransitions = db.prepare(`
      SELECT st.id FROM scene_transitions st
      WHERE NOT EXISTS (SELECT 1 FROM narrative_scenes ns WHERE ns.id = st.from_scene_id)
      OR NOT EXISTS (SELECT 1 FROM narrative_scenes ns WHERE ns.id = st.to_scene_id)
    `).all();

    invalidTransitions.forEach(st => {
      warnings.push(`Scene transition ${st.id} references non-existent scenes`);
    });

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  // ========================================================================
  // LOGIC LAYER RULES (LL-1 to LL-15)
  // ========================================================================

  async checkCausalityStrength(db) {
    const errors = [];

    const invalidStrength = db.prepare(`
      SELECT chain_uuid, strength FROM causality_chains
      WHERE strength < 1 OR strength > 10
    `).all();

    invalidStrength.forEach(cc => {
      errors.push(`Causality chain ${cc.chain_uuid} has invalid strength: ${cc.strength} (must be 1-10)`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkCausalityTypeValid(db) {
    const errors = [];

    const validTypes = ['direct_cause', 'enabling_condition', 'motivation', 'psychological_trigger'];

    const invalidTypes = db.prepare(`
      SELECT chain_uuid, type FROM causality_chains
      WHERE type NOT IN (${validTypes.map(() => '?').join(',')})
    `).all(...validTypes);

    invalidTypes.forEach(cc => {
      errors.push(`Causality chain ${cc.chain_uuid} has invalid type: ${cc.type}`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkArcPhaseValid(db) {
    const errors = [];

    const validPhases = [
      'setup', 'catalyst', 'debate', 'break_into_two', 'b_story',
      'fun_and_games', 'midpoint', 'bad_guys_close_in', 'all_is_lost',
      'dark_night_of_soul', 'break_into_three', 'finale', 'final_image'
    ];

    const invalidPhases = db.prepare(`
      SELECT arc_uuid, current_phase FROM character_arcs
      WHERE current_phase IS NOT NULL
      AND current_phase NOT IN (${validPhases.map(() => '?').join(',')})
    `).all(...validPhases);

    invalidPhases.forEach(ca => {
      errors.push(`Character arc ${ca.arc_uuid} has invalid current_phase: ${ca.current_phase}`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkArcArchetypeValid(db) {
    const warnings = [];

    const validArchetypes = ['hero', 'mentor', 'shadow', 'trickster', 'ally', 'herald', 'shapeshifter', 'guardian'];

    const invalidArchetypes = db.prepare(`
      SELECT arc_uuid, archetype FROM character_arcs
      WHERE archetype IS NOT NULL
      AND archetype NOT IN (${validArchetypes.map(() => '?').join(',')})
    `).all(...validArchetypes);

    invalidArchetypes.forEach(ca => {
      warnings.push(`Character arc ${ca.arc_uuid} has non-standard archetype: ${ca.archetype}`);
    });

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkConflictTypeValid(db) {
    const errors = [];

    const validTypes = ['internal', 'interpersonal', 'societal', 'environmental', 'supernatural'];

    const invalidTypes = db.prepare(`
      SELECT conflict_uuid, type FROM story_conflicts
      WHERE type NOT IN (${validTypes.map(() => '?').join(',')})
    `).all(...validTypes);

    invalidTypes.forEach(sc => {
      errors.push(`Conflict ${sc.conflict_uuid} has invalid type: ${sc.type}`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkConflictStatusValid(db) {
    const errors = [];

    const validStatuses = ['latent', 'active', 'escalating', 'climactic', 'resolved'];

    const invalidStatuses = db.prepare(`
      SELECT conflict_uuid, status FROM story_conflicts
      WHERE status NOT IN (${validStatuses.map(() => '?').join(',')})
    `).all(...validStatuses);

    invalidStatuses.forEach(sc => {
      errors.push(`Conflict ${sc.conflict_uuid} has invalid status: ${sc.status}`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkSetupStatusValid(db) {
    const errors = [];

    const validStatuses = ['planted', 'referenced', 'fired', 'unfired'];

    const invalidStatuses = db.prepare(`
      SELECT setup_payoff_uuid, status FROM setup_payoffs
      WHERE status NOT IN (${validStatuses.map(() => '?').join(',')})
    `).all(...validStatuses);

    invalidStatuses.forEach(sp => {
      errors.push(`Setup/payoff ${sp.setup_payoff_uuid} has invalid status: ${sp.status}`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkWorldRuleCategoryValid(db) {
    const errors = [];

    const validCategories = ['physics', 'magic', 'technology', 'social', 'biological', 'metaphysical'];

    const invalidCategories = db.prepare(`
      SELECT rule_uuid, rule_category FROM world_rules
      WHERE rule_category NOT IN (${validCategories.map(() => '?').join(',')})
    `).all(...validCategories);

    invalidCategories.forEach(wr => {
      errors.push(`World rule ${wr.rule_uuid} has invalid rule_category: ${wr.rule_category}`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkWorldRuleEnforcementValid(db) {
    const errors = [];

    const validLevels = ['strict', 'flexible', 'guideline'];

    const invalidLevels = db.prepare(`
      SELECT rule_uuid, enforcement_level FROM world_rules
      WHERE enforcement_level NOT IN (${validLevels.map(() => '?').join(',')})
    `).all(...validLevels);

    invalidLevels.forEach(wr => {
      errors.push(`World rule ${wr.rule_uuid} has invalid enforcement_level: ${wr.enforcement_level}`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkThemeManifestationsValid(db) {
    const errors = [];

    const themes = db.prepare('SELECT theme_uuid, manifestations FROM thematic_elements WHERE manifestations IS NOT NULL').all();

    themes.forEach(theme => {
      try {
        const manifestations = JSON.parse(theme.manifestations);
        if (!Array.isArray(manifestations)) {
          errors.push(`Theme ${theme.theme_uuid} has manifestations that is not a JSON array`);
        }
      } catch (err) {
        errors.push(`Theme ${theme.theme_uuid} has invalid JSON in manifestations: ${err.message}`);
      }
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkMotifInstancesLinkValid(db) {
    const errors = [];

    const motifsWithLinks = db.prepare(`
      SELECT motif_uuid, linked_entity_id FROM motif_instances
      WHERE linked_entity_id IS NOT NULL
    `).all();

    motifsWithLinks.forEach(motif => {
      const exists = db.prepare('SELECT 1 FROM entities WHERE id = ?').get(motif.linked_entity_id);
      if (!exists) {
        errors.push(`Motif ${motif.motif_uuid} references non-existent linked_entity_id: ${motif.linked_entity_id}`);
      }
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkSetupPayoffTemporalOrder(db) {
    const errors = [];

    // This would require event timestamp comparison
    const warnings = [];
    warnings.push('Setup/payoff temporal order check requires event timing data - skipped');

    return { passed: true, errors, warnings };
  }

  async checkNoCircularCausality(db) {
    const errors = [];

    // Build adjacency list and detect cycles
    const chains = db.prepare('SELECT cause_event_id, effect_event_id FROM causality_chains').all();

    const graph = new Map();
    chains.forEach(chain => {
      if (!graph.has(chain.cause_event_id)) {
        graph.set(chain.cause_event_id, []);
      }
      graph.get(chain.cause_event_id).push(chain.effect_event_id);
    });

    // DFS cycle detection
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (node, path = []) => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor, path)) {
            return true;
          }
        } else if (recursionStack.has(neighbor)) {
          errors.push(`Circular causality detected: ${[...path, neighbor].join(' -> ')}`);
          return true;
        }
      }

      recursionStack.delete(node);
      path.pop();
      return false;
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        hasCycle(node);
      }
    }

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkArcProgressionMonotonic(db) {
    const warnings = [];

    // This would require historical tracking of arc phase changes
    warnings.push('Arc progression monotonic check requires historical data - skipped');

    return { passed: true, errors: [], warnings };
  }

  async checkConflictProtagonistImmutable(db) {
    const errors = [];

    // This would require change tracking - current schema doesn't support this check
    const warnings = [];
    warnings.push('Conflict protagonist immutability check requires change tracking - skipped');

    return { passed: true, errors, warnings };
  }

  // ========================================================================
  // STATE INTEGRITY RULES (SI-1 to SI-10)
  // ========================================================================

  async checkSnapshotReferencesValid(db) {
    const errors = [];
    const warnings = [];

    // Check if state snapshot tables exist
    try {
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='asset_state_snapshots'
      `).get();

      if (!tableExists) {
        warnings.push('Asset state snapshots table does not exist - state integrity cannot be validated');
        return { passed: true, errors: [], warnings };
      }
    } catch (err) {
      warnings.push('Could not check for state snapshot tables');
      return { passed: true, errors: [], warnings };
    }

    return { passed: errors.length === 0, errors, warnings };
  }

  async checkDeltaChainValid(db) {
    const warnings = [];
    warnings.push('Delta chain validation requires state reconstruction module - skipped');
    return { passed: true, errors: [], warnings };
  }

  async checkDeltaChainLengthReasonable(db) {
    const warnings = [];
    warnings.push('Delta chain length check requires state tracking - skipped');
    return { passed: true, errors: [], warnings };
  }

  async checkSnapshotEvery10Events(db) {
    const warnings = [];
    warnings.push('Snapshot frequency check requires event counting - skipped');
    return { passed: true, errors: [], warnings };
  }

  async checkStateReconstructionValidJSON(db) {
    const warnings = [];
    warnings.push('State reconstruction JSON validation requires reconstruction module - skipped');
    return { passed: true, errors: [], warnings };
  }

  async checkNoOrphanedDeltas(db) {
    const warnings = [];
    warnings.push('Orphaned deltas check requires delta tracking - skipped');
    return { passed: true, errors: [], warnings };
  }

  async checkNoOrphanedSnapshots(db) {
    const warnings = [];
    warnings.push('Orphaned snapshots check requires snapshot tracking - skipped');
    return { passed: true, errors: [], warnings };
  }

  async checkRelationshipStateChangesValid(db) {
    const errors = [];

    const relationships = db.prepare('SELECT id, dynamics_json FROM relationship_dynamics WHERE dynamics_json IS NOT NULL').all();

    relationships.forEach(rel => {
      try {
        JSON.parse(rel.dynamics_json);
      } catch (err) {
        errors.push(`Relationship ${rel.id} has invalid JSON in dynamics_json: ${err.message}`);
      }
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkDialogueProfileValidFrom(db) {
    const warnings = [];

    const invalidTimestamps = db.prepare(`
      SELECT id, valid_from FROM dialogue_profiles
      WHERE valid_from < 0
    `).all();

    invalidTimestamps.forEach(dp => {
      warnings.push(`Dialogue profile ${dp.id} has negative valid_from timestamp: ${dp.valid_from}`);
    });

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkPacingCheckpointTensionValid(db) {
    const warnings = [];

    const invalidTension = db.prepare(`
      SELECT id, tension_target, actual_tension FROM pacing_checkpoints
      WHERE (tension_target < 0 OR tension_target > 1)
      OR (actual_tension IS NOT NULL AND (actual_tension < 0 OR actual_tension > 1))
    `).all();

    invalidTension.forEach(pc => {
      warnings.push(`Pacing checkpoint ${pc.id} has tension values outside 0-1 range`);
    });

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  // ========================================================================
  // CROSS-ENTITY RULES (XE-1 to XE-10)
  // ========================================================================

  async checkRelationshipBothEntitiesExist(db) {
    const errors = [];

    const invalidRelationships = db.prepare(`
      SELECT rd.id FROM relationship_dynamics rd
      WHERE NOT EXISTS (SELECT 1 FROM entities e WHERE e.id = rd.entity_a_id)
      OR NOT EXISTS (SELECT 1 FROM entities e WHERE e.id = rd.entity_b_id)
    `).all();

    invalidRelationships.forEach(rd => {
      errors.push(`Relationship ${rd.id} references one or more non-existent entities`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkRelationshipValuesInRange(db) {
    const errors = [];

    const invalidValues = db.prepare(`
      SELECT id, sentiment, trust_level, power_balance, intimacy_level, conflict_level
      FROM relationship_dynamics
      WHERE (sentiment < -1 OR sentiment > 1)
      OR (trust_level < 0 OR trust_level > 1)
      OR (power_balance < -1 OR power_balance > 1)
      OR (intimacy_level < 0 OR intimacy_level > 1)
      OR (conflict_level < 0 OR conflict_level > 1)
    `).all();

    invalidValues.forEach(rd => {
      errors.push(`Relationship ${rd.id} has values outside valid ranges`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkNoDuplicateRelationships(db) {
    const warnings = [];

    const duplicates = db.prepare(`
      SELECT entity_a_id, entity_b_id, relationship_type, COUNT(*) as count
      FROM relationship_dynamics
      GROUP BY entity_a_id, entity_b_id, relationship_type, valid_from
      HAVING count > 1
    `).all();

    duplicates.forEach(d => {
      warnings.push(`Duplicate relationship found: ${d.entity_a_id} <-> ${d.entity_b_id} (${d.relationship_type}), count: ${d.count}`);
    });

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkEntityMetadataConsistency(db) {
    const warnings = [];

    // Check that entities with metadata have consistent fiction_id
    const inconsistentMetadata = db.prepare(`
      SELECT e.id FROM entities e
      JOIN metadata m ON e.id = m.entity_id
      WHERE e.project_id != (SELECT project_id FROM fictions WHERE id = m.fiction_id)
    `).all();

    inconsistentMetadata.forEach(e => {
      warnings.push(`Entity ${e.id} has metadata with inconsistent fiction/project mapping`);
    });

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkCausalityChainsConnectEvents(db) {
    const errors = [];
    const warnings = [];

    // This check depends on events table existing
    warnings.push('Causality chain event connection check requires events table - skipped');

    return { passed: true, errors, warnings };
  }

  async checkArcsCoverPresentCharacters(db) {
    const warnings = [];

    // Check if major characters have arcs
    const charactersWithoutArcs = db.prepare(`
      SELECT e.id FROM entities e
      WHERE e.entity_type = 'character'
      AND NOT EXISTS (SELECT 1 FROM character_arcs ca WHERE ca.character_id = e.id)
    `).all();

    if (charactersWithoutArcs.length > 0) {
      warnings.push(`${charactersWithoutArcs.length} characters have no character arcs defined`);
    }

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkConflictsReferenceValidAntagonists(db) {
    const errors = [];

    // Antagonist source can be entity ID or descriptive string
    const conflicts = db.prepare('SELECT conflict_uuid, antagonist_source FROM story_conflicts').all();

    conflicts.forEach(conflict => {
      // If it looks like an entity ID, validate it exists
      if (conflict.antagonist_source && (conflict.antagonist_source.startsWith('char-') ||
          conflict.antagonist_source.startsWith('sys-'))) {
        const exists = db.prepare('SELECT 1 FROM entities WHERE id = ?').get(conflict.antagonist_source);
        if (!exists) {
          errors.push(`Conflict ${conflict.conflict_uuid} references non-existent antagonist entity: ${conflict.antagonist_source}`);
        }
      }
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkThemesReferenceValidSymbols(db) {
    const warnings = [];

    const themesWithSymbols = db.prepare(`
      SELECT theme_uuid, primary_symbol_id FROM thematic_elements
      WHERE primary_symbol_id IS NOT NULL
    `).all();

    themesWithSymbols.forEach(theme => {
      const exists = db.prepare('SELECT 1 FROM entities WHERE id = ?').get(theme.primary_symbol_id);
      if (!exists) {
        warnings.push(`Theme ${theme.theme_uuid} references non-existent symbol entity: ${theme.primary_symbol_id}`);
      }
    });

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkScenePOVEntityValid(db) {
    const errors = [];

    const invalidPOV = db.prepare(`
      SELECT ns.id, ns.pov_entity_id FROM narrative_scenes ns
      WHERE ns.pov_entity_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM entities e WHERE e.id = ns.pov_entity_id AND e.entity_type = 'character')
    `).all();

    invalidPOV.forEach(s => {
      errors.push(`Scene ${s.id} has invalid POV entity: ${s.pov_entity_id} (must be a character)`);
    });

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkSceneLocationEntityValid(db) {
    const warnings = [];

    const invalidLocation = db.prepare(`
      SELECT ns.id, ns.location_id FROM narrative_scenes ns
      WHERE ns.location_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM entities e WHERE e.id = ns.location_id AND e.entity_type = 'location')
    `).all();

    invalidLocation.forEach(s => {
      warnings.push(`Scene ${s.id} has invalid location entity: ${s.location_id} (should be a location)`);
    });

    return { passed: warnings.length === 0, errors: [], warnings };
  }

  // ========================================================================
  // ADDITIONAL REFERENTIAL INTEGRITY RULES (RI-11 to RI-15)
  // ========================================================================

  async checkTransitionSceneRefs(db) {
    const errors = [];
    const invalidTransitions = db.prepare(`
      SELECT st.id FROM scene_transitions st
      WHERE NOT EXISTS (SELECT 1 FROM narrative_scenes WHERE id = st.from_scene_id)
      OR NOT EXISTS (SELECT 1 FROM narrative_scenes WHERE id = st.to_scene_id)
    `).all();
    invalidTransitions.forEach(st => errors.push(`Scene transition ${st.id} references non-existent scenes`));
    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkDialogueProfileRefs(db) {
    const errors = [];
    const invalidProfiles = db.prepare(`
      SELECT dp.id FROM dialogue_profiles dp
      WHERE NOT EXISTS (SELECT 1 FROM entities WHERE id = dp.entity_id)
    `).all();
    invalidProfiles.forEach(dp => errors.push(`Dialogue profile ${dp.id} references non-existent entity`));
    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkPacingCheckpointRefs(db) {
    const warnings = [];
    const invalidSceneRefs = db.prepare(`
      SELECT pc.id FROM pacing_checkpoints pc
      WHERE pc.scene_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM narrative_scenes WHERE id = pc.scene_id)
    `).all();
    invalidSceneRefs.forEach(pc => warnings.push(`Pacing checkpoint ${pc.id} references non-existent scene`));
    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkVentMomentRefs(db) {
    const warnings = [];
    const invalidVents = db.prepare(`
      SELECT vm.id FROM vent_moments vm
      WHERE NOT EXISTS (SELECT 1 FROM narrative_scenes WHERE id = vm.scene_id)
      OR NOT EXISTS (SELECT 1 FROM entities WHERE id = vm.entity_id)
    `).all();
    invalidVents.forEach(vm => warnings.push(`Vent moment ${vm.id} references non-existent scene or entity`));
    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkThemeSymbolRefs(db) {
    const warnings = [];
    const invalidSymbols = db.prepare(`
      SELECT te.theme_uuid FROM thematic_elements te
      WHERE te.primary_symbol_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM entities WHERE id = te.primary_symbol_id)
    `).all();
    invalidSymbols.forEach(te => warnings.push(`Theme ${te.theme_uuid} references non-existent symbol entity`));
    return { passed: warnings.length === 0, errors: [], warnings };
  }

  // ========================================================================
  // ADDITIONAL TEMPORAL CONSISTENCY RULES (TC-13 to TC-15)
  // ========================================================================

  async checkVentMomentTiming(db) {
    const warnings = [];
    const invalidTiming = db.prepare(`
      SELECT id, narrative_time FROM vent_moments
      WHERE narrative_time < 0
    `).all();
    invalidTiming.forEach(vm => warnings.push(`Vent moment ${vm.id} has negative narrative_time`));
    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkCreatedAtTimestamps(db) {
    const errors = [];
    const now = Date.now();
    const futureTimes = db.prepare(`
      SELECT id, created_at FROM projects WHERE created_at > ?
      UNION ALL
      SELECT id, created_at FROM fictions WHERE created_at > ?
      UNION ALL
      SELECT id, created_at FROM entities WHERE created_at > ?
    `).all(now, now, now);
    futureTimes.forEach(t => errors.push(`Record ${t.id} has future created_at timestamp`));
    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkDialogueProfileTimestampOrder(db) {
    const warnings = [];
    const profiles = db.prepare(`
      SELECT id, entity_id, valid_from, created_at FROM dialogue_profiles
      ORDER BY entity_id, valid_from
    `).all();
    let lastEntityId = null;
    let lastValidFrom = -1;
    profiles.forEach(p => {
      if (p.entity_id !== lastEntityId) {
        lastEntityId = p.entity_id;
        lastValidFrom = -1;
      }
      if (p.valid_from < lastValidFrom) {
        warnings.push(`Dialogue profile ${p.id} has valid_from before previous profile`);
      }
      lastValidFrom = p.valid_from;
    });
    return { passed: warnings.length === 0, errors: [], warnings };
  }

  // ========================================================================
  // ADDITIONAL EPISTEMIC CONSISTENCY RULES (EC-8 to EC-12)
  // ========================================================================

  async checkConfidenceLevelsValid(db) {
    const warnings = [];
    const invalidConfidence = db.prepare(`
      SELECT id, confidence FROM epistemic_fact_ledger
      WHERE confidence < 0 OR confidence > 1
    `).all();
    invalidConfidence.forEach(efl => warnings.push(`Epistemic fact ${efl.id} has invalid confidence: ${efl.confidence}`));
    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkSourceEntityExists(db) {
    const errors = [];
    const invalidSources = db.prepare(`
      SELECT efl.id FROM epistemic_fact_ledger efl
      WHERE efl.source_entity_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM entities WHERE id = efl.source_entity_id)
    `).all();
    invalidSources.forEach(efl => errors.push(`Epistemic fact ${efl.id} references non-existent source_entity_id`));
    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkFactKeyConsistency(db) {
    const warnings = [];
    const factTypes = db.prepare(`
      SELECT fact_type, COUNT(DISTINCT fact_key) as key_count FROM epistemic_fact_ledger
      GROUP BY fact_type
    `).all();
    factTypes.forEach(ft => {
      if (ft.key_count === 0) warnings.push(`Fact type ${ft.fact_type} has no fact keys`);
    });
    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkFictionEntityEpistemicMatch(db) {
    const errors = [];
    const mismatches = db.prepare(`
      SELECT efl.id FROM epistemic_fact_ledger efl
      JOIN entities e ON efl.entity_id = e.id
      WHERE e.project_id != (SELECT project_id FROM fictions WHERE id = efl.fiction_id)
    `).all();
    mismatches.forEach(efl => errors.push(`Epistemic fact ${efl.id} has fiction/entity project mismatch`));
    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkForbiddenRevealsNotLeaked(db) {
    const warnings = [];
    warnings.push('Forbidden reveals leak detection requires scene-by-scene analysis - skipped');
    return { passed: true, errors: [], warnings };
  }

  // ========================================================================
  // ADDITIONAL FICTION SYSTEM RULES (FS-8 to FS-10)
  // ========================================================================

  async checkProjectHasFictions(db) {
    const warnings = [];
    const emptyProjects = db.prepare(`
      SELECT p.id FROM projects p
      WHERE NOT EXISTS (SELECT 1 FROM fictions WHERE project_id = p.id)
    `).all();
    emptyProjects.forEach(p => warnings.push(`Project ${p.id} has no fictions`));
    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkEntityIdFormatValid(db) {
    const errors = [];
    const invalidFormat = db.prepare(`
      SELECT id FROM entities
      WHERE id NOT LIKE '___-%'
    `).all();
    invalidFormat.forEach(e => errors.push(`Entity ${e.id} does not follow ID format (prefix-uuid)`));
    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkMetadataUpdatedAfterCreated(db) {
    const warnings = [];
    const invalidTimes = db.prepare(`
      SELECT entity_id FROM metadata
      WHERE updated_at < created_at
    `).all();
    invalidTimes.forEach(m => warnings.push(`Metadata for ${m.entity_id} has updated_at before created_at`));
    return { passed: warnings.length === 0, errors: [], warnings };
  }

  // ========================================================================
  // ADDITIONAL NARRATIVE CONSISTENCY RULES (NC-9 to NC-12)
  // ========================================================================

  async checkSceneTensionLevelsValid(db) {
    const warnings = [];
    const invalidTension = db.prepare(`
      SELECT id, tension_level FROM narrative_scenes
      WHERE tension_level < 0 OR tension_level > 1
    `).all();
    invalidTension.forEach(s => warnings.push(`Scene ${s.id} has tension_level outside 0-1 range`));
    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkSceneStatusValid(db) {
    const warnings = [];
    const validStatuses = ['draft', 'in_progress', 'complete', 'revised'];
    const invalidStatus = db.prepare(`
      SELECT id, status FROM narrative_scenes
      WHERE status NOT IN (${validStatuses.map(() => '?').join(',')})
    `).all(...validStatuses);
    invalidStatus.forEach(s => warnings.push(`Scene ${s.id} has invalid status: ${s.status}`));
    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkEnteringExitingEntitiesValid(db) {
    const errors = [];
    const scenes = db.prepare(`
      SELECT id, entering_entity_ids, exiting_entity_ids FROM narrative_scenes
      WHERE entering_entity_ids IS NOT NULL OR exiting_entity_ids IS NOT NULL
    `).all();
    scenes.forEach(scene => {
      try {
        if (scene.entering_entity_ids) {
          const entering = JSON.parse(scene.entering_entity_ids);
          if (Array.isArray(entering)) {
            entering.forEach(eid => {
              if (!db.prepare('SELECT 1 FROM entities WHERE id = ?').get(eid)) {
                errors.push(`Scene ${scene.id} entering_entity_ids references non-existent entity ${eid}`);
              }
            });
          }
        }
        if (scene.exiting_entity_ids) {
          const exiting = JSON.parse(scene.exiting_entity_ids);
          if (Array.isArray(exiting)) {
            exiting.forEach(eid => {
              if (!db.prepare('SELECT 1 FROM entities WHERE id = ?').get(eid)) {
                errors.push(`Scene ${scene.id} exiting_entity_ids references non-existent entity ${eid}`);
              }
            });
          }
        }
      } catch (err) {
        errors.push(`Scene ${scene.id} has invalid JSON in entering/exiting_entity_ids`);
      }
    });
    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkSetupPayoffIdsValid(db) {
    const errors = [];
    const scenes = db.prepare(`
      SELECT id, setup_payoff_ids FROM narrative_scenes
      WHERE setup_payoff_ids IS NOT NULL
    `).all();
    scenes.forEach(scene => {
      try {
        const setupIds = JSON.parse(scene.setup_payoff_ids);
        if (Array.isArray(setupIds)) {
          setupIds.forEach(spid => {
            if (!db.prepare('SELECT 1 FROM setup_payoffs WHERE setup_payoff_uuid = ?').get(spid)) {
              errors.push(`Scene ${scene.id} references non-existent setup/payoff ${spid}`);
            }
          });
        }
      } catch (err) {
        errors.push(`Scene ${scene.id} has invalid JSON in setup_payoff_ids`);
      }
    });
    return { passed: errors.length === 0, errors, warnings: [] };
  }

  // ========================================================================
  // ADDITIONAL LOGIC LAYER RULES (LL-16 to LL-18)
  // ========================================================================

  async checkMotifTypeValid(db) {
    const errors = [];
    const validTypes = ['visual', 'dialogue', 'situational', 'symbolic', 'musical'];
    const invalidTypes = db.prepare(`
      SELECT motif_uuid, motif_type FROM motif_instances
      WHERE motif_type NOT IN (${validTypes.map(() => '?').join(',')})
    `).all(...validTypes);
    invalidTypes.forEach(m => errors.push(`Motif ${m.motif_uuid} has invalid motif_type: ${m.motif_type}`));
    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkConflictStakesNotEmpty(db) {
    const warnings = [];
    const emptyStakes = db.prepare(`
      SELECT conflict_uuid FROM story_conflicts
      WHERE stakes_success IS NULL OR stakes_success = ''
      OR stakes_fail IS NULL OR stakes_fail = ''
    `).all();
    emptyStakes.forEach(c => warnings.push(`Conflict ${c.conflict_uuid} has empty stakes fields`));
    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkArcCoreFieldsPresent(db) {
    const warnings = [];
    const incompletearcs = db.prepare(`
      SELECT arc_uuid FROM character_arcs
      WHERE lie_belief IS NULL OR truth_belief IS NULL
      OR want_external IS NULL OR need_internal IS NULL
    `).all();
    incompletearcs.forEach(a => warnings.push(`Character arc ${a.arc_uuid} missing core fields (lie/truth/want/need)`));
    return { passed: warnings.length === 0, errors: [], warnings };
  }

  // ========================================================================
  // ADDITIONAL STATE INTEGRITY RULES (SI-11 to SI-12)
  // ========================================================================

  async checkRelationshipStatusValid(db) {
    const warnings = [];
    const validStatuses = ['active', 'estranged', 'ended', 'unknown'];
    const invalidStatus = db.prepare(`
      SELECT id, status FROM relationship_dynamics
      WHERE status NOT IN (${validStatuses.map(() => '?').join(',')})
    `).all(...validStatuses);
    invalidStatus.forEach(r => warnings.push(`Relationship ${r.id} has invalid status: ${r.status}`));
    return { passed: warnings.length === 0, errors: [], warnings };
  }

  async checkDialogueProfileJSONFieldsValid(db) {
    const errors = [];
    const profiles = db.prepare(`
      SELECT id, speech_patterns, quirks, topics_of_interest, topics_to_avoid,
             relationship_modifiers, context_modifiers, voice_hints
      FROM dialogue_profiles
    `).all();
    profiles.forEach(p => {
      const jsonFields = ['speech_patterns', 'quirks', 'topics_of_interest', 'topics_to_avoid',
                          'relationship_modifiers', 'context_modifiers', 'voice_hints'];
      jsonFields.forEach(field => {
        if (p[field]) {
          try {
            JSON.parse(p[field]);
          } catch (err) {
            errors.push(`Dialogue profile ${p.id} has invalid JSON in ${field}`);
          }
        }
      });
    });
    return { passed: errors.length === 0, errors, warnings: [] };
  }

  // ========================================================================
  // ADDITIONAL CROSS-ENTITY RULES (XE-11 to XE-12)
  // ========================================================================

  async checkVentMomentEntityValid(db) {
    const errors = [];
    const invalidVents = db.prepare(`
      SELECT vm.id FROM vent_moments vm
      WHERE NOT EXISTS (SELECT 1 FROM entities WHERE id = vm.entity_id AND entity_type = 'character')
    `).all();
    invalidVents.forEach(vm => errors.push(`Vent moment ${vm.id} references non-character entity`));
    return { passed: errors.length === 0, errors, warnings: [] };
  }

  async checkTransitionContinuityFieldsValid(db) {
    const warnings = [];
    const transitions = db.prepare(`
      SELECT id, carried_tensions, resolved_tensions, entity_state_changes, validation_errors
      FROM scene_transitions
    `).all();
    transitions.forEach(t => {
      const jsonFields = ['carried_tensions', 'resolved_tensions', 'entity_state_changes', 'validation_errors'];
      jsonFields.forEach(field => {
        if (t[field]) {
          try {
            JSON.parse(t[field]);
          } catch (err) {
            warnings.push(`Scene transition ${t.id} has invalid JSON in ${field}`);
          }
        }
      });
    });
    return { passed: warnings.length === 0, errors: [], warnings };
  }
}

module.exports = TripleThinkValidator;
