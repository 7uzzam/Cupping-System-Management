#!/usr/bin/env node
'use strict';

/**
 * V2-5.9 Release Gate — fails on FAIL / UNVERIFIED / PENDING / PARTIAL / TODO / SKIPPED.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const phaseDir = path.join(root, 'docs', 'integration-v2-5-9');
const errors = [];
const fail = (m) => errors.push(m);

function run(rel) {
  return spawnSync(process.execPath, [path.join(root, rel)], { encoding: 'utf8', cwd: root });
}

const requiredDocs = [
  'REQUIREMENTS-TRACEABILITY.md',
  'LIVE-WINDOWS-UAT.md',
  'ACTIVATION-FLOW-UAT.md',
  'OWNER-HUB-UAT.md',
  'SYNC-RESTORE-UAT.md',
  'RESPONSIVE-UAT.md',
  'PERFORMANCE-PROFILE.md',
  'FINAL-RELEASE-READINESS.md',
  '00-INVENTORY.md',
  'SYNC-ARCHITECTURE-FINAL.md',
  'SQLITE-SOT-CUTOVER.md',
  'BRANCH-ATOMICITY-UAT.md',
  'RBAC-AUTHORITATIVE-UAT.md',
  'RESTORE-RECONCILIATION-UAT.md',
  'BACKUP-SCOPE-MATRIX.md',
  'GOOGLE-SHEETS-UAT.md',
  'ATTACHMENTS-UAT.md',
  'CONFLICT-POLICY-MATRIX.md',
  'MULTI-DEVICE-WINDOWS-UAT.md',
  'PERFORMANCE-SYNC-PROFILE.md',
  'FINAL-SYNC-RELEASE-READINESS.md',
  'BRANCH-SYNC-OPS-GUIDE.md',
];

for (const name of requiredDocs) {
  const p = path.join(phaseDir, name);
  if (!fs.existsSync(p)) fail('missing doc ' + name);
}

const readiness = fs.readFileSync(path.join(phaseDir, 'FINAL-RELEASE-READINESS.md'), 'utf8');
if (/Ready for release[\s\S]{0,40}\bYES\b/i.test(readiness) && !/Ready for release[\s\S]{0,40}\*\*NO\*\*/i.test(readiness)) {
  fail('must not claim Ready for release: YES');
}
if (!/Ready for release[\s\S]{0,40}\*\*NO\*\*|Ready for release[\s\S]{0,40}\bNO\b/i.test(readiness)) {
  fail('must state Ready for release: NO');
}
if (/Ready for main[\s\S]{0,40}\bYES\b/i.test(readiness) && !/Ready for main[\s\S]{0,40}\*\*NO\*\*/i.test(readiness)) {
  fail('must not claim Ready for main: YES');
}
if (!/Ready for main[\s\S]{0,40}\*\*NO\*\*|Ready for main[\s\S]{0,40}\bNO\b/i.test(readiness)) {
  fail('must state Ready for main: NO');
}

const boot = fs.readFileSync(path.join(root, 'cloud', 'boot-flow-ui.js'), 'utf8');
if (!/version:\s*'v2-5\.9'/.test(boot)) fail('BootFlow version must be v2-5.9');
if (!/autoDiscoverActivationAfterGoogle/.test(boot)) fail('missing autoDiscoverActivationAfterGoogle');
if (!/NEW_STEPS\s*=\s*\[[^\]]*language[^\]]*google[^\]]*license[^\]]*organization[^\]]*branch[^\]]*restore[^\]]*sync[^\]]*ready/.test(boot.replace(/\s+/g, ' '))) {
  fail('NEW_STEPS must be language→google→license→organization→branch→restore→sync→ready (no owner)');
}
if (/shouldAutoOpenBoot[\s\S]{0,400}NO_OWNER/.test(boot)) {
  fail('shouldAutoOpenBoot must not open for NO_OWNER alone');
}

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!/role:'owner'|role:\s*'owner'/.test(index)) fail('defaultUsers must seed owner account');
if (!/mustChangePassword:\s*true/.test(index) || !/userMustChangePassword|openForcedPasswordChange/.test(index)) {
  fail('seeded Owner must force password change on first login');
}
if (/Owner@12345/.test(index)) fail('seed plaintext password must not appear in index.html');
if (/requestOwnerBootstrap\('startup'\)|requestOwnerBootstrap\("startup"\)/.test(index)) {
  fail('startup must not auto requestOwnerBootstrap');
}
if (/requestOwnerBootstrap\('login'\)|requestOwnerBootstrap\("login"\)/.test(index)) {
  fail('login must not auto requestOwnerBootstrap');
}
if (!/activation-sync-defaults\.js/.test(index)) fail('activation-sync-defaults.js not wired');

const defaults = fs.readFileSync(path.join(root, 'cloud', 'activation-sync-defaults.js'), 'utf8');
if (!/applyDefaults|isActivationBound/.test(defaults)) fail('ActivationSyncDefaults incomplete');

const panel = fs.readFileSync(path.join(root, 'license', 'ui', 'developer-panel.js'), 'utf8');
if (!/Reset Owner Password/.test(panel)) fail('Developer panel missing Reset Owner Password');

