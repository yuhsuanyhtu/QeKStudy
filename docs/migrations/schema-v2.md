# Schema Migration v1 → v2 / 資料庫遷移

日期 Date: 2026-09-18  
Story: BDD-003

## Backup / 備份

遷移前已複製完整 Demo DB：

- Title: `QeKStudy Database (Demo) - backup before schema v2 - 2026-09-18`
- Backup Spreadsheet ID: `1HlqKFetyybUBhqGpI2oqExDRaBpVPp3t21P_3VDhff0`

Original Demo DB:

- Spreadsheet ID: `16GjrllU2rRgUBXH7evGQCFqOTHQbhtJRFX6CjkvKBA8`

## Migration Applied / 已套用遷移

### families

新增欄位：

- `deleted_at`
- `deleted_by_actor_id`
- `deleted_by_role`

既有 family rows 保留：

- family_id unchanged
- display_name unchanged
- owner_parent_id unchanged
- status remains `active`

### students

新增欄位：

- `deleted_at`
- `deleted_by_actor_id`
- `deleted_by_role`

既有 student rows 保留：

- student_id unchanged
- family_id unchanged
- display_name unchanged
- status remains `active`

### audit_log

新增 worksheet：

- audit_id
- occurred_at
- actor_id
- actor_role
- action
- target_type
- target_id
- family_id
- before_value
- after_value

### schema_meta

`schema_version`:

`1 → 2`

## Verification / 驗證

遷移後確認：

- 3 existing family rows preserved
- 5 existing student rows preserved
- stable IDs preserved
- family/student relationships preserved
- `audit_log` exists and is empty before BDD-003 UI usage
- schema_version = 2

## Rollback / 回復

若 schema v2 發生不可接受問題：

1. 停止寫入原 Demo DB。
2. 保留問題 DB 供分析。
3. 從遷移前 backup 複製新的 working copy。
4. 將 Apps Script Spreadsheet ID 指向回復後的 copy。
5. 重新部署 Apps Script。

Do not overwrite the pre-migration backup.
