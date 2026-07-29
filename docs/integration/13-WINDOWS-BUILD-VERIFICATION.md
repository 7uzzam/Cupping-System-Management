# Windows Build Verification

## Executed in this environment (Linux)

```bash
HYBRID_DISABLE_RCEDIT=1 npm run build:dir
```

**Result:** PASS — produced `dist/win-unpacked/Hijama Management System.exe`

Packaged verified in `app.asar`:
- `assets/fonts/*.woff2`
- local QR vendor assets / cupping scripts (via package files globs)
- `database/**/*`, `electron/**/*`

## Icon embed note

On Linux CI, `run-win-build.cjs` forces `signAndEditExecutable=false` to avoid Wine/rcedit failures.
On **Windows** production builds, package.json declares `signAndEditExecutable=true` so rcedit embeds `Program-Icon.ico`.

`BrowserWindow.icon` is set for window/taskbar fallback.

## Windows host checklist (required before Stable)

| Check | Status here |
|-------|-------------|
| EXE icon | CONFIG PASS / RUNTIME PENDING Windows |
| Installer icon | CONFIG PASS / RUNTIME PENDING |
| Shortcut icon | PENDING Windows install |
| Taskbar icon | PENDING |
| Title bar icon | BrowserWindow set; PENDING visual |
| ARP icon | PENDING |
| Uninstaller icon | CONFIG PASS / RUNTIME PENDING |
| Offline fonts | ASAR PASS |
| Offline QR | ASAR + tests PASS |
| Installed app smoke | PENDING Windows |
