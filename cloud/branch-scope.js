/**
 * Branch Scope (user account) + activeBranchId session.
 * Device branch lock is sync/diagnostics only — permissions use user.branchScope.
 */
(function (global) {
  'use strict';

  const ACTIVE_BRANCH_KEY = '__tdw_active_branch__';
  const DEFAULT_BRANCH_ID = 'BR-MAIN';

  const ROLE_DEFAULTS = {
    reception: { branchScope: null, canSwitchBranch: false },
    employee: { branchScope: null, canSwitchBranch: false },
    doctor: { branchScope: null, canSwitchBranch: false },
    accountant: { branchScope: ['*'], canSwitchBranch: true },
    branch_manager: { branchScope: null, canSwitchBranch: false },
    admin: { branchScope: ['*'], canSwitchBranch: true },
    owner: { branchScope: ['*'], canSwitchBranch: true },
    hq_admin: { branchScope: ['*'], canSwitchBranch: true }
  };

  function getDeviceBranchId() {
    if (global.DeviceConfig?.isBranchLocked?.()) {
      return global.DeviceConfig.getLockedBranchId() || DEFAULT_BRANCH_ID;
    }
    return global.DeviceConfig?.getLockedBranchId?.() || DEFAULT_BRANCH_ID;
  }

  function getActiveBranchId() {
    try {
      const raw = sessionStorage.getItem(ACTIVE_BRANCH_KEY);
      if (raw) return raw;
    } catch { /* empty */ }
    return getDeviceBranchId() || DEFAULT_BRANCH_ID;
  }

  function setActiveBranchId(branchId) {
    if (!branchId) return;
    try { sessionStorage.setItem(ACTIVE_BRANCH_KEY, branchId); } catch { /* empty */ }
    global.activeBranchId = branchId;
  }

  function clearActiveBranchId() {
    try { sessionStorage.removeItem(ACTIVE_BRANCH_KEY); } catch { /* empty */ }
    global.activeBranchId = getDeviceBranchId() || DEFAULT_BRANCH_ID;
  }

  function defaultScopeForRole(role) {
    const d = ROLE_DEFAULTS[role] || ROLE_DEFAULTS.reception;
    if (d.branchScope === null) {
      return { branchScope: [DEFAULT_BRANCH_ID], canSwitchBranch: !!d.canSwitchBranch };
    }
    return { branchScope: d.branchScope.slice(), canSwitchBranch: !!d.canSwitchBranch };
  }

  function applyDefaultScopeToUser(user) {
    if (!user || typeof user !== 'object') return user;
    if (Array.isArray(user.branchScope) && user.branchScope.length) return user;
    const defs = defaultScopeForRole(user.role);
    user.branchScope = defs.branchScope;
    user.canSwitchBranch = user.canSwitchBranch != null ? !!user.canSwitchBranch : defs.canSwitchBranch;
    return user;
  }

  function migrateUsersScope(users) {
    if (!Array.isArray(users)) return users;
    return users.map(u => applyDefaultScopeToUser({ ...u }));
  }

  function getUserBranchScope(user) {
    if (!user) return [];
    applyDefaultScopeToUser(user);
    const scope = Array.isArray(user.branchScope) ? user.branchScope : [];
    if (scope.length) return scope;
    return defaultScopeForRole(user.role).branchScope;
  }

  function canUserSwitchBranch(user) {
    if (!user) return false;
    applyDefaultScopeToUser(user);
    return !!user.canSwitchBranch;
  }

  function userCanAccessBranch(user, branchId) {
    if (!branchId) return true;
    const scope = getUserBranchScope(user);
    if (scope.includes('*')) return true;
    return scope.includes(branchId);
  }

  function filterByBranch(records, branchId) {
    if (!Array.isArray(records)) return records;
    branchId = branchId || getActiveBranchId();
    if (!branchId) return records.slice();
    return records.filter(r => {
      if (!r || typeof r !== 'object') return false;
      if (!r.branchId) return branchId === DEFAULT_BRANCH_ID;
      return r.branchId === branchId;
    });
  }

  function ensureRecordBranch(record, branchId) {
    if (!record || typeof record !== 'object') return record;
    if (!record.branchId) {
      record.branchId = branchId || getActiveBranchId() || DEFAULT_BRANCH_ID;
    }
    const centerId = global.DeviceConfig?.getCenterIdFromConfig?.() || global.CenterId?.getStoredCenterId?.();
    if (centerId && !record.centerId) record.centerId = centerId;
    return record;
  }

  function guardBranchAccess(user, branchId, actionLabel) {
    if (userCanAccessBranch(user, branchId)) return true;
    if (typeof global.notify === 'function') {
      global.notify(actionLabel || '⛔ لا يمكنك الوصول لهذا الفرع', 'danger');
    }
    return false;
  }

  const TRUSTED_WRITE_SOURCES = new Set([
    'import',
    'import_legacy',
    'conflict_resolve',
    'wipe',
    'bootstrap',
    'sync',
    'poll',
    'push',
    'migration'
  ]);

  function assertWriteAllowed(user, branchId, options) {
    options = options || {};
    if (options.skipBranchGuard) return { ok: true, skipped: true };
    if (options.source && TRUSTED_WRITE_SOURCES.has(options.source)) {
      return { ok: true, skipped: true, source: options.source };
    }
    if (!user) return { ok: true, skipped: true };
    if (!branchId) return { ok: true };
    if (userCanAccessBranch(user, branchId)) return { ok: true, branchId };
    return { ok: false, error: 'branch_access_denied', branchId };
  }

  function filterByUserScope(records, user) {
    if (!Array.isArray(records)) return records;
    const scope = getUserBranchScope(user);
    if (!scope.length || scope.includes('*')) return records.slice();
    return records.filter((r) => {
      if (!r || typeof r !== 'object') return false;
      const bid = r.branchId || DEFAULT_BRANCH_ID;
      return scope.includes(bid);
    });
  }

  function initSessionBranch() {
    const user = global.currentUser;
    if (!user) {
      global.activeBranchId = getActiveBranchId();
      return;
    }
    const scope = getUserBranchScope(user);
    const preferred = scope.includes('*')
      ? (getDeviceBranchId() || DEFAULT_BRANCH_ID)
      : (scope[0] || DEFAULT_BRANCH_ID);
    if (!canUserSwitchBranch(user)) {
      setActiveBranchId(preferred);
      return;
    }
    const current = getActiveBranchId();
    if (!userCanAccessBranch(user, current)) {
      setActiveBranchId(preferred);
    } else {
      global.activeBranchId = current;
    }
  }

  global.BranchScope = {
    ACTIVE_BRANCH_KEY,
    DEFAULT_BRANCH_ID,
    ROLE_DEFAULTS,
    getDeviceBranchId,
    getActiveBranchId,
    setActiveBranchId,
    clearActiveBranchId,
    defaultScopeForRole,
    applyDefaultScopeToUser,
    migrateUsersScope,
    getUserBranchScope,
    canUserSwitchBranch,
    userCanAccessBranch,
    filterByBranch,
    filterByUserScope,
    ensureRecordBranch,
    guardBranchAccess,
    assertWriteAllowed,
    TRUSTED_WRITE_SOURCES,
    initSessionBranch
  };

  global.activeBranchId = getActiveBranchId();
  global.filterByBranch = filterByBranch;
})(typeof window !== 'undefined' ? window : globalThis);
