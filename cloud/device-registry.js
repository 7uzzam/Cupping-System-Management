/**
 * Device Registry — register peers in license.json (no primary/secondary).
 */
(function (global) {
  'use strict';

  const HEARTBEAT_MS = 5 * 60 * 1000;
  let _heartbeatTimer = null;

  function getRegistered(doc) {
    return Array.isArray(doc?.devices?.registered) ? doc.devices.registered : [];
  }

  function countActiveDevices(doc) {
    return getRegistered(doc).filter(d => d && d.active !== false).length;
  }

  function findDevice(doc, deviceUuid) {
    if (!deviceUuid) return null;
    return getRegistered(doc).find(d => d && d.deviceUuid === deviceUuid) || null;
  }

  async function resignDoc(doc) {
    if (!global.LicenseCloud?.verifyLicenseDoc) return doc;
    const { signature, ...body } = doc;
    const CL = global.CommercialLicense;
    if (CL?.crypto?.hmacSha256Hex && CL.crypto.canonicalJson) {
      body.updatedAt = new Date().toISOString();
      const sig = await CL.crypto.hmacSha256Hex(CL.crypto.canonicalJson(body));
      return { ...body, signature: sig };
    }
    return doc;
  }

  async function touchDevice(doc, deviceUuid, patch) {
    patch = patch || {};
    const list = getRegistered(doc).slice();
    const idx = list.findIndex(d => d && d.deviceUuid === deviceUuid);
    if (idx < 0) return { ok: false, error: 'device_not_found' };
    list[idx] = {
      ...list[idx],
      ...patch,
      lastSeenAt: new Date().toISOString()
    };
    doc.devices = { registered: list };
    doc.licenseVersion = (Number(doc.licenseVersion) || 0) + 1;
    const signed = await resignDoc(doc);
    global.LicenseCloud?.saveLocal?.(signed);
    return { ok: true, device: list[idx], doc: signed };
  }

  async function registerDevice(options) {
    options = options || {};
    const uuid = global.DeviceConfig?.ensureDeviceUuid?.();
    if (!uuid) return { ok: false, error: 'device_uuid_missing' };

    let doc = global.LicenseCloud?.loadLocal?.();
    if (!doc) return { ok: false, error: 'no_license' };

    const existing = findDevice(doc, uuid);
    if (existing) {
      return touchDevice(doc, uuid, {
        deviceName: options.deviceName || existing.deviceName,
        branchId: options.branchId || existing.branchId,
        appVersion: global.APP_VERSION || existing.appVersion || '0.0.0',
        active: true
      });
    }

    const gate = global.LicenseLimits?.canRegisterDevice?.(doc, {
      ...options,
      deviceUuid: uuid
    })
      || { ok: true, unlimited: true };
    if (!gate.ok) return gate;

    const cfg = global.DeviceConfig?.load?.() || {};
    const device = {
      deviceUuid: uuid,
      deviceName: options.deviceName || cfg.deviceName || 'Device-' + uuid.slice(0, 8),
      branchId: options.branchId || cfg.lockedBranchId || 'BR-MAIN',
      registeredAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      appVersion: global.APP_VERSION || '0.0.0',
      active: true
    };

    const list = getRegistered(doc).concat(device);
    doc.devices = { registered: list };
    doc.licenseVersion = (Number(doc.licenseVersion) || 0) + 1;
    const signed = await resignDoc(doc);
    global.LicenseCloud?.saveLocal?.(signed);

    if (typeof global.AuditLogger?.log === 'function') {
      global.AuditLogger.log({
        action: 'DEVICE_REGISTERED',
        entity: 'device',
        entityId: uuid,
        summary: `Device registered: ${device.deviceName}`
      });
    }

    return { ok: true, device, doc: signed, created: true };
  }

  async function heartbeat() {
    const uuid = global.DeviceConfig?.load?.()?.deviceUuid;
    const doc = global.LicenseCloud?.loadLocal?.();
    if (!uuid || !doc || !findDevice(doc, uuid)) return { ok: false, skipped: true };
    return touchDevice(doc, uuid, { appVersion: global.APP_VERSION || '0.0.0' });
  }

  function startHeartbeat() {
    if (_heartbeatTimer) return;
    _heartbeatTimer = setInterval(() => { heartbeat().catch(() => {}); }, HEARTBEAT_MS);
  }

  function stopHeartbeat() {
    if (_heartbeatTimer) {
      clearInterval(_heartbeatTimer);
      _heartbeatTimer = null;
    }
  }

  function listDevices(doc) {
    doc = doc || global.LicenseCloud?.loadLocal?.();
    return getRegistered(doc).filter(d => d && d.active !== false);
  }

  global.DeviceRegistry = {
    HEARTBEAT_MS,
    getRegistered,
    countActiveDevices,
    findDevice,
    registerDevice,
    heartbeat,
    startHeartbeat,
    stopHeartbeat,
    listDevices,
    touchDevice
  };
})(typeof window !== 'undefined' ? window : globalThis);
