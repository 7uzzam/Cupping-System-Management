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
  '00-INVENTORY.md'
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
if (!/lic-activation-grid|repeat\(3,\s*minmax\(0,\s*1fr\)\)/.test(css)) fail('activation responsive grid CSS missing');

const ops = fs.readFileSync(path.join(root, 'cloud', 'ops-ux-bridge.js'), 'utf8');
if (!/openRestoreWizard:\s*runRestoreWizardFlow/.test(ops)) fail('OpsUxBridge.openRestoreWizard alias missing');

const dc = fs.readFileSync(path.join(root, 'cloud', 'device-config.js'), 'utf8');
if (!/lockToBranch/.test(dc)) fail('DeviceConfig.lockToBranch alias missing');

const bs = fs.readFileSync(path.join(root, 'cloud', 'branch-scope.js'), 'utf8');
if (!/owner_mode_readonly/.test(bs)) fail('Owner Mode read-only guard missing');

const unit = path.join(root, 'tests', 'baseline', 'test-v2-5-9-final-activation.js');
if (!fs.existsSync(unit)) fail('missing test-v2-5-9-final-activation.js');
else {
  const r = run('tests/baseline/test-v2-5-9-final-activation.js');
  if (r.status !== 0) fail(`v2-5-9 unit exit ${r.status}: ${(r.stderr || r.stdout || '').slice(0, 400)}`);
}

// Scan UAT docs for unfinished markers
const badMarkers = /\b(UNVERIFIED|PENDING|PARTIAL|TODO|SKIPPED|EXPECTED PASS|NOT COMPLETED)\b/i;
const uatFiles = [
  'LIVE-WINDOWS-UAT.md',
  'ACTIVATION-FLOW-UAT.md',
  'OWNER-HUB-UAT.md',
  'SYNC-RESTORE-UAT.md',
  'RESPONSIVE-UAT.md',
  'REQUIREMENTS-TRACEABILITY.md'
];
let unverifiedCount = 0;
for (const name of uatFiles) {
  const text = fs.readFileSync(path.join(phaseDir, name), 'utf8');
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
