#!/usr/bin/env node
'use strict';

/**
 * V2-5.10 Stage-1 checklist (code honesty + Backup V1 hide).
 * Does NOT flip Requirements PASS. Does NOT claim release ready.
 * Full Windows A–E still owned by verify:v2-5-9-release-gate.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const errors = [];
const fail = (m) => errors.push(m);

const docs = [
  '00-PROGRAM.md',
  'STAGE-1-RELEASE-SAFETY.md',
  'CURRENT-STATUS.md',
];
for (const name of docs) {
  const p = path.join(root, 'docs/integration-v2-5-10', name);
  if (!fs.existsSync(p)) fail('missing ' + name);
}

const status = fs.readFileSync(path.join(root, 'docs/integration-v2-5-10/CURRENT-STATUS.md'), 'utf8');
if (!/Ready for production[\s\S]{0,40}\*\*NO\*\*/i.test(status)) fail('CURRENT-STATUS must say Ready for production NO');
if (!/Stage 2 Architecture allowed\?[\s\S]{0,40}\*\*NO\*\*/i.test(status)) fail('Stage 2 must remain NO until gates pass');
if (/Overall\s*[≥>=]\s*90/.test(status)) fail('must not claim Overall ≥ 90 without evidence');

const program = fs.readFileSync(path.join(root, 'docs/integration-v2-5-10/00-PROGRAM.md'), 'utf8');
if (!/BLOCKED/.test(program)) fail('program must mark later stages BLOCKED');
if (!/\b58\b/.test(program) || !/\b35\b/.test(program)) fail('program must retain inherited baseline scores');

const unit = spawnSync(process.execPath, [path.join(root, 'tests/baseline/test-v2-5-10-stage1-backup-v1.js')], {
  encoding: 'utf8',
  cwd: root,
});
if (unit.status !== 0) {
  fail('stage1 backup-v1 unit failed:\n' + ((unit.stdout || '') + (unit.stderr || '')).trim());
}

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!/BACKUP_V1_CUSTOMER_UI_DISABLED\s*=\s*true/.test(index)) fail('Backup V1 disable flag missing');
if (!/runCloudV2SyncNow/.test(index)) fail('Cloud V2 sync entry missing');

if (errors.length) {
  console.error('FAIL verify:v2-5-10-stage1\n- ' + errors.join('\n- '));
  process.exit(1);
}

console.log('PASS verify:v2-5-10-stage1 (Backup V1 UI disabled + honesty markers)');
console.log('NOTE: Windows Requirements / Scenario A–E still UNVERIFIED — run verify:v2-5-9-release-gate for full release gate.');
process.exit(0);
