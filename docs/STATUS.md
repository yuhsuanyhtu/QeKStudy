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

**BDD-004 — 使用者登入、學生身分與角色辨識 / Authentication, Learner Identity & Role Recognition**

BDD-005 新增了一個正式資料需求：

- 學習與獎勵紀錄要寫入 Google Sheet，學習產生的獎勵累積進 saving pool。

這已觸發原本 BDD-004 的 pickup trigger，因此 BDD-004 重新進入 review。

真正的零用金發放是另一個家長頁流程，不屬於 BDD-005。

BDD-005 暫停在 SDD Draft，等 BDD-004 重新確認後再繼續。

---

## Active / 進行中

| Story | Status | Goal / 目標 | Spec |
|---|---|---|---|
| **BDD-004 — 使用者登入、學生身分與角色辨識 / Authentication, Learner Identity & Role Recognition** | `ACTIVE · BDD RE-REVIEW DRAFT` | 重新確認 PARENT / STUDENT / ADMIN 身分與權限，確保真實學習紀錄、獎勵與零用金發放只能由正確的人讀寫。 | `docs/bdd/BDD-004-authentication-role-recognition.feature` |

## Backlog / 待辦 Story

| Story | Status | Why deferred / 為什麼現在不做 | Pickup Trigger / 何時撿回 | Existing spec |
|---|---|---|---|---|
| **BDD-005 — 英文最小學習與獎勵閉環 / English Minimum Learning & Reward Loop** | `DEFERRED` | 需求已改為要保存真實學習/獎勵到 Google Sheet，並把學習獎勵累積進 saving pool；在身份與權限未重新確認前不能安全進 TDD。 | BDD-004 重新確認並完成必要設計後，先重新 review BDD-005，再重寫 SDD-005。 | BDD: `docs/bdd/BDD-005-core-practice-review-guidance.feature` · SDD draft: `docs/sdd/SDD-005-english-learning-reward-loop.md` |

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
