# SDD-005 — 英文最小學習與獎勵閉環
# English Minimum Learning & Reward Loop

狀態 Status: **暫停修訂 — 等 BDD-004 重新確認 / Paused pending BDD-004 review**  
對應需求 Requirement: **BDD-005 APPROVED**  
日期 Date: **2026-09-18**

> **需求變更通知 / Requirement change**
>
> 2026-09-18 已確認兩個重要修改：
>
> 1. BDD-005 的學習紀錄與獎勵紀錄要寫入 **Google Sheet**，不能只存在瀏覽器。
> 2. 學習完成後的獎勵要累積進 **saving pool / 待領零用金**。
> 3. 真正的零用金發放是另一個家長頁流程，不屬於 BDD-005。
>
> 因此本文件中「只存 localStorage」「不改 Google Sheet」的設計已失效。
> 「005 只算 points」也要改成「005 計算並寫入 saving pool」。
> 但「家長發放 / payout」應由後續獨立 Story 定義，不塞進 BDD-005。
>
> 只要保存真實學習與獎勵資料，就已觸發 BDD-004 的 pickup condition，所以在 BDD-004 重新確認前，不應進入 TDD-005。
>
> 第一個一般測驗仍維持 **中翻英**。


---

## 1. 這份設計要解決什麼 / What this design is for

BDD-005 要做的是 QeKStudy 第一個真正給學生操作的英文學習流程。

第一版只做英文，學生可以：

- 自己選擇看單字閃卡或做測驗；
- 完整看完一課單字後取得基本獎勵；
- 練現在正在學的內容；
- 也練以前已經學過的內容；
- 遇到目前已經有能力作答的會考考古題；
- 答錯時知道要回哪裡複習；
- 自己決定要重試，還是直接繼續；
- 完成後看得到學習結果和獎勵。

**English:**  
SDD-005 designs the first usable English learning loop: flashcards, practice, review guidance, eligible CAP past-exam questions, student choice, and rewards.

---

## 2. 這一版做什麼、不做什麼 / Scope

### 這一版會做

- 英文學生頁
- 單字閃卡
- 一種一般測驗：中翻英
- 會考題需要的選擇題
- 現在內容 + 舊內容混合
- 錯題複習方向
- 重試或繼續
- 第一次作答結果保留
- 難度不同，獎勵可以不同
- 已經會的內容重複做，獎勵遞減
- 英文每日獎勵上限
- 學習結果與獎勵摘要
- 題目來源可追溯

### 這一版不做

- 正式登入
- 真實多家庭學習紀錄
- 真實學生姓名的學習紀錄
- Google Sheet 學習紀錄
- 真正的零用金發放
- 家長調整獎勵規則的 UI
- AI 自動出題
- 自動調整難度
- 自動搜尋所有適合的會考題
- 完整題庫管理
- 老師後台
- streak
- 一次把 TeenageStudyTool 所有英文題型搬過來

**English:**  
The first version stays small. It proves the learning-and-reward loop without building production authentication, long-term learning history, AI generation, or the full English platform.

---

## 3. 為什麼這一版先不存正式學習紀錄 / Why real learning history is not persisted yet

BDD-004 目前仍然是延後中的 Authentication Story。

而 docs/STATUS.md 已經寫明：

> 一旦要保存真實姓名、學習紀錄或獎勵資料，就要重新 review BDD-004。

所以 BDD-005 不新增 Google Sheet，也不改現在的資料庫 schema。

第一版只保存：

- Demo 學習進度
- Demo 答題狀態
- Demo 獎勵點數

而且只存在目前瀏覽器裡。

這些資料不能被當成正式學生紀錄。

如果之後要讓 QeK 或第二個家庭真正累積學習紀錄與零用金資料：

> 先重新 review BDD-004，再決定正式資料怎麼存。

**English:**  
BDD-005 uses anonymous browser-local demo state only. Real learning or reward persistence would trigger a review of BDD-004 first.

---

