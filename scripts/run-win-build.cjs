#!/usr/bin/env node
'use strict';

/**
 * Windows electron-builder wrapper for Hybrid RC.
 *
 * Icon embedding is handled by scripts/electron-builder-after-pack.cjs (resedit),
 * NOT by signAndEditExecutable/winCodeSign (avoids Windows symlink privilege errors).
 * Authenticode signing still requires a certificate (K-32).
 */
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const extra = process.argv.slice(2);
const args = ['electron-builder', '--win', '--x64', '--publish', 'never', ...extra];

console.log('[hybrid-build] using afterPack resedit icon embed; signAndEditExecutable stays false (no winCodeSign)');
console.log('[hybrid-build] publish=never (CI must not require GH_TOKEN for local/GHA artifacts)');

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  args,
  {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      // Prevent electron-builder from attempting GitHub Releases publish in CI
      CSC_IDENTITY_AUTO_DISCOVERY: process.env.CSC_IDENTITY_AUTO_DISCOVERY || 'false',
    },
  }
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}
process.exit(result.status == null ? 1 : result.status);
