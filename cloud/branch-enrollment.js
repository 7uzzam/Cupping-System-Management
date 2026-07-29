/**
 * Branch enrollment — customer names branches; maxBranches from license only.
 */
(function (global) {
  'use strict';

  function getEnrolledBranches(doc) {
    return (doc?.branches || []).filter(b => b && b.active !== false);
  }

  function nextBranchId(enrolled) {
    if (!enrolled.length) return 'BR-MAIN';
    let n = 1;
    const used = new Set(enrolled.map(b => b.id));
    while (n <= 99) {
      const id = n === 1 && !used.has('BR-MAIN') ? 'BR-MAIN' : 'BR' + String(n).padStart(2, '0');
      if (!used.has(id)) return id;
      n++;
    }
    return 'BR' + String(enrolled.length + 1).padStart(2, '0');
  }

  function canEnrollBranch(doc) {
    doc = doc || global.LicenseCloud?.loadLocal?.() || {};
    const max = global.LicenseLimits?.getMaxBranches?.(doc) || 1;
    const count = getEnrolledBranches(doc).length;
    if (count >= max) return { ok: false, error: 'branch_limit_reached', max, current: count };
    return { ok: true, max, current: count, remaining: max - count };
  }

  async function enrollBranch(doc, options) {
    options = options || {};
    doc = doc || global.LicenseCloud?.loadLocal?.();
    if (!doc?.centerId) return { ok: false, error: 'no_center_id' };

    // V2-3 / Phase 28+: ALL branch creates (including first) require Owner Hub source.
    // Device activation / Google login must never create branches.
    if (options.source !== 'owner_hub') {
      return { ok: false, error: 'owner_hub_required' };
    }
    const enrolled = getEnrolledBranches(doc);
    const gate = canEnrollBranch(doc);
    if (!gate.ok) return gate;

    const branchName = String(options.branchName || '').trim();
    if (!branchName) return { ok: false, error: 'branch_name_required' };

    const branchId = options.branchId || nextBranchId(enrolled);
    if (enrolled.some(b => b.id === branchId)) {
      return { ok: false, error: 'branch_id_exists', branchId };
    }

    const branch = {
      id: branchId,
      name: branchName,
      code: branchId === 'BR-MAIN' ? 'MAIN' : branchId.replace(/^BR-?/, ''),
      active: true,
      enrolledAt: new Date().toISOString(),
      enrolledByDevice: options.deviceUuid || global.DeviceConfig?.load?.()?.deviceUuid || null
    };

    doc.branches = enrolled.concat(branch);
    doc.licenseVersion = (Number(doc.licenseVersion) || 0) + 1;

    const CL = global.CommercialLicense;
    if (global.LicenseCloud?.verifyLicenseDoc && CL?.crypto?.hmacSha256Hex && CL.crypto.canonicalJson) {
      const { signature, ...body } = doc;
      body.updatedAt = new Date().toISOString();
      const sig = await CL.crypto.hmacSha256Hex(CL.crypto.canonicalJson(body));
      doc = { ...body, signature: sig };
    }

    global.LicenseCloud?.saveLocal?.(doc);
    if (global.LicenseCloud?.pushToDrive) {
      await global.LicenseCloud.pushToDrive(doc).catch(() => {});
    }

    if (typeof global.AuditLogger?.log === 'function') {
      global.AuditLogger.log({
        action: 'BRANCH_ENROLLED',
        entity: 'branch',
        entityId: branchId,
        summary: `Branch enrolled: ${branchName} (${branchId})`
      });
    }

    return { ok: true, branch, doc, created: true };
  }

  global.BranchEnrollment = {
    getEnrolledBranches,
    nextBranchId,
    canEnrollBranch,
    enrollBranch
  };
})(typeof window !== 'undefined' ? window : globalThis);
