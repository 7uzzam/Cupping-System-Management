#!/usr/bin/env node
'use strict';

/**
 * Windows electron-builder wrapper for Hybrid RC.
 * Declared package.json intent: signAndEditExecutable=true (rcedit embeds Program-Icon.ico).
 * On non-Windows hosts, rcedit/Wine often fails — disable rcedit unless HYBRID_FORCE_RCEDIT=1.
 * Authenticode signing still requires a certificate (K-32); rcedit ≠ code signing.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const extra = process.argv.slice(2);
const args = ['electron-builder', '--win', '--x64', ...extra];

const embedIcon =
  process.env.HYBRID_FORCE_RCEDIT === '1' ||
  (process.platform === 'win32' && process.env.HYBRID_DISABLE_RCEDIT !== '1');

if (!embedIcon) {
  args.push('--config.win.signAndEditExecutable=false');
  console.log('[hybrid-build] non-Windows (or HYBRID_DISABLE_RCEDIT): signAndEditExecutable=false for this run');
} else {
  console.log('[hybrid-build] Windows icon embed: signAndEditExecutable=true (rcedit; not Authenticode)');
}

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  args,
  { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' }
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}
process.exit(result.status == null ? 1 : result.status);
