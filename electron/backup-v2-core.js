'use strict';

/**
 * Backup & Restore V2 core.
 *
 * The module deliberately has no Electron dependency so the complete backup,
 * verification, restore, migration and rollback pipeline can be exercised in
 * ordinary Node tests.
 */
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Database = require('better-sqlite3');
const fflate = require('fflate');
const backupCrypto = require('./backup-crypto-v2');
const { writeFileAtomicSync } = require('./atomic-file');
const { MIGRATIONS, runSchemaMigrations } = require('../database/hybrid-schema');

const BACKUP_VERSION = 2;
const BACKUP_FORMAT = 'tadawi-backup-v2';
const MANIFEST_PATH = 'backup-manifest.json';
const DATABASE_PATH = 'database/tadawi.db';
const SECURITY_PATH = 'security/field-key.json';
const RESTORE_ROOTS = Object.freeze(['database', 'attachments', 'settings', 'center-assets']);
const MAX_ARCHIVE_ENTRIES = 25000;
const MAX_UNCOMPRESSED_BYTES = 8 * 1024 * 1024 * 1024;
const CURRENT_SCHEMA_VERSION = Math.max(0, ...MIGRATIONS.map((migration) => Number(migration.version) || 0));

const EXCLUDED_SEGMENT = /^(?:cache|caches|temp|tmp|logs?|license-admin|admin-data)$/i;
const EXCLUDED_FILE = /(?:^|[-_.])(?:private[-_.]?key|credentials?|oauth|access[-_.]?token|refresh[-_.]?token|secret)(?:[-_.]|$)|\.(?:pem|p12|pfx|key)$/i;
const SENSITIVE_SETTING_KEY = /(?:password|passphrase|secret|token|privatekey|private_key|credential|licenseadmin|license_admin)/i;

function emitProgress(options, stage, details = {}) {
  try { options?.onProgress?.({ stage, at: new Date().toISOString(), ...details }); } catch { /* observer only */ }
}

function failpoint(options, name) {
  if (options?.failpoint !== name) return;
  if (name === 'disk_full') {
    const error = new Error('backup_disk_space_insufficient');
    error.code = 'ENOSPC';
    throw error;
  }
  throw new Error(`backup_failpoint_${name}`);
}

function safeRemove(target, expectedParent) {
  const resolved = path.resolve(target);
  const parent = path.resolve(expectedParent);
  if (resolved === parent || !resolved.startsWith(parent + path.sep)) throw new Error('unsafe_cleanup_target');
  if (fs.existsSync(resolved)) fs.rmSync(resolved, { recursive: true, force: true });
}

function normalizeArchivePath(value) {
  const normalized = String(value || '').replace(/\\/g, '/').replace(/^\.\//, '');
  if (!normalized || normalized.includes('\0') || normalized.startsWith('/') || /^[A-Za-z]:/.test(normalized)) {
    throw new Error('backup_entry_path_invalid');
  }
  const segments = normalized.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new Error('backup_entry_path_invalid');
  }
  return segments.join('/');
}

function shouldExclude(relativePath) {
  const normalized = normalizeArchivePath(relativePath);
  const segments = normalized.split('/');
  return segments.some((segment) => EXCLUDED_SEGMENT.test(segment)) || EXCLUDED_FILE.test(segments.at(-1));
}

function sanitizeSettingsValue(value, seen = new WeakSet()) {
  if (Array.isArray(value)) return value.map((item) => sanitizeSettingsValue(item, seen));
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return null;
  seen.add(value);
  const output = {};
  for (const [key, item] of Object.entries(value)) {
    if (SENSITIVE_SETTING_KEY.test(key)) continue;
    output[key] = sanitizeSettingsValue(item, seen);
  }
  seen.delete(value);
  return output;
}

function readBackupFile(filePath, archivePath) {
  const buffer = fs.readFileSync(filePath);
  if (!archivePath.startsWith('settings/') || path.extname(filePath).toLowerCase() !== '.json') return buffer;
  try {
    const parsed = JSON.parse(buffer.toString('utf8'));
    return Buffer.from(`${JSON.stringify(sanitizeSettingsValue(parsed), null, 2)}\n`, 'utf8');
  } catch {
    return buffer;
  }
}

