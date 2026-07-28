/**
 * Boot Flow Wizard — mandatory step-by-step onboarding (no skipping).
 * New: License → Google → Center → Branch → Manager → System Check → Login
 * Existing: Google → License Verify → Analyze → Choose → Sync → Login
 */
(function (global) {
  'use strict';

  const BOOT_DONE_KEY = '__tdw_boot_complete__';
  const WIZARD_KEY = '__tdw_boot_wizard__';

  const PATHS = {
    NEW: 'new',
    EXISTING: 'existing'
  };

  const NEW_STEPS = ['license', 'google', 'center', 'branch', 'manager', 'syscheck', 'login'];
  const EXISTING_STEPS = ['google', 'device_branch', 'login'];

  const STEP_LABELS = {
    license: 'إدخال مفتاح الترخيص',
    google: 'تسجيل Google',
    center: 'إنشاء بيانات المركز',
    branch: 'إنشاء أول فرع',
    manager: 'إنشاء حساب المدير',
    syscheck: 'فحص النظام',
    login: 'دخول البرنامج',
    license_verify: 'التحقق من الترخيص',
    device_branch: 'اسم الجهاز والفرع',
    analyze: 'تحليل البيانات',
    choose: 'اختيار العملية المناسبة',
    sync: 'تنزيل أو دمج البيانات'
  };

  const STEP_HINTS = {
    license: 'أدخل مفتاح الترخيص من المطور ثم اضغط «التحقق من التفعيل» قبل المتابعة.',
    google: 'اربط حساب Google الخاص بالمركز — مطلوب للمزامنة والنسخ الاحتياطي.',
    center: 'أكمل اسم المركز وبياناته الأساسية من شاشة إعداد المركز.',
    branch: 'أنشئ الفرع الأول واربط هذا الجهاز به قبل المتابعة.',
    manager: 'أنشئ حساب مدير/مالك نشطاً بصلاحيات كاملة.',
    syscheck: 'راجع قائمة الجاهزية — يجب اكتمال جميع البنود.',
    login: 'بعد اكتمال جميع الخطوات يمكنك تسجيل الدخول.',
    license_verify: 'تحقق من الترخيص المخزّن على Google Drive.',
    device_branch: 'اختر الفرع المسجّل في الترخيص وسمِّ هذا الجهاز ثم اضغط تفعيل.',
    analyze: 'قارن البيانات المحلية مع السحابة لاختيار العملية المناسبة.',
    choose: 'اختر تنزيلاً أو رفعاً أو دمجاً حسب نتيجة التحليل.',
    sync: 'نفّذ العملية المختارة ثم انتظر اكتمالها.'
  };

  function loadWizard() {
    return global.DB?.get?.(WIZARD_KEY, {
      path: null,
      currentStep: 0,
      completedSteps: [],
      startedAt: null
    });
  }

  function saveWizard(w) {
    global.DB?.set?.(WIZARD_KEY, w);
    return w;
  }

  function resetWizard(path) {
    return saveWizard({
      path,
      currentStep: 0,
      completedSteps: [],
      startedAt: new Date().toISOString()
    });
  }

  function stepsFor(path) {
    return path === PATHS.EXISTING ? EXISTING_STEPS : NEW_STEPS;
  }

  function hasValidLicense() {
    const lic = typeof global.licLoad === 'function' ? global.licLoad() : null;
    const cloud = global.LicenseCloud?.loadLocal?.();
    if (global._licStatus !== 'valid') return false;
    if (lic) return true;
    if (cloud?.centerId && global.LicenseActivationGate?.isConsumed?.(cloud)) return true;
    return false;
  }

  function hasOwnerAccount() {
    return global.RolePolicy?.hasManagerAccount?.()
      || (() => {
        const list = global.users || global.DB?.get?.('users', []) || [];
        return list.some(u => u && u.active && global.RolePolicy?.isManager?.(u));
      })();
  }

  function ownerSetupRequirementMet() {
    const required = !!global.OwnerSetupState?.isRequired?.();
    if (!required) return true;
    return !!global.OwnerProfile?.hasProfile?.();
  }

  function hasGoogle() {
    const prov = global.settings?.backup?.providers?.google;
    if (global.DriveAdapter?.isConnected?.()) return true;
    return !!(prov?.connected && !prov?.userDisconnected && prov?.oauth !== false);
  }

  function hasCenterData() {
    const cid = global.CenterId?.getStoredCenterId?.() || global.ConfigLayer?.getCenterId?.();
    const name = global.settings?.centerName || global.LicenseCloud?.loadLocal?.()?.centerName;
    return !!(cid && name);
  }

  function hasBranch() {
    const lic = global.LicenseCloud?.loadLocal?.();
    const branches = lic?.branches || [];
    return branches.some(b => b && b.active !== false);
  }

  function hasDeviceBranch() {
    const cfg = global.DeviceConfig?.load?.();
    return !!(cfg?.lockedBranchId && (cfg?.deviceName || cfg?.deviceUuid));
  }

  function isBootComplete() {
    const w = loadWizard();
    if (w.path === PATHS.EXISTING) {
      return hasGoogle() && hasDeviceBranch() && hasValidLicense();
    }
    const ready = hasValidLicense() && hasOwnerAccount() && hasGoogle();
    if (!ready) {
      try { localStorage.removeItem(BOOT_DONE_KEY); } catch { /* empty */ }
      return false;
    }
    return true;
  }

  function markBootComplete() {
    const w = loadWizard();
    if (w.path === PATHS.EXISTING) {
      if (!hasGoogle() || !hasDeviceBranch() || !hasValidLicense()) return false;
      try { localStorage.setItem(BOOT_DONE_KEY, '1'); } catch { /* empty */ }
      global.AuditLogger?.logSyncEvent?.('BOOTSTRAP', { summary: 'اكتمل استعادة عميل حالي' });
      return true;
    }
    if (!hasValidLicense() || !hasOwnerAccount() || !hasGoogle()) return false;
    try { localStorage.setItem(BOOT_DONE_KEY, '1'); } catch { /* empty */ }
    global.AuditLogger?.logSyncEvent?.('BOOTSTRAP', { summary: 'اكتمل إعداد البرنامج' });
    return true;
  }

  function needsBootScreen() {
    return !isBootComplete();
  }

  function shouldAutoOpenBoot() {
    try {
      const bootParam = new URLSearchParams(global.location?.search || '').get('boot');
      if (bootParam === '1' || bootParam === 'force') return true;
      if (bootParam === '0') return false;
    } catch { /* empty */ }
    return false;
  }

  function hideBlockingScreens() {
    document.getElementById('licenseScreen')?.classList.add('hidden');
    document.getElementById('devContactModal')?.classList.remove('open');
    if (typeof global.CenterSetupUI?.close === 'function') global.CenterSetupUI.close();
  }

  function canShowLogin() {
    const w = loadWizard();
    if (w.path && w.completedSteps.includes('login')) return true;
    return isBootComplete();
  }

  function validateStep(step) {
    switch (step) {
      case 'license': return hasValidLicense();
      case 'google': return hasGoogle();
      case 'device_branch': return hasDeviceBranch();
      case 'center': return hasCenterData();
      case 'branch': return hasBranch();
      case 'manager': return hasOwnerAccount() && ownerSetupRequirementMet();
      case 'syscheck': return hasValidLicense() && hasGoogle() && hasCenterData() && hasBranch() && hasOwnerAccount() && ownerSetupRequirementMet();
      case 'login':
        if (loadWizard().path === PATHS.EXISTING) {
          return hasGoogle() && hasDeviceBranch() && hasValidLicense();
        }
        return isBootComplete();
      case 'license_verify': return hasValidLicense();
      case 'analyze': return !!loadWizard().analysisDone;
      case 'choose': return !!loadWizard().actionChosen;
      case 'sync': return !!loadWizard().syncDone;
      default: return false;
    }
  }

  function canAdvance(w) {
    const steps = stepsFor(w.path);
    const step = steps[w.currentStep];
    return validateStep(step);
  }

  function completeCurrentStep(w) {
    const steps = stepsFor(w.path);
    const step = steps[w.currentStep];
    if (!w.completedSteps.includes(step) && validateStep(step)) {
      w.completedSteps.push(step);
    }
    if (w.currentStep < steps.length - 1 && validateStep(step)) {
      w.currentStep += 1;
    }
    return saveWizard(w);
  }

  function getDevContact() {
    if (typeof global.getDevContact === 'function') return global.getDevContact();
    return {
      name: 'حسام — المبرمج',
      email: '7uzzam@gmail.com',
      whatsapp: '+966575377160',
      website: '',
      licenseVaultUrl: ''
    };
  }

  function devWaLink(num) {
    const digits = String(num || '').replace(/[^\d]/g, '');
    return digits ? `https://wa.me/${digits}` : '';
  }

  function renderSupportSection() {
    const c = getDevContact();
    const wa = devWaLink(c.whatsapp);
    const vaultUrl = (c.licenseVaultUrl || '').trim();
    const website = (c.website || '').trim();
    return `
      <div class="bf-support">
        <div class="bf-support-title">الدعم الفني والتواصل مع المطور</div>
        <div class="bf-support-grid">
          ${c.name ? `<div class="bf-support-row"><span>👤</span><span>${c.name}</span></div>` : ''}
          ${c.email ? `<div class="bf-support-row"><span>📧</span><a href="mailto:${c.email}" dir="ltr">${c.email}</a></div>` : ''}
          ${c.whatsapp ? `<div class="bf-support-row"><span>📱</span><span dir="ltr">${c.whatsapp}</span></div>` : ''}
          ${website ? `<div class="bf-support-row"><span>🌐</span><a href="${website}" target="_blank" rel="noopener">${website}</a></div>` : ''}
        </div>
        <div class="bf-support-actions">
          ${wa ? `<button type="button" class="btn btn-accent btn-sm" data-bf-wa="${wa}">💬 التواصل مع المطور</button>` : ''}
          ${vaultUrl ? `<button type="button" class="btn btn-ghost btn-sm" data-bf-vault="1">🔐 بوابة الترخيص السحابية</button>` : ''}
          <button type="button" class="btn btn-ghost btn-sm" data-bf-action="report">🐛 الإبلاغ عن مشكلة</button>
          <button type="button" class="btn btn-ghost btn-sm" data-bf-action="help">🆘 طلب المساعدة</button>
        </div>
        ${vaultUrl ? `<p class="bf-vault-hint">بوابة الترخيص: رابط API داخلي للتفعيل — يُنسخ ويُستخدم من البرنامج (ليس صفحة ويب).</p>` : ''}
      </div>`;
  }

  function bindSupportActions() {
    const overlay = document.getElementById('bootFlowOverlay');
    if (!overlay || overlay.dataset.supportBound) return;
    overlay.dataset.supportBound = '1';
    overlay.addEventListener('click', (e) => {
      const waBtn = e.target.closest('[data-bf-wa]');
      if (waBtn) {
        e.preventDefault();
        global.open(waBtn.dataset.bfWa, '_blank', 'noopener');
        return;
      }
      const reportBtn = e.target.closest('[data-bf-action="report"]');
      if (reportBtn) {
        if (typeof global.openDevContactModal === 'function') {
          global.openDevContactModal('الإبلاغ عن مشكلة أثناء إعداد البرنامج');
        } else {
          global.openLicenseScreen?.('developer');
        }
        return;
      }
      const helpBtn = e.target.closest('[data-bf-action="help"]');
      if (helpBtn) {
        if (typeof global.openDevContactModal === 'function') {
          global.openDevContactModal('طلب مساعدة في إعداد البرنامج');
        } else {
          global.openLicenseScreen?.('developer');
        }
        return;
      }
      const vaultBtn = e.target.closest('[data-bf-vault]');
      if (vaultBtn) {
        e.preventDefault();
        const url = (getDevContact().licenseVaultUrl || '').trim();
        const notify = (msg, type) => global.notify?.(msg, type || 'info');
        if (url && typeof global.licCopyToClipboard === 'function') {
          global.licCopyToClipboard(url).then((ok) => {
            notify(ok
              ? '✅ تم نسخ رابط بوابة الترخيص — API داخلي (POST) وليس للفتح في المتصفح'
              : '🔐 ' + url, ok ? 'success' : 'info');
          }).catch(() => notify('⚠️ تعذّر نسخ الرابط', 'warning'));
        } else if (url) {
          notify('🔐 بوابة الترخيص — رابط API داخلي: ' + url);
        } else {
          notify('⚠️ رابط بوابة الترخيص غير مُعدّ');
        }
      }
    });
  }

  async function refreshGoogleConnectionState() {
    if (typeof global.DriveAdapter?.ensureConnected === 'function') {
      try { await global.DriveAdapter.ensureConnected(); } catch { /* empty */ }
    }
    if (typeof global.syncCloudStatusFromElectron === 'function') {
      await global.syncCloudStatusFromElectron();
    }
    if (typeof global.licCheck === 'function') {
      try { await global.licCheck(); } catch { /* empty */ }
    }
  }

  function injectStyles() {
    const styleId = 'boot-flow-styles-v2';
    let s = document.getElementById(styleId);
    if (!s) {
      s = document.createElement('style');
      s.id = styleId;
      document.head.appendChild(s);
    }
    s.textContent = `
.bf-overlay{position:fixed;inset:0;z-index:100030;background:linear-gradient(145deg,#1a2f42,#2c4159);display:none;align-items:center;justify-content:center;padding:20px}
.bf-overlay.open{display:flex}
.bf-card{position:relative;z-index:1;max-width:520px;width:100%;max-height:min(94vh,820px);overflow-y:auto;background:var(--card,#fff);border-radius:18px;padding:28px 24px;border:1px solid rgba(255,255,255,.12);box-shadow:0 24px 64px rgba(0,0,0,.35);pointer-events:auto}
.bf-card h1{margin:0 0 6px;font-size:22px;font-weight:900;color:var(--primary,#3D5A80);text-align:center}
.bf-card>p{margin:0 0 18px;font-size:13px;color:var(--text-muted,#666);text-align:center;line-height:1.7}
.bf-progress{display:flex;gap:4px;margin-bottom:12px;justify-content:center;flex-wrap:wrap}
.bf-dot{width:10px;height:10px;border-radius:50%;background:var(--border,#ccc)}
.bf-dot.done{background:#2d7a5f}
.bf-dot.current{background:var(--primary,#3D5A80);transform:scale(1.2)}
.bf-step-meta{font-size:12px;color:var(--text-muted);text-align:center;margin-bottom:10px;line-height:1.6}
.bf-step-hint{font-size:12px;color:var(--primary,#3D5A80);background:var(--surface,#f4f6f8);border:1px solid var(--border,#ddd);border-radius:10px;padding:10px 12px;margin-bottom:12px;line-height:1.7;text-align:right}
.bf-step-content{min-height:100px}
.bf-actions{display:grid;gap:10px;margin-top:16px}
.bf-nav-row{display:flex;gap:8px;margin-top:10px}
.bf-nav-row .btn{flex:1}
.bf-actions .btn{width:100%}
.bf-status{margin-top:12px;font-size:12px;color:var(--text-muted);min-height:18px;text-align:center}
.bf-choices{display:grid;gap:12px}
.bf-choice{padding:18px 16px;border-radius:14px;border:2px solid var(--border,#ddd);background:var(--surface,#f8f9fa);cursor:pointer;text-align:right;pointer-events:auto;width:100%}
.bf-choice h3{margin:0 0 6px;font-size:16px;font-weight:900;color:var(--primary);pointer-events:none}
.bf-choice p{margin:0;font-size:12px;color:var(--text-muted);pointer-events:none}
.bf-step{display:none}.bf-step.active{display:block}
.bf-support{margin-top:16px;padding-top:14px;border-top:1px solid var(--border,#ddd)}
.bf-support-title{font-size:13px;font-weight:900;color:var(--primary);margin-bottom:10px;text-align:center}
.bf-support-grid{display:grid;gap:6px;margin-bottom:10px;font-size:12px}
.bf-support-row{display:flex;gap:8px;align-items:center;color:var(--text-muted)}
.bf-support-row a{color:var(--primary);text-decoration:none}
.bf-support-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.bf-vault-hint{margin:8px 0 0;font-size:11px;line-height:1.6;color:var(--text-muted,#888);text-align:center}
.bf-close-btn{position:absolute;top:10px;left:10px;width:36px;height:36px;border-radius:10px;border:1px solid var(--border,#ddd);background:var(--surface,#f4f6f8);color:var(--text-muted,#666);font-size:18px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2}
.bf-close-btn:hover{background:var(--card,#fff);color:var(--danger,#c0392b);border-color:var(--danger,#c0392b)}
.bf-back-login-row{margin-top:10px;text-align:center}
body.bf-active #licenseScreen:not(.hidden){z-index:100040!important}
body.bf-active #devContactModal.open{z-index:100041!important}
body.bf-active .cs-overlay.open{z-index:100039!important}
body.bf-active .bl-overlay.open{z-index:100039!important}
body.bf-active .ds-overlay.open{z-index:100039!important}
body.bf-active #cloudConnectModal.open{z-index:100039!important}
`;
  }

  function migrateBootDom(el) {
    if (!el) return;
    const card = el.querySelector('.bf-card');
    if (card && !card.querySelector('#bf-close-btn')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bf-close-btn';
      btn.id = 'bf-close-btn';
      btn.title = 'إغلاق والعودة لتسجيل الدخول';
      btn.setAttribute('aria-label', 'إغلاق');
      btn.textContent = '✕';
      card.insertBefore(btn, card.firstChild);
    }
    const host = el.querySelector('#bf-support-host');
    if (!host || !card || host.parentElement !== card) {
      el.remove();
      document.getElementById('boot-flow-styles')?.remove();
      document.getElementById('boot-flow-styles-v2')?.remove();
      ensureDOM();
      return;
    }
    refreshSupportSection();
    if (!el.dataset.supportBound) bindSupportActions();
    const closeBtn = el.querySelector('#bf-close-btn');
    if (closeBtn && !closeBtn.dataset.closeBound) {
      closeBtn.dataset.closeBound = '1';
      closeBtn.addEventListener('click', () => closeToLogin());
    }
  }

  function ensureDOM() {
    injectStyles();
    const existing = document.getElementById('bootFlowOverlay');
    if (existing) {
      migrateBootDom(existing);
      return;
    }
    const el = document.createElement('div');
    el.id = 'bootFlowOverlay';
    el.className = 'bf-overlay';
    el.innerHTML = `
      <div class="bf-card" role="dialog" aria-modal="true">
        <button type="button" class="bf-close-btn" id="bf-close-btn" title="إغلاق والعودة لتسجيل الدخول" aria-label="إغلاق">✕</button>
        <div id="bf-step-choose" class="bf-step active">
          <h1>مرحباً بك</h1>
          <p>اختر المسار المناسب — لا يمكن تخطي أي خطوة</p>
          <div class="bf-choices">
            <button type="button" class="bf-choice" id="bf-new-customer">
              <h3>🆕 عميل جديد</h3>
              <p>تفعيل بمفتاح الترخيص ثم إعداد المركز من الصفر</p>
            </button>
            <button type="button" class="bf-choice" id="bf-existing-customer">
              <h3>☁️ عميل حالي</h3>
              <p>المركز لديه بيانات على Google Drive</p>
            </button>
          </div>
          <div class="bf-actions" style="margin-top:14px">
            <button type="button" class="btn btn-ghost btn-sm" id="bf-open-license">🔑 إدارة التراخيص</button>
            <button type="button" class="btn btn-ghost btn-sm" id="bf-open-dev">👤 صفحة المطور</button>
          </div>
        </div>
        <div id="bf-step-wizard" class="bf-step">
          <h1 id="bf-wizard-title">الإعداد</h1>
          <div class="bf-progress" id="bf-progress"></div>
          <div class="bf-step-meta" id="bf-step-meta"></div>
          <p id="bf-step-label"></p>
          <div class="bf-step-hint" id="bf-step-hint"></div>
          <div class="bf-step-content" id="bf-step-content"></div>
          <div class="bf-actions" id="bf-step-actions"></div>
          <div class="bf-nav-row" id="bf-step-nav"></div>
          <div class="bf-status" id="bf-wizard-status"></div>
        </div>
        <div id="bf-support-host"></div>
      </div>`;
    document.body.appendChild(el);
    el.querySelector('#bf-new-customer').onclick = () => startPath(PATHS.NEW);
    el.querySelector('#bf-existing-customer').onclick = () => startPath(PATHS.EXISTING);
    el.querySelector('#bf-open-license')?.addEventListener('click', () => global.openLicenseScreen?.('licensing'));
    el.querySelector('#bf-open-dev')?.addEventListener('click', () => global.openLicenseScreen?.('developer'));
    el.querySelector('#bf-close-btn')?.addEventListener('click', () => closeToLogin());
    refreshSupportSection();
    bindSupportActions();
  }

  function refreshSupportSection() {
    const supportHost = document.getElementById('bf-support-host');
    if (supportHost) supportHost.innerHTML = renderSupportSection();
  }

  function showStep(id) {
    document.querySelectorAll('.bf-step').forEach(s => s.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
  }

  function setStatus(msg) {
    const el = document.getElementById('bf-wizard-status');
    if (el) el.textContent = msg || '';
  }

  function renderProgress(w) {
    const steps = stepsFor(w.path);
    const host = document.getElementById('bf-progress');
    if (!host) return;
    host.innerHTML = steps.map((s, i) => {
      let cls = 'bf-dot';
      if (w.completedSteps.includes(s)) cls += ' done';
      else if (i === w.currentStep) cls += ' current';
      return `<div class="${cls}" title="${STEP_LABELS[s]}"></div>`;
    }).join('');
    const remaining = steps.length - w.currentStep - (validateStep(steps[w.currentStep]) ? 0 : 1);
    const meta = document.getElementById('bf-step-meta');
    if (meta) {
      meta.textContent = `الخطوة ${w.currentStep + 1} من ${steps.length} — متبقٍ ${Math.max(0, remaining)} خطوة`;
    }
    document.getElementById('bf-step-label').textContent = STEP_LABELS[steps[w.currentStep]];
    const hint = document.getElementById('bf-step-hint');
    if (hint) hint.textContent = STEP_HINTS[steps[w.currentStep]] || '';
    document.getElementById('bf-wizard-title').textContent = w.path === PATHS.NEW ? 'إعداد عميل جديد' : 'استعادة عميل حالي';
    refreshSupportSection();
  }

  function renderNavButtons(w) {
    const nav = document.getElementById('bf-step-nav');
    if (!nav) return;
    nav.innerHTML = '';
    const steps = stepsFor(w.path);
    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'btn btn-ghost btn-sm';
    prev.textContent = w.currentStep > 0 ? '◀ السابق' : '◀ مرحباً بك';
    prev.onclick = () => prevStep();
    nav.appendChild(prev);

    const licBtn = document.createElement('button');
    licBtn.type = 'button';
    licBtn.className = 'btn btn-ghost btn-sm';
    licBtn.textContent = '🔑 الترخيص';
    licBtn.onclick = () => global.openLicenseScreen?.('licensing');
    if (w.path !== PATHS.EXISTING) nav.appendChild(licBtn);

    const devBtn = document.createElement('button');
    devBtn.type = 'button';
    devBtn.className = 'btn btn-ghost btn-sm';
    devBtn.textContent = '👤 المطور';
    devBtn.onclick = () => global.openLicenseScreen?.('developer');
    if (w.path !== PATHS.EXISTING) nav.appendChild(devBtn);

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'btn btn-primary btn-sm';
    next.textContent = w.currentStep >= steps.length - 1 ? '✓ إنهاء' : 'التالي ▶';
    next.disabled = !validateStep(steps[w.currentStep]);
    next.onclick = () => advanceWizard();
    nav.appendChild(next);
  }

  function verifyStepAndAdvance(checkFn, okMsg, failMsg) {
    if (checkFn()) {
      setStatus(okMsg || '✅ تم التحقق');
      advanceWizard();
    } else {
      setStatus('⚠️ ' + (failMsg || 'لم يكتمل هذا الإجراء بعد'));
    }
  }

  function renderStepUI(w) {
    const steps = stepsFor(w.path);
    const step = steps[w.currentStep];
    const content = document.getElementById('bf-step-content');
    const actions = document.getElementById('bf-step-actions');
    if (!content || !actions) return;
    content.innerHTML = '';
    actions.innerHTML = '';

    const addBtn = (label, cls, handler, disabled) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn ' + (cls || 'btn-primary');
      b.textContent = label;
      b.disabled = !!disabled;
      b.onclick = handler;
      actions.appendChild(b);
    };

    switch (step) {
      case 'license':
        content.innerHTML = '<p>أدخل مفتاح الترخيص في شاشة التفعيل ثم اضغط التحقق.</p>';
        addBtn('🔑 فتح شاشة التفعيل', 'btn-primary', () => global.openLicenseScreen?.());
        addBtn('🔍 التحقق من التفعيل', 'btn-secondary', () => verifyStepAndAdvance(
          hasValidLicense,
          '✅ الترخيص مفعّل',
          'لم يُفعّل الترخيص بعد — أدخل المفتاح أولاً'
        ));
        break;
      case 'google':
        content.innerHTML = '<p>اربط حساب Google الخاص بالمركز — سيتم سحب الترخيص تلقائياً بعد الربط.</p>';
        addBtn('🔗 ربط Google Drive', 'btn-primary', async () => {
          setStatus('⏳ جاري الربط...');
          try {
            const res = await global.loginConnectGoogleAndBootstrap?.({
              context: 'boot-wizard',
              fieldPrefix: 'bf',
              skipDeviceBootstrap: true
            }, true);
            if (typeof global.DriveAdapter?.ensureConnected === 'function') {
              await global.DriveAdapter.ensureConnected();
            }
            await refreshGoogleConnectionState();
            if (res?.ok && global.LicenseCloud?.loadLocal?.()) {
              global.populateDriveBootstrapBranchFields?.(global.LicenseCloud.loadLocal(), 'bf');
            }
            // Primary device: Google connected but no license on Drive yet — still allow continue
            if (!res?.ok && res?.googleConnected) {
              setStatus('✅ Google متصل — إن كان هذا الجهاز الأساسي أدخل المفتاح من شاشة التفعيل');
            }
            const wNow = loadWizard();
            renderProgress(wNow);
            renderNavButtons(wNow);
            if (hasGoogle()) {
              setStatus(res?.ok
                ? '✅ تم الربط وسحب الترخيص — اضغط «التالي» لاختيار الفرع والجهاز'
                : '✅ تم الربط — اضغط «التالي» (أو فعّل بالمفتاح إن لم يوجد ترخيص على Drive)');
              if (validateStep('google')) {
                completeCurrentStep(wNow);
                renderProgress(loadWizard());
                renderStepUI(loadWizard());
              }
            } else {
              setStatus('⚠️ لم يكتمل الربط — حاول مرة أخرى');
            }
          } catch (e) { setStatus('⚠️ ' + (e.message || 'فشل الربط')); }
        });
        if (hasGoogle()) setStatus('✅ Google متصل — يمكنك المتابعة');
        break;
      case 'device_branch':
        content.innerHTML = `
          <p>اختر الفرع وسمِّ هذا الجهاز ثم فعّل المزامنة.</p>
          <div id="bf-branch-fields" class="login-drive-fields" style="margin:12px 0">
            <div><label>اسم هذا الجهاز</label>
              <input type="text" id="bf-device-name" class="form-control" placeholder="Reception-PC"></div>
            <div><label>الفرع</label>
              <select id="bf-branch-id" class="form-control"><option value="BR-MAIN">الفرع الرئيسي</option></select></div>
          </div>`;
        {
          const lic = global.LicenseCloud?.loadLocal?.();
          if (lic) global.populateDriveBootstrapBranchFields?.(lic, 'bf');
        }
        addBtn('✅ تفعيل الجهاز وسحب البيانات', 'btn-primary', async () => {
          setStatus('⏳ جاري التفعيل...');
          try {
            const lock = await global.applyDriveBootstrapDeviceLock?.('bf');
            if (!lock?.ok) {
              setStatus('⚠️ ' + (global._DRIVE_BOOTSTRAP_ERR_AR?.[lock?.error] || lock?.error || 'أدخل اسم الجهاز واختر الفرع'));
              return;
            }
            const bootstrap = await global.ensureCloudBootstrapReady?.();
            if (bootstrap?.runNewDeviceBootstrap) {
              setStatus('📥 جاري سحب بيانات الفرع...');
              await bootstrap.runNewDeviceBootstrap({ branchId: lock.branchId, startSync: true, allowMissingLicense: true });
            }
            if (typeof global.reloadClientStoreFromDb === 'function') global.reloadClientStoreFromDb();
            if (typeof global.refreshCaseDerivedViews === 'function') global.refreshCaseDerivedViews();
            global.OwnerHub?.refresh?.();
            await refreshGoogleConnectionState();
            setStatus('✅ تم التفعيل — اضغط «التالي» للدخول');
            if (validateStep('device_branch')) advanceWizard();
          } catch (e) {
            setStatus('⚠️ ' + (e.message || 'فشل التفعيل'));
          }
        });
        break;
      case 'center':
        content.innerHTML = '<p>أدخل اسم المركز وبياناته الأساسية.</p>';
        addBtn('⚙️ إعداد بيانات المركز', 'btn-primary', () => global.CenterSetupUI?.open?.('overview'));
        addBtn('🔍 التحقق من بيانات المركز', 'btn-secondary', () => verifyStepAndAdvance(
          hasCenterData,
          '✅ بيانات المركز جاهزة',
          'أكمل اسم المركز والمعرّف أولاً'
        ));
        break;
      case 'branch':
        content.innerHTML = '<p>أنشئ الفرع الأول واربط هذا الجهاز به.</p>';
        addBtn('🏥 إنشاء الفرع', 'btn-primary', () => global.BranchLockUI?.openBranchLockModal?.() || global.CenterSetupUI?.openBranchStep?.());
        addBtn('🔍 التحقق من الفرع', 'btn-secondary', () => verifyStepAndAdvance(
          hasBranch,
          '✅ الفرع جاهز',
          'أنشئ فرعاً نشطاً واربط الجهاز به'
        ));
        break;
      case 'manager':
        content.innerHTML = '<p>أنشئ حساب المدير (Owner) — صاحب الصلاحيات الكاملة.</p>';
        if (global.OwnerSetupState?.isRequired?.() && !global.OwnerProfile?.hasProfile?.()) {
          const hint = document.createElement('div');
          hint.className = 'bf-step-hint';
          hint.textContent = '⚠️ بعد أول تفعيل يجب إنشاء حساب Owner قبل المتابعة.';
          content.appendChild(hint);
        }
        addBtn('👤 إنشاء حساب المدير', 'btn-primary', () => {
          global.CenterSetupUI?.open?.('overview');
          setStatus('أنشئ مستخدماً بدور مدير/مالك');
        });
        if (global.OwnerSetupState?.isRequired?.() && !global.OwnerProfile?.hasProfile?.()) {
          addBtn('🔐 إنشاء Owner Profile', 'btn-secondary', async () => {
            const username = (global.prompt?.('اسم مستخدم Owner') || '').trim();
            if (!username) { setStatus('⚠️ أدخل اسم المستخدم'); return; }
            const password = (global.prompt?.('كلمة مرور Owner') || '').trim();
            if (!password) { setStatus('⚠️ أدخل كلمة المرور'); return; }
            const recovery = (global.prompt?.('Recovery PIN/Code') || '').trim();
            if (!recovery) { setStatus('⚠️ أدخل Recovery PIN/Code'); return; }
            const res = await global.OwnerProfile?.createProfile?.({ username, password, recoveryCode: recovery });
            if (!res?.ok) {
              setStatus('⚠️ فشل إنشاء Owner Profile: ' + (res?.error || 'unknown'));
              return;
            }
            global.OwnerSetupState?.clearRequired?.();
            setStatus('✅ تم إنشاء Owner Profile');
            const wNow = loadWizard();
            renderProgress(wNow);
            renderNavButtons(wNow);
            renderStepUI(wNow);
          });
        }
        addBtn('🔍 التحقق من حساب المدير', 'btn-secondary', () => verifyStepAndAdvance(
          () => hasOwnerAccount() && ownerSetupRequirementMet(),
          '✅ حساب المدير/Owner مكتمل',
          'أنشئ مستخدماً نشطاً بدور مدير/مالك وأكمل Owner Profile'
        ));
        break;
      case 'syscheck':
        content.innerHTML = `<p>فحص الجاهزية:</p><ul style="font-size:13px;line-height:1.8">
          <li>${hasValidLicense() ? '✅' : '❌'} الترخيص</li>
          <li>${hasGoogle() ? '✅' : '❌'} Google Drive</li>
          <li>${hasCenterData() ? '✅' : '❌'} بيانات المركز</li>
          <li>${hasBranch() ? '✅' : '❌'} الفرع</li>
          <li>${hasOwnerAccount() ? '✅' : '❌'} حساب المدير</li></ul>`;
        addBtn('✓ متابعة للدخول', 'btn-primary', () => advanceWizard(), !validateStep('syscheck'));
        break;
      case 'license_verify':
        content.innerHTML = '<p>سيتم التحقق من الترخيص على Google Drive.</p>';
        addBtn('🔍 التحقق من الترخيص', 'btn-primary', async () => {
          setStatus('⏳ جاري التحقق...');
          const lic = await global.CloudBootstrap?.discoverAndFetchLicenseFromDrive?.()
            || await global.LicenseActivationGate?.tryRecoverFromDrive?.();
          if (lic?.ok || hasValidLicense()) { setStatus('✅ تم التحقق'); advanceWizard(); }
          else setStatus('⚠️ لم يُعثر على ترخيص صالح');
        });
        break;
      case 'analyze':
        content.innerHTML = '<p>سيتم مقارنة البيانات المحلية مع Google Drive.</p>';
        addBtn('📊 تحليل البيانات', 'btn-primary', async () => {
          setStatus('⏳ جاري التحليل...');
          const res = await global.DataStateUI?.analyzeAndShow?.();
          const w2 = loadWizard();
          w2.analysisDone = !!res?.ok;
          saveWizard(w2);
          if (res?.ok) advanceWizard();
        });
        break;
      case 'choose':
        content.innerHTML = '<p>اختر العملية المناسبة بناءً على تحليل البيانات.</p>';
        addBtn('☁️ تنزيل من السحابة', 'btn-primary', () => {
          if (!loadWizard().analysisDone) { setStatus('⚠️ أكمل تحليل البيانات أولاً'); return; }
          const w2 = loadWizard(); w2.chosenAction = 'pull'; w2.actionChosen = true; saveWizard(w2); advanceWizard();
        });
        addBtn('📤 رفع البيانات المحلية', 'btn-secondary', () => {
          if (!loadWizard().analysisDone) { setStatus('⚠️ أكمل تحليل البيانات أولاً'); return; }
          const w2 = loadWizard(); w2.chosenAction = 'push'; w2.actionChosen = true; saveWizard(w2); advanceWizard();
        });
        addBtn('🔀 دمج البيانات', 'btn-secondary', () => {
          if (!loadWizard().analysisDone) { setStatus('⚠️ أكمل تحليل البيانات أولاً'); return; }
          const w2 = loadWizard(); w2.chosenAction = 'merge'; w2.actionChosen = true; saveWizard(w2); advanceWizard();
        });
        break;
      case 'sync':
        content.innerHTML = '<p>تنفيذ العملية المختارة...</p>';
        addBtn('▶️ بدء المزامنة', 'btn-primary', async () => {
          setStatus('⏳ جاري التنفيذ...');
          const w2 = loadWizard();
          let ok = false;
          if (w2.chosenAction === 'pull' || w2.chosenAction === 'merge') {
            if (w2.chosenAction === 'merge' && !global.RolePolicy?.hasManagerAccount?.()) {
              setStatus('⚠️ الدمج يتطلب حساب مدير على الجهاز');
              return;
            }
            const r = await global.CloudBootstrap?.hydrateFromDrive?.(null, { allowMissingLicense: false });
            ok = !!r?.ok;
          } else if (w2.chosenAction === 'push') {
            if (!global.RolePolicy?.isManager?.(global.currentUser) && !global.RolePolicy?.hasManagerAccount?.()) {
              setStatus('⚠️ رفع البيانات يتطلب حساب مدير');
              return;
            }
            const analysis = global.DataStateUI?.getLastAnalysis?.() || await global.DataStateAnalyzer?.analyze?.({});
            const r = await global.DataStateAnalyzer?.executeSafeAuto?.(analysis);
            ok = !!r?.ok;
          }
          w2.syncDone = ok;
          saveWizard(w2);
          if (ok) {
            if (typeof global.reloadClientStoreFromDb === 'function') global.reloadClientStoreFromDb();
            if (typeof global.refreshCaseDerivedViews === 'function') global.refreshCaseDerivedViews();
            if (typeof global.refreshActivePageAfterCloudSync === 'function') global.refreshActivePageAfterCloudSync();
            setStatus('✅ تمت العملية');
            advanceWizard();
          }
          else setStatus('⚠️ تعذر التنفيذ — راجع حالة البيانات');
        });
        break;
      case 'login':
        content.innerHTML = '<p>اكتمل الإعداد! يمكنك تسجيل الدخول الآن.</p>';
        addBtn('🚀 دخول البرنامج', 'btn-primary', () => {
          if (!validateStep('syscheck') && w.path === PATHS.NEW) {
            setStatus('⚠️ لم يكتمل فحص النظام بعد');
            return;
          }
          if (!markBootComplete()) {
            setStatus('⚠️ لم تكتمل جميع متطلبات الإعداد');
            return;
          }
          close();
          global.filterLoginUsers?.();
          global.notify?.('✅ مرحباً — سجّل الدخول', 'success');
        }, !validateStep('login'));
        break;
      default:
        break;
    }
    renderNavButtons(w);
  }

  function startPath(path) {
    const w = resetWizard(path);
    showStep('bf-step-wizard');
    renderProgress(w);
    renderStepUI(w);
  }

  function prevStep() {
    const w = loadWizard();
    if (!w.path) return;
    if (w.currentStep <= 0) {
      w.path = null;
      w.currentStep = 0;
      saveWizard(w);
      showStep('bf-step-choose');
      refreshSupportSection();
      setStatus('');
      return;
    }
    w.currentStep -= 1;
    saveWizard(w);
    renderProgress(w);
    renderStepUI(w);
    setStatus('');
  }

  function advanceWizard() {
    let w = loadWizard();
    if (!validateStep(stepsFor(w.path)[w.currentStep])) {
      setStatus('⚠️ أكمل هذه الخطوة قبل المتابعة');
      return;
    }
    w = completeCurrentStep(w);
    if (w.currentStep >= stepsFor(w.path).length - 1 && validateStep('login')) {
      if (!markBootComplete()) {
        setStatus('⚠️ لم تكتمل جميع متطلبات الإعداد');
        return;
      }
      close();
      return;
    }
    renderProgress(w);
    renderStepUI(w);
    setStatus('');
  }

  function setBootActive(active) {
    document.body?.classList.toggle('bf-active', !!active);
  }

  function openOverlay(force) {
    if (!force && !needsBootScreen()) return false;
    hideBlockingScreens();
    ensureDOM();
    const w = loadWizard();
    if (w.path) {
      showStep('bf-step-wizard');
      renderProgress(w);
      renderStepUI(w);
    } else {
      showStep('bf-step-choose');
      refreshSupportSection();
    }
    document.getElementById('bootFlowOverlay')?.classList.add('open');
    setBootActive(true);
    const login = document.getElementById('loginScreen');
    if (login) login.classList.add('hidden');
    return true;
  }

  function open() {
    return openOverlay(true);
  }

  /** Dev/QA: open wizard in browser even when needsBootScreen() is false (non-Electron). */
  function forceOpen() {
    return openOverlay(true);
  }

  function close(opts) {
    document.getElementById('bootFlowOverlay')?.classList.remove('open');
    setBootActive(false);
    const login = document.getElementById('loginScreen');
    const forceLogin = !!(opts?.showLogin || !global.currentUser);
    if (login && (forceLogin || canShowLogin())) {
      login.classList.remove('hidden');
      login.style.display = '';
      login.style.pointerEvents = '';
    }
    applyLoginGate();
    if (forceLogin && typeof global.ensureUserLoginScreenVisible === 'function') {
      global.ensureUserLoginScreenVisible();
    }
  }

  function closeToLogin() {
    close({ showLogin: true });
    if (typeof global.ensureUserLoginScreenVisible === 'function') {
      global.ensureUserLoginScreenVisible();
    }
    if (typeof global.assertPreAuthViewport === 'function') {
      global.assertPreAuthViewport();
    }
    global.notify?.('ℹ️ يمكنك إعادة فتح الإعداد من «🚀 بدء الإعداد»', 'info');
  }

  function refreshBootState() {
    if (isBootComplete()) {
      markBootComplete();
      close();
      global.filterLoginUsers?.();
    } else {
      const w = loadWizard();
      if (w.path) { renderProgress(w); renderStepUI(w); }
    }
  }

  function ensureLoginAccessible() {
    document.getElementById('bootFlowOverlay')?.classList.remove('open');
    setBootActive(false);
    const login = document.getElementById('loginScreen');
    if (login) {
      login.classList.remove('hidden');
      login.style.display = '';
      login.style.pointerEvents = '';
      login.style.opacity = '';
      login.style.visibility = '';
    }
    const loginForm = document.querySelector('#loginScreen .login-box');
    if (loginForm) {
      loginForm.style.opacity = '';
      loginForm.style.pointerEvents = '';
      loginForm.removeAttribute('aria-disabled');
    }
    document.getElementById('centerSetupModal')?.classList.remove('open');
    if (!global.currentUser && typeof global.assertPreAuthViewport === 'function') {
      global.assertPreAuthViewport();
    }
  }

  function updateLoginSetupHint() {
    const el = document.getElementById('login-setup-hint');
    if (!el) return;
    if (isBootComplete()) {
      el.style.display = 'none';
      el.textContent = '';
      return;
    }
    el.style.display = '';
    el.textContent = '💡 لم يكتمل إعداد المركز بعد — يمكنك تسجيل دخول الموظف (قراءة) أو فتح «🚀 بدء الإعداد»';
  }

  function applyLoginGate() {
    ensureLoginAccessible();
    updateLoginSetupHint();
  }

  async function runExistingCustomerFlow() {
    startPath(PATHS.EXISTING);
  }

  if (typeof document !== 'undefined') injectStyles();

  global.BootFlow = {
    BOOT_DONE_KEY,
    WIZARD_KEY,
    PATHS,
    NEW_STEPS,
    EXISTING_STEPS,
    STEP_LABELS,
    hasValidLicense,
    hasOwnerAccount,
    isBootComplete,
    markBootComplete,
    needsBootScreen,
    shouldAutoOpenBoot,
    canShowLogin,
    ensureLoginAccessible,
    updateLoginSetupHint,
    open,
    forceOpen,
    close,
    closeToLogin,
    refreshBootState,
    applyLoginGate,
    runExistingCustomerFlow,
    startPath,
    advanceWizard,
    prevStep,
    validateStep
  };
})(typeof window !== 'undefined' ? window : globalThis);
