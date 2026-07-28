# Cupping / Hijama Management System

Electron desktop app (Arabic, right-to-left) for managing a cupping/Hijama clinic
(clients, cases, invoices, employees/payroll, backups, messaging). Package name
`hijama-management-system`. The whole project lives at the repo root; the UI is a
single large `index.html` SPA plus many `cupping-*.js`, `cloud/*.js`, `license/**`
and `import-studio/*` modules loaded via `<script src>`. The Electron shell lives in
`electron/` (`electron/main.js` is `main`).

## Cursor Cloud specific instructions

Standard scripts are defined in `package.json`; prefer those. Key ones:
- Run (dev): `npm start` (= `electron .`). This is a GUI app — a display is present
  at `DISPLAY=:1`. In this headless VM launch with extra flags:
  `DISPLAY=:1 npm start -- --no-sandbox --disable-gpu`.
- Lint: none configured (no ESLint/Prettier in the repo).
- Tests (Node scripts, no framework): `npm run license:test` (130 checks),
  and the `npm run verify:*` scripts (`verify:attendance`, `verify:ledger`,
  `verify:tax-invoice`, `verify:import-studio`, `verify:client-import`, etc.).
- Browser-mode validation: `npm run devpanel:validate` loads `index.html` in
  headless Chromium via Playwright and exercises the licensing/dev panel.

Non-obvious caveats:
- The repository originally shipped as a single `Cupping System Management.zip`.
  It has been extracted into the repo root so it is a normal project tree.
- `npm run build` / `build:*` target **Windows** (`electron-builder --win` → NSIS
  installer) and will not produce a runnable app on Linux. For development, only the
  dev run (`npm start`) is used; do not rely on `build` here.
- Playwright needs its browser binary: `npx playwright install chromium` (already in
  the update script). Required for `devpanel:validate` and for reliably driving the
  SPA in Chromium.
- Electron `file://` flakiness: in this VM, `npm start` intermittently fails to load
  a random subset of the ~120 external `<script src>` modules
  (`net::ERR_FAILED`), leaving globals such as `EmployeeLedger` / `formatDateISO`
  undefined even though the window renders. Headless/headed **Chromium loads the same
  `index.html` reliably** over `file://`. The app is a supported browser SPA (see
  `pat-reports/BROWSER-ELECTRON-COMPATIBILITY.md`), so for reliable end-to-end testing
  of core clinic features, load `file:///workspace/index.html` in Chromium (e.g. via
  Playwright) rather than depending on the Electron renderer. Electron is still the
  real product and does render/run; it is just not reliable for loading every module
  in this sandbox.
- Licensing gate: non-employee accounts cannot log in until the app is activated.
  For local dev you do NOT need Google Drive or a real key — the app's built-in
  offline activation works: with `index.html` loaded, run in the page
  `document.getElementById('lic-type').value='365'; await licActivate();` to write a
  local full-edition license to `localStorage`. Run this in **Chromium** — under the
  Electron renderer `licActivate()` can throw `formatDate is not defined` due to the
  `file://` module-flakiness above, which is another reason to use Chromium for E2E.
  A verified end-to-end path (used to smoke-test the env): seed license → reload →
  set `#login-role='admin'` + `filterLoginUsers()` + `#login-username=<admin id>` +
  `#login-password='admin123'` + `doLogin()` → `showPage('doctors')` +
  `openDoctorModal()` + fill `#d-name`/`#d-specialty` + `saveDoctor()` →
  `showPage('daily')` + fill `#f-name`/`#f-doctor`/`#f-cups` + `saveCase()`, which
  generates an invoice (e.g. `TM-2026-0001`) and auto-creates the client. (The shipped test key in
  `license/data/license-registry/L000001.json` is `DEVICE_ANY`/multi-branch, which the
  activation gate forces through Google Drive — avoid it for offline dev.)
- Default users (from `defaultUsers` in `index.html`): `admin` / `admin123` and
  `reception` / `1234`. Log in by selecting role "مدير النظام" (admin) + the user +
  password.
- Creating a case (`saveCase`, the core "new client" action on the "السجل اليومي"
  page) requires at least one specialist to exist (`doctors`) plus a cups count.
  Add a specialist first (settings → الموظفين, or `saveDoctor`). Saving a case
  auto-creates the client in `clientsRegistry` and generates an invoice.
- App data (users, license, clients, cases) is stored in `localStorage` under
  `~/.config/Hijama Management System`. Delete that folder to reset to first-run.
