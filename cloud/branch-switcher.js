/**
 * Branch Switcher — topbar selector for multi-branch admin/accountant (Cloud V2).
 */
(function (global) {
  'use strict';

  function getBranches() {
    const doc = global.LicenseCloud?.loadLocal?.();
    if (doc?.branches?.length) return doc.branches.filter(b => b && b.active !== false);
    return [{ id: 'BR-MAIN', name: 'الفرع الرئيسي', active: true }];
  }

  function shouldShow() {
    if (!global.CloudMeta?.isCloudV2Enabled?.()) return false;
    if (!global.currentUser) return false;
    if (!global.BranchScope?.canUserSwitchBranch?.(global.currentUser)) return false;
    return getBranches().length > 1;
  }

  function ensureDOM() {
    if (document.getElementById('topbar-branch-switcher')) return;
    const actions = document.querySelector('.topbar-actions');
    if (!actions) return;
    const wrap = document.createElement('div');
    wrap.id = 'topbar-branch-switch-wrap';
    wrap.style.cssText = 'display:none;align-items:center;gap:6px';
    wrap.innerHTML = `
      <label for="topbar-branch-switcher" style="font-size:11px;font-weight:700;color:var(--text-muted);white-space:nowrap">🌿 الفرع</label>
      <select id="topbar-branch-switcher" class="form-control" style="min-width:130px;max-width:180px;padding:6px 10px;font-size:12px;font-weight:700;height:34px"></select>`;
    actions.insertBefore(wrap, actions.firstChild);
    const sel = wrap.querySelector('#topbar-branch-switcher');
    if (sel) {
      sel.addEventListener('change', () => {
        const bid = sel.value;
        if (!bid) return;
        if (!global.BranchScope?.userCanAccessBranch?.(global.currentUser, bid)) {
          global.notify?.('⛔ لا يمكنك الوصول لهذا الفرع', 'danger');
          sel.value = global.BranchScope?.getActiveBranchId?.() || bid;
          return;
        }
        global.BranchScope?.setActiveBranchId?.(bid);
        global.notify?.('🌿 تم التبديل إلى: ' + (getBranches().find(b => b.id === bid)?.name || bid), 'info');
        if (typeof global.reloadClientStoreFromDb === 'function') global.reloadClientStoreFromDb();
        if (typeof global.refreshCaseDerivedViews === 'function') global.refreshCaseDerivedViews();
        if (typeof global.refreshDashboard === 'function') global.refreshDashboard();
        if (typeof global.refreshDailyTable === 'function') global.refreshDailyTable();
        if (typeof global.refreshBookingsTable === 'function') global.refreshBookingsTable();
        if (typeof global.refreshClientsView === 'function') global.refreshClientsView(false);
        if (typeof global.refreshInvoicesPage === 'function') global.refreshInvoicesPage(false);
        if (typeof global.refreshDashboardAlerts === 'function') global.refreshDashboardAlerts();
      });
    }
  }

  function populate() {
    const sel = document.getElementById('topbar-branch-switcher');
    if (!sel) return;
    const branches = getBranches();
    const active = global.BranchScope?.getActiveBranchId?.() || branches[0]?.id;
    const scope = global.BranchScope?.getUserBranchScope?.(global.currentUser) || [];
    const visible = scope.includes('*') ? branches : branches.filter(b => scope.includes(b.id));
    sel.innerHTML = visible.map(b =>
      `<option value="${String(b.id).replace(/"/g, '&quot;')}">${b.name || b.id}</option>`
    ).join('');
    if (active) sel.value = active;
  }

  function applyVisibility() {
    ensureDOM();
    const wrap = document.getElementById('topbar-branch-switch-wrap');
    if (!wrap) return;
    const show = shouldShow();
    wrap.style.display = show ? 'flex' : 'none';
    if (show) populate();
  }

  global.BranchSwitcher = {
    shouldShow,
    applyVisibility,
    populate
  };
})(typeof window !== 'undefined' ? window : globalThis);
