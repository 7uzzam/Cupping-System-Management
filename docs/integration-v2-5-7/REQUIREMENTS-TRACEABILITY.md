# V2-5.7 Requirements Traceability

**Phase:** V2-5.7 — Production Build, Migration & Final Release
**Branch:** `cursor/v2-5-7-production-release-c2ea`
**Baseline:** V2-5.6 commit `b5a2f2a`
**Rule:** No PASS without runtime evidence. Results start `NOT_STARTED` before production code.

| ID | المطلوب | Definition of Done | Production files | Automated test | Windows runtime evidence | Device A | Device B | Cloud/Remote evidence | Restart evidence | Failure-path evidence | Result |
|----|---------|--------------------|------------------|----------------|--------------------------|----------|----------|----------------------|------------------|----------------------|--------|
| BUILD-257-001 | Clean npm ci on Windows | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BUILD-257-002 | All tests PASS | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BUILD-257-003 | Zero skipped release-blocking tests | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BUILD-257-004 | Installer generated | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BUILD-257-005 | win-unpacked generated | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BUILD-257-006 | Portable build if officially supported | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BUILD-257-007 | SHA-256 generated | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BUILD-257-008 | EXE icon | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BUILD-257-009 | Installer icon | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BUILD-257-010 | Desktop icon | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BUILD-257-011 | Start Menu icon | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BUILD-257-012 | Taskbar icon | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| BUILD-257-013 | Add/Remove Programs icon | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| LIFE-257-001 | Clean install | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| LIFE-257-002 | Update from V2-4 | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| LIFE-257-003 | Update from each V2-5 intermediate release | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| LIFE-257-004 | Repair same version | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| LIFE-257-005 | App-only uninstall preserves data | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| LIFE-257-006 | App-only uninstall preserves license | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| LIFE-257-007 | Reinstall restores app access | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| LIFE-257-008 | Explicit full wipe | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| LIFE-257-009 | Silent uninstall defaults app-only | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| LIFE-257-010 | Auto updater never full-wipes | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| LIFE-257-011 | Interrupted update rollback | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| LIFE-257-012 | App running during update | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| LIFE-257-013 | Database connection open during update | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| MIG-257-001 | Schema migration V2-4→V2-5 | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| MIG-257-002 | Migration preserves records | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| MIG-257-003 | Migration preserves attachments | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| MIG-257-004 | Migration preserves revisions/outbox | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| MIG-257-005 | Migration preserves owner/RBAC | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| MIG-257-006 | Migration preserves license/device/branch | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| MIG-257-007 | Migration failure rollback | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| MIG-257-008 | No silent empty database | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| MIG-257-009 | Backup created before migration | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| MIG-257-010 | Restore old backup into supported path | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| COMP-257-001 | Windows 10 supported build UAT | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| COMP-257-002 | Windows 11 supported build UAT | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| COMP-257-003 | Supported display scales | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| COMP-257-004 | Supported locale/timezone | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-257-001 | V2-4 regression PASS | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-257-002 | V2-5.1 PASS | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-257-003 | V2-5.2 PASS | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-257-004 | V2-5.3 PASS | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-257-005 | V2-5.4 PASS | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-257-006 | V2-5.5 PASS | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-257-007 | V2-5.6 PASS | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-257-008 | All traceability rows PASS | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-257-009 | All evidence indexed | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-257-010 | No forbidden status words | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-257-011 | No secrets in artifacts/logs | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-257-012 | Clean git status | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-257-013 | PR URL | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-257-014 | Commit SHA | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-257-015 | GHA run URLs | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-257-016 | Installer + win-unpacked + source archive | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-257-017 | Checksums | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-257-018 | Final release readiness report | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-257-019 | Independent review required before main | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-257-020 | Final V2-5 release gate exit 0 | Runtime evidence + automated test + Windows as applicable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