## 4. 學生會從哪裡進入 / Student entry point

新增一個獨立英文學生頁：

english.html

搭配：

- english-app.js
- english.css

原因很單純：

現在的 index.html 是家庭功能驗收畫面；Apps Script 畫面是家庭持久化與改名驗收畫面。

英文學習是學生流程，不要全部混在同一個頁面裡。

現有家庭功能保留，不刪掉。

**English:**  
English learning gets its own student-facing page so it does not interfere with the existing family/admin acceptance UI.

---

## 5. 整體程式怎麼分 / High-level structure

第一版拆成三層：

~~~text
英文單字與題目資料
        ↓
學習邏輯
        ↓
學生看到的英文畫面
~~~

學習邏輯再分成幾個小部分：

- **單字閃卡計時**：每個字到底有沒有真的看滿 1 秒
- **測驗組題**：哪些題可以出現在這次測驗
- **答案判定**：答對還是答錯
- **獎勵計算**：這次應該拿多少點
- **Demo 資料保存**：記住今天已經做過什麼

UI 只負責顯示與接收操作。

UI 不自己算獎勵，也不自己決定哪一題會考題可以出。

**English:**  
The UI stays thin. Separate learning modules handle flashcard timing, quiz composition, answer checking, rewards, and demo state.

---

## 6. 第一個一般測驗先做中翻英 / First regular quiz mode

第一版一般測驗先做：

**中文 → 英文**

原因：

- TeenageStudyTool 已經實際用過；
- 需要學生自己回想英文，不只是猜選項；
- 很適合觀察「第一次答對」和「重試後才答對」；
- 可以同時使用現在和以前學過的單字。

另外，正式會考題多數是選擇題，所以第一版也要有最小的四選一支援。

因此第一版只需要兩種答題方式：

- 中翻英
- 選擇題

Match、文意字彙、克漏字、閱讀等之後再開新的 Story 慢慢加入。

**English:**  
Chinese-to-English recall is the first regular practice mode. Minimal multiple-choice support is added so official CAP questions can also be used.

---

## 7. 系統怎麼知道「現在學到哪裡」 / Learned scope

第一版先用一個匿名 Demo 學生設定。

系統要知道兩件事：

1. **現在正在學什麼**
2. **以前已經學過什麼**

概念上會有：

~~~text
目前範圍：二上目前課程
已學知識：國一到目前為止已正式學過的單字、文法、句型……
~~~

規則是：

> 只有已經正式學過的知識，才能拿來正式測驗。

學生不能自己在畫面上把「還沒學的內容」勾成已學。

**English:**  
The demo profile records current classroom scope and already-learned knowledge. Formal quiz questions may only use learned content.

---

## 8. 英文資料怎麼放 / Learning content files

第一版資料放在 repo 裡，建議：

~~~text
data/english/
  demo-profile.json
  lessons.json
  questions.json
  reward-config.demo.json
~~~

### lessons.json

放：

- 課次
- 單字
- 中文意思
- 對應知識點
- 複習位置
- 來源

### questions.json

放：

- 題目
- 題型
- 答案
- 難度
- 現在題 / 舊題 / 會考題
- 需要哪些已學知識
- 答錯時去哪裡複習
- 題目來源

### reward-config.demo.json

放：

- 每日英文上限
- 閃卡完成獎勵
- 不同難度的基本點數
- 第一次答對與重試答對的差異
- 重複複習的遞減規則

實際點數不要散落在程式碼裡。

**English:**  
Content, questions, and reward settings live in separate JSON files so they can be changed without rewriting the UI.

---

## 9. 題目來源一定要能追查 / Content sources

每一筆正式使用的題目或教材，都要知道它從哪裡來。

至少要記：

- 來源類型
- 來源名稱
- 網址或正式識別資料
- 授權或可以使用的法律依據
- 如果需要署名，要留下署名資訊
- 會考題要記年度與題號

來源分成：

- 公共領域
- 開放授權
- 正式考試題
- 只用來了解課程範圍的參考來源