const css = fs.readFileSync(path.join(root, 'renderer', 'styles', 'design-system.css'), 'utf8');
if (!/lic-activation-grid|activation-grid/.test(css) || !/repeat\(3,\s*minmax\(/.test(css)) {
  fail('activation responsive grid CSS missing');
}
if (!/--tdw-safe-block:\s*clamp\(24px,\s*5vh,\s*48px\)/.test(css)) fail('safe-area clamp missing');
if (!/modal-shell/.test(css) || !/grid-template-rows:\s*auto minmax\(0,\s*1fr\) auto/.test(css)) {
  fail('modal-shell header/body/footer grid missing');
}
if (!/bf-card-footer[\s\S]{0,300}id="bf-step-actions"/.test(boot) && !/bf-card-footer[\s\S]{0,200}bf-step-actions/.test(boot)) {
  fail('BootFlow step actions must live in sticky footer, not scroll body');
}
if (!/licSetVisibleStep/.test(index) || !/lic-step-visible/.test(css)) {
  fail('license manage step must be gated behind developer login visibility helper');
}
if (/#lic-step-manage\s*\{[^}]*display:\s*grid\s*!important/.test(css)) {
  fail('must not force #lic-step-manage display:grid !important (shows before login)');
}
if (!/bf-restore-choices|bf-choice-actions/.test(boot)) {
  fail('restore data-source choices must render in scrollable body');
}

const ops = fs.readFileSync(path.join(root, 'cloud', 'ops-ux-bridge.js'), 'utf8');
if (!/openRestoreWizard:\s*runRestoreWizardFlow/.test(ops)) fail('OpsUxBridge.openRestoreWizard alias missing');

const dc = fs.readFileSync(path.join(root, 'cloud', 'device-config.js'), 'utf8');
if (!/lockToBranch/.test(dc)) fail('DeviceConfig.lockToBranch alias missing');

const bs = fs.readFileSync(path.join(root, 'cloud', 'branch-scope.js'), 'utf8');
if (!/owner_mode_readonly/.test(bs)) fail('Owner Mode read-only guard missing');
if (!/operational_write_branch_required|BranchContexts/.test(bs)) {
  fail('operational write branch context guard missing');
}

const rbac = fs.readFileSync(path.join(root, 'electron', 'rbac-session.js'), 'utf8');
if (/trusts renderer claim|trust claim when users KV empty/i.test(rbac)) {
  fail('RBAC must not trust renderer claim when users KV empty');
}
if (!/users_kv_empty/.test(rbac)) fail('RBAC must deny with users_kv_empty');

const restoreRec = fs.readFileSync(path.join(root, 'cloud', 'restore-reconciliation.js'), 'utf8');
if (!/assertPostRestorePushAllowed|reconcileAfterRestore/.test(restoreRec)) {
  fail('RestoreReconciliation module incomplete');
}
if (!/restore-reconciliation\.js/.test(index)) fail('restore-reconciliation.js not wired in index');
if (!/branch-contexts\.js/.test(index)) fail('branch-contexts.js not wired in index');

const bootUi = fs.readFileSync(path.join(root, 'cloud', 'boot-flow-ui.js'), 'utf8');
if (/runCloudDbBackupNow\('post-local-restore'\)|runCloudDbBackupNow\('post-file-restore'\)/.test(bootUi)) {
  fail('BootFlow must not immediate-push cloud backup after restore');
}
if (!/afterRestoreDataSourceSelected|afterRestore:\s*true/.test(bootUi)) {
  fail('BootFlow must reconcile/pull after restore data-source selection');
}

const enroll = fs.readFileSync(path.join(root, 'cloud', 'branch-enrollment.js'), 'utf8');
if (!/BRANCH_CREATION_PENDING/.test(enroll)) fail('atomic branch pending state missing');

const sqliteBridge = fs.readFileSync(path.join(root, 'cupping-sqlite-bridge.js'), 'utf8');
if (!/commitOperational|enqueueAtomicPersistTable/.test(sqliteBridge)) {
  fail('SqliteBridge SoT commit path missing');
}

const unit = path.join(root, 'tests', 'baseline', 'test-v2-5-9-final-activation.js');
if (!fs.existsSync(unit)) fail('missing test-v2-5-9-final-activation.js');
else {
  const r = run('tests/baseline/test-v2-5-9-final-activation.js');
  if (r.status !== 0) fail(`v2-5-9 unit exit ${r.status}: ${(r.stderr || r.stdout || '').slice(0, 400)}`);
}

// Scan UAT docs for unfinished markers — gate MUST fail until Windows proof.
const badMarkers = /\b(UNVERIFIED|PENDING|PARTIAL|TODO|SKIPPED|EXPECTED PASS|NOT COMPLETED)\b/i;
const uatFiles = [
  'LIVE-WINDOWS-UAT.md',
  'ACTIVATION-FLOW-UAT.md',
  'OWNER-HUB-UAT.md',
  'SYNC-RESTORE-UAT.md',
  'RESPONSIVE-UAT.md',
  'REQUIREMENTS-TRACEABILITY.md',
  'MULTI-DEVICE-WINDOWS-UAT.md',
  'RBAC-AUTHORITATIVE-UAT.md',
  'RESTORE-RECONCILIATION-UAT.md',
  'FINAL-SYNC-RELEASE-READINESS.md',
];
let unverifiedCount = 0;
for (const name of uatFiles) {
  const p = path.join(phaseDir, name);
  if (!fs.existsSync(p)) { fail('missing UAT scan file ' + name); continue; }
  const text = fs.readFileSync(p, 'utf8');
  const matches = text.match(new RegExp(badMarkers, 'gi')) || [];
  unverifiedCount += matches.length;
}
if (unverifiedCount > 0) {
  fail(`Windows/live evidence incomplete: found ${unverifiedCount} UNVERIFIED/PENDING/PARTIAL markers — Setup EXE proof required`);
}

console.log('V2-5.9 structural checks parsed');
if (errors.length) {
  console.error('V2-5.9 RELEASE GATE FAIL');
  errors.forEach((e) => console.error(' - ' + e));
  console.error('Ready for release: NO');
  console.error('Ready for main: NO');
  process.exit(1);
}
console.log('V2-5.9 RELEASE GATE PASS');
console.log('Ready for release: YES');
console.log('Ready for main: NO');
