#!/usr/bin/env node

/**
 * Database Initialization Script
 * Runs all migrations in order to set up the TripleThink schema
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'api', 'triplethink.db');
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

console.log(`Initializing database at: ${DB_PATH}`);

try {
  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  // Read all migration files
  const migrations = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();

  console.log(`Found ${migrations.length} migrations`);

  // Run each migration
  for (const migration of migrations) {
    const migrationPath = path.join(MIGRATIONS_DIR, migration);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log(`Running migration: ${migration}`);

    try {
      // Split by `;` to handle multiple statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

      for (const statement of statements) {
        db.exec(statement);
      }

      console.log(`✓ ${migration} completed`);
    } catch (error) {
      console.error(`✗ Error in ${migration}:`, error.message);
      // Don't exit, continue with other migrations in case they create new tables
      // But log the error
    }
  }

  db.close();
  console.log('Database initialization complete!');
} catch (error) {
  console.error('Database initialization failed:', error.message);
  process.exit(1);
}
