# SDD-005 — 英文最小學習與獎勵閉環 / English Minimum Learning & Reward Loop

狀態 Status: DRAFT — awaiting review  
對應需求 Requirement: BDD-005 APPROVED  
日期 Date: 2026-09-18

## 1. 目的 / Purpose

BDD-005 要做的是 QeKStudy 第一個真正可操作的學生學習閉環。

第一版只做英文，讓學生可以：

- 自己選擇單字閃卡或測驗；
- 完整看過一課單字後取得基本獎勵；
- 做包含目前內容、以前學過內容與合格會考考古題的測驗；
- 答錯後知道去哪裡複習；
- 自己決定重試或繼續；
- 保留第一次作答結果；
- 依困難程度、重複複習與每日上限計算獎勵；
- 看懂這次學了什麼，以及獎勵怎麼來。

This design delivers the first student-facing QeKStudy learning loop in English, without expanding into the full future learning platform.

---

## 2. 本 Story 的設計邊界 / Story Boundary

### 005 會做 / In scope

- English-only student demo
- flashcards
- one mixed assessed quiz
- current + previously learned content
- at least one eligible official CAP past-exam question
- actionable review guidance after mistakes
- retry or continue choice
- first-attempt truth
- difficulty-based reward points
- lower reward for repeated mastered content
- English daily reward cap
- result / reward summary
- legally reusable, traceable learning content

### 005 不做 / Out of scope

- production authentication
- real multi-family learning history
- real student names in learning records
- Google Sheet learning/reward persistence
- actual cash payout
- parent reward-setting UI
- AI question generation
- adaptive difficulty
- automatic search across all CAP questions
- full knowledge graph
- complete question-bank administration
- teacher dashboard
- streak
- all TeenageStudyTool English modes

BDD-005 的重點是先證明學習閉環，不是先完成整個平台。

---

## 3. Authentication 與真實資料邊界 / Authentication and Real-data Boundary

BDD-004 目前仍為 `DEFERRED · TRIGGER-BASED`。

因此 BDD-005 **不寫入現有 Google Sheet，也不新增 schema**。

原因：

`docs/STATUS.md` 已明確把「保存真實姓名、學習紀錄或獎勵資料」列為 BDD-004 pickup trigger。

BDD-005 UI 只使用：

- anonymous Demo Student
- demo content
- demo reward state
- browser-local demo storage

不得把 BDD-005 的 local demo state 宣稱為正式學生紀錄。

### 如果之後真的讓 QeK 或第二個家庭用來累積真實學習/零用金

先停止擴充 persistence：

`trigger → review BDD-004 → confirm requirements → SDD/TDD`

不能直接把 anonymous demo store 改名後當正式資料庫。

---

## 4. UI 入口 / Student UI Entry

新增獨立學生頁：

`english.html`

搭配：

- `english-app.js`
- `english.css`（可重用既有 style tokens，但不要把家庭管理 UI 與學生學習流程綁在同一個 controller）

原因：

1. 現有 `index.html` 是 BDD-001 家庭驗收 UI。
2. Apps Script `Index.html` 是 BDD-002/003 persistence / rename Demo。
3. BDD-005 是學生流程，不應把既有家長驗收 UI 改造成混合頁。
4. 獨立入口可以降低 regression 風險。

可在現有首頁增加一個清楚標示的：

`進入 English Demo`

但不移除既有家庭驗收能力。

---

## 5. 高階架構 / High-level Architecture

BDD-005 採「資料 / domain logic / UI」分離。

```text
data/english/*.json
       ↓
EnglishContentCatalog
       ↓
EnglishLearningService
  ├─ FlashcardExposureTracker
  ├─ QuizComposer
  ├─ AnswerEvaluator
  ├─ RewardEngine
  └─ DemoLearningStore
       ↓
english-app.js
       ↓
english.html
```

### 原則

- UI 不直接算獎勵。
- UI 不直接判定會考題是否可出。
- UI 不直接決定答錯後要複習哪裡。
- 題目與來源資訊放在資料層。
- reward rule 由可注入設定驅動。
- domain modules 可以用 Node `node:test` 單測。

---

## 6. 第一個測驗模式 / First Assessed Mode

第一版採 **中翻英 / Chinese-to-English recall** 作為主要一般題型。

原因：

1. TeenageStudyTool 已被真實使用。
2. 中翻英需要主動回想，不只是四選一辨識。
3. 容易驗證 first-try / retry。
4. 可以直接使用目前與以前已學單字。

但正式會考題通常是選擇題，因此 mixed quiz 需要同時支援：

- `ZH_TO_EN`
- `MULTIPLE_CHOICE`

