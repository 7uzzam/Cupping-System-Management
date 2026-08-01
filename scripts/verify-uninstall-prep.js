#!/usr/bin/env node
/**
 * Smoke test for uninstall-prep — archive center data, wipe license paths.
 */
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const { runUninstallPrep, readUninstallCenterMeta, writeUninstallCenterMeta } = await import(
  pathToFileURL(join(process.cwd(), 'electron/uninstall-prep.js')).href
);

const appData = mkdtempSync(join(tmpdir(), 'tdw-uninstall-'));
const userData = join(appData, 'Cupping Center');
mkdirSync(join(userData, 'cache', 'CTR-001'), { recursive: true });
writeFileSync(join(userData, 'cache', 'CTR-001', 'license.json'), JSON.stringify({ licenseId: 'L-1' }));
writeFileSync(join(userData, 'tadawi-db.json'), JSON.stringify({ clients: [] }));
writeFileSync(join(userData, 'license-test.json'), JSON.stringify({ licenseKey: 'QA' }));
writeUninstallCenterMeta(userData, { centerName: 'مركز اختبار', centerId: 'CTR-001' });

const result = await runUninstallPrep({
  userDataRoot: userData,
  execPath: process.execPath,
  fullRemoval: false,
});

let ok = result.ok && !existsSync(userData);
ok = ok && result.archivePath && existsSync(result.archivePath);
ok = ok && existsSync(join(result.archivePath, 'tadawi-db.json'));
ok = ok && !existsSync(join(result.archivePath, 'cache', 'CTR-001', 'license.json'));
ok = ok && readUninstallCenterMeta(result.archivePath).centerName === 'مركز اختبار';

rmSync(appData, { recursive: true, force: true });
if (!ok) {
  console.error('uninstall-prep smoke test FAILED', result);
  process.exit(1);
}
console.log('uninstall-prep smoke test PASS');
