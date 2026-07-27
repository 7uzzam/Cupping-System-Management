const { contextBridge, ipcRenderer } = require('electron');

/**
 * Explicit channel allowlist — no generic invoke(channel) API.
 * Keep in sync with electron/main.js handlers.
 */
const ALLOWED_INVOKE = new Set([
  'app:getRuntimeInfo',
  'app:consumeLicenseWipeFlag',
  'app:wipePersistentLicenseData',
  'app:writeUninstallCenterMeta',
  'app:openExternal',
  'cloudOAuth:getSettings',
  'cloudOAuth:saveSettings',
  'cloudOAuth:restoreDefaults',
  'cloudOAuth:testConnection',
  'backup:saveLocal',
  'backup:uploadCloud',
  'backup:uploadSyncFile',
  'backup:downloadSyncFile',
  'backup:connectGoogle',
  'backup:registerCloudAccount',
  'backup:disconnectCloud',
  'backup:listCloudBackups',
  'backup:downloadCloudBackup',
  'backup:deleteCloudBackup',
  'backup:verifyCloudBackup',
  'backup:startOAuth',
  'backup:getCloudStatus',
  'backup:listCloudProviders',
  'backup:pickLocalFolder',
  'backup:uploadDbBackup',
  'backup:listDbBackups',
  'backup:restoreDbBackup',
  'backup:syncDbBackup',
  'backup:verifyDbBackup',
  'cache:writeBranchConfig',
  'cache:readBranchConfig',
  'cache:writeLicense',
  'cache:readLicense',
  'cache:writeVersions',
  'cache:readVersions',
  'cache:getStatus',
  'devices:listPrinters',
  'devices:printThermal',
  'devices:printA4',
  'devices:exportA4Pdf',
  'devices:printWithDialog',
  'devices:openCashDrawer',
  'devices:openCashDrawerDirect',
  'devices:getStatus',
  'devices:writeRaw',
  'messaging:sendWhatsApp',
  'messaging:sendSMS',
  'messaging:getStatus',
  'communication:listProviders',
  'communication:testProvider',
  'communication:send',
  'communication:getStatus',
  'communication:processQueue',
  'communication:getQueue',
  'communication:clearQueue',
  'communication:init',
  'license:writeLicenseShard',
  'license:writeActivationBundle',
  'license:readActivationBundle',
  'license:writeCustomPackage',
  'license:updateLicenseIndex',
  'license:appendPackageToRegistry',
]);

const ALLOWED_SEND = new Set(['uninstall:wipeComplete']);
const ALLOWED_ON = new Set(['communication:webhook', 'communication:queueUpdate']);

function invoke(channel, ...args) {
  if (!ALLOWED_INVOKE.has(channel)) {
    return Promise.reject(new Error('ipc_channel_denied:' + channel));
  }
  return ipcRenderer.invoke(channel, ...args);
}

function send(channel, ...args) {
  if (!ALLOWED_SEND.has(channel)) {
    throw new Error('ipc_channel_denied:' + channel);
  }
  ipcRenderer.send(channel, ...args);
}

function on(channel, cb) {
  if (!ALLOWED_ON.has(channel)) {
    throw new Error('ipc_channel_denied:' + channel);
  }
  ipcRenderer.removeAllListeners(channel);
  ipcRenderer.on(channel, (_e, data) => cb(data));
}

