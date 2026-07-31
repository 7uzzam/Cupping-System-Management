/**
 * V2-5.8 Activation Wizard — unified first-run journey.
 * Welcome → Language → Google → License → Organization → Branch → Owner → Restore → Sync → Ready
 * Existing path: Language → Google → License → Organization → Branch Select → Owner → Restore → Sync → Ready
 *
 * Dedupes login/license/center-setup Google panels by owning the customer activation path.
 * Dashboard/login completion requires Owner password profile + device branch + license + google.
 */
(function (global) {
  'use strict';

  const BOOT_DONE_KEY = '__tdw_boot_complete__';
  const WIZARD_KEY = '__tdw_boot_wizard__';
  const LANG_KEY = '__tdw_ui_lang__';

  const PATHS = { NEW: 'new', EXISTING: 'existing' };

  /** V2-5.8 mandatory stepper ids */
  const NEW_STEPS = ['language', 'google', 'license', 'organization', 'branch', 'owner', 'restore', 'sync', 'ready'];
  const EXISTING_STEPS = ['language', 'google', 'license', 'organization', 'branch_select', 'owner', 'restore', 'sync', 'ready'];

  const STEP_LABELS = {
    language: 'اللغة',
    google: 'ربط Google',
    license: 'التفعيل والترخيص',
    organization: 'المؤسسة',
    branch: 'إنشاء أول فرع',
    branch_select: 'اختيار فرع موجود',
    owner: 'حساب المالك',
    restore: 'الاستعادة',
    sync: 'المزامنة الأولية',
    ready: 'الجاهزية والدخول'
  };

  const STEP_HINTS = {
    language: 'اختر لغة الواجهة قبل المتابعة.',
    google: 'اربط حساب Google الخاص بالمركز. يُمنع فتح أكثر من نافذة OAuth.',
    license: 'أدخل مفتاح الترخيص أو اسحب الترخيص من Drive بعد الربط.',
    organization: 'أكد المؤسسة المصرّح بها — لا تُعرض مؤسسات غير مصرح بها.',
    branch: 'أنشئ أول فرع واربط هذا الجهاز به. الحماية تمنع الإنشاء المكرر.',
    branch_select: 'اختر فرعاً موجوداً واربط هذا الجهاز به (ليس إنشاء فرع جديد).',
    owner: 'أنشئ حساب Owner مستقل بكلمة مرور إلزامية ووسيلة استرداد.',
    restore: 'استعادة من السحابة أو البدء بقاعدة فارغة.',
    sync: 'نفّذ المزامنة الأولية وتحقق من الحالة.',
    ready: 'بعد اكتمال كل الخطوات يمكنك تسجيل الدخول — لا يُفتح Dashboard قبل ذلك.'
  };

  let oauthInFlight = false;
  let branchCreateInFlight = false;
  let ownerCreateInFlight = false;
  let licenseActivateInFlight = false;
  let lastFocusEl = null;

  function loadWizard() {
    return global.DB?.get?.(WIZARD_KEY, {
      path: null,
      currentStep: 0,
      completedSteps: [],
      startedAt: null,
      lang: global.UxI18n?.getLang?.() || 'ar',
      restoreChoice: null,
      syncDone: false,
      oauthLockAt: null
    }) || {
      path: null, currentStep: 0, completedSteps: [], startedAt: null, lang: 'ar', restoreChoice: null, syncDone: false
    };
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
      startedAt: new Date().toISOString(),
      lang: loadWizard().lang || 'ar',
      restoreChoice: null,
      syncDone: false,
      oauthLockAt: null
    });
  }

  function stepsFor(path) {
    return path === PATHS.EXISTING ? EXISTING_STEPS : NEW_STEPS;
  }

  function userError(err, code) {
    if (global.ActivationErrors?.toUserError) {
      return global.ActivationErrors.toUserError(err, code);
    }
    return { title: 'خطأ', detail: String(err && err.message || err || code || ''), diagnosticCode: 'TDW-ACT-FALLBACK' };
  }

  function setStatus(msg, isError) {
    const el = document.getElementById('bf-wizard-status');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('bf-status-error', !!isError);
    el.setAttribute('role', isError ? 'alert' : 'status');
  }

  function setStatusFromErr(err, code) {
    const ue = userError(err, code);
    setStatus(global.ActivationErrors?.formatForUi?.(ue) || `${ue.title} — ${ue.detail}`, true);
    return ue;
  }

  function hasValidLicense() {
    const lic = typeof global.licLoad === 'function' ? global.licLoad() : null;
    const cloud = global.LicenseCloud?.loadLocal?.();
    if (global._licStatus === 'valid') return true;
    if (lic && global._licStatus !== 'expired' && global._licStatus !== 'blocked') return true;
    if (cloud?.centerId && global.LicenseActivationGate?.isConsumed?.(cloud)) return true;
    if (cloud?.centerId && (cloud.branches || []).length) return true;
    return false;
  }

  function hasGoogle() {
    const prov = global.settings?.backup?.providers?.google;
    if (global.DriveAdapter?.isConnected?.()) return true;
    return !!(prov?.connected && !prov?.userDisconnected && prov?.oauth !== false);
  }

  function hasCenterData() {
    const cid = global.CenterId?.getStoredCenterId?.() || global.ConfigLayer?.getCenterId?.()
      || global.LicenseCloud?.loadLocal?.()?.centerId;
    const name = global.settings?.centerName || global.LicenseCloud?.loadLocal?.()?.centerName;
    return !!(cid && name);
  }

  function hasBranch() {
    const lic = global.LicenseCloud?.loadLocal?.();
    const branches = (lic?.branches || []).filter((b) => b && b.active !== false);
    return branches.length > 0;
  }

  function hasDeviceBranch() {
    const cfg = global.DeviceConfig?.load?.();
    return !!(cfg?.lockedBranchId && (cfg?.deviceName || cfg?.deviceUuid));
  }

  function hasOwnerPasswordAccount() {
    if (!global.OwnerProfile?.hasProfile?.()) return false;
    const users = global.users || global.DB?.get?.('users', []) || [];
    return users.some((u) => u && u.active !== false && String(u.role || '').toLowerCase() === 'owner' && u.password);
  }

  function ownerSetupRequirementMet() {
    return hasOwnerPasswordAccount();
  }

  function hasRestoreDecision() {
    const w = loadWizard();
    return w.restoreChoice === 'empty' || w.restoreChoice === 'cloud' || w.restoreChoice === 'skip_existing';
  }

  function hasSyncDone() {
    return !!loadWizard().syncDone;
  }

  function isBootComplete() {
    const base = hasGoogle() && hasValidLicense() && hasCenterData() && hasDeviceBranch() && ownerSetupRequirementMet()
      && hasRestoreDecision() && hasSyncDone();
    if (!base) {
      try { localStorage.removeItem(BOOT_DONE_KEY); } catch { /* empty */ }
      return false;
    }
    return true;
  }

  function markBootComplete() {
    if (!isBootComplete()) return false;
    try { localStorage.setItem(BOOT_DONE_KEY, '1'); } catch { /* empty */ }
    global.AuditLogger?.logSyncEvent?.('BOOTSTRAP', { summary: 'V2-5.8 activation wizard complete' });
    return true;
  }

  function needsBootScreen() {
    return !isBootComplete();
  }

  function shouldAutoOpenBoot() {
    try {
      const bootParam = new URLSearchParams(global.location?.search || '').get('boot');
      if (bootParam === '0') return false;
      if (bootParam === '1' || bootParam === 'force') return true;
    } catch { /* empty */ }
    // V2-5.8: auto-open whenever activation incomplete (not only ?boot=1).
    return needsBootScreen() && !global.currentUser;
  }

  function canShowLogin() {
    const w = loadWizard();
    if (w.completedSteps?.includes('ready') && isBootComplete()) return true;
    return isBootComplete();
  }

  function canOpenDashboard() {
    return isBootComplete() && !!global.currentUser;
  }

  function validateStep(step) {
    switch (step) {
      case 'language': return !!(loadWizard().lang);
      case 'google': return hasGoogle();
      case 'license': return hasValidLicense();
      case 'organization': return hasCenterData();
      case 'branch': return hasBranch() && hasDeviceBranch();
      case 'branch_select': return hasBranch() && hasDeviceBranch();
      case 'owner': return ownerSetupRequirementMet();
      case 'restore': return hasRestoreDecision();
      case 'sync': return hasSyncDone();
      case 'ready': return isBootComplete();
      default: return false;
    }
  }

  function completeCurrentStep(w) {
    w = w || loadWizard();
    const steps = stepsFor(w.path);
    const step = steps[w.currentStep];
    if (!w.completedSteps.includes(step)) w.completedSteps.push(step);
    if (w.currentStep < steps.length - 1) w.currentStep += 1;
    return saveWizard(w);
  }

  function hideBlockingScreens() {
    document.getElementById('licenseScreen')?.classList.add('hidden');
    document.getElementById('devContactModal')?.classList.remove('open');
    if (typeof global.CenterSetupUI?.close === 'function') global.CenterSetupUI.close();
  }

  function injectStyles() {
    const styleId = 'boot-flow-styles-v258';
    let s = document.getElementById(styleId);
    if (!s) {
      s = document.createElement('style');
      s.id = styleId;
      document.head.appendChild(s);
    }
    s.textContent = `
.bf-overlay{position:fixed;inset:0;z-index:100030;background:linear-gradient(145deg,#1a2f42,#2c4159);display:none;align-items:stretch;justify-content:center;padding:clamp(8px,2vh,20px);overflow:auto}
.bf-overlay.open{display:flex}
.bf-card{position:relative;z-index:1;max-width:min(640px,96vw);width:100%;max-height:min(94vh,920px);display:flex;flex-direction:column;background:var(--card,#fff);border-radius:var(--tdw-radius-lg,16px);border:1px solid rgba(255,255,255,.12);box-shadow:0 24px 64px rgba(0,0,0,.35);pointer-events:auto;overflow:hidden}
.bf-card-header{flex:0 0 auto;padding:18px 20px 8px;position:relative}
.bf-card-body{flex:1 1 auto;overflow:auto;padding:0 20px 12px;-webkit-overflow-scrolling:touch}
.bf-card-footer{flex:0 0 auto;padding:10px 20px 16px;border-top:1px solid var(--border,#e5e7eb);background:var(--card,#fff)}
.bf-card h1{margin:0 0 6px;font-size:clamp(1.1rem,2.2vw,1.4rem);font-weight:900;color:var(--primary,#3D5A80);text-align:center}
.bf-card>p,.bf-lead{margin:0 0 12px;font-size:13px;color:var(--text-muted,#666);text-align:center;line-height:1.7}
.bf-progress{display:flex;gap:4px;margin-bottom:10px;justify-content:center;flex-wrap:wrap}
.bf-dot{width:10px;height:10px;border-radius:50%;background:var(--border,#ccc)}
.bf-dot.done{background:#2d7a5f}
.bf-dot.current{background:var(--primary,#3D5A80);transform:scale(1.2)}
.bf-dot.failed{background:var(--tdw-color-danger-600,#a94045)}
.tdw-stepper.bf-stepper{gap:4px;overflow-x:auto;padding-bottom:4px}
.tdw-stepper.bf-stepper>li{flex:1 0 auto;min-width:72px;font-size:11px;text-align:center;padding:6px 4px;border-block-end:3px solid var(--tdw-color-neutral-300,#cbd5e1)}
.tdw-stepper.bf-stepper>li[data-state="done"]{border-color:#2d7a5f;color:#2d7a5f}
.tdw-stepper.bf-stepper>li[data-state="failed"]{border-color:var(--tdw-color-danger-600);color:var(--tdw-color-danger-600)}
.tdw-stepper.bf-stepper>li[aria-current="step"]{border-color:var(--tdw-color-accent-500,#2f8f83);color:var(--tdw-color-primary-700)}
.bf-step-meta{font-size:12px;color:var(--text-muted);text-align:center;margin-bottom:8px}
.bf-step-hint{font-size:12px;color:var(--primary);background:var(--surface,#f4f6f8);border:1px solid var(--border,#ddd);border-radius:10px;padding:10px 12px;margin-bottom:12px;line-height:1.7}
.bf-step-content{min-height:80px}
.bf-actions{display:grid;gap:10px;margin-top:12px}
.bf-nav-row{display:flex;gap:8px;flex-wrap:wrap}
.bf-nav-row .btn{flex:1 1 120px}
.bf-status{margin-top:8px;font-size:12px;color:var(--text-muted);min-height:18px;text-align:center;line-height:1.5}
.bf-status-error{color:var(--tdw-color-danger-600,#a94045);font-weight:700}
.bf-choices{display:grid;gap:12px}
.bf-choice{padding:16px;border-radius:14px;border:2px solid var(--border,#ddd);background:var(--surface,#f8f9fa);cursor:pointer;text-align:inherit;width:100%}
.bf-choice h3{margin:0 0 6px;font-size:16px;font-weight:900;color:var(--primary)}
.bf-choice p{margin:0;font-size:12px;color:var(--text-muted)}
.bf-step{display:none}.bf-step.active{display:block}
.bf-close-btn{position:absolute;top:8px;inset-inline-start:8px;width:40px;height:40px;border-radius:10px;border:1px solid var(--border);background:var(--surface);cursor:pointer;z-index:2}
.bf-lang-row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.bf-lang-row .btn{min-width:120px}
.tdw-password-row{display:flex;gap:8px;align-items:center}
.tdw-password-row .form-control{flex:1}
.tdw-field-error{color:var(--tdw-color-danger-600,#a94045);font-size:12px;margin-top:4px;font-weight:700}
.ocf-form .form-group{margin-bottom:12px}
.bf-support{margin-top:12px;padding-top:12px;border-top:1px solid var(--border)}
.bf-support-title{font-size:13px;font-weight:900;text-align:center;margin-bottom:8px}
body.bf-active #login-drive-bootstrap-panel,
body.bf-active #lic-drive-bootstrap-panel{display:none!important}
body.bf-active #licenseScreen:not(.hidden){z-index:100040!important}
body.bf-active #cloudConnectModal.open{z-index:100039!important}
@media (max-height:720px){.bf-card{max-height:96vh}.bf-card-header{padding-top:12px}.bf-card h1{font-size:1.1rem}}
@media (max-width:1024px){.bf-card{max-width:96vw}}
@media (max-width:768px){.bf-nav-row .btn{flex:1 1 100%}.tdw-stepper.bf-stepper>li{min-width:64px;font-size:10px}}
`;
  }

  function ensureDOM() {
    injectStyles();
    let el = document.getElementById('bootFlowOverlay');
    if (el) {
      // Upgrade structure if old card without header/body/footer
      if (!el.querySelector('.bf-card-body')) {
        el.remove();
        el = null;
      }
    }
    if (el) return;
    el = document.createElement('div');
    el.id = 'bootFlowOverlay';
    el.className = 'bf-overlay';
    el.setAttribute('role', 'presentation');
    el.innerHTML = `
      <div class="bf-card tdw-modal tdw-modal--wizard" role="dialog" aria-modal="true" aria-labelledby="bf-main-title" id="bf-dialog">
        <div class="bf-card-header">
          <button type="button" class="bf-close-btn" id="bf-close-btn" title="إغلاق" aria-label="إغلاق">✕</button>
          <div id="bf-step-choose" class="bf-step active">
            <h1 id="bf-main-title">مرحباً بك</h1>
            <p class="bf-lead">رحلة إعداد موحّدة — لا يمكن تخطي الخطوات المطلوبة</p>
            <div class="bf-choices">
              <button type="button" class="bf-choice" id="bf-new-customer">
                <h3>🆕 عميل جديد</h3>
                <p>ربط Google ثم التفعيل وإنشاء أول فرع وحساب المالك</p>
              </button>
              <button type="button" class="bf-choice" id="bf-existing-customer">
                <h3>☁️ عميل حالي / جهاز جديد</h3>
                <p>ربط Google وسحب الترخيص واختيار فرع موجود ثم الاستعادة</p>
              </button>
            </div>
          </div>
          <div id="bf-step-wizard" class="bf-step">
            <h1 id="bf-wizard-title">الإعداد</h1>
            <ul class="tdw-stepper bf-stepper" id="bf-stepper" aria-label="خطوات الإعداد"></ul>
            <div class="bf-progress" id="bf-progress" aria-hidden="true"></div>
            <div class="bf-step-meta" id="bf-step-meta"></div>
          </div>
        </div>
        <div class="bf-card-body">
          <div id="bf-wizard-body" class="bf-step">
            <p id="bf-step-label" style="font-weight:800;text-align:center"></p>
            <div class="bf-step-hint" id="bf-step-hint"></div>
            <div class="bf-step-content" id="bf-step-content"></div>
            <div class="bf-actions" id="bf-step-actions"></div>
            <div class="bf-status" id="bf-wizard-status" role="status"></div>
          </div>
          <div id="bf-support-host"></div>
        </div>
        <div class="bf-card-footer">
          <div class="bf-nav-row" id="bf-step-nav"></div>
        </div>
      </div>`;
    document.body.appendChild(el);
    el.querySelector('#bf-new-customer').onclick = () => startPath(PATHS.NEW);
    el.querySelector('#bf-existing-customer').onclick = () => startPath(PATHS.EXISTING);
    el.querySelector('#bf-close-btn')?.addEventListener('click', () => closeToLogin());
    el.addEventListener('keydown', onDialogKeydown);
  }

  function onDialogKeydown(ev) {
    if (ev.key === 'Escape') {
      // Safe close only when not in critical in-flight
      if (oauthInFlight || licenseActivateInFlight || branchCreateInFlight || ownerCreateInFlight) {
        setStatus('⚠️ عملية جارية — انتظر أو أكمل قبل الإغلاق', true);
        ev.preventDefault();
        return;
      }
      closeToLogin();
      return;
    }
    if (ev.key !== 'Tab') return;
    const dialog = document.getElementById('bf-dialog');
    if (!dialog || !document.getElementById('bootFlowOverlay')?.classList.contains('open')) return;
    const focusables = [...dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter((n) => !n.disabled && n.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (ev.shiftKey && document.activeElement === first) {
      last.focus();
      ev.preventDefault();
    } else if (!ev.shiftKey && document.activeElement === last) {
      first.focus();
      ev.preventDefault();
    }
  }

  function showStep(id) {
    document.querySelectorAll('#bootFlowOverlay .bf-step').forEach((s) => s.classList.remove('active'));
    if (id === 'bf-step-choose') {
      document.getElementById('bf-step-choose')?.classList.add('active');
      document.getElementById('bf-step-nav').innerHTML = '';
    } else {
      document.getElementById('bf-step-wizard')?.classList.add('active');
      document.getElementById('bf-wizard-body')?.classList.add('active');
    }
  }

  function renderProgress(w) {
    const steps = stepsFor(w.path);
    const host = document.getElementById('bf-progress');
    const stepper = document.getElementById('bf-stepper');
    if (host) {
      host.innerHTML = steps.map((s, i) => {
        let cls = 'bf-dot';
        if (w.completedSteps.includes(s)) cls += ' done';
        else if (i === w.currentStep) cls += ' current';
        return `<div class="${cls}" title="${STEP_LABELS[s] || s}"></div>`;
      }).join('');
    }
    if (stepper) {
      stepper.innerHTML = steps.map((s, i) => {
        let state = 'pending';
        if (w.completedSteps.includes(s)) state = 'done';
        else if (i === w.currentStep) state = 'current';
        const cur = i === w.currentStep ? 'step' : undefined;
        return `<li data-state="${state}" ${cur ? 'aria-current="step"' : ''}>${STEP_LABELS[s] || s}</li>`;
      }).join('');
    }
    const meta = document.getElementById('bf-step-meta');
    if (meta) meta.textContent = `الخطوة ${w.currentStep + 1} من ${steps.length}`;
    const label = document.getElementById('bf-step-label');
    if (label) label.textContent = STEP_LABELS[steps[w.currentStep]] || '';
    const hint = document.getElementById('bf-step-hint');
    if (hint) hint.textContent = STEP_HINTS[steps[w.currentStep]] || '';
    const title = document.getElementById('bf-wizard-title');
    if (title) title.textContent = w.path === PATHS.NEW ? 'إعداد عميل جديد' : 'جهاز / عميل حالي';
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

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'btn btn-primary btn-sm';
    next.id = 'bf-next-btn';
    next.textContent = w.currentStep >= steps.length - 1 ? '✓ إنهاء والدخول' : 'متابعة ▶';
    next.disabled = !validateStep(steps[w.currentStep]);
    next.onclick = () => advanceWizard();
    nav.appendChild(next);
  }

  function addBtn(host, label, cls, handler, disabled) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn ' + (cls || 'btn-primary');
    b.textContent = label;
    b.disabled = !!disabled;
    b.onclick = handler;
    host.appendChild(b);
    return b;
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

  async function runGoogleConnect() {
    if (oauthInFlight) {
      setStatus('⏳ ربط Google جارٍ بالفعل — انتظر', true);
      return { ok: false, error: 'oauth_in_flight' };
    }
    oauthInFlight = true;
    setStatus('🔗 جارٍ فتح Google للمصادقة...');
    try {
      const res = await global.loginConnectGoogleAndBootstrap?.({
        context: 'boot-wizard',
        fieldPrefix: 'bf',
        skipDeviceBootstrap: true
      }, true);
      await refreshGoogleConnectionState();
      if (res?.ok && global.LicenseCloud?.loadLocal?.()) {
        global.populateDriveBootstrapBranchFields?.(global.LicenseCloud.loadLocal(), 'bf');
      }
      if (hasGoogle()) {
        setStatus(res?.ok
          ? '✅ تم الربط' + (res.email ? ' — ' + res.email : '')
          : '✅ Google متصل');
        return { ok: true, email: res?.email || '' };
      }
      setStatusFromErr(res || { message: 'oauth_failed' }, res?.error || 'oauth_failed');
      return res || { ok: false };
    } catch (e) {
      setStatusFromErr(e);
      return { ok: false, error: String(e && e.message || e) };
    } finally {
      oauthInFlight = false;
      const w = loadWizard();
      renderProgress(w);
      renderNavButtons(w);
      renderStepUI(w);
    }
  }

  async function activateLicenseKey() {
    if (licenseActivateInFlight) {
      setStatus('⏳ التفعيل جارٍ — لا تضغط مجدداً', true);
      return { ok: false, error: 'activate_in_flight' };
    }
    const input = document.getElementById('bf-license-key');
    let key = String(input?.value || '').replace(/\s+/g, '').trim().toUpperCase();
    if (input) input.value = key;
    if (!key) {
      setStatus('⚠️ أدخل مفتاح الترخيص', true);
      return { ok: false, error: 'key_required' };
    }
    licenseActivateInFlight = true;
    setStatus('⏳ جارٍ التحقق من الترخيص...');
    try {
      let res;
      if (typeof global.licApplyRenewal === 'function') {
        res = await global.licApplyRenewal(key);
      } else if (typeof global.applyLicenseKey === 'function') {
        res = await global.applyLicenseKey(key);
      } else if (global.CommercialLicense?.activateWithKey) {
        res = await global.CommercialLicense.activateWithKey(key);
      }
      if (typeof global.licCheck === 'function') await global.licCheck();
      if (hasValidLicense()) {
        setStatus('✅ تم التفعيل بنجاح');
        return { ok: true, result: res };
      }
      setStatusFromErr(res || { message: 'license_invalid' }, 'license_invalid');
      return { ok: false, result: res };
    } catch (e) {
      setStatusFromErr(e, 'license_invalid');
      return { ok: false, error: String(e && e.message || e) };
    } finally {
      licenseActivateInFlight = false;
      const w = loadWizard();
      renderNavButtons(w);
    }
  }

  async function createFirstBranchFromForm() {
    if (branchCreateInFlight) {
      setStatusFromErr({ message: 'duplicate create' }, 'branch_duplicate_create');
      return { ok: false, error: 'in_flight' };
    }
    const nameAr = String(document.getElementById('bf-branch-name-ar')?.value || '').trim();
    const nameEn = String(document.getElementById('bf-branch-name-en')?.value || '').trim();
    const code = String(document.getElementById('bf-branch-code')?.value || '').trim();
    const city = String(document.getElementById('bf-branch-city')?.value || '').trim();
    const phone = String(document.getElementById('bf-branch-phone')?.value || '').trim();
    const deviceName = String(document.getElementById('bf-device-name')?.value || '').trim() || 'Device-1';
    if (!nameAr) {
      setStatusFromErr({ message: 'branch_name_required' }, 'branch_name_required');
      return { ok: false };
    }
    branchCreateInFlight = true;
    setStatus('⏳ جارٍ إنشاء الفرع...');
    try {
      let doc = global.LicenseCloud?.loadLocal?.();
      if (!doc?.centerId) {
        setStatus('⚠️ لا يوجد ترخيص/مؤسسة صالحة لإنشاء فرع', true);
        return { ok: false, error: 'no_center' };
      }
      if (hasBranch()) {
        setStatus('ℹ️ يوجد فرع بالفعل — استخدم ربط الجهاز', true);
      } else {
        const enrolled = await global.BranchEnrollment?.enrollBranch?.(doc, {
          source: 'activation_wizard',
          branchName: nameAr,
          branchNameEn: nameEn,
          branchId: code || undefined,
          city,
          phone,
          idempotencyKey: `act-first-branch-${doc.centerId}`
        });
        if (!enrolled?.ok) {
          setStatusFromErr(enrolled, enrolled?.error === 'branch_id_exists' ? 'branch_code_duplicate' : 'branch_fetch_failed');
          return enrolled;
        }
        doc = global.LicenseCloud?.loadLocal?.() || enrolled.doc || doc;
      }
      // Lock device to branch
      const branchId = (doc.branches || []).find((b) => b && b.active !== false)?.id;
      if (branchId && global.DeviceConfig?.lockToBranch) {
        await global.DeviceConfig.lockToBranch(branchId, { deviceName });
      } else if (branchId && global.applyDriveBootstrapDeviceLock) {
        const sel = document.getElementById('bf-branch-id');
        if (sel) sel.value = branchId;
        const nameInput = document.getElementById('bf-device-name');
        if (nameInput) nameInput.value = deviceName;
        await global.applyDriveBootstrapDeviceLock('bf');
      } else if (branchId) {
        const cfg = global.DeviceConfig?.load?.() || {};
        cfg.lockedBranchId = branchId;
        cfg.deviceName = deviceName;
        global.DeviceConfig?.save?.(cfg);
      }
      setStatus('✅ تم إنشاء/ربط الفرع');
      return { ok: true };
    } catch (e) {
      setStatusFromErr(e);
      return { ok: false };
    } finally {
      branchCreateInFlight = false;
      const w = loadWizard();
      renderNavButtons(w);
      renderStepUI(w);
    }
  }

  async function bindExistingBranch() {
    const deviceName = String(document.getElementById('bf-device-name')?.value || '').trim();
    const branchId = String(document.getElementById('bf-branch-id')?.value || '').trim();
    if (!deviceName || !branchId) {
      setStatus('⚠️ أدخل اسم الجهاز واختر الفرع', true);
      return { ok: false };
    }
    setStatus('⏳ جارٍ ربط الجهاز بالفرع...');
    try {
      const lock = await global.applyDriveBootstrapDeviceLock?.('bf');
      if (lock && lock.ok === false) {
        setStatus('⚠️ ' + (global._DRIVE_BOOTSTRAP_ERR_AR?.[lock.error] || lock.error || 'فشل الربط'), true);
        return lock;
      }
      if (!lock && global.DeviceConfig?.lockToBranch) {
        await global.DeviceConfig.lockToBranch(branchId, { deviceName });
      } else if (!hasDeviceBranch()) {
        const cfg = global.DeviceConfig?.load?.() || {};
        cfg.lockedBranchId = branchId;
        cfg.deviceName = deviceName;
        global.DeviceConfig?.save?.(cfg);
      }
      setStatus('✅ تم ربط الجهاز بالفرع المحدد');
      return { ok: true };
    } catch (e) {
      setStatusFromErr(e);
      return { ok: false };
    } finally {
      renderNavButtons(loadWizard());
      renderStepUI(loadWizard());
    }
  }

  async function createOwnerFromWizard() {
    if (ownerCreateInFlight) {
      setStatus('⏳ إنشاء المالك جارٍ — انتظر', true);
      return { ok: false };
    }
    if (hasOwnerPasswordAccount()) {
      setStatus('✅ حساب المالك جاهز');
      return { ok: true, already: true };
    }
    ownerCreateInFlight = true;
    setStatus('⏳ جارٍ إنشاء حساب المالك...');
    try {
      const res = await global.OwnerCreateForm?.createOwnerFromForm?.('ocf');
      if (!res?.ok) {
        setStatusFromErr(res, res?.code || res?.error);
        return res || { ok: false };
      }
      setStatus('✅ تم إنشاء حساب المالك (Owner)');
      try { global.OwnerHub?.applyNavVisibility?.(); } catch { /* empty */ }
      return res;
    } catch (e) {
      setStatusFromErr(e);
      return { ok: false };
    } finally {
      ownerCreateInFlight = false;
      renderNavButtons(loadWizard());
      renderStepUI(loadWizard());
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

    switch (step) {
      case 'language': {
        content.innerHTML = '<p class="bf-lead">اختر لغة الواجهة</p><div class="bf-lang-row" id="bf-lang-row"></div>';
        const row = content.querySelector('#bf-lang-row');
        [['ar', 'العربية'], ['en', 'English']].forEach(([code, label]) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'btn ' + ((w.lang || 'ar') === code ? 'btn-primary' : 'btn-secondary');
          b.textContent = label;
          b.onclick = () => {
            w.lang = code;
            saveWizard(w);
            try { localStorage.setItem(LANG_KEY, code); } catch { /* empty */ }
            global.UxI18n?.setLang?.(code);
            global.UxI18n?.applyDocumentLang?.(document, code);
            setStatus(code === 'ar' ? '✅ العربية' : '✅ English');
            renderProgress(loadWizard());
            renderNavButtons(loadWizard());
            renderStepUI(loadWizard());
          };
          row.appendChild(b);
        });
        break;
      }
      case 'google': {
        content.innerHTML = '<p>اربط حساب Google الخاص بالمركز. سيظهر البريد بعد نجاح التحقق فقط.</p><div id="bf-google-email" class="bf-lead" dir="ltr"></div>';
        const emailEl = content.querySelector('#bf-google-email');
        const provEmail = global.settings?.backup?.providers?.google?.email || '';
        if (hasGoogle() && provEmail) emailEl.textContent = '✅ ' + provEmail;
        const btn = addBtn(actions, oauthInFlight ? '⏳ جارٍ الربط...' : '🔗 ربط Google', 'btn-primary', () => runGoogleConnect(), oauthInFlight);
        btn.id = 'bf-google-connect-btn';
        if (hasGoogle()) setStatus('✅ Google متصل — يمكنك المتابعة');
        break;
      }
      case 'license': {
        content.innerHTML = `
          <p>أدخل مفتاح الترخيص (يدعم اللصق وإزالة المسافات).</p>
          <label for="bf-license-key">مفتاح التفعيل</label>
          <input type="text" id="bf-license-key" class="form-control" dir="ltr" autocomplete="off" placeholder="XXXX-XXXX-...">
          <p class="bf-lead" style="margin-top:8px">أو اسحب الترخيص من Drive إن وُجد بعد ربط Google.</p>`;
        const keyInput = content.querySelector('#bf-license-key');
        keyInput?.addEventListener('paste', () => {
          setTimeout(() => { keyInput.value = String(keyInput.value || '').replace(/\s+/g, '').trim().toUpperCase(); }, 0);
        });
        addBtn(actions, licenseActivateInFlight ? '⏳ جارٍ التفعيل...' : '✅ تحقق وتفعيل', 'btn-primary', () => activateLicenseKey(), licenseActivateInFlight);
        addBtn(actions, '☁️ سحب الترخيص من Drive', 'btn-secondary', async () => {
          setStatus('⏳ جارٍ السحب...');
          try {
            const lic = await global.CloudBootstrap?.discoverAndFetchLicenseFromDrive?.()
              || await global.LicenseActivationGate?.tryRecoverFromDrive?.();
            if (typeof global.licCheck === 'function') await global.licCheck();
            if (lic?.ok || hasValidLicense()) setStatus('✅ تم سحب/التحقق من الترخيص');
            else setStatusFromErr(lic || { message: 'not_found' }, 'license_invalid');
          } catch (e) { setStatusFromErr(e, 'license_timeout'); }
          renderNavButtons(loadWizard());
        });
        if (hasValidLicense()) setStatus('✅ الترخيص صالح');
        break;
      }
      case 'organization': {
        const lic = global.LicenseCloud?.loadLocal?.() || {};
        const cid = lic.centerId || global.CenterId?.getStoredCenterId?.() || '';
        const cname = lic.centerName || global.settings?.centerName || '';
        content.innerHTML = `
          <p>المؤسسة المصرّح بها من الترخيص:</p>
          <div class="form-group"><label>Center ID</label><input class="form-control" id="bf-org-id" dir="ltr" value="${String(cid).replace(/"/g, '&quot;')}" readonly></div>
          <div class="form-group"><label>اسم المؤسسة</label><input class="form-control" id="bf-org-name" value="${String(cname).replace(/"/g, '&quot;')}"></div>`;
        addBtn(actions, '💾 تأكيد المؤسسة', 'btn-primary', () => {
          const name = String(document.getElementById('bf-org-name')?.value || '').trim();
          if (!name) { setStatus('⚠️ أدخل اسم المؤسسة', true); return; }
          if (!global.settings) global.settings = global.DB?.get?.('settings', {}) || {};
          global.settings.centerName = name;
          global.DB?.set?.('settings', global.settings);
          if (lic.centerId) {
            lic.centerName = name;
            global.LicenseCloud?.saveLocal?.(lic);
          }
          try { global.Organization?.saveDisplayName?.(name); } catch { /* empty */ }
          setStatus('✅ تم تأكيد المؤسسة');
          renderNavButtons(loadWizard());
        });
        if (hasCenterData()) setStatus('✅ بيانات المؤسسة جاهزة');
        break;
      }
      case 'branch': {
        if (hasBranch()) {
          content.innerHTML = `
            <p>يوجد فرع في الترخيص — اربط هذا الجهاز به.</p>
            <div class="form-group"><label>اسم الجهاز</label><input id="bf-device-name" class="form-control" placeholder="Reception-PC"></div>
            <div class="form-group"><label>الفرع</label><select id="bf-branch-id" class="form-control"></select></div>`;
          global.populateDriveBootstrapBranchFields?.(global.LicenseCloud.loadLocal(), 'bf');
          addBtn(actions, '🔗 ربط الجهاز بالفرع', 'btn-primary', () => bindExistingBranch());
        } else {
          content.innerHTML = `
            <p><strong>إنشاء أول فرع</strong> — لا توجد فروع بعد.</p>
            <div class="form-group"><label>اسم الفرع (عربي) *</label><input id="bf-branch-name-ar" class="form-control" required></div>
            <div class="form-group"><label>الاسم بالإنجليزية</label><input id="bf-branch-name-en" class="form-control" dir="ltr"></div>
            <div class="form-group"><label>رمز الفرع</label><input id="bf-branch-code" class="form-control" dir="ltr" placeholder="BR-MAIN"></div>
            <div class="form-group"><label>المدينة</label><input id="bf-branch-city" class="form-control"></div>
            <div class="form-group"><label>الهاتف</label><input id="bf-branch-phone" class="form-control" dir="ltr"></div>
            <div class="form-group"><label>اسم هذا الجهاز *</label><input id="bf-device-name" class="form-control" placeholder="Reception-PC"></div>
            <select id="bf-branch-id" class="form-control" hidden></select>`;
          addBtn(actions, branchCreateInFlight ? '⏳ جارٍ الإنشاء...' : '➕ إنشاء أول فرع وربطه', 'btn-primary', () => createFirstBranchFromForm(), branchCreateInFlight);
        }
        break;
      }
      case 'branch_select': {
        content.innerHTML = `
          <p><strong>اختيار فرع موجود</strong> وربط هذا الجهاز به (ليس إنشاء فرع جديد).</p>
          <div class="form-group"><label>اسم الجهاز</label><input id="bf-device-name" class="form-control" placeholder="Clinic-PC-2"></div>
          <div class="form-group"><label>الفرع الموجود</label><select id="bf-branch-id" class="form-control"></select></div>`;
        const lic = global.LicenseCloud?.loadLocal?.();
        if (lic) global.populateDriveBootstrapBranchFields?.(lic, 'bf');
        if (!hasBranch()) {
          content.innerHTML += '<p class="tdw-field-error">لا توجد فروع — ارجع لمسار عميل جديد أو أنشئ فرعاً من Owner Hub بعد الدخول.</p>';
        }
        addBtn(actions, '🔗 ربط هذا الجهاز بالفرع', 'btn-primary', () => bindExistingBranch(), !hasBranch());
        break;
      }
      case 'owner': {
        if (hasOwnerPasswordAccount()) {
          content.innerHTML = '<p>✅ حساب المالك (Owner) موجود بكلمة مرور. يمكنك المتابعة.</p>';
          setStatus('✅ Owner جاهز');
        } else {
          content.innerHTML = '<p>أنشئ حساب المالك المستقل — كلمة المرور إلزامية.</p>'
            + (global.OwnerCreateForm?.renderFormHtml?.({ idPrefix: 'ocf' }) || '<p>OwnerCreateForm غير محمّل</p>');
          global.OwnerCreateForm?.bindPasswordToggles?.(content);
          addBtn(actions, ownerCreateInFlight ? '⏳ جارٍ الإنشاء...' : '👤 إنشاء حساب المالك', 'btn-primary', () => createOwnerFromWizard(), ownerCreateInFlight);
        }
        break;
      }
      case 'restore': {
        content.innerHTML = '<p>اختر خيار الاستعادة. لا يمكن فتح البرنامج قبل اتخاذ قرار.</p>';
        addBtn(actions, '☁️ استعادة من السحابة', 'btn-primary', async () => {
          setStatus('⏳ جارٍ الاستعادة...');
          try {
            if (global.OpsUxBridge?.openRestoreWizard) {
              await global.OpsUxBridge.openRestoreWizard();
            } else if (global.CloudBootstrap?.hydrateFromDrive) {
              await global.CloudBootstrap.hydrateFromDrive(null, { allowMissingLicense: false });
            }
            const w2 = loadWizard();
            w2.restoreChoice = 'cloud';
            saveWizard(w2);
            setStatus('✅ تم اختيار/تنفيذ الاستعادة من السحابة');
          } catch (e) {
            setStatusFromErr(e, 'restore_interrupted');
          }
          renderNavButtons(loadWizard());
        });
        addBtn(actions, '📭 بدء بقاعدة فارغة', 'btn-secondary', () => {
          const w2 = loadWizard();
          w2.restoreChoice = 'empty';
          saveWizard(w2);
          setStatus('✅ سيتم البدء ببيانات فارغة');
          renderNavButtons(loadWizard());
        });
        if (w.path === PATHS.EXISTING) {
          addBtn(actions, '✔️ البيانات موجودة محلياً', 'btn-ghost', () => {
            const w2 = loadWizard();
            w2.restoreChoice = 'skip_existing';
            saveWizard(w2);
            setStatus('✅ تم تأكيد البيانات الحالية');
            renderNavButtons(loadWizard());
          });
        }
        break;
      }
      case 'sync': {
        content.innerHTML = '<p>نفّذ المزامنة الأولية بعد الاستعادة/البدء.</p>';
        addBtn(actions, '▶️ بدء المزامنة الأولية', 'btn-primary', async () => {
          setStatus('⏳ جارٍ المزامنة...');
          try {
            let ok = true;
            if (global.SyncEngine?.runOnce) {
              const r = await global.SyncEngine.runOnce();
              ok = r?.ok !== false;
            } else if (global.CloudBootstrap?.hydrateFromDrive && loadWizard().restoreChoice === 'cloud') {
              const r = await global.CloudBootstrap.hydrateFromDrive(null, { allowMissingLicense: true });
              ok = !!r?.ok || r?.skipped;
            }
            const bootstrap = await global.ensureCloudBootstrapReady?.();
            if (bootstrap?.runNewDeviceBootstrap) {
              await bootstrap.runNewDeviceBootstrap({
                branchId: global.DeviceConfig?.load?.()?.lockedBranchId,
                startSync: true,
                allowMissingLicense: true
              });
            }
            const w2 = loadWizard();
            w2.syncDone = ok !== false;
            saveWizard(w2);
            setStatus(w2.syncDone ? '✅ اكتملت المزامنة الأولية' : '⚠️ تعذّرت المزامنة');
          } catch (e) {
            setStatusFromErr(e, 'sync_interrupted');
          }
          renderNavButtons(loadWizard());
          renderStepUI(loadWizard());
        });
        if (hasSyncDone()) setStatus('✅ المزامنة مسجّلة كمكتملة');
        break;
      }
      case 'ready': {
        const checks = [
          ['Google', hasGoogle()],
          ['الترخيص', hasValidLicense()],
          ['المؤسسة', hasCenterData()],
          ['الفرع والجهاز', hasDeviceBranch()],
          ['Owner + كلمة مرور', ownerSetupRequirementMet()],
          ['الاستعادة', hasRestoreDecision()],
          ['المزامنة', hasSyncDone()]
        ];
        content.innerHTML = `<ul style="font-size:13px;line-height:1.9">${checks.map(([l, ok]) => `<li>${ok ? '✅' : '❌'} ${l}</li>`).join('')}</ul>
          <p>بعد النجاح سجّل الدخول بحساب المالك. لن يُفتح Dashboard قبل اكتمال الشروط.</p>`;
        addBtn(actions, '🚀 إتمام الإعداد وفتح تسجيل الدخول', 'btn-primary', () => {
          if (!isBootComplete()) {
            setStatus('⚠️ لم تكتمل جميع المتطلبات', true);
            return;
          }
          markBootComplete();
          close({ showLogin: true });
          global.filterLoginUsers?.();
          global.notify?.('✅ اكتمل الإعداد — سجّل الدخول بحساب المالك', 'success');
        }, !isBootComplete());
        break;
      }
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
    const steps = stepsFor(w.path);
    const step = steps[w.currentStep];
    if (!validateStep(step)) {
      setStatusFromErr({ message: 'step_required' }, 'step_required');
      return;
    }
    if (w.currentStep >= steps.length - 1) {
      if (!markBootComplete()) {
        setStatus('⚠️ لم تكتمل جميع متطلبات الإعداد', true);
        return;
      }
      close({ showLogin: true });
      return;
    }
    w = completeCurrentStep(w);
    renderProgress(w);
    renderStepUI(w);
    setStatus('');
  }

  function setBootActive(active) {
    document.body?.classList.toggle('bf-active', !!active);
  }

  function openOverlay(force) {
    if (!force && !needsBootScreen()) return false;
    lastFocusEl = document.activeElement;
    hideBlockingScreens();
    ensureDOM();
    const w = loadWizard();
    if (w.path) {
      showStep('bf-step-wizard');
      renderProgress(w);
      renderStepUI(w);
    } else {
      showStep('bf-step-choose');
    }
    document.getElementById('bootFlowOverlay')?.classList.add('open');
    setBootActive(true);
    const login = document.getElementById('loginScreen');
    if (login) login.classList.add('hidden');
    setTimeout(() => document.getElementById('bf-dialog')?.querySelector('button,input')?.focus?.(), 30);
    return true;
  }

  function open() { return openOverlay(true); }
  function forceOpen() { return openOverlay(true); }

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
    try { lastFocusEl?.focus?.(); } catch { /* empty */ }
    if (forceLogin && typeof global.ensureUserLoginScreenVisible === 'function') {
      global.ensureUserLoginScreenVisible();
    }
  }

  function closeToLogin() {
    close({ showLogin: true });
    global.notify?.('ℹ️ يمكنك إعادة فتح الإعداد من «🚀 بدء الإعداد»', 'info');
  }

  function refreshBootState() {
    if (isBootComplete()) {
      markBootComplete();
      close();
      global.filterLoginUsers?.();
    } else {
      const w = loadWizard();
      if (w.path && document.getElementById('bootFlowOverlay')?.classList.contains('open')) {
        renderProgress(w);
        renderStepUI(w);
      }
    }
  }

  function ensureLoginAccessible() {
    // Do not force-close wizard if activation incomplete — only ensure login DOM usable when shown.
    const login = document.getElementById('loginScreen');
    if (login && !document.getElementById('bootFlowOverlay')?.classList.contains('open')) {
      login.classList.remove('hidden');
      login.style.display = '';
      login.style.pointerEvents = '';
    }
    document.getElementById('centerSetupModal')?.classList.remove('open');
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
    el.innerHTML = '💡 لم يكتمل الإعداد — <button type="button" class="btn btn-primary btn-sm" id="login-open-activation-wizard">🚀 بدء الإعداد الموحّد</button>';
    document.getElementById('login-open-activation-wizard')?.addEventListener('click', () => forceOpen());
  }

  function applyLoginGate() {
    ensureLoginAccessible();
    updateLoginSetupHint();
  }

  // Inventory helpers for tests
  function getStepCatalog() {
    return { NEW_STEPS: NEW_STEPS.slice(), EXISTING_STEPS: EXISTING_STEPS.slice(), STEP_LABELS: { ...STEP_LABELS } };
  }

  global.BootFlow = {
    PATHS,
    NEW_STEPS,
    EXISTING_STEPS,
    open,
    forceOpen,
    close,
    closeToLogin,
    needsBootScreen,
    shouldAutoOpenBoot,
    isBootComplete,
    markBootComplete,
    canShowLogin,
    canOpenDashboard,
    ensureLoginAccessible,
    updateLoginSetupHint,
    applyLoginGate,
    refreshBootState,
    startPath,
    validateStep,
    loadWizard,
    saveWizard,
    getStepCatalog,
    hasOwnerPasswordAccount,
    /** @deprecated alias — prefer hasOwnerPasswordAccount */
    hasOwnerAccount: hasOwnerPasswordAccount,
    hasGoogle,
    hasValidLicense,
    version: 'v2-5.8'
  };
})(typeof window !== 'undefined' ? window : globalThis);
