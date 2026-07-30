# V2-5.4 — Module Wiring Matrix

| Module | Status | Notes |
|--------|--------|-------|
| RolePolicy | REAL | owner vs admin proven |
| PermissionPolicy + nav/page | REAL | renderer only |
| BranchScope writes | REAL | Repository.upsert |
| BranchScope reads | MISSING / UNPROVEN | filterByUserScope not on main reads |
| Electron IPC RBAC | MISSING | channel allowlist ≠ RBAC |
| Export/print/drawer | WIRED BUT UNPROVEN | UI hide; fn often ungated |
| Dashboard widgets | LOCAL ONLY | except ledger card |
| AppointmentService RBAC | LOCAL ONLY | parallel model |
| hq_admin / branch_manager login | DEAD / UNPROVEN | |
| checkPermission(roles) helper | DEAD CODE | unused |