第一版不實作 Match、文意字彙、克漏字、閱讀等其他完整模式。

這些保留為後續 Story。

---

## 7. Demo 學生學習範圍 / Demo Learned Scope

使用匿名 Demo profile，不存真實姓名。

建議資料：

`data/english/demo-profile.json`

概念結構：

```json
{
  "profileId": "demo-student",
  "subject": "english",
  "currentScopeIds": ["..."],
  "learnedKnowledgePointIds": ["...", "..."]
}
```

### currentScopeIds

表示目前課堂正在學的範圍。

### learnedKnowledgePointIds

表示已經正式學過、可以拿來測驗的知識。

規則：

`currentScope ⊆ learned scope`

未列入 learned scope 的知識，不應用正式題目測驗。

BDD-005 不做 UI 讓學生自己亂改「已學範圍」。

---

## 8. 學習內容資料 / English Content Data

建議目錄：

```text
data/
└─ english/
   ├─ demo-profile.json
   ├─ lessons.json
   ├─ questions.json
   └─ reward-config.demo.json
```

### lesson

```text
lessonId
displayName
scopeId
knowledgePointIds[]
words[]
source
```

### word

```text
wordId
english
chinese
knowledgePointIds[]
reviewTarget
source
```

### question

```text
questionId
kind
scopeKind        CURRENT | PRIOR | CAP
difficultyId
prompt
choices?         // MULTIPLE_CHOICE only
acceptedAnswers? // ZH_TO_EN only
knowledgePointIds[]
prerequisiteKnowledgePointIds[]
reviewTarget
source
```

---

## 9. 題目來源與 provenance / Content Provenance

每筆正式 Demo 內容至少保留：

```text
source.type
source.name
source.url or official identifier
source.licenseOrLegalBasis
source.attribution
source.year?           // official exam
source.questionNumber? // official exam
```

### source.type

首版支援：

- `PUBLIC_DOMAIN`
- `OPEN_LICENSE`
- `OFFICIAL_EXAM`
- `CURRICULUM_REFERENCE`

### CURRICULUM_REFERENCE

只能表示：

「這個來源用來確認學習範圍」。

不能因此把受保護的課文、圖片、題目、解析直接複製進 QeKStudy。

### CAP 題

官方題目保留：

- 年度
- 題號
- 正式來源
- QeKStudy 自己建立的 knowledge-point mapping
- QeKStudy 自己寫的 review target / explanation

不搬用第三方參考網站的解析。

---

## 10. Flashcard Exposure Tracker / 單字閃卡計時

模組：

`src/learning/flashcard-exposure.js`

### 核心資料

對每個 word：

```text
wordId
visibleMs
qualified
```

### 計時規則

一個單字只有在：

- 該 card 是目前 active card
- 頁面目前可見

時才累積 visible time。

使用：

- browser `performance.now()` 計算 duration
- `visibilitychange` 暫停背景分頁計時

### 完成條件

```text
every(word.visibleMs >= 1000)
```

順序不限。

學生可以往前、往後翻。

同一個字多次看到的**實際可見時間可以累加**。

例如：

`600ms + 500ms = 1100ms → qualified`

但把整個頁面停在某一張卡，不會讓其他卡自動累積時間。

### 完成事件

只在整課從未完成 → 完成的那一刻產生一次：

`FLASHCARD_LESSON_COMPLETED`

UI 自己不能直接發獎勵。

---

## 11. Quiz Composer / 測驗組成

模組：

`src/learning/quiz-composer.js`

BDD-005 不做自動演算法。

第一版使用人工整理的 Demo manifest / question pool。

Composer 必須驗證本輪至少包含：

- current 題目
- at least one prior 題目
- at least one eligible CAP 題

但 **SDD 不硬寫固定 3:1:1 比例**。

比例留給內容設定，不寫死在 domain。

### CAP eligibility

```text
question.prerequisiteKnowledgePointIds
  ⊆
profile.learnedKnowledgePointIds
```

全部 prerequisite 都已學過才 eligible。

只要缺一個：

`QUESTION_NOT_ELIGIBLE`

不能因為「學生是國二」就直接放入。

---

## 12. Answer Evaluator / 作答判定

模組：

`src/learning/answer-evaluator.js`

### ZH_TO_EN

第一版：

- trim leading/trailing spaces
- case-insensitive
- compare against `acceptedAnswers[]`

不在 BDD-005 自動做模糊拼字容錯。

若老師認可替代答案，直接列在 `acceptedAnswers[]`。

### MULTIPLE_CHOICE

使用 stable `choiceId`，不以畫面文字位置判斷。

---

