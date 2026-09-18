# TDD-001 — Family Visibility & Child Binding

狀態 Status: GREEN / REGRESSION PASSED  
對應 BDD: BDD-001  
對應 SDD: SDD-001  
日期 Date: 2026-09-18

## 測試策略 / Test Strategy

使用 Node.js 內建 `node:test` 與 `node:assert`，不加入第三方測試套件。

Uses Node.js built-in `node:test` and `node:assert`, with no third-party test dependency.

## Red → Green

Red 階段先建立 13 個測試，當時 `src/family-domain.js` 尚不存在。

In the Red phase, 13 tests were created before `src/family-domain.js` existed.

Green 階段新增最小實作 `src/family-domain.js`，只實作 BDD-001 / SDD-001 所要求的家庭邊界行為。

The Green phase adds the minimal `src/family-domain.js` implementation required by BDD-001 / SDD-001.

## Test Result / 測試結果

執行：

`npm test`

結果：

- Tests: 13
- Passed: 13
- Failed: 0
- Skipped: 0

Regression 再次執行相同完整測試集，結果仍為 13/13 通過。

The full regression suite was run again and remained 13/13 passing.

## 覆蓋項目 / Covered Behaviors

1. 建立家庭後，建立者具有管理權。
2. 新建立家庭出現在建立者的可見家庭清單。
3. 家長家庭清單不包含其他家庭。
4. 不洩漏其他家庭名稱、成員或資料。
5. 家長可在自己的家庭建立孩子。
6. 孩子只屬於指定家庭。
7. 不得在未授權家庭建立孩子。
8. 不得讀取其他家庭私人資料。
9. 不得修改其他家庭孩子設定。
10. familyId / studentId 不可繞過授權。
11. 被拒絕的跨家庭修改不得留下資料變更。
12. 空白家庭名稱被拒絕。
13. 空白孩子名稱被拒絕。
