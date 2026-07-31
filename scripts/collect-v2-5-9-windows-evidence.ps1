#Requires -Version 5.1
<#
.SYNOPSIS
  Collect V2-5.9 Windows build/runtime evidence (run on Windows only).

.DESCRIPTION
  Does NOT mark requirements PASS. Fills MACHINE + BUILD stubs under
  docs/integration-v2-5-9/evidence/ for a human UAT operator to complete flows.
#>
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$EvidenceDir = Join-Path $Root "docs/integration-v2-5-9/evidence"
New-Item -ItemType Directory -Force -Path $EvidenceDir | Out-Null

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$out = Join-Path $EvidenceDir "windows-machine-$stamp.md"

$os = Get-CimInstance Win32_OperatingSystem
$cs = Get-CimInstance Win32_ComputerSystem
$node = & node -v 2>$null
$npm = & npm -v 2>$null

@"
# V2-5.9 Windows machine evidence — $stamp

| Field | Value |
|-------|-------|
| Computer | $($cs.Name) |
| Windows | $($os.Caption) $($os.Version) |
| Arch | $($os.OSArchitecture) |
| Node | $node |
| npm | $npm |
| Display scaling | (set manually: 100/125/150/175) |
| Resolution tested | (set manually) |

## Build commands (run next)

``````
npm ci
npm test
npm run build:win
``````

## After build — fill

| Field | Value |
|-------|-------|
| Setup EXE | |
| SHA-256 | |
| win-unpacked | |
| Electron | (from package / about) |

## UAT status

All flows remain UNVERIFIED until LIVE-WINDOWS-UAT.md and REQUIREMENTS-TRACEABILITY.md are filled with PASS evidence and gate exits 0.
"@ | Set-Content -Path $out -Encoding UTF8

Write-Host "Wrote $out"
Write-Host "Next: complete Old/New customer, Owner force-change, Owner Hub, Sync, Responsive on Setup EXE."
Write-Host "Do NOT claim V2-5.9 complete until verify-v2-5-9-completion.cjs exits 0."
