#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const nsh = fs.readFileSync(path.join(root, 'build', 'installer.nsh'), 'utf8');
const errors = [];
function check(ok, msg) {
  if (!ok) errors.push(msg);
}

check(nsh.includes('!macro customRemoveFiles'), 'customRemoveFiles required (wipe before INSTDIR delete)');
check(nsh.includes('Call un.NT_RemoveAppDataIfNeeded'), 'customRemoveFiles must wipe AppData');
check(nsh.includes('RMDir /r $INSTDIR'), 'customRemoveFiles must still remove INSTDIR');
check(nsh.includes('rmdir /S /Q'), 'must use cmd rmdir for locked folders');
check(nsh.includes('Remove-Item -LiteralPath'), 'must use PowerShell fallback');
check(nsh.includes('$PROFILE\\AppData\\Roaming\\${NT_USER_DATA_NAME}') || nsh.includes('$PROFILE\\AppData\\Roaming\\${NT_USER_DATA_NAME}'),
  'must wipe via $PROFILE Roaming path');
check(nsh.includes('SetShellVarContext current'), 'must force current-user shell for Electron userData');
check(nsh.includes('second-pass verify'), 'customUnInstall should be second-pass verify');
check(/!macro customUnInstall[\s\S]*NT_ForceWipeAllUserData/.test(nsh), 'customUnInstall second-pass wipe');

// MessageBox jump label limit (NSIS max 2)
const lines = nsh.split('\n');
lines.forEach((line, i) => {
  if (!/MessageBox/i.test(line)) return;
  const ids = line.match(/\bID(YES|NO|OK|CANCEL|ABORT|RETRY|IGNORE)\b/g) || [];
  // Count jump targets after MessageBox flags — electron-builder check uses IDYES/IDNO labels
  const jumpLabels = (line.match(/\bID(?:YES|NO|OK|CANCEL)\s+\w+/g) || []).length;
  if (jumpLabels > 2) errors.push(`installer.nsh:${i + 1} MessageBox has ${jumpLabels} jump labels (NSIS max 2)`);
});

if (errors.length) {
  console.error('FAIL: nsis cupping-center wipe');
  errors.forEach((e) => console.error(' -', e));
  process.exit(1);
}
console.log('OK: nsis Cupping Center wipe ordering + cmd/powershell force-delete');
