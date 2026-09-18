# QeKStudy Story Status / Story 看板

最後更新 Last updated: 2026-09-18

這份文件是 QeKStudy **Story 狀態的 single source of truth**。

This file is the **single source of truth for Story status**.

README 只保留專案入口與目前方向；完整的 Active / Backlog / Done 狀態以本文件為準。

---

## Status Definitions / 狀態定義

| Status | 中文定義 | English |
|---|---|---|
| `ACTIVE` | 現在唯一正在做的 Story | The one Story currently in development |
| `READY` | Backlog 中已足夠清楚，可被下一輪挑選 | Backlog item clear enough to start next |
| `DEFERRED` | 已知需要，但刻意延後 | Needed, but intentionally postponed |
| `TRIGGER-BASED` | 只有特定條件成立才撿回 | Resume only when an explicit trigger occurs |
| `DONE` | 已完成 Definition of Done | Definition of Done satisfied |
| `DROPPED` | 決定不做；保留原因與歷史 | Intentionally not pursued; rationale retained |

原則：

- 一次只能有一個 `ACTIVE` Story。
- Backlog item 不因時間久就自動升級。
- `DEFERRED` / `TRIGGER-BASED` 必須寫清楚「為什麼延後」與「什麼情況撿回」。
- Story 被撿回時，先重新檢查舊 BDD 是否仍符合當時產品狀態，再進 SDD。
- Done 的 Story 不從表中消失；歷史保留。

---

## Current / 現在

目前唯一 ACTIVE Story：

**BDD-005 — 核心練習與錯題複習指引 / Core Practice & Wrong-answer Review Guidance**

Current active work is the first directly testable learning loop:

`subject/unit → practice → answer → review target → summary`

BDD-004 Authentication 維持 `DEFERRED · TRIGGER-BASED`。

---

## Active / 進行中

| Story | Status | Goal / 目標 | Spec |
|---|---|---|---|
| **BDD-005 — 核心練習與錯題複習指引 / Core Practice & Wrong-answer Review Guidance** | `ACTIVE · BDD DRAFT` | 驗證學生能完成「選科目/單元 → 作答 → 答錯得到複習位置 → 完成摘要」的最小學習迴圈。 | `docs/bdd/BDD-005-core-practice-review-guidance.feature` |

## Backlog / 待辦 Story

| Story | Status | Why deferred / 為什麼現在不做 | Pickup Trigger / 何時撿回 | Existing spec |
|---|---|---|---|---|
| **BDD-004 — 使用者登入與角色辨識 / Authentication & Role Recognition** | `DEFERRED · TRIGGER-BASED` | 目前先維持受控 single-family / demo 模式，優先驗證學習價值。完整 Authentication 現在會增加工程完整性，但不直接增加學生第一次試用的學習價值。 | 任一成立就重新評估：① 第二個真實家庭開始使用；② 班上其他家長要自行輸入真實資料；③ 要保存真實姓名、學習紀錄或獎勵資料；④ 要公開 Admin 修改/刪除 UI；⑤ 系統從受控 Demo 轉成可讓外部使用者自行加入的 pilot。 | `docs/bdd/BDD-004-authentication-role-recognition.feature` |

### BDD-004 Safety Boundary While Deferred / 延後期間安全邊界

在 BDD-004 撿回以前：

- Apps Script 身分切換仍是 **Demo identity，不是登入**。
- 不應把公開 URL 當 production multi-family security boundary。
- Public UI 不開放 administrator destructive operations。
- Demo 應使用測試資料；若進入真實多家庭 / 真實學生資料，就觸發 BDD-004。
- 不新增「半套登入」來製造已安全的錯覺。

---

## Done / 已完成

| Story | Status | Result |
|---|---|---|
| **BDD-001 — 家庭可見性與孩子綁定** | `DONE` | Family boundary + child binding + UI |
| **BDD-002 — 家庭與孩子資料持久化** | `DONE` | Google Sheet / Apps Script durable persistence |
| **BDD-003 — 名稱維護與管理員資料管理** | `DONE` | Parent rename, admin management domain, schema v2, audit log, soft delete safety boundary |

Current regression baseline after BDD-003: **57 / 57 PASS**.

---

## How We Use This Board / 使用方式

每次準備開始新 Story 時：

1. 看 `ACTIVE` 是否為空。
2. 看 `READY` 項目，或檢查 `TRIGGER-BASED` 的 trigger 是否成立。
3. 若使用者提出新需求，先判斷：
   - 現在做 → 建 BDD 並設為 `ACTIVE`
   - 清楚但不是現在 → `READY`
   - 有價值但刻意延後 → `DEFERRED`
   - 只有某條件成立才需要 → `TRIGGER-BASED`
4. 若 trigger 成立，不直接開始 coding；先重新 review 舊 BDD。
5. Story 完成後改成 `DONE`，並保留 acceptance / commits / migration history。

這樣 backlog 是一個有決策資訊的產品記憶，而不是願望清單。

The backlog is decision memory, not a wish list.
