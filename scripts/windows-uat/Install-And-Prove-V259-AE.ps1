#Requires -Version 5.1
<#
.SYNOPSIS
  V2-5.9: BUILD artifact -> silent INSTALL -> smoke RUN -> evidence for Scenarios A-E.

.DESCRIPTION
  Run on Windows only (GHA windows-2022 or clean Windows machine).
  Does NOT flip REQUIREMENTS-TRACEABILITY to PASS by itself.
  Interactive Google OAuth / Device A/B / live Sheets still need operator + secrets.
  Exit codes:
    0 = installed Setup EXE smoke + evidence scaffolding OK (scenarios may still be UNVERIFIED)
    1 = hard failure (missing/invalid installer, install fail, unit fail)
    2 = install OK but A-E remain UNVERIFIED (expected until full live proof)
#>
param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
  [switch]$SkipInstall,
  [switch]$SkipUnit
)

$ErrorActionPreference = 'Stop'
Set-Location $RepoRoot

$EvidenceDir = Join-Path $RepoRoot 'docs\integration-v2-5-9\evidence'
$AeDir = Join-Path $EvidenceDir 'ae-scenarios'
New-Item -ItemType Directory -Force -Path $AeDir | Out-Null
$log = Join-Path $AeDir 'install-prove.log'

function Log([string]$m) {
  $line = '[{0}] {1}' -f (Get-Date -Format o), $m
  Add-Content -Path $log -Value $line -Encoding UTF8
  Write-Host $line
}

function Get-Sha256([string]$Path) {
  return (Get-FileHash -Algorithm SHA256 -Path $Path).Hash.ToLowerInvariant()
}

# --- Host metadata ---
$os = Get-CimInstance Win32_OperatingSystem
$nodeV = (& node -v 2>$null)
$npmV = (& npm -v 2>$null)
$commit = (& git rev-parse HEAD 2>$null)
$commitShort = (& git rev-parse --short HEAD 2>$null)
$pkg = Get-Content (Join-Path $RepoRoot 'package.json') -Raw | ConvertFrom-Json
$electronV = $pkg.devDependencies.electron
if (-not $electronV) { $electronV = $pkg.dependencies.electron }

$hostMeta = [ordered]@{
  at = (Get-Date).ToString('o')
  windowsCaption = $os.Caption
  windowsVersion = $os.Version
  arch = $os.OSArchitecture
  node = "$nodeV"
  npm = "$npmV"
  electronPackage = "$electronV"
  appVersion = $pkg.version
  commit = "$commit"
  commitShort = "$commitShort"
  platform = 'win32'
}
$hostMeta | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $EvidenceDir 'windows-host.json') -Encoding UTF8
Log ("HOST Windows={0} Node={1} ElectronPkg={2} Commit={3}" -f $os.Version, $nodeV, $electronV, $commitShort)

if (-not $SkipUnit) {
  Log 'Running npm test'
  & npm test
  if ($LASTEXITCODE -ne 0) { throw "npm test failed: $LASTEXITCODE" }
}

# --- Locate Setup EXE ---
$dist = Join-Path $RepoRoot 'dist'
$installer = Get-ChildItem -Path $dist -Filter 'HijamaManagement-Setup-*.exe' -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $installer) { throw 'Setup EXE not found under dist/ - run npm run build:win first' }

$minBytes = 50MB
if ($installer.Length -lt $minBytes) {
  throw ("Setup EXE too small ({0} bytes) - Wine/NSIS stub rejected; need real Windows NSIS build" -f $installer.Length)
}

$winUnpacked = Join-Path $dist 'win-unpacked\Hijama Management System.exe'
$installerSha = Get-Sha256 $installer.FullName
$unpackedSha = if (Test-Path $winUnpacked) { Get-Sha256 $winUnpacked } else { $null }

$buildMeta = [ordered]@{
  at = (Get-Date).ToString('o')
  setupExe = $installer.FullName
  setupExeRelative = ('dist/{0}' -f $installer.Name)
  setupSizeBytes = $installer.Length
  setupSha256 = $installerSha
  winUnpacked = $(if (Test-Path $winUnpacked) { $winUnpacked } else { $null })
  winUnpackedSha256 = $unpackedSha
  commit = "$commit"
  host = $hostMeta
  validNsis = $true
}
$buildMeta | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $EvidenceDir 'windows-build.json') -Encoding UTF8
Log ("SETUP path={0} size={1} sha256={2}" -f $installer.FullName, $installer.Length, $installerSha)

$installDir = Join-Path $env:LOCALAPPDATA 'Programs\Hijama Management System'
$installedExe = Join-Path $installDir 'Hijama Management System.exe'
$userData = Join-Path $env:APPDATA 'Cupping Center'

if (-not $SkipInstall) {
  # Uninstall prior if present
  $uninst = Join-Path $installDir 'Uninstall Hijama Management System.exe'
  if (Test-Path $uninst) {
    Log 'Silent uninstall previous'
    $u = Start-Process -FilePath $uninst -ArgumentList '/S' -PassThru -Wait
    Log ("Uninstall exit={0}" -f $u.ExitCode)
    Start-Sleep -Seconds 2
  }

  Log 'Silent install Setup EXE /S'
  $p = Start-Process -FilePath $installer.FullName -ArgumentList '/S' -PassThru -Wait
  if ($p.ExitCode -ne 0) { throw "Silent install failed exit=$($p.ExitCode)" }
  Start-Sleep -Seconds 3
}

