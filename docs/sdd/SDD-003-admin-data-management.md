# SDD-003 — 名稱維護與管理員資料管理 / Rename & Administrator Data Management

狀態 Status: Approved for TDD  
對應需求 Requirement: BDD-003  
日期 Date: 2026-09-18

## 1. 目的 / Purpose

本設計支援：

- 家長修改自己家庭與孩子的顯示名稱。
- 管理員跨家庭協助修改名稱。
- 只有管理員可以刪除資料。
- 刪除後資料不再出現在一般使用流程。
- 改名與刪除都不能破壞 stable ID 與家庭歸屬。

This design supports parent-owned renaming, administrator-assisted renaming, administrator-only deletion, stable IDs, and safe data lifecycle handling.

---

## 2. 角色 / Roles

### Parent

家長只能操作自己有管理權的家庭。

A parent may only manage families they own/manage.

允許：
- rename own family
- rename students inside own family

不允許：
- rename another family
- rename students in another family
- delete family
- delete student
- call admin-only operations

### Administrator

管理員是跨家庭的受信任角色。

Administrator is a trusted cross-family role.

允許：
- list active families for administration
- inspect the minimal family/student information required for administration
- rename any active family
- rename any active student
- soft-delete any active student
- soft-delete any active family and all active students under it

**重要：正式 Authentication / Admin identity 尚未完成前，不在公開 Web App 啟用真正的 administrator destructive operations。**

**Important: real administrator destructive operations must not be exposed on the public Web App until production authentication/admin identity exists.**

---

## 3. Trusted Principal / 受信任身分

Application layer receives a trusted principal:

```js
{
  actorId: "...",
  role: "PARENT" | "ADMIN",
  parentId: "..." // only for parent principals
}
```

規則：

- `role=PARENT` 時，以 `parentId` 做 family ownership authorization。
- `role=ADMIN` 時，server-side authorization explicitly allows admin operations。
- Browser 不得只靠自己傳入 `role: "ADMIN"` 就取得管理權。

The browser must never be able to grant itself administrator privileges merely by sending an ADMIN role value.

「trusted principal 如何建立」仍屬 Authentication Story，不在 BDD-003 內實作完成。

---

## 4. Rename Rules / 改名規則

改名只修改 `display_name` 與 `updated_at`。

Renaming changes only the display name and update metadata.

### Family rename

保持不變：

- `family_id`
- `owner_parent_id`
- `created_at`
- family/student relationships

### Student rename

保持不變：

- `student_id`
- `family_id`
- `created_at`

空白名稱仍拒絕：

- `EMPTY_FAMILY_NAME`
- `EMPTY_CHILD_NAME`

---

## 5. Delete Strategy / 刪除策略

BDD-003 採 **soft delete**。

BDD-003 uses **soft deletion**.

不直接刪掉 Google Sheet row。

Rows are not physically removed from Google Sheets.

### Why / 原因

1. 管理員誤刪時仍可人工追查。
2. 保留資料歷史有利於除錯與稽核。
3. 避免 hard delete 造成 family/student relationship 無法重建。
4. 未來若需要「復原資料」，可以再開新的 Story，而不必從備份救資料。

A future restore/recovery UI is intentionally out of scope for BDD-003.

---

## 6. Schema Migration / Schema 變更

目前 schema version:

`1`

BDD-003 實作完成後：

`schema_version = 2`

### families

現有 columns：

- family_id
- display_name
- owner_parent_id
- created_at
- updated_at
- status

新增：

- deleted_at
- deleted_by_actor_id
- deleted_by_role

### students

現有 columns：

- student_id
- family_id
- display_name
- created_at
- updated_at
- status

新增：

- deleted_at
- deleted_by_actor_id
- deleted_by_role

### audit_log

新增 worksheet：

`audit_log`

columns:

| Column | Meaning |
|---|---|
| audit_id | immutable event ID |
| occurred_at | event timestamp |
| actor_id | trusted actor ID |
| actor_role | PARENT / ADMIN |
| action | RENAME_FAMILY / RENAME_STUDENT / DELETE_FAMILY / DELETE_STUDENT |
| target_type | FAMILY / STUDENT |
| target_id | family_id / student_id |
| family_id | owning family for traceability |
| before_value | previous display/status summary |
| after_value | new display/status summary |

Audit log 是 append-only。

The audit log is append-only.

---

## 7. Soft-delete State / Soft-delete 狀態

active record:

```text
status = active
deleted_at = blank
```

deleted record:

```text
status = deleted
deleted_at = timestamp
deleted_by_actor_id = admin actor id
deleted_by_role = ADMIN
```

一般 query 只回：

`status == active`

Normal user queries return active rows only.

直接使用被刪除的 `familyId` / `studentId`：

回：

`RESOURCE_NOT_AVAILABLE`

Deleted IDs must not become a bypass path.

---

## 8. Delete Student / 刪除孩子

Command:

```text
DeleteStudent({
  trustedPrincipal,
  studentId,
  confirmed
})
```

Rules:

1. principal must be ADMIN.
2. `confirmed === true`.
3. student must currently be active.
4. acquire ScriptLock.
5. set student status to deleted.
6. set deletion metadata.
7. append audit event.
8. flush.
9. only then return success.

非 ADMIN：

`RESOURCE_NOT_AVAILABLE`

未確認：

`DELETE_CONFIRMATION_REQUIRED`

---

## 9. Delete Family / 刪除家庭

Command:

```text
DeleteFamily({
  trustedPrincipal,
  familyId,
  confirmed
})
```

這是一個 atomic logical operation：

1. principal must be ADMIN.
2. confirmation required.
3. family must be active.
4. acquire ScriptLock.
5. mark family deleted.
6. mark **all active students in that family** deleted in the same locked operation.
7. write deletion metadata.
8. append audit events.
9. flush.
10. return success.

