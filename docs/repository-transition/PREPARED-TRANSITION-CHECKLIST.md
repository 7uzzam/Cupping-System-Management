# Repository Transition — Prepared Checklist (NON-EXECUTABLE)

**Status:** PREPARATION ONLY  
**Execution:** FORBIDDEN until Production Candidate = YES  

This file is a readiness outline so the owner can move quickly **after** V2-5.x closes. It does **not** authorize creating a new repo, changing remotes, or rewriting history now.

See also: `DEFERRED-UNTIL-PRODUCTION-CANDIDATE.md`.

---

## Gate (must all be YES before any step below)

- [ ] Requirements 40/40 PASS (Installed Setup EXE evidence)
- [ ] `npm run verify:v2-5-9-release-gate` exit 0
- [ ] Scenario A–E PASS with validated evidence packs
- [ ] Windows runtime / console errors = 0 on Installed EXE
- [ ] Independent re-score completed (fresh; not baseline 58)
- [ ] Production Candidate declared **YES** in `CURRENT-STATUS.md`

---

## Then create (at transition time)

1. `docs/repository-transition/RELEASE-MIGRATION-PLAN.md` with:
   - New production repo name/URL
   - What to include (stable tree, release tags, Setup EXE artifacts policy)
   - What to exclude (phase noise, source-release tarballs, draft branches)
   - Role split: this repo → Development Archive; new repo → Production SoT
2. Owner creates empty GitHub repository (manual / org policy)
3. Export **clean** production tree (no history rewrite of this archive unless explicitly decided)
4. Wire CI for production-only workflows
5. Re-run Tests + controlled UAT on the new repo as **verification** of the candidate
6. Freeze distribution channel to new-repo releases only

---

## Explicitly out of scope for this checklist

- Starting transition while any Requirement is UNVERIFIED  
- Using new-repo Tests to “finish” unfinished A–E on this program  
- Squashing away audit trail of this development repo  

---

## Now

Continue Category A Live UAT on **this** repository only.
