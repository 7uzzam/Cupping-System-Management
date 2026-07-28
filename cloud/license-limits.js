/**
 * License limits — branches + devices.
 * Phase 26: enforce maxDevices with grandfather-safe behavior.
 */
(function (global) {
  'use strict';

  const CLOUD_FEATURE_KEYS = new Set([
    'cloud_multi_device', 'cloud_owner_hub', 'bk_drive', 'cap_cloud',
    '073', '074'
  ]);

  function isUnlimitedDevices(maxDevices) {
    if (maxDevices == null) return true;
    return Number(maxDevices) === 0;
  }

  /** null = unlimited */
  function getEffectiveMaxDevices(limits) {
    limits = limits || {};
    if (isUnlimitedDevices(limits.maxDevices)) return null;
    const n = Number(limits.maxDevices);
    if (Number.isNaN(n) || n < 1) return null;
    return n;
  }

  function getMaxDevicesFromLicense(lic) {
    lic = lic || global.LicenseCloud?.loadLocal?.() || {};
    return getEffectiveMaxDevices(lic.limits);
  }

  function formatDeviceCount(current, limits) {
    current = Number(current) || 0;
    const max = getEffectiveMaxDevices(limits);
    if (max == null) return `${current} (غير محدود)`;
    return `${current}/${max}`;
  }

  function hasCloudSyncFeature(lic) {
    const feats = lic?.features || [];
    return feats.some(f => {
      const s = String(f);
      if (CLOUD_FEATURE_KEYS.has(s)) return true;
      if (/cloud/i.test(s)) return true;
      return false;
    });
  }

  function isMultiDeviceLicense(lic) {
    if (!lic) return false;
    if (isUnlimitedDevices(lic.limits?.maxDevices)) return true;
    if (Number(lic.limits?.maxDevices) >= 2) return true;
    if (hasCloudSyncFeature(lic)) return true;
    return false;
  }

  function isCloudSyncEligible(lic) {
    return isMultiDeviceLicense(lic);
  }

  function getLicensedBranches(lic) {
    return (lic?.branches || []).filter(b => b && b.active !== false);
  }

  function getMaxBranches(lic) {
    lic = lic || {};
    const fromLimits = lic.limits?.maxBranches;
    if (fromLimits != null && fromLimits !== '') {
      const n = Number(fromLimits);
      if (!Number.isNaN(n) && n >= 1) return Math.min(15, n);
    }
    const branches = getLicensedBranches(lic);
    return branches.length ? branches.length : 1;
  }

  function countLicensedBranches(lic) {
    return getLicensedBranches(lic).length;
  }

  function isBranchLicensed(lic, branchId) {
    branchId = branchId || 'BR-MAIN';
    const branches = getLicensedBranches(lic);
    if (!branches.length) return false;
    return branches.some(b => b.id === branchId);
  }

  function canRegisterDevice(doc, options) {
    options = options || {};
    const branchId = options.branchId || global.DeviceConfig?.getLockedBranchId?.() || 'BR-MAIN';
    const branches = getLicensedBranches(doc);
    if (branches.length && !isBranchLicensed(doc, branchId)) {
      return { ok: false, error: 'branch_not_licensed', branchId };
    }
    const all = (doc?.devices?.registered || []).filter(d => d);
    const active = all.filter(d => d.active !== false);
    const current = active.length;
    const max = getEffectiveMaxDevices(doc?.limits || {});
    if (max == null) {
      return { ok: true, unlimited: true, max: null, current };
    }

    const uuid = String(options.deviceUuid || global.DeviceConfig?.load?.()?.deviceUuid || '').trim();
    const existing = uuid ? all.find((d) => d.deviceUuid === uuid) : null;
    if (existing) {
      // Grandfather/same-device reactivation should remain allowed.
      return { ok: true, existing: true, grandfathered: true, max, current };
    }

    if (current >= max) {
      return {
        ok: false,
        error: 'device_limit_reached',
        max,
        current,
        message: `تم بلوغ الحد الأقصى للأجهزة (${current}/${max})`
      };
    }
    return { ok: true, max, current };
  }

  function formatDevicesLabel(value) {
    if (isUnlimitedDevices(value)) return 'غير محدود';
    if (value == null || value === '') return 'غير محدود';
    return String(value);
  }

  global.LicenseLimits = {
    CLOUD_FEATURE_KEYS,
    isUnlimitedDevices,
    getEffectiveMaxDevices,
    getMaxDevicesFromLicense,
    formatDeviceCount,
    formatDevicesLabel,
    hasCloudSyncFeature,
    isMultiDeviceLicense,
    isCloudSyncEligible,
    getLicensedBranches,
    getMaxBranches,
    countLicensedBranches,
    isBranchLicensed,
    canRegisterDevice
  };
})(typeof window !== 'undefined' ? window : globalThis);
