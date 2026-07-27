const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const uninstallPrep = require('./uninstall-prep');

/** Fixed userData path — preserves data across rebranding and reinstalls */
const USER_DATA_FOLDER = 'Cupping Center';

const IS_UNINSTALL_PREP = process.argv.includes('--uninstall-prep');
const IS_UNINSTALL_FULL = process.argv.includes('--uninstall-full');
const WIPE_ONLY_IDX = process.argv.indexOf('--uninstall-wipe-only');
const IS_UNINSTALL_WIPE_ONLY = WIPE_ONLY_IDX >= 0;
if (IS_UNINSTALL_WIPE_ONLY) {
  const wipeTarget = process.argv[WIPE_ONLY_IDX + 1];
  if (wipeTarget) app.commandLine.appendSwitch('user-data-dir', wipeTarget);
}
if (IS_UNINSTALL_PREP || IS_UNINSTALL_WIPE_ONLY) {
  app.commandLine.appendSwitch('disable-gpu');
}
const pkg = require('../package.json');
const branding = require('../branding.config.json');
const APP_VERSION = pkg.version || '2.0.0';
const APP_PUBLISHER = branding.company?.name || 'NajjarTech';
const APP_PRODUCT_NAME = branding.product?.name || pkg.build?.productName || 'Hijama Management System';

if (app.isPackaged) {
  app.setPath('userData', path.join(app.getPath('appData'), USER_DATA_FOLDER));
}

app.setName(APP_PRODUCT_NAME);

if (process.platform === 'win32') {
  app.setAppUserModelId('com.tadawi.cuppingcenter');
}

app.setAboutPanelOptions({
  applicationName: APP_PRODUCT_NAME,
  applicationVersion: APP_VERSION,
  version: APP_VERSION,
  copyright: branding.company?.copyright || `Copyright © ${new Date().getFullYear()} ${APP_PUBLISHER}. All rights reserved.`,
  credits: `Developed by ${APP_PUBLISHER}\n${branding.company?.tagline || ''}\n${branding.product?.description || ''}\n\nSupport: ${branding.company?.supportEmail || ''}`,
  website: branding.company?.website || 'https://najjartech.com',
});
const {
  saveLocal: backupSaveLocal,
  connectGoogle: backupConnectGoogle,
  registerCloudAccount: backupRegisterCloudAccount,
  uploadCloud: backupUploadCloud,
  uploadSyncFile: backupUploadSyncFile,
  downloadSyncFile: backupDownloadSyncFile,
  disconnectCloud: backupDisconnectCloud,
  listCloudBackups: backupListCloudBackups,
  downloadCloudBackup: backupDownloadCloudBackup,
  deleteCloudBackup: backupDeleteCloudBackup,
  verifyCloudBackup: backupVerifyCloudBackup,
  startOAuth: backupStartOAuth,
  getCloudStatus: backupGetCloudStatus,
  listCloudProviders: backupListCloudProviders,
  pickLocalFolder: backupPickLocalFolder,
  uploadDbBackup: backupUploadDbBackup,
  listDbBackups: backupListDbBackups,
  restoreDbBackup: backupRestoreDbBackup,
  syncDbBackup: backupSyncDbBackup,
  verifyDbBackup: backupVerifyDbBackup,
} = require('./backup');
const { createDeviceCache } = require('./device-cache');

function getDeviceCache() {
  return createDeviceCache(app.getPath('userData'));
}
const {
  listPrinters,
  openCashDrawer,
  openCashDrawerDirect,
  printThermal,
  printA4,
  printWithDialog,
  exportA4Pdf,
  getDeviceStatus,
  writeRaw,
} = require('./devices');
const { sendWhatsApp, sendSMS, getMessagingStatus, gateway } = require('./messaging');

let mainWindow = null;
const IS_PROD = app.isPackaged;