如果某個課本、參考書或網站只是拿來確認「學生現在學到哪裡」，就只能當範圍參考，不能直接把受保護內容搬進 QeKStudy。

**English:**  
Every learning item must retain traceable source and licensing/legal information. Curriculum references do not automatically grant reuse rights.

---

## 10. 單字閃卡怎麼算「真的看過」 / Flashcard timing

這是 BDD-005 很重要的一條。

假設一課有 30 個單字：

每一個單字都要**自己實際出現在畫面至少 1 秒**。

例如：

- apple 看 1.2 秒 → 算
- banana 看 0.5 秒 → 不算
- cat 看 0.6 秒，之後再回來看 0.5 秒 → 合計 1.1 秒，算

一個字可以分幾次累積到 1 秒。

但是：

- 停在一張卡 30 秒，不會讓其他 29 張自動完成
- 瀏覽器切到背景時，不繼續偷偷計時

只有全部單字都達到 1 秒，整課閃卡才算完成。

完成後產生一次「本課閃卡完成」，再交給獎勵計算模組決定點數。

**English:**  
Each flashcard must accumulate at least one second of real visible time. Background time does not count, and one card cannot complete other cards.

---

## 11. 測驗怎麼組 / Quiz composition

第一版先不要做聰明的自動選題。

先人工準備一小組 Demo 題。

但每次 Demo 測驗至少要有：

- 現在正在學的內容
- 至少一題以前學過的內容
- 至少一題目前已經有能力作答的會考考古題

這一版**不寫死比例**。

例如不先規定一定要 3 題現在 + 1 題舊題 + 1 題會考。

比例之後可以根據學生使用情況再調整。

**English:**  
The first quiz uses a manually curated small set and must include current, prior, and eligible CAP content, without hard-coding a fixed ratio.

---

## 12. 會考題什麼時候可以出 / CAP question eligibility

一題會考題能不能出，不看「這題像不像國二程度」。

要看：

> 解這題需要的知識，學生是不是都已經學過。

例如一題需要：

- 某些單字
- 過去式
- because / so
- 閱讀上下文

只要全部已學，就可以出。

如果其中任何一個必要知識還沒學：

> 這題先不要出。

這一版不做「自動掃描全部歷屆題目」。

只是人工挑少量會考題，系統負責檢查這題需要的知識是否都已學。

**English:**  
A CAP question is eligible only when all of its required knowledge has already been learned.

---

## 13. 答案怎麼判斷 / Answer checking

### 中翻英

第一版做基本判斷：

- 前後空白忽略
- 英文字母大小寫忽略
- 可以設定多個老師認可的正確答案

例如某題如果老師認為兩種英文都可以，就直接把兩個答案都列為可接受答案。

第一版不做自動拼字模糊判斷。

### 選擇題

每個選項有固定 ID。

系統依 ID 判斷，不依畫面上「第幾個位置」判斷。

**English:**  
Chinese-to-English answers support multiple accepted forms, while multiple-choice uses stable option IDs.

---

## 14. 第一次答錯不能被後來答對蓋掉 / Attempt history

每一題要記：

- 第一次有沒有答對
- 每一次嘗試答了什麼
- 最後有沒有解決
- 這題有沒有已經發過獎勵

例如：

第一次錯 → 第二次對

系統最後要知道：

> 第一次錯，後來重試成功。

不能把它改成：

> 第一次就答對。

學生答錯後畫面提供：

- 再試一次
- 繼續下一題

不強迫他一定要重試。

同一題同一輪最多只發一次「答對獎勵」。

避免同一題一直重做一直加點。

**English:**  
Attempt history preserves the first result. Retry success does not erase the initial mistake, and one question can award success points only once per session.

---

## 15. 答錯時怎麼告訴他去哪裡複習 / Review guidance

每一題資料都要事先有複習方向。

至少告訴學生：

1. **去哪裡看**
2. **要看什麼**

例如：

