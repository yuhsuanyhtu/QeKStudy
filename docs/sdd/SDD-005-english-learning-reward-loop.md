# SDD-005 — 英文最小學習與獎勵閉環
# English Minimum Learning & Reward Loop

狀態 Status: **APPROVED — TDD-005 Red 已開始 / TDD-005 Red started**  
對應需求 Requirement: **BDD-005 APPROVED**  
日期 Date: **2026-09-18**

---

## 1. 這一版要做什麼

BDD-005 要先做一個**最陽春、但真的能用的英文學習版本**。

學生可以：

- 看單字閃卡；
- 做中翻英測驗；
- 遇到以前學過的內容；
- 遇到目前已經有能力作答的會考題；
- 答錯時知道去哪裡複習；
- 自己選擇重試或繼續；
- 學習後得到零用金獎勵；
- 學習紀錄和獎勵寫進 Google Sheet；
- saving pool 可以從 Google Sheet 的紀錄算出來。

真正「家長發錢 / 提領」不是 BDD-005，之後另外開 Story。

**English:**  
BDD-005 delivers a minimal English learning loop that writes learning and earned allowance records to Google Sheets. Parent payout remains a separate story.

---

## 2. Authentication 先不做，但資料一定要分乾淨

完整 Authentication 仍然延後。

目前先接受這個限制：

> **這一版只給單一家庭 / 單一學生受控使用，不能把公開網址當成安全的多人系統。**

但是資料不能因此混在一起。

所有學習紀錄都必須有：

- family_id
- student_id

所以未來 Authentication 做好後，只需要把「現在是哪個 student_id」的來源換成登入身份，不需要重做學習資料結構。

### 第一版怎麼知道是哪個學生

不要讓瀏覽器傳 student_id。

Apps Script server 用一個受控設定：

`QEK_CONTROLLED_STUDENT_ID`

這個值放在 Script Properties。

server 再從 students sheet 找到：

- student_id
- family_id

所以第一版雖然沒有登入，但至少不讓瀏覽器自己決定「我要替哪個學生寫資料」。

**English:**  
Authentication is deferred, but every learning record is already partitioned by family_id and student_id. The controlled student binding is server-side, not browser-selected.

---

## 3. 使用同一個 Apps Script Web App

第一版學生英文頁直接放在現有 Apps Script Web App。

原因：

- 已經能安全地由 server 寫 Google Sheet；
- 不需要處理 GitHub Pages 跨網域寫入；
- 可以用 google.script.run 等 server 回應後才顯示成功；
- 比較容易保證「寫入失敗不能假裝成功」。

### 路由

現有：

`/exec`

可以保留家庭 Demo。

英文學習頁可用：

`/exec?view=english`

Apps Script 的 doGet(e) 依 view 決定顯示哪個畫面。

新增：

- apps-script/English.html
- apps-script/EnglishLogic.gs
- apps-script/EnglishContent.gs

現有家庭 UI 不刪。

**English:**  
The English student experience is added to the existing Apps Script web app so writes can be acknowledged server-side.

---

## 4. 第一版英文內容

第一版只需要少量人工資料。

至少包括：

- 一課單字；
- 中翻英題目；
- 以前學過內容；
- 至少一題合格會考題；
- 每題的複習方向；
- 每題來源。

**教材與題目不寫死在 Apps Script。**

內容的 source of truth 放在 repo：

`data/english/catalog.json`

Apps Script 透過 `UrlFetchApp` 讀取 main branch 的 JSON。

因此一般教材內容修改只需要：

> 修改 repo JSON → push

不需要因為改一題或改一個單字就重新部署 Apps Script。

每個 lesson / word / question 都必須有：

- stable ID
- revision

如果題目內容有實質修改，建立新 revision，舊 revision 保留但可標成 inactive。
learning event 的 `content_id` 使用 `id@revision`，而 `source_ref` 同時記錄 catalogVersion，避免未來題目更新後無法還原學生當時做的是哪一版。

Apps Script 仍負責：

- 讀內容；
- 驗證資料；
- 判分；
- 算獎勵；
- 寫 learning_events。

Browser 不直接決定正確答案或 reward_amount。

---

## 5. 第一個一般測驗：中翻英

第一版一般測驗採：

**中文 → 英文**

