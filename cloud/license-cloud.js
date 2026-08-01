/**
 * license.json — cloud license document build / verify / local cache.
 */
(function (global) {
  'use strict';

  const LOCAL_LICENSE_KEY = '__tdw_cloud_license__';

  async function signLicenseBody(body) {
    const CL = global.CommercialLicense;
    if (CL?.crypto?.hmacSha256Hex && CL.crypto.canonicalJson) {
      return CL.crypto.hmacSha256Hex(CL.crypto.canonicalJson(body));
    }
    return null;
  }

  async function verifyLicenseDoc(doc) {
    if (!doc?.signature) return { ok: false, error: 'signature_missing' };
    const { signature, ...body } = doc;
    const expected = await signLicenseBody(body);
    if (!expected || signature !== expected) return { ok: false, error: 'signature_invalid' };
    return { ok: true };
  }

  function defaultBranches(count, centerName) {
    const n = Math.max(1, Math.min(15, Number(count) || 1));
    if (n === 1) {
      return [{ id: 'BR-MAIN', name: centerName || 'الفرع الرئيسي', code: 'MAIN', active: true }];
    }
    const names = ['الرياض', 'جدة', 'مكة', 'المدينة', 'الدمام', 'الخبر', 'تبوك', 'أبها', 'الطائف', 'بريدة', 'حائل', 'نجران', 'جازان', 'عرعر', 'الجبيل'];
    const out = [];
    for (let i = 0; i < n; i++) {
      const code = 'BR' + String(i + 1).padStart(2, '0');
      out.push({ id: code, name: 'فرع ' + (names[i] || (i + 1)), code: code.replace('BR', ''), active: true });
    }
    return out;
  }

  async function buildFromRecord(record, options) {
    options = options || {};
    const centerId = global.CenterId?.ensureCenterId(record.centerId || options.centerId) || '';
    const features = options.features || record.features || [];
    const existing = options.mergeLocal ? loadLocal() : null;
    const ownerIdentity = record.ownerIdentity
      || (global.LicenseIdentity?.buildOwnerIdentityFromRecord
        ? await global.LicenseIdentity.buildOwnerIdentityFromRecord(record)
        : null)
      || existing?.ownerIdentity
      || null;
    const body = {
      schemaVersion: 2,
      centerId,
      centerName: record.customer?.company || record.customer?.name || options.centerName || global.settings?.centerName || '',
      licenseId: record.licenseId,
      licenseUuid: record.licenseUuid,
      packageId: record.packageId,
      subscriptionId: record.subscriptionId,
      expiresAt: record.expiryDate,
      features: Array.isArray(features) ? features : [],
      ownerIdentity,
      limits: {
        maxDevices: 0,
        maxBranches: record.branches ?? 1,
        maxUsers: record.maxUsers ?? 10
      },
      branches: Array.isArray(options.branches)
        ? options.branches
        : (existing?.centerId === centerId && Array.isArray(existing.branches) ? existing.branches : []),
      activation: existing?.centerId === centerId && existing?.activation
        ? existing.activation
        : { consumed: false, primaryDeviceFingerprint: null, primaryDeviceUuid: null },
      devices: { registered: existing?.devices?.registered || record.devicesRegistered || [] },
      licenseVersion: Number(existing?.licenseVersion || record.licenseVersion) || 1,
      issuedAt: record.issueDate || new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString()
    };
    const signature = await signLicenseBody(body);
    return { ...body, signature };
  }

  function saveLocal(doc) {
    global.DB?.set?.(LOCAL_LICENSE_KEY, doc);
    if (doc?.centerId && global.CloudMeta) {
      const meta = global.CloudMeta.loadMeta();
      meta.centerId = doc.centerId;
      global.CloudMeta.saveMeta(meta);
    }
    return doc;
  }

  function loadLocal() {
    return global.DB?.get?.(LOCAL_LICENSE_KEY, null);
  }

  function drivePath(centerId) {
    return global.DriveLayout?.licenseJson?.(centerId) || '';
  }

  async function pushToDrive(doc) {
    doc = doc || loadLocal();
    if (!doc?.centerId) return { ok: false, error: 'no_center_id' };
    if (!global.DriveAdapter?.isConnected?.()) return { ok: false, offline: true };
    const path = drivePath(doc.centerId);
    if (!path) return { ok: false, error: 'no_path' };
    doc.updatedAt = new Date().toISOString();
    saveLocal(doc);
    return global.DriveAdapter.uploadJson(path, doc, { overwrite: true });
  }

  global.LicenseCloud = {
    LOCAL_LICENSE_KEY,
    buildFromRecord,
    verifyLicenseDoc,
    saveLocal,
    loadLocal,
    drivePath,
    pushToDrive,
    defaultBranches
  };
})(typeof window !== 'undefined' ? window : globalThis);
