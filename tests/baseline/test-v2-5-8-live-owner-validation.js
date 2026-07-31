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
const formSrc = fs.readFileSync(path.join(root, 'cloud', 'owner-create-form.js'), 'utf8');
const panelSrc = fs.readFileSync(path.join(root, 'license', 'ui', 'developer-panel.js'), 'utf8');
const indexSrc = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const smokePath = path.join(root, 'docs', 'integration-v2-5-8', 'LIVE-PRODUCTION-SMOKE.md');

check(fs.existsSync(smokePath), 'LIVE-PRODUCTION-SMOKE.md must exist');
const smoke = fs.readFileSync(smokePath, 'utf8');
check(/Clean Install/i.test(smoke), 'smoke must include Clean Install');
check(/Google OAuth/i.test(smoke), 'smoke must include Google OAuth');
check(/Owner Management/i.test(smoke), 'smoke must include Owner Management');
check(/Device A/i.test(smoke) && /Device B/i.test(smoke), 'smoke must include Device A/B sync');
check(/1024×768|1024x768/i.test(smoke), 'smoke must include responsive resolutions');
check(/Root Cause/i.test(smoke) && /Fix Commit/i.test(smoke) && /Re-Test/i.test(smoke), 'smoke must have RCA columns');
check(/Ready for main:\s*NO/i.test(smoke), 'smoke must keep Ready for main: NO');
// Must not pre-declare live Google steps as PASS in the template tables
check(!/\|\s*A04\s*\|[^|]*\|\s*PASS\s*\|/i.test(smoke), 'A04 Google Login must not be pre-marked PASS');
check(!/\|\s*C01\s*\|[^|]*\|\s*PASS\s*\|/i.test(smoke), 'C01 OAuth must not be pre-marked PASS');

check(/owner-management\.js/.test(indexSrc), 'index.html must load owner-management.js');
check(/renderOwnerManagementSection/.test(panelSrc), 'developer-panel must render Owner Management');
check(/lic-owner-mgmt-section/.test(panelSrc), 'developer-panel must host Owner Management section');
check(/shouldShowOwnerManagementSection/.test(omSrc), 'OwnerManagement visibility gate');
check(/canRemoveOwnerUser/.test(omSrc) && /last_active_owner/.test(omSrc), 'last active owner delete guard');
check(/canDisableOwnerUser/.test(omSrc), 'disable last owner guard');
check(/bindOwnerToCurrentContext/.test(omSrc), 'license/org/branch bind helper');
check(/OWNER_ROLE/.test(omSrc) && !/Primary Owner|Super Owner|Master Owner/.test(omSrc), 'single Owner role only');
check(/bindOwnerToCurrentContext|applyDefaultScopeToUser/.test(formSrc), 'OwnerCreateForm binds branch scope');
check(/OwnerManagement\.canRemoveOwnerUser|canRemoveOwnerUser/.test(indexSrc), 'deleteUser uses last-owner guard');
check(/canDisableOwnerUser|canDemoteOwnerUser/.test(indexSrc), 'saveUserAsync guards disable/demote');

const sandbox = {
  console,
  currentUser: null,
  users: [],
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
  OwnerSetupState: { clearRequired() {} },
  OwnerMigration: { promoteUserToOwnerRole() {} },
  hashPW: async (pw) => 'hash:' + pw
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

vm.runInNewContext(roleSrc, sandbox, { timeout: 2000 });
vm.runInNewContext(omSrc, sandbox, { timeout: 2000 });

const OM = sandbox.OwnerManagement;
const RP = sandbox.RolePolicy;
check(!!OM && !!RP, 'OwnerManagement + RolePolicy loaded');
check(typeof RP.countActiveOwners === 'function', 'RolePolicy.countActiveOwners');
check(typeof RP.canRemoveOwnerUser === 'function', 'RolePolicy.canRemoveOwnerUser');

sandbox.users = [
  { id: 'o1', username: 'owner1', role: 'owner', active: true, fullName: 'Owner One' }
];
check(OM.countActiveOwners() === 1, 'countActiveOwners=1');
check(OM.canRemoveOwnerUser('o1').ok === false, 'cannot delete sole active owner');
check(OM.canDisableOwnerUser('o1').ok === false, 'cannot disable sole active owner');
check(OM.shouldShowOwnerManagementSection({ role: 'admin' }) === false, 'hide section when owners exist and not dev');
check(OM.shouldShowOwnerManagementSection({ role: 'admin', isDev: true }) === true, 'show section in Developer Mode');

sandbox.users = [];
sandbox.OwnerProfile._p = null;
check(OM.shouldShowOwnerManagementSection({ role: 'admin' }) === true, 'show section when org has no owner');

(async () => {
  const created = await OM.createOwnerAccount({
    fullName: 'First Owner',
    email: 'owner@example.com',
    username: 'firstowner',
    password: 'password1',
    passwordConfirm: 'password1',
    recoveryCode: 'recover-me'
  });
  check(created.ok === true, 'create first owner ok: ' + (created.error || ''));
  check(sandbox.users.length === 1 && sandbox.users[0].role === 'owner', 'owner user persisted');
  check(Array.isArray(sandbox.users[0].branchScope) && sandbox.users[0].branchScope.includes('*'), 'owner branch scope bound');
  check(sandbox.users[0].centerId === 'CTR-TEST', 'owner centerId bound');
  check(sandbox.users[0].licenseId === 'LIC-1', 'owner licenseId bound');

  const second = await OM.createOwnerAccount({
    fullName: 'Second Owner',
    email: 'owner2@example.com',
    username: 'secondowner',
    password: 'password2',
    passwordConfirm: 'password2',
    recoveryCode: 'x'
  });
  check(second.ok === true, 'create additional owner ok: ' + (second.error || ''));
  check(OM.countActiveOwners() === 2, 'two active owners');
  const secondUser = sandbox.users.find(u => u.username === 'secondowner');
  check(!!secondUser, 'second owner user exists');
  check(OM.deleteOwner(secondUser && secondUser.id).ok === true, 'can delete non-last owner');
  check(OM.countActiveOwners() === 1, 'one owner remains');
  const remaining = sandbox.users[0];
  check(!!remaining, 'remaining owner present');
  check(OM.deleteOwner(remaining && remaining.id).ok === false, 'still cannot delete last owner');

  if (errors.length) {
    console.error('FAIL: v2-5.8 live owner validation');
    errors.forEach((e) => console.error(' -', e));
    process.exit(1);
  }
  console.log('PASS: v2-5.8 live owner validation (' + [
    'smoke doc', 'devtools section', 'last-owner guards', 'multi-owner', 'license bind'
  ].join(', ') + ')');
})().catch((e) => {
  console.error('FAIL: exception', e);
  process.exit(1);
});
