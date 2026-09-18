# QeKStudy

> 中文 / English

QeKStudy 是一個從實際家庭與班級學習需求出發的跨科學習系統。  
它目前正在以 **Agile + BDD + SDD + TDD + Regression** 的方式，一次一個 Story 開發。

QeKStudy is a multi-subject learning system built from real family and classroom learning needs.  
Development follows **Agile + BDD + SDD + TDD + Regression**, one story at a time.

---

## 目前目標 / Current Goal

QeKStudy 的方向不是單純「多做題」，而是讓學生：

- 願意開始與持續練習
- 逐步增加題量與挑戰，但保留小而可完成的一輪
- 以目前課堂進度為主，持續混入以前學過的知識
- 依學生「已學過的知識」逐步加入可作答的會考考古題
- 答錯時知道應該回哪裡複習，並由學生自己決定繼續、重試或回去複習
- 保留第一次作答的事實，不因後來答對而假裝第一次就會
- 把學習行為與家庭控制的零用金機制連結
- 支援不同家庭、不同學生與不同科目

QeKStudy is intended to help students:

- start and continue practicing,
- increase practice volume and challenge while keeping rounds small and completable,
- practice current classroom content while revisiting previously learned knowledge,
- progressively include CAP past-exam questions whose prerequisite knowledge has already been learned,
- receive actionable review directions after mistakes while keeping control over whether to continue, retry, or review,
- preserve first-attempt truth even when a later retry succeeds,
- connect learning activity with a family-controlled allowance mechanism,
- and support multiple families, students, and subjects.

更多背景請看：  
See product background:

- `GptThinking/PRODUCT_ORIGIN.md`
- `GptThinking/BDD-005_PRODUCT_DIRECTION.md`

---

## 開發方式 / Development Workflow

每個 Story 固定走：

```text
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
Minimal UI
↓
Story Tests
↓
Regression
↓
UI + BDD Acceptance
↓
Done
```

**沒有可操作 UI，就不算 Done。**

**A story is not Done without an operable UI.**

完整流程：  
Full workflow:

`docs/process/AGILE_WORKFLOW.md`

Story 看板 / Story status board:

`docs/STATUS.md`

---

## 目前進度 / Current Status

### BDD-001 — 家庭可見性與孩子綁定
### Family Visibility & Child Binding

狀態：**Done**

Status: **Done**

已完成：

- 建立家庭
- 建立者具有家庭管理權
- 家長只能看到自己的家庭
- 家長只能在自己的家庭新增孩子
- 跨家庭讀取與修改會被拒絕
- 最小可操作 UI
- Regression：16/16 通過

Completed:

- family creation,
- managing-parent ownership,
- family-scoped visibility,
- child creation within owned family,
- cross-family access prevention,
- minimal operable UI,
- regression: 16/16 passing.

規格與驗收：

- `docs/bdd/BDD-001-family-child-binding.feature`
- `docs/sdd/SDD-001-family-child-binding.md`
- `docs/tdd/TDD-001-family-child-binding.md`
- `docs/acceptance/Acceptance-001-family-child-binding.md`

### BDD-002 — 家庭與孩子資料持久化
### Persistent Family & Child Data

狀態：**Done — Regression 28/28 PASS**

Status: **Done — Regression 28/28 PASS**

目前設計：

- Google Sheet 作為 durable storage
- Google Apps Script 作為 server-side persistence layer
- 跨 reload / browser restart / device 仍可取得資料
- 持久化後仍維持家庭隔離
- 儲存失敗不得假裝成功
- 正式 Authentication 完成前只使用 Demo data

Current design:

- Google Sheets as durable storage,
- Google Apps Script as server-side persistence,
- data survives reload/browser/device changes,
- family isolation remains enforced,
- persistence failures must be explicit,
- demo data only until production authentication exists.

規格與驗收：

- `docs/bdd/BDD-002-persistent-family-data.feature`
- `docs/sdd/SDD-002-persistent-family-data.md`
- `docs/tdd/TDD-002-persistent-family-data.md`
- `docs/acceptance/Acceptance-002-persistent-family-data.md`

### BDD-003 — 名稱維護與管理員資料管理
### Rename & Admin Data Management

狀態：**Done — Regression 57/57 PASS**

Status: **Done — Regression 57/57 PASS**

- 家長可修改自己家庭與孩子的顯示名稱。
- 管理員可協助修改任何家庭與孩子的顯示名稱。
- 只有管理員可執行資料刪除。
- 一般家長仍不得跨家庭操作。
- 管理員破壞性操作已在安全測試邊界驗證；正式登入前不暴露於公開 Demo。

規格與驗收：

- `docs/bdd/BDD-003-admin-data-management.feature`
- `docs/sdd/SDD-003-admin-data-management.md`
- `docs/tdd/TDD-003-admin-data-management.md`
- `docs/acceptance/Acceptance-003-admin-data-management.md`

### BDD-004 — 使用者登入與角色辨識
### Authentication & Role Recognition

狀態：**Backlog — Deferred / Trigger-based**

Status: **Backlog — Deferred / Trigger-based**

