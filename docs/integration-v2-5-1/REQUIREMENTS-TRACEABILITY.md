# V2-5.1 Requirements Traceability

**Phase:** V2-5.1 — Restore & Disaster Recovery
**Branch:** `cursor/v2-5-1-restore-dr-c2ea`
**Baseline:** V2-4 commit `427f1a4` (release gate green).
**Rule:** No PASS without runtime evidence. Empty Result cells forbidden. Do not remove or merge rows after registration.
**Registration:** All Results start as `NOT_STARTED` before any production restore/DR code changes (PROTO-251-001).

**Accepted Result values:** `NOT_STARTED` | `IN_PROGRESS` | `PASS` | `FAIL` | `UNVERIFIED`
**Close rule:** every Result = `PASS`; failed=0; unverified=0.

| ID | المطلوب | Definition of Done | Production files | Automated test | Windows runtime evidence | Device A | Device B | Cloud/Remote evidence | Restart evidence | Failure-path evidence | Result |
|----|---------|--------------------|------------------|----------------|--------------------------|----------|----------|----------------------|------------------|----------------------|--------|
| PROTO-251-001 | إنشاء Traceability كامل قبل تعديل الكود | Traceability + docs/verifier/workflow committed before production restore/DR code changes | docs/integration-v2-5-1/* | scripts/verify-v2-5-1-completion.cjs | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| ARCH-251-001 | توثيق مسار Restore الفعلي من UI حتى SQLite والمرفقات | 00/01/02 docs match production path after wiring | docs/integration-v2-5-1/00-CURRENT-REALITY.md;02-MODULE-WIRING-MATRIX.md | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-001 | Restore بعد Clean install | Clean install then authorized restore succeeds with data | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-002 | Restore بعد License activation | License active then restore | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-003 | Restore بعد Organization selection | Org selected then restore | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-004 | Restore بعد Branch selection | Branch selected then restore | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-005 | Restore تلقائي لأحدث نسخة مصرح بها | Auto picks newest authorized local/cloud backup | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-006 | Restore يدوي من نسخة محددة | UI/IPC restore of chosen .tdw | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-007 | Restore SQLite كامل | tadawi.db replaced; integrity_check ok | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-008 | Restore attachments | attachments root restored; hashes match | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-009 | Restore images | image files restored | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-010 | Restore documents | document files restored | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-011 | Restore settings | settings root restored | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-012 | Restore users | users present post-restore | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-013 | Restore permissions | permissions present post-restore | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-014 | Restore owner metadata دون تجاوز authorization | owner meta restored without elevating unauthorized actor | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-015 | Restore organization/branch metadata | org/branch meta in DB/manifest consistent | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-016 | Restore indexes أو إعادة بنائها | indexes usable post-restore | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-017 | Restore foreign keys integrity | FK checks pass | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-018 | Restore preserves stable IDs | IDs unchanged vs pre-backup | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-019 | Restore preserves revisions/tombstones | revisions/tombstones preserved | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-020 | Restore ثم Sync دون duplicate | sync after restore no duplicate entities | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-021 | Restore من Local backup فقط | local-only restore works | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-022 | Restore من Cloud backup فقط | cloud-only restore works | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-023 | اختيار النسخة الأحدث الصحيحة بين Local وCloud | newer authorized wins | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-024 | رفض نسخة تخص Center مختلف | reject before swap; live intact | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-025 | رفض نسخة تخص Branch غير مصرح | reject before swap; live intact | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-026 | رفض نسخة تالفة دون مسح البيانات الحالية | corrupt reject; live intact | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-027 | Atomic restore مع rollback | failpoint rollback + reopen | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-028 | Resume بعد انقطاع الشبكة | download/restore resumes or recoverable fail | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-029 | Resume بعد إغلاق التطبيق | interrupted restore recoverable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REST-251-030 | Progress قابل للتحقق | progress events observable | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| DR-251-001 | استعادة بعد حذف SQLite | restore after tadawi.db deleted | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| DR-251-002 | استعادة بعد حذف AppData التشغيلي مع بقاء backup | restore with backup preserved | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| DR-251-003 | استعادة على جهاز جديد | new device path restore | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| DR-251-004 | استعادة بعد uninstall/reinstall | reinstall + restore | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| DR-251-005 | استعادة مع عدم وجود local backup | cloud path works or clear fail | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| DR-251-006 | استعادة مع عدم وجود cloud cache | local path works or clear fail | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| DR-251-007 | استعادة عند فشل جزء من المرفقات | partial fail reported | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| DR-251-008 | لا Dashboard قبل اكتمال التحقق | gate before dashboard | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| DR-251-009 | مقارنة row counts قبل/بعد | counts evidence recorded | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| DR-251-010 | مقارنة attachment hashes | hash evidence recorded | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| DR-251-011 | SQLite integrity_check PASS | integrity_check ok post-restore | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| DR-251-012 | تقرير بيانات غير قابلة للاستعادة إن وجدت | unrestorable report | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| DR-251-013 | لا silent empty database fallback | no silent empty DB | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| DR-251-014 | حفظ diagnostic copy عند الفشل | diagnostic retained on fail | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| DR-251-015 | رسالة recoverable واضحة للمستخدم | friendly recoverable message | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| UAT-251-001 | Windows Device A full restore UAT | Device A evidence pack | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| UAT-251-002 | Windows Device B new-device restore UAT | Device B evidence pack | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REG-251-001 | V2-4 regression suite PASS | npm test + V2-4 gate still green | pending | pending | pending | pending | pending | pending | pending | pending | NOT_STARTED |
| REL-251-001 | Phase release gate PASS | verify:v2-5-1-release-gate exit 0 | scripts/verify-v2-5-1-completion.cjs | .github/workflows/v2-5-1-release-gate.yml | pending | pending | pending | pending | pending | pending | NOT_STARTED |
