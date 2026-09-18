# BDD-005 Implementation Handoff / 實作交接

日期 Date: 2026-09-18  
Repository: `yuhsuanyhtu/QeKStudy`  
Current branch: `main`  
Handoff baseline commit: `aaface897cb24efc7102564dfd3ff7bf067f00f2`

> 本文件是給沒有前文聊天記憶的實作者（Codex / Claude / 其他工程 agent）使用。
> 請先讀完列出的 spec，再修改任何程式碼。
>
> This document is for an implementation agent with no prior conversation memory.
> Read the repository specs before changing code.

---

## 1. 目前角色分工 / Responsibility Split

**實作者負責：**

- 程式實作
- Apps Script 修改
- UI 修改
- 效能優化
- 測試修正
- commit / PR

**規格與驗收 owner 負責：**

- BDD / SDD / TDD
- acceptance criteria
- product boundary decisions
- regression review
- UI + Google Sheet acceptance
- final Story Done 判定

不要自行擴張產品範圍，也不要重寫已確認 BDD / SDD，除非發現規格互相矛盾；若矛盾，先提出問題。

---

## 2. 必讀文件 / Read These First

依序閱讀：

1. `docs/STATUS.md` — Story status 的 single source of truth
2. `docs/process/AGILE_WORKFLOW.md`
3. `docs/bdd/BDD-005-core-practice-review-guidance.feature`
4. `docs/sdd/SDD-005-english-learning-reward-loop.md`
5. `docs/tdd/TDD-005-english-learning-reward-loop.md`
6. `GptThinking/BDD-005_PRODUCT_DIRECTION.md`
7. `README.md`

如果文件與程式碼衝突，以 BDD / SDD / STATUS 為優先；不要用「現有 code 就是需求」反推產品行為。

---

## 3. 目前 Story 狀態 / Current Story State

唯一 ACTIVE Story：

**BDD-005 — 英文最小學習與獎勵閉環**

目前是：

`ACTIVE · TDD GREEN · DEPLOYMENT PENDING`

Baseline automated regression:

**99 / 99 PASS**

Story 還不是 Done。

尚未完成的主要項目：

- 真正的學生操作驗收
- Google Sheet `learning_events` 寫入驗收
- saving pool 重算驗收
- 正式 CAP 題目與來源驗收
- 效能 / 快速操作問題
- Full regression
- UI + BDD Acceptance

---

## 4. 不要碰的範圍 / Do Not Expand Scope

### Authentication

完整 Authentication 已 review，但刻意延後。

BDD-005 現在只做：

- 單一家庭
- 單一學生
- 受控使用

受控學生由 Apps Script Script Property：

`QEK_CONTROLLED_STUDENT_ID`

server-side 決定。

Browser 不得自行指定 `student_id`。

不要在 BDD-005 中導入 Firebase / OAuth / 正式登入。

### 家長發錢 / payout

BDD-005 只負責：

`學習 → reward → saving pool`

真正：

`saving pool → 家長提領 → payout`

是後續獨立 Story。

不要在 BDD-005 做家長 $100 提領頁。

---

## 5. 資料與內容來源 / Data and Content Boundaries

### Google Sheet

正式學習紀錄使用 Google Sheet。

目前 schema 已是 v3，包含：

- families
- students
- schema_meta
- audit_log
- learning_events

`learning_events` 是學習事件流水帳。

每筆 event 必須保留：

- family_id
- student_id
- subject
- session_id
- event_type
- content_id
- attempt_no
- correct
- first_attempt_correct
- reward_amount
- review_target
- source_ref

saving pool 應能從事件重算，不要直接把餘額當唯一真相。

### 英文教材 / 題目

英文教材與題目的 source of truth：

`data/english/catalog.json`

不要把題目重新硬編碼進 `.gs`。

Apps Script 負責：

- 讀 catalog
- 驗證 catalog
- 判分
- 算 reward
- 寫 learning_events

Browser 只送學生行為 / 答案，不得自己指定：

- correct
- reward_amount
- family_id
- student_id

### 題目 revision

題目 / lesson / word 要有 stable ID + revision。

實質修改內容時升 revision。

learning event 的 content_id 使用：

`id@revision`

避免日後題目更新後無法追查學生當時作答版本。

---

## 6. 英文內容來源策略 / English Content Strategy

第一版內容來源優先順序：

1. 學校老師提供的英文課本：確認「目前實際學到哪裡」
2. TeenageStudyTool：已整理的英文單字 / 練習內容，可優先重用
3. 升學王教材：跨版本範圍參考，不當成可任意複製的題庫
4. 歷屆會考：正式 CAP 題目來源

TeenageStudyTool repo：

`yuhsuanyhtu/TeenageStudyTool`

已知有：

- `docs/v2/data/textbook-y2-fall.json`
- `textbook-y1-fall.json`
- `textbook-y1-spring.json`
- `sentences-y2-fall.json`
- `cloze-y2-fall.json`
- CEFR A1/A2/B1/B2 data