判定規則：

- 去掉前後空白；
- 大小寫不影響；
- 可以設定多個可接受答案；
- 第一版不做模糊拼字猜測。

會考題另外支援選擇題。

所以第一版只有兩種答題方式：

1. 中翻英
2. 選擇題

Match、文意字彙、克漏字、閱讀以後再加。

---

## 6. 單字閃卡怎麼算完成

假設一課有 30 個單字。

每個單字都要**自己真的顯示在畫面至少 1 秒**。

例如：

- apple 1.2 秒 → 完成
- banana 0.5 秒 → 未完成
- cat 0.6 秒，之後再看 0.5 秒 → 合計 1.1 秒 → 完成

背景分頁不計時。

停在一個單字 30 秒，也只算那一個字。

全部單字都達到 1 秒後：

> 本課閃卡完成。

server 才計算本次基本獎勵並寫入 Google Sheet。

---

## 7. 測驗怎麼混入現在、以前、會考題

第一版先人工準備題目，不做自動選題演算法。

每一輪至少要有：

- 現在正在學的內容；
- 至少一題以前學過的內容；
- 至少一題目前已經有能力作答的會考題。

比例先不寫死。

例如不是現在就規定一定 3:1:1。

等真實使用後再調整。

---

## 8. 會考題什麼時候可以出

不是看：

> 學生現在國二，所以出國二看起來會做的題。

而是看：

> 這題需要的知識，學生是不是全部都已經學過。

每一題會考題要標示：

- 年度
- 題號
- 需要的知識點
- 複習方向
- 正式來源

只要有一個必要知識還沒學：

> 這題先不出。

---

## 9. 第一次答錯要留下來

每一題都要保留每次作答。

例如：

第一次：錯  
第二次：對

系統要知道：

> 第一次錯，第二次才答對。

不能最後只留下：

> 對。

答錯後學生可以：

- 再試一次
- 繼續下一題

由學生自己決定。

同一題同一輪只會因「第一次成功答對」產生一次獎勵，避免一直重做刷錢。

---

## 10. 答錯時怎麼告訴學生去哪裡複習

每一題都要有複習資訊：

- 回哪裡看
- 要看什麼

例如：

> 二上 Unit 2  
> irregular verbs  
> 回去確認 go / went、see / saw

或：

> because / so  
> 回去看原因與結果的句型差別

不能只有：

> 答錯

也不能只顯示答案就結束。

---

## 11. 獎勵直接進 saving pool

BDD-005 不再做抽象 points。

第一版直接計算：

> **本次學習增加多少零用金**

這個金額寫進學習紀錄。

saving pool 的意思：

> 到目前為止，學生靠學習賺到、還沒被家長提領的零用金。

BDD-005 只負責「賺」。

家長真的發錢、每次領 $100、扣 saving pool，是下一個家長頁 Story。

---

## 12. 獎勵怎麼算

實際數字放在設定，不寫死在 UI。

規則已確認：

1. 難度不同，獎勵不同。
2. 第一次答對和重試後答對可以不同。
3. 已經會的內容一直重複做，獎勵遞減。
4. 每科每天有上限。
5. 到上限後仍可繼續學習，只是不再加錢。
6. 閃卡整課完成有基本獎勵。

設定集中在：

`apps-script/EnglishRewardConfig.gs`

例如裡面會有：

- 英文每日上限
- 閃卡整課完成獎勵
- 各難度獎勵
- 重試折減
- 重複複習折減

目前 SDD 不替你決定實際金額。

---

## 13. Google Sheet 是學習與 saving pool 的真相來源

這一版不再把 localStorage 當正式紀錄。

localStorage 可以拿來做畫面暫存，但：

> **Google Sheet 才是正式紀錄。**

重新整理或換裝置後，saving pool 應該可以從 Sheet 重新算回來。

這沿用 TeenageStudyTool 已驗證過的方向：

> event log 是真相來源，畫面狀態只是快取。

---

## 14. Schema v3

目前：

`schema_version = 2`

BDD-005 要正式保存學習紀錄，因此升級到：

`schema_version = 3`

### 新增 worksheet：learning_events

這張表只記學習與「賺到的零用金」。

欄位：