function collectDirectory(sourceRoot, archiveRoot, entries) {
  if (!fs.existsSync(sourceRoot)) return;
  for (const dirent of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
    const source = path.join(sourceRoot, dirent.name);
    const archivePath = normalizeArchivePath(`${archiveRoot}/${dirent.name}`);
    if (shouldExclude(archivePath)) continue;
    if (dirent.isSymbolicLink()) continue;
    if (dirent.isDirectory()) collectDirectory(source, archivePath, entries);
    else if (dirent.isFile()) entries[archivePath] = new Uint8Array(readBackupFile(source, archivePath));
  }
}

function databaseHealth(databasePath) {
  if (!fs.existsSync(databasePath)) throw new Error('backup_database_not_found');
  let db;
  try {
    db = new Database(databasePath, { readonly: true, fileMustExist: true, timeout: 5000 });
    const quickCheck = db.pragma('quick_check', { simple: true });
    if (quickCheck !== 'ok') throw new Error('backup_database_integrity_failed');
    const { readSchemaVersion } = require('../database/hybrid-schema');
    const schemaVersion = readSchemaVersion(db);
    return { ok: true, quickCheck, schemaVersion, size: fs.statSync(databasePath).size };
  } finally {
    try { db?.close(); } catch { /* best effort */ }
  }
}

async function createConsistentDatabaseSnapshot(sourcePath, targetPath) {
  databaseHealth(sourcePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  let source;
  try {
    source = new Database(sourcePath, { readonly: true, fileMustExist: true, timeout: 5000 });
    await source.backup(targetPath);
  } finally {
    try { source?.close(); } catch { /* best effort */ }
  }
  return databaseHealth(targetPath);
}

function buildManifest(options, entries, databaseInfo) {
  const files = Object.keys(entries).sort().map((archivePath) => {
    const data = Buffer.from(entries[archivePath]);
    return {
      path: archivePath,
      size: data.length,
      sha256: backupCrypto.sha256Hex(data),
    };
  });
  return {
    format: BACKUP_FORMAT,
    backupVersion: BACKUP_VERSION,
    backupId: options.backupId || crypto.randomUUID(),
    backupType: options.backupType || 'manual',
    appVersion: String(options.appVersion || '0.0.0'),
    buildVersion: String(options.buildVersion || options.appVersion || '0.0.0'),
    createdAt: (options.now || new Date()).toISOString(),
    databaseSchemaVersion: databaseInfo.schemaVersion,
    platform: process.platform,
    source: {
      centerName: String(options.centerName || '').slice(0, 200),
      deviceName: String(options.deviceName || '').slice(0, 200),
      organizationId: String(options.organizationId || options.centerId || '').slice(0, 128),
      centerId: String(options.centerId || options.organizationId || '').slice(0, 128),
      branchId: String(options.branchId || '').slice(0, 128),
      deviceId: String(options.deviceId || '').slice(0, 128),
    },
    scope: {
      type: String(options.scopeType || 'organization').slice(0, 32),
      organizationId: String(options.organizationId || options.centerId || '').slice(0, 128),
      branchIds: Array.isArray(options.branchIds)
        ? options.branchIds.slice(0, 100).map(value => String(value).slice(0, 128))
        : (options.branchId ? [String(options.branchId).slice(0, 128)] : [])
    },
    roots: [...RESTORE_ROOTS],
    encryption: { required: true, algorithm: 'AES-256-GCM', kdf: 'scrypt' },
    integrity: { algorithm: 'SHA-256', verifiedBeforeCommit: true },
    files,
  };
}

function zipEntries(entries) {
  return Buffer.from(fflate.zipSync(entries, { level: 6 }));
}

function unzipEntries(zipBuffer) {
  let count = 0;
  let total = 0;
  const names = new Set();
  const entries = fflate.unzipSync(new Uint8Array(zipBuffer), {
    filter(file) {
      const name = normalizeArchivePath(file.name);
      if (names.has(name)) throw new Error('backup_duplicate_entry');
      names.add(name);
      count++;
      total += Number(file.originalSize || 0);
      if (count > MAX_ARCHIVE_ENTRIES) throw new Error('backup_too_many_entries');
      if (total > MAX_UNCOMPRESSED_BYTES) throw new Error('backup_uncompressed_size_exceeded');
      return true;
    },
  });
  const normalized = {};
  for (const [name, data] of Object.entries(entries)) {
    const safeName = normalizeArchivePath(name);
    if (normalized[safeName]) throw new Error('backup_duplicate_entry');
    normalized[safeName] = Buffer.from(data);
  }
  return normalized;
}

function parseAndVerifyArchive(zipBuffer, options = {}) {
  const entries = unzipEntries(zipBuffer);
  const rawManifest = entries[MANIFEST_PATH];
  if (!rawManifest) throw new Error('backup_manifest_missing');
  let manifest;
  try { manifest = JSON.parse(rawManifest.toString('utf8')); } catch { throw new Error('backup_manifest_invalid'); }
  if (manifest.format !== BACKUP_FORMAT || manifest.backupVersion !== BACKUP_VERSION) {
    throw new Error('backup_version_unsupported');
  }
  if (!Array.isArray(manifest.files) || !manifest.files.length) throw new Error('backup_manifest_files_invalid');
  if (!entries[DATABASE_PATH]) throw new Error('backup_database_missing');
  if (Number(manifest.databaseSchemaVersion) > Number(options.currentSchemaVersion ?? CURRENT_SCHEMA_VERSION)) {
    throw new Error('backup_schema_newer_than_application');
  }
  const declared = new Set();
  for (const file of manifest.files) {
    const archivePath = normalizeArchivePath(file?.path);
    if (archivePath === MANIFEST_PATH || declared.has(archivePath)) throw new Error('backup_manifest_files_invalid');
    declared.add(archivePath);
    const data = entries[archivePath];
    if (!data) throw new Error('backup_file_missing');
    if (Number(file.size) !== data.length) throw new Error('backup_file_size_mismatch');
    if (!/^[a-f0-9]{64}$/i.test(String(file.sha256 || '')) || backupCrypto.sha256Hex(data) !== String(file.sha256).toLowerCase()) {
      throw new Error('backup_file_hash_mismatch');
    }
  }
  for (const archivePath of Object.keys(entries)) {
    if (archivePath !== MANIFEST_PATH && !declared.has(archivePath)) throw new Error('backup_undeclared_file');
  }
  let securityMaterial = null;
  if (entries[SECURITY_PATH]) {
    let parsed;
    try { parsed = JSON.parse(entries[SECURITY_PATH].toString('utf8')); } catch { throw new Error('backup_field_key_invalid'); }
    if (parsed?.version !== 1 || Buffer.from(String(parsed.fieldKey || ''), 'base64').length !== 32) {
      throw new Error('backup_field_key_invalid');
    }
    securityMaterial = { fieldKey: parsed.fieldKey };
  }
  return { manifest, entries, securityMaterial };
}

function verifyStagedDatabase(databaseBuffer) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tdw-backup-verify-'));
  const target = path.join(root, 'tadawi.db');
  try {
    fs.writeFileSync(target, databaseBuffer, { mode: 0o600 });
    return databaseHealth(target);
  } finally {
    safeRemove(root, os.tmpdir());
  }
}

