// Database migration runner
// Executes SQL migrations to set up the database schema

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'triplethink.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

const migrationsDir = path.join(__dirname, 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log('Running migrations...');

for (const file of migrationFiles) {
  const filePath = path.join(migrationsDir, file);
  const sql = fs.readFileSync(filePath, 'utf-8');

  try {
    db.exec(sql);
    console.log(`✓ ${file}`);
  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`);
    process.exit(1);
  }
}

console.log('Migrations complete!');
db.close();
