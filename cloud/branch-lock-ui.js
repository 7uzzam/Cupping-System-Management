/**
 * Branch Lock UI — customer names branches; limit = maxBranches in license.
 */
(function (global) {
  'use strict';

  const ERR_AR = {
    branch_name_required: 'أدخل اسم الفرع',
    branch_limit_reached: 'تم بلوغ الحد الأقصى للفروع في الترخيص',
    branch_not_licensed: 'الفرع غير مسجّل — اختر فرعاً موجوداً أو سجّل فرعاً جديداً'
  };

  function getBranches() {
    const doc = global.LicenseCloud?.loadLocal?.();
    const enrolled = global.BranchEnrollment?.getEnrolledBranches?.(doc) || doc?.branches || [];
    if (enrolled.length) return enrolled.filter(b => b && b.active !== false);
    return [];
  }

  function enrollmentHint(doc) {
    doc = doc || global.LicenseCloud?.loadLocal?.() || {};
    const max = global.LicenseLimits?.getMaxBranches?.(doc) || 1;
    const count = getBranches().length;
    const canMore = global.BranchEnrollment?.canEnrollBranch?.(doc);
    if (!count) {
      return `الفرع الأول — سمِّ فرعك. الترخيص يسمح بـ ${max} ${max === 1 ? 'فرع' : 'فروع'}.`;
    }
    if (canMore?.ok) {
      return `مسجّل ${count}/${max} فروع — يمكنك إضافة فرع جديد (حتى ${max}).`;
    }
    return `مسجّل ${count}/${max} فروع — اختر فرعاً موجوداً فقط.`;
  }

  function injectStyles() {
    if (document.getElementById('branch-lock-styles')) return;
    const s = document.createElement('style');
    s.id = 'branch-lock-styles';
    s.textContent = `
.bl-overlay{position:fixed;inset:0;z-index:100020;background:rgba(8,18,14,.6);display:none;align-items:center;justify-content:center;padding:16px}
.bl-overlay.open{display:flex}
.bl-modal{max-width:460px;width:100%;background:var(--card);border-radius:14px;padding:22px;border:1px solid var(--border);box-shadow:0 20px 48px rgba(0,0,0,.25)}
.bl-modal h2{margin:0 0 8px;font-size:18px;font-weight:900;color:var(--primary)}
.bl-modal p{margin:0 0 16px;font-size:13px;color:var(--text-muted);line-height:1.7}
.bl-tabs{display:flex;gap:8px;margin-bottom:14px}
.bl-tab{flex:1;padding:8px;border-radius:8px;border:1px solid var(--border);background:transparent;cursor:pointer;font-weight:700;font-size:12px}
.bl-tab.active{background:rgba(201,168,76,.15);border-color:rgba(201,168,76,.45)}
.bl-panel{display:none}
.bl-panel.active{display:block}
`;
    document.head.appendChild(s);
  }

  function ensureDOM() {
    injectStyles();
    if (document.getElementById('branchLockModal')) return;
    const el = document.createElement('div');
    el.id = 'branchLockModal';
    el.className = 'bl-overlay';
    el.innerHTML = `
      <div class="bl-modal" role="dialog">
        <h2>🏥 ربط الجهاز بالفرع</h2>
        <p id="bl-branch-hint"></p>
        <div class="bl-tabs" id="bl-mode-tabs" style="display:none">
          <button type="button" class="bl-tab active" data-bl-mode="existing">فرع موجود</button>
          <button type="button" class="bl-tab" data-bl-mode="new">فرع جديد</button>
        </div>
        <div id="bl-panel-existing" class="bl-panel active">
          <div class="form-group"><label class="form-label">الفرع</label>
            <select class="form-control" id="bl-branch-id"></select></div>
        </div>
        <div id="bl-panel-new" class="bl-panel">
          <div class="form-group"><label class="form-label">اسم الفرع الجديد</label>
            <input class="form-control" id="bl-new-branch-name" placeholder="فرع جدة"></div>
        </div>
        <div id="bl-panel-first" class="bl-panel">
          <div class="form-group"><label class="form-label">اسم الفرع</label>
            <input class="form-control" id="bl-first-branch-name" placeholder="الفرع الرئيسي"></div>
        </div>
        <div class="form-group"><label class="form-label">اسم الجهاز</label>
          <input class="form-control" id="bl-device-name" placeholder="Reception-PC"></div>
        <button type="button" class="btn btn-primary" style="width:100%;margin-top:8px" id="bl-confirm">✅ تأكيد وربط الجهاز</button>
      </div>`;
    document.body.appendChild(el);
    el.querySelector('#bl-confirm').onclick = () => confirmBranchLock();
    el.querySelectorAll('[data-bl-mode]').forEach(btn => {
      btn.onclick = () => setBranchLockMode(btn.dataset.blMode);
    });
  }

  function setBranchLockMode(mode) {
    document.querySelectorAll('.bl-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.blMode === mode);
    });
    document.getElementById('bl-panel-existing')?.classList.toggle('active', mode === 'existing');
    document.getElementById('bl-panel-new')?.classList.toggle('active', mode === 'new');
  }

  function refreshBranchLockUI() {
    const doc = global.LicenseCloud?.loadLocal?.() || {};
    const branches = getBranches();
    const canMore = global.BranchEnrollment?.canEnrollBranch?.(doc)?.ok;
    const hint = document.getElementById('bl-branch-hint');
    if (hint) hint.textContent = enrollmentHint(doc);

    const tabs = document.getElementById('bl-mode-tabs');
    const panelFirst = document.getElementById('bl-panel-first');
    const panelExisting = document.getElementById('bl-panel-existing');
    const panelNew = document.getElementById('bl-panel-new');

    if (!branches.length) {
      if (tabs) tabs.style.display = 'none';
      panelFirst?.classList.add('active');
      panelExisting?.classList.remove('active');
      panelNew?.classList.remove('active');
      return;
    }

    panelFirst?.classList.remove('active');
    if (tabs) tabs.style.display = canMore ? 'flex' : 'none';
    if (!canMore) {
      panelExisting?.classList.add('active');
      panelNew?.classList.remove('active');
    } else {
      setBranchLockMode(document.querySelector('.bl-tab.active')?.dataset?.blMode || 'existing');
    }

    const sel = document.getElementById('bl-branch-id');
    if (sel) {
      sel.innerHTML = branches.map(b =>
        `<option value="${String(b.id).replace(/"/g, '&quot;')}">${b.name || b.id}</option>`
      ).join('');
    }
  }

  function shouldShow() {
    if (global.DeviceConfig?.needsBranchSelection?.() !== true) return false;
    if (global.LicenseCloud?.loadLocal?.()?.centerId) return true;
    if (typeof global.licLoad === 'function' && global.licLoad()) return true;
    return false;
  }

  async function openBranchLockModal() {
    await global.CenterSetup?.prepareForBranchSetup?.();
    ensureDOM();
    refreshBranchLockUI();
    const cfg = global.DeviceConfig?.load?.() || {};
    const nameEl = document.getElementById('bl-device-name');
    if (nameEl && !nameEl.value) {
      nameEl.value = cfg.deviceName || (global.settings?.backup?.deviceName) || ('PC-' + (cfg.deviceUuid || '').slice(0, 6));
    }
    document.getElementById('branchLockModal')?.classList.add('open');
  }

  function closeBranchLockModal() {
    document.getElementById('branchLockModal')?.classList.remove('open');
  }

  async function confirmBranchLock() {
    const name = document.getElementById('bl-device-name')?.value?.trim();
    if (!name) {
      global.notify?.('⚠️ أدخل اسم الجهاز', 'danger');
      return;
    }

    const doc = global.LicenseCloud?.loadLocal?.() || {};
    const branches = getBranches();
    let branchId = '';

    if (!branches.length) {
      const branchName = document.getElementById('bl-first-branch-name')?.value?.trim();
      if (!branchName) {
        global.notify?.('⚠️ ' + ERR_AR.branch_name_required, 'danger');
        return;
      }
      const enroll = await global.BranchEnrollment?.enrollBranch?.(doc, {
        branchName,
        deviceUuid: global.DeviceConfig?.ensureDeviceUuid?.()
      });
      if (!enroll?.ok) {
        global.notify?.('⛔ ' + (ERR_AR[enroll?.error] || enroll?.error || 'فشل تسجيل الفرع'), 'danger');
        return;
      }
      branchId = enroll.branch.id;
    } else {
      const mode = document.getElementById('bl-panel-new')?.classList.contains('active') ? 'new' : 'existing';
      if (mode === 'new') {
        const branchName = document.getElementById('bl-new-branch-name')?.value?.trim();
        if (!branchName) {
          global.notify?.('⚠️ ' + ERR_AR.branch_name_required, 'danger');
          return;
        }
        const enroll = await global.BranchEnrollment?.enrollBranch?.(doc, {
          branchName,
          deviceUuid: global.DeviceConfig?.ensureDeviceUuid?.()
        });
        if (!enroll?.ok) {
          global.notify?.('⛔ ' + (ERR_AR[enroll?.error] || enroll?.error || 'فشل تسجيل الفرع'), 'danger');
          return;
        }
        branchId = enroll.branch.id;
      } else {
        branchId = document.getElementById('bl-branch-id')?.value;
        if (!branchId) {
          global.notify?.('⚠️ اختر الفرع', 'danger');
          return;
        }
      }
    }

    global.DeviceConfig?.setBranchLock?.(branchId, true, name);
    global.DeviceConfig?.ensureDeviceConfig?.({ deviceName: name, centerId: doc.centerId });
    const reg = await global.DeviceRegistry?.registerDevice?.({ deviceName: name, branchId });
    if (reg && !reg.ok && reg.error === 'branch_not_licensed') {
      global.notify?.('⛔ ' + ERR_AR.branch_not_licensed, 'danger');
      return;
    }
    global.BranchScope?.setActiveBranchId?.(branchId);
    closeBranchLockModal();
    const bName = getBranches().find(b => b.id === branchId)?.name || branchId;
    global.notify?.('✅ تم ربط الجهاز بفرع ' + bName, 'success');
    if (typeof global.logAudit === 'function') {
      global.logAudit('DEVICE_BRANCH_LOCKED', `Branch lock: ${branchId} — ${name}`);
    }
    global.CloudV2?.maybeAutoEnableCloudV2?.();
    if (global.CloudMeta?.isCloudV2Enabled?.() && global.CloudBootstrap?.runNewDeviceBootstrap) {
      global.notify?.('⏳ جاري تحميل بيانات الفرع من السحابة...', 'info');
      try {
        const boot = await global.CloudBootstrap.runNewDeviceBootstrap({ branchId, startSync: true });
        if (boot?.ok) {
          global.notify?.('✅ تم تحميل بيانات الفرع — المزامنة نشطة', 'success');
          global.OwnerHub?.applyNavVisibility?.();
          if (typeof global.reloadClientStoreFromDb === 'function') global.reloadClientStoreFromDb();
          if (typeof global.refreshCaseDerivedViews === 'function') global.refreshCaseDerivedViews();
          if (typeof global.refreshActivePageAfterCloudSync === 'function') global.refreshActivePageAfterCloudSync();
        } else if (boot?.offline) {
          global.notify?.('⚠️ لا اتصال بالسحابة — سيتم التحميل عند الاتصال', 'warning');
        }
      } catch { /* empty */ }
    }
  }

  function maybePromptBranchLock() {
    if (!shouldShow()) return;
    if (global.CenterSetupUI?.open) {
      setTimeout(() => global.CenterSetupUI.open('overview'), 500);
      return;
    }
    setTimeout(openBranchLockModal, 400);
  }

  global.BranchLockUI = {
    shouldShow,
    openBranchLockModal,
    closeBranchLockModal,
    confirmBranchLock,
    maybePromptBranchLock,
    refreshBranchLockUI
  };
})(typeof window !== 'undefined' ? window : globalThis);
