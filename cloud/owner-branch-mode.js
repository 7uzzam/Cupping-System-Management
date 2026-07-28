/**
 * Owner Branch Mode (Phase 30)
 * Owner can temporarily work in a selected branch context, then return to owner mode.
 */
(function (global) {
  'use strict';

  const MODE_KEY = '__tdw_owner_mode__';

  function load() {
    try {
      const raw = sessionStorage.getItem(MODE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') return data;
      }
    } catch { /* empty */ }
    return { mode: 'owner', branchId: null, updatedAt: null };
  }

  function save(state) {
    const next = { mode: 'owner', branchId: null, updatedAt: new Date().toISOString(), ...(state || {}) };
    try { sessionStorage.setItem(MODE_KEY, JSON.stringify(next)); } catch { /* empty */ }
    return next;
  }

  function getMode() {
    const state = load();
    return state.mode === 'branch' ? 'branch' : 'owner';
  }

  function getBranchId() {
    const state = load();
    return state.mode === 'branch' ? (state.branchId || null) : null;
  }

  function isOwnerMode() {
    return getMode() === 'owner';
  }

  function isBranchMode() {
    return getMode() === 'branch';
  }

  function enterBranchMode(branchId) {
    branchId = String(branchId || '').trim();
    if (!branchId) return { ok: false, error: 'branch_required' };
    if (!global.RolePolicy?.isOrganizationOwner?.(global.currentUser)) {
      return { ok: false, error: 'owner_required' };
    }
    save({ mode: 'branch', branchId });
    global.BranchScope?.setActiveBranchId?.(branchId);
    return { ok: true, mode: 'branch', branchId };
  }

  function exitToOwnerMode() {
    save({ mode: 'owner', branchId: null });
    global.BranchScope?.initSessionBranch?.();
    return { ok: true, mode: 'owner' };
  }

  function getLabel(branchNameResolver) {
    if (isOwnerMode()) return 'Owner Mode';
    const branchId = getBranchId();
    const label = typeof branchNameResolver === 'function' ? branchNameResolver(branchId) : branchId;
    return `Branch Mode: ${label || branchId || '—'}`;
  }

  global.OwnerBranchMode = {
    MODE_KEY,
    load,
    save,
    getMode,
    getBranchId,
    isOwnerMode,
    isBranchMode,
    enterBranchMode,
    exitToOwnerMode,
    getLabel
  };
})(typeof window !== 'undefined' ? window : globalThis);
