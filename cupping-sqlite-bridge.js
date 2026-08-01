/**
 * Renderer SQLite bridge — V2-5.9 SQLite Source of Truth cutover.
 *
 * Operational writes:
 *   SQLite commit (+ outbox in same transaction when possible)
 *   → then mirror to localStorage for UI cache only
 *   → UI refresh
 *
 * If SQLite commit fails: do NOT treat write as saved; do NOT enqueue sync from LS alone.
 */
(function (global) {
  'use strict';

  const CORE_TABLES = ['clientsRegistry', 'cases', 'bookings', 'doctors', 'attendance', 'expenses'];
  const KV_MIRROR = [
    'users', 'settings', 'packages', 'services', 'otRecords', 'budget', 'invoiceCounter',
    'clientFileCounter', 'nextSessions', 'employeeLeaveRequests', 'employeeLedgerAccruals',
    'employeeLedgerPayments', 'employeeLedgerEntries', 'importHistory',
  ];
  /** Keys that may remain localStorage-only (non-operational UI). */
  const UI_ONLY_KEYS = new Set([
    '__tdw_ui_theme__', '__tdw_ui_lang__', '__tdw_last_tab__', '__tdw_wizard_ui__',
  ]);

  const state = {
    ready: false,
    sqlitePrimary: false,
    lastError: null,
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
    try { await db.enableSqlitePrimary?.(); } catch { /* empty */ }
    return hydrateIntoMemory();
  }

  async function ensureSqlitePrimaryEnabled() {
    const db = api();
    if (!db) return { ok: false, error: 'database_api_unavailable' };
    if (state.sqlitePrimary) return { ok: true, already: true };
    try {
      const st = await db.enableSqlitePrimary?.();
      state.status = st || (await db.status?.());
      state.sqlitePrimary = !!(state.status && state.status.sqlitePrimary);
      if (state.sqlitePrimary) installWriteThrough();
      return { ok: !!state.sqlitePrimary, status: state.status };
    } catch (e) {
      return { ok: false, error: String(e?.message || e) };
    }
  }

  async function hydrateIntoMemory() {
    const db = api();
    if (!db) return { ok: false, error: 'database_api_unavailable' };
    const res = await db.hydrate();
    if (!res?.ok) return res;
    const data = res.data || {};
    state.status = res.status;
    state.sqlitePrimary = !!(res.status && res.status.sqlitePrimary);
    if (!state.sqlitePrimary) {
      try {
        await db.enableSqlitePrimary?.();
        const st = await db.status?.();
        state.status = st;
        state.sqlitePrimary = !!(st && st.sqlitePrimary);
      } catch { /* empty */ }
    }

    if (typeof global.clientsRegistry !== 'undefined') global.clientsRegistry = data.clientsRegistry || [];
    if (typeof global.cases !== 'undefined') global.cases = data.cases || [];
    if (typeof global.bookings !== 'undefined') global.bookings = data.bookings || [];
    if (typeof global.doctors !== 'undefined') global.doctors = data.doctors || [];
    if (typeof global.attendance !== 'undefined') global.attendance = data.attendance || [];
    if (typeof global.expenses !== 'undefined') global.expenses = data.expenses || [];

    // Cache mirror only — SQLite remains SoT when sqlitePrimary.
    if (typeof DB !== 'undefined' && DB.__rawSet) {
      const raw = DB.__rawSet;
      raw('clientsRegistry', data.clientsRegistry || []);
      raw('cases', data.cases || []);
      raw('bookings', data.bookings || []);
      raw('doctors', data.doctors || []);
      raw('attendance', data.attendance || []);
      raw('expenses', data.expenses || []);
      for (const k of KV_MIRROR) {
        if (data[k] !== undefined) raw(k, data[k]);
      }
    } else if (typeof DB !== 'undefined' && DB.set) {
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
    return { ok: true, status: state.status, report: res, sqlitePrimary: state.sqlitePrimary };
  }

  function buildOutboxEntry(tableKey, records) {
    const centerId =
      global.ConfigLayer?.getCenterId?.() ||
      global.CenterId?.getStoredCenterId?.() ||
      global.LicenseCloud?.loadLocal?.()?.centerId ||
      '';
    const branchId =
      global.BranchContexts?.getOperationalWriteBranch?.() ||
      global.BranchScope?.getActiveBranchId?.() ||
      'BR-MAIN';
    const deviceId =
      global.DeviceConfig?.getDeviceId?.() ||
      global.DeviceConfig?.load?.()?.deviceUuid ||
      'unknown-device';
    if (!centerId) return null;
    return {
      center_id: centerId,
      branch_id: branchId,
      table_name: tableKey,
      operation: 'TABLE_BUMP',
      base_revision: 0,
      new_revision: Date.now(),
      device_id: deviceId,
      payload_json: JSON.stringify(records ?? null),
    };
  }

  /**
   * Authoritative operational commit. Returns { ok, error }.
   * On failure: localStorage must not be treated as committed SoT.
   */
  async function commitOperational(tableKey, records, options) {
    options = options || {};
    const db = api();
    if (!db) return { ok: false, error: 'database_api_unavailable' };
    if (!state.sqlitePrimary) {
      const en = await ensureSqlitePrimaryEnabled();
      if (!en.ok) return { ok: false, error: en.error || 'sqlite_primary_required' };
    }
    const list = Array.isArray(records) ? records : [];
    try {
      const entry = buildOutboxEntry(tableKey, list);
      if (entry && db.syncOp) {
        const res = await db.syncOp({
          op: 'enqueueAtomicPersistTable',
          tableKey,
          records: list,
          entry,
        });
        if (res && res.ok === false) {
          state.lastError = res.error || 'commit_failed';
          return { ok: false, error: state.lastError, res };
        }
      } else {
        const res = await db.persistTable(tableKey, list);
        if (res && res.ok === false) {
          state.lastError = res.error || 'persist_failed';
          return { ok: false, error: state.lastError, res };
        }
      }
      // Mirror cache AFTER successful SQLite commit only.
      if (typeof DB !== 'undefined') {
        const raw = DB.__rawSet || DB.set.bind(DB);
        raw(tableKey, list);
      }
      state.lastError = null;
      return { ok: true, tableKey, count: list.length };
    } catch (e) {
      state.lastError = String(e?.message || e);
      return { ok: false, error: state.lastError };
    }
  }

  function installWriteThrough() {
    if (typeof DB === 'undefined') return;
    if (!DB.__rawSet) {
      DB.__rawSet = DB.set.bind(DB);
    }
    if (DB.__sqliteWriteThrough) return;
    const rawSet = DB.__rawSet;
    DB.set = function sqliteAwareSet(k, v) {
      if (UI_ONLY_KEYS.has(k)) {
        rawSet(k, v);
        return true;
      }
      const db = api();
      // Without Electron / before primary: cache only (browser tests) — never invent sync events.
      if (!db || !state.sqlitePrimary) {
        rawSet(k, v);
        return true;
      }
      try {
        if (CORE_TABLES.includes(k)) {
          // Fire commit; on failure roll back cache expectation via lastError + notify.
          const list = Array.isArray(v) ? v : [];
          Promise.resolve(commitOperational(k, list)).then((res) => {
            if (!res?.ok) {
              state.lastError = res?.error || 'sqlite_commit_failed';
              try {
                global.notify?.(
                  '⚠️ فشل حفظ SQLite — لم تُعتمد الكتابة ولا حدث مزامنة (' + state.lastError + ')',
                  'danger'
                );
              } catch { /* empty */ }
            }
          }).catch((err) => {
            state.lastError = String(err?.message || err);
          });
          // Optimistic UI cache; authoritative success is commitOperational result.
          rawSet(k, v);
          return true;
        }
        if (KV_MIRROR.includes(k)) {
          db.persistKv(k, v).then((res) => {
            if (res && res.ok === false) {
              state.lastError = res.error || 'kv_persist_failed';
              try {
                global.notify?.('⚠️ فشل حفظ الإعدادات في SQLite', 'danger');
              } catch { /* empty */ }
            } else {
              rawSet(k, v);
            }
          }).catch(() => {
            state.lastError = 'kv_persist_failed';
          });
          // Do not treat LS as success before persist ack for users/settings.
          if (k !== 'users' && k !== 'settings') rawSet(k, v);
          return true;
        }
      } catch (e) {
        state.lastError = String(e?.message || e);
        return false;
      }
      rawSet(k, v);
      return true;
    };
    DB.__sqliteWriteThrough = true;
    DB.commitOperational = commitOperational;
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
    ensureSqlitePrimaryEnabled,
    commitOperational,
    status,
    collectSnapshotFromLocal,
    CORE_TABLES,
    KV_MIRROR,
    getState: () => ({ ...state }),
    getLastError: () => state.lastError,
  };
})(typeof window !== 'undefined' ? window : global);
