# TDD-005 — 英文最小學習與獎勵閉環
# English Minimum Learning & Reward Loop

狀態 Status: **RED — tests written, implementation not started**  
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