- 未登入不能讀寫家庭私人資料。
- 已登記帳號登入後，server-side 決定 PARENT / ADMIN。
- Browser 不能靠傳入 role / parentId 冒用身份。
- 未登記帳號不會被自動賦予家庭或管理員權限。
- 登出後私人操作立即失效。
- 本 Story 暫緩；撿回條件請看 `docs/STATUS.md`。

### BDD-005 — 英文最小學習與獎勵閉環
### English Minimum Learning & Reward Loop

狀態：**ACTIVE — TDD Green / Deployment Pending**

Status: **ACTIVE — TDD Green / Deployment Pending**

BDD-004 已 review，但完整 Authentication 延後。
BDD-005 以單一家庭 / 單一學生受控版本繼續：

- 學習與獎勵紀錄寫入 Google Sheet。
- 每筆紀錄保留 family_id / student_id。
- 學習獎勵累積進 saving pool。
- 英文教材與題目放在 `data/english/catalog.json`；一般題目更新只改 repo，不需要重新部署 Apps Script。
- 真正家長提領 / payout 是後續獨立 Story。
- 第一個一般測驗維持中翻英。
- TDD-005 已轉綠：99/99 PASS。Google Sheet 已是 schema v3 並有 learning_events；Apps Script English UI 尚待部署與真實 Sheet 驗收。

- 第一科固定從 **英文** 開始。
- 第一版至少包含單字閃卡與一種真正可判定答對/答錯的測驗。
- 閃卡必須把該課每個單字各自實際顯示至少 1 秒，全部完成才取得基本接觸獎勵。
- 測驗要同時包含目前內容、以前已學內容，以及 prerequisite 全部已學的會考考古題。
- 答錯時提供可行動的複習方向；學生自己決定繼續或重試，不強迫 remediation。
- 第一次作答結果必須保留，後來答對不能把第一次錯誤洗掉。
- 零用金是核心機制：可依困難程度給不同基礎點數、已掌握內容重複複習時獎勵遞減、每科每日有頂標；達頂標後仍可繼續學習。
- 本 BDD 不指定實際金額，也不做自動選題、完整題庫或正式多家庭學習紀錄。
- SDD-005：`docs/sdd/SDD-005-english-learning-reward-loop.md`
- TDD-005：`docs/tdd/TDD-005-english-learning-reward-loop.md`

---

## Demo / 驗收畫面

目前 Demo：

https://yuhsuanyhtu.github.io/QeKStudy/

BDD-002 Apps Script persistence demo:

https://script.google.com/macros/s/AKfycbwaGdC88YUhlRjYmM1znhMqs4fpEYhnJ2cNkQhEa-EsKccjPzb7PshR2STbqZ6z5IUh2w/exec

BDD-001 GitHub Pages demo remains available. BDD-002 persistence uses the Apps Script demo below.

目前畫面中的「家長 A / 家長 B」是 **開發驗收用模擬身份**，不是正式登入。

The “Parent A / Parent B” switch is a **development acceptance simulation**, not production authentication.

> ⚠️ 在正式 Authentication Story 完成前，不要輸入真實學生、家庭或零用金資料。  
> ⚠️ Do not enter real student, family, or allowance data until production authentication is implemented.

---

## 本機執行 / Run Locally

目前前端是純 HTML / CSS / JavaScript。

The current frontend uses plain HTML / CSS / JavaScript.

可使用任何簡單 HTTP server，例如：

```bash
python3 -m http.server 8000
```

然後開：

`http://localhost:8000/`

測試：

```bash
npm test
```

目前 Node.js requirement：

`Node.js >= 20`

---

## Repository Structure / 專案結構

```text
QeKStudy/
├─ index.html
├─ app.js
├─ style.css
├─ src/
│  └─ family-domain.js
├─ test/
│  ├─ family-domain.test.js
│  └─ ui-contract.test.js
├─ docs/
│  ├─ bdd/
│  ├─ sdd/
│  ├─ tdd/
│  ├─ acceptance/
│  └─ process/
└─ GptThinking/
   ├─ PRODUCT_ORIGIN.md
   ├─ BDD-005_PRODUCT_DIRECTION.md
   └─ session-2026-09-18.md
```

---

## 原則 / Principles

- 一次只做一個 Story。  
  One story at a time.
- 需求可以改，但修改原因與歷史要保留。  
  Requirements may change, but history and rationale remain traceable.
- 每個 Story 都做完整 Regression。  
  Every story runs the full regression suite.
- 真實使用行為、學生回饋、家長觀察與老師經驗優先於預設想像。  
  Real usage, student feedback, parent observation, and teacher experience drive requirements.
- 家庭是私人資料與零用金的主要邊界。  
  Family is the primary boundary for private data and allowance control.
- 學習流程的控制權在學生；系統提供資訊與修正方向，不以答錯為理由強迫 remediation。  
  The student controls the learning flow; the system provides information and a path to correction rather than forcing remediation.
- 零用金是產品核心動機機制之一，但規則、核准與實際發放仍由家庭控制。  
  Allowance is a core engagement mechanism, while rules, approval, and actual payout remain under family control.
