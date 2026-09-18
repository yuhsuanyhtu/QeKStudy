# TDD-005 — 英文最小學習與獎勵閉環
# English Minimum Learning & Reward Loop

狀態 Status: **GREEN — 97/97 PASS；尚未完成部署驗收 / deployment acceptance pending**  
對應 BDD: **BDD-005 APPROVED**  
對應 SDD: **SDD-005 APPROVED**  
日期 Date: **2026-09-18**

---

## 1. 目的

先用失敗測試固定 BDD-005 的行為，再開始任何功能實作。

這一輪 **不做**：

- schema v3 migration
- learning_events worksheet
- 英文 UI
- learning domain implementation
- Apps Script learning persistence

測試先失敗，確認我們真的在測尚未實作的需求。

---

## 2. 新增測試

### test/learning-domain.test.js — 16 個

覆蓋：

1. 單字累積可見時間滿 1000ms 才算
2. 背景分頁時間不算
3. 全部單字達標才算整課完成
4. 停在一張卡不會讓其他卡完成
5. 中翻英忽略前後空白與大小寫
6. 中翻英支援多個可接受答案
7. 選擇題用固定 choiceId 判分
8. 會考題全部必要知識已學才 eligible
9. 會考題缺任一必要知識就不 eligible
10. Demo 題組包含 CURRENT / PRIOR / CAP
11. 第一次答錯、重試答對仍保留 firstAttemptCorrect=false
12. 同一題同一輪最多發一次成功獎勵
13. 較高難度可以有較高基本獎勵
14. retry 獎勵可以低於 first-try correct
15. 已掌握內容重複複習獎勵遞減
16. 每日上限只限制獎勵、不阻止學習

### test/learning-event-service.test.js — 7 個

覆蓋：

17. learning event 使用 server 控制的 family_id / student_id
18. 每次作答可寫入 learning_events
19. persistence 失敗不能回成功
20. saving pool 可由 reward_amount 重算
21. 今日英文已賺只計同學生 / 同日 / 同科
22. 歷史成功次數可依 student_id + content_id 重算
23. learning event 保留會考來源與複習方向

### test/schema-v3-learning-contract.test.js — 5 個

覆蓋：

24. Apps Script 必須要求 schema_version = 3
25. schema v3 必須有 learning_events 與必要欄位
26. 受控學生 ID 從 server Script Properties 取得
27. Apps Script 必須有 learning-event persistence helpers
28. Apps Script 必須能 route 到 English view，同時保留家庭 Demo

### test/english-ui-contract.test.js — 5 個

覆蓋：

29. English page 提供單字閃卡與測驗
30. English page 顯示今日英文已賺與 saving pool
31. 答錯後同時提供「再試一次」與「繼續下一題」
32. 結果頁區分 first-try / retry / unresolved / review
33. English page 不暴露 studentId selector

新增總計：**33 個 BDD-005 contracts**

---

## 3. Red 預期

目前既有 regression baseline：

**57 / 57 PASS**

加入 TDD-005 Red 後，預期：

- 原有 57 個測試仍應通過
- 新增 33 個測試應因尚未實作而失敗
- overall CI 應為 failure，這是正常的 RED

預期失敗原因：

- src/learning/flashcard-exposure.js 尚不存在
- src/learning/answer-evaluator.js 尚不存在
- src/learning/quiz-composer.js 尚不存在
- src/learning/attempt-state.js 尚不存在
- src/learning/reward-engine.js 尚不存在
- src/learning/learning-event-service.js 尚不存在
- apps-script/English.html 尚不存在
- Apps Script 仍要求 schema v2
- learning_events 尚不存在
- QEK_CONTROLLED_STUDENT_ID 尚未由 Script Properties 綁定
- English route 尚未實作

---

## 4. Red 階段資料安全

Red 階段不碰目前 Demo DB。

目前 Google Sheet：

schema_version = 2

Red 階段：

- 不 migration
- 不新增 learning_events
- 不改現有 rows
- 不部署新 Apps Script learning endpoint

只有測試與文件變更。

---

## 5. 下一步 Green 前順序

Red 驗證成立後，才依序：

1. 規劃 schema v2 → v3 migration
2. 再做一份 schema v3 migration 前 backup
3. 建立 learning_events
4. 實作純 JS learning modules
5. 實作 Apps Script learning persistence
6. 實作 English UI
7. TDD Green
8. 完整 regression
9. UI + BDD acceptance

---

## English Summary

