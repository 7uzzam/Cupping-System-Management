#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..', '..');
const errors = [];
function check(ok, msg) {
  if (!ok) errors.push(msg);
}

const roleSrc = fs.readFileSync(path.join(root, 'cloud', 'role-policy.js'), 'utf8');
const omSrc = fs.readFileSync(path.join(root, 'cloud', 'owner-management.js'), 'utf8');
const setupSrc = fs.readFileSync(path.join(root, 'cloud', 'owner-setup-state.js'), 'utf8');
const bootSrc = fs.readFileSync(path.join(root, 'cloud', 'boot-flow-ui.js'), 'utf8');
const formSrc = fs.readFileSync(path.join(root, 'cloud', 'owner-create-form.js'), 'utf8');
const panelSrc = fs.readFileSync(path.join(root, 'license', 'ui', 'developer-panel.js'), 'utf8');
const hubSrc = fs.readFileSync(path.join(root, 'cloud', 'owner-hub.js'), 'utf8');
const indexSrc = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const smokePath = path.join(root, 'docs', 'integration-v2-5-8', 'LIVE-PRODUCTION-SMOKE.md');

check(fs.existsSync(smokePath), 'LIVE-PRODUCTION-SMOKE.md must exist');
const smoke = fs.readFileSync(smokePath, 'utf8');
check(/Method 2 — Auto Owner Bootstrap/i.test(smoke), 'smoke Method 2 auto bootstrap');
check(/Emergency Recovery/i.test(smoke), 'smoke Method 3 emergency');
check(/Owner Hub/i.test(smoke), 'smoke Owner Hub day-to-day');
check(/Ready for main:\s*NO/i.test(smoke), 'smoke must keep Ready for main: NO');
check(!/\|\s*A04\s*\|[^|]*\|\s*PASS\s*\|/i.test(smoke), 'A04 Google Login must not be pre-marked PASS');