| 欄位 | 用途 |
|---|---|
| learning_event_id | 每筆事件唯一 ID |
| occurred_at | 發生時間 |
| family_id | 所屬家庭 |
| student_id | 所屬學生 |
| subject | 第一版固定 ENGLISH |
| session_id | 同一輪測驗識別 |
| event_type | FLASHCARD_COMPLETE / ANSWER_ATTEMPT / QUIZ_COMPLETE |
| lesson_id | 課次 |
| content_id | 單字 / 題目 ID |
| question_source_type | CURRENT / PRIOR / CAP |
| attempt_no | 第幾次作答 |
| correct | true / false / blank |
| first_attempt_correct | true / false / blank |
| reward_amount | 這筆事件實際增加的零用金 |
| review_target | 答錯時複習方向 |
| source_ref | 題目來源 / 會考年度題號 |
| note | 補充 |

### 為什麼先只有 learning_events

BDD-005 只負責「賺」。

真正家長提領時，再由下一個 Story 新增：

`allowance_transactions`

例如：

- PAYOUT -100
- MANUAL_ADJUST +50 / -20

這樣學習資料和發放資料不混在一起。

---

## 15. saving pool 怎麼算

BDD-005 階段還沒有 payout，所以：

~~~text
saving_pool
= learning_events 裡所有 reward_amount 的總和
~~~

等未來家長提領 Story 做完：

~~~text
saving_pool
= 學習賺到總額
+ allowance_transactions 的調整總額
~~~

其中 payout 會是負數。

這樣不需要在 students 表直接存一個會失真的 money 欄位。

---

## 16. 為什麼用事件流水帳，而不是直接改餘額

不要每次學習就：

> students.money += 5

因為這樣未來很難知道：

- 這 5 元怎麼來的
- 是否重複發過
- 哪一題產生
- 某天為什麼超過上限

事件流水帳可以重新計算。

如果畫面顯示的 saving pool 有問題：

> 可以從 learning_events 重新算。

這也是 TeenageStudyTool 已經證明有用的做法。

---

## 17. 寫入 Google Sheet 的流程

### 閃卡完成

1. server 確認所有單字都符合完成條件。
2. server 算這次獎勵。
3. server 檢查英文今日上限。
4. server 寫一筆 FLASHCARD_COMPLETE。
5. reward_amount 寫實際拿到的金額。
6. 寫成功後才回傳成功給 UI。

### 作答

每一次送出：

1. server 判斷答案。
2. server 找出這是不是第一次作答。
3. server 算這次是否有獎勵。
4. server 檢查重複複習規則。
5. server 檢查英文今日上限。
6. server append 一筆 ANSWER_ATTEMPT。
7. 寫成功後才回傳結果。

UI 不自己決定 reward_amount。

---

## 18. 每日上限由 server 重新算

不能只相信瀏覽器說：

> 我今天只拿了 20。

server 每次要發獎勵前，從 learning_events 算出：

> 今天這個學生英文已經拿多少。

再決定：

> 這次還能加多少。

這可以避免重新整理或換裝置後每日上限失效。

---

## 19. 重複複習遞減由 server 查歷史

同樣，不能只相信瀏覽器說：

> 這是第一次做。

server 以：

- student_id
- content_id

查過去成功答對紀錄。

算出：

> 過去已成功幾次。

再套用遞減規則。

---

## 20. 第一版學生身分怎麼綁定

因為 Authentication 暫時不做，第一版採受控設定。

Apps Script Script Properties：

`QEK_CONTROLLED_STUDENT_ID`

server 讀到後：

1. 去 students sheet 找該 student。
2. 確認 status=active。
3. 取得 family_id。
4. 所有 BDD-005 learning_events 都寫入這個 family_id / student_id。

browser 不傳 student_id。

### 限制

這只能用於目前受控家庭。

如果第二個真實家庭要開始用：

> BDD-004 必須重新撿回。

---

## 21. UI 畫面

### 英文首頁

顯示：

- 單字閃卡
- 中翻英測驗
- 今日英文已賺
- saving pool
- Demo / controlled-use 提示

### 單字閃卡

顯示：

- 課次
- 單字
- 中文
- 目前第幾個
- 已看滿 1 秒幾個 / 總數
- 上一個 / 下一個

全部完成：