TDD-005 Red adds 33 contracts covering flashcard exposure, answer evaluation, eligible mixed quizzes, attempt history, reward decay and daily caps, Google Sheets learning events, saving-pool reconstruction, controlled student binding, schema v3, and the English student UI.

No learning implementation or database migration is performed during Red.


---

## 6. Actual Red Verification / 實際 Red 驗證

GitHub Actions run: `35343824480`

結果：

- Total: **90**
- Pass: **57**
- Fail: **33**
- Overall CI: **failure — expected RED**

已確認：

- BDD-001～BDD-003 原本 **57 個 regression 全部通過**。
- 新增的 **33 個 BDD-005 contracts 全部失敗**。
- 失敗原因都屬於尚未實作的 BDD-005 expectation：
  - English.html 尚不存在；
  - learning domain modules 尚不存在；
  - learning-event service 尚不存在；
  - Apps Script 仍是 schema v2；
  - learning_events 尚不存在；
  - controlled student binding 尚未實作；
  - English route 尚未實作。

因此目前是有效的 **TDD-005 Red**。

下一步才能進 Implementation / Green。

**English:**  
The Red run is valid: all 57 existing regression tests remain green, while all 33 new BDD-005 contracts fail because the new behavior has not been implemented yet.


---

## 7. Green Verification / Green 驗證

GitHub Actions run: `35345783106`

結果：

- Total: **90**
- Pass: **90**
- Fail: **0**
- Overall CI: **success**

實作已讓以下 contracts 轉綠：

- flashcard exposure tracker
- 中翻英 / 選擇題答案判定
- CURRENT / PRIOR / CAP eligibility
- first-attempt truth
- retry reward protection
- difficulty / retry / repeat decay / daily cap
- learning event service
- saving pool reconstruction
- controlled family_id / student_id binding contract
- Apps Script schema v3 contract
- English UI contract

### Google Sheet 狀態

驗證時發現目前 Demo DB 已是：

- schema_version = **3**
- 已存在 `learning_events`
- 欄位與 SDD-005 一致

本輪另外建立一份完整備份：

`QeKStudy Database (Demo) - backup before schema v3 - 2026-09-18`

Backup file ID:

`13Nwz39Qz7vyWEcl_wtTpDEviwWoK2P-Ags4iOmLOKww`

不要刪除這份備份。

### 尚未完成

Green 代表 repo contracts 通過，不代表 Story Done。

仍需：

1. 將 Apps Script 新增檔案與 Code.gs 部署到 Web App。
2. 設定 `QEK_CONTROLLED_STUDENT_ID`。
3. 使用實際 English UI 操作。
4. 驗證 learning_events 真的寫入 Google Sheet。
5. 驗證 saving pool 從 Sheet 重算。
6. 驗證 persistence failure 不會假裝成功。
7. 驗證正式 CAP 題內容與來源；目前 repo 內 CAP 題仍是 acceptance placeholder。
8. Full regression + UI/BDD acceptance。

**English:**  
TDD-005 is Green at 95/95, but deployment and real Google Sheet/UI acceptance are still pending.


---

## 8. Repo-backed Content Architecture / 題庫外部化

使用者在部署前發現題目不應寫死在 `EnglishContent.gs`。

因此補上 5 個 architecture contracts：

34. English content source of truth 是 `data/english/catalog.json`
35. lesson / word / question 都有明確 revision
36. 未完成驗證的 CAP placeholder 必須 inactive
37. Apps Script 用 UrlFetchApp 從 repo 讀 catalog
38. Browser 不得呼叫可自行指定 rewardAmount 的通用 learning-event API

實作調整：

- 刪除 `apps-script/EnglishContent.gs`
- 新增 `apps-script/EnglishLogic.gs`
- 新增 `data/english/catalog.json`
- `English.html` 只送答案與 exposure 資料
- server 自己載入 repo 題目、判分、算 reward、寫 learning_events
- content_id 使用 `id@revision`
- source_ref 保留 catalogVersion

Verification run: `35347222085`

結果：

- Total: **95**
- Pass: **95**
- Fail: **0**

一般題目內容修改只需要改 repo JSON，不需要重新 deploy Apps Script。


### Reward config safety follow-up

使用者尚未確認實際零用金數字，因此 production-like Demo config 不得自行猜值。

- `EnglishRewardConfig.gs` 目前 `configured: false`
- daily cap / flashcard amount / difficulty amounts 尚未啟用
- 學習與作答仍可寫 learning_events
- reward_amount 暫時為 0
- UI 清楚顯示「零用金規則尚未設定」

Verification run: `35347546883` — **97/97 PASS**
