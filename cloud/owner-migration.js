/**
 * Owner Migration Assistant (Phase 37)
 * Helps legacy installations bootstrap owner profile without rewriting login flow.
 */
(function (global) {
  'use strict';

  const MIGRATION_KEY = '__tdw_owner_migration__';

  function loadState() {
    const raw = global.DB?.get?.(MIGRATION_KEY, null);
    if (!raw || typeof raw !== 'object') {
      return { completed: false, skipped: false, updatedAt: null };
    }
    return {
      completed: !!raw.completed,
      skipped: !!raw.skipped,
      updatedAt: raw.updatedAt || null
    };
  }

  function saveState(next) {
    const state = {
      ...loadState(),
      ...(next || {}),
      updatedAt: new Date().toISOString()
    };
    global.DB?.set?.(MIGRATION_KEY, state);
    return state;
  }

  function hasConsumedActivation() {
    const lic = global.LicenseCloud?.loadLocal?.() || {};
    if (lic?.activation?.consumed) return true;
    try {
      const meta = global.licLoadMeta?.();
      return !!meta?.activationConsumed;
    } catch {
      return false;
    }
  }

  function hasManagerAccount() {
    return !!global.RolePolicy?.hasManagerAccount?.();
  }

  function shouldMigrate() {
    const st = loadState();
    if (st.completed || st.skipped) return false;
    if (global.OwnerProfile?.hasProfile?.()) return false;
    if (!hasConsumedActivation()) return false;
    if (!hasManagerAccount()) return false;
    return true;
  }

  function getStatus() {
    return {
      ...loadState(),
      needsMigration: shouldMigrate(),
      hasOwnerProfile: !!global.OwnerProfile?.hasProfile?.(),
      hasConsumedActivation: hasConsumedActivation(),
      hasManagerAccount: hasManagerAccount()
    };
  }

  async function runInteractiveMigration() {
    if (!shouldMigrate()) return { ok: false, error: 'not_required' };
    const username = (global.prompt?.('إنشاء Owner Profile (legacy) — اسم المستخدم') || '').trim();
    if (!username) return { ok: false, error: 'username_required' };
    const password = (global.prompt?.('كلمة المرور') || '').trim();
    if (!password) return { ok: false, error: 'password_required' };
    const recovery = (global.prompt?.('Recovery PIN/Code') || '').trim();
    if (!recovery) return { ok: false, error: 'recovery_required' };
    const res = await global.OwnerProfile?.createProfile?.({
      username,
      password,
      recoveryCode: recovery
    });
    if (!res?.ok) return res || { ok: false, error: 'create_failed' };
    saveState({ completed: true, skipped: false });
    try { global.OwnerSetupState?.clearRequired?.(); } catch { /* empty */ }
    global.AuditLogger?.log?.({
      action: 'OWNER_MIGRATION_COMPLETED',
      entity: 'owner_profile',
      entityId: username,
      summary: 'Legacy owner migration completed'
    });
    return { ok: true, profile: res.profile };
  }

  function skipMigration() {
    saveState({ skipped: true });
    return { ok: true };
  }

  global.OwnerMigration = {
    MIGRATION_KEY,
    loadState,
    saveState,
    hasConsumedActivation,
    hasManagerAccount,
    shouldMigrate,
    getStatus,
    runInteractiveMigration,
    skipMigration
  };
})(typeof window !== 'undefined' ? window : globalThis);
