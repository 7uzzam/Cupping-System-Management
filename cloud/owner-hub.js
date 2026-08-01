/**
 * Owner Hub — dashboard for admin/owner/accountant (Cloud V2).
 */
(function (global) {
  'use strict';

  function injectStyles() {
    if (document.getElementById('owner-hub-styles')) return;
    const s = document.createElement('style');
    s.id = 'owner-hub-styles';
    s.textContent = `
.oh-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;margin-bottom:16px}
.oh-card{border:1px solid var(--border);border-radius:12px;padding:16px;background:var(--card)}
.oh-card h4{margin:0 0 8px;font-size:13px;font-weight:800;color:var(--text-muted)}
.oh-card .oh-val{font-size:20px;font-weight:900;color:var(--primary);line-height:1.3}
.oh-devices{display:grid;gap:8px;margin-top:8px}
.oh-device{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:10px;background:var(--surface);border:1px solid var(--border);font-size:13px}
.oh-device-name{font-weight:700}
.oh-muted{font-size:12px;color:var(--text-muted)}
.oh-branch-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin-top:10px}
.oh-branch-card{padding:14px;border-radius:10px;border:1px solid var(--border);background:var(--surface)}
.oh-branch-card h5{margin:0 0 6px;font-size:14px;font-weight:800;color:var(--primary)}
.oh-path{font-size:10px;word-break:break-all;color:var(--text-muted);direction:ltr;margin-top:6px}
`;
    document.head.appendChild(s);
  }

  function formatAgo(iso) {
    if (!iso) return '—';
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 0) return 'الآن';
    const min = Math.floor(ms / 60000);
    if (min < 2) return 'الآن';
    if (min < 60) return `${min} د`;
    const hr = Math.floor(min / 60);
    if (hr < 48) return `${hr} س`;
    return `${Math.floor(hr / 24)} ي`;
  }

  function deviceStatus(lastSeenAt) {
    if (!lastSeenAt) return { icon: '⚪', label: 'غير معروف' };
    const min = (Date.now() - new Date(lastSeenAt).getTime()) / 60000;
    if (min <= 10) return { icon: '🟢', label: formatAgo(lastSeenAt) };
    if (min <= 1440) return { icon: '🟡', label: formatAgo(lastSeenAt) };
    return { icon: '🔴', label: formatAgo(lastSeenAt) };
  }

  function canAccess() {
    const u = global.currentUser;
    if (!u) return false;
    if (global.RolePolicy?.isManager?.(u)) return true;
    if (u.isDev) return true;
    const cv2 = global.CloudMeta?.isCloudV2Enabled?.() || global.settings?.cloudV2Enabled;
    if (!cv2) return false;
    if (u.role === 'accountant') {
      const scope = global.BranchScope?.getUserBranchScope?.(u) || [];
      return scope.includes('*') || scope.length > 1;
    }
    return false;
  }

  function isCloudV2Ready() {
    return !!(global.CloudMeta?.isCloudV2Enabled?.() || global.settings?.cloudV2Enabled);
  }

  function branchDrivePath(centerId, branch) {
    const folder = global.DriveLayout?.resolveBranchFolderName?.(branch.id, branch.name)
      || branch.name || branch.id;
    const centerFolder = global.DriveLayout?.centerFolderName?.(centerId) || centerId;
    return `NajjarTech/${centerFolder}/Branches/${folder}/`;
  }

  function buildModel() {
    const license = global.LicenseCloud?.loadLocal?.() || {};
    const devices = global.DeviceRegistry?.listDevices?.(license) || [];
    const sync = global.SyncEngine?.getStatus?.() || global.SyncState?.getStatus?.() || {};
    const backup = global.BackupLayer?.getStatus?.() || {};
    const branches = (license.branches || []).filter(b => b && b.active !== false);
    const activeUsers = (global.users || []).filter(u => u && u.active).length;
    const centerId = license.centerId || global.ConfigLayer?.getCenterId?.() || '—';
    const lockedBranch = global.DeviceConfig?.getLockedBranchId?.() || '—';
    const pollSec = Math.round((sync.pollIntervalMs || global.SyncState?.DEFAULT_POLL_MS || 15000) / 1000);
    const identity = global.LicenseIdentity?.formatIdentityStatus?.(license) || {};

    let licLabel = '—';
    const licDoc = license || {};
    if (global._licStatus === 'valid' && (licDoc.expiresAt || licDoc.centerId)) {
      licLabel = `✅ نشط${licDoc.expiresAt ? ' — ينتهي ' + licDoc.expiresAt : ''}`;
    } else if (licDoc.centerId && (licDoc.activation?.consumed || licDoc.branches?.length)) {
      licLabel = `✅ ${licDoc.centerName || licDoc.centerId}`;
    } else if (global._licStatus === 'expired') {
      licLabel = '🔴 منتهي';
    } else if (global._licStatus === 'none') {
      licLabel = '⚪ غير مفعّل';
    }

    return {
      license,
      licLabel,
      devices,
      deviceCount: global.LicenseLimits?.formatDeviceCount?.(devices.length, license.limits)
        || `${devices.length}/${license.limits?.maxDevices ?? '?'}`,
      sync,
      backup,
      branches,
      activeUsers,
      centerId,
      lockedBranch,
      pollSec,
      identity
    };
  }

  function renderSetupGuideHtml(license) {
    const centerId = license?.centerId || global.ConfigLayer?.getCenterId?.() || '';
    const branch = global.DeviceConfig?.getLockedBranchId?.() || '';
    const google = global.settings?.backup?.providers?.google?.connected;
    const steps = [];
    if (!google) steps.push('① اربط Google من <strong>الإعدادات → النسخ السحابي → تسجيل الدخول إلى Google</strong>');
    if (!centerId) steps.push('② فعّل الترخيص بمفتاح المنتج — لإنشاء Center ID');
    if (centerId && !branch) steps.push('③ أكمل إعداد المركز والفرع الأول');
    if (!steps.length) return '';
    return `<div class="card" style="padding:20px;margin-bottom:14px;border-color:var(--warning)">
      <div class="card-title" style="margin-bottom:10px">⚙️ إكمال إعداد Cloud V2</div>
      <ul style="margin:0;padding-right:18px;line-height:1.85;font-size:13px;color:var(--text-muted)">
        ${steps.map(s => `<li style="margin-bottom:6px">${s}</li>`).join('')}
      </ul>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="btn btn-primary btn-sm" onclick="showPage('settings');setTimeout(function(){document.getElementById('set-panel-backup')?.scrollIntoView({behavior:'smooth'})},300)">الإعدادات → النسخ السحابي</button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="CenterSetupUI.open('branch')">🏥 ربط فرع وجهاز</button>
      </div>
    </div>`;
  }

  function renderOwnerHubPage() {
    injectStyles();
    const host = document.getElementById('owner-hub-body');
    if (!host) return;

    try {
      if (!canAccess()) {
        host.innerHTML = '<div class="card" style="padding:20px"><p style="margin:0;color:var(--text-muted)">Owner Hub متاح للمدير أو المحاسب (بصلاحية كل الفروع).</p></div>';
        return;
      }
      if (!isCloudV2Ready()) {
        host.innerHTML = renderSetupGuideHtml(global.LicenseCloud?.loadLocal?.() || {}) +
          '<div class="card" style="padding:16px;margin-top:12px"><p style="margin:0;color:var(--text-muted)">Cloud V2 غير مفعّل بعد — اتبع الخطوات أعلاه أو فعّله من الإعدادات ← تفعيل الأنظمة.</p>' +
          '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">' +
          '<button type="button" class="btn btn-primary btn-sm" onclick="CenterSetupUI.open(\'overview\')">⚙️ معالج الإعداد</button>' +
          '<button type="button" class="btn btn-secondary btn-sm" onclick="showPage(\'settings\');setTimeout(function(){document.getElementById(\'set-panel-systems\')?.scrollIntoView({behavior:\'smooth\'})},300)">تفعيل Cloud V2</button></div></div>';
        return;
      }

      const m = buildModel();
      const setupHtml = renderSetupGuideHtml(m.license);
    const lastSync = m.sync.lastPushAt || m.sync.lastPollAt;
    const syncLabel = lastSync ? formatAgo(lastSync) + ' ago' : '—';
    const canSwitch = global.BranchScope?.canUserSwitchBranch?.(global.currentUser);
    const id = m.identity || {};
    const idStateLabel = id.state === 'ok' ? '✅ متطابق'
      : id.state === 'mismatch' ? '⛔ حساب مختلف'
      : id.state === 'bound_offline' ? '🟡 غير متصل'
      : '⚪ لم يُربط بعد';
    const activationLabel = global.LicenseActivationGate?.formatActivationLabel?.(m.license)
      || global.LicenseActivationGate?.formatPrimaryDeviceLabel?.(m.license) || '—';

    const branchCards = m.branches.map(b => {
      const devs = m.devices.filter(d => d.branchId === b.id);
      const path = branchDrivePath(m.centerId, b);
      const isLocked = m.lockedBranch === b.id;
      return `<div class="oh-branch-card">
        <h5>${b.name || b.id}${isLocked ? ' 🔒' : ''}</h5>
        <div class="oh-muted">${devs.length} جهاز · ${b.id}</div>
        <div class="oh-path">${path}</div>
      </div>`;
    }).join('') || '<div class="oh-muted">—</div>';

    host.innerHTML = setupHtml + `
      <div class="oh-grid">
        <div class="oh-card"><h4>الترخيص</h4><div class="oh-val" style="font-size:15px">${m.licLabel}</div><div class="oh-muted" style="margin-top:6px">${m.license.centerName || ''}</div></div>
        <div class="oh-card"><h4>Center ID</h4><div class="oh-val" style="font-size:13px;word-break:break-all" dir="ltr">${m.centerId}</div></div>
        <div class="oh-card"><h4>الأجهزة</h4><div class="oh-val">${m.deviceCount}</div></div>
        <div class="oh-card"><h4>آخر مزامنة</h4><div class="oh-val" style="font-size:16px">${syncLabel}</div><div class="oh-muted">Poll: ${m.pollSec}ث · Pending: ${m.sync.pending ?? 0}</div></div>
        <div class="oh-card"><h4>فرع الجلسة</h4><div class="oh-val" style="font-size:15px">${global.BranchScope?.getActiveBranchId?.() || m.lockedBranch}</div><div class="oh-muted">${canSwitch ? 'حسب صلاحيات حسابك — يمكنك التبديل' : 'محدد بصلاحيات حسابك'}</div></div>
        <div class="oh-card"><h4>مستخدمون نشطون</h4><div class="oh-val">${m.activeUsers}</div></div>
        <div class="oh-card"><h4>Google المركز</h4><div class="oh-val" style="font-size:14px;word-break:break-all" dir="ltr">${id.boundGoogleEmail || id.authorizedEmail || '—'}</div><div class="oh-muted">${idStateLabel}${id.connectedGoogleEmail && id.state === 'ok' ? '' : id.connectedGoogleEmail ? ' · متصل: ' + id.connectedGoogleEmail : ''}</div></div>
        <div class="oh-card"><h4>حالة التفعيل</h4><div class="oh-val" style="font-size:14px">${activationLabel}</div><div class="oh-muted">${m.license?.activation?.consumed ? 'الأجهزة تسحب الترخيص من Google' : 'لم يُفعَّل بعد'}</div></div>
      </div>
      <div class="card" style="margin-bottom:14px;padding:16px">
        <div class="card-title" style="margin-bottom:10px">🔐 حساب Google المصرّح</div>
        <p class="oh-muted" style="margin:0 0 10px">المزامنة تعمل مع حساب Google المرتبط بالمركز. لتغيير البريد: من حساب المالك/المدير.</p>
        <button type="button" class="btn btn-secondary btn-sm" onclick="OwnerHub.prepareIdentityChange()">تغيير Google</button>
      </div>
      <div class="card" style="margin-bottom:14px;padding:16px">
        <div class="card-title" style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <span>🌿 الفروع والأجهزة</span>
          <button type="button" class="btn btn-primary btn-sm" onclick="CenterSetupUI.open('manage')">➕ إدارة فروع وأجهزة</button>
        </div>
        <p class="oh-muted" style="margin:0 0 10px">سجّل فرعاً جديداً (حتى حد الترخيص) أو اربط هذا الجهاز للمزامنة (تشخيص فقط).</p>
        <div class="oh-branch-grid">${branchCards}</div>
      </div>
      <div class="card" style="padding:16px">
        <div class="card-title" style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <span>🖥️ الأجهزة المسجّلة</span>
          <button type="button" class="btn btn-ghost btn-sm" onclick="OwnerHub.refresh()">🔄 تحديث</button>
        </div>
        <div class="oh-devices">${m.devices.length ? m.devices.map(d => {
          const st = deviceStatus(d.lastSeenAt);
          const bName = m.branches.find(b => b.id === d.branchId)?.name || d.branchId || '';
          return `<div class="oh-device"><div><div class="oh-device-name">${d.deviceName || d.deviceUuid?.slice(0, 8)}</div><div class="oh-muted">${bName}</div></div><div>${st.icon} ${st.label}</div></div>`;
        }).join('') : '<div class="oh-muted">لا أجهزة مسجّلة بعد</div>'}
        </div>
      </div>`;
    } catch (err) {
      console.error('OwnerHub render:', err);
      host.innerHTML = '<div class="card" style="padding:20px;border-color:var(--danger)"><p style="margin:0;color:var(--danger)">⚠️ تعذّر تحميل Owner Hub: ' + (err.message || 'خطأ') + '</p></div>';
    }
  }

  function refresh() {
    renderOwnerHubPage();
  }

  function prepareIdentityChange() {
    const res = global.LicenseIdentity?.beginIdentityChange?.();
    if (!res?.ok) {
      global.notify?.('⚠️ ' + (res?.error || 'فشل'), 'danger');
      return;
    }
    global.notify?.('✅ الآن اربط حساب Google الجديد من الإعدادات ← النسخ السحابي', 'success');
  }

  function applyNavVisibility() {
    if (typeof document === 'undefined') return;
    const nav = document.getElementById('nav-owner-hub');
    if (!nav) return;
    const u = global.currentUser;
    const show = !!u && (global.RolePolicy?.isManager?.(u) || u.isDev ||
      (u.role === 'accountant' && ((global.BranchScope?.getUserBranchScope?.(u) || []).includes('*') ||
        (global.BranchScope?.getUserBranchScope?.(u) || []).length > 1)));
    nav.style.display = show ? '' : 'none';
    if (show) nav.classList.remove('admin-only');
  }

  global.OwnerHub = {
    canAccess,
    isCloudV2Ready,
    buildModel,
    renderOwnerHubPage,
    refresh,
    prepareIdentityChange,
    applyNavVisibility
  };

  global.renderOwnerHubPage = renderOwnerHubPage;
})(typeof window !== 'undefined' ? window : globalThis);
