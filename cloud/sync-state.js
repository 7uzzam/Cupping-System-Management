/**
 * Local sync-state — pending pushes, poll timestamps (Cloud V2 Sprint 4).
 */
(function (global) {
  'use strict';

  const SYNC_STATE_KEY = '__tdw_sync_state__';
  const DEFAULT_POLL_MS = 15000;

  function defaultState() {
    return {
      lastPollAt: null,
      lastPushAt: null,
      pendingPushes: [],
      online: typeof navigator !== 'undefined' ? navigator.onLine !== false : true,
      pollIntervalMs: DEFAULT_POLL_MS,
      lastError: null,
      retryBackoffMs: 0
    };
  }

  function load() {
    const raw = global.DB?.get?.(SYNC_STATE_KEY, null);
    if (raw && typeof raw === 'object') return { ...defaultState(), ...raw };
    return defaultState();
  }

  function save(state) {
    global.DB?.set?.(SYNC_STATE_KEY, state);
    return state;
  }

  function touchPoll() {
    const s = load();
    s.lastPollAt = new Date().toISOString();
    s.lastError = null;
    return save(s);
  }

  function touchPush() {
    const s = load();
    s.lastPushAt = new Date().toISOString();
    s.retryBackoffMs = 0;
    return save(s);
  }

  function setOnline(on) {
    const s = load();
    s.online = !!on;
    return save(s);
  }

  function queuePush(entry) {
    const s = load();
    entry = {
      layer: entry.layer,
      table: entry.table,
      branchId: entry.branchId,
      revision: entry.revision || 0,
      queuedAt: new Date().toISOString()
    };
    s.pendingPushes = (s.pendingPushes || []).filter(p =>
      !(p.layer === entry.layer && p.table === entry.table && p.branchId === entry.branchId)
    );
    s.pendingPushes.push(entry);
    return save(s);
  }

  function dequeuePush(layer, table, branchId) {
    const s = load();
    s.pendingPushes = (s.pendingPushes || []).filter(p =>
      !(p.layer === layer && p.table === table && p.branchId === branchId)
    );
    return save(s);
  }

  function clearPending() {
    const s = load();
    s.pendingPushes = [];
    return save(s);
  }

  function setError(msg) {
    const s = load();
    s.lastError = msg || null;
    s.retryBackoffMs = Math.min(300000, Math.max(4000, (Number(s.retryBackoffMs) || 4000) * 2));
    return save(s);
  }

  function clearError() {
    const s = load();
    s.lastError = null;
    s.retryBackoffMs = 0;
    return save(s);
  }

  function getStatus() {
    const s = load();
    return {
      lastPollAt: s.lastPollAt,
      lastPushAt: s.lastPushAt,
      pending: (s.pendingPushes || []).length,
      online: s.online,
      lastError: s.lastError,
      pollIntervalMs: s.pollIntervalMs || DEFAULT_POLL_MS
    };
  }

  global.SyncState = {
    SYNC_STATE_KEY,
    DEFAULT_POLL_MS,
    defaultState,
    load,
    save,
    touchPoll,
    touchPush,
    setOnline,
    queuePush,
    dequeuePush,
    clearPending,
    setError,
    clearError,
    getStatus
  };
})(typeof window !== 'undefined' ? window : globalThis);
