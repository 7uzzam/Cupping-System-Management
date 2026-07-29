#!/usr/bin/env node
/**
 * Smoke test for uninstall-prep — default uninstall preserves business data,
 * clears license markers only. Full removal deletes the live root.
 */
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const {
  runUninstallPrep,
  writeUninstallCenterMeta,
  wipeChromiumLicenseStorage,
} = await import(
  pathToFileURL(join(process.cwd(), 'electron/uninstall-prep.js')).href
);

const appData = mkdtempSync(join(tmpdir(), 'tdw-uninstall-'));
const userData = join(appData, 'Cupping Center');
mkdirSync(join(userData, 'cache', 'CTR-001'), { recursive: true });
mkdirSync(join(userData, 'database'), { recursive: true });
mkdirSync(join(userData, 'Local Storage', 'leveldb'), { recursive: true });
mkdirSync(join(userData, 'Session Storage'), { recursive: true });
mkdirSync(join(userData, 'IndexedDB'), { recursive: true });
mkdirSync(join(userData, 'CloudVault', 'tokens'), { recursive: true });
writeFileSync(join(userData, 'cache', 'CTR-001', 'license.json'), JSON.stringify({ licenseId: 'L-1' }));
writeFileSync(join(userData, 'Local Storage', 'leveldb', '000003.log'), '__tdw_lic__=SECRET');
writeFileSync(join(userData, 'Session Storage', '000003.log'), 'session');
writeFileSync(join(userData, 'CloudVault', 'tokens', 'google.json'), '{"refresh":"x"}');
writeFileSync(join(userData, 'database', 'tadawi.db'), 'sqlite-placeholder');
writeFileSync(join(userData, 'tadawi-db.json'), JSON.stringify({ clients: [{ id: 'c1' }] }));
writeUninstallCenterMeta(userData, { centerName: 'مركز اختبار', centerId: 'CTR-001' });

// Unit: chromium wipe removes Local Storage without Electron child
const chromeOk = wipeChromiumLicenseStorage(userData);
let ok = chromeOk
  && !existsSync(join(userData, 'Local Storage'))
  && !existsSync(join(userData, 'Session Storage'))
  && !existsSync(join(userData, 'IndexedDB'))
  && !existsSync(join(userData, 'CloudVault'));

// Recreate license markers for default (preserve) uninstall-prep
mkdirSync(join(userData, 'Local Storage', 'leveldb'), { recursive: true });
writeFileSync(join(userData, 'Local Storage', 'leveldb', '000003.log'), '__tdw_lic__=SECRET');
writeFileSync(join(userData, 'cache', 'CTR-001', 'license.json'), JSON.stringify({ licenseId: 'L-1' }));

const preserve = await runUninstallPrep({
  userDataRoot: userData,
  execPath: process.execPath,
  fullRemoval: false,
});

ok = ok
  && preserve.ok
  && preserve.preserved === true
  && existsSync(userData)
  && existsSync(join(userData, 'database', 'tadawi.db'))
  && existsSync(join(userData, 'tadawi-db.json'))
  && !existsSync(join(userData, 'Local Storage'))
  && !existsSync(join(userData, 'cache', 'CTR-001', 'license.json'));

// Full removal must delete live root
writeFileSync(join(userData, 'keep-me.json'), '{}');
const full = await runUninstallPrep({
  userDataRoot: userData,
  execPath: process.execPath,
  fullRemoval: true,
});
ok = ok && full.ok && !existsSync(userData);

rmSync(appData, { recursive: true, force: true });
if (!ok) {
  console.error('uninstall-prep smoke test FAILED', { preserve, full });
  process.exit(1);
}
console.log('uninstall-prep smoke test PASS (normal preserve + explicit full removal)');
