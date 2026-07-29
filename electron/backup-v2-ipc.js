'use strict';

/**
 * Backup V2 IPC wiring (Hybrid). Main-process only — no CSP impact.
 * Feature flag: HYBRID_BACKUP_V2 (default enabled).
 */
const path = require('path');
const fs = require('fs');
const backupV2 = require('./backup-v2-core');

function isBackupV2Enabled() {
  const raw = process.env.HYBRID_BACKUP_V2;
  if (raw == null || raw === '') return true;
  return raw !== '0' && raw !== 'false';
}

function registerBackupV2Ipc({ handle, V, getUserDataPath, appVersion }) {
  if (!isBackupV2Enabled()) return { enabled: false };

  handle('backup:v2:health', async () => {
    const databasePath = path.join(getUserDataPath(), 'database', 'tadawi.db');
    return backupV2.databaseHealth(databasePath);
  });

  handle('backup:v2:create', async (_e, options) => {
    const opts = V.asObject(options, { name: 'options' });
    const password = V.asString(opts.password, { name: 'password', required: true, allowEmpty: false, max: 256 });
    if (password.length < 8) {
      const err = new Error('password_too_short');
      err.code = 'password_too_short';
      throw err;
    }
    const userDataDir = getUserDataPath();
    const outDir = path.join(userDataDir, 'Backups', 'V2');
    fs.mkdirSync(outDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(outDir, `Tadawi-Backup-V2-${stamp}.tdw`);
    return backupV2.createBackupFile({
      userDataDir,
      outputPath: filePath,
      password,
      appVersion: appVersion || '2.0.0',
      backupType: opts.backupType || 'manual',
    });
  });

  handle('backup:v2:verify', async (_e, options) => {
    const opts = V.asObject(options, { name: 'options', required: true });
    const filePath = V.asString(opts.filePath, { name: 'filePath', required: true, allowEmpty: false });
    const password = V.asString(opts.password, { name: 'password', required: true, allowEmpty: false, max: 256 });
    return backupV2.verifyBackupFile(filePath, password, opts);
  });

  handle('backup:v2:inspect', async (_e, options) => {
    const opts = V.asObject(options, { name: 'options', required: true });
    const filePath = V.asString(opts.filePath, { name: 'filePath', required: true, allowEmpty: false });
    const password = V.asString(opts.password, { name: 'password', required: true, allowEmpty: false, max: 256 });
    const buf = fs.readFileSync(filePath);
    return backupV2.inspectEncryptedBackup(buf, password, opts);
  });

  handle('backup:v2:restore', async (_e, options) => {
    const opts = V.asObject(options, { name: 'options', required: true });
    const filePath = V.asString(opts.filePath, { name: 'filePath', required: true, allowEmpty: false });
    const password = V.asString(opts.password, { name: 'password', required: true, allowEmpty: false, max: 256 });
    const targetUserData = opts.targetUserDataDir
      ? V.asString(opts.targetUserDataDir, { name: 'targetUserDataDir', required: true, allowEmpty: false })
      : getUserDataPath();
    return backupV2.restoreBackupFile({
      filePath,
      password,
      userDataDir: targetUserData,
    });
  });

  return { enabled: true };
}

module.exports = {
  isBackupV2Enabled,
  registerBackupV2Ipc,
  backupV2,
};