async function runUninstallWipeOnlyWindow() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      try { win?.destroy(); } catch { /* ignore */ }
      reject(new Error('uninstall_wipe_timeout'));
    }, 90_000);

    const finish = (code) => {
      clearTimeout(timeout);
      try { win?.destroy(); } catch { /* ignore */ }
      resolve(code);
    };

    ipcMain.once('uninstall:wipeComplete', () => finish(0));

    const win = new BrowserWindow({
      show: false,
      width: 400,
      height: 300,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });

    win.webContents.on('did-fail-load', () => finish(1));
    win.loadFile(path.join(__dirname, '..', 'index.html'), {
      query: { uninstallLicenseWipe: '1' },
    }).catch(() => finish(1));
  });
}

function hardenWindowForProduction(win) {
  if (!IS_PROD || !win?.webContents) return;

  win.setMenuBarVisibility(false);
  win.setAutoHideMenuBar(true);

  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    const key = String(input.key || '').toLowerCase();
    const ctrl = !!(input.control || input.meta);
    const shift = !!input.shift;
    const blocked =
      key === 'f12' ||
      (ctrl && shift && (key === 'i' || key === 'j' || key === 'c')) ||
      (ctrl && key === 'u');
    if (blocked) event.preventDefault();
  });

  win.webContents.on('devtools-opened', () => {
    win.webContents.closeDevTools();
  });

  win.webContents.on('context-menu', (event) => {
    event.preventDefault();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: `${APP_PRODUCT_NAME} — ${APP_PUBLISHER}`,
    autoHideMenuBar: IS_PROD,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      devTools: !IS_PROD,
    },
  });

  if (IS_PROD) {
    Menu.setApplicationMenu(null);
    mainWindow.setMenuBarVisibility(false);
    mainWindow.setAutoHideMenuBar(true);
    hardenWindowForProduction(mainWindow);
  }

  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  mainWindow.webContents.setWindowOpenHandler(({ features }) => {
    let width = 920;
    let height = 800;
    const wMatch = /width=(\d+)/i.exec(features || '');
    const hMatch = /height=(\d+)/i.exec(features || '');
    if (wMatch) width = parseInt(wMatch[1], 10) || width;
    if (hMatch) height = parseInt(hMatch[1], 10) || height;
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        show: true,
        width,
        height,
        autoHideMenuBar: IS_PROD,
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: false,
          devTools: !IS_PROD,
        },
      },
    };
  });

  mainWindow.webContents.on('did-create-window', (childWin) => {
    if (IS_PROD) hardenWindowForProduction(childWin);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    gateway.initGateway({}, mainWindow).catch(() => {});
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  if (IS_UNINSTALL_WIPE_ONLY) {
    try {
      await runUninstallWipeOnlyWindow();
      app.exit(0);
    } catch {
      app.exit(1);
    }
    return;
  }
  if (IS_UNINSTALL_PREP) {
    try {
      const result = await uninstallPrep.runUninstallPrep({
        userDataRoot: app.getPath('userData'),
        execPath: process.execPath,
        fullRemoval: IS_UNINSTALL_FULL,
      });
      app.exit(result.ok ? 0 : 1);
    } catch {
      app.exit(1);
    }
    return;
  }

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('devices:listPrinters', () => listPrinters());
ipcMain.handle('devices:printThermal', (_e, html, opts) => printThermal(html, opts || {}));
ipcMain.handle('devices:printA4', (_e, html, opts) => printA4(html, opts || {}));
ipcMain.handle('devices:exportA4Pdf', (_e, html, opts) => exportA4Pdf(html, opts || {}));
ipcMain.handle('devices:printWithDialog', (_e, html, opts) => printWithDialog(html, opts || {}));
ipcMain.handle('devices:openCashDrawer', (_e, opts) => openCashDrawer(opts || {}));
ipcMain.handle('devices:openCashDrawerDirect', (_e, opts) => openCashDrawerDirect(opts || {}));
ipcMain.handle('devices:getStatus', (_e, saved) => getDeviceStatus(saved || {}));
ipcMain.handle('devices:writeRaw', (_e, printerName, buffer) => writeRaw(printerName, buffer));

ipcMain.handle('messaging:sendWhatsApp', (_e, phone, text, config, meta) =>
  sendWhatsApp(phone, text, config, meta));
ipcMain.handle('messaging:sendSMS', (_e, phone, text, config, meta) =>
  sendSMS(phone, text, config, meta));
ipcMain.handle('messaging:getStatus', (_e, config) => getMessagingStatus(config));

ipcMain.handle('communication:listProviders', () => gateway.listBuiltinProviders());
ipcMain.handle('communication:testProvider', (_e, provider) => gateway.testProvider(provider));
ipcMain.handle('communication:send', (_e, config, payload) => gateway.sendMessage(config, payload));
ipcMain.handle('communication:getStatus', (_e, config) => gateway.getGatewayStatus(config));
ipcMain.handle('communication:processQueue', (_e, config) => gateway.processQueueNow(config));
ipcMain.handle('communication:getQueue', () => gateway.getQueueItems(80));
ipcMain.handle('communication:clearQueue', (_e, status) => gateway.clearQueue(status));
ipcMain.handle('communication:init', (_e, config) => {
  if (mainWindow) return gateway.initGateway(config || {}, mainWindow);
  return { ok: false };
});

ipcMain.handle('backup:saveLocal', async (_e, payload, filename, localPath) => backupSaveLocal(payload, filename, localPath));

ipcMain.handle('backup:connectGoogle', async (_e, email, provider) => backupConnectGoogle(email, provider));

ipcMain.handle('backup:registerCloudAccount', async (_e, email, provider) => backupRegisterCloudAccount(email, provider));

ipcMain.handle('backup:uploadCloud', async (_e, payload, filename, provider, meta) =>
  backupUploadCloud(payload, filename, provider, meta));

ipcMain.handle('backup:uploadSyncFile', async (_e, payload, filename, provider, folder) =>
  backupUploadSyncFile(payload, filename, provider, folder));

ipcMain.handle('backup:downloadSyncFile', async (_e, filename, provider, folder) =>
  backupDownloadSyncFile(filename, provider, folder));

ipcMain.handle('backup:disconnectCloud', async (_e, provider) => backupDisconnectCloud(provider));

ipcMain.handle('backup:listCloudBackups', async (_e, provider, prefix) =>
  backupListCloudBackups(provider, prefix));

ipcMain.handle('backup:downloadCloudBackup', async (_e, remotePath, provider) =>
  backupDownloadCloudBackup(remotePath, provider));

ipcMain.handle('backup:deleteCloudBackup', async (_e, remotePath, provider) =>
  backupDeleteCloudBackup(remotePath, provider));

ipcMain.handle('backup:verifyCloudBackup', async (_e, remotePath, expectedHash, provider) =>
  backupVerifyCloudBackup(remotePath, expectedHash, provider));

ipcMain.handle('backup:startOAuth', async (_e, provider, opts) => backupStartOAuth(provider, opts));

ipcMain.handle('backup:getCloudStatus', async (_e, provider) => backupGetCloudStatus(provider));

ipcMain.handle('backup:listCloudProviders', async () => backupListCloudProviders());

ipcMain.handle('backup:pickLocalFolder', async () => backupPickLocalFolder());

ipcMain.handle('backup:uploadDbBackup', async (_e, password, meta) => backupUploadDbBackup(password, meta));

ipcMain.handle('backup:listDbBackups', async (_e, meta) => backupListDbBackups(meta));

ipcMain.handle('backup:restoreDbBackup', async (_e, remotePath, password, relaunch) => {
  const result = await backupRestoreDbBackup(remotePath, password);
  if (result.ok && result.needRestart && relaunch !== false) {
    app.relaunch();
    app.exit(0);
  }
  return result;
});

ipcMain.handle('backup:syncDbBackup', async (_e, password, meta) => backupSyncDbBackup(password, meta));

ipcMain.handle('backup:verifyDbBackup', async (_e, remotePath, expectedHash) =>
  backupVerifyDbBackup(remotePath, expectedHash));

ipcMain.handle('cache:writeBranchConfig', async (_e, centerId, branchId, pack) =>
  getDeviceCache().writeBranchConfig(centerId, branchId, pack));

ipcMain.handle('cache:readBranchConfig', async (_e, centerId, branchId) =>
  getDeviceCache().readBranchConfig(centerId, branchId));

ipcMain.handle('cache:writeLicense', async (_e, centerId, doc) =>
  getDeviceCache().writeLicense(centerId, doc));

ipcMain.handle('cache:readLicense', async (_e, centerId) =>
  getDeviceCache().readLicense(centerId));

ipcMain.handle('cache:writeVersions', async (_e, centerId, versions) =>
  getDeviceCache().writeVersions(centerId, versions));

ipcMain.handle('cache:readVersions', async (_e, centerId) =>
  getDeviceCache().readVersions(centerId));

ipcMain.handle('cache:getStatus', async (_e, centerId) =>
  getDeviceCache().getStatus(centerId));

const LICENSE_WIPE_FLAG = '.license-wipe-on-launch';

function rmDirSafe(dir) {
  if (!dir || !fs.existsSync(dir)) return;
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {}
}

function wipePersistentLicenseData(userDataRoot) {
  const root = userDataRoot || app.getPath('userData');
  [
    'CloudVault', 'cache', 'Local Storage', 'Session Storage', 'IndexedDB',
    'Code Cache', 'GPUCache', 'blob_storage', 'databases'
  ].forEach((sub) => rmDirSafe(path.join(root, sub)));
  [
    'cloud-oauth.config.json', 'cloud-oauth.developer.json',
    'communication-queue.json', LICENSE_WIPE_FLAG
  ].forEach((f) => {
    try {
      const p = path.join(root, f);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch {}
  });
}

ipcMain.handle('app:consumeLicenseWipeFlag', () => {
  try {
    const flagPath = path.join(app.getPath('userData'), LICENSE_WIPE_FLAG);
    if (fs.existsSync(flagPath)) {
      fs.unlinkSync(flagPath);
      wipePersistentLicenseData();
      return { wipe: true };
    }
  } catch {}
  return { wipe: false };
});

ipcMain.handle('app:wipePersistentLicenseData', () => {
  try {
    wipePersistentLicenseData();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('app:writeUninstallCenterMeta', (_e, payload) => {
  try {
    const doc = uninstallPrep.writeUninstallCenterMeta(app.getPath('userData'), payload || {});
    return { ok: !!doc, meta: doc };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('app:getRuntimeInfo', () => ({
  environment: app.isPackaged ? 'Production' : 'Development',
  appVersion: APP_VERSION,
  buildVersion: APP_VERSION,
  dbSchemaVersion: branding.product?.dbSchemaVersion ?? 3,
  electron: process.versions.electron,
  chromium: process.versions.chrome,
  node: process.versions.node,
  productName: APP_PRODUCT_NAME,
  company: APP_PUBLISHER,
}));

const cloudOAuthConfig = require('./cloud-oauth-config');

ipcMain.handle('cloudOAuth:getSettings', () => cloudOAuthConfig.getPublicSettings());
ipcMain.handle('cloudOAuth:saveSettings', (_e, payload) => cloudOAuthConfig.saveDeveloperSettings(payload || {}));
ipcMain.handle('cloudOAuth:restoreDefaults', () => cloudOAuthConfig.restoreDeveloperDefaults());
ipcMain.handle('cloudOAuth:testConnection', () => cloudOAuthConfig.testConnection());

const licenseData = require('./license-data');

ipcMain.handle('license:writeLicenseShard', (_e, licenseId, record) => {
  try {
    const file = licenseData.writeLicenseShard(licenseId, record);
    return { ok: true, path: file };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('license:writeActivationBundle', (_e, licenseId, bundle) => {
  try {
    const file = licenseData.writeActivationBundle(licenseId, bundle);
    return { ok: true, path: file };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('license:readActivationBundle', (_e, licenseId) => {
  try {
    return licenseData.readActivationBundle(licenseId);
  } catch {
    return null;
  }
});

ipcMain.handle('license:writeCustomPackage', (_e, cp) => {
  try {
    const file = licenseData.writeCustomPackage(cp);
    return { ok: true, path: file };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('license:updateLicenseIndex', (_e, index) => {
  try {
    const signed = licenseData.updateLicenseIndex(index);
    return { ok: true, registryVersion: signed.registryVersion };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('license:appendPackageToRegistry', (_e, pkgDef) => {
  try {
    const signed = licenseData.appendPackageToRegistry(pkgDef);
    return { ok: true, count: signed.packages.length };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});