check(/owner-management\.js/.test(indexSrc), 'index.html must load owner-management.js');
check(/ensureOwnerBootstrapWizard/.test(bootSrc), 'BootFlow self-healing ensureOwnerBootstrapWizard');
check(/openAtStep/.test(bootSrc), 'BootFlow openAtStep');
check(/OwnerManagement\.createOwner|createOwner\(/.test(bootSrc), 'BootFlow uses createOwner path');
check(/Owner Emergency Recovery/.test(panelSrc), 'devtools is emergency recovery');
check(/Repair Owner Membership/.test(panelSrc), 'emergency repair membership');
check(/ensureOwnerBootstrapWizard/.test(panelSrc), 'emergency opens bootstrap wizard');
check(!/إنشاء مالك إضافي/.test(panelSrc) || /Owner Hub/.test(panelSrc), 'devtools not primary multi-owner UX');
check(/createAdditionalOwnerInteractive/.test(hubSrc), 'Owner Hub create additional owner');
check(/oh-owner-accounts/.test(hubSrc), 'Owner Hub accounts panel');
check(/openOwnerBootstrapWizard/.test(hubSrc), 'Owner Hub opens bootstrap wizard');
check(/ensureMissingOwner/.test(setupSrc), 'OwnerSetupState.ensureMissingOwner');
check(/createOwner:/.test(omSrc) || /async function createOwner/.test(omSrc), 'OwnerManagement.createOwner');
check(/needsOwnerBootstrap/.test(omSrc), 'needsOwnerBootstrap detector');
check(/repairOwnerMembership/.test(omSrc), 'repair helpers');
check(/last_active_owner/.test(omSrc), 'last active owner guard');
check(/bindOwnerToCurrentContext|applyDefaultScopeToUser/.test(formSrc), 'OwnerCreateForm binds scope');
check(/OwnerManagement\.canRemoveOwnerUser|canRemoveOwnerUser/.test(indexSrc), 'deleteUser last-owner guard');
check(/ensureOwnerBootstrapWizard/.test(indexSrc), 'startup/login self-heal wired');

const sandbox = {
  console,
  currentUser: null,
  users: [],
  localStorage: { _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = String(v); }, removeItem(k) { delete this._m[k]; } },
  sessionStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  document: {
    getElementById() { return null; },
    body: { classList: { contains() { return false; }, toggle() {} } },
    querySelector() { return null; }
  },
  DB: {
    _d: {},
    get(k, d) { return this._d[k] !== undefined ? this._d[k] : d; },
    set(k, v) { this._d[k] = v; }
  },
  BranchScope: {
    applyDefaultScopeToUser(u) {
      if (!u) return u;
      if (!Array.isArray(u.branchScope) || !u.branchScope.length) {
        u.branchScope = ['*'];
        u.canSwitchBranch = true;
      }
      return u;
    }
  },
  CenterId: { getStoredCenterId: () => 'CTR-TEST' },
  Organization: { getId: () => 'CTR-TEST' },
  LicenseCloud: { loadLocal: () => ({ centerId: 'CTR-TEST', licenseId: 'LIC-1', productKey: 'ABCD-EFGH-IJKL' }) },
  OwnerProfile: {
    _p: null,
    hasProfile() { return !!this._p; },
    async createProfile(input) {
      if (this._p) return { ok: false, error: 'profile_exists' };
      this._p = { username: input.username, role: 'owner' };
      return { ok: true, profile: this._p };
    },
    loadProfile() { return this._p; },
    async rotatePassword() { return { ok: true }; }
  },
  OwnerMigration: { promoteUserToOwnerRole() {} },
  hashPW: async (pw) => 'hash:' + pw
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

vm.runInNewContext(roleSrc, sandbox, { timeout: 2000 });
vm.runInNewContext(setupSrc, sandbox, { timeout: 2000 });
vm.runInNewContext(omSrc, sandbox, { timeout: 2000 });

const OM = sandbox.OwnerManagement;
const OSS = sandbox.OwnerSetupState;
check(!!OM && !!OSS, 'OwnerManagement + OwnerSetupState loaded');
check(typeof OM.createOwner === 'function', 'createOwner alias');
check(typeof OM.needsOwnerBootstrap === 'function', 'needsOwnerBootstrap');
check(OM.needsOwnerBootstrap() === true, 'needs bootstrap when empty');
check(OSS.needsSetup() === true, 'setup needed when empty');
const marked = OSS.ensureMissingOwner('restore');
check(marked.required === true && marked.reason === 'restore', 'ensureMissingOwner marks restore');

sandbox.users = [
  { id: 'o1', username: 'owner1', role: 'owner', active: true, fullName: 'Owner One', password: 'x' }
];
sandbox.OwnerProfile._p = { username: 'owner1' };
check(OM.needsOwnerBootstrap() === false, 'no bootstrap when owner present');
check(OM.shouldShowEmergencyOwnerTools({ role: 'admin' }) === false, 'hide emergency when owners exist and not dev');
check(OM.shouldShowEmergencyOwnerTools({ role: 'admin', isDev: true }) === true, 'show emergency in Developer Mode');

sandbox.users = [];
sandbox.OwnerProfile._p = null;

(async () => {
  const created = await OM.createOwner({
    fullName: 'First Owner',
    email: 'owner@example.com',
    username: 'firstowner',
    password: 'password1',
    passwordConfirm: 'password1',
    recoveryCode: 'recover-me'
  });
  check(created.ok === true, 'createOwner first ok: ' + (created.error || ''));
  check(sandbox.users[0]?.branchScope?.includes('*'), 'owner branch scope bound');
  check(sandbox.users[0]?.licenseId === 'LIC-1', 'owner licenseId bound');

  const second = await OM.createOwner({
    fullName: 'Second Owner',
    email: 'owner2@example.com',
    username: 'secondowner',
    password: 'password2',
    passwordConfirm: 'password2',
    recoveryCode: 'x'
  });
  check(second.ok === true, 'createOwner additional ok: ' + (second.error || ''));
  const secondUser = sandbox.users.find(u => u.username === 'secondowner');
  check(!!secondUser, 'second owner user exists');
  check(OM.deleteOwner(secondUser && secondUser.id).ok === true, 'can delete non-last owner');
  check(OM.deleteOwner(sandbox.users[0] && sandbox.users[0].id).ok === false, 'cannot delete last owner');

  const repair = OM.repairOwnerMembership();
  check(repair.ok === true, 'repair membership ok');
  const diag = OM.buildOwnerDiagnostics();
  check(diag && diag.organizationHasOwner === true, 'diagnostics shows owner');

  // Source contract: BootFlow exports self-heal (parse without full DOM)
  check(/ensureOwnerBootstrapWizard/.test(bootSrc) && /function ensureOwnerBootstrapWizard/.test(bootSrc), 'boot defines ensureOwnerBootstrapWizard');

  if (errors.length) {
    console.error('FAIL: v2-5.8 live owner validation');
    errors.forEach((e) => console.error(' -', e));
    process.exit(1);
  }
  console.log('PASS: v2-5.8 live owner validation (self-heal bootstrap, emergency tools, hub CRUD, createOwner)');
})().catch((e) => {
  console.error('FAIL: exception', e);
  process.exit(1);
});
