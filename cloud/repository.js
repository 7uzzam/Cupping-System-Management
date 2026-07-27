/**
 * Repository Layer — single write path for synced operational data (SQLite-ready).
 */
(function (global) {
  'use strict';

  const REVISIONS_KEY = '__tdw_repo_revisions__';

  const SYNCED_TABLES = [
    'cases', 'clientsRegistry', 'bookings', 'users', 'doctors',
    'settings', 'expenses', 'packages', 'services',
    'attendance', 'inventoryItems', 'inventorySuppliers', 'inventoryMovements'
  ];

  const SYNCED_SET = new Set(SYNCED_TABLES);

  function createLocalStorageAdapter(db) {
    const store = db || global.DB;
    const raw = store?.__tdwBridged ? store.raw : store;
    if (!raw?.get || !raw?.set) {
      throw new Error('Repository requires DB.get/set');
    }
    return {
      name: 'localStorage',
      get(key, def) { return raw.get(key, def); },
      set(key, val) { raw.set(key, val); },
      remove(key) {
        try { localStorage.removeItem(key); } catch { /* empty */ }
      }
    };
  }

  function loadRevisions(adapter) {
    return adapter.get(REVISIONS_KEY, {}) || {};
  }

  function saveRevisions(adapter, rev) {
    adapter.set(REVISIONS_KEY, rev);
  }

  function isSyncedTable(table) {
    return SYNCED_SET.has(table);
  }

  function syncGlobal(table, data) {
    if (!Array.isArray(data)) return;
    if (table === 'cases') global.cases = data;
    if (table === 'clientsRegistry') global.clientsRegistry = data;
    if (table === 'bookings') global.bookings = data;
    if (table === 'users') global.users = data;
    if (table === 'doctors') global.doctors = data;
    if (table === 'services') global.services = data;
    if (table === 'packages') global.packages = data;
    if (table === 'settings' && data && !Array.isArray(data)) global.settings = data;
    if (table === 'inventoryItems') global.inventoryItems = data;
    if (table === 'inventorySuppliers') global.inventorySuppliers = data;
    if (table === 'inventoryMovements') global.inventoryMovements = data;
  }

  function createRepository(adapter) {
    adapter = adapter || createLocalStorageAdapter();

    const repository = {
      adapter,
      SYNCED_TABLES,
      isSyncedTable,
      _tables: {},

      init() {
        this._revisions = loadRevisions(adapter);
        return this;
      },

      tableKey(table) {
        const map = {
          cases: 'cases',
          clientsRegistry: 'clientsRegistry',
          bookings: 'bookings',
          users: 'users',
          doctors: 'doctors',
          settings: 'settings',
          expenses: 'expenses',
          packages: 'packages',
          services: 'services',
          activityLog: 'activityLog',
          attendance: 'attendance',
          inventoryItems: 'inventoryItems',
          inventorySuppliers: 'inventorySuppliers',
          inventoryMovements: 'inventoryMovements'
        };
        return map[table] || table;
      },

      get(table, id) {
        const key = this.tableKey(table);
        const data = adapter.get(key, Array.isArray(this._defaultFor(table)) ? [] : {});
        if (id == null) return data;
        if (Array.isArray(data)) return data.find(r => r && r.id === id) || null;
        if (typeof data === 'object') return data[id] ?? null;
        return null;
      },

      upsert(table, record, options) {
        options = options || {};
        if (!record?.id) return { ok: false, error: 'missing_id' };
        if (global.BranchScope?.ensureRecordBranch) {
          record = global.BranchScope.ensureRecordBranch(record, options.branchId);
        }
        if (global.BranchScope?.assertWriteAllowed) {
          const access = global.BranchScope.assertWriteAllowed(
            global.currentUser,
            record.branchId || options.branchId,
            options
          );
          if (!access.ok) return access;
        }
        const key = this.tableKey(table);
        let data = adapter.get(key, Array.isArray(this._defaultFor(table)) ? [] : {});
        const RM = global.RecordMetadata;
        if (Array.isArray(data)) {
          const idx = data.findIndex(r => r && r.id === record.id);
          if (idx >= 0) {
            record = RM?.stampUpdate ? RM.stampUpdate(record, data[idx], options) : record;
            data[idx] = record;
          } else {
            record = RM?.stampNew ? RM.stampNew(record, options) : record;
            data.push(record);
          }
        } else if (typeof data === 'object' && data !== null) {
          const prev = data[record.id];
          record = prev && RM?.stampUpdate ? RM.stampUpdate(record, prev, options) : (RM?.stampNew ? RM.stampNew(record, options) : record);
          data = { ...data, [record.id]: record };
        } else {
          record = RM?.stampNew ? RM.stampNew(record, options) : record;
          data = [record];
        }
        adapter.set(key, data);
        syncGlobal(table, data);
        this.bumpRevision(table);
        return { ok: true, record };
      },

      set(table, id, record) {
        return this.upsert(table, { ...record, id: id || record.id });
      },

      setAll(table, value, options) {
        options = options || {};
        const key = this.tableKey(table);
        const RM = global.RecordMetadata;
        if (Array.isArray(value) && isSyncedTable(table) && !options.skipMetadata) {
          value = value.map(r => {
            if (!r || !r.id) return r;
            return RM?.migrateLegacy ? RM.migrateLegacy(r, options.branchId) : r;
          });
        }
        adapter.set(key, value);
        syncGlobal(table, value);
        this.bumpRevision(table);
        return value;
      },

      delete(table, id) {
        const key = this.tableKey(table);
        let data = adapter.get(key, []);
        if (!Array.isArray(data)) return false;
        const next = data.filter(r => r && r.id !== id);
        if (next.length === data.length) return false;
        adapter.set(key, next);
        syncGlobal(table, next);
        this.bumpRevision(table);
        return true;
      },

      query(table, filter) {
        const data = this.get(table);
        if (!Array.isArray(data)) return [];
        if (!filter || typeof filter !== 'object') return data.slice();
        return data.filter(row => {
          if (!row) return false;
          return Object.keys(filter).every(k => row[k] === filter[k]);
        });
      },

      getRevision(table) {
        if (!this._revisions) this.init();
        return Number(this._revisions[table]) || 0;
      },

      bumpRevision(table) {
        if (!this._revisions) this.init();
        const n = (Number(this._revisions[table]) || 0) + 1;
        this._revisions[table] = n;
        saveRevisions(adapter, this._revisions);
        if (typeof global.VersionsIndex?.onRepositoryBump === 'function') {
          try { global.VersionsIndex.onRepositoryBump(table); } catch { /* empty */ }
        }
        return n;
      },

      getAllRevisions() {
        if (!this._revisions) this.init();
        return { ...this._revisions };
      },

      _defaultFor(table) {
        return ['cases', 'bookings', 'clientsRegistry', 'doctors', 'users', 'expenses',
          'attendance', 'inventoryItems', 'inventorySuppliers', 'inventoryMovements'].includes(table) ? [] : {};
      }
    };

    repository.init();
    return repository;
  }

  global.RepositoryFactory = {
    REVISIONS_KEY,
    SYNCED_TABLES,
    createLocalStorageAdapter,
    createRepository,
    isSyncedTable
  };

  if (!global.Repository && global.DB) {
    global.Repository = createRepository(createLocalStorageAdapter(global.DB));
  }
})(typeof window !== 'undefined' ? window : globalThis);
