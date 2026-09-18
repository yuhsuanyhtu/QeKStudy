# TDD-003 — 名稱維護與管理員資料管理 / Rename & Administrator Data Management

狀態 Status: RED  
對應 BDD: BDD-003  
對應 SDD: SDD-003  
日期 Date: 2026-09-18

## 目的 / Purpose

先用測試固定權限邊界、stable IDs、soft delete、audit log 與 schema v2 行為，再進行 migration 與實作。

Define authorization, stable IDs, soft deletion, audit logging, and schema-v2 behavior with tests before migration and implementation.

## 新增測試 / New Tests

### `test/admin-data-management-service.test.js`

23 個 service / authorization contracts：

1. parent can rename own family
2. family rename keeps ID/ownership
3. parent can rename own student
4. student rename keeps ID/family relation
5. parent cannot rename another family
6. parent cannot rename another family's student
7. blank family rename rejected
8. blank student rename rejected
9. parent cannot delete student
10. parent cannot delete family
11. admin can rename any family
12. admin can rename any student
13. delete requires explicit confirmation
14. admin soft-deletes student with metadata
15. deleted student disappears from normal reads
16. admin family delete cascades to active students
17. deleted family disappears from normal list
18. rename writes audit event
19. delete writes admin audit event
20. failed persistence does not report delete success
21. busy persistence maps to `PERSISTENCE_BUSY`
22. schema v1 rejected by v2 management service
23. non-admin principal cannot obtain admin deletion capability

### `test/admin-ui-contract.test.js`

3 個 UI contracts：

- parent demo UI has family rename
- parent demo UI has student rename
- public demo does **not** expose administrator destructive controls before Authentication

### `test/schema-v2-contract.test.js`

3 個 Apps Script / schema contracts：

- application requires `schema_version = 2`
- `audit_log` + deletion metadata exist
- rename + confirmed delete server operations exist

總計：**29 個 BDD-003 contracts**

Total: **29 BDD-003 contracts**

## Red Expected / Red 預期

Red 階段不修改目前 Google Sheet schema。

The current Google Sheet remains schema v1 during Red.

預期失敗原因：

- `src/admin-data-management-service.js` 尚未存在
- Apps Script UI 尚未加入 parent rename controls
- Apps Script application 仍是 schema v1
- audit/delete metadata 與 admin management operations 尚未實作

既有 BDD-001 + BDD-002 的 28 個 regression tests 不應因新增 Red tests 而產生邏輯 regression。

The existing 28 BDD-001/002 tests must remain logically green; only new BDD-003 expectations should fail.

## Next Green Boundary / 下一步

Red 驗證後才進：

1. schema v1 → v2 migration plan/test
2. backup Demo DB
3. migrate Sheet
4. implement management service
5. implement Apps Script adapter
6. add parent rename UI
7. keep public admin destructive UI disabled
8. run full regression
