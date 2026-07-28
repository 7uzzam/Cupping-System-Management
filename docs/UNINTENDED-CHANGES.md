# Unintended Changes Report — Phase 1 → Phase Zero NextGen

| Item | Value |
|------|-------|
| **Original** | `ed5d6f3` (Phase 1 stabilize) |
| **Current** | `09244f5` (Phase Zero NextGen) |
| **Total files changed** | 261 |
| **Total insertions** | 53,859 |
| **Total deletions** | 692 |

---

## Methodology

Every line of the `git diff` between the Phase 1 baseline and the current branch was analyzed for changes that were **not explicitly requested** by the user. The original Phase 1 baseline is treated as the authoritative visual and functional reference for all components not explicitly targeted for modification.

---

## Unintended Changes Found

### 1. Receipt English Center Name Fallback

| Detail | Value |
|--------|-------|
| **File** | `index.html` |
| **Lines** | ~9981 (defaultSettings), ~18829 (buildReceiptHTML) |
| **Original** | `settings.centerNameEn \|\| 'Cupping Center'` |
| **Current** | `settings.centerNameEn \|\| APP_META.productName \|\| 'Hijama Management System'` |
| **Category** | C — Unintended side-effect |
| **Severity** | Medium |
| **Impact** | Receipts show "Hijama Management System" instead of "Cupping Center" when English name is not set |
| **Affected users** | Only those who never set `settings.centerNameEn` |
| **Restoration** | Revert to `'Cupping Center'` or `''` |

### 2. defaultSettings.centerNameEn Default Value

| Detail | Value |
|--------|-------|
| **File** | `index.html` |
| **Line** | ~9981 |
| **Original** | `''` (empty string) |
| **Current** | `APP_META.productName \|\| 'Hijama Management System'` |
| **Category** | C — Unintended |
| **Severity** | Low |
| **Impact** | New installations get a non-empty English name by default |
| **Restoration** | Revert to `''` |

---

## Confirmed NOT Unintended (Verified Requested)

The following changes were verified as explicitly requested or necessary technical fixes:

| Change | Verification |
|--------|-------------|
| Login setup panel hidden | User requested: hide until needed |
| Branch fields hidden until pull | User requested: pull license first, then branch |
| Drive bootstrap order change | User requested: Google → pull → branch (not branch → pull) |
| Typo الترخiص → الترخيص | Pure bugfix (Latin i → Arabic ي) |
| Booking statuses expanded | Functional feature (completed/cancelled) |
| License check timeout | User reported: stuck on "جارٍ التحقق..." |
| Blank screen prevention | User reported: blank viewport after closing activation |
| syncCloudStatusFromElectron fix | User reported: Google required after connecting |
| Owner Hub new sections | User requested: Owner account per NextGen plan |
| User management protection | Security: prevent admin demotion |
| License wipe expanded keys | Required for new Owner/boot modules |
| CSP allows script.google.com | User reported: "Failed to fetch" on activation |
| NSIS uninstall wipe | User reported: data surviving uninstall |
| license.json Drive push | User reported: not uploaded on activation |
| Owner bootstrap gate | User reported: skip showed "صلاحية المالك مطلوبة" |

---

## Changes NOT Found (Explicitly Verified Absent)

| Area | Status |
|------|--------|
| CSS rules (any file) | ✅ Zero changes |
| Font families | ✅ Zero changes |
| Font sizes | ✅ Zero changes |
| Colors / theme variables | ✅ Zero changes |
| Layout / grid / flexbox | ✅ Zero changes |
| Spacing (margin/padding/gap) | ✅ Zero changes |
| Border / shadow / radius | ✅ Zero changes |
| Print styles (@media print) | ✅ Zero changes |
| Responsive breakpoints | ✅ Zero changes |
| QR code (library/size/data) | ✅ Zero changes |
| Invoice template HTML | ✅ Zero changes (except cnEn fallback) |
| Invoice settings keys | ✅ Zero changes |
| Tax calculation | ✅ Zero changes |
| 58mm/80mm width | ✅ Zero changes |
| Thermal print options | ✅ Zero changes |
| Silent print | ✅ Zero changes |
| Theme system | ✅ Zero changes |
| Zoom / scale factor | ✅ Zero changes |
| BrowserWindow size | ✅ Zero changes |
| Device scale factor | ✅ Zero changes |
| Table styles | ✅ Zero changes |
| Modal styles | ✅ Zero changes |
| Button styles | ✅ Zero changes |
| Sidebar styles | ✅ Zero changes |
| Navigation styles | ✅ Zero changes |

---

## Restoration Plan

### Group 1 — Restore Exactly (2 items)

| # | What | Action | File | Severity |
|---|------|--------|------|----------|
| 1 | `buildReceiptHTML` cnEn fallback | Revert `APP_META.productName \|\| 'Hijama Management System'` → `'Cupping Center'` | `index.html:~18829` | Medium |
| 2 | `defaultSettings.centerNameEn` | Revert `APP_META.productName \|\| ...` → `''` | `index.html:~9981` | Low |

### Group 2 — Keep Current (all other changes)

All 41 remaining changes are either:
- Explicitly requested features (Owner Hub, Drive push, bootstrap order, booking statuses)
- Critical bugfixes (blank screen, stuck license check, Google sync, NSIS wipe)
- Security hardening (CSP, user protection, Electron security)

### Group 3 — Merge Carefully

None. The only unintended changes are simple value reversions.

### Group 4 — User Decision Required

None. The two unintended changes have clear restoration paths.

---

## Risk Assessment

| Risk | Level | Reason |
|------|-------|--------|
| CSS visual regression | **None** | Zero CSS changes |
| Invoice layout break | **None** | Template HTML unchanged |
| QR readability | **None** | Zero QR changes |
| Font rendering | **None** | Zero font changes |
| Theme corruption | **None** | Zero theme changes |
| Print output change | **Low** | Only English name fallback (if not custom-set) |
| Settings migration break | **None** | No key renames or schema changes |
| Data loss | **None** | No destructive changes to business data |