## 13. Attempt State / 作答狀態

每題 session state：

```text
questionId
attempts[]
firstAttemptCorrect
resolved
rewardGranted
```

每次 attempt：

```text
attemptIndex
answer
correct
```

### 第一次答錯

保留：

`firstAttemptCorrect = false`

UI 顯示：

- 答錯
- review target
- `再試一次`
- `繼續下一題`

### Retry

允許重試，不鎖死最大次數。

但是：

**同一題在同一輪最多只會因「第一次答對成功狀態」發一次答題獎勵。**

也就是：

- 第一次答對 → award once
- 第二/三次才第一次答對 → award once using retry rule
- 已經答對後再重做 → 本輪不重複發該題獎勵

避免同一題在同一 session 無限刷點。

---

## 14. Review Target / 複習方向

題目資料直接帶 review target。

概念：

```text
reviewTarget.type
reviewTarget.label
reviewTarget.location
reviewTarget.hint
```

例如 type 可以是：

- WORD
- GRAMMAR
- SENTENCE_PATTERN
- TEXT
- KNOWLEDGE_POINT

UI 至少顯示：

1. 回哪裡看
2. 要看什麼

不能只有：

`答錯`

也不能只把正確答案丟給學生就結束。

---

## 15. Reward Model / 獎勵模型

模組：

`src/learning/reward-engine.js`

BDD-005 使用 **points** 作為獎勵計算單位。

不要在 domain 裡寫：

- NT$
- 現金支付
- 已實際發錢

### 原因

005 驗證的是「學習行為 → 零用金獎勵點數」的機制。

真正的：

- 點數如何換成金額
- 家長核准
- 實際發放
- 家長調整

不是 BDD-005。

### Reward config

`reward-config.demo.json` 提供結構，但 SDD 不決定實際數字。

至少包含：

```text
subjectDailyCaps.english
flashcard.lessonCompletionPoints
difficultyBasePoints
firstTryFactor
retryFactor
repeatDecay
```

實際 numeric values 必須在 Implementation 前用明確 Demo config 設定，不能散落 hard-code 在 UI。

---

## 16. Reward Calculation / 獎勵計算

### Assessed question

概念：

```text
rawPoints =
  basePoints(difficulty)
  × attemptFactor(first-try or retry)
  × repeatFactor(previous mastery count)
```

最後：

```text
awardedPoints =
  min(rawPoints, remainingSubjectDailyCap)
```

### 原則

- harder content may have higher base points
- retry can be worth less than first-try correct
- previously mastered content earns less on later correct review
- daily cap clamps awarded points
- cap never blocks learning

### 點數運算

RewardEngine 最終輸出 integer points。

若 config 使用 factor，rounding policy 由 RewardEngine 單一處理，UI 不自行 round。

---

## 17. Flashcard Reward / 閃卡獎勵

Flashcard reward 與 mastery reward 分開。

`FLASHCARD_LESSON_COMPLETED`：

- 代表完整 exposure
- 不把單字標成 mastered
- 取得 lesson completion base points
- 同樣受 English daily cap 影響

同一天同一課重複完成是否再次給分：

**不要寫死在 UI。**

Reward config 保留：

`flashcard.sameDayRepeatPolicy`

BDD-005 自動測試至少驗證第一次完整完成可得基本獎勵。

後續若要決定「同一天第二次是否再給」，先確認產品規則，再加入對應測試。

---

## 18. Repeat / Mastery Count / 重複複習次數

Demo state 對 assessed content 記：

```text
masterySuccessCountByContentId
```

只有答對成功才增加 success count。

答錯本身不增加「已掌握次數」。

RewardEngine 在給本次獎勵前讀取：

`previousSuccessCount`

因此：

- first known success
- second correct review
- third correct review

可以套用不同的 repeat decay。

這和同一題同一 session 的 retry 次數分開計算。

---

## 19. Daily Cap / 每科每日頂標

Demo store 記：

```text
dailyRewards[YYYY-MM-DD].english
```

RewardEngine 每次 awarding：

1. 計算 raw points。
2. 讀 English 今日已得 points。
3. 算 remaining cap。
4. clamp awarded points。
5. 回傳 cap 狀態。

回傳至少：

```text
rawPoints
awardedPoints
dailyTotalBefore
dailyTotalAfter
dailyCap
capReached
capLimited
reasonBreakdown[]
```

UI 可以因此清楚說：

- 這題原本值多少
- retry / repeat 後是多少
- 是否因今日頂標被截斷

達頂標後：

- 仍可翻閃卡
- 仍可答題
- 仍可看 review target
- awardedPoints = 0

---

