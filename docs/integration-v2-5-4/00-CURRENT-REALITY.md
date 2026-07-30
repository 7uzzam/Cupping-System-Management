# V2-5.4 — Current Reality (RBAC Full Audit)

**Branch:** `cursor/v2-5-4-rbac-audit-c2ea`
**Baseline:** V2-5.3 tip `32c3a36` (release gate green)

## Summary

Renderer RBAC is largely REAL (RolePolicy, PermissionPolicy, showPage, applyPermissionUI, BranchScope write guards). Electron main IPC has **no role checks**. Repository reads do not filter by user scope. Export/print/cash-drawer hotspots are UI-hidden but not re-checked. Renderer `currentUser` / payload `branchId` are tamperable.

## Gaps (pre-implementation)

1. Authoritative IPC RBAC in Electron main (backup/DB/license/print/wipe)
2. Reject tampered renderer role + branchId outside user scope
3. `filterByUserScope` on production reads / exports / attachments / backups
4. Re-check perms inside exportToday / printZReport / openCashDrawer / reports
5. Align Owner Hub visibility vs mutate gates
6. Role inventory cleanup (hq_admin / practitioner / branch_manager)
7. Denied-attempt audit + role×page matrix tests + adversarial UAT
