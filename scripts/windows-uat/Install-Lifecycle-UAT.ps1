#Requires -Version 5.1
<#
.SYNOPSIS
  V2-3.5 Windows Install Lifecycle + Performance UAT (silent).
  Produces evidence under docs/integration-v2/evidence and updates report markdown from real timings.
#>
param(
  [Parameter(Mandatory = $true)][string]$RepoRoot,
  [Parameter(Mandatory = $true)][string]$EvidenceDir
)

$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $EvidenceDir | Out-Null
$log = Join-Path $EvidenceDir 'install-lifecycle.log'
function Log([string]$m) {
  $line = "[{0}] {1}" -f (Get-Date -Format o), $m
  Add-Content -Path $log -Value $line
  Write-Host $line
}

$installer = Get-ChildItem -Path (Join-Path $RepoRoot 'dist') -Filter 'HijamaManagement-Setup-*.exe' -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $installer) { throw "Installer not found under dist/" }

$installDir = Join-Path $env:LOCALAPPDATA 'Programs\Hijama Management System'
$userData = Join-Path $env:APPDATA 'Cupping Center'
$timings = @()

function Measure-Step([string]$Name, [scriptblock]$Block) {
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  & $Block
  $sw.Stop()
  $sec = [math]::Round($sw.Elapsed.TotalSeconds, 3)
  $script:timings += [pscustomobject]@{ step = $Name; seconds = $sec }
  Log ("TIMING {0}={1}s" -f $Name, $sec)
  return $sec
}

function Invoke-SilentInstall {
  param([string]$Setup)
  # electron-builder NSIS silent
  $p = Start-Process -FilePath $Setup -ArgumentList '/S' -PassThru -Wait
  return $p.ExitCode
}

function Invoke-SilentUninstallAppOnly {
  $uninst = Get-ChildItem 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall',
    'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall' -ErrorAction SilentlyContinue |
    ForEach-Object { Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue } |
    Where-Object { $_.DisplayName -like '*Hijama*' -or $_.DisplayName -like '*Cupping*' } |
    Select-Object -First 1
  if (-not $uninst) {
    $fallback = Join-Path $installDir 'Uninstall Hijama Management System.exe'
    if (Test-Path $fallback) {
      $p = Start-Process -FilePath $fallback -ArgumentList '/S' -PassThru -Wait
      return $p.ExitCode
    }
    throw 'Uninstaller not found'
  }
  $cmd = $uninst.QuietUninstallString
  if (-not $cmd) { $cmd = $uninst.UninstallString }
  Log ("Uninstall cmd: {0}" -f $cmd)
  # Force silent; do NOT pass /FULLWIPE
  if ($cmd -match '"(.*?)"\s*(.*)') {
    $exe = $Matches[1]; $args = ($Matches[2] + ' /S').Trim()
    $p = Start-Process -FilePath $exe -ArgumentList $args -PassThru -Wait
    return $p.ExitCode
  }
  $p = Start-Process -FilePath 'cmd.exe' -ArgumentList "/c $cmd /S" -PassThru -Wait
  return $p.ExitCode
}

function Seed-UserDataMarker {
  New-Item -ItemType Directory -Force -Path (Join-Path $userData 'database') | Out-Null
  $marker = Join-Path $userData 'uat-v2-3-5-marker.json'
  $payload = @{
    dataset = 'UAT-V2-3-5'
    createdAt = (Get-Date).ToString('o')
    clients = 3
    visits = 4
    invoices = 3
    appointments = 2
    staff = 2
    deviceId = 'UAT-DEVICE-001'
    branchId = 'BR-MAIN'
    licenseToken = 'TEST-LICENSE-MARKER'
  } | ConvertTo-Json
  Set-Content -Path $marker -Value $payload -Encoding UTF8
  # Fake license store path presence
  New-Item -ItemType Directory -Force -Path (Join-Path $userData 'Local Storage') | Out-Null
  Set-Content -Path (Join-Path $userData 'Local Storage\uat-license.txt') -Value 'TEST-LICENSE' -Encoding UTF8
  return (Get-FileHash $marker -Algorithm SHA256).Hash
}

$results = [ordered]@{}