## 20. Demo Learning Store / Demo 狀態儲存

模組：

`src/learning/demo-learning-store.js`

Browser adapter 可使用：

`localStorage`

namespace：

`qekstudy:bdd005:demo:v1`

只存匿名 Demo state：

- flashcard completion state
- mastery success counts
- daily English reward points
- current unfinished demo session if needed

不得存：

- 真實姓名
- family ID
- 真實 student ID
- production allowance ledger

### reset

English Demo UI 提供：

`重設 Demo 學習資料`

方便 Acceptance 重跑。

### 資料格式版本

local demo state 包含：

`version: 1`

因為不是正式資料，如果版本不相容：

- UI 清楚提示
- 可以 reset Demo state
- 不需要做 Google Sheet migration

---

## 21. EnglishLearningService / Application Service

主 application service：

`src/learning/english-learning-service.js`

它是 UI 唯一主要入口。

建議 methods：

```text
getHome()
startFlashcards(lessonId)
recordFlashcardExposure(wordId, milliseconds)
getFlashcardProgress()
completeFlashcardsIfEligible()

startQuiz()
getCurrentQuestion()
submitAnswer(answer)
retryQuestion()
continueToNextQuestion()

getSessionSummary()
getDailyRewardStatus()
resetDemoState()
```

實際 function naming 可在實作時微調，但 UI 不直接操作 store / reward engine / selector。

---

## 22. UI Flow / UI 流程

### English Home

顯示：

- English Demo
- 今日 English reward progress
- 單字閃卡
- 測驗
- Demo data warning

### Flashcards

顯示：

- lesson name
- word
- meaning
- current index
- 本課已合格卡數 / 總卡數
- previous / next

只有 card 實際 active + page visible 時計時。

完成 30/30：

- 顯示 completed
- 顯示本次 awarded points
- 顯示今日 English total / cap

### Quiz

每題顯示：

- 題目
- 作答 UI
- submit

答對：

- correct
- awarded points
- next

答錯：

- wrong
- review target
- retry
- continue

### Summary

顯示：

- completed questions
- first-try correct
- retry-correct
- unresolved
- review targets
- reward breakdown
- today English total / cap

不只顯示一個總分。

---

## 23. Reward Transparency / 獎勵透明

任何加點都產生可顯示 breakdown。

例如概念上：

```text
reason:
  "中翻英 · 困難度 2"
attempt:
  "第一次答對"
repeat:
  "第一次掌握"
cap:
  "未達今日上限"
awarded:
  N points
```

若被 cap 截斷：

```text
raw: N
remaining today: M
awarded: M
```

學生要看得懂「為什麼是這個點數」。

---

## 24. Error Contract / 錯誤狀態

BDD-005 domain 建議：

- `CONTENT_NOT_AVAILABLE`
- `CONTENT_INVALID`
- `QUESTION_NOT_ELIGIBLE`
- `ANSWER_REQUIRED`
- `SESSION_NOT_ACTIVE`
- `SESSION_COMPLETE`
- `REWARD_CONFIG_INVALID`
- `DEMO_STATE_INVALID`

UI 顯示一般人可懂文字，不直接把 code 丟給學生。

---

## 25. Content Validation / 內容驗證

在內容進入可用 Demo 前驗證：

### word

必須有：

- stable wordId
- English
- Chinese
- knowledge point
- source metadata

### assessed question

必須有：

- stable questionId
- supported kind
- answer data
- difficultyId
- knowledgePointIds
- reviewTarget
- source metadata

### CAP

額外需要：

- source.type = OFFICIAL_EXAM
- year
- questionNumber
- prerequisiteKnowledgePointIds
- eligibility check passes

資料不完整：

`CONTENT_INVALID`

不讓該內容出現在學生 UI。

---

## 26. 不修改現有 Google Sheet Schema / No Database Migration

BDD-005：

`schema_version stays 2`

不新增：

- learning_attempts sheet
- rewards sheet
- question_history sheet
- mastery sheet

原因不是這些未來不需要，而是現在正式 Authentication 尚未完成。

一旦要保存真實學習與獎勵資料，就重新 review BDD-004，並在後續 Story 正式設計 schema / migration / backup / compatibility。

---

## 27. 與 BDD-001~003 的隔離 / Regression Safety

現有：

- family domain
- persistent family service
- admin management service
- Apps Script family persistence
- schema v2

全部保持原行為。

BDD-005 不改：

- family authorization
- parent ownership
- rename
- soft delete
- audit_log
- Apps Script schema

English Demo 是新 student-facing slice。

---

## 28. Planned Files / 預計檔案

SDD-005 implementation 預計新增：

