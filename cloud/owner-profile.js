/**
 * Owner Profile Store (Phase 23)
 * Additive storage for organization owner credentials metadata.
 * No login/startup flow changes in this phase.
 */
(function (global) {
  'use strict';

  const OWNER_PROFILE_KEY = '__tdw_owner_profile__';

  function nowIso() {
    return new Date().toISOString();
  }

  function normalizeUsername(username) {
    return String(username || '').trim().toLowerCase();
  }

  function normalizeRecoveryCode(code) {
    return String(code || '').trim();
  }

  function hasCryptoSubtle() {
    return !!(global.crypto && global.crypto.subtle && global.TextEncoder);
  }

  function randomSaltHex(size) {
    size = Number(size) || 16;
    const bytes = new Uint8Array(Math.max(8, size));
    if (global.crypto?.getRandomValues) global.crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = (Math.random() * 256) | 0;
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function sha256Hex(text) {
    if (hasCryptoSubtle()) {
      const msg = new TextEncoder().encode(String(text || ''));
      const digest = await global.crypto.subtle.digest('SHA-256', msg);
      return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback for non-browser test contexts.
    let hash = 2166136261 >>> 0;
    const s = String(text || '');
    for (let i = 0; i < s.length; i++) {
      hash ^= s.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return ('00000000' + (hash >>> 0).toString(16)).slice(-8);
  }

  async function derivePasswordHash(username, password, salt) {
    const payload = `${normalizeUsername(username)}|${String(password || '')}|${String(salt || '')}|tdw-owner-v1`;
    const hash = await sha256Hex(payload);
    return `sha256:${hash}`;
  }

  async function deriveRecoveryHash(recoveryCode, salt) {
    const payload = `${normalizeRecoveryCode(recoveryCode)}|${String(salt || '')}|tdw-owner-recovery-v1`;
    const hash = await sha256Hex(payload);
    return `sha256:${hash}`;
  }

  function loadProfile() {
    const data = global.DB?.get?.(OWNER_PROFILE_KEY, null);
    if (!data || typeof data !== 'object') return null;
    return data;
  }

  function hasProfile() {
    return !!loadProfile();
  }

  function clearProfile() {
    try { global.DB?.set?.(OWNER_PROFILE_KEY, null); } catch { /* empty */ }
    return { ok: true };
  }

  function getCloudIdentity() {
    const lic = global.LicenseCloud?.loadLocal?.() || {};
    const id = lic.ownerIdentity || {};
    return {
      authorizedEmail: id.authorizedEmail || '',
      authorizedEmailDigest: id.authorizedEmailDigest || '',
      boundGoogleEmail: id.boundGoogleEmail || '',
      boundAt: id.boundAt || '',
      identityRevision: id.identityRevision || 0
    };
  }

  async function createProfile(input) {
    input = input || {};
    const username = normalizeUsername(input.username);
    const password = String(input.password || '');
    const recoveryCode = normalizeRecoveryCode(input.recoveryCode || input.recoveryPin || '');

    if (!username) return { ok: false, error: 'username_required' };
    if (!password) return { ok: false, error: 'password_required' };
    if (!recoveryCode) return { ok: false, error: 'recovery_required' };
    if (hasProfile()) return { ok: false, error: 'profile_exists' };

    const salt = randomSaltHex(16);
    const passwordHash = await derivePasswordHash(username, password, salt);
    const recoveryHash = await deriveRecoveryHash(recoveryCode, salt);
    const orgId = global.Organization?.getId?.() || global.CenterId?.getStoredCenterId?.() || '';
    const centerId = global.CenterId?.getStoredCenterId?.() || orgId || '';
    const profile = {
      schemaVersion: 1,
      role: 'owner',
      username,
      passwordHash,
      salt,
      recovery: {
        type: input.recoveryPin ? 'pin' : 'code',
        hash: recoveryHash
      },
      orgId,
      centerId,
      cloudIdentity: getCloudIdentity(),
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    global.DB?.set?.(OWNER_PROFILE_KEY, profile);
    return { ok: true, profile };
  }

  async function verifyPassword(username, password) {
    const profile = loadProfile();
    if (!profile) return false;
    if (normalizeUsername(username) !== profile.username) return false;
    const hash = await derivePasswordHash(username, password, profile.salt);
    return hash === profile.passwordHash;
  }

  async function verifyRecoveryCode(code) {
    const profile = loadProfile();
    if (!profile) return false;
    const hash = await deriveRecoveryHash(code, profile.salt);
    return hash === profile?.recovery?.hash;
  }

  async function rotatePassword(nextPassword) {
    const profile = loadProfile();
    if (!profile) return { ok: false, error: 'profile_missing' };
    const p = String(nextPassword || '');
    if (!p) return { ok: false, error: 'password_required' };
    profile.passwordHash = await derivePasswordHash(profile.username, p, profile.salt);
    profile.updatedAt = nowIso();
    global.DB?.set?.(OWNER_PROFILE_KEY, profile);
    return { ok: true, profile };
  }

  function summarize() {
    const profile = loadProfile();
    if (!profile) return { exists: false };
    return {
      exists: true,
      role: profile.role || 'owner',
      username: profile.username || '',
      orgId: profile.orgId || '',
      centerId: profile.centerId || '',
      createdAt: profile.createdAt || '',
      updatedAt: profile.updatedAt || '',
      recoveryType: profile?.recovery?.type || 'code',
      hasCloudIdentity: !!(
        profile?.cloudIdentity?.boundGoogleEmail ||
        profile?.cloudIdentity?.authorizedEmail ||
        profile?.cloudIdentity?.authorizedEmailDigest
      )
    };
  }

  global.OwnerProfile = {
    OWNER_PROFILE_KEY,
    normalizeUsername,
    normalizeRecoveryCode,
    hasProfile,
    loadProfile,
    clearProfile,
    createProfile,
    verifyPassword,
    verifyRecoveryCode,
    rotatePassword,
    summarize
  };
})(typeof window !== 'undefined' ? window : globalThis);
