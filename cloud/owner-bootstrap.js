/**
 * Owner Bootstrap (V2-3) — safe first-Owner paths.
 * Google Login is Authentication only; never Authorization / Owner claim.
 *
 * Supported claim paths (local/interim until server invitations land):
 *  1. One-time organization setup token (license.ownerBootstrap.tokenHash)
 *  2. Pre-provisioned owner email allowlist (license.ownerBootstrap.emails)
 *  3. Explicit OwnerMigration interactive create (manager + no profile yet)
 *
 * Rejected: first Google account to connect becomes Owner.
 */
(function (global) {
  'use strict';

  const BOOTSTRAP_STATE_KEY = '__tdw_owner_bootstrap_v2__';

  function loadState() {
    const raw = global.DB?.get?.(BOOTSTRAP_STATE_KEY, null);
    if (!raw || typeof raw !== 'object') {
      return { tokenConsumedAt: null, claimedBy: null, method: null };
    }
    return {
      tokenConsumedAt: raw.tokenConsumedAt || null,
      claimedBy: raw.claimedBy || null,
      method: raw.method || null
    };
  }

  function saveState(next) {
    const state = { ...loadState(), ...(next || {}) };
    global.DB?.set?.(BOOTSTRAP_STATE_KEY, state);
    return state;
  }

  function getBootstrapConfig(doc) {
    doc = doc || global.LicenseCloud?.loadLocal?.() || {};
    const cfg = doc.ownerBootstrap && typeof doc.ownerBootstrap === 'object'
      ? doc.ownerBootstrap
      : {};
    const emails = Array.isArray(cfg.emails)
      ? cfg.emails.map((e) => String(e || '').trim().toLowerCase()).filter(Boolean)
      : [];
    return {
      tokenHash: cfg.tokenHash ? String(cfg.tokenHash) : '',
      emails,
      consumed: !!cfg.consumed,
      consumedAt: cfg.consumedAt || null,
      method: cfg.method || null
    };
  }

  async function hashToken(token) {
    const raw = String(token || '').trim();
    if (!raw) return '';
    const CL = global.CommercialLicense;
    if (CL?.crypto?.hmacSha256Hex) {
      return CL.crypto.hmacSha256Hex(raw);
    }
    // Fallback: Web Crypto SHA-256 hex when CommercialLicense crypto unavailable.
    if (global.crypto?.subtle) {
      const buf = await global.crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    return '';
  }

  /** Explicitly false — Google identity alone never proves Owner. */
  function googleLoginImpliesOwner() {
    return false;
  }

  function isProductionBootstrapLocked() {
    // When an Owner Profile already exists, no further bootstrap claims.
    if (global.OwnerProfile?.hasProfile?.()) return true;
    const cfg = getBootstrapConfig();
    if (cfg.consumed) return true;
    const st = loadState();
    return !!(st.tokenConsumedAt || st.claimedBy);
  }

  function matchPreProvisionedEmail(email) {
    const needle = String(email || '').trim().toLowerCase();
    if (!needle) return { ok: false, error: 'email_required' };
    if (isProductionBootstrapLocked()) return { ok: false, error: 'bootstrap_already_consumed' };
    const cfg = getBootstrapConfig();
    if (!cfg.emails.length) return { ok: false, error: 'no_preprovisioned_emails' };
    if (!cfg.emails.includes(needle)) return { ok: false, error: 'email_not_allowlisted' };
    return { ok: true, email: needle };
  }

  async function verifySetupToken(token) {
    if (isProductionBootstrapLocked()) return { ok: false, error: 'bootstrap_already_consumed' };
    const cfg = getBootstrapConfig();
    if (!cfg.tokenHash) return { ok: false, error: 'no_setup_token_configured' };
    const hash = await hashToken(token);
    if (!hash || hash !== cfg.tokenHash) return { ok: false, error: 'invalid_setup_token' };
    return { ok: true };
  }

  async function markBootstrapConsumed(doc, method, claimedBy) {
    doc = doc || global.LicenseCloud?.loadLocal?.();
    if (!doc) return { ok: false, error: 'no_license' };
    const now = new Date().toISOString();
    doc.ownerBootstrap = {
      ...(doc.ownerBootstrap && typeof doc.ownerBootstrap === 'object' ? doc.ownerBootstrap : {}),
      consumed: true,
      consumedAt: now,
      method: method || 'unknown',
      claimedBy: claimedBy || null
    };
    doc.licenseVersion = (Number(doc.licenseVersion) || 0) + 1;
    if (global.OwnerHub?.saveLicenseDoc) {
      doc = await global.OwnerHub.saveLicenseDoc(doc);
    } else {
      global.LicenseCloud?.saveLocal?.(doc);
    }
    saveState({ tokenConsumedAt: now, claimedBy: claimedBy || null, method: method || 'unknown' });
    return { ok: true, doc };
  }

  /**
   * Redeem a one-time setup token and create Owner profile + role.
   * Does NOT use Google login as proof.
   */
  async function redeemSetupToken(token, profileInput) {
    const gate = await verifySetupToken(token);
    if (!gate.ok) return gate;
    if (global.OwnerProfile?.hasProfile?.()) return { ok: false, error: 'owner_already_exists' };

    const username = String(profileInput?.username || '').trim();
    const password = String(profileInput?.password || '').trim();
    const recoveryCode = String(profileInput?.recoveryCode || '').trim();
    if (!username || !password || !recoveryCode) {
      return { ok: false, error: 'profile_fields_required' };
    }

    const created = await global.OwnerProfile?.createProfile?.({ username, password, recoveryCode });
    if (!created?.ok) return created || { ok: false, error: 'create_failed' };

    global.OwnerMigration?.promoteUserToOwnerRole?.(username);
    await markBootstrapConsumed(null, 'setup_token', username);
    try { global.OwnerSetupState?.clearRequired?.(); } catch { /* empty */ }

    global.AuditLogger?.log?.({
      action: 'OWNER_BOOTSTRAP_TOKEN_REDEEMED',
      entity: 'owner_profile',
      entityId: username,
      summary: 'Owner created via one-time organization setup token'
    });
    return { ok: true, method: 'setup_token', profile: created.profile };
  }

  /**
   * Claim Owner via pre-provisioned email (must match allowlist on license).
   * Google email is an input identity string — not authorization by itself.
   */
  async function claimViaPreProvisionedEmail(email, profileInput) {
    const match = matchPreProvisionedEmail(email);
    if (!match.ok) return match;
    if (global.OwnerProfile?.hasProfile?.()) return { ok: false, error: 'owner_already_exists' };

    // Still require RolePolicy bootstrap gate (manager/dev) OR explicit allowlist redeem session.
    const user = global.currentUser;
    const allow =
      global.RolePolicy?.canBootstrapOwner?.(user) ||
      global.RolePolicy?.isDev?.(user) ||
      !user; // pre-login claim with allowlisted email + profile fields
    if (!allow && user && !global.RolePolicy?.canBootstrapOwner?.(user)) {
      return { ok: false, error: 'bootstrap_not_permitted' };
    }

    const username = String(profileInput?.username || email.split('@')[0] || '').trim();
    const password = String(profileInput?.password || '').trim();
    const recoveryCode = String(profileInput?.recoveryCode || '').trim();
    if (!username || !password || !recoveryCode) {
      return { ok: false, error: 'profile_fields_required' };
    }

    const created = await global.OwnerProfile?.createProfile?.({ username, password, recoveryCode });
    if (!created?.ok) return created || { ok: false, error: 'create_failed' };

    global.OwnerMigration?.promoteUserToOwnerRole?.(username);
    await markBootstrapConsumed(null, 'preprovisioned_email', email);
    try { global.OwnerSetupState?.clearRequired?.(); } catch { /* empty */ }

    global.AuditLogger?.log?.({
      action: 'OWNER_BOOTSTRAP_EMAIL_CLAIMED',
      entity: 'owner_profile',
      entityId: username,
      summary: `Owner created via pre-provisioned email ${email}`
    });
    return { ok: true, method: 'preprovisioned_email', profile: created.profile };
  }

  function describeAvailableMethods(doc) {
    const cfg = getBootstrapConfig(doc);
    const locked = isProductionBootstrapLocked();
    return {
      locked,
      googleLoginImpliesOwner: false,
      setupTokenConfigured: !!cfg.tokenHash && !cfg.consumed,
      preProvisionedEmails: cfg.emails.length,
      interactiveMigration: !locked && !!global.RolePolicy?.canBootstrapOwner?.(global.currentUser)
    };
  }

  global.OwnerBootstrap = {
    BOOTSTRAP_STATE_KEY,
    loadState,
    getBootstrapConfig,
    googleLoginImpliesOwner,
    isProductionBootstrapLocked,
    matchPreProvisionedEmail,
    verifySetupToken,
    redeemSetupToken,
    claimViaPreProvisionedEmail,
    markBootstrapConsumed,
    describeAvailableMethods,
    hashToken
  };
})(typeof window !== 'undefined' ? window : globalThis);
