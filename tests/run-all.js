#!/usr/bin/env node
'use strict';

/**
 * Unified test runner for Phase 1+.
 * Runs baseline suites first, then existing verify:* critical scripts.
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const results = [];

function runNode(relPath, label) {
  const abs = path.join(root, relPath);
  if (!fs.existsSync(abs)) {
    results.push({ label, ok: false, detail: 'missing file ' + relPath });
    return;
  }
  const r = spawnSync(process.execPath, [abs], {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
  });
  const ok = r.status === 0;
  results.push({
    label,
    ok,
    detail: ok
      ? (r.stdout || '').trim().split('\n').slice(-2).join(' | ')
      : ((r.stderr || r.stdout || '') + '').trim().split('\n').slice(-6).join('\n'),
  });
}

console.log('══ Tadawi Phase-1 Test Runner ══\n');

const baseline = [
  ['tests/baseline/test-entities-finance.js', 'baseline:entities+finance'],
  ['tests/baseline/test-tax-golden.js', 'baseline:tax'],
  ['tests/baseline/test-backup-crypto.js', 'baseline:backup-crypto'],
  ['tests/baseline/test-license-read.js', 'baseline:license-read'],
  ['tests/baseline/test-electron-security-snapshot.js', 'baseline:electron-security'],
  ['tests/baseline/test-phase2-electron-security.js', 'phase2:electron-security'],
  ['tests/baseline/test-phase3-licensing-v6.js', 'phase3:licensing-v6'],
  ['tests/baseline/test-phase4-sqlite.js', 'phase4:sqlite'],
  ['tests/baseline/test-phase6-permissions.js', 'phase6:permissions'],
  ['tests/baseline/test-phase7-backup.js', 'phase7:backup'],
  ['tests/baseline/test-phase8-dev-panel.js', 'phase8:dev-panel'],
  ['tests/baseline/test-phase9-branding-consistency.js', 'phase9:branding-consistency'],
  ['tests/baseline/test-phase10-wizard-tour.js', 'phase10:wizard-tour'],
  ['tests/baseline/test-phase11-booking-statuses.js', 'phase11:booking-statuses'],
  ['tests/baseline/test-phase12-build.js', 'phase12:build'],
  ['tests/baseline/test-phase13-electron-readiness.js', 'phase13:electron-readiness'],
  ['tests/baseline/test-phase14-final-gate.js', 'phase14:final-gate'],
  ['tests/baseline/test-phase15-rc-gate.js', 'phase15:rc-gate'],
  ['tests/baseline/test-phase16-code-freeze-gate.js', 'phase16:code-freeze-gate'],
];

const existing = [
  ['scripts/verify-attendance-policy.js', 'verify:attendance'],
  ['scripts/verify-ledger-monthly.js', 'verify:ledger'],
  ['scripts/verify-tax-invoice.js', 'verify:tax-invoice'],
  ['scripts/verify-backup-sync.js', 'verify:backup-sync'],
  ['scripts/verify-client-import.js', 'verify:client-import'],
];

for (const [file, label] of baseline) runNode(file, label);
for (const [file, label] of existing) runNode(file, label);

// License suite is ESM
{
  const abs = path.join(root, 'scripts', 'commercial-licensing-test.mjs');
  const r = spawnSync(process.execPath, [abs], { cwd: root, encoding: 'utf8', env: process.env });
  results.push({
    label: 'license:test',
    ok: r.status === 0,
    detail: r.status === 0
      ? (r.stdout || '').trim().split('\n').slice(-2).join(' | ')
      : ((r.stderr || r.stdout || '') + '').trim().split('\n').slice(-8).join('\n'),
  });
}

let failed = 0;
for (const row of results) {
  const mark = row.ok ? 'PASS' : 'FAIL';
  if (!row.ok) failed += 1;
  console.log(`${mark}  ${row.label}`);
  if (!row.ok && row.detail) console.log(row.detail.split('\n').map((l) => '      ' + l).join('\n'));
}

console.log(`\nSummary: ${results.length - failed}/${results.length} passed`);
if (failed) {
  process.exit(1);
}
console.log('All tests passed.');
