'use strict';

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const initial = require('./migrations/001_initial');

const MIGRATIONS = [initial];

function openDatabase(dbPath, options = {}) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new Database(dbPath, options);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
  const applied = new Set(
    db.prepare('SELECT id FROM schema_migrations').all().map((r) => r.id)
  );
  const run = db.transaction(() => {
    for (const m of MIGRATIONS) {
      if (applied.has(m.id)) continue;
      db.exec(m.sql);
      db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)').run(
        m.id,
        new Date().toISOString()
      );
      db.prepare(
        `INSERT INTO meta(key, value) VALUES('schemaVersion', ?)
         ON CONFLICT(key) DO UPDATE SET value=excluded.value`
      ).run(String(m.version));
    }
  });
  run();
  return getSchemaVersion(db);
}

function getSchemaVersion(db) {
  try {
    const row = db.prepare(`SELECT value FROM meta WHERE key = 'schemaVersion'`).get();
    return row ? Number(row.value) : 0;
  } catch {
    return 0;
  }
}

function integrityCheck(db) {
  const row = db.prepare('PRAGMA integrity_check').get();
  const ok = row && String(row.integrity_check || Object.values(row)[0]).toLowerCase() === 'ok';
  return { ok, detail: row };
}

function defaultDbPath(userDataPath) {
  return path.join(userDataPath, 'database', 'tadawi.db');
}

module.exports = {
  openDatabase,
  migrate,
  getSchemaVersion,
  integrityCheck,
  defaultDbPath,
  MIGRATIONS,
};
