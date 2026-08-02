# Repository Transition — DEFERRED

**Status:** NOT STARTED  
**Do not execute any repository transfer, mirror, history rewrite, remote change, or new-repo creation while V2-5.x is open.**

## Current Source of Truth

This repository remains the **only** Source of Truth until V2-5.x reaches Production Candidate:

- Development repository
- Audit repository
- Architecture history
- Full commits, branches, and evidence trail

## Gate to start V2-6 Repository Transition

All of the following must be true before any transition work:

```
Requirements: PASS
Release Gate: PASS
Windows Runtime: PASS
Scenario A–E: PASS
Independent Review: PASS
Production Candidate: YES
```

Only then create and execute:

`docs/repository-transition/RELEASE-MIGRATION-PLAN.md`

(Proposed phase name: **V2-6 Repository Transition**.)

## Forbidden until that gate

- Change git remote
- Transfer / mirror history
- Rewrite or squash history
- Delete / rename branches for migration
- Rename the project for a new home
- Move Issues / PRs
- Create a new GitHub repository
- Change workflows for the purpose of migration

## After Production Candidate (future)

New repository role: Production / Release / UAT / Official Distribution (clean stable tree only).  
This repository role afterward: Development Archive.

## Now

Continue V2-5.x closure only (code, architecture simplification after Stage-1 gates, UX, runtime UAT, Windows Setup EXE A–E, release blockers).
