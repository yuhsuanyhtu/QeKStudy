# Acceptance-002 — 家庭與孩子資料持久化 / Persistent Family & Child Data

狀態 Status: Manual UI acceptance pending  
日期 Date: 2026-09-18  
BDD: BDD-002  
SDD: SDD-002

## Automated Evidence / 自動驗證

- GitHub Actions regression: 28 / 28 PASS
- Google Sheet schema verified:
  - families
  - students
  - schema_meta
  - schema_version = 1
- Apps Script deployment URL recorded:
  https://script.google.com/macros/s/AKfycbwaGdC88YUhlRjYmM1znhMqs4fpEYhnJ2cNkQhEa-EsKccjPzb7PshR2STbqZ6z5IUh2w/exec

## Manual Acceptance / 人工驗收

請只使用 Demo 資料。

Use demo data only.

### A. Parent A persistence

1. 開啟 Apps Script Web App。
2. 保持「家長 A」。
3. 建立家庭：`Demo Family A`。
4. 在該家庭新增孩子：`Demo Child A`。
5. 重新整理瀏覽器。
6. 確認 `Demo Family A` 與 `Demo Child A` 仍存在。

Expected:
- reload 後資料仍存在。
- browser local memory 不是唯一資料來源。

### B. Family isolation

1. 切換到「家長 B」。
2. 確認看不到 `Demo Family A` 與 `Demo Child A`。
3. 建立家庭：`Demo Family B`。
4. 重新整理。
5. 確認 Parent B 仍只看到自己的家庭。
6. 切回 Parent A。
7. 確認 Parent A 只看到 `Demo Family A`。

Expected:
- durable persistence 不得破壞 BDD-001 family isolation。

### C. Google Sheet verification

人工 UI 操作完成後，檢查：
- `families` 應至少有 Parent A / Parent B 的 demo rows。
- `students` 應至少有 Demo Child A row。
- family_id / student_id 應為 server-generated IDs。
- owner_parent_id 必須正確對應 parent-a / parent-b。

## Done Gate

BDD-002 只有在以上 UI acceptance 通過後才能標記 Done。

BDD-002 is Done only after the manual UI acceptance passes.
