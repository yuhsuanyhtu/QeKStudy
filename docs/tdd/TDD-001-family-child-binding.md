# TDD-001 — Family Visibility & Child Binding

狀態 Status: GREEN / UI / REGRESSION PASSED  
對應 BDD: BDD-001  
對應 SDD: SDD-001  
日期 Date: 2026-09-18

## 測試策略 / Test Strategy

使用 Node.js 內建 `node:test` 與 `node:assert`，不加入第三方測試套件。

Uses Node.js built-in `node:test` and `node:assert`, with no third-party test dependency.

## Red → Green

Red 階段先建立 13 個 domain tests，當時 `src/family-domain.js` 尚不存在。

Green 階段新增最小實作 `src/family-domain.js`，只實作 BDD-001 / SDD-001 所要求的家庭邊界行為。

之後依新的 Definition of Done 補上最小 UI，並新增 3 個 UI contract tests，確認畫面包含建立家庭 / 新增孩子、可以用兩個模擬家長驗收隔離，而且 UI 直接使用同一份 `family-domain.js`。

## Test Result / 測試結果

執行：

`npm test`

結果：

- Tests: 16
- Passed: 16
- Failed: 0
- Skipped: 0

其中：

- Domain tests: 13
- UI contract tests: 3

Regression 完整測試集：16/16 通過。

The full regression suite passes 16/16 tests.

## Domain 覆蓋項目

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

## UI Contract 覆蓋項目

14. UI 有「建立家庭」與「新增孩子」的操作入口。
15. UI 可用家長 A / 家長 B 模擬已登入身份，直接觀察家庭隔離。
16. UI import 並使用 `src/family-domain.js`，不是獨立寫死的假資料規則。
