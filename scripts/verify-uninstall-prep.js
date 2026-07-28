#!/usr/bin/env node
/**
 * Smoke test for uninstall-prep — archive center data, wipe license paths.
 */
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const {
  runUninstallPrep,
  readUninstallCenterMeta,
  writeUninstallCenterMeta,
  wipeChromiumLicenseStorage,
} = await import(
  pathToFileURL(join(process.cwd(), 'electron/uninstall-prep.js')).href
);

const appData = mkdtempSync(join(tmpdir(), 'tdw-uninstall-'));
const userData = join(appData, 'Cupping Center');
mkdirSync(join(userData, 'cache', 'CTR-001'), { recursive: true });
mkdirSync(join(userData, 'Local Storage', 'leveldb'), { recursive: true });
mkdirSync(join(userData, 'Session Storage'), { recursive: true });
mkdirSync(join(userData, 'IndexedDB'), { recursive: true });
mkdirSync(join(userData, 'CloudVault', 'tokens'), { recursive: true });
writeFileSync(join(userData, 'cache', 'CTR-001', 'license.json'), JSON.stringify({ licenseId: 'L-1' }));
writeFileSync(join(userData, 'Local Storage', 'leveldb', '000003.log'), '__tdw_lic__=SECRET');
writeFileSync(join(userData, 'Session Storage', '000003.log'), 'session');
writeFileSync(join(userData, 'CloudVault', 'tokens', 'google.json'), '{"refresh":"x"}');
writeFileSync(join(userData, 'tadawi-db.json'), JSON.stringify({ clients: [] }));
writeFileSync(join(userData, 'license-test.json'), JSON.stringify({ licenseKey: 'QA' }));
writeUninstallCenterMeta(userData, { centerName: 'مركز اختبار', centerId: 'CTR-001' });

// Unit: chromium wipe removes Local Storage without Electron child
const chromeOk = wipeChromiumLicenseStorage(userData);
let ok = chromeOk
  && !existsSync(join(userData, 'Local Storage'))
  && !existsSync(join(userData, 'Session Storage'))
  && !existsSync(join(userData, 'IndexedDB'))
  && !existsSync(join(userData, 'CloudVault'));

// Recreate storage for full uninstall-prep run
mkdirSync(join(userData, 'Local Storage', 'leveldb'), { recursive: true });
writeFileSync(join(userData, 'Local Storage', 'leveldb', '000003.log'), '__tdw_lic__=SECRET');
writeFileSync(join(userData, 'cache', 'CTR-001', 'license.json'), JSON.stringify({ licenseId: 'L-1' }));

const result = await runUninstallPrep({
  userDataRoot: userData,
  execPath: process.execPath, // node — wipe child may fail; FS wipe must still succeed
  fullRemoval: false,
});

ok = ok && result.ok && !existsSync(userData);
ok = ok && result.archivePath && existsSync(result.archivePath);
ok = ok && existsSync(join(result.archivePath, 'tadawi-db.json'));
ok = ok && !existsSync(join(result.archivePath, 'cache', 'CTR-001', 'license.json'));
ok = ok && !existsSync(join(result.archivePath, 'Local Storage'));
ok = ok && readUninstallCenterMeta(result.archivePath).centerName === 'مركز اختبار';

rmSync(appData, { recursive: true, force: true });
if (!ok) {
  console.error('uninstall-prep smoke test FAILED', result);
  process.exit(1);
}
console.log('uninstall-prep smoke test PASS');
