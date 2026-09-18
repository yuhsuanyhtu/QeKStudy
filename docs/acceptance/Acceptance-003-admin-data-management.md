# Acceptance-003 — 名稱維護與管理員資料管理 / Rename & Administrator Data Management

狀態 Status: PASSED / DONE  
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

## Acceptance Result / 驗收結果

2026-09-18 使用者完成更新後的 Apps Script UI 驗收並回報「改名正常」。

User completed the updated Apps Script UI acceptance and reported that renaming works correctly.

Google Sheet verification after manual acceptance:

- `schema_version = 2`
- Family rename persisted:
  - family_id remained `fam_81260843-3c93-48db-b39f-ea9329c50c24`
  - owner_parent_id remained `parent-a`
  - display name changed from `謙恩的家` to `寶貝的家`
- Student rename persisted:
  - student_id remained `stu_92460227-1286-4d64-8f0c-1364794a860d`
  - family_id remained `fam_81260843-3c93-48db-b39f-ea9329c50c24`
  - display name changed from `小米` to `小愛`
- `audit_log` contains:
  - `RENAME_FAMILY` by `parent-a`
  - `RENAME_STUDENT` by `parent-a`
- Existing family/student relationships remain intact.
- Public UI continues to omit administrator destructive controls.

Administrator rename/delete/soft-delete behavior remains verified in the safe automated test boundary until production Authentication/Admin identity exists.

Final regression basis:
- GitHub Actions run `35312578717`
- Total: 57
- Passed: 57
- Failed: 0

BDD-003 acceptance passed and the Story is **Done**.

BDD-003 驗收完成，Story 正式 **Done**。