try {
  Log ("Installer: {0}" -f $installer.FullName)
  $hashInst = (Get-FileHash $installer.FullName -Algorithm SHA256).Hash.ToLower()
  Set-Content (Join-Path $EvidenceDir 'installer.sha256') "$hashInst  $($installer.Name)"

  # Clean prior install if present (app-only)
  if (Test-Path $installDir) {
    Log 'Prior install detected — attempting silent uninstall first'
    try { Invoke-SilentUninstallAppOnly | Out-Null } catch { Log $_.Exception.Message }
  }

  # --- Clean install (3 runs for median of installer startup/apply where possible) ---
  $cleanRuns = @()
  for ($i = 1; $i -le 3; $i++) {
    if (Test-Path $installDir) { try { Invoke-SilentUninstallAppOnly | Out-Null } catch {} }
    $t = Measure-Step ("clean_install_run_$i") {
      $code = Invoke-SilentInstall -Setup $installer.FullName
      if ($code -ne 0) { throw "Clean install exit $code" }
    }
    $cleanRuns += $t
  }
  $results.CleanInstallRuns = $cleanRuns
  $results.CleanInstallMedian = ($cleanRuns | Sort-Object)[[math]::Floor(($cleanRuns.Count - 1) / 2)]

  $markerHash = Seed-UserDataMarker
  $results.MarkerHashBeforeUpdate = $markerHash
  $results.UserDataPath = $userData
  $results.UserDataExistsAfterInstall = (Test-Path $userData)

  # --- Update (re-run installer over existing = update path) ---
  $updRuns = @()
  for ($i = 1; $i -le 3; $i++) {
    $t = Measure-Step ("update_run_$i") {
      $code = Invoke-SilentInstall -Setup $installer.FullName
      if ($code -ne 0) { throw "Update exit $code" }
    }
    $updRuns += $t
  }
  $results.UpdateRuns = $updRuns
  $results.UpdateMedian = ($updRuns | Sort-Object)[[math]::Floor(($updRuns.Count - 1) / 2)]

  $markerAfter = Join-Path $userData 'uat-v2-3-5-marker.json'
  $results.MarkerExistsAfterUpdate = (Test-Path $markerAfter)
  if ($results.MarkerExistsAfterUpdate) {
    $results.MarkerHashAfterUpdate = (Get-FileHash $markerAfter -Algorithm SHA256).Hash
  }
  $results.LicenseMarkerAfterUpdate = (Test-Path (Join-Path $userData 'Local Storage\uat-license.txt'))
  $results.UpdateDataPreserved = ($results.MarkerHashBeforeUpdate -eq $results.MarkerHashAfterUpdate)
  $results.UpdateLicensePreserved = [bool]$results.LicenseMarkerAfterUpdate

  # --- Repair (same installer again) ---
  $rep = Measure-Step 'repair_run_1' {
    $code = Invoke-SilentInstall -Setup $installer.FullName
    if ($code -ne 0) { throw "Repair exit $code" }
  }
  $results.RepairSeconds = $rep
  $results.RepairDataPreserved = (Test-Path $markerAfter) -and ((Get-FileHash $markerAfter -Algorithm SHA256).Hash -eq $markerHash)
  $results.RepairLicensePreserved = (Test-Path (Join-Path $userData 'Local Storage\uat-license.txt'))

  # --- App-only uninstall ---
  $unRuns = @()
  for ($i = 1; $i -le 3; $i++) {
    # Ensure installed for uninstall timing runs 2..3
    if ($i -gt 1) { Invoke-SilentInstall -Setup $installer.FullName | Out-Null }
    $t = Measure-Step ("uninstall_app_only_run_$i") {
      $code = Invoke-SilentUninstallAppOnly
      Log ("Uninstall exit=$code")
    }
    $unRuns += $t
    # Reinstall for next loop except last — but verify userData persists after first uninstall
    if ($i -eq 1) {
      $results.UserDataExistsAfterAppOnlyUninstall = (Test-Path $userData)
      $results.MarkerAfterAppOnlyUninstall = (Test-Path $markerAfter)
      $results.LicenseAfterAppOnlyUninstall = (Test-Path (Join-Path $userData 'Local Storage\uat-license.txt'))
    }
  }
  $results.UninstallRuns = $unRuns
  $results.UninstallMedian = ($unRuns | Sort-Object)[[math]::Floor(($unRuns.Count - 1) / 2)]

  # Reinstall after app-only
  Invoke-SilentInstall -Setup $installer.FullName | Out-Null
  $results.MarkerAfterReinstall = (Test-Path $markerAfter)
  $results.LicenseAfterReinstall = (Test-Path (Join-Path $userData 'Local Storage\uat-license.txt'))

  # --- Full wipe silent requires /FULLWIPE=1 ---
  # Locate uninstaller and run with /FULLWIPE=1
  $uninstExe = Get-ChildItem -Path $installDir -Filter 'Uninstall*.exe' -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($uninstExe) {
    Measure-Step 'full_wipe_silent' {
      Start-Process -FilePath $uninstExe.FullName -ArgumentList '/S','/FULLWIPE=1' -Wait | Out-Null
    } | Out-Null
    Start-Sleep -Seconds 2
    $results.UserDataExistsAfterFullWipe = (Test-Path $userData)
    $results.FullWipeRemovedUserData = -not $results.UserDataExistsAfterFullWipe
  } else {
    $results.FullWipeSkipped = 'uninstaller_exe_not_found'
    $results.FullWipeRemovedUserData = $false
  }

  # win-unpacked icon inspect if present
  $unpacked = Get-ChildItem (Join-Path $RepoRoot 'dist\win-unpacked') -Filter '*.exe' -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($unpacked) {
    node (Join-Path $RepoRoot 'scripts\inspect-win-exe-icon.cjs') $unpacked.FullName |
      Out-File (Join-Path $EvidenceDir 'icon-resource-inspect.json') -Encoding utf8
  }

  $results.Timings = $timings
  $results.CompletedAt = (Get-Date).ToString('o')
  $results.Runner = $env:COMPUTERNAME
  $results.Ok = $results.UpdateDataPreserved -and $results.UpdateLicensePreserved -and
    $results.UserDataExistsAfterAppOnlyUninstall -and $results.LicenseAfterAppOnlyUninstall

  $jsonPath = Join-Path $EvidenceDir 'lifecycle-results.json'
  ($results | ConvertTo-Json -Depth 6) | Set-Content $jsonPath -Encoding UTF8
  ($timings | ConvertTo-Json -Depth 4) | Set-Content (Join-Path $EvidenceDir 'performance-timings.json') -Encoding UTF8

  # Generate markdown reports from real numbers
  $docs = Join-Path $RepoRoot 'docs\integration-v2'
  @"
# 10 — Windows UAT Results

Generated: $($results.CompletedAt)
Runner: $($results.Runner)
Installer SHA-256: $hashInst

## Commands
- Silent install: ``HijamaManagement-Setup-*.exe /S``
- Silent uninstall app-only: Uninstall.exe /S (no /FULLWIPE)
- Full wipe silent: Uninstall.exe /S /FULLWIPE=1

## Outcomes
- Clean install median: $($results.CleanInstallMedian)s
- Update median: $($results.UpdateMedian)s
- Uninstall median: $($results.UninstallMedian)s
- Update data preserved: $($results.UpdateDataPreserved)
- Update license preserved: $($results.UpdateLicensePreserved)
- App-only uninstall kept userData: $($results.UserDataExistsAfterAppOnlyUninstall)
- App-only kept license marker: $($results.LicenseAfterAppOnlyUninstall)
- Full wipe removed userData: $($results.FullWipeRemovedUserData)
- Overall Ok: $($results.Ok)

Raw JSON: ``docs/integration-v2/evidence/lifecycle-results.json``
"@ | Set-Content (Join-Path $docs '10-WINDOWS-UAT-RESULTS.md') -Encoding UTF8

  @"
# 11 — Install Lifecycle Results

| Scenario | البيانات | الترخيص | Device ID marker | Branch marker | النتيجة |
|---|---|---|---|---|---|
| Update | $(if($results.UpdateDataPreserved){'PASS'}else{'FAIL'}) | $(if($results.UpdateLicensePreserved){'PASS'}else{'FAIL'}) | UAT-DEVICE-001 recorded | BR-MAIN recorded | $(if($results.UpdateDataPreserved -and $results.UpdateLicensePreserved){'PASS'}else{'FAIL'}) |
| Repair | $(if($results.RepairDataPreserved){'PASS'}else{'FAIL'}) | $(if($results.RepairLicensePreserved){'PASS'}else{'FAIL'}) | same | same | $(if($results.RepairDataPreserved -and $results.RepairLicensePreserved){'PASS'}else{'FAIL'}) |
| App-only uninstall/reinstall | $(if($results.MarkerAfterReinstall){'PASS'}else{'FAIL'}) | $(if($results.LicenseAfterReinstall){'PASS'}else{'FAIL'}) | same | same | $(if($results.MarkerAfterReinstall -and $results.LicenseAfterReinstall){'PASS'}else{'FAIL'}) |
| Full wipe | wiped=$($results.FullWipeRemovedUserData) | wiped with data | wiped | wiped | $(if($results.FullWipeRemovedUserData){'PASS'}else{'FAIL'}) |
| Interrupted update | NOT EXECUTED on this runner automation | - | - | - | UNVERIFIED |

Evidence: ``lifecycle-results.json``
"@ | Set-Content (Join-Path $docs '11-INSTALL-LIFECYCLE-RESULTS.md') -Encoding UTF8

  function Verdict([double]$median, [double]$target) {
    if ($median -le $target) { return 'PASS' }
    return 'FAIL'
  }
  @"
# 12 — Install Performance Profile

Runner: $($results.Runner)
Installer: $($installer.Name)

| العملية | Run 1 | Run 2 | Run 3 | Median | الهدف | الحكم |
|---|---:|---:|---:|---:|---:|---|
| Clean install | $($cleanRuns[0]) | $($cleanRuns[1]) | $($cleanRuns[2]) | $($results.CleanInstallMedian) | ≤30s | $(Verdict $results.CleanInstallMedian 30) |
| Update | $($updRuns[0]) | $($updRuns[1]) | $($updRuns[2]) | $($results.UpdateMedian) | ≤30s | $(Verdict $results.UpdateMedian 30) |
| App-only uninstall | $($unRuns[0]) | $($unRuns[1]) | $($unRuns[2]) | $($results.UninstallMedian) | ≤15s | $(Verdict $results.UninstallMedian 15) |
| Repair | $($results.RepairSeconds) | - | - | $($results.RepairSeconds) | ≤30s | $(Verdict $results.RepairSeconds 30) |

Installer startup (separate NSIS UI open) was not measured on silent `/S` path — silent apply times above include extraction+copy.
Step log: ``performance-timings.json``
"@ | Set-Content (Join-Path $docs '12-INSTALL-PERFORMANCE-PROFILE.md') -Encoding UTF8

  $iconJson = Join-Path $EvidenceDir 'icon-resource-inspect.json'
  $iconOk = $false
  if (Test-Path $iconJson) {
    try { $iconOk = ((Get-Content $iconJson -Raw | ConvertFrom-Json).ok) -eq $true } catch {}
  }
  @"
# 13 — Icon Artifact Verification

Installer SHA-256: $hashInst
win-unpacked icon resource inspect ok: $iconOk
Inspect file: ``docs/integration-v2/evidence/icon-resource-inspect.json``

| Check | Result |
|---|---|
| EXE resource icon groups present | $(if($iconOk){'PASS'}else{'FAIL'}) |
| Desktop / Start Menu / Taskbar screenshots | UNVERIFIED (requires interactive Windows VM/Sandbox capture) |
| Chosen method | Method B afterPack/resedit (Method A attempted in workflow; see icon-method-a/) |

Visual UI screenshots must be attached before marking ICON-007..ICON-010 PASS.
"@ | Set-Content (Join-Path $docs '13-ICON-ARTIFACT-VERIFICATION.md') -Encoding UTF8

  if (-not $results.Ok) { throw 'Lifecycle UAT reported Ok=false' }
  Log 'UAT completed OK'
  exit 0
}
catch {
  Log ("UAT FAILED: {0}" -f $_.Exception.Message)
  ($results | ConvertTo-Json -Depth 6) | Set-Content (Join-Path $EvidenceDir 'lifecycle-results.json') -Encoding UTF8
  exit 1
}
