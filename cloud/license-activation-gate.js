/**
 * License Activation Gate — one-time product key via Spreadsheet vault.
 * After first activation: additional devices pull license from Google Drive (no key, no fingerprint lock).
 */
(function (global) {
  'use strict';

  const ERR_AR = {
    activation_already_used: 'هذا الترخيص مُفعَّل مسبقاً على جهاز آخر. استعد من Google Drive (نفس حساب المركز) أو تواصل مع المطور.',
    activation_google_required: 'اربط Google Drive أولاً — التفعيل الأول يُسجَّل على السحابة لمنع إعادة الاستخدام.',
    drive_license_not_found: 'لم يُعثر على ترخيص على Drive — اربط Google وسحب الترخيص من المركز.'
  };

  function fpMatch(stored, current) {
    if (!stored) return true;
    if (typeof global.licFingerprintMatch === 'function') {
      return global.licFingerprintMatch(stored, current);
    }
    return stored === current;
  }

  function getDeviceIdentity() {
    const fingerprint = typeof global.licGetFingerprint === 'function'
      ? global.licGetFingerprint()
      : '';
    const deviceUuid = global.DeviceConfig?.ensureDeviceUuid?.()
      || global.DeviceConfig?.load?.()?.deviceUuid
      || '';
    return { fingerprint, deviceUuid };
  }

  function getActivationBlock(doc) {
    return doc?.activation || null;
  }

  function isConsumed(doc) {
    const a = getActivationBlock(doc);
    return !!(a && a.consumed);
  }

  /** @deprecated Informational/audit only — not used for permissions or device gating. */
  function isPrimaryDevice(doc, identity) {
    identity = identity || getDeviceIdentity();
    const a = getActivationBlock(doc);
    if (!a?.consumed) return true;
    if (a.primaryDeviceUuid && identity.deviceUuid && a.primaryDeviceUuid === identity.deviceUuid) return true;
    return fpMatch(a.primaryDeviceFingerprint, identity.fingerprint);
  }

  async function fetchRemoteLicenseDoc(centerId) {
    centerId = centerId || global.LicenseCloud?.loadLocal?.()?.centerId
      || global.CenterId?.getStoredCenterId?.();
    if (!centerId || !global.DriveAdapter?.isConnected?.()) {
      return { ok: false, offline: true };
    }
    const path = global.LicenseCloud?.drivePath?.(centerId);
    if (!path) return { ok: false, error: 'no_path' };
    const dl = await global.DriveAdapter.downloadJson(path);
    if (!dl?.ok || !dl.data) return dl || { ok: false, error: 'not_found' };
    const verify = await global.LicenseCloud?.verifyLicenseDoc?.(dl.data);
    if (verify && verify.ok === false) return verify;
    return { ok: true, doc: dl.data };
  }

  async function preActivateCheck(record, options) {
    options = options || {};
    const identity = getDeviceIdentity();
    const requiresGoogle = options.requireGoogle !== false && (
      (record?.branches || 1) > 1
      || record?.deviceBinding === 'DEVICE_ANY'
      || global.LicenseLimits?.hasCloudSyncFeature?.(global.LicenseCloud?.loadLocal?.())
    );

    if (requiresGoogle) {
      const ready = typeof global.DriveAdapter?.ensureConnected === 'function'
        ? await global.DriveAdapter.ensureConnected()
        : !!global.DriveAdapter?.isConnected?.();
      if (!ready) {
        return { ok: false, error: 'activation_google_required', message: ERR_AR.activation_google_required };
      }
    }

    let vaultResult = null;
    if ((record?.licenseId || options.productKey || record?.productKey) && global.LicenseVaultClient?.activateOnVault) {
      vaultResult = await global.LicenseVaultClient.activateOnVault({
        licenseId: record?.licenseId,
        productKey: options.productKey || record?.productKey,
        deviceReference: record?.customer?.deviceReference,
        packageLabel: global.LicenseVaultClient.packageLabelFromBundle?.(options.bundle, record) || ''
      });
      if (!vaultResult.ok && !vaultResult.skipped) {
        const vaultMsg = {
          activation_already_used: ERR_AR.activation_already_used,
          not_found: 'الترخيص غير مسجّل في Spreadsheet — أضف صفاً في جدول التفعيلات'
        };
        return {
          ok: false,
          error: vaultResult.error || 'vault_rejected',
          message: vaultMsg[vaultResult.error] || vaultResult.message || vaultResult.error
        };
      }
      if (vaultResult.recovery) {
        return {
          ok: true,
          recovery: true,
          source: 'vault',
          identity,
          vaultBundle: vaultResult.bundle || null
        };
      }
    }

    return {
      ok: true,
      firstActivation: true,
      identity,
      vaultBundle: vaultResult?.bundle || null
    };
  }

  async function commitActivation(record, lic) {
    const identity = getDeviceIdentity();
    const centerId = record?.centerId || global.CenterId?.ensureCenterId?.(record?.centerId);
    const activation = {
      consumed: true,
      consumedAt: new Date().toISOString(),
      primaryDeviceFingerprint: identity.fingerprint || null,
      primaryDeviceUuid: identity.deviceUuid || null,
      productKeyHash: record?.productKey ? String(record.productKey).slice(-12) : null
    };

    let doc = global.LicenseCloud?.loadLocal?.() || {};
    if (!doc.centerId && centerId) {
      doc = await global.LicenseCloud?.buildFromRecord?.(record, { mergeLocal: false }) || doc;
    }
    doc.activation = activation;
    doc.centerId = doc.centerId || centerId;

    if (global.LicenseCloud?.verifyLicenseDoc) {
      const CL = global.CommercialLicense;
      if (CL?.crypto?.hmacSha256Hex && CL.crypto.canonicalJson) {
        const { signature, ...body } = doc;
        body.updatedAt = new Date().toISOString();
        const sig = await CL.crypto.hmacSha256Hex(CL.crypto.canonicalJson(body));
        doc = { ...body, signature: sig };
      }
    }

    global.LicenseCloud?.saveLocal?.(doc);

    if (centerId && global.DB?.set && global.CenterId?.META_KEY) {
      try {
        const meta = global.DB.get(global.CenterId.META_KEY, {}) || {};
        meta.centerId = doc.centerId || centerId;
        global.DB.set(global.CenterId.META_KEY, meta);
      } catch { /* empty */ }
    }
    if (global.DeviceConfig?.ensureDeviceConfig) {
      global.DeviceConfig.ensureDeviceConfig({ centerId: doc.centerId || centerId });
    }

    let drivePush = null;
    if (typeof global.DriveAdapter?.ensureConnected === 'function') {
      await global.DriveAdapter.ensureConnected().catch(() => false);
    }
    if (global.DriveAdapter?.isConnected?.()) {
      try {
        drivePush = await global.LicenseCloud?.pushToDrive?.(doc);
      } catch (e) {
        drivePush = { ok: false, error: e.message || String(e) };
      }
      if (drivePush && drivePush.ok === false) {
        console.warn('LicenseActivationGate: pushToDrive failed', drivePush);
      }
    } else {
      drivePush = { ok: false, offline: true };
    }

    if (record) {
      record.activationConsumed = true;
      record.primaryDeviceFingerprint = identity.fingerprint || null;
      record.primaryDeviceUuid = identity.deviceUuid || null;
      record.activatedAt = activation.consumedAt;
      record.deviceBinding = 'DEVICE_ANY';
      if (!record.centerId) record.centerId = doc.centerId || centerId;
      global.CommercialLicense?.store?.saveLicense?.(record);
    }

    if (typeof global.licLoadMeta === 'function' && typeof global.licSaveMeta === 'function') {
      const meta = global.licLoadMeta();
      meta.activationConsumed = true;
      meta.primaryDeviceFingerprint = identity.fingerprint || null;
      meta.primaryDeviceUuid = identity.deviceUuid || null;
      meta.activatedAt = activation.consumedAt;
      global.licSaveMeta(meta);
    }

    // Phase 24: first successful activation marks owner setup required
    // unless owner profile already exists.
    try { global.OwnerSetupState?.ensureFromActivation?.(); } catch { /* empty */ }

    if (typeof global.AuditLogger?.log === 'function') {
      global.AuditLogger.log({
        action: 'LICENSE_ACTIVATED',
        entity: 'license',
        entityId: record?.licenseId || doc.licenseId,
        summary: `License activated — center ${doc.centerId || centerId || '—'}`
      });
    }

    if (global.LicenseVaultClient?.patchActivationOnVault) {
      const productKey = lic?.productKey || record?.productKey || '';
      if (productKey) {
        await global.LicenseVaultClient.patchActivationOnVault({
          productKey,
          centerId: doc.centerId || centerId || '',
          licenseId: record?.licenseId || '',
          packageLabel: global.LicenseVaultClient.packageLabelFromBundle?.(null, record) || ''
        }).catch(() => {});
      }
    }

    return { ok: true, activation, doc, identity, drivePush };
  }

  async function tryRecoverFromDrive(options) {
    options = options || {};
    if (typeof global.DriveAdapter?.ensureConnected === 'function') {
      await global.DriveAdapter.ensureConnected().catch(() => false);
    }
    if (!global.DriveAdapter?.isConnected?.()) {
      return { ok: false, error: 'drive_not_connected' };
    }

    let doc = null;

    if (options.centerId) {
      const r = await fetchRemoteLicenseDoc(options.centerId);
      if (r?.ok) doc = r.doc;
    } else if (global.CloudBootstrap?.discoverAndFetchLicenseFromDrive) {
      const found = await global.CloudBootstrap.discoverAndFetchLicenseFromDrive();
      if (found?.ok) doc = found.license || global.LicenseCloud?.loadLocal?.();
    }

    if (!doc) return { ok: false, error: 'drive_license_not_found', message: ERR_AR.drive_license_not_found };
    if (!isConsumed(doc)) return { ok: false, error: 'not_yet_activated', doc };

    global.LicenseCloud?.saveLocal?.(doc);
    if (global.LicenseLegacyBridge?.applyCloudLicenseToLegacy) {
      await global.LicenseLegacyBridge.applyCloudLicenseToLegacy(doc);
    }
    return { ok: true, recovered: true, doc };
  }

  function formatPrimaryDeviceLabel(doc) {
    doc = doc || global.LicenseCloud?.loadLocal?.() || {};
    const a = getActivationBlock(doc);
    if (!a?.consumed) return '— (لم يُفعَّل بعد)';
    if (a.consumedAt) return '✓ مُفعَّل — الأجهزة تسحب من Google';
    return '✓ مُفعَّل';
  }

  function formatActivationLabel(doc) {
    return formatPrimaryDeviceLabel(doc);
  }

  global.LicenseActivationGate = {
    ERR_AR,
    getDeviceIdentity,
    isConsumed,
    isPrimaryDevice,
    preActivateCheck,
    commitActivation,
    tryRecoverFromDrive,
    formatPrimaryDeviceLabel,
    formatActivationLabel
  };
})(typeof window !== 'undefined' ? window : globalThis);
