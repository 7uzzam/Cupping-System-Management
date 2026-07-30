'use strict';

/**
 * Dual-device peer sync harness (V2-4).
 * Uses production SQLite outbox + a filesystem remote that mirrors Drive layout.
 * Google Drive adapter can replace FileRemote when OAuth tokens are available.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { openDatabase } = require('./connection');
const { createSyncPlatform } = require('./sync-outbox');

function sha256(s) {
  return crypto.createHash('sha256').update(String(s), 'utf8').digest('hex');
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

class FileRemote {
  constructor(root) {
    this.root = root;
    ensureDir(root);
  }

  centerRoot(centerId) {
    return path.join(this.root, 'NajjarTech', String(centerId));
  }

  branchDir(centerId, branchId) {
    return path.join(this.centerRoot(centerId), 'branches', String(branchId));
  }

  versionsPath(centerId, branchId) {
    return path.join(this.branchDir(centerId, branchId), 'versions.json');
  }

  tablePath(centerId, branchId, table) {
    return path.join(this.branchDir(centerId, branchId), 'operational', `${table}.json`);
  }

  readJson(file) {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }

  writeAtomic(file, obj) {
    ensureDir(path.dirname(file));
    const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
    const body = JSON.stringify(obj, null, 2);
    fs.writeFileSync(tmp, body);
    const hash = sha256(body);
    // verify temp
    const verify = sha256(fs.readFileSync(tmp));
    if (verify !== hash) throw new Error('remote_temp_checksum_mismatch');
    fs.renameSync(tmp, file);
    return { fileId: sha256(file + ':' + hash).slice(0, 32), hash, path: file };
  }

  getVersions(centerId, branchId) {
    return this.readJson(this.versionsPath(centerId, branchId)) || {
      schemaVersion: 1,
      formatVersion: 1,
      centerId,
      branchId,
      tables: {},
      updatedAt: null,
    };
  }

  putTable(centerId, branchId, table, revision, records, deviceId) {
    const payload = {
      centerId,
      branchId,
      table,
      revision,
      deviceId,
      updatedAt: new Date().toISOString(),
      records,
      payloadHash: sha256(JSON.stringify(records)),
    };
    const written = this.writeAtomic(this.tablePath(centerId, branchId, table), payload);
    const versions = this.getVersions(centerId, branchId);
    versions.tables[table] = {
      revision,
      checksum: payload.payloadHash,
      fileId: written.fileId,
      updatedAt: payload.updatedAt,
      lastWriter: deviceId,
    };
    versions.updatedAt = payload.updatedAt;
    this.writeAtomic(this.versionsPath(centerId, branchId), versions);
    return { ...written, payloadHash: payload.payloadHash, revision };
  }

  getTable(centerId, branchId, table) {
    return this.readJson(this.tablePath(centerId, branchId, table));
  }
}

function createDevice(options) {
  const dir = options.userDataDir;
  ensureDir(path.join(dir, 'database'));
  const dbPath = path.join(dir, 'database', 'tadawi.db');
  const db = openDatabase(dbPath);
  const sync = createSyncPlatform(db);
  const state = {
    centerId: options.centerId,
    branchId: options.branchId || 'BR-MAIN',
    deviceId: options.deviceId,
    tables: Object.create(null),
    revisions: Object.create(null),
  };

  function getAll(table) {
    return Array.isArray(state.tables[table]) ? state.tables[table].slice() : [];
  }

  function setAll(table, records, actorId) {
    const list = Array.isArray(records) ? records.slice() : [];
    const base = Number(state.revisions[table] || 0);
    const next = base + 1;
    const payload = JSON.stringify(list);
    const result = sync.enqueueAtomic(
      {
        center_id: state.centerId,
        branch_id: state.branchId,
        table_name: table,
        record_id: null,
        operation: 'TABLE_BUMP',
        base_revision: base,
        new_revision: next,
        payload_json: payload,
        device_id: state.deviceId,
        actor_id: actorId || state.deviceId,
      },
      () => {
        state.tables[table] = list;
        state.revisions[table] = next;
        db.prepare(
          `INSERT INTO sync_meta(key, value, updated_at) VALUES(?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`
        ).run(`rev:${table}`, String(next), new Date().toISOString());
      }
    );
    return { ok: true, revision: next, outbox: result };
  }

  function upsertRecord(table, record, actorId) {
    const list = getAll(table);
    const idx = list.findIndex((r) => r && r.id === record.id);
    const op = idx >= 0 ? 'UPDATE' : 'CREATE';
    if (idx >= 0) list[idx] = { ...list[idx], ...record, updatedAt: new Date().toISOString() };
    else list.push({ ...record, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    const base = Number(state.revisions[table] || 0);
    const next = base + 1;
    // detect conflict if remote base expected
    sync.enqueueAtomic(
      {
        center_id: state.centerId,
        branch_id: state.branchId,
        table_name: table,
        record_id: record.id,
        operation: op,
        base_revision: base,
        new_revision: next,
        payload_json: JSON.stringify(list),
        device_id: state.deviceId,
        actor_id: actorId || state.deviceId,
      },
      () => {
        state.tables[table] = list;
        state.revisions[table] = next;
      }
    );
    return { ok: true, revision: next, operation: op };
  }

  function flush(remote) {
    const claimed = sync.claimPending({ branch_id: state.branchId, limit: 100 });
    const results = [];
    for (const row of claimed) {
      try {
        const records = row.payload_json ? JSON.parse(row.payload_json) : getAll(row.table_name);
        const versions = remote.getVersions(state.centerId, state.branchId);
        const remoteMeta = versions.tables?.[row.table_name];
        const remoteRev = Number(remoteMeta?.revision || 0);
        if (remoteMeta && remoteRev > Number(row.base_revision || 0)) {
          const remoteTable = remote.getTable(state.centerId, state.branchId, row.table_name);
          const remoteRecords = remoteTable?.records || [];
          let opened = 0;
          for (const localRec of records) {
            if (!localRec?.id) continue;
            const rr = remoteRecords.find((x) => x && x.id === localRec.id);
            if (!rr) continue;
            if (JSON.stringify(rr) !== JSON.stringify(localRec)) {
              sync.openConflict({
                center_id: state.centerId,
                branch_id: state.branchId,
                table_name: row.table_name,
                record_id: localRec.id,
                base_revision: row.base_revision,
                local_json: localRec,
                remote_json: rr,
                device_id: state.deviceId,
              });
              opened += 1;
            }
          }
          if (opened > 0) {
            // Do not overwrite remote; leave event pending for resolution
            sync.fail(row.event_id, 'conflict_detected_push', { maxAttempts: 99 });
            // force back to pending (not dead-letter) for conflicts
            db.prepare(
              `UPDATE sync_outbox SET status='pending', last_error=?, next_attempt_at=? WHERE event_id=?`
            ).run('conflict_detected_push', new Date().toISOString(), row.event_id);
            results.push({ eventId: row.event_id, ok: false, conflict: true, opened });
            continue;
          }
        }
        const put = remote.putTable(
          state.centerId,
          state.branchId,
          row.table_name,
          row.new_revision,
          records,
          state.deviceId
        );
        sync.ack(row.event_id, put.fileId);
        sync.audit({
          action: 'sync.push.ack',
          center_id: state.centerId,
          branch_id: state.branchId,
          device_id: state.deviceId,
          entity: row.table_name,
          entity_id: row.record_id,
          result: 'ok',
          metadata_json: { remoteFileId: put.fileId, revision: row.new_revision },
        });
        results.push({ eventId: row.event_id, ok: true, fileId: put.fileId });
      } catch (err) {
        sync.fail(row.event_id, err.message || String(err));
        results.push({ eventId: row.event_id, ok: false, error: String(err.message || err) });
      }
    }
    return results;
  }

  function pull(remote) {
    const versions = remote.getVersions(state.centerId, state.branchId);
    const applied = [];
    for (const [table, meta] of Object.entries(versions.tables || {})) {
      const localRev = Number(state.revisions[table] || 0);
      const remoteRev = Number(meta.revision || 0);
      if (remoteRev <= localRev) continue;
      const remoteTable = remote.getTable(state.centerId, state.branchId, table);
      if (!remoteTable) continue;
      const payloadHash = remoteTable.payloadHash || sha256(JSON.stringify(remoteTable.records || []));
      const marked = sync.markRemoteApplied({
        center_id: state.centerId,
        branch_id: state.branchId,
        table_name: table,
        remote_revision: remoteRev,
        remote_file_id: meta.fileId,
        payload_hash: payloadHash,
        source_device_id: remoteTable.deviceId,
      });
      if (marked.duplicate) continue;

      // Same-record conflict: if local pending/unacked edits exist for table with overlapping ids
      const pending = sync.countByStatus(state.branchId);
      if ((pending.pending || 0) + (pending.inflight || 0) > 0 && localRev > 0) {
        const localRecords = getAll(table);
        const remoteRecords = remoteTable.records || [];
        for (const lr of localRecords) {
          const rr = remoteRecords.find((x) => x && x.id === lr.id);
          if (!rr) continue;
          if (JSON.stringify(lr) !== JSON.stringify(rr)) {
            sync.openConflict({
              center_id: state.centerId,
              branch_id: state.branchId,
              table_name: table,
              record_id: lr.id,
              base_revision: localRev,
              local_json: lr,
              remote_json: rr,
              device_id: state.deviceId,
            });
          }
        }
      }

      state.tables[table] = remoteTable.records || [];
      state.revisions[table] = remoteRev;
      applied.push({ table, revision: remoteRev, duplicate: false });
      sync.audit({
        action: 'sync.pull.apply',
        center_id: state.centerId,
        branch_id: state.branchId,
        device_id: state.deviceId,
        entity: table,
        result: 'ok',
        metadata_json: { revision: remoteRev },
      });
    }
    return { versions, applied };
  }

  function close() {
    try { db.close(); } catch { /* ignore */ }
  }

  return {
    db,
    sync,
    state,
    getAll,
    setAll,
    upsertRecord,
    flush,
    pull,
    close,
    dbPath,
  };
}

module.exports = {
  FileRemote,
  createDevice,
  sha256,
};