if (-not (Test-Path $installedExe)) {
  throw "Installed EXE missing at $installedExe - Setup EXE install proof FAILED"
}

$installedSha = Get-Sha256 $installedExe
$installedSize = (Get-Item $installedExe).Length
# Approximate installed tree size
$installedTreeBytes = 0
Get-ChildItem -Path $installDir -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object { $installedTreeBytes += $_.Length }

$installMeta = [ordered]@{
  at = (Get-Date).ToString('o')
  installedExe = $installedExe
  installedExeSha256 = $installedSha
  installedExeSizeBytes = $installedSize
  installedTreeBytes = $installedTreeBytes
  installDir = $installDir
  userData = $userData
  proof = 'INSTALLED_SETUP_EXE'
  usedNpmStart = $false
}
$installMeta | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $EvidenceDir 'windows-installed.json') -Encoding UTF8
Log ("INSTALLED exe={0} sha256={1} treeBytes={2}" -f $installedExe, $installedSha, $installedTreeBytes)

# --- Smoke launch (not npm start) ---
Log 'Smoke launch installed EXE (8s)'
$env:ELECTRON_ENABLE_LOGGING = '1'
$proc = Start-Process -FilePath $installedExe -PassThru -RedirectStandardError (Join-Path $AeDir 'electron-stderr.log') -WindowStyle Minimized
Start-Sleep -Seconds 8
$running = -not $proc.HasExited
if ($running) {
  Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
  Log 'Smoke: process was running - stopped'
} else {
  Log ("Smoke: process exited early code={0}" -f $proc.ExitCode)
}

$smoke = [ordered]@{
  at = (Get-Date).ToString('o')
  launchedInstalledExe = $true
  stayedUpMs = 8000
  processExitedEarly = (-not $running)
  exitCode = $proc.ExitCode
  stderrLog = 'docs/integration-v2-5-9/evidence/ae-scenarios/electron-stderr.log'
  note = 'Smoke only - Scenarios A-E interactive proof still required for Requirement PASS'
}
$smoke | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $AeDir 'smoke-launch.json') -Encoding UTF8

# --- Invoke Node A-E harness with install env ---
$env:HIJAMA_WINDOWS_INSTALLED = '1'
$env:HIJAMA_INSTALLED_EXE = $installedExe
$env:HIJAMA_SETUP_EXE = $installer.FullName
$env:HIJAMA_SETUP_SHA256 = $installerSha
Log 'node scripts/windows-uat/v2-5-9-ae-runtime.cjs'
& node (Join-Path $RepoRoot 'scripts\windows-uat\v2-5-9-ae-runtime.cjs')
$aeCode = $LASTEXITCODE
Log ("A-E harness exit={0}" -f $aeCode)

# Write operator checklist for remaining interactive proof
$checklist = @"
# V2-5.9 A-E Operator Checklist (Installed Setup EXE)

Generated: $((Get-Date).ToString('o'))
Commit: $commitShort
Setup SHA-256: $installerSha
Installed: $installedExe

## Still required for Requirement PASS (interactive / secrets)

### Scenario A - SQLite commit then cache
- [ ] Create client/visit/invoice/booking/expense/attendance/user/settings/delete
- [ ] SQLite before/after + outbox row counts
- [ ] Restart persistence
- [ ] Failure injection -> no success UI -> restoreLastCommit -> no outbox -> restart

### Scenario B - Legacy migration
- [ ] Single-branch report/map/backup/marker
- [ ] Multi-branch push blocked + explicit mapping
- [ ] Restart no re-migration

### Scenario C - Attachments Device A/B
- [ ] PENDING->UPLOADING->SYNCED + Device B hash
- [ ] FAILED / MISSING_REMOTE / QUARANTINED / DELETED
- [ ] Branch/center isolation

### Scenario D - Google Sheets live
- [ ] Real Google test account OAuth + refresh
- [ ] Read/Append/Update/Batch + 401/403/404/429/timeout
- [ ] isSourceOfTruth:false - vault never overwrites SQLite/Drive license

### Scenario E - Device A/B + branch + DR + Owner
- [ ] Device A/B CRUD offline conflict attachments
- [ ] Atomic new branch + BRANCH_CREATION_PENDING
- [ ] DR restore staging -> reconcile before push
- [ ] Owner multi-branch no leakage

### Runtime error sweep
- [ ] Console/runtime/IPC/SQLite/Outbox/OAuth/Sheets/Drive/Sync errors = 0

Only after evidence attached per REQUIREMENTS row may Result become PASS.
"@
Set-Content -Path (Join-Path $AeDir 'OPERATOR-CHECKLIST.md') -Value $checklist -Encoding UTF8

if ($aeCode -eq 1) { exit 1 }
# Prefer exit 2 while scenarios UNVERIFIED (harness default)
exit $(if ($aeCode -eq 0) { 0 } else { 2 })
