/**
 * Conflict Queue — conflicts held for manager resolution; closed after resolve with audit trail.
 */
(function (global) {
  'use strict';

  const QUEUE_KEY = '__tdw_conflict_queue__';
  const ARCHIVE_KEY = '__tdw_conflict_archive__';
  const MAX_ARCHIVE = 300;

  const TABLE_LABELS = {
    cases: 'فاتورة',
    clientsRegistry: 'عميل',
    bookings: 'حجز',
    attendance: 'حضور',
    expenses: 'مصروف',
    settings: 'إعدادات',
    users: 'مستخدم',
    services: 'خدمة',
    packages: 'باقة',
    inventoryItems: 'صنف مخزون',
    inventoryMovements: 'حركة مخزون',
    doctors: 'موظف'
  };

  function recordLabel(table) {
    return TABLE_LABELS[table] || 'سجل';
  }

  function friendlySummary(item) {
    const label = recordLabel(item.table);
    const num = item.recordId || item.local?.invoiceNo || item.local?.number || item.recordId || '';
    const devices = [item.local?.deviceId, item.remote?.deviceId].filter(Boolean);
    const deviceNote = devices.length >= 2 && devices[0] !== devices[1]
      ? ' — تم تعديلها على جهازين مختلفين'
      : '';
    return `تم العثور على تعديلين مختلفين على ${label} رقم ${num}${deviceNote}`;
  }

  function loadQueue() {
    return global.DB?.get?.(QUEUE_KEY, []) || [];
  }

  function saveQueue(list) {
    global.DB?.set?.(QUEUE_KEY, list);
    return list;
  }

  function loadArchive() {
    return global.DB?.get?.(ARCHIVE_KEY, []) || [];
  }

  function saveArchive(list) {
    global.DB?.set?.(ARCHIVE_KEY, list.slice(0, MAX_ARCHIVE));
    return list;
  }

  function enqueue(entry) {
    entry = entry || {};
    const list = loadQueue();
    const id = entry.id || `cf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const item = {
      id,
      status: 'pending',
      table: entry.table || '',
      recordId: entry.recordId || entry.id || '',
      branchId: entry.branchId || global.BranchScope?.getActiveBranchId?.() || '',
      local: entry.local || null,
      remote: entry.remote || null,
      fields: entry.fields || [],
      reason: entry.reason || 'diverged',
      detectedAt: new Date().toISOString(),
      deviceId: global.RecordMetadata?.getDeviceId?.() || '',
      detectedBy: global.RecordMetadata?.getUserLabel?.() || 'system',
      summary: ''
    };
    item.summary = friendlySummary(item);
    const existing = list.findIndex(x => x.status === 'pending' && x.table === item.table && x.recordId === item.recordId);
    if (existing >= 0) list[existing] = { ...list[existing], ...item, updatedAt: new Date().toISOString() };
    else list.unshift(item);
    saveQueue(list.slice(0, 200));

    global.AuditLogger?.logSyncEvent?.('CONFLICT_DETECTED', {
      entity: item.table,
      entityId: item.recordId,
      summary: item.summary,
      fields: item.fields
    });

    if (global.RolePolicy?.isManager?.(global.currentUser)) {
      global.ConflictManagerUI?.notifyPending?.();
    }

    return item;
  }

  function enqueueMany(conflicts, table, branchId) {
    return (conflicts || []).map(c => enqueue({
      table,
      branchId,
      recordId: c.id,
      local: c.local,
      remote: c.remote,
      fields: c.fields,
      reason: c.reason
    }));
  }

  function list(options) {
    options = options || {};
    let q = loadQueue();
    if (options.status) q = q.filter(x => x.status === options.status);
    if (options.table) q = q.filter(x => x.table === options.table);
    if (options.branchId) q = q.filter(x => x.branchId === options.branchId);
    return q;
  }

  function getHistory(options) {
    options = options || {};
    let archive = loadArchive();
    if (options.table) archive = archive.filter(x => x.table === options.table);
    if (options.since) {
      const since = new Date(options.since).getTime();
      archive = archive.filter(x => new Date(x.resolvedAt || x.detectedAt).getTime() >= since);
    }
    return archive;
  }

  function countPending() {
    return list({ status: 'pending' }).length;
  }

  function applyResolutionToRepo(item, resolution) {
    const table = item.table;
    const repo = global.Repository;
    if (!repo?.get || !repo?.upsert) return { ok: false, error: 'no_repository' };
    const choice = resolution.choice || 'local';
    let record = null;

    if (choice === 'local') record = { ...item.local };
    else if (choice === 'cloud' || choice === 'remote') record = { ...item.remote };
    else if ((choice === 'manual' || choice === 'merge') && resolution.record) record = { ...resolution.record };
    else return { ok: false, error: 'invalid_resolution' };

    if (!record.id) record.id = item.recordId;
    repo.upsert(table, record, { branchId: item.branchId, source: 'conflict_resolve' });
    return { ok: true, record };
  }

  function resolve(conflictId, resolution) {
    resolution = resolution || {};
    const list = loadQueue();
    const idx = list.findIndex(x => x.id === conflictId);
    if (idx < 0) return { ok: false, error: 'not_found' };
    const item = list[idx];
    if (item.status !== 'pending') return { ok: false, error: 'already_resolved' };
    if (!global.RolePolicy?.canResolveConflicts?.()) {
      return { ok: false, error: 'manager_only' };
    }

    const applied = applyResolutionToRepo(item, resolution);
    if (!applied.ok && resolution.choice !== 'defer') return applied;

    item.status = 'resolved';
    item.resolvedAt = new Date().toISOString();
    item.resolvedBy = global.RecordMetadata?.getUserLabel?.() || 'manager';
    item.resolution = resolution.choice || 'manual';
    item.resolvedRecord = applied.record || resolution.record || null;
    list.splice(idx, 1);
    saveQueue(list);

    const archive = loadArchive();
    archive.unshift({ ...item });
    saveArchive(archive);

    global.AuditLogger?.logSyncEvent?.('CONFLICT_RESOLVED', {
      entity: item.table,
      entityId: item.recordId,
      summary: `تم حل التعارض على ${recordLabel(item.table)} ${item.recordId} — ${resolution.choice === 'local' ? 'النسخة المحلية' : resolution.choice === 'cloud' ? 'نسخة السحابة' : 'دمج يدوي'}`,
      resolution: item.resolution,
      before: item.local,
      after: item.resolvedRecord
    });

    if (countPending() === 0) global.SyncGuard?.resume?.({ state: 'conflicts_resolved' });

    return { ok: true, item };
  }

  function getFieldDiff(item) {
    const fields = item.fields || [];
    const diff = [];
    fields.forEach(f => {
      diff.push({
        field: f,
        local: item.local?.[f],
        remote: item.remote?.[f]
      });
    });
    return diff;
  }

  global.ConflictQueue = {
    QUEUE_KEY,
    ARCHIVE_KEY,
    TABLE_LABELS,
    recordLabel,
    friendlySummary,
    loadQueue,
    enqueue,
    enqueueMany,
    list,
    getHistory,
    countPending,
    resolve,
    getFieldDiff,
    applyResolutionToRepo
  };
})(typeof window !== 'undefined' ? window : globalThis);
