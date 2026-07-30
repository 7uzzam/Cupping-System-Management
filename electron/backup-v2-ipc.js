'use strict';

/**
 * Backup V2 IPC wiring (Hybrid). Main-process only — no CSP impact.
 * Feature flag: HYBRID_BACKUP_V2 (default enabled).
 */
const path = require('path');
const fs = require('fs');
const { dialog } = require('electron');
const backupV2 = require('./backup-v2-core');
const { BackupV2Scheduler } = require('./backup-v2-scheduler');

function isBackupV2Enabled() {
  const raw = process.env.HYBRID_BACKUP_V2;
  if (raw == null || raw === '') return true;
  return raw !== '0' && raw !== 'false';
}

function asIdentity(opts = {}) {
  const centerId = String(opts.centerId || opts.organizationId || '').slice(0, 128);
  const organizationId = String(opts.organizationId || opts.centerId || '').slice(0, 128);
  const branchId = String(opts.branchId || '').slice(0, 128);
  const authorizedBranchIds = Array.isArray(opts.authorizedBranchIds)
    ? opts.authorizedBranchIds.map((v) => String(v).slice(0, 128)).filter(Boolean)
    : (branchId ? [branchId] : []);
  return {
    centerId,
    organizationId,
    branchId,
    authorizedBranchIds,
    deviceId: String(opts.deviceId || '').slice(0, 128),
    centerName: String(opts.centerName || '').slice(0, 200),
    deviceName: String(opts.deviceName || '').slice(0, 200),
    allowMissingSourceMetadata: opts.allowMissingSourceMetadata === true,
  };
}

function createFileCredentialVault(userDataDir) {
  const storePath = path.join(userDataDir, 'settings', 'backup-v2-credentials.json');
  function readAll() {
    try {
      return JSON.parse(fs.readFileSync(storePath, 'utf8'));
    } catch {
      return {};
    }
  }
  function writeAll(data) {
    fs.mkdirSync(path.dirname(storePath), { recursive: true });
    fs.writeFileSync(storePath, `${JSON.stringify(data)}\n`, { encoding: 'utf8', mode: 0o600 });
  }
  return {
    has(key) {
      const all = readAll();
      return Boolean(all[key]);
    },
    get(key) {
      const all = readAll();
      return all[key] || null;
    },
    set(key, value) {
      const all = readAll();
      all[key] = String(value || '');
      writeAll(all);
    },
    remove(key) {
      const all = readAll();
      delete all[key];
      writeAll(all);
    },
  };
}

