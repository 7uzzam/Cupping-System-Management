# 04 — License / Branch Activation Flow

## Separation required

| Concern | Where |
|---------|--------|
| Branch management (CRUD) | Owner Hub only |
| Device activation / license pull | Activation UI only |

## Current Hybrid issues

- BranchLock UI still offers **فرع جديد** and calls `BranchEnrollment.enrollBranch` without `source:'owner_hub'` → Phase 28 blocks after first branch (`owner_hub_required`), confusing UX.
- Owner Hub `addBranch` writes license IDs (`BR-001…`) **bypassing** enrollment — split-brain ID schemes.
- License pull / Drive bootstrap primarily **selects** existing branches (+ auto first enroll) — good direction, but BranchLock undermines it.

## Target activation UI

1. Authenticate user.
2. Fetch orgs/branches **authorized for this user** from server (Drive interim: signed license doc filtered by membership).
3. User selects branch — **no create control**.
4. Register/approve Device Binding.
5. Enforce device limit + license status.
6. Issue device token scoped `{organizationId, branchId, deviceId}`.
7. Run snapshot bootstrap (V2-6) then open app.
8. Do not store editable “I am Owner” flags as sole authority on client.

## Explicit non-goals

- Creating branches during Google login.
- Treating Google login as Owner proof.
