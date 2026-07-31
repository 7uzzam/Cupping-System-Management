/**
 * Owner Management — thin facade over existing user / OwnerProfile / BranchScope APIs.
 * V2-5.8 live validation: Method 2 recovery + multi-Owner (single role: owner).
 * Does NOT introduce a new repository, auth engine, or permission engine.
 */
(function (global) {
  'use strict';

  const OWNER_ROLE = 'owner';

  function getUsers() {
    if (Array.isArray(global.users)) return global.users;
    return global.DB?.get?.('users', []) || [];
  }

  function persistUsers(list) {
    global.users = list;
    global.DB?.set?.('users', list);
    return list;
  }

  function isOwnerRole(user) {
    if (!user) return false;
    const role = String(user.role || '').toLowerCase();
    return role === OWNER_ROLE || role === 'hq_admin';
  }

  function listOwners(users) {
    users = users || getUsers();
    return users.filter((u) => u && isOwnerRole(u) && !u.isDev);
  }

  function listActiveOwners(users) {
    return listOwners(users).filter((u) => u.active !== false);
  }

  function countActiveOwners(users) {
    return listActiveOwners(users).length;
  }

  function organizationHasOwner(users) {
    if (global.RolePolicy?.hasOrganizationOwnerAccount) {
      return !!global.RolePolicy.hasOrganizationOwnerAccount(users || getUsers());
    }
    return countActiveOwners(users) > 0 || !!global.OwnerProfile?.hasProfile?.();
  }

  function isDeveloperMode(user) {
    user = user || global.currentUser;
    if (global.RolePolicy?.isDev?.(user)) return true;
    try {
      if (typeof document !== 'undefined' && document.body?.classList?.contains('dev-mode')) return true;
    } catch { /* empty */ }
    return !!(user && user.isDev);
  }

  /** Section visible when org has no Owner OR Developer Mode is on. */
  function shouldShowOwnerManagementSection(user) {
    if (!organizationHasOwner()) return true;
    return isDeveloperMode(user);
  }

  function bindOwnerToCurrentContext(user) {
    if (!user || typeof user !== 'object') return user;
    const lic = global.LicenseCloud?.loadLocal?.() || {};
    const centerId = global.CenterId?.getStoredCenterId?.()
      || global.Organization?.getId?.()
      || lic.centerId
      || '';
    const orgId = global.Organization?.getId?.() || centerId || '';
    if (centerId && !user.centerId) user.centerId = centerId;
    if (orgId && !user.orgId) user.orgId = orgId;
    if (lic.licenseId && !user.licenseId) user.licenseId = lic.licenseId;
    if (lic.productKey && !user.licenseKeyHint) {
      user.licenseKeyHint = String(lic.productKey).slice(0, 8);
    }
    user.role = OWNER_ROLE;
    if (global.BranchScope?.applyDefaultScopeToUser) {
      global.BranchScope.applyDefaultScopeToUser(user);
    } else {
      user.branchScope = user.branchScope || ['*'];
      user.canSwitchBranch = user.canSwitchBranch != null ? !!user.canSwitchBranch : true;
    }
    return user;
  }

  function canRemoveOwnerUser(userId, users) {
    users = users || getUsers();
    const target = users.find((u) => u && String(u.id) === String(userId));
    if (!target) return { ok: false, error: 'not_found' };
    if (!isOwnerRole(target)) return { ok: true };
    if (String(target.id) === '1') {
      return { ok: false, error: 'primary_protected', message: 'لا يمكن حذف الحساب الرئيسي' };
    }
    const active = listActiveOwners(users);
    const isActive = target.active !== false;
    if (isActive && active.length <= 1) {
      return {
        ok: false,
        error: 'last_active_owner',
        message: 'لا يمكن حذف آخر مالك فعّال في المؤسسة'
      };
    }
    return { ok: true };
  }

  function canDisableOwnerUser(userId, users) {
    users = users || getUsers();
    const target = users.find((u) => u && String(u.id) === String(userId));
    if (!target) return { ok: false, error: 'not_found' };
    if (!isOwnerRole(target)) return { ok: true };
    if (String(target.id) === '1') {
      return { ok: false, error: 'primary_protected', message: 'لا يمكن تعطيل الحساب الرئيسي' };
    }
    if (target.active === false) return { ok: true };
    const active = listActiveOwners(users);
    if (active.length <= 1) {
      return {
        ok: false,
        error: 'last_active_owner',
        message: 'لا يمكن تعطيل آخر مالك فعّال في المؤسسة'
      };
    }
    return { ok: true };
  }

  function canDemoteOwnerUser(userId, nextRole, users) {
    users = users || getUsers();
    const target = users.find((u) => u && String(u.id) === String(userId));
    if (!target) return { ok: false, error: 'not_found' };
    if (!isOwnerRole(target)) return { ok: true };
    const next = String(nextRole || '').toLowerCase();
    if (next === OWNER_ROLE || next === 'hq_admin') return { ok: true };
    return canDisableOwnerUser(userId, users);
  }

  /**
   * First Owner: uses OwnerCreateForm / OwnerProfile.
   * Additional Owners: same user store + role=owner + BranchScope (no second OwnerProfile).
   */
  async function createOwnerAccount(input) {
    input = input || {};
    const needsBootstrap = !global.OwnerProfile?.hasProfile?.() || countActiveOwners() === 0;

    if (needsBootstrap && !global.OwnerProfile?.hasProfile?.() && global.OwnerCreateForm?.createOwnerFromForm) {
      // Prefer form when DOM ids are present; otherwise programmatic bootstrap below.
      if (typeof document !== 'undefined' && document.getElementById((input.idPrefix || 'ocf') + '-username')) {
        const formRes = await global.OwnerCreateForm.createOwnerFromForm(input.idPrefix || 'ocf');
        if (formRes?.ok) {
          const users = getUsers();
          const u = users.find((x) => x && String(x.username || '').toLowerCase() === String(formRes.username || '').toLowerCase());
          if (u) {
            bindOwnerToCurrentContext(u);
            persistUsers(users);
          }
        }
        return formRes;
      }
    }

    const fullName = String(input.fullName || '').trim();
    const username = String(input.username || '').trim();
    const email = String(input.email || '').trim();
    const password = String(input.password || '');
    const passwordConfirm = String(input.passwordConfirm != null ? input.passwordConfirm : password);
    const recoveryCode = String(input.recoveryCode || input.recovery || '').trim();
    const minLen = global.OwnerCreateForm?.MIN_PASSWORD_LENGTH || 8;

    if (!fullName) return { ok: false, error: 'name_required' };
    if (!username) return { ok: false, error: 'username_required' };
    if (!password) return { ok: false, error: 'password_required' };
    if (password.length < minLen) return { ok: false, error: 'password_too_short', min: minLen };
    if (password !== passwordConfirm) return { ok: false, error: 'password_mismatch' };

    const users = getUsers().slice();
    const dup = users.find((u) => u && String(u.username || '').toLowerCase() === username.toLowerCase());
    if (dup && !isOwnerRole(dup)) {
      return { ok: false, error: 'username_taken' };
    }

    // Bootstrap OwnerProfile once when missing.
    if (!global.OwnerProfile?.hasProfile?.()) {
      if (!recoveryCode) return { ok: false, error: 'recovery_required' };
      const profileRes = await global.OwnerProfile.createProfile({
        username,
        password,
        recoveryCode,
        email,
        fullName
      });
      if (!profileRes?.ok) return profileRes;
    }

    let hash = password;
    if (typeof global.hashPW === 'function') {
      hash = await global.hashPW(password, username);
    }

    let ownerUser = dup;
    if (!ownerUser) {
      ownerUser = {
        id: 'owner-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
        fullName,
        username,
        password: hash,
        role: OWNER_ROLE,
        email,
        active: true,
        empNum: '',
        doctorId: ''
      };
      users.push(ownerUser);
    } else {
      ownerUser.fullName = fullName;
      ownerUser.email = email || ownerUser.email;
      ownerUser.password = hash;
      ownerUser.role = OWNER_ROLE;
      ownerUser.active = true;
    }
    bindOwnerToCurrentContext(ownerUser);
    persistUsers(users);
    try { global.OwnerMigration?.promoteUserToOwnerRole?.(username); } catch { /* empty */ }
    try { global.OwnerSetupState?.clearRequired?.(); } catch { /* empty */ }

    return { ok: true, username, userId: ownerUser.id, email };
  }

  async function updateOwner(userId, patch) {
    patch = patch || {};
    const users = getUsers().slice();
    const idx = users.findIndex((u) => u && String(u.id) === String(userId));
    if (idx < 0) return { ok: false, error: 'not_found' };
    const user = users[idx];
    if (!isOwnerRole(user)) return { ok: false, error: 'not_owner' };

    if (patch.fullName != null) user.fullName = String(patch.fullName).trim();
    if (patch.email != null) user.email = String(patch.email).trim();
    if (patch.username != null) {
      const next = String(patch.username).trim();
      const clash = users.find((u) => u && u.id !== user.id && String(u.username || '').toLowerCase() === next.toLowerCase());
      if (clash) return { ok: false, error: 'username_taken' };
      user.username = next;
    }
    bindOwnerToCurrentContext(user);
    persistUsers(users);
    return { ok: true, user };
  }

  async function resetOwnerPassword(userId, newPassword, confirmPassword) {
    const minLen = global.OwnerCreateForm?.MIN_PASSWORD_LENGTH || 8;
    const pw = String(newPassword || '');
    const conf = String(confirmPassword != null ? confirmPassword : pw);
    if (!pw) return { ok: false, error: 'password_required' };
    if (pw.length < minLen) return { ok: false, error: 'password_too_short', min: minLen };
    if (pw !== conf) return { ok: false, error: 'password_mismatch' };

    const users = getUsers().slice();
    const idx = users.findIndex((u) => u && String(u.id) === String(userId));
    if (idx < 0) return { ok: false, error: 'not_found' };
    const user = users[idx];
    if (!isOwnerRole(user)) return { ok: false, error: 'not_owner' };

    let hash = pw;
    if (typeof global.hashPW === 'function') {
      hash = await global.hashPW(pw, user.username);
    }
    user.password = hash;
    persistUsers(users);

    const profile = global.OwnerProfile?.loadProfile?.();
    if (profile && String(profile.username || '').toLowerCase() === String(user.username || '').toLowerCase()) {
      try {
        await global.OwnerProfile.rotatePassword(pw, { invalidateSessions: true });
      } catch { /* empty */ }
    }
    return { ok: true };
  }

  function setOwnerActive(userId, active) {
    const users = getUsers().slice();
    const idx = users.findIndex((u) => u && String(u.id) === String(userId));
    if (idx < 0) return { ok: false, error: 'not_found' };
    const user = users[idx];
    if (!isOwnerRole(user)) return { ok: false, error: 'not_owner' };

    if (!active) {
      const gate = canDisableOwnerUser(userId, users);
      if (!gate.ok) return gate;
    }
    user.active = !!active;
    persistUsers(users);
    return { ok: true, user };
  }

  function deleteOwner(userId) {
    const users = getUsers().slice();
    const gate = canRemoveOwnerUser(userId, users);
    if (!gate.ok) return gate;
    const removed = users.find((u) => u && String(u.id) === String(userId));
    if (!removed) return { ok: false, error: 'not_found' };
    if (!isOwnerRole(removed)) return { ok: false, error: 'not_owner' };
    const next = users.filter((u) => String(u.id) !== String(userId));
    persistUsers(next);
    return { ok: true, removed };
  }

  const api = {
    OWNER_ROLE,
    listOwners,
    listActiveOwners,
    countActiveOwners,
    organizationHasOwner,
    isDeveloperMode,
    shouldShowOwnerManagementSection,
    bindOwnerToCurrentContext,
    canRemoveOwnerUser,
    canDisableOwnerUser,
    canDemoteOwnerUser,
    createOwnerAccount,
    updateOwner,
    resetOwnerPassword,
    setOwnerActive,
    deleteOwner,
    isOwnerRole
  };

  global.OwnerManagement = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
