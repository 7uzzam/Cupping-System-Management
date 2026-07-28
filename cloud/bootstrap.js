/**
 * Cloud V2 Bootstrap — new device hydrate from Drive (architecture §22).
 */
(function (global) {
  'use strict';

  function getCenterId() {
    return global.ConfigLayer?.getCenterId?.()
      || global.CloudMeta?.loadMeta?.()?.centerId
      || global.LicenseCloud?.loadLocal?.()?.centerId
      || '';
  }

  function getBranchId(branchId) {
    return branchId
      || global.BranchScope?.getActiveBranchId?.()
      || global.DeviceConfig?.load?.()?.lockedBranchId
      || 'BR-MAIN';
  }

  function isBootstrapComplete() {
    const meta = global.CloudMeta?.loadMeta?.() || {};
    return !!meta.bootstrapCompletedAt;
  }

  function markBootstrapComplete(branchId) {
    const meta = global.CloudMeta?.loadMeta?.() || {};
    meta.bootstrapCompletedAt = new Date().toISOString();
    meta.bootstrapBranchId = branchId || getBranchId();
    global.CloudMeta?.saveMeta?.(meta);
    return meta;
  }

  async function fetchLicenseFromDrive(centerId) {
    centerId = centerId || getCenterId();
    if (!centerId) return { ok: false, error: 'no_center_id' };
    if (typeof global.DriveAdapter?.ensureConnected === 'function') {
      await global.DriveAdapter.ensureConnected().catch(() => false);
    }
    if (!global.DriveAdapter?.isConnected?.()) return { ok: false, offline: true };

    const paths = global.LicenseCloud?.drivePath
      ? (global.DriveLayout?.licenseJsonCandidates?.(centerId) || [global.LicenseCloud.drivePath(centerId)])
      : [];
    const dl = typeof global.DriveAdapter.downloadJsonFirst === 'function'
      ? await global.DriveAdapter.downloadJsonFirst(paths)
      : await global.DriveAdapter.downloadJson(paths[0]);
    if (!dl?.ok || !dl.data) return dl || { ok: false, error: 'license_download_failed' };

    const verify = await global.LicenseCloud?.verifyLicenseDoc?.(dl.data);
    if (verify && verify.ok === false) return verify;

    global.LicenseCloud?.saveLocal?.(dl.data);
    return { ok: true, license: dl.data, fromDrive: true, path: dl.path || paths[0] };
  }

  async function discoverAndFetchLicenseFromDrive() {
    if (typeof global.DriveAdapter?.ensureConnected === 'function') {
      await global.DriveAdapter.ensureConnected().catch(() => false);
    }
    if (!global.DriveAdapter?.isConnected?.()) {
      return { ok: false, error: 'drive_not_connected' };
    }

    const stored = global.CenterId?.getStoredCenterId?.() || getCenterId();
    if (stored && global.CenterId?.isValidCenterId?.(stored)) {
      const direct = await fetchLicenseFromDrive(stored);
      if (direct?.ok) return direct;
    }

    const bridge = global.BackupBridge;
    if (!bridge?.listCloudBackups) {
      return { ok: false, error: 'list_unavailable' };
    }

    const roots = [
      global.DriveLayout?.ROOT || 'NajjarTech',
      'NajjarTech Hijama Management'
    ].filter((v, i, a) => v && a.indexOf(v) === i);

    let allItems = [];
    let listOk = false;
    let lastListErr = null;
    for (const root of roots) {
      const list = await bridge.listCloudBackups('google', root);
      if (!list?.ok) {
        lastListErr = list?.message || 'list_failed';
        continue;
      }
      listOk = true;
      allItems = allItems.concat(list.items || []);
    }
    if (!listOk) {
      return { ok: false, error: lastListErr || 'list_failed', items: [] };
    }

    const candidates = allItems.filter(it => {
      const p = String(it.path || '');
      const n = String(it.name || '');
      return n === 'license.json'
        || /\/License\/license\.json$/i.test(p)
        || (n === 'license.json' && /License/i.test(p));
    });
    // Prefer newest license.json first
    candidates.sort((a, b) => String(b.modifiedAt || '').localeCompare(String(a.modifiedAt || '')));

    for (const item of candidates) {
      const path = item.path;
      if (!path) continue;
      let data = null;
      if (bridge.downloadCloudBackup) {
        const dl = await bridge.downloadCloudBackup(path, 'google');
        if (!dl?.ok) continue;
        try {
          data = JSON.parse(dl.text || dl.payload || '');
        } catch { continue; }
      } else {
        const dl = await global.DriveAdapter.downloadJson(path);
        if (!dl?.ok || !dl.data) continue;
        data = dl.data;
      }
      const verify = await global.LicenseCloud?.verifyLicenseDoc?.(data);
      if (verify && verify.ok === false) continue;
      global.LicenseCloud?.saveLocal?.(data);
      if (data?.centerId && global.CloudMeta) {
        const meta = global.CloudMeta.loadMeta() || {};
        meta.centerId = data.centerId;
        global.CloudMeta.saveMeta(meta);
      }
      return { ok: true, license: data, fromDrive: true, path, discovered: true };
    }

    return { ok: false, error: 'no_license_on_drive', scanned: candidates.length };
  }

  async function downloadBranchConfiguration(branchId) {
    branchId = getBranchId(branchId);
    const files = global.ConfigLayer?.CONFIG_FILES || ['settings.json', 'prices.json', 'services.json', 'packages.json', 'users.json'];
    const results = [];
    for (const fileName of files) {
      try {
        const r = await global.SyncEngine?.pullConfigFile?.(branchId, fileName);
        results.push({ file: fileName, ok: !!r?.ok, skipped: !!r?.skipped });
      } catch (e) {
        results.push({ file: fileName, ok: false, error: e.message || String(e) });
      }
    }
    const okCount = results.filter(r => r.ok).length;
    return { ok: okCount > 0, branchId, results, downloaded: okCount };
  }

  async function downloadOperationalData(branchId) {
    branchId = getBranchId(branchId);
    if (typeof global.SyncEngine?.pullBranchDatabase === 'function') {
      return global.SyncEngine.pullBranchDatabase(branchId);
    }
    const tables = global.OperationalLayer?.OPERATIONAL_TABLES || [];
    const results = [];
    for (const table of tables) {
      try {
        const r = await global.SyncEngine?.pullOperationalTable?.(branchId, table);
        results.push({ table, ok: !!r?.ok });
      } catch (e) {
        results.push({ table, ok: false, error: e.message || String(e) });
      }
    }
    const okCount = results.filter(r => r.ok).length;
    return { ok: true, branchId, results, downloaded: okCount };
  }

  async function hydrateFromDrive(branchId, options) {
    options = options || {};
    branchId = getBranchId(branchId);
    const centerId = getCenterId();
    if (!centerId) return { ok: false, error: 'no_center_id' };
    if (!global.CloudMeta?.isCloudV2Enabled?.()) return { ok: false, skipped: true, reason: 'cloud_v2_disabled' };
    if (!global.DriveAdapter?.isConnected?.()) return { ok: false, offline: true };

    const guard = global.SyncGuard?.canBootstrap?.(options);
    if (guard && !guard.ok && !guard.skipped && !options.force) {
      return { ok: false, blocked: true, reason: guard.reason, analysis: guard.analysis };
    }

    let analysis = null;
    if (global.DataStateAnalyzer?.analyze && !options.skipAnalysis) {
      analysis = await global.DataStateAnalyzer.analyze({ branchId, dryRun: false });
      if (analysis.blocked || analysis.requiresUserDecision) {
        global.SyncGuard?.blockUnsafe?.(analysis);
        return {
          ok: false,
          blocked: true,
          state: analysis.state,
          requiresUserDecision: true,
          analysis,
          error: 'unsafe_data_state'
        };
      }
      if (!options.skipSafeAuto && analysis.allowedActions?.length) {
        const auto = await global.DataStateAnalyzer.executeSafeAuto(analysis, { branchId });
        if (auto.ok && auto.results?.some(r => r.action !== 'noop' && r.ok)) {
          if (options.markComplete !== false) markBootstrapComplete(branchId);
          return { ok: true, branchId, centerId, steps: [{ step: 'safe_auto', ...auto }], analysis };
        }
      }
    }

    const out = { ok: true, branchId, centerId, steps: [], analysis };

    if (!global.LicenseCloud?.loadLocal?.()) {
      let lic = null;
      if (centerId) {
        lic = await fetchLicenseFromDrive(centerId);
      } else if (typeof discoverAndFetchLicenseFromDrive === 'function') {
        lic = await discoverAndFetchLicenseFromDrive();
      } else {
        lic = { ok: false, error: 'no_center_id' };
      }
      out.steps.push({ step: 'license', ...lic });
      if (!lic?.ok && !options.allowMissingLicense) return { ...out, ok: false, error: lic?.error || 'license_failed' };
    } else {
      out.steps.push({ step: 'license', ok: true, cached: true });
    }

    const versionsRes = await global.DriveAdapter.downloadVersions(centerId, branchId);
    if (versionsRes?.ok && versionsRes.data) {
      const applied = await global.SyncEngine?.applyRemoteVersions?.(versionsRes.data, { branchId });
      out.steps.push({ step: 'versions', ok: !!applied?.ok, pulled: applied?.pulled?.length || 0 });
      if (applied?.ok && (applied.pulled?.length || 0) > 0) {
        await global.DeviceCache?.snapshotFromLocal?.(branchId).catch(() => {});
        if (options.markComplete !== false) markBootstrapComplete(branchId);
        return out;
      }
    }

    const cfg = await downloadBranchConfiguration(branchId);
    out.steps.push({ step: 'config', ...cfg });

    const ops = await downloadOperationalData(branchId);
    out.steps.push({ step: 'operational', ...ops });

    if (versionsRes?.ok && versionsRes.data) {
      global.VersionsIndex?.saveLocal?.({
        ...(global.VersionsIndex?.loadLocal?.(centerId) || {}),
        ...versionsRes.data,
        centerId
      });
    }

    await global.DeviceCache?.snapshotFromLocal?.(branchId).catch(() => {});

    if (options.markComplete !== false) markBootstrapComplete(branchId);

    global.AuditLogger?.logSyncEvent?.('BOOTSTRAP', {
      summary: `Bootstrap hydrate — فرع ${branchId}`,
      branchId,
      steps: out.steps?.length || 0
    });

    if (typeof global.AuditLogger?.log === 'function' && !global.AuditLogger.logSyncEvent) {
      global.AuditLogger.log({
        action: 'SETTINGS_CHANGED',
        entity: 'bootstrap',
        entityId: branchId,
        summary: `Bootstrap hydrate — فرع ${branchId}`
      });
    }

    return out;
  }

  async function runNewDeviceBootstrap(options) {
    options = options || {};
    if (!global.CloudMeta?.isCloudV2Enabled?.()) return { ok: false, skipped: true, reason: 'cloud_v2_disabled' };

    const branchId = getBranchId(options.branchId);
    global.BranchScope?.setActiveBranchId?.(branchId);

    const result = await hydrateFromDrive(branchId, {
      markComplete: options.markComplete !== false,
      allowMissingLicense: options.allowMissingLicense,
      skipAnalysis: options.skipAnalysis,
      skipSafeAuto: options.skipSafeAuto,
      force: options.force
    });

    if (result?.blocked) return result;

    if (result?.ok && global.SyncEngine?.start && options.startSync !== false) {
      global.SyncGuard?.resume?.(result.analysis);
      global.SyncEngine.start({ pollIntervalMs: global.SyncState?.load?.()?.pollIntervalMs });
    }

    return result;
  }

  function getStatus() {
    const meta = global.CloudMeta?.loadMeta?.() || {};
    return {
      complete: !!meta.bootstrapCompletedAt,
      completedAt: meta.bootstrapCompletedAt || null,
      branchId: meta.bootstrapBranchId || null,
      centerId: getCenterId(),
      cloudV2: !!global.CloudMeta?.isCloudV2Enabled?.(),
      driveConnected: !!global.DriveAdapter?.isConnected?.()
    };
  }

  global.CloudBootstrap = {
    fetchLicenseFromDrive,
    discoverAndFetchLicenseFromDrive,
    downloadBranchConfiguration,
    downloadOperationalData,
    hydrateFromDrive,
    runNewDeviceBootstrap,
    isBootstrapComplete,
    markBootstrapComplete,
    getStatus
  };
})(typeof window !== 'undefined' ? window : globalThis);