> 二上 Unit 2  
> irregular verbs  
> 回去確認 go / went、see / saw 這一類不規則動詞

或：

> because / so  
> 回去看原因與結果的句型差別

複習方向可以是：

- 單字
- 文法
- 句型
- 課文
- 知識點

不能只有「答錯」。

也不能只丟正確答案就結束。

**English:**  
Each wrong answer returns a concrete review location and what to review, not merely a wrong mark or the correct answer.

---

## 16. 獎勵怎麼算 / Reward calculation

第一版先用「點數」計算，不直接在程式裡處理เงินจริง。

原因是目前要驗證的是：

> 學習行為 → 產生零用金獎勵價值

真正的：

- 幾點換多少錢
- 家長核准
- 實際發放
- 家長手動調整

之後再做。

### 基本概念

一題的獎勵由三件事影響：

1. **題目難度**
2. **第一次答對，還是重試才答對**
3. **以前是不是已經答對過很多次**

概念上：

~~~text
本題原始點數
= 難度基本點數
× 作答次數調整
× 重複複習調整
~~~

最後還要看：

> 今天英文還剩多少可拿點數。

如果今天只剩 2 點額度，但這題原本值 5 點：

> 最後只加 2 點。

**English:**  
Rewards are configuration-driven and depend on difficulty, first-try vs retry, repeat history, and the remaining daily English cap.

---

## 17. 單字閃卡的獎勵和「會不會」要分開 / Flashcard reward is not mastery

把一課全部單字看完，只代表：

> 今天完整把這課單字看過一次。

不代表：

> 這些單字全部會了。

所以閃卡完成會拿到「接觸獎勵」，但不會因此增加「已掌握次數」。

同一天同一課做第二次閃卡要不要再給分，目前不在 SDD 裡硬決定。

這個規則會放在獎勵設定裡，等產品規則確認後再填。

**English:**  
Flashcard completion earns an exposure reward but does not mark vocabulary as mastered.

---

## 18. 重複複習怎麼遞減 / Repeat decay

每個可測驗的內容記一個：

> 過去成功答對過幾次

只有答對才增加。

答錯不算「掌握」。

例如：

- 第一次答對 → 正常獎勵
- 第二次再答對 → 較少
- 第三次再答對 → 再少

但學生仍然可以一直練。

這個「歷史上答對幾次」和「同一題這次重試幾次」是兩件不同的事。

**English:**  
Historical successful reviews and same-session retries are tracked separately.

---

## 19. 每日英文上限怎麼運作 / Daily English cap

系統每天記：

> 今天英文已經拿到多少點。

每次要加點前：

1. 先算這次本來應得多少
2. 看今天英文還剩多少上限
3. 最多只能加到今日上限

達到上限之後：

- 還是可以看閃卡
- 還是可以做測驗
- 還是可以看錯題複習方向
- 只是今天英文不再增加點數

畫面要清楚顯示：

> 今天英文獎勵已拿滿。

**English:**  
The daily cap limits points only; it never blocks learning.

---

## 20. Demo 資料存在瀏覽器哪裡 / Demo state

第一版用瀏覽器自己的 localStorage。

只存 Demo 資料：

- 哪些閃卡已經看滿 1 秒
- 過去哪些內容答對過幾次
- 今天英文拿了多少點
- 如果需要，本次未完成測驗的狀態

不存：

- 真實姓名
- family ID
- 真實 student ID
- 正式零用金帳本

UI 提供：

> 重設 Demo 學習資料

方便我們反覆驗收。

**English:**  
Anonymous demo progress is stored in localStorage and can be reset for acceptance testing.

---

## 21. 學生畫面會長什麼樣 / UI flow

### 英文首頁

顯示：

- 單字閃卡
- 測驗
- 今天英文獎勵進度
- Demo 提示

### 單字閃卡

顯示：

- 課次
- 英文單字
- 中文意思
- 第幾個單字
- 已經看滿 1 秒的數量 / 全部數量
- 上一個 / 下一個

