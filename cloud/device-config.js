/**
 * Device config — local-only (__tdw_device_config__).
 */
(function (global) {
  'use strict';

  const DEVICE_CONFIG_KEY = '__tdw_device_config__';

  function load() {
    return global.DB?.get?.(DEVICE_CONFIG_KEY, null);
  }

  function save(cfg) {
    global.DB?.set?.(DEVICE_CONFIG_KEY, cfg);
    return cfg;
  }

  function ensureDeviceUuid() {
    let cfg = load() || {};
    if (!cfg.deviceUuid) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        cfg.deviceUuid = crypto.randomUUID();
      } else {
        cfg.deviceUuid = 'dev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
      }
      save(cfg);
    }
    return cfg.deviceUuid;
  }

  function ensureDeviceConfig(patch) {
    patch = patch || {};
    let cfg = load() || {};
    cfg.deviceUuid = cfg.deviceUuid || ensureDeviceUuid();
    if (patch.deviceName != null) cfg.deviceName = patch.deviceName;
    if (patch.centerId != null) cfg.centerId = patch.centerId;
    if (patch.lockedBranchId != null) cfg.lockedBranchId = patch.lockedBranchId;
    if (patch.branchLocked != null) cfg.branchLocked = !!patch.branchLocked;
    save(cfg);
    return cfg;
  }

  function getLockedBranchId() {
    return load()?.lockedBranchId || '';
  }

  function isBranchLocked() {
    const cfg = load();
    return !!(cfg && cfg.branchLocked && cfg.lockedBranchId);
  }

  function setBranchLock(branchId, locked, deviceName) {
    const cfg = ensureDeviceConfig({
      lockedBranchId: branchId,
      branchLocked: locked !== false,
      deviceName: deviceName || load()?.deviceName
    });
    if (typeof global.BranchScope?.setActiveBranchId === 'function' && branchId) {
      global.BranchScope.setActiveBranchId(branchId);
    }
    return cfg;
  }

  function needsBranchSelection() {
    const cfg = load() || {};
    return !cfg.lockedBranchId || !cfg.branchLocked;
  }

  function getCenterIdFromConfig() {
    const cfg = load();
    if (cfg?.centerId) return cfg.centerId;
    return global.CenterId?.getStoredCenterId?.() || global.LicenseCloud?.loadLocal?.()?.centerId || '';
  }

  global.DeviceConfig = {
    DEVICE_CONFIG_KEY,
    load,
    save,
    ensureDeviceUuid,
    ensureDeviceConfig,
    getLockedBranchId,
    isBranchLocked,
    setBranchLock,
    needsBranchSelection,
    getCenterIdFromConfig
  };
})(typeof window !== 'undefined' ? window : globalThis);