因此不會留下仍可存取的 orphan student。

No accessible orphan student may remain after family deletion.

如果任何 write 發生錯誤：

- operation 回 `PERSISTENCE_FAILED`
- 不得回 success
- TDD 需驗證 partial mutation protection strategy

Apps Script + Sheets 缺乏真正 database transaction，因此實作時需採先計算全部 row updates、單次或最少批次 range write，並以 lock 保護 critical section。

---

## 10. Parent Rename Authorization / 家長改名授權

### RenameFamily

```text
RenameFamily({
  trustedPrincipal,
  familyId,
  newDisplayName
})
```

PARENT:
- family.owner_parent_id must equal principal.parentId

ADMIN:
- any active family allowed

### RenameStudent

```text
RenameStudent({
  trustedPrincipal,
  studentId,
  newDisplayName
})
```

PARENT:
- student's family must be owned by principal.parentId

ADMIN:
- any active student allowed

All authorization occurs server-side.

---

## 11. Admin Read Scope / 管理員讀取範圍

BDD-003 UI 要讓管理員協助改名或刪除，因此需要 admin-only query：

```text
ListAdminFamilies({ trustedPrincipal })
ReadAdminFamily({ trustedPrincipal, familyId })
```

只允許 ADMIN。

首版回傳資料限制在管理工作所需：

- family ID
- family display name
- owner parent ID
- active/deleted status when explicitly needed by admin
- child IDs and display names

不在本 Story 額外暴露學習紀錄、零用金、作答內容等未來私人資料。

Admin access should follow least-privilege principles.

---

## 12. UI Design / UI 行為

### Parent UI

自己的 family card：

- 「修改家庭名稱」
- child row：「修改名稱」

不顯示 delete button。

Parents never see a delete action in normal UI.

### Admin UI

需要獨立的 **Admin Demo / 管理員區域**：

- family list
- rename family
- rename child
- delete child
- delete family

刪除操作需要二次確認。

例如：

```text
刪除「Demo Family A」？
此操作會讓此家庭與其孩子從一般使用流程消失。

[取消] [確認刪除]
```

不使用單擊立即刪除。

---

## 13. Public Demo Safety / 公開 Demo 安全

目前 Apps Script Web App 是公開 Demo，而且正式 Authentication 尚未完成。

因此 BDD-003 實作階段：

- Parent rename 可以在 demo principal 模式驗收。
- Admin destructive endpoint **不得僅靠 browser 提供 admin ID/role 就啟用**。
- 真正的 public admin delete UI 必須等 Authentication/Admin identity Story 完成後才上線。

在 Authentication Story 之前，administrator delete 可：
- 用 server-side test principal 做 automated tests；
- 在受控 development/test harness 驗收；
- 不在公開 deployed URL 暴露可被任意使用者呼叫的 destructive route。

This prevents a public demo identity switch from becoming an actual deletion vulnerability.

---

## 14. Error Contract / Error Codes

BDD-003 新增：

- `DELETE_CONFIRMATION_REQUIRED`
- `RESOURCE_NOT_AVAILABLE`
- `PERSISTENCE_FAILED`
- `PERSISTENCE_BUSY`

延用：

- `EMPTY_FAMILY_NAME`
- `EMPTY_CHILD_NAME`
- `SCHEMA_MISMATCH`

對未授權與不存在的 target，對外都優先使用：

`RESOURCE_NOT_AVAILABLE`

避免洩漏 target 是否存在。

---

## 15. Concurrency / 並行處理

Rename / delete 都必須使用：

`LockService.getScriptLock()`

刪 family 時 lock 涵蓋：

- family row update
- all child row updates
- audit writes

避免在 family delete 途中又新增 child 或進行 rename。

---

## 16. Migration Plan / 遷移計畫

從 schema v1 → v2：

1. backup current demo spreadsheet.
2. append deletion metadata columns to `families`.
3. append deletion metadata columns to `students`.
4. create `audit_log`.
5. existing active rows keep `status=active`.
6. new deletion fields remain blank.
7. update `schema_meta.schema_version` from 1 to 2.
8. run migration verification.
9. only then deploy BDD-003 code.

Migration must preserve all current IDs and relationships.

---

## 17. TDD-003 Boundary / 下一階段測試邊界

至少覆蓋：

1. parent can rename own family.
2. family rename keeps familyId unchanged.
3. parent can rename own student.
4. student rename keeps studentId/familyId unchanged.
5. parent cannot rename another family.
6. parent cannot rename another family's student.
7. parent cannot delete family.
8. parent cannot delete student.
9. admin can rename any family.
10. admin can rename any student.
11. admin can soft-delete student.
12. deleted student disappears from normal reads.
13. direct deleted studentId returns RESOURCE_NOT_AVAILABLE.
14. admin can soft-delete family.
15. deleting family soft-deletes all active students under it.
16. deleted family disappears from parent list.
17. direct deleted familyId returns RESOURCE_NOT_AVAILABLE.
18. delete requires explicit confirmation.
19. rename/delete writes audit log.
20. persistence failure never reports successful delete.
21. busy lock maps to PERSISTENCE_BUSY.
22. schema v1 is rejected by v2 application until migrated.
23. BDD-001 and BDD-002 full regression remains green.

---

## 18. Definition of Done / 完成條件

BDD-003 只有在以下都完成才 Done：

- BDD approved
- SDD approved
- TDD Red
- schema migration tested
- implementation
- TDD Green
- full regression
- operable UI for allowed demo behavior
- destructive admin behavior verified in a safe non-public test boundary until real auth exists
- acceptance documented

No UI = not Done.
