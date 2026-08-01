const { contextBridge, ipcRenderer } = require('electron');

const cuppingApi = {
  app: {
    getRuntimeInfo: () => ipcRenderer.invoke('app:getRuntimeInfo'),
    consumeLicenseWipeFlag: () => ipcRenderer.invoke('app:consumeLicenseWipeFlag'),
    wipePersistentLicenseData: () => ipcRenderer.invoke('app:wipePersistentLicenseData'),
    writeUninstallCenterMeta: (payload) => ipcRenderer.invoke('app:writeUninstallCenterMeta', payload),
    signalUninstallWipeComplete: () => ipcRenderer.send('uninstall:wipeComplete'),
  },
  cloudOAuth: {
    getSettings: () => ipcRenderer.invoke('cloudOAuth:getSettings'),
    saveSettings: (payload) => ipcRenderer.invoke('cloudOAuth:saveSettings', payload),
    restoreDefaults: () => ipcRenderer.invoke('cloudOAuth:restoreDefaults'),
    testConnection: () => ipcRenderer.invoke('cloudOAuth:testConnection'),
  },
  backup: {
    saveLocal: (payload, filename, localPath) =>
      ipcRenderer.invoke('backup:saveLocal', payload, filename, localPath),
    uploadCloud: (payload, filename, provider, meta) =>
      ipcRenderer.invoke('backup:uploadCloud', payload, filename, provider, meta),
    uploadSyncFile: (payload, filename, provider, folder) =>
      ipcRenderer.invoke('backup:uploadSyncFile', payload, filename, provider, folder),
    downloadSyncFile: (filename, provider, folder) =>
      ipcRenderer.invoke('backup:downloadSyncFile', filename, provider, folder),
    connectGoogle: (email, provider) => ipcRenderer.invoke('backup:connectGoogle', email, provider),
    registerCloudAccount: (email, provider) => ipcRenderer.invoke('backup:registerCloudAccount', email, provider),
    disconnectCloud: (provider) => ipcRenderer.invoke('backup:disconnectCloud', provider),
    listCloudBackups: (provider, prefix) => ipcRenderer.invoke('backup:listCloudBackups', provider, prefix),
    downloadCloudBackup: (remotePath, provider) => ipcRenderer.invoke('backup:downloadCloudBackup', remotePath, provider),
    deleteCloudBackup: (remotePath, provider) => ipcRenderer.invoke('backup:deleteCloudBackup', remotePath, provider),
    verifyCloudBackup: (remotePath, expectedHash, provider) =>
      ipcRenderer.invoke('backup:verifyCloudBackup', remotePath, expectedHash, provider),
    startOAuth: (provider, opts) => ipcRenderer.invoke('backup:startOAuth', provider, opts),
    getCloudStatus: (provider) => ipcRenderer.invoke('backup:getCloudStatus', provider),
    listCloudProviders: () => ipcRenderer.invoke('backup:listCloudProviders'),
    pickLocalFolder: () => ipcRenderer.invoke('backup:pickLocalFolder'),
    uploadDbBackup: (password, meta) => ipcRenderer.invoke('backup:uploadDbBackup', password, meta),
    listDbBackups: (meta) => ipcRenderer.invoke('backup:listDbBackups', meta),
    restoreDbBackup: (remotePath, password, relaunch) =>
      ipcRenderer.invoke('backup:restoreDbBackup', remotePath, password, relaunch),
    syncDbBackup: (password, meta) => ipcRenderer.invoke('backup:syncDbBackup', password, meta),
    verifyDbBackup: (remotePath, expectedHash) =>
      ipcRenderer.invoke('backup:verifyDbBackup', remotePath, expectedHash),
  },
  cache: {
    writeBranchConfig: (centerId, branchId, pack) =>
      ipcRenderer.invoke('cache:writeBranchConfig', centerId, branchId, pack),
    readBranchConfig: (centerId, branchId) =>
      ipcRenderer.invoke('cache:readBranchConfig', centerId, branchId),
    writeLicense: (centerId, doc) =>
      ipcRenderer.invoke('cache:writeLicense', centerId, doc),
    readLicense: (centerId) =>
      ipcRenderer.invoke('cache:readLicense', centerId),
    writeVersions: (centerId, versions) =>
      ipcRenderer.invoke('cache:writeVersions', centerId, versions),
    readVersions: (centerId) =>
      ipcRenderer.invoke('cache:readVersions', centerId),
    getStatus: (centerId) =>
      ipcRenderer.invoke('cache:getStatus', centerId),
  },
  devices: {
    listPrinters: () => ipcRenderer.invoke('devices:listPrinters'),
    printThermal: (html, opts) => ipcRenderer.invoke('devices:printThermal', html, opts),
    printA4: (html, opts) => ipcRenderer.invoke('devices:printA4', html, opts),
    exportA4Pdf: (html, opts) => ipcRenderer.invoke('devices:exportA4Pdf', html, opts),
    printWithDialog: (html, opts) => ipcRenderer.invoke('devices:printWithDialog', html, opts),
    openCashDrawer: (opts) => ipcRenderer.invoke('devices:openCashDrawer', opts),
    openCashDrawerDirect: (opts) => ipcRenderer.invoke('devices:openCashDrawerDirect', opts),
    getStatus: (saved) => ipcRenderer.invoke('devices:getStatus', saved),
    writeRaw: (printerName, buffer) =>
      ipcRenderer.invoke('devices:writeRaw', printerName, buffer),
  },
  messaging: {
    sendWhatsApp: (phone, text, config, meta) =>
      ipcRenderer.invoke('messaging:sendWhatsApp', phone, text, config, meta),
    sendSMS: (phone, text, config, meta) =>
      ipcRenderer.invoke('messaging:sendSMS', phone, text, config, meta),
    getStatus: (config) => ipcRenderer.invoke('messaging:getStatus', config),
  },
  communication: {
    listProviders: () => ipcRenderer.invoke('communication:listProviders'),
    testProvider: (provider) => ipcRenderer.invoke('communication:testProvider', provider),
    send: (config, payload) => ipcRenderer.invoke('communication:send', config, payload),
    getStatus: (config) => ipcRenderer.invoke('communication:getStatus', config),
    processQueue: (config) => ipcRenderer.invoke('communication:processQueue', config),
    getQueue: () => ipcRenderer.invoke('communication:getQueue'),
    clearQueue: (status) => ipcRenderer.invoke('communication:clearQueue', status),
    init: (config) => ipcRenderer.invoke('communication:init', config),
    onWebhook: (cb) => {
      ipcRenderer.removeAllListeners('communication:webhook');
      ipcRenderer.on('communication:webhook', (_e, data) => cb(data));
    },
    onQueueUpdate: (cb) => {
      ipcRenderer.removeAllListeners('communication:queueUpdate');
      ipcRenderer.on('communication:queueUpdate', (_e, data) => cb(data));
    },
  },
  license: {
    writeLicenseShard: (licenseId, record) => ipcRenderer.invoke('license:writeLicenseShard', licenseId, record),
    writeActivationBundle: (licenseId, bundle) => ipcRenderer.invoke('license:writeActivationBundle', licenseId, bundle),
    readActivationBundle: (licenseId) => ipcRenderer.invoke('license:readActivationBundle', licenseId),
    writeCustomPackage: (cp) => ipcRenderer.invoke('license:writeCustomPackage', cp),
    updateLicenseIndex: (index) => ipcRenderer.invoke('license:updateLicenseIndex', index),
    appendPackageToRegistry: (pkgDef) => ipcRenderer.invoke('license:appendPackageToRegistry', pkgDef),
  },
};

contextBridge.exposeInMainWorld('cuppingElectron', cuppingApi);
// Primary Electron bridge — cuppingElectron only (legacy tadawiElectron alias removed).

contextBridge.exposeInMainWorld('cashDrawer', {
  open: (opts) => ipcRenderer.invoke('devices:openCashDrawer', opts || {}),
});
