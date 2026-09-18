# QeKStudy Agile Delivery Process / 敏捷交付流程

日期 Date: 2026-09-18

## 核心原則 / Core Principle

QeKStudy 採用一次一個需求的 Agile 開發方式。

QeKStudy follows an Agile process where only one requirement/story is actively developed at a time.

不在同一輪同時開發多個 Story。當前 Story 未完成、未驗收、Regression 未通過前，不進入下一個 Story。

Do not develop multiple stories in parallel. The next story does not begin until the current story is complete, accepted, and regression tests pass.

---

## 每個 Story 的固定流程 / Standard Story Flow

1. **BDD — Behavior Driven Development**
   - 先描述使用者行為與可驗收情境。
   - 定義 Given / When / Then。
   - 不先談技術實作。

2. **SDD — Software/System Design**
   - 根據已確認的 BDD 設計資料、流程、權限與介面。
   - 記錄重要設計決策與取捨。

3. **TDD — Test Driven Development**
   - 先建立會失敗的測試。
   - 測試必須直接對應 BDD scenario 或 SDD 規則。

4. **Implementation / 實作**
   - 只寫足以讓本 Story 測試通過的程式。
   - 不順便加入尚未進入 BDD 的功能。

5. **Story Test / 本 Story 測試**
   - 新增測試全部通過。
   - 驗證邊界條件與錯誤情境。

6. **Regression / 回歸測試**
   - 跑所有既有自動化測試。
   - 驗證先前完成的 Story 沒有被破壞。
   - 若 Regression 失敗，本 Story 不得標記完成。

7. **Acceptance / 驗收**
   - 對照 BDD scenario 驗證使用者行為。
   - 必要時進行人工 UI/流程驗收。

8. **Commit**
   - Regression + Acceptance 通過後 commit。
   - Commit 必須能追溯到 Story / BDD 編號。

---

## Definition of Done / 完成定義

一個 Story 只有在以下全部成立時才算 Done：

- [ ] BDD 已確認
- [ ] SDD 已完成
- [ ] TDD 測試已建立
- [ ] 實作完成
- [ ] 新增測試全部通過
- [ ] 全套 Regression 通過
- [ ] BDD 驗收情境通過
- [ ] 文件已同步
- [ ] Commit 已完成
- [ ] Session / GptThinking 紀錄已更新（若有重要產品或設計決策）

A story is Done only when BDD, design, tests, implementation, regression, acceptance, documentation, and commit are all complete.

---

## Regression 原則 / Regression Policy

Regression 是每一個 Story 的必要步驟，不是大型版本才做。

Regression is mandatory for every story, not only for major releases.

至少包含：

- 既有 unit tests
- 既有 integration tests
- 權限與資料隔離測試
- 金額 / 獎勵計算測試（只要該模組已存在）
- 重要學生學習流程
- 重要家長流程
- 先前修復過的 bug 測試

當發現 bug 時：

1. 先新增可以重現 bug 的測試。
2. 確認測試會失敗。
3. 修正。
4. 跑該測試。
5. 跑完整 Regression。
6. 全部通過後才 commit。

For every bug, first add a reproducing test, then fix it, then run the full regression suite before committing.

---

## Scope Discipline / 範圍控制

每一輪只處理當前 Story 明確定義的內容。

If an unrelated idea appears during implementation:

- 不順手實作。
- 記錄成新的候選 BDD / backlog item。
- 等目前 Story 完成後再決定優先順序。

Do not implement unrelated ideas opportunistically. Record them in the backlog and prioritize them after the current story is finished.

---

## 建議 Commit 命名 / Suggested Commit Naming

需求：
`docs(bdd): add BDD-xxx ...`

設計：
`docs(sdd): add SDD-xxx ...`

測試：
`test: add failing tests for BDD-xxx`

實作：
`feat: implement BDD-xxx ...`

修正：
`fix: ...`

完整 Story 結束時，commit history 應能清楚追溯需求、設計、測試與實作。

---

## QeKStudy Delivery Loop / QeKStudy 交付循環

```
One Story
   ↓
BDD
   ↓
SDD
   ↓
TDD (Red)
   ↓
Implementation
   ↓
TDD (Green)
   ↓
Regression
   ↓
Acceptance
   ↓
Commit
   ↓
Next Story
```

**一次一個，做完再下一個。**
**One story at a time. Finish it before starting the next.**
