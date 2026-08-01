/**
 * Renderer SQLite bridge (Phase 4).
 * - Migrates from a backup/localStorage snapshot into main-process SQLite
 * - Hydrates memory + keeps localStorage mirror (does not delete old data)
 * - Persists core table writes asynchronously when sqlitePrimary is enabled
 */
(function (global) {
  'use strict';

  const CORE_TABLES = ['clientsRegistry', 'cases', 'bookings', 'doctors', 'attendance', 'expenses'];
  const KV_MIRROR = [
    'users', 'settings', 'packages', 'services', 'otRecords', 'budget', 'invoiceCounter',
    'clientFileCounter', 'nextSessions', 'employeeLeaveRequests', 'employeeLedgerAccruals',
    'employeeLedgerPayments', 'employeeLedgerEntries', 'importHistory',
  ];

  const state = {
    ready: false,
    sqlitePrimary: false,
    status: null,
  };

  function api() {
    return global.cuppingElectron?.database || global.tadawi?.database || null;
  }

  function collectSnapshotFromLocal() {
    const snap = {};
    const read = (k, def) => {
      if (typeof DB !== 'undefined' && DB.get) return DB.get(k, def);
      try {
        const raw = localStorage.getItem(k);
        return raw ? JSON.parse(raw) : def;
      } catch { return def; }
    };
    snap.clientsRegistry = read('clientsRegistry', []);
    snap.cases = read('cases', []);
    snap.bookings = read('bookings', []);
    snap.doctors = read('doctors', []);
    snap.attendance = read('attendance', []);
    snap.expenses = read('expenses', []);
    for (const k of KV_MIRROR) snap[k] = read(k, k.endsWith('Counter') ? 0 : (k === 'settings' ? {} : []));
    if (typeof buildFullBackupObject === 'function') {
      try {
        const full = buildFullBackupObject();
        return { ...snap, ...full };
      } catch { /* use snap */ }
    }
    return snap;
  }

  async function migrateAndEnable(options) {
    const db = api();
    if (!db) return { ok: false, error: 'database_api_unavailable' };
    const snapshot = options?.snapshot || collectSnapshotFromLocal();
    const report = await db.migrateFromBackup(snapshot, {
      sourceLabel: options?.sourceLabel || 'localStorage',
      dryRun: !!options?.dryRun,
    });
    if (!report?.ok) return report;
    if (options?.dryRun) return report;
    return hydrateIntoMemory();
  }

  async function hydrateIntoMemory() {
    const db = api();
    if (!db) return { ok: false, error: 'database_api_unavailable' };
    const res = await db.hydrate();
    if (!res?.ok) return res;
    const data = res.data || {};
    state.status = res.status;
    state.sqlitePrimary = !!(res.status && res.status.sqlitePrimary);

    // Apply into classic globals when present
    if (typeof global.clientsRegistry !== 'undefined') global.clientsRegistry = data.clientsRegistry || [];
    if (typeof global.cases !== 'undefined') global.cases = data.cases || [];
    if (typeof global.bookings !== 'undefined') global.bookings = data.bookings || [];
    if (typeof global.doctors !== 'undefined') global.doctors = data.doctors || [];
    if (typeof global.attendance !== 'undefined') global.attendance = data.attendance || [];
    if (typeof global.expenses !== 'undefined') global.expenses = data.expenses || [];

    // Mirror to localStorage (retained on purpose)
    if (typeof DB !== 'undefined' && DB.set) {
      for (const key of CORE_TABLES) {
        if (data[key] !== undefined) DB.set(key === 'cases' ? 'cases' : key, data[key === 'clientsRegistry' ? 'clientsRegistry' : key]);
      }
      // Fix mapping explicitly
      DB.set('clientsRegistry', data.clientsRegistry || []);
      DB.set('cases', data.cases || []);
      DB.set('bookings', data.bookings || []);
      DB.set('doctors', data.doctors || []);
      DB.set('attendance', data.attendance || []);
      DB.set('expenses', data.expenses || []);
      for (const k of KV_MIRROR) {
        if (data[k] !== undefined) DB.set(k, data[k]);
      }
    }

    state.ready = true;
    installWriteThrough();
    return { ok: true, status: state.status, report: res };
  }

  function installWriteThrough() {
    if (!state.sqlitePrimary || typeof DB === 'undefined' || DB.__sqliteWriteThrough) return;
    const rawSet = DB.set.bind(DB);
    DB.set = function sqliteAwareSet(k, v) {
      rawSet(k, v); // keep localStorage mirror
      const db = api();
      if (!db || !state.sqlitePrimary) return;
      try {
        if (CORE_TABLES.includes(k)) {
          db.persistTable(k, Array.isArray(v) ? v : []).catch(() => {});
        } else if (KV_MIRROR.includes(k)) {
          db.persistKv(k, v).catch(() => {});
        }
      } catch { /* ignore */ }
    };
    DB.__sqliteWriteThrough = true;
  }

  async function status() {
    const db = api();
    if (!db) return { ok: false, error: 'database_api_unavailable' };
    state.status = await db.status();
    state.sqlitePrimary = !!(state.status && state.status.sqlitePrimary);
    return state.status;
  }

  global.SqliteBridge = {
    migrateAndEnable,
    hydrateIntoMemory,
    status,
    collectSnapshotFromLocal,
    getState: () => ({ ...state }),
  };
})(typeof window !== 'undefined' ? window : global);
