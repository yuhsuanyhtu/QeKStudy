# Acceptance-003 — 名稱維護與管理員資料管理 / Rename & Administrator Data Management

狀態 Status: Deployment + UI acceptance pending  
日期 Date: 2026-09-18  
BDD: BDD-003  
SDD: SDD-003

## Automated Evidence / 自動驗證

- Schema migration v1 → v2 completed.
- Pre-migration Google Sheet backup completed.
- GitHub Actions run: `35312578717`
- Total tests: 57
- Passed: 57
- Failed: 0
- Existing BDD-001/002 regression remains green.
- Admin rename/delete/soft-delete/audit behavior is verified in the non-public automated test boundary.
- Public Apps Script UI contract confirms administrator destructive controls are not exposed.

## Manual UI Acceptance / 人工 UI 驗收

在更新 Apps Script deployment 後，只使用 Demo data：

### Parent A

1. Parent A 應看到自己家庭。
2. 使用「修改家庭名稱」改名。
3. Reload 後新名稱仍存在。
4. Google Sheet family_id 不變。
5. `audit_log` 出現 `RENAME_FAMILY`。
6. 修改自己家庭內孩子名稱。
7. Reload 後新名稱仍存在。
8. student_id / family_id 不變。
9. `audit_log` 出現 `RENAME_STUDENT`。

### Parent B isolation

1. Switch to Parent B.
2. Parent B must not see or rename Parent A records.
3. Parent B may rename only Parent B-owned family/student data.

### Admin safety

Public deployed Demo must **not** show administrator delete controls.

Administrator destructive behavior remains verified only in the safe automated test boundary until Authentication/Admin identity exists.

## Done Gate

BDD-003 is Done after:
- updated Apps Script deployment is live,
- parent rename UI acceptance passes,
- Sheet audit rows are verified,
- final regression remains green.
