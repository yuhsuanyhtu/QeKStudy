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

**BDD-005 — 英文最小學習與獎勵閉環 / English Minimum Learning & Reward Loop**

SDD-005 已確認，現在正式進入 TDD-005 Red。

目前決策：

- BDD-004 已重新 review 過，但完整 Authentication 仍刻意延後。
- BDD-005 先以**單一家庭 / 單一學生 / 受控使用**繼續。
- 學習與獎勵紀錄寫入 Google Sheet。
- 每筆 learning event 都保留 family_id / student_id，資料邊界先設計乾淨。
- 學習產生的獎勵累積進 saving pool。
- 英文教材/題目 source of truth 放在 repo JSON；一般內容更新不需要重新部署 Apps Script。
- 真正家長提領 / payout 仍是後續獨立 Story。

---

## Active / 進行中

| Story | Status | Goal / 目標 | Spec |
|---|---|---|---|
| **BDD-005 — 英文最小學習與獎勵閉環 / English Minimum Learning & Reward Loop** | `ACTIVE · TDD GREEN · DEPLOYMENT PENDING` | 英文閃卡、中翻英、目前/舊知識、合格會考題、錯題複習方向、Google Sheet learning events、saving pool。 | BDD: `docs/bdd/BDD-005-core-practice-review-guidance.feature` · SDD: `docs/sdd/SDD-005-english-learning-reward-loop.md` · TDD: `docs/tdd/TDD-005-english-learning-reward-loop.md` |

## Backlog / 待辦 Story

| Story | Status | Why deferred / 為什麼現在不做 | Pickup Trigger / 何時撿回 | Existing spec |
|---|---|---|---|---|
| **BDD-004 — 使用者登入、學生身分與角色辨識 / Authentication, Learner Identity & Role Recognition** | `DEFERRED · REVIEWED · TRIGGER-BASED` | 身分與安全邊界已 review，但目前先驗證單一家庭/學生的學習價值，不讓完整 Authentication 卡住產品。 | ① 第二個真實家庭開始留下學習/獎勵資料；② 其他學生/家長要直接使用同一系統；③ 外部使用者可自行加入；④ 要公開家長提領或 Admin 破壞性操作；⑤ 要把「不能冒用別人」升級成正式安全保證。 | `docs/bdd/BDD-004-authentication-role-recognition.feature` |

---

## Done / 已完成

| Story | Status | Result |
|---|---|---|
| **BDD-001 — 家庭可見性與孩子綁定** | `DONE` | Family boundary + child binding + UI |
| **BDD-002 — 家庭與孩子資料持久化** | `DONE` | Google Sheet / Apps Script durable persistence |
| **BDD-003 — 名稱維護與管理員資料管理** | `DONE` | Parent rename, admin management domain, schema v2, audit log, soft delete safety boundary |

Current automated regression: **97 / 97 PASS**. TDD-005 code is Green; Apps Script deployment and UI/Sheet acceptance remain pending.

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
