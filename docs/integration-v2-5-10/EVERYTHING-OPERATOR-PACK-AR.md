# باقة كاملة — Tests + EXE + التجربة (A–E) + بعدين PC/نقل

**التاريخ:** 2026-08-02  
**الفرع:** `cursor/v2-5-10-quality-consolidation-c2ea`  
**الريبو الحالي (SoT لحد ما تكمّل النقل):** `7uzzam/Cupping-System-Management`  
**الريبو الجديد (لسا الوكيل مش شايفه):** `7uzzam/Tadawi-Clinic-Production`

---

## 1) نتائج الـ Tests (اتشغّلت من الوكيل)

| الأمر | النتيجة |
|------|---------|
| `npm test` | **100/100 PASS** |
| `npm run verify:v2-5-10-stage1` | **PASS** |
| `npm run v2-5-10:category-b` | **PASS** |
| `npm run v2-5-10:registry-drift` | **PASS** (74/74) |
| `npm run v2-5-10:ops-keys` | **PASS** (`syncedNotInBridge: none`) |
| `npm run verify:v2-5-9-release-gate` | **FAIL متوقع** لحد ما A–E تخلص عندك |

Unit/CI أخضر ≠ Production Candidate. التجربة الحية عندك هي اللي تقلب الـ gate.

---

## 2) Setup EXE للتجربة (نزّله دلوقتي)

الأحدث على الريبو الحالي:

**https://github.com/7uzzam/Cupping-System-Management/releases/tag/uat-v2-5-10-30773024959**

- الملف: `HijamaManagement-Setup-2.0.1.exe`
- اقرأ SHA-256 من نص الـ Release
- ثبّته على **جهازين Windows** (Clean install)

لو ظهر release أحدث `uat-v2-5-10-*` خُد الأحدث.

---

## 3) التجربة الكاملة عندك (Category A) — الترتيب إلزامي

التفاصيل: `OPERATOR-LIVE-UAT.md`

1. **A** جهاز A ↔ جهاز B (Google + ترخيص + مزامنة + CRUD + مرفق + تعارض + إعادة تشغيل) — **مانع**  
2. **B** فرع جديد  
3. **C** استعادة كوارث Backup V2 فقط  
4. **D** Owner Hub (يومي / دعم متقدم)  
5. **E** Google OAuth / Drive / Sheets (Sheets ≠ SoT)  
6. Responsive + أخطاء Runtime/Console = 0  
7. تأكد Backup V1 مش ظاهر/مش شغال للعميل  

بعد التعبئة:

```bash
npm run v2-5-10:validate-ae
```

لازم exit 0 قبل أي PASS على Requirements.

---

## 4) أوامر تتشغّل على جهاز فيه Node (اختياري بعد التجربة)

```bash
git clone https://github.com/7uzzam/Cupping-System-Management.git
cd Cupping-System-Management
git checkout cursor/v2-5-10-quality-consolidation-c2ea
git pull
npm ci
npm test
npm run verify:v2-5-10-stage1
npm run v2-5-10:validate-ae
npm run verify:v2-5-9-release-gate   # لازم يبقى أخضر بعد A–E فقط
```

---

## 5) نقل الريبو (لو لسا فاضي / من غير Cursor)

1. https://github.com/new/import ← من `Cupping-System-Management`  
2. أو ادفع البذرة من لابتوب للحساب بتاعك  
3. Workflow جاهز تنسخه:  
   `docs/repository-transition/PRODUCTION-UAT-WORKFLOW.yml`  
   → المسار على الريبو الجديد: `.github/workflows/production-uat-setup-exe.yml`  
4. برومبت شات لاحق (لما Usage يرجع):  
   `docs/repository-transition/NEW-CHAT-PROMPT-AFTER-MIGRATION.md`

الوكيل هنا لسا **404** على `Tadawi-Clinic-Production` حتى بعد «اتفتح» — لازم Import/دفع بحسابك أو صلاحية Cursor تظهر الريبو لهذا التوكن.

---

## 6) الحكم الصادق دلوقتي

| البند | الحالة |
|------|--------|
| Tests / Category B / هندسة أوفلاين | **منتهية** |
| Setup EXE للتجربة | **جاهز على Releases** |
| Category A (تجربتك) | **عندك أنت** |
| Production Candidate | **لا** |
| نقل الريبو | **يدك / Import** (الوكيل محجوب) |

---

## 7) ابدأ من هنا الليلة

1. نزّل EXE من الرابط في §2  
2. ثبّت على جهازين  
3. نفّذ A→E  
4. رجّع النتائج/الأدلة لما Usage يرجع  

مش مستني هندسة إضافية قبل تجربتك.