function registerBackupV2Ipc({
  handle,
  V,
  getUserDataPath,
  appVersion,
  app,
  closeDatabase,
  reopenDatabase,
  applySecurityMaterial,
  rollbackSecurityMaterial,
  getCurrentSecurityMaterial,
  getLiveIdentity,
}) {
  if (!isBackupV2Enabled()) return { enabled: false, scheduler: null };

  let scheduler = null;

  function resolveIdentity(opts = {}) {
    const fromLive = typeof getLiveIdentity === 'function' ? (getLiveIdentity() || {}) : {};
    return asIdentity({ ...fromLive, ...opts });
  }

  function defaultBackupDir() {
    return path.join(getUserDataPath(), 'Backups', 'V2');
  }

  async function runRestore(filePath, password, opts = {}) {
    const identity = resolveIdentity(opts);
    const progress = [];
    try {
      const result = await backupV2.restoreBackupFile({
        filePath,
        password,
        userDataDir: opts.targetUserDataDir || getUserDataPath(),
        expectedIdentity: identity,
        closeDatabase: closeDatabase || undefined,
        reopenDatabase: reopenDatabase || undefined,
        applySecurityMaterial: applySecurityMaterial || undefined,
        rollbackSecurityMaterial: rollbackSecurityMaterial || undefined,
        currentSecurityMaterial: typeof getCurrentSecurityMaterial === 'function'
          ? getCurrentSecurityMaterial()
          : undefined,
        onProgress: (evt) => progress.push(evt),
        unrestorableReport: Array.isArray(opts.unrestorableReport) ? opts.unrestorableReport : [],
      });
      result.progress = progress;
      if (result.ok && result.needRestart && opts.relaunch !== false && app) {
        setTimeout(() => {
          try {
            app.relaunch();
            app.exit(0);
          } catch { /* ignore */ }
        }, 250);
      }
      return result;
    } catch (error) {
      const friendly = backupV2.friendlyBackupError(error);
      const err = new Error(friendly.message);
      err.code = friendly.code;
      err.progress = progress;
      throw err;
    }
  }

  handle('backup:v2:health', async () => {
    const databasePath = path.join(getUserDataPath(), 'database', 'tadawi.db');
    return {
      ...backupV2.databaseHealth(databasePath),
      gate: backupV2.readRestoreGate(getUserDataPath()),
      rowCounts: backupV2.countDatabaseRows(databasePath),
    };
  });

  handle('backup:v2:create', async (_e, options) => {
    const opts = V.asObject(options, { name: 'options' });
    const password = V.asString(opts.password, { name: 'password', required: true, allowEmpty: false, max: 256 });
    if (password.length < 8) {
      const err = new Error('password_too_short');
      err.code = 'password_too_short';
      throw err;
    }
    const identity = resolveIdentity(opts);
    const userDataDir = getUserDataPath();
    const outDir = opts.outputDir
      ? V.asString(opts.outputDir, { name: 'outputDir', required: true, allowEmpty: false })
      : defaultBackupDir();
    fs.mkdirSync(outDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(outDir, `Tadawi-Backup-V2-${stamp}.tdw`);
    return backupV2.createBackupFile({
      userDataDir,
      outputPath: filePath,
      password,
      appVersion: appVersion || '2.0.0',
      backupType: opts.backupType || 'manual',
      centerId: identity.centerId,
      organizationId: identity.organizationId,
      branchId: identity.branchId,
      branchIds: identity.authorizedBranchIds,
      deviceId: identity.deviceId,
      centerName: identity.centerName,
      deviceName: identity.deviceName,
      scopeType: opts.scopeType || 'organization',
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
    const inspected = backupV2.inspectEncryptedBackup(buf, password, opts);
    return {
      ok: true,
      manifest: inspected.manifest,
      database: inspected.database,
      encryptedSha256: inspected.encryptedSha256,
      encryptedSize: inspected.encryptedSize,
    };
  });

  handle('backup:v2:restore', async (_e, options) => {
    const opts = V.asObject(options, { name: 'options', required: true });
    const filePath = V.asString(opts.filePath, { name: 'filePath', required: true, allowEmpty: false });
    const password = V.asString(opts.password, { name: 'password', required: true, allowEmpty: false, max: 256 });
    return runRestore(filePath, password, opts);
  });

  handle('backup:v2:listLocal', async (_e, options) => {
    const opts = V.asObject(options || {}, { name: 'options' });
    const dir = opts.dir
      ? V.asString(opts.dir, { name: 'dir', required: true, allowEmpty: false })
      : defaultBackupDir();
    return { ok: true, dir, files: backupV2.listLocalBackupFiles(dir) };
  });

  handle('backup:v2:pickLatest', async (_e, options) => {
    const opts = V.asObject(options, { name: 'options', required: true });
    const password = V.asString(opts.password, { name: 'password', required: true, allowEmpty: false, max: 256 });
    const identity = resolveIdentity(opts);
    const localDir = opts.dir
      ? V.asString(opts.dir, { name: 'dir', required: true, allowEmpty: false })
      : defaultBackupDir();
    const local = backupV2.listLocalBackupFiles(localDir);
    const cloud = Array.isArray(opts.cloudCandidates) ? opts.cloudCandidates : [];
    const picked = backupV2.pickLatestAuthorizedBackup(
      [...local, ...cloud],
      password,
      identity,
      opts
    );
    if (!picked.ok) {
      const err = new Error('no_authorized_backup');
      err.code = 'no_authorized_backup';
      err.details = picked;
      throw err;
    }
    return picked;
  });

  handle('backup:v2:restoreLatest', async (_e, options) => {
    const opts = V.asObject(options, { name: 'options', required: true });
    const password = V.asString(opts.password, { name: 'password', required: true, allowEmpty: false, max: 256 });
    const identity = resolveIdentity(opts);
    const localDir = opts.dir
      ? V.asString(opts.dir, { name: 'dir', required: true, allowEmpty: false })
      : defaultBackupDir();
    const local = backupV2.listLocalBackupFiles(localDir);
    const cloud = Array.isArray(opts.cloudCandidates) ? opts.cloudCandidates : [];
    const picked = backupV2.pickLatestAuthorizedBackup([...local, ...cloud], password, identity, opts);
    if (!picked.ok || !picked.selected?.filePath) {
      const err = new Error('no_authorized_backup');
      err.code = 'no_authorized_backup';
      throw err;
    }
    return runRestore(picked.selected.filePath, password, { ...opts, selected: picked.selected });
  });

  handle('backup:v2:pickFile', async () => {
    const result = await dialog.showOpenDialog({
      title: 'اختر نسخة Backup V2',
      filters: [{ name: 'Tadawi Backup V2', extensions: ['tdw'] }],
      properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths?.length) return { ok: false, canceled: true };
    return { ok: true, filePath: result.filePaths[0] };
  });

  handle('backup:v2:gate', async () => backupV2.readRestoreGate(getUserDataPath()));

  handle('backup:v2:scheduleStatus', async () => {
    if (!scheduler) return { ok: false, enabled: false, error: 'scheduler_not_started' };
    return { ok: true, ...scheduler.status() };
  });

  handle('backup:v2:scheduleConfigure', async (_e, options) => {
    if (!scheduler) {
      const err = new Error('scheduler_not_started');
      err.code = 'scheduler_not_started';
      throw err;
    }
    const opts = V.asObject(options || {}, { name: 'options' });
    return { ok: true, ...scheduler.configure(opts) };
  });

  // Start scheduler (idempotent)
  try {
    const userDataDir = getUserDataPath();
    const vault = createFileCredentialVault(userDataDir);
    scheduler = new BackupV2Scheduler({
      userDataDir,
      credentialVault: vault,
      runBackup: async (password, meta = {}) => {
        const identity = resolveIdentity(meta);
        const outDir = meta.localPath && String(meta.localPath).trim()
          ? String(meta.localPath).trim()
          : defaultBackupDir();
        fs.mkdirSync(outDir, { recursive: true });
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filePath = path.join(outDir, `Tadawi-Backup-V2-scheduled-${stamp}.tdw`);
        const created = await backupV2.createBackupFile({
          userDataDir,
          outputPath: filePath,
          password,
          appVersion: appVersion || '2.0.0',
          backupType: 'scheduled',
          centerId: identity.centerId,
          organizationId: identity.organizationId,
          branchId: identity.branchId,
          branchIds: identity.authorizedBranchIds,
          deviceId: identity.deviceId,
          centerName: identity.centerName || meta.centerName,
          deviceName: identity.deviceName || meta.deviceName,
        });
        return { ...created, cloudOk: true };
      },
    });
    scheduler.start();
  } catch (error) {
    console.error('[backup-v2] scheduler start failed:', error.message);
    scheduler = null;
  }

  return { enabled: true, scheduler };
}

module.exports = {
  isBackupV2Enabled,
  registerBackupV2Ipc,
  backupV2,
  asIdentity,
  createFileCredentialVault,
};