```text
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
```

測試檔名留到 TDD-005 Red 正式建立。

Apps Script / Google Sheets 不新增 005 persistence files。

---

## 29. TDD-005 Boundary / 下一階段測試邊界

TDD Red 至少覆蓋：

1. English home exposes flashcards and quiz.
2. student is not forced through fixed activity order.
3. one word reaches qualified exposure only after >= 1000ms visible exposure.
4. background/hidden time does not count.
5. all words qualified → lesson flashcard completion.
6. any unqualified word → no full-lesson flashcard completion.
7. flashcard completion produces base reward event.
8. flashcard completion does not mark words mastered.
9. quiz contains current content.
10. quiz contains prior learned content.
11. quiz contains at least one eligible CAP question.
12. CAP with all prerequisites learned is eligible.
13. CAP with any unlearned prerequisite is rejected.
14. ZH_TO_EN evaluates accepted answers correctly.
15. MULTIPLE_CHOICE evaluates stable choice IDs correctly.
16. first attempt result is preserved.
17. wrong answer returns review target.
18. student can retry after wrong answer.
19. student can continue after wrong answer.
20. retry success does not rewrite firstAttemptCorrect.
21. one question grants at most one success reward within a session.
22. configured harder difficulty can produce higher base reward.
23. repeated mastered content uses lower configured reward.
24. retry and historical repeat are tracked separately.
25. daily English cap clamps awarded points.
26. reaching cap does not block further learning.
27. summary separates first-try / retry / unresolved.
28. summary includes review targets.
29. summary explains reward breakdown.
30. malformed content is not exposed.
31. CAP provenance includes year/question number.
32. anonymous demo state contains no real family/student identity.
33. BDD-001~003 regression remains green.
34. English UI contract exercises real learning service rather than static mock.

---

## 30. Design Decisions / 主要取捨

### Decision A — 不碰 Google Sheet

選擇：anonymous local demo state。

原因：不提前突破 BDD-004 trigger。

### Decision B — 中翻英作第一個一般測驗

選擇：ZH_TO_EN。

原因：TeenageStudyTool 已有真實使用經驗，而且能測 active recall。

### Decision C — mixed quiz 仍支援正式會考選擇題

選擇：最小支援 MULTIPLE_CHOICE。

原因：不能為了只做一種 UI 而把正式會考題排除在 005 之外。

### Decision D — 不寫死題型比例

選擇：由 Demo content manifest 組題，但 domain 驗證 current/prior/CAP 都存在。

原因：3:1:1 等比例目前不是已確認產品需求。

### Decision E — reward 由 config 驅動

選擇：domain 不 hard-code 實際點數。

原因：BDD 已確認規則，但未確認金額。

### Decision F — points，不做實際 payout

選擇：005 只計 reward points。

原因：實際家庭核准、金額換算與發放應是正式 allowance lifecycle 的後續需求。

---

## 31. Open Configuration Before Green / 實作前需填入但不阻塞 SDD 的設定

以下不是 BDD 行為爭議，而是 Demo config 數值：

- English daily cap points
- flashcard full-lesson completion points
- difficulty base points
- retry factor / retry points
- repeat decay schedule
- same-day repeated flashcard completion policy

TDD Red 可以用明確 test fixture 驗證規則關係。

在真正 UI Green 前，Demo config 的實際數值要明確記錄，不得散落在程式碼。

---

## 32. Definition of Done / 完成條件

BDD-005 只有在以下都完成才 Done：

- BDD approved
- SDD approved
- TDD Red
- implementation
- TDD Green
- English operable student UI
- flashcard exposure acceptance
- mixed current/prior/CAP quiz acceptance
- wrong-answer review + retry/continue acceptance
- reward / repeat decay / daily cap acceptance
- full BDD-001~005 regression
- content provenance verified
- no real student learning/reward data persisted before BDD-004 review
- documentation updated
- commit completed

No operable student UI = not Done.

---

## English Summary

SDD-005 introduces a separate English student demo built from traceable JSON content and testable pure-JavaScript learning modules.

The first assessed mode is Chinese-to-English recall, while minimal multiple-choice support allows real eligible CAP past-exam questions to appear in the same mixed quiz. Flashcard completion requires at least one second of actual visible exposure per word.

Reward calculation is configuration-driven: difficulty can increase base points, retry and repeated mastered content may reduce points, and a per-subject daily cap limits rewards without blocking learning.

To preserve the existing authentication safety boundary, BDD-005 does not modify the Google Sheets schema and does not persist real student learning or reward records. Only anonymous demo state is stored locally. Real learning/reward persistence triggers a review of BDD-004 first.
