/**
 * Owner Setup State (Phase 24/25)
 * Tracks whether owner profile setup is required after first activation.
 */
(function (global) {
  'use strict';

  const OWNER_SETUP_KEY = '__tdw_owner_setup__';

  function loadState() {
    const raw = global.DB?.get?.(OWNER_SETUP_KEY, null);
    if (!raw || typeof raw !== 'object') {
      return { required: false, reason: '', updatedAt: null, activatedAt: null };
    }
    return {
      required: !!raw.required,
      reason: String(raw.reason || ''),
      updatedAt: raw.updatedAt || null,
      activatedAt: raw.activatedAt || null
    };
  }

  function saveState(next) {
    const cur = loadState();
    const state = {
      ...cur,
      ...(next || {}),
      required: !!(next && next.required),
      updatedAt: new Date().toISOString()
    };
    global.DB?.set?.(OWNER_SETUP_KEY, state);
    return state;
  }

  function isRequired() {
    return !!loadState().required;
  }

  function markRequired(reason) {
    return saveState({ required: true, reason: reason || 'activation', activatedAt: new Date().toISOString() });
  }

  function clearRequired() {
    return saveState({ required: false, reason: 'completed' });
  }

  function ensureFromActivation() {
    const hasOwnerProfile = !!global.OwnerProfile?.hasProfile?.();
    if (hasOwnerProfile) return clearRequired();
    return markRequired('activation');
  }

  global.OwnerSetupState = {
    OWNER_SETUP_KEY,
    loadState,
    saveState,
    isRequired,
    markRequired,
    clearRequired,
    ensureFromActivation
  };
})(typeof window !== 'undefined' ? window : globalThis);
