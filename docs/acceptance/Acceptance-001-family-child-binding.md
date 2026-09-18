# Acceptance-001 — 家庭可見性與孩子綁定 / Family Visibility & Child Binding

日期 Date: 2026-09-18  
BDD: BDD-001  
SDD: SDD-001  
TDD: TDD-001

## 驗收結果 / Acceptance Result

**PASS / 通過**

目前此 Story 尚未包含 UI，因此以 domain-level executable tests 驗收 BDD 行為。

This story does not yet include a UI, so acceptance is performed using executable domain-level tests mapped directly to the BDD scenarios.

## Scenario 1 — 家長建立新家庭

驗收：
- 家庭成功建立。
- 建立者取得 `MANAGING_PARENT` 管理權。
- 新家庭出現在建立者自己的可見家庭清單。

Result: PASS.

## Scenario 2 — 家長只看得到自己的家庭群組

驗收：
- Parent A 只能列出 Parent A 被授權的 Family。
- Parent B 的 Family 不出現在 Parent A 的結果中。
- 其他家庭名稱與孩子名稱不會出現在回傳資料。

Result: PASS.

## Scenario 3 — 家長在自己的家庭建立孩子

驗收：
- 管理家長可以建立 Student。
- Student 綁定到指定 Family。
- 其他 Family 不會取得此 Student。

Result: PASS.

## Scenario 4 — 家長不得操作其他家庭

驗收：
- 不能在其他 Family 建立孩子。
- 不能讀其他 Family 私人資料。
- 不能修改其他 Family 的 Student。
- 即使直接提供其他 `familyId` / `studentId` 仍被拒絕。
- 被拒絕後原資料保持不變。

Result: PASS.

## Regression / 回歸

完整測試集：13  
通過：13  
失敗：0

Full regression suite: 13 tests, 13 passed, 0 failed.

## Story Status

BDD-001 Definition of Done 已滿足目前 Story 範圍：

- [x] BDD 確認
- [x] SDD 完成
- [x] TDD Red
- [x] Implementation / Green
- [x] Story tests passed
- [x] Regression passed
- [x] Acceptance passed
- [x] 文件同步

BDD-001 is complete for its defined scope.
