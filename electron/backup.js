/**
 * Electron backup facade — delegates to Cloud Backup Provider layer.
 */
const fs = require('fs');
const path = require('path');
const { app, dialog } = require('electron');
const cloud = require('./cloud-providers/cloud-service');

const branding = require('../branding.config.json');
const BACKUP_FOLDER = branding.product?.name || 'Hijama Management System';

function resolveLocalBackupDir(localPathHint) {
  if (!localPathHint || localPathHint === 'custom') {
    return path.join(app.getPath('documents'), BACKUP_FOLDER, 'Backups');
  }
  const hint = String(localPathHint).trim();
  if (hint.startsWith('Documents/') || hint.startsWith('Documents\\')) {
    const rest = hint.replace(/^Documents[/\\]/, '');
    return path.join(app.getPath('documents'), rest);
  }
  if (/^[A-Za-z]:[\\/]/.test(hint) || hint.startsWith('/')) return hint;
  return path.join(app.getPath('documents'), hint);
}

async function saveLocal(payload, filename, localPathHint) {
  try {
    const dir = resolveLocalBackupDir(localPathHint);
    fs.mkdirSync(dir, { recursive: true });
    const safeName = (filename || `backup-${Date.now()}.json`).replace(/[<>:"|?*]/g, '_');
    const target = path.join(dir, safeName);
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
    fs.writeFileSync(target, data, 'utf8');
    return { ok: true, path: target };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function connectGoogle(email, provider) {
  if (email && String(email).includes('@')) {
    return cloud.registerCloudAccount(email, provider || 'google');
  }
  return cloud.connectProvider(provider || 'google');
}

async function registerCloudAccount(email, provider) {
  return cloud.registerCloudAccount(email, provider || 'google');
}

async function uploadCloud(payload, filename, provider, meta) {
  return cloud.uploadCloud(payload, filename, provider || 'google', meta);
}

async function uploadSyncFile(payload, filename, provider, folder) {
  return cloud.uploadSyncFile(payload, filename, provider || 'google', folder);
}

async function downloadSyncFile(filename, provider, folder) {
  return cloud.downloadSyncFile(filename, provider || 'google', folder);
}

async function disconnectCloud(provider) {
  return cloud.disconnectProvider(provider || 'google');
}

async function listCloudBackups(provider, prefix) {
  return cloud.listCloudBackups(provider || 'google', prefix);
}

async function downloadCloudBackup(remotePath, provider) {
  return cloud.downloadCloudBackup(remotePath, provider || 'google');
}

async function deleteCloudBackup(remotePath, provider) {
  return cloud.deleteCloudBackup(remotePath, provider || 'google');
}

async function verifyCloudBackup(remotePath, expectedHash, provider) {
  return cloud.verifyCloudBackup(remotePath, expectedHash, provider || 'google');
}

async function startOAuth(provider, opts) {
  return cloud.connectProvider(provider || 'google', opts);
}

async function getCloudStatus(provider) {
  return cloud.getProviderStatus(provider || 'google');
}

async function listCloudProviders() {
  return cloud.listProviders();
}

async function pickLocalFolder() {
  const { connectProvider } = require('./cloud-providers/cloud-service');
  return connectProvider('local-folder');
}

const cloudDbBackup = require('./cloud-db-backup');

async function uploadDbBackup(password, meta) {
  return cloudDbBackup.uploadDbBackup(password, meta);
}

async function listDbBackups(meta) {
  return cloudDbBackup.listDbBackups(meta);
}

async function restoreDbBackup(remotePath, password) {
  return cloudDbBackup.restoreDbBackup(remotePath, password);
}

async function syncDbBackup(password, meta) {
  return cloudDbBackup.syncDbBackup(password, meta);
}

async function verifyDbBackup(remotePath, expectedHash) {
  return cloudDbBackup.verifyDbBackup(remotePath, expectedHash);
}

async function createDbBackupPackage(password, meta) {
  return cloudDbBackup.createEncryptedBackupPackage(password, meta);
}

module.exports = {
  saveLocal,
  connectGoogle,
  registerCloudAccount,
  uploadCloud,
  uploadSyncFile,
  downloadSyncFile,
  disconnectCloud,
  listCloudBackups,
  downloadCloudBackup,
  deleteCloudBackup,
  verifyCloudBackup,
  startOAuth,
  getCloudStatus,
  listCloudProviders,
  pickLocalFolder,
  resolveLocalBackupDir,
  cloudVaultRoot: () => path.join(app.getPath('userData'), 'CloudVault'),
  uploadDbBackup,
  listDbBackups,
  restoreDbBackup,
  syncDbBackup,
  verifyDbBackup,
  createDbBackupPackage
};
