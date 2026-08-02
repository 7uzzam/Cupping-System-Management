# V2-6 Repository Transition — Release Migration Plan

**Status:** OWNER-REQUESTED EARLY PREP (agent cannot create the new GitHub repo)  
**Source repo (archive after cutover):** `https://github.com/7uzzam/Cupping-System-Management`  
**Suggested new repo name:** `Tadawi-Clinic-Production` (or `Hijama-Management-Production`)  
**Seed tip (this program):** branch `cursor/v2-5-10-quality-consolidation-c2ea` @ latest push  

> Honesty: Requirements / A–E / Production Candidate are still **NO**.  
> Owner chose to migrate **before** personal live UAT. New-repo UAT becomes Category A evidence home.

---

## 1. Role split after cutover

| Repo | Role |
|------|------|
| `Cupping-System-Management` | Development / audit **archive** (do not delete) |
| New production repo | Production SoT · Releases · CI · UAT evidence |

---

## 2. What the owner must do (mobile OK — ~2 minutes)

Agent tokens **cannot** `createRepository`. On GitHub (logged in as `7uzzam`):

1. **New repository** → name e.g. `Tadawi-Clinic-Production`  
2. **Private** (recommended until first public release)  
3. **Empty** — no README, no .gitignore, no license  
4. Copy the URL, e.g. `https://github.com/7uzzam/Tadawi-Clinic-Production`  

Then either:

- **A)** Push from a PC with your GitHub login (commands in §4), or  
- **B)** Open a **new Cursor chat on the new empty repo** and paste the prompt in `NEW-CHAT-PROMPT-AFTER-MIGRATION.md`

---

## 3. What to include / exclude

### Include (clean production seed)

- Full application tree at V2-5.10 tip (Electron, `cloud/`, `database/`, `license/`, tests, workflows)  
- `docs/integration-v2-5-10/` (handoff + UAT + vision)  
- `docs/repository-transition/`  
- `docs/final-review/` (baseline scores — do not treat as new scores)  
- Root package manifests, electron-builder config, branding assets  

### Exclude / do not copy as SoT noise

- `docs/integration-v2-5-7/evidence/source-release-*.tar.gz`  
- Untracked `docs/comparison/`  
- Stale activation churn JSON unless intentional  
- Do **not** rewrite/squash history of the archive repo  

### History strategy (recommended)

**Option Clean Tip (recommended for early move):**  
Push current V2-5.10 tip as `main` on the new repo (single lineage start). Keep full history in the old archive.

**Option Full Mirror:** only if you explicitly want every phase branch — heavier; not required for UAT.

---

## 4. Owner push commands (when you have a PC / Codespace)

```bash
git clone https://github.com/7uzzam/Cupping-System-Management.git
cd Cupping-System-Management
git checkout cursor/v2-5-10-quality-consolidation-c2ea
git pull

# optional clean check
npm ci
npm test
npm run verify:v2-5-10-stage1

# point to NEW empty repo (replace URL)
git remote rename origin archive-origin
git remote add origin https://github.com/7uzzam/Tadawi-Clinic-Production.git
git push -u origin HEAD:main

# optional: tag seed
git tag -a v2-5.10-uat-seed -m "V2-5.10 UAT seed before operator A-E"
git push origin v2-5.10-uat-seed
```

Or use: `bash scripts/repository-transition/export-production-seed.sh`

---

## 5. After new repo has code

1. Confirm Actions can run (enable Actions if prompted)  
2. Prefer Release channel for Setup EXE (same pattern as V2-5.10 workflow)  
3. Operator runs A–E on Installed EXE from **new** repo Releases  
4. Only after A–E PASS: declare Production Candidate on the **new** repo  
5. Old repo: add README banner “ARCHIVED — production SoT moved to …”

---

## 6. Explicit non-claims

- This plan does **not** make Production Candidate YES  
- Migrating early does **not** skip A–E  
- Agent did **not** create or push the new GitHub repository (integration token lacks `createRepository`)