整課完成後：

- 告訴學生已完成
- 顯示這次拿多少點
- 顯示今天英文累積多少 / 上限多少

### 測驗

每題：

- 顯示題目
- 學生作答
- 送出

答對：

- 告訴他答對
- 顯示這題拿多少點
- 可以下一題

答錯：

- 告訴他答錯
- 顯示去哪裡複習
- 再試一次
- 繼續下一題

### 結果頁

顯示：

- 做了幾題
- 第一次就答對幾題
- 重試後答對幾題
- 還沒解決幾題
- 哪些內容要回去複習
- 這次拿多少點
- 每一筆獎勵為什麼拿到
- 今天英文總點數 / 每日上限

不只顯示一個總分。

**English:**  
The UI has an English home, flashcards, quiz, and summary. Results distinguish first-try correct, retry-correct, unresolved items, review targets, and reward breakdown.

---

## 22. 學生要看得懂獎勵怎麼來 / Reward transparency

每次加點都要能說明原因。

例如：

~~~text
中翻英
難度：2
第一次答對
以前沒有答對過
本題 +3 點
~~~

如果因為每日上限被截掉：

~~~text
這題原本 +5 點
今天只剩 2 點額度
實際 +2 點
~~~

不能只顯示：

> +2

卻不告訴學生原因。

**English:**  
Every reward should include a human-readable explanation, including any reduction caused by retry, repetition, or the daily cap.

---

## 23. 資料有問題時怎麼處理 / Invalid content

如果某個單字或題目缺必要資料，就不要讓它出現在學生畫面。

例如題目至少要有：

- 題目 ID
- 題型
- 答案
- 難度
- 對應知識點
- 複習方向
- 來源

會考題還要多：

- 年度
- 題號
- 解題需要的已學知識

資料不完整：

> 這題不進入 Demo。

**English:**  
Incomplete or invalid content is rejected before it reaches the student UI.

---

## 24. 這一版不改 Google Sheet / No database migration

BDD-005 完成後：

schema_version 仍然是 **2**。

不新增：

- learning_attempts
- rewards
- mastery
- question_history

不是因為未來不需要。

而是：

> 真實學習紀錄一旦要正式保存，就要先處理 Authentication。

**English:**  
BDD-005 keeps Google Sheets at schema version 2 and adds no formal learning/reward tables.

---

## 25. 不破壞 BDD-001～003 / Regression safety

BDD-005 不改：

- 家庭隔離
- 家長 ownership
- 家庭/孩子持久化
- 改名
- soft delete
- audit log
- Apps Script schema v2

英文學生頁是新增的一條流程。

既有 57 個 regression tests 必須繼續通過。

**English:**  
BDD-005 is additive. Existing family, persistence, and admin behavior must remain unchanged.

---

## 26. 預計新增哪些檔案 / Planned files

預計新增：

~~~text
english.html
english-app.js
english.css

data/english/
  demo-profile.json
  lessons.json
  questions.json
  reward-config.demo.json

src/learning/
  english-content-catalog.js
  english-learning-service.js
  flashcard-exposure.js
  quiz-composer.js
  answer-evaluator.js
  reward-engine.js
  demo-learning-store.js
~~~

中文用途：

- english-content-catalog.js：讀英文教材與題目
- english-learning-service.js：把整個英文流程串起來
- flashcard-exposure.js：判斷單字有沒有真的看滿 1 秒
- quiz-composer.js：準備這輪測驗題
- answer-evaluator.js：判斷答案
- reward-engine.js：算獎勵
- demo-learning-store.js：保存匿名 Demo 進度

**English:**  
The implementation adds a separate English page, JSON content files, and small testable learning modules.

---

## 27. 下一階段 TDD 要測什麼 / TDD-005 boundary

TDD-005 Red 至少要測：

