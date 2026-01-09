/**
 * TripleThink Migration Runner
 * Handles database schema versioning and upgrades
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

class MigrationRunner {
  constructor(dbPath, migrationsDir) {
    this.db = new Database(dbPath);
    this.migrationsDir = migrationsDir;
    this.db.pragma('foreign_keys = ON');
  }

  /**
   * Get current schema version
   * @returns {number} Current version (0 if no migrations applied)
   */
  getCurrentVersion() {
    try {
      const stmt = this.db.prepare(
        'SELECT MAX(version) as version FROM schema_migrations'
      );
      const result = stmt.get();
      return result?.version || 0;
    } catch (e) {
      // Table doesn't exist yet
      return 0;
    }
  }

  /**
   * Get all available migrations
   * @returns {array} [{version, name, path}]
   */
  getAvailableMigrations() {
    const files = fs.readdirSync(this.migrationsDir);

    return files
      .filter(f => f.endsWith('.sql') && /^\d{3}_/.test(f))
      .map(f => {
        const version = parseInt(f.substring(0, 3), 10);
        const name = f.replace(/^\d{3}_/, '').replace('.sql', '');
        return {
          version,
          name,
          path: path.join(this.migrationsDir, f)
        };
      })
      .sort((a, b) => a.version - b.version);
  }

  /**
   * Get pending migrations
   * @returns {array} Migrations not yet applied
   */
  getPendingMigrations() {
    const current = this.getCurrentVersion();
    return this.getAvailableMigrations().filter(m => m.version > current);
  }

  /**
   * Apply a single migration
   * @param {object} migration - {version, name, path}
   */
  applyMigration(migration) {
    const sql = fs.readFileSync(migration.path, 'utf8');

    this.db.transaction(() => {
      // Execute migration SQL
      this.db.exec(sql);

      // Record migration
      const stmt = this.db.prepare(`
        INSERT INTO schema_migrations (version, name, rollback_sql)
        VALUES (?, ?, ?)
      `);

      // Extract rollback SQL if present (between -- ROLLBACK START/END markers)
      const rollbackMatch = sql.match(/-- ROLLBACK START\n([\s\S]*?)-- ROLLBACK END/);
      const rollbackSql = rollbackMatch ? rollbackMatch[1].trim() : null;

      stmt.run(migration.version, migration.name, rollbackSql);
    })();

    console.log(`Applied migration ${migration.version}: ${migration.name}`);
  }

  /**
   * Run all pending migrations
   * @returns {number} Number of migrations applied
   */
  migrate() {
    const pending = this.getPendingMigrations();

    if (pending.length === 0) {
      console.log('Database is up to date');
      return 0;
    }

    console.log(`Applying ${pending.length} migration(s)...`);

    pending.forEach(m => this.applyMigration(m));

    return pending.length;
  }

  /**
   * Rollback last migration
   * @returns {boolean} Success
   */
  rollback() {
    const current = this.getCurrentVersion();

    if (current === 0) {
      console.log('No migrations to rollback');
      return false;
    }

    const stmt = this.db.prepare(
      'SELECT * FROM schema_migrations WHERE version = ?'
    );
    const migration = stmt.get(current);

    if (!migration.rollback_sql) {
      console.error(`Migration ${current} has no rollback SQL`);
      return false;
    }

    this.db.transaction(() => {
      this.db.exec(migration.rollback_sql);

      const deleteStmt = this.db.prepare(
        'DELETE FROM schema_migrations WHERE version = ?'
      );
      deleteStmt.run(current);
    })();

    console.log(`Rolled back migration ${current}: ${migration.name}`);
    return true;
  }

  /**
   * Get migration status
   * @returns {object} {current, pending, applied}
   */
  status() {
    const current = this.getCurrentVersion();
    const available = this.getAvailableMigrations();
    const pending = this.getPendingMigrations();

    const appliedStmt = this.db.prepare(
      'SELECT * FROM schema_migrations ORDER BY version'
    );
    const applied = appliedStmt.all();

    return {
      current,
      pending: pending.map(m => `${m.version}: ${m.name}`),
      applied: applied.map(m => `${m.version}: ${m.name} (${m.applied_at})`)
    };
  }

  close() {
    this.db.close();
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  const dbPath = args[1] || './triplethink.db';
  const migrationsDir = args[2] || './migrations';

  const runner = new MigrationRunner(dbPath, migrationsDir);

  switch (command) {
    case 'migrate':
      runner.migrate();
      break;
    case 'rollback':
      runner.rollback();
      break;
    case 'status':
      console.log(JSON.stringify(runner.status(), null, 2));
      break;
    default:
      console.log('Usage: migration-runner.js [migrate|rollback|status] [dbPath] [migrationsDir]');
  }

  runner.close();
}

module.exports = MigrationRunner;
