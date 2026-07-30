'use strict';

/**
 * Electron main-process SQLite service.
 */
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { openDatabase, defaultDbPath, integrityCheck, getSchemaVersion } = require('../../database/connection');
const { createRepositories } = require('../../database/repositories');
const { migrateFromSnapshot, exportSnapshot } = require('../../database/migrate-from-json');
const { createSyncPlatform } = require('../../database/sync-outbox');

let db = null;
let repos = null;
let syncPlatform = null;

function getDbPath() {
  return defaultDbPath(app.getPath('userData'));
}

function ensureDb() {
  if (db) return db;
  try {
    db = openDatabase(getDbPath());
    repos = createRepositories(db);
    syncPlatform = createSyncPlatform(db);
    return db;
  } catch (err) {
    // DATA-007: never silently open empty replacement after corrupt/missing-required.
    console.error('[sqlite] open failed:', err.code || err.message, err.details || '');
    throw err;
  }
}

function getStatus() {
  ensureDb();
  const meta = {};
  for (const row of db.prepare('SELECT key, value FROM meta').all()) meta[row.key] = row.value;
  return {
    ok: true,
    path: getDbPath(),
    schemaVersion: getSchemaVersion(db),
    integrity: integrityCheck(db),
    meta,
    counts: {
      clients: repos.clients.count(),
      visits: repos.visits.count(),
      bookings: repos.bookings.count(),
      employees: repos.employees.count(),
      attendance: repos.attendance.count(),
      expenses: repos.expenses.count(),
    },
    sqlitePrimary: meta.sqlitePrimary === 'true',
    localStorageRetained: meta.localStorageRetained !== 'false',
  };
}

function hydrate() {
  ensureDb();
  const data = {
    clientsRegistry: repos.clients.getAll(),
    cases: repos.visits.getAll(),
    bookings: repos.bookings.getAll(),
    doctors: repos.employees.getAll(),
    attendance: repos.attendance.getAll(),
    expenses: repos.expenses.getAll(),
    ...repos.kv.exportAll(),
  };
  return { ok: true, data, status: getStatus() };
}

function persistTable(tableKey, records) {
  ensureDb();
  const list = Array.isArray(records) ? records : [];
  const map = {
    clientsRegistry: () => repos.clients.replaceAll(list),
    cases: () => repos.visits.replaceAll(list),
    bookings: () => repos.bookings.replaceAll(list),
    doctors: () => repos.employees.replaceAll(list),
    attendance: () => repos.attendance.replaceAll(list),
    expenses: () => repos.expenses.replaceAll(list),
  };
  if (!map[tableKey]) return { ok: false, error: 'unknown_table' };
  try {
    map[tableKey]();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.code || 'persist_failed', message: err.message };
  }
}

function persistKv(key, value) {
  ensureDb();
  repos.kv.set(key, value);
  return { ok: true };
}

function migrateFromBackupObject(snapshot, options = {}) {
  const dbFile = getDbPath();
  const backupPath = path.join(
    app.getPath('userData'),
    'database',
    'backups',
    `pre-migrate-${Date.now()}.db`
  );
  // Close open handle before migrating file DB
  try { db?.close(); } catch { /* ignore */ }
  db = null;
  repos = null;

  if (fs.existsSync(dbFile) && !options.skipBackup) {
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  }

  const report = migrateFromSnapshot({
    snapshot,
    dbPath: dbFile,
    backupPath: fs.existsSync(dbFile) ? backupPath : undefined,
    sourceLabel: options.sourceLabel || 'renderer-backup',
    dryRun: !!options.dryRun,
  });

  // Write report next to DB
  try {
    const reportPath = path.join(path.dirname(dbFile), `migration-report-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    report.reportPath = reportPath;
  } catch { /* ignore */ }

  if (!options.dryRun) ensureDb();
  return report;
}

function querySafe(request) {
  ensureDb();
  const req = request || {};
  // Explicit allowlist — never accept arbitrary SQL from renderer
  switch (req.op) {
    case 'status':
      return getStatus();
    case 'count': {
      const table = String(req.table || '');
      const allowed = {
        clients: () => repos.clients.count(),
        visits: () => repos.visits.count(),
        bookings: () => repos.bookings.count(),
        employees: () => repos.employees.count(),
        attendance: () => repos.attendance.count(),
        expenses: () => repos.expenses.count(),
      };
      if (!allowed[table]) return { ok: false, error: 'table_not_allowed' };
      return { ok: true, count: allowed[table]() };
    }
    case 'sumVisits':
      return { ok: true, sum: repos.visits.sumTotal() };
    default:
      return { ok: false, error: 'op_not_allowed' };
  }
}

function ensureSync() {
  ensureDb();
  if (!syncPlatform) syncPlatform = createSyncPlatform(db);
  return syncPlatform;
}

function syncOp(request) {
  const sp = ensureSync();
  const req = request || {};
  switch (req.op) {
    case 'enqueue':
      return sp.enqueue(req.entry || {});
    case 'enqueueAtomicPersistKv': {
      // mutate kv then outbox atomically
      return sp.enqueueAtomic(req.entry || {}, () => {
        if (req.kvKey != null) repos.kv.set(req.kvKey, req.kvValue);
      });
    }
    case 'claimPending':
      return { ok: true, rows: sp.claimPending(req.options || {}) };
    case 'ack':
      return sp.ack(req.eventId, req.remoteFileId);
    case 'fail':
      return sp.fail(req.eventId, req.error, req.options || {});
    case 'counts':
      return { ok: true, counts: sp.countByStatus(req.branchId || null) };
    case 'listDeadLetters':
      return { ok: true, rows: sp.listDeadLetters(req.options || {}) };
    case 'requeueDeadLetter':
      return sp.requeueDeadLetter(req.eventId);
    case 'requeueDeadLetters':
      return sp.requeueDeadLetters(req.options || {});
    case 'markApplied':
      return sp.markRemoteApplied(req.entry || {});
    case 'openConflict':
      return sp.openConflict(req.entry || {});
    case 'resolveConflict':
      return sp.resolveConflictById(req.conflictId, req.resolution, req.resolvedRevision, req.actorId);
    case 'audit':
      return sp.audit(req.entry || {});
    case 'metaGet':
      return { ok: true, value: sp.metaGet(req.key, req.def) };
    case 'metaSet':
      sp.metaSet(req.key, req.value);
      return { ok: true };
    default:
      return { ok: false, error: 'sync_op_not_allowed' };
  }
}

function close() {
  try { db?.close(); } catch { /* ignore */ }
  db = null;
  repos = null;
  syncPlatform = null;
}

module.exports = {
  getDbPath,
  ensureDb,
  getStatus,
  hydrate,
  persistTable,
  persistKv,
  migrateFromBackupObject,
  querySafe,
  syncOp,
  exportSnapshot: () => exportSnapshot(getDbPath()),
  close,
};