1. 英文首頁可以進閃卡或測驗
2. 學生不用照固定順序
3. 單字真的看滿 1 秒才算
4. 背景分頁時間不算
5. 全部單字完成才有整課閃卡獎勵
6. 閃卡完成不等於單字已掌握
7. 測驗有現在內容
8. 測驗有以前學過內容
9. 測驗有至少一題合格會考題
10. 會考題需要的知識全部已學才能出
11. 有任何必要知識沒學就不能出
12. 中翻英可以正確判分
13. 選擇題可以正確判分
14. 第一次答錯要保留
15. 答錯要回傳複習方向
16. 答錯後可以重試
17. 答錯後也可以直接繼續
18. 重試成功不能改寫第一次結果
19. 同一題同一輪最多發一次答對獎勵
20. 難度不同可以得到不同基本點數
21. 重複答對的內容可以套用遞減規則
22. retry 和歷史重複複習要分開
23. 每日英文上限會限制加點
24. 達上限後仍能繼續學
25. 結果頁能分出第一次答對 / 重試答對 / 未解決
26. 結果頁有複習方向
27. 結果頁能解釋獎勵來源
28. 題目來源資料完整
29. Demo 狀態沒有真實家庭或學生身份
30. BDD-001～003 regression 全部維持通過
31. UI 要真的使用學習邏輯，不是做假畫面

**English:**  
TDD-005 will verify flashcard timing, mixed quiz content, CAP eligibility, first-attempt truth, review guidance, reward behavior, daily caps, demo privacy, and full regression.

---

## 28. 這份設計目前做的主要決定 / Main design decisions

### 決定 1：005 不碰 Google Sheet

先用匿名 Demo 資料。

原因：不能提前跨過 BDD-004 的安全邊界。

### 決定 2：第一個一般測驗用中翻英

原因：TeenageStudyTool 已有實際使用經驗，而且能測主動回想。

### 決定 3：會考題另外支援選擇題

原因：不能因為第一個一般測驗是中翻英，就把會考考古題排除掉。

### 決定 4：現在 / 舊題 / 會考題比例先不寫死

原因：目前沒有真實證據支持固定比例。

### 決定 5：獎勵規則放設定檔

原因：獎勵原則已經確認，但實際數字還沒確認。

### 決定 6：005 先算點數，不處理真正發錢

原因：這一版先驗證「學習行為和獎勵連結」；家長核准、換算與真正發放之後再做。

**English:**  
The design intentionally keeps data local, starts with Chinese-to-English recall, supports CAP multiple-choice, avoids fixed quiz ratios, keeps rewards configurable, and postpones real payout.

---

## 29. 在開始實作前還要填哪些數字 / Demo settings still needed

這些是設定值，不是新的產品需求：

- 英文每天最多幾點
- 一課閃卡完整看完給幾點
- 各難度基本點數
- 重試答對的點數或比例
- 重複複習怎麼遞減
- 同一天同一課閃卡做第二次是否再給點

這些數字確認後，統一放在 reward-config.demo.json。

不散落在程式碼裡。

**English:**  
Exact demo reward values still need to be filled in before the Green implementation, but the rules themselves are already defined.

---

## 30. BDD-005 什麼時候才算完成 / Definition of Done

BDD-005 只有全部做到才算 Done：

- BDD 已確認
- SDD 已確認
- TDD Red
- 實作完成
- TDD Green
- 有真的可以操作的英文學生 UI
- 閃卡 1 秒規則驗收通過
- 現在 + 舊內容 + 會考題混合測驗驗收通過
- 錯題複習方向驗收通過
- 重試 / 繼續由學生自己選
- 獎勵、重複遞減、每日上限驗收通過
- BDD-001～005 完整 regression 通過
- 題目來源驗證通過
- 在 BDD-004 review 前沒有保存真實學生學習/獎勵資料
- 文件同步
- commit 完成

**沒有可操作的學生 UI，就不算 Done。**

**English:**  
BDD-005 is Done only after approved design, Red/Green TDD, an operable student UI, full learning/reward acceptance, provenance checks, and full regression.
