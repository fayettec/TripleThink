/**
 * TripleThink v1.0 → v4.1 Migration Service
 * Handles migration of legacy v1.0 databases to v4.1 schema
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class TripleThinkMigrator {
  constructor(v1DbPath, v4DbPath) {
    this.v1DbPath = v1DbPath;
    this.v4DbPath = v4DbPath;
    this.v1Db = null;
    this.v4Db = null;
    this.migrationLog = [];
    this.idMap = {}; // Maps v1 IDs to v4 IDs
  }

  /**
   * Main migration entry point
   * @returns {object} Migration summary
   */
  async migrateFromV1() {
    const startTime = Date.now();

    try {
      this.log('Starting v1.0 → v4.1 migration...');

      // Open databases
      this._openDatabases();

      // Check v1 database validity
      this._validateV1Database();

      // Run migration phases
      await this._migrateProjects();
      await this._migrateEntities();
      await this._migrateEventPhases();
      await this._migrateFacts();
      await this._migrateKnowledgeStates();
      await this._migrateRelationships();

      // Create snapshots for major events
      await this._createInitialSnapshots();

      // Close databases
      this._closeDatabases();

      const duration = Date.now() - startTime;
      const summary = {
        success: true,
        duration_ms: duration,
        migrated: this.idMap,
        log: this.migrationLog
      };

      this.log(`Migration completed in ${duration}ms`);
      return summary;

    } catch (error) {
      this.log(`Migration failed: ${error.message}`);
      this._closeDatabases();
      throw error;
    }
  }

  /**
   * Open v1 and v4 databases
   */
  _openDatabases() {
    try {
      this.v1Db = new Database(this.v1DbPath);
      this.v1Db.pragma('foreign_keys = ON');
      this.log(`✓ Opened v1.0 database at ${this.v1DbPath}`);
    } catch (error) {
      throw new Error(`Failed to open v1.0 database: ${error.message}`);
    }

    try {
      this.v4Db = new Database(this.v4DbPath);
      this.v4Db.pragma('foreign_keys = ON');
      this.log(`✓ Opened v4.1 database at ${this.v4DbPath}`);
    } catch (error) {
      throw new Error(`Failed to open v4.1 database: ${error.message}`);
    }
  }

  /**
   * Validate v1 database has expected tables
   */
  _validateV1Database() {
    const requiredTables = ['projects', 'entities', 'facts', 'knowledge_states'];
    const tables = this.v1Db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table'"
    ).all();
    const tableNames = tables.map(t => t.name);

    const missing = requiredTables.filter(t => !tableNames.includes(t));
    if (missing.length > 0) {
      throw new Error(`v1.0 database missing tables: ${missing.join(', ')}`);
    }

    this.log(`✓ v1.0 database schema validated`);
  }

  /**
   * Migrate projects
   */
  _migrateProjects() {
    const projects = this.v1Db.prepare('SELECT * FROM projects').all();

    for (const v1Project of projects) {
      const v4ProjectId = v1Project.id; // Keep same ID for consistency

      this.v4Db.prepare(`
        INSERT OR IGNORE INTO projects (id, name, author, description, schema_version, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        v4ProjectId,
        v1Project.name || 'Migrated Project',
        v1Project.author || 'Unknown',
        v1Project.description || '',
        '4.1.0', // Updated schema version
        v1Project.created_at || new Date().toISOString(),
        v1Project.updated_at || new Date().toISOString()
      );

      this.idMap[`project:${v1Project.id}`] = v4ProjectId;
      this.log(`✓ Migrated project: ${v4ProjectId}`);
    }
  }

  /**
   * Migrate entities (characters, objects, locations, systems)
   */
  _migrateEntities() {
    const entities = this.v1Db.prepare('SELECT * FROM entities').all();

    for (const v1Entity of entities) {
      const v4EntityId = v1Entity.id; // Keep same ID

      const v4Data = {
        ...JSON.parse(v1Entity.data || '{}'),
        migrated_from_v1: true,
        v1_timestamp: v1Entity.updated_at
      };

      this.v4Db.prepare(`
        INSERT OR IGNORE INTO entities (id, entity_type, name, timestamp, summary, data, meta_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        v4EntityId,
        v1Entity.entity_type,
        v1Entity.name,
        v1Entity.timestamp || new Date().toISOString(),
        v1Entity.summary || '',
        JSON.stringify(v4Data),
        v1Entity.meta_id || null,
        v1Entity.created_at || new Date().toISOString(),
        v1Entity.updated_at || new Date().toISOString()
      );

      this.idMap[`entity:${v1Entity.id}`] = v4EntityId;
    }

    this.log(`✓ Migrated ${entities.length} entities`);
  }

  /**
   * Migrate event phases
   */
  _migrateEventPhases() {
    const phases = this.v1Db.prepare('SELECT * FROM event_phases').all();

    for (const v1Phase of phases) {
      const v4PhaseId = v1Phase.id;

      this.v4Db.prepare(`
        INSERT OR IGNORE INTO event_phases (id, event_id, sequence, timestamp, summary, participants, state_changes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        v4PhaseId,
        v1Phase.event_id,
        v1Phase.sequence,
        v1Phase.timestamp,
        v1Phase.summary || '',
        JSON.stringify(v1Phase.participants || []),
        JSON.stringify(v1Phase.state_changes || []),
        v1Phase.created_at || new Date().toISOString()
      );

      this.idMap[`phase:${v1Phase.id}`] = v4PhaseId;
    }

    this.log(`✓ Migrated ${phases.length} event phases`);
  }

  /**
   * Migrate facts
   */
  _migrateFacts() {
    const facts = this.v1Db.prepare('SELECT * FROM facts').all();

    for (const v1Fact of facts) {
      const v4FactId = v1Fact.id;

      this.v4Db.prepare(`
        INSERT OR IGNORE INTO facts (id, phase_id, event_id, content, visibility, confidence, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        v4FactId,
        v1Fact.phase_id,
        v1Fact.event_id,
        v1Fact.content,
        v1Fact.visibility || 'ground_truth',
        v1Fact.confidence || 'absolute',
        v1Fact.created_at || new Date().toISOString()
      );

      this.idMap[`fact:${v1Fact.id}`] = v4FactId;
    }

    this.log(`✓ Migrated ${facts.length} facts`);
  }

  /**
   * Migrate knowledge states (epistemic tracking)
   */
  _migrateKnowledgeStates() {
    const states = this.v1Db.prepare('SELECT * FROM knowledge_states').all();

    for (const v1State of states) {
      const stmtId = this.v4Db.prepare(`
        INSERT INTO knowledge_states (character_id, timestamp, trigger_event_id, created_at)
        VALUES (?, ?, ?, ?)
      `);

      const result = stmtId.run(
        v1State.character_id,
        v1State.timestamp,
        v1State.trigger_event_id,
        v1State.created_at || new Date().toISOString()
      );

      // Migrate knowledge state facts
      const stateFacts = this.v1Db.prepare(
        'SELECT * FROM knowledge_state_facts WHERE knowledge_state_id = ?'
      ).all(v1State.id);

      for (const v1StateFact of stateFacts) {
        this.v4Db.prepare(`
          INSERT INTO knowledge_state_facts (knowledge_state_id, fact_id, belief, believed_alternative, confidence, source)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          result.lastInsertRowid,
          v1StateFact.fact_id,
          v1StateFact.belief,
          v1StateFact.believed_alternative || null,
          v1StateFact.confidence || 'high',
          v1StateFact.source || 'migrated'
        );
      }
    }

    this.log(`✓ Migrated ${states.length} knowledge states with beliefs`);
  }

  /**
   * Migrate relationships
   */
  _migrateRelationships() {
    const rels = this.v1Db.prepare('SELECT * FROM relationships').all();

    for (const v1Rel of rels) {
      this.v4Db.prepare(`
        INSERT INTO relationships (from_entity_id, to_entity_id, relationship_type, timestamp, data, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        v1Rel.from_entity_id,
        v1Rel.to_entity_id,
        v1Rel.relationship_type,
        v1Rel.timestamp,
        JSON.stringify(v1Rel.data || {}),
        v1Rel.created_at || new Date().toISOString()
      );
    }

    this.log(`✓ Migrated ${rels.length} relationships`);
  }

  /**
   * Create initial snapshots for major events
   * This enables the hybrid state system in v4.1
   */
  _createInitialSnapshots() {
    // Get major events (events with multiple phases)
    const majorEvents = this.v4Db.prepare(`
      SELECT DISTINCT event_id
      FROM event_phases
      GROUP BY event_id
      HAVING COUNT(*) > 1
      ORDER BY event_id
    `).all();

    for (const eventRecord of majorEvents) {
      const eventId = eventRecord.event_id;

      // Get associated characters
      const characters = this.v4Db.prepare(`
        SELECT DISTINCT participant
        FROM event_phases, json_each(event_phases.participants, '$')
        WHERE event_phases.event_id = ?
      `).all(eventId);

      // Create snapshot for each character at this event
      for (const charRecord of characters) {
        const characterId = charRecord.participant;

        // Build state snapshot from knowledge states
        const knowledgeState = this.v4Db.prepare(`
          SELECT ksf.*
          FROM knowledge_state_facts ksf
          JOIN knowledge_states ks ON ksf.knowledge_state_id = ks.id
          WHERE ks.character_id = ?
          ORDER BY ks.created_at DESC
          LIMIT 50
        `).all(characterId);

        const stateSnapshot = {
          character_id: characterId,
          event_id: eventId,
          knowledge: knowledgeState.map(k => ({
            fact_id: k.fact_id,
            belief: k.belief,
            confidence: k.confidence
          })),
          migrated: true,
          created_from_v1: new Date().toISOString()
        };

        this.v4Db.prepare(`
          INSERT INTO asset_state_snapshots (snapshot_uuid, linked_asset_uuid, anchor_event_uuid, snapshot_type, full_state_json, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          this._generateUUID(),
          characterId,
          eventId,
          'MAJOR_EVENT',
          JSON.stringify(stateSnapshot),
          new Date().toISOString()
        );
      }
    }

    this.log(`✓ Created ${majorEvents.length} initial state snapshots`);
  }

  /**
   * Generate UUID
   */
  _generateUUID() {
    return uuidv4();
  }

  /**
   * Log migration message
   */
  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.migrationLog.push(logEntry);
    console.log(logEntry);
  }

  /**
   * Close databases
   */
  _closeDatabases() {
    if (this.v1Db) {
      this.v1Db.close();
      this.log('✓ Closed v1.0 database');
    }
    if (this.v4Db) {
      this.v4Db.close();
      this.log('✓ Closed v4.1 database');
    }
  }
}

module.exports = TripleThinkMigrator;
