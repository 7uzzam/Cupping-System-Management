#!/usr/bin/env node
'use strict';

/**
 * V2-2 — NSIS persistence policy checks (preserve on update / default uninstall).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const nsh = fs.readFileSync(path.join(root, 'build', 'installer.nsh'), 'utf8');
const prep = fs.readFileSync(path.join(root, 'electron', 'uninstall-prep.js'), 'utf8');
const errors = [];
function check(ok, msg) {
  if (!ok) errors.push(msg);
}

check(nsh.includes('!macro customRemoveFiles'), 'customRemoveFiles required');
check(nsh.includes('UPDATE detected — preserving Cupping Center userData'), 'update must preserve userData');
check(nsh.includes('${if} ${isUpdated}'), 'must branch on isUpdated');
check(nsh.includes('RMDir /r $INSTDIR'), 'must still remove INSTDIR');
check(!/nt_un_wipe_live:[\s\S]{0,80}ALWAYS delete live/.test(nsh), 'must not always wipe live userData');
check(nsh.includes('Keep center business data for a future reinstall'), 'uninstall must offer keep-data default');
check(/StrCpy \$NT_UninstallMode "0"/.test(nsh), 'default uninstall mode must be preserve (0)');
check(nsh.includes('preserve mode — no second-pass AppData wipe'), 'customUnInstall must not wipe in preserve mode');
check(nsh.includes('business data (database, attachments, settings, backups) is KEPT'), 'welcome text must say data kept by default');

// uninstall-prep: non-full must not wipeAllLegacyUserDataRoots as default path
check(prep.includes('wipeLicenseFromLegacyUserDataRoots'), 'uninstall-prep must support license-only wipe');
check(prep.includes('preserved: true'), 'non-full uninstall-prep must preserve live root');

// MessageBox jump label limit
nsh.split('\n').forEach((line, i) => {
  if (!/MessageBox/i.test(line)) return;
  const jumpLabels = (line.match(/\bID(?:YES|NO|OK|CANCEL)\s+\w+/g) || []).length;
  if (jumpLabels > 2) errors.push(`installer.nsh:${i + 1} MessageBox has ${jumpLabels} jump labels (NSIS max 2)`);
});

if (errors.length) {
  console.error('FAIL: nsis persistence policy');
  errors.forEach((e) => console.error(' -', e));
  process.exit(1);
}
console.log('OK: nsis persistence — update preserves userData; default uninstall keeps business data');