- 顯示完成
- 顯示這次賺多少
- 顯示今日英文累計
- 顯示 saving pool

### 測驗

答對：

- 顯示答對
- 顯示本題獎勵
- 下一題

答錯：

- 顯示答錯
- 顯示複習方向
- 再試一次
- 繼續下一題

### 結果

顯示：

- 做了幾題
- 第一次答對幾題
- 重試後答對幾題
- 還沒解決幾題
- 要複習什麼
- 本輪賺多少
- 今日英文已賺多少
- saving pool

---

## 22. 內容來源

每個教材 / 題目至少保留：

- source type
- source name
- URL 或正式識別
- 授權 / 可使用依據
- 會考年度 / 題號（如果是會考）

課本、參考書、學習網站如果只是用來了解範圍：

> 不直接複製受保護內容。

---

## 23. Migration 計畫

因為要有真實 learning_events：

1. 保留 schema v2 既有 backup。
2. 在升級前再做一份新的 schema v3 backup。
3. 新增 learning_events。
4. 驗證 families / students / audit_log 完全沒被改壞。
5. 更新 schema_meta 到 3。
6. 跑 migration test。
7. 才部署 BDD-005。

真實資料開始後：

> schema 變更一律正式 migration，不直接手改欄位。

---

## 24. 既有功能不能被破壞

BDD-005 不改：

- family ownership
- family privacy boundary
- student-family binding
- rename
- soft delete
- audit_log
- Apps Script family persistence

現有 57 / 57 regression 必須繼續通過。

---

## 25. 預計新增檔案

~~~text
apps-script/
  English.html
  EnglishLogic.gs
  EnglishRewardConfig.gs

data/english/
  catalog.json

src/learning/
  flashcard-exposure.js
  answer-evaluator.js
  reward-engine.js
  learning-event-service.js

data/english/ 或 test fixtures
  用於 Node 測試與內容驗證
~~~

實作時可以依 Apps Script 限制調整檔名，但責任要保持分開。

---

## 26. TDD-005 下一階段至少要測

1. 每個單字至少 1 秒才算。
2. 背景分頁時間不算。
3. 全部單字完成才有閃卡獎勵。
4. 中翻英判分正確。
5. 會考題只在已學知識足夠時出現。
6. 題組包含現在 / 舊內容 / 合格會考題。
7. 第一次答錯保留。
8. 重試成功不洗掉第一次錯誤。
9. 答錯有複習方向。
10. 可以重試或直接繼續。
11. 同一題同一輪不重複發錢。
12. 難度可影響獎勵。
13. 歷史重複答對會遞減。
14. 每日英文上限由 Sheet 歷史計算。
15. 達上限仍可學習。
16. 每次作答寫入 learning_events。
17. 每筆 learning_event 有正確 family_id / student_id。
18. browser 不能指定另一個 student_id。
19. saving pool 可由 learning_events 重新算出。
20. persistence 失敗不能顯示成功。
21. schema v2 未 migration 時拒絕 v3 learning write。
22. BDD-001～003 regression 全綠。
23. 英文 UI 使用真實 learning logic，不是靜態假畫面。

---

## 27. Authentication 的後續接法

未來 BDD-004 做 Authentication 時：

現在：

`QEK_CONTROLLED_STUDENT_ID → student_id`

改成：

`登入身份 → student_id`

後面的：

- learning_events
- reward calculation
- saving pool

都不需要重做。

這就是這一版資料分割要先做乾淨的原因。

---

## 28. BDD-005 Done 條件

BDD-005 只有全部完成才算 Done：

- BDD approved
- SDD approved
- TDD Red
- schema v3 backup + migration
- implementation
- TDD Green
- 可操作英文學生 UI
- 閃卡驗收
- 中翻英驗收
- 現在 / 舊內容 / 會考題驗收
- 錯題複習方向驗收
- saving pool / reward 驗收
- Google Sheet learning_events 寫入驗收
- full regression
- source provenance 驗證
- 文件同步
- commit

**沒有可操作 UI，不算 Done。**

**English:**  
SDD-005 uses a controlled single-student binding for now, stores learning content as versioned JSON in the repository, and writes fully partitioned learning events to Google Sheets. Authentication can later be added without redesigning the learning database, while normal content edits do not require an Apps Script redeploy.
