# TDD-002 — Persistent Family & Child Data

狀態 Status: DONE / REGRESSION 28/28 PASSED  
對應 BDD: BDD-002  
對應 SDD: SDD-002  
日期 Date: 2026-09-18

## 目的 / Purpose

先用可執行測試定義「持久化」真正代表什麼，再寫 Google Sheet / Apps Script 實作。

Define persistence with executable tests before implementing Google Sheets / Apps Script storage.

## Red Phase

新增三組測試：

1. `test/persistent-family-service.test.js`
   - 9 個 service / repository contract tests
2. `test/persistence-ui-controller.test.js`
   - 2 個 UI persistence state tests
3. `test/apps-script-persistence-contract.test.js`
   - 1 個 Apps Script adapter contract test

總計 12 個 BDD-002 測試契約。

There are 12 BDD-002 test contracts in total.

## Red 驗證結果 / Red Verification

本地執行完整測試時：

- 既有 BDD-001 regression：16 / 16 通過
- BDD-002 新測試：Red
- 失敗原因符合預期：
  - `src/persistent-family-service.js` 尚未存在
  - `src/persistence-ui-controller.js` 尚未存在
  - `apps-script/Code.gs` 尚未存在

Node test runner 因上述三個實作入口缺失而回報三個 failing test suites。這是預期的 TDD Red，不是既有功能 regression。

The Node test runner reports three failing new suites because the implementation entry points do not exist yet. Existing BDD-001 tests remain green.

## Contract Under Test / 待實作契約

### Persistent Family Service

預期匯出：

`createPersistentFamilyService({ repository, idFactory, expectedSchemaVersion })`

必須支援：

- `createFamily(principal, displayName)`
- `listFamilies(principal)`
- `readFamily(principal, familyId)`
- `addStudent(principal, familyId, childDisplayName)`

### UI Persistence Controller

預期匯出：

`createPersistenceUiController({ service, view })`

UI 必須：

- server 尚未 ACK 前維持 saving 狀態
- server 成功後才顯示已建立家庭
- server 失敗時顯示錯誤
- 失敗時不得把家庭加入成功清單

### Apps Script Adapter

預期建立：

`apps-script/Code.gs`

至少必須包含：

- Spreadsheet service
- Script lock
- `families`
- `students`
- `schema_meta`
- `schema_version`

## 12 個測試 / 12 Tests

1. Family 跨 application session 仍存在。
2. Student 跨 session 仍存在且仍屬於原 Family。
3. 同一 principal 在另一 session 可取回相同 durable data。
4. Parent A list 不回傳 Parent B Family。
5. Parent A 直接讀 Parent B familyId 仍被拒絕。
6. Family write failure 不得回成功。
7. Student write failure 不得回成功。
8. Schema version 不相容時拒絕操作。
9. Repository busy 對應 `PERSISTENCE_BUSY`。
10. UI 等到 server ACK 前保持「儲存中」。
11. UI 儲存失敗時顯示錯誤且不加入成功清單。
12. Apps Script adapter 必須具備 Sheet schema 與 lock boundary。

## Regression Requirement / 回歸要求

進入 Green 後，除了讓這 12 個新 contract 通過，BDD-001 原本 16 個測試也必須全部維持通過。

BDD-001's existing 16 tests must remain green throughout BDD-002 implementation.


## Green / Regression Result

GitHub Actions regression 已完成：

- Total tests: 28
- Passed: 28
- Failed: 0

其中包含：
- BDD-001 regression
- BDD-002 persistent service tests
- BDD-002 UI controller tests
- Apps Script persistence contract test

Apps Script Web App 已部署，人工 UI acceptance 已通過；BDD-002 Done。