目前 QeKStudy 的 Demo catalog 還不是正式完整教材。

### CAP

BDD-005 明確要求：

- 至少一題正式會考考古題
- 只有 prerequisite knowledge 全部已學才可出
- 保留 year / question number / source
- 未學內容不能出

目前 placeholder 不算 acceptance 完成。

不要直接複製第三方「詳解文字」。
QeKStudy 的 review target / explanation 應自己整理。

---

## 7. 零用金規則 / Reward Rules

已確認原則：

- 難度不同可有不同 reward
- retry reward 可以不同
- 已掌握內容重複成功，reward 遞減
- 每科每日有 cap
- cap 到了仍可繼續學
- 閃卡全部看完可有 exposure reward
- flashcard exposure 不等於 mastery
- reward 累積進 saving pool

**但實際金額尚未確認。**

不要自行發明 production reward 數字。

若需要測試，可用 test fixture 數值；不要把 fixture 數字當產品決策。

---

## 8. Flashcard 核心規則

假設一課 30 字：

- 每一字必須各自顯示至少 1000ms
- 可以分段累積，例如 600 + 500ms
- background tab 時間不算
- 停一張卡 30 秒不能讓其他卡完成
- 30/30 才算 lesson completion
- 29/30 不算完成
- completion 是 exposure，不是 mastery

---

## 9. Quiz 核心規則

第一個一般測驗：

**中文 → 英文**

另支援 minimal multiple choice 給 CAP。

測驗至少混合：

- CURRENT
- PRIOR
- eligible CAP

不寫死比例。

答錯後：

- 顯示 review target
- 學生可 Retry
- 或 Continue
- 不強迫 remediation

First-attempt truth：

第一次錯、第二次對，仍必須保存：

`firstAttemptCorrect = false`

同一題同一 session 最多一次成功 reward，避免 farming。

---

## 10. 目前已知效能問題 / Known Performance Issue

這是下一位實作者應優先處理的工程問題。

手動驗收觀察：

> 資料載入有可感延遲；如果學生操作太快，UI 偶爾會顯示紅色 persistence/server error。

在此 handoff baseline，**不要假設效能問題已解決**。

請先量測與定位，再改善。

可能涉及但不要盲目照做：

- Apps Script 每次 request 重複讀 Google Sheet
- 每次 request 重新抓 repo catalog
- 寫入後再次讀整張 learning_events
- concurrent `google.script.run` requests
- LockService contention
- double submit / rapid navigation
- UI 把 transport / server / persistence error 全部混成一類

要求：

1. 先寫或補足 regression / performance-related contracts。
2. 不破壞 first-attempt / reward / saving-pool semantics。
3. 不用「把所有資料放 browser」來逃避 server correctness。
4. 不要因效能理由相信 browser 傳來的 reward/correct/student_id。
5. 快速操作不得造成 duplicate reward / duplicate success event。
6. UI 應避免使用者因連點而造成不必要 concurrent write。
7. 錯誤訊息至少要區分 server busy / persistence failure / content failure。

---

## 11. Apps Script / 部署狀態

現有 Apps Script Web App 已有人工作業部署過 BDD-005 的 working version。

Repo baseline 已回到使用者報告「功能好像好了，但 performance 有問題」之前。

**不要要求使用者重新手動貼整套 Apps Script。**

新的實作工作應由工程 agent 直接處理 repo；若環境支援 Apps Script deployment，優先自動化 deployment / sync。

若無法部署：

- 完成 repo implementation
- 明確列出需要同步的檔案與 deployment 變更
- 不要假裝已部署

目前已知 Script Property：

`QEK_CONTROLLED_STUDENT_ID`

是受控學生綁定來源。

不要把具體 real student ID 寫進 repo。

---

## 12. Regression / Done Gate

任何修改後：

`npm test`

必須全綠。

BDD-001～003 不可 regression。

BDD-005 Done 必須包含：

- TDD Green
- 可操作學生 UI
- flashcard 1s acceptance
- CURRENT + PRIOR + eligible CAP
- wrong answer review guidance
- Retry / Continue
- first-attempt truth
- learning_events 寫入
- saving pool 可重算
- reward / repeat decay / cap
- content provenance
- full regression
- UI + BDD acceptance
- docs sync

**沒有可操作 UI，不算 Done。**

---

## 13. 實作者第一個任務 / First Implementation Task

先不要重寫產品。

第一個工程任務：

> **在保留目前 99/99 regression 與 BDD-005 行為的前提下，定位並改善 Apps Script 學習頁的載入與快速操作效能問題。**

交付時必須說明：

1. 找到的瓶頸
2. 改了哪些檔案
3. 為什麼不會造成 duplicate reward / event
4. 新增哪些測試
5. `npm test` 結果
6. 是否已實際 deploy
7. 如果沒有 deploy，使用者還需要做什麼
8. 還有哪些 acceptance gap（尤其正式 CAP 題）

不要把 BDD-005 標成 Done。