function inspectEncryptedBackup(encryptedBuffer, password, options = {}) {
  const outer = Buffer.isBuffer(encryptedBuffer) ? encryptedBuffer : Buffer.from(encryptedBuffer);
  const zipBuffer = backupCrypto.decryptBuffer(outer, password);
  const inspected = parseAndVerifyArchive(zipBuffer, options);
  const database = verifyStagedDatabase(inspected.entries[DATABASE_PATH]);
  return {
    ...inspected,
    zipBuffer,
    database,
    encryptedSize: outer.length,
    encryptedSha256: backupCrypto.sha256Hex(outer),
  };
}

async function createBackupBuffer(options) {
  if (!options?.userDataDir) throw new Error('backup_user_data_dir_required');
  if (!options.password || String(options.password).length < 8) throw new Error('password_too_short');
  const userDataDir = path.resolve(options.userDataDir);
  const sourceDatabase = path.resolve(options.databasePath || path.join(userDataDir, DATABASE_PATH.replace(/\//g, path.sep)));
  const stageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tdw-backup-v2-'));
  try {
    emitProgress(options, 'checking_database');
    const sourceHealth = databaseHealth(sourceDatabase);
    failpoint(options, 'after_source_integrity');

    emitProgress(options, 'creating_snapshot');
    const stagedDatabase = path.join(stageRoot, 'tadawi.db');
    const databaseInfo = await createConsistentDatabaseSnapshot(sourceDatabase, stagedDatabase);
    failpoint(options, 'after_snapshot');

    const entries = { [DATABASE_PATH]: new Uint8Array(fs.readFileSync(stagedDatabase)) };
    emitProgress(options, 'collecting_files');
    for (const root of RESTORE_ROOTS.slice(1)) collectDirectory(path.join(userDataDir, root), root, entries);
    if (options.securityMaterial?.fieldKey) {
      const fieldKey = String(options.securityMaterial.fieldKey);
      if (Buffer.from(fieldKey, 'base64').length !== 32) throw new Error('backup_field_key_invalid');
      entries[SECURITY_PATH] = fflate.strToU8(JSON.stringify({ version: 1, fieldKey }));
    }

    const manifest = buildManifest(options, entries, databaseInfo);
    entries[MANIFEST_PATH] = fflate.strToU8(`${JSON.stringify(manifest, null, 2)}\n`);
    emitProgress(options, 'compressing', { files: manifest.files.length });
    const zipBuffer = zipEntries(entries);
    emitProgress(options, 'encrypting');
    const encryptedBuffer = backupCrypto.encryptBuffer(zipBuffer, options.password);
    failpoint(options, 'after_package');

    emitProgress(options, 'verifying');
    const verified = inspectEncryptedBackup(encryptedBuffer, options.password, options);
    if (verified.manifest.backupId !== manifest.backupId || verified.database.quickCheck !== 'ok') {
      throw new Error('backup_post_write_verification_failed');
    }
    return {
      buffer: encryptedBuffer,
      hash: verified.encryptedSha256,
      encryptedSize: encryptedBuffer.length,
      zipSize: zipBuffer.length,
      manifest,
      sourceHealth,
      database: verified.database,
    };
  } finally {
    safeRemove(stageRoot, os.tmpdir());
  }
}

async function createBackupFile(options) {
  if (!options?.outputPath) throw new Error('backup_output_path_required');
  const outputPath = path.resolve(options.outputPath);
  const result = await createBackupBuffer(options);
  failpoint(options, 'disk_full');
  failpoint(options, 'before_commit');
  emitProgress(options, 'committing');
  writeFileAtomicSync(outputPath, result.buffer, { mode: 0o600 });
  const persisted = fs.readFileSync(outputPath);
  const verified = inspectEncryptedBackup(persisted, options.password, options);
  if (verified.encryptedSha256 !== result.hash) throw new Error('backup_persisted_hash_mismatch');
  emitProgress(options, 'complete', { path: outputPath, hash: result.hash });
  return { ok: true, path: outputPath, ...result, buffer: undefined };
}

async function createBackupWithUpload(options) {
  const local = await createBackupFile(options);
  if (typeof options.upload !== 'function') return { ...local, localOk: true, cloudOk: false, cloudSkipped: true };
  emitProgress(options, 'uploading', { path: local.path });
  let upload;
  try {
    upload = await options.upload({
      path: local.path,
      buffer: fs.readFileSync(local.path),
      filename: path.basename(local.path),
      hash: local.hash,
      manifest: local.manifest,
    });
  } catch (error) {
    upload = { ok: false, message: error.message };
  }
  if (!upload?.ok) {
    emitProgress(options, 'upload_failed', { error: upload?.message || 'cloud_upload_failed', localPath: local.path });
    return { ...local, localOk: true, cloudOk: false, uploadError: upload?.message || 'cloud_upload_failed' };
  }
  let pruned = 0;
  if (typeof options.pruneAfterUpload === 'function') {
    pruned = Number(await options.pruneAfterUpload(upload, local)) || 0;
  }
  emitProgress(options, 'upload_complete', { remotePath: upload.remotePath || upload.path, pruned });
  return { ...local, localOk: true, cloudOk: true, upload, pruned };
}

function verifyBackupFile(filePath, password, options = {}) {
  const resolved = path.resolve(filePath);
  const inspected = inspectEncryptedBackup(fs.readFileSync(resolved), password, options);
  return {
    ok: true,
    path: resolved,
    hash: inspected.encryptedSha256,
    size: inspected.encryptedSize,
    manifest: inspected.manifest,
    database: inspected.database,
  };
}

function extractEntriesToStage(inspected, stageRoot) {
  for (const root of RESTORE_ROOTS) fs.mkdirSync(path.join(stageRoot, root), { recursive: true });
  for (const [archivePath, data] of Object.entries(inspected.entries)) {
    if (archivePath === MANIFEST_PATH || archivePath === SECURITY_PATH) continue;
    const root = archivePath.split('/')[0];
    if (!RESTORE_ROOTS.includes(root)) throw new Error('backup_restore_root_invalid');
    const target = path.resolve(stageRoot, archivePath.replace(/\//g, path.sep));
    const resolvedStage = path.resolve(stageRoot);
    if (!target.startsWith(resolvedStage + path.sep)) throw new Error('unsafe_backup_entry');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, data, { mode: 0o600 });
  }
}

function migrateStagedDatabase(databasePath, now = new Date()) {
  let db;
  try {
    db = new Database(databasePath, { fileMustExist: true, timeout: 5000 });
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = DELETE');
    db.pragma('synchronous = FULL');
    const { readSchemaVersion } = require('../database/hybrid-schema');
    const before = readSchemaVersion(db);
    const migrations = runSchemaMigrations(db, now);
    const quickCheck = db.pragma('quick_check', { simple: true });
    const foreignKeyViolations = db.pragma('foreign_key_check');
    if (quickCheck !== 'ok' || foreignKeyViolations.length) throw new Error('restored_sqlite_integrity_failed');
    return { before, after: Math.max(0, ...migrations.map((item) => Number(item.version) || 0)), quickCheck };
  } finally {
    try { db?.close(); } catch { /* best effort */ }
  }
}

function buildEmergencyPath(userDataDir, now = new Date()) {
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  return path.join(userDataDir, 'Backups', 'Emergency', `Tadawi-Emergency-${stamp}.tdw`);
}

function rollbackSwaps(userDataDir, rollbackRoot, swapped) {
  for (const root of [...swapped].reverse()) {
    const live = path.join(userDataDir, root);
    const previous = path.join(rollbackRoot, root);
    if (fs.existsSync(live)) safeRemove(live, userDataDir);
    if (fs.existsSync(previous)) fs.renameSync(previous, live);
  }
}

async function restoreBackupFile(options) {
  if (!options?.userDataDir || !options?.filePath) throw new Error('restore_request_invalid');
  if (!options.password || String(options.password).length < 8) throw new Error('password_too_short');
  const userDataDir = path.resolve(options.userDataDir);
  const filePath = path.resolve(options.filePath);
  emitProgress(options, 'reading_manifest');
  const inspected = inspectEncryptedBackup(fs.readFileSync(filePath), options.password, options);
  if (options.requireSecurityMaterial && !inspected.securityMaterial?.fieldKey) {
    throw new Error('backup_field_key_missing');
  }
  failpoint(options, 'after_verify');

  const stageRoot = fs.mkdtempSync(path.join(userDataDir, '.restore-v2-stage-'));
  const rollbackRoot = path.join(userDataDir, `.restore-v2-rollback-${Date.now()}-${process.pid}`);
  const swapped = [];
  let databaseClosed = false;
  let securityChanged = false;
  let emergency = null;
  try {
    emitProgress(options, 'staging_restore');
    extractEntriesToStage(inspected, stageRoot);
    databaseHealth(path.join(stageRoot, DATABASE_PATH.replace(/\//g, path.sep)));
    const migration = migrateStagedDatabase(path.join(stageRoot, DATABASE_PATH.replace(/\//g, path.sep)), options.now || new Date());
    failpoint(options, 'after_staging');

    emitProgress(options, 'creating_emergency_backup');
    const liveDatabasePath = path.join(userDataDir, DATABASE_PATH.replace(/\//g, path.sep));
    if (fs.existsSync(liveDatabasePath) && options.skipEmergencyBackup !== true) {
      const emergencyPath = path.resolve(options.emergencyOutputPath || buildEmergencyPath(userDataDir, options.now || new Date()));
      emergency = await createBackupFile({
        ...options,
        failpoint: undefined,
        outputPath: emergencyPath,
        backupType: 'emergency-before-restore',
        securityMaterial: options.currentSecurityMaterial,
        onProgress: undefined,
      });
    } else {
      emergency = { path: null, skipped: true, reason: 'no_live_database' };
    }
    failpoint(options, 'after_emergency');

    emitProgress(options, 'closing_database');
    await options.closeDatabase?.();
    databaseClosed = true;
    failpoint(options, 'after_close');

    if (inspected.securityMaterial && options.applySecurityMaterial) {
      await options.applySecurityMaterial(inspected.securityMaterial);
      securityChanged = true;
    }

    fs.mkdirSync(rollbackRoot, { recursive: false });
    emitProgress(options, 'swapping_data');
    for (const root of RESTORE_ROOTS) {
      const live = path.join(userDataDir, root);
      const staged = path.join(stageRoot, root);
      const previous = path.join(rollbackRoot, root);
      if (fs.existsSync(live)) fs.renameSync(live, previous);
      fs.renameSync(staged, live);
      swapped.push(root);
      if (swapped.length === 1) failpoint(options, 'after_first_swap');
    }
    failpoint(options, 'after_swap');
    const finalHealth = databaseHealth(path.join(userDataDir, DATABASE_PATH.replace(/\//g, path.sep)));
    emitProgress(options, 'restore_complete', { emergencyPath: emergency.path, rollbackPath: rollbackRoot });
    return {
      ok: true,
      needRestart: true,
      manifest: inspected.manifest,
      migration,
      database: finalHealth,
      emergencyPath: emergency.path,
      rollbackPath: rollbackRoot,
    };
  } catch (error) {
    let rollbackError = null;
    try { if (swapped.length) rollbackSwaps(userDataDir, rollbackRoot, swapped); } catch (caught) { rollbackError = caught; }
    try {
      if (securityChanged && options.rollbackSecurityMaterial) await options.rollbackSecurityMaterial(options.currentSecurityMaterial || null);
    } catch (caught) { rollbackError ||= caught; }
    try { if (databaseClosed) await options.reopenDatabase?.(); } catch (caught) { rollbackError ||= caught; }
    if (rollbackError) error.rollbackError = rollbackError.message;
    emitProgress(options, 'restore_failed', { error: error.message, rolledBack: !rollbackError });
    throw error;
  } finally {
    try { if (fs.existsSync(stageRoot)) safeRemove(stageRoot, userDataDir); } catch { /* preserve primary result */ }
  }
}

function friendlyBackupError(error) {
  const code = error?.code === 'ENOSPC' ? 'backup_disk_space_insufficient' : String(error?.message || 'backup_unknown_error');
  const messages = {
    backup_database_not_found: 'قاعدة البيانات غير موجودة ولا يمكن إنشاء النسخة.',
    backup_database_integrity_failed: 'فشل فحص سلامة قاعدة البيانات الحالية.',
    backup_authentication_failed: 'كلمة مرور النسخة غير صحيحة أو الملف تالف.',
    backup_manifest_missing: 'ملف بيان النسخة الاحتياطية غير موجود.',
    backup_manifest_invalid: 'بيان النسخة الاحتياطية غير صالح.',
    backup_version_unsupported: 'إصدار النسخة الاحتياطية غير مدعوم.',
    backup_schema_newer_than_application: 'النسخة أُنشئت بإصدار قاعدة بيانات أحدث من البرنامج.',
    backup_file_hash_mismatch: 'فشل التحقق من بصمة أحد ملفات النسخة.',
    backup_field_key_missing: 'هذه النسخة لا تحتوي مفتاح حماية البيانات المطلوب لاستعادة قاعدة البيانات المشفرة.',
    backup_disk_space_insufficient: 'لا توجد مساحة قرص كافية لإكمال العملية.',
    restored_sqlite_integrity_failed: 'قاعدة البيانات المستعادة لم تجتز فحص السلامة.',
    password_too_short: 'كلمة مرور النسخة يجب ألا تقل عن 8 أحرف.',
  };
  return { code, message: messages[code] || `تعذّر إكمال عملية النسخ أو الاستعادة (${code}).` };
}

module.exports = {
  BACKUP_VERSION,
  BACKUP_FORMAT,
  MANIFEST_PATH,
  DATABASE_PATH,
  SECURITY_PATH,
  RESTORE_ROOTS,
  CURRENT_SCHEMA_VERSION,
  sanitizeSettingsValue,
  databaseHealth,
  createConsistentDatabaseSnapshot,
  createBackupBuffer,
  createBackupFile,
  createBackupWithUpload,
  inspectEncryptedBackup,
  verifyBackupFile,
  restoreBackupFile,
  friendlyBackupError,
  buildEmergencyPath,
  buildManifest,
};
