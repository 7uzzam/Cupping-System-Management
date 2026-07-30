# V2-5.4 Requirements Traceability

**Phase:** V2-5.4 — RBAC Full Audit & Enforcement
**Branch:** `cursor/v2-5-4-rbac-audit-c2ea`
**Baseline:** V2-5.3 commit `32c3a36`
**Rule:** No PASS without runtime evidence. Results start `NOT_STARTED` before production code.

| ID | المطلوب | Definition of Done | Production files | Automated test | Windows runtime evidence | Device A | Device B | Cloud/Remote evidence | Restart evidence | Failure-path evidence | Result |
|----|---------|--------------------|------------------|----------------|--------------------------|----------|----------|----------------------|------------------|----------------------|--------|
| RBAC-254-001 | Inventory كل Roles | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-002 | Inventory كل Permissions | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-003 | Inventory كل Screens | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-004 | Inventory كل Sidebar/Menu items | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-005 | Inventory كل Dashboard widgets | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-006 | Inventory كل Reports | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-007 | Inventory كل Export actions | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-008 | Inventory كل Import actions | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-009 | Inventory كل Print actions | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-010 | Inventory كل Search endpoints | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-011 | Inventory كل IPC handlers | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-012 | Inventory كل Services | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-013 | Inventory كل Repository operations | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-014 | Unauthorized screens hidden | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-015 | Unauthorized menus hidden | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-016 | Unauthorized widgets hidden | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-017 | Unauthorized reports hidden | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-018 | Unauthorized exports hidden | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-019 | Unauthorized imports hidden | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-020 | Unauthorized keyboard shortcuts blocked | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-021 | Direct route access rejected | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-022 | Direct IPC invocation rejected | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-023 | Direct service invocation rejected | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-024 | Repository enforces branch/role scope | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-025 | Tampered renderer role rejected | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-026 | Tampered payload branchId rejected | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-027 | Owner full authorized path | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-028 | Branch Admin restricted to branch | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-029 | Practitioner clinical scope | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-030 | Reception scope | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-031 | Accountant/finance scope | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-032 | Employee minimal scope | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-033 | Custom role permission matrix | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-034 | Permission changes propagate after sync | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-035 | Permission changes apply after restart | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-036 | No stale cached authorization | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-037 | Denied attempts audited | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-038 | Hidden not merely disabled where required | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-039 | No sensitive count leakage in dashboard | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-040 | No sensitive data leakage in search | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-041 | No branch B record access by ID from branch A | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-042 | No branch B attachment access from branch A | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-043 | No branch B backup access from branch A | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-044 | No branch B export from branch A | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| RBAC-254-045 | Session role downgrade takes effect | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| UAT-254-001 | Role-by-role Windows UAT | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| UAT-254-002 | Adversarial IPC/service UAT | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REG-254-001 | Previous phases regression PASS | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-254-001 | Phase release gate PASS | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
