# Mobile operator note — Actions quota + Setup EXE delivery

**Updated:** 2026-08-02

## Does making the repo Public fix the quota?

| Item | Private (current) | Public |
|------|-------------------|--------|
| Actions **minutes** (Windows runners) | Count against free/paid minutes | Generally **free** for standard public runners |
| Actions **artifact storage** (~500MB free account) | Counts (this blocked ~106MB×2 uploads) | **Still usually counts** toward account storage |
| **GitHub Release** assets (Setup EXE) | OK; download needs login if private | Anyone can download the EXE |

**Verdict:** Public helps minutes and makes EXE links easier to share, but it is **not required** and does **not** by itself clear artifact storage. Prefer the Release channel below. Do **not** make Public only for quota if you are not ready to expose source.

## What we changed in CI

1. Job **deletes old `setup-exe` Actions artifacts** at start (frees quota automatically).
2. **Stops uploading** the large Setup EXE as an Actions artifact.
3. Publishes Setup EXE to a **GitHub prerelease**: tag `uat-v2-5-10-<run_id>`.

Release assets do **not** use the Actions artifact storage bucket.

## From your phone (no laptop)

### A) Delete leftover artifacts now (one-time)

Open each run → Artifacts → Delete `setup-exe`:

- https://github.com/7uzzam/Cupping-System-Management/actions/runs/30724061078
- https://github.com/7uzzam/Cupping-System-Management/actions/runs/30724059683

Or GitHub → repo → **Actions** → **Artifacts** (if shown) → delete large items.

After the next successful push workflow starts, the new cleanup step should delete remaining `setup-exe` artifacts by itself.

### B) Get the Setup EXE after the next green build step

1. Open https://github.com/7uzzam/Cupping-System-Management/releases  
2. Find prerelease **UAT Setup EXE — V2-5.10 run …**  
3. Download `HijamaManagement-Setup-*.exe` (save to Files / Drive / send to the Windows PCs)  
4. On Device A/B: install that EXE and follow `OPERATOR-LIVE-UAT.md`

Job may still end red because Release Gate fails while A–E are UNVERIFIED — that is expected. If **Publish Setup EXE to GitHub Release** succeeded, the EXE is on Releases anyway.

## Honest reminder

Downloading the EXE ≠ Production Candidate. You still need live A–E evidence on Installed Setup EXE.