const cuppingApi = {
  app: {
    getRuntimeInfo: () => invoke('app:getRuntimeInfo'),
    consumeLicenseWipeFlag: () => invoke('app:consumeLicenseWipeFlag'),
    wipePersistentLicenseData: () => invoke('app:wipePersistentLicenseData'),
    writeUninstallCenterMeta: (payload) => invoke('app:writeUninstallCenterMeta', payload),
    signalUninstallWipeComplete: () => send('uninstall:wipeComplete'),
    openExternal: (url) => invoke('app:openExternal', url),
  },
  cloudOAuth: {
    getSettings: () => invoke('cloudOAuth:getSettings'),
    saveSettings: (payload) => invoke('cloudOAuth:saveSettings', payload),
    restoreDefaults: () => invoke('cloudOAuth:restoreDefaults'),
    testConnection: () => invoke('cloudOAuth:testConnection'),
  },
  backup: {
    saveLocal: (payload, filename, localPath) =>
      invoke('backup:saveLocal', payload, filename, localPath),
    create: (payload, filename, localPath) =>
      invoke('backup:saveLocal', payload, filename, localPath),
    uploadCloud: (payload, filename, provider, meta) =>
      invoke('backup:uploadCloud', payload, filename, provider, meta),
    uploadSyncFile: (payload, filename, provider, folder) =>
      invoke('backup:uploadSyncFile', payload, filename, provider, folder),
    downloadSyncFile: (filename, provider, folder) =>
      invoke('backup:downloadSyncFile', filename, provider, folder),
    connectGoogle: (email, provider) => invoke('backup:connectGoogle', email, provider),
    registerCloudAccount: (email, provider) => invoke('backup:registerCloudAccount', email, provider),
    disconnectCloud: (provider) => invoke('backup:disconnectCloud', provider),
    listCloudBackups: (provider, prefix) => invoke('backup:listCloudBackups', provider, prefix),
    downloadCloudBackup: (remotePath, provider) => invoke('backup:downloadCloudBackup', remotePath, provider),
    deleteCloudBackup: (remotePath, provider) => invoke('backup:deleteCloudBackup', remotePath, provider),
    verifyCloudBackup: (remotePath, expectedHash, provider) =>
      invoke('backup:verifyCloudBackup', remotePath, expectedHash, provider),
    startOAuth: (provider, opts) => invoke('backup:startOAuth', provider, opts),
    getCloudStatus: (provider) => invoke('backup:getCloudStatus', provider),
    listCloudProviders: () => invoke('backup:listCloudProviders'),
    pickLocalFolder: () => invoke('backup:pickLocalFolder'),
    uploadDbBackup: (password, meta) => invoke('backup:uploadDbBackup', password, meta),
    listDbBackups: (meta) => invoke('backup:listDbBackups', meta),
    restoreDbBackup: (remotePath, password, relaunch) =>
      invoke('backup:restoreDbBackup', remotePath, password, relaunch),
    restore: (remotePath, password, relaunch) =>
      invoke('backup:restoreDbBackup', remotePath, password, relaunch),
    syncDbBackup: (password, meta) => invoke('backup:syncDbBackup', password, meta),
    verifyDbBackup: (remotePath, expectedHash) =>
      invoke('backup:verifyDbBackup', remotePath, expectedHash),
  },
  cache: {
    writeBranchConfig: (centerId, branchId, pack) =>
      invoke('cache:writeBranchConfig', centerId, branchId, pack),
    readBranchConfig: (centerId, branchId) =>
      invoke('cache:readBranchConfig', centerId, branchId),
    writeLicense: (centerId, doc) =>
      invoke('cache:writeLicense', centerId, doc),
    readLicense: (centerId) =>
      invoke('cache:readLicense', centerId),
    writeVersions: (centerId, versions) =>
      invoke('cache:writeVersions', centerId, versions),
    readVersions: (centerId) =>
      invoke('cache:readVersions', centerId),
    getStatus: (centerId) =>
      invoke('cache:getStatus', centerId),
  },
  devices: {
    listPrinters: () => invoke('devices:listPrinters'),
    printThermal: (html, opts) => invoke('devices:printThermal', html, opts),
    printA4: (html, opts) => invoke('devices:printA4', html, opts),
    exportA4Pdf: (html, opts) => invoke('devices:exportA4Pdf', html, opts),
    printWithDialog: (html, opts) => invoke('devices:printWithDialog', html, opts),
    openCashDrawer: (opts) => invoke('devices:openCashDrawer', opts),
    openCashDrawerDirect: (opts) => invoke('devices:openCashDrawerDirect', opts),
    getStatus: (saved) => invoke('devices:getStatus', saved),
    writeRaw: (printerName, buffer) =>
      invoke('devices:writeRaw', printerName, buffer),
  },
  print: {
    receipt: (html, opts) => invoke('devices:printThermal', html, opts),
    a4: (html, opts) => invoke('devices:printA4', html, opts),
    pdf: (html, opts) => invoke('devices:exportA4Pdf', html, opts),
  },
  messaging: {
    sendWhatsApp: (phone, text, config, meta) =>
      invoke('messaging:sendWhatsApp', phone, text, config, meta),
    sendSMS: (phone, text, config, meta) =>
      invoke('messaging:sendSMS', phone, text, config, meta),
    getStatus: (config) => invoke('messaging:getStatus', config),
  },
  communication: {
    listProviders: () => invoke('communication:listProviders'),
    testProvider: (provider) => invoke('communication:testProvider', provider),
    send: (config, payload) => invoke('communication:send', config, payload),
    getStatus: (config) => invoke('communication:getStatus', config),
    processQueue: (config) => invoke('communication:processQueue', config),
    getQueue: () => invoke('communication:getQueue'),
    clearQueue: (status) => invoke('communication:clearQueue', status),
    init: (config) => invoke('communication:init', config),
    onWebhook: (cb) => on('communication:webhook', cb),
    onQueueUpdate: (cb) => on('communication:queueUpdate', cb),
  },
  license: {
    writeLicenseShard: (licenseId, record) => invoke('license:writeLicenseShard', licenseId, record),
    writeActivationBundle: (licenseId, bundle) => invoke('license:writeActivationBundle', licenseId, bundle),
    readActivationBundle: (licenseId) => invoke('license:readActivationBundle', licenseId),
    writeCustomPackage: (cp) => invoke('license:writeCustomPackage', cp),
    updateLicenseIndex: (index) => invoke('license:updateLicenseIndex', index),
    appendPackageToRegistry: (pkgDef) => invoke('license:appendPackageToRegistry', pkgDef),
    activate: (licenseId, bundle) => invoke('license:writeActivationBundle', licenseId, bundle),
  },
  database: {
    /** Placeholder safe surface for Phase 4 — no arbitrary SQL from renderer. */
    querySafe: () => Promise.reject(new Error('database_not_available_until_phase_4')),
  },
};

contextBridge.exposeInMainWorld('cuppingElectron', cuppingApi);
// Stable alias matching roadmap naming (same typed surface, no generic invoke).
contextBridge.exposeInMainWorld('tadawi', cuppingApi);

contextBridge.exposeInMainWorld('cashDrawer', {
  open: (opts) => invoke('devices:openCashDrawer', opts || {}),
});
