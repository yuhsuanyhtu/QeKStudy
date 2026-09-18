# BDD-005 Product Direction / BDD-005 產品方向

日期 Date: 2026-09-18  
Status: Product discussion handoff — BDD remains DRAFT

> 這份文件保存從 TeenageStudyTool 實際使用歷史延伸到 QeKStudy BDD-005 的產品心得。  
> 它是下一個 session 的產品脈絡 handoff，不取代正式 BDD、SDD 或 `docs/STATUS.md`。
>
> This document preserves the product reasoning carried from real TeenageStudyTool usage into QeKStudy BDD-005.  
> It is a handoff for future sessions, not a replacement for the formal BDD, SDD, or `docs/STATUS.md`.

---

## 1. 起點 / Starting Point

QeKStudy 不是一般題庫網站，也不是把 TeenageStudyTool 換名字。

產品核心是：

1. **用測驗幫助學習與強化認知。**
2. **不只練現在單元，也持續統整以前學過的內容。**
3. **逐步加入只需要學生「已學過知識」即可作答的會考考古題。**
4. **答錯時不是只公布正解，而是告訴學生去哪裡複習、要找什麼。**
5. **學習行為與家庭控制的零用金機制掛勾。**
6. **學習流程的控制權留在孩子手上。**

QeKStudy is not a generic question bank and is not merely a renamed TeenageStudyTool.

Its core is to:

1. use testing to strengthen learning and recall,
2. mix current learning with previously learned knowledge,
3. progressively include CAP past-exam questions that require only already-learned knowledge,
4. give actionable review directions after mistakes rather than only revealing answers,
5. connect learning activity with a family-controlled allowance mechanism,
6. keep control of the learning flow with the student.

---

## 2. 從 TeenageStudyTool 得到的真實產品訊號 / Real Product Signals from TeenageStudyTool

### 2.1 不要用系統強迫孩子「正確學習」 / Do not force the child into a prescribed learning path

TeenageStudyTool 曾因謙恩「做錯一題就關瀏覽器」加入 `quiz_abandoned` 紀錄。

重要的產品心得不是「禁止他離開」，而是：

- 允許他離開；
- 系統看得見他曾經嘗試；
- 看得見在哪裡碰壁；
- 等他自己願意回來時，再提供修正方向。

The lesson was not to prevent quitting. It was to preserve the fact that an attempt happened, understand where frustration occurred, and provide a path back when the student chooses to return.

### 2.2 題量增加不等於每一輪都變長 / More practice does not mean every session should be longer

謙恩後來主動要求「更多題目、更多挑戰」。

但 TeenageStudyTool 沒有把所有練習模式全部拉長，因為既有經驗顯示：

> 一回合太長會增加「做不完就離開」的風險。

因此 QeKStudy 應提供更多可選練習與挑戰，但仍保留小而可完成的一輪。

QeKStudy should offer more optional volume and challenge while keeping individual practice rounds small and completable.

### 2.3 真實學生回饋直接改產品 / Real student feedback directly changes the product

TeenageStudyTool 曾因謙恩回饋而調整：

- 題量與難度；
- 國文語音是否自動播放；
- 語速；
- 文意字彙揭曉後播放整句；
- 效能問題「速度慢、越來越慢」。

因此 QeKStudy 不應先假設完整產品行為，再要求學生適應。

產品需求優先順序應持續來自：

- 真實學生使用行為；
- 學生回饋；
- 家長觀察；
- 老師經驗。

### 2.4 老師回饋是正式產品輸入 / Teacher feedback is a first-class product input

TeenageStudyTool 的文意字彙與克漏字題型曾直接來自老師建議。

2026-09-18，英文老師向家長反映：班上同學此次表現普遍不理想，但觀察到謙恩的成績明顯上升，並主動請家長分享經驗。

這是**值得驗證的產品訊號**，但不能直接推論「成績提升一定由 TeenageStudyTool 造成」。

因此 QeKStudy 第一個學習科目決定從 **英文** 開始，是基於現有最強的真實使用與教學訊號，而不是因為英文在工程上比較方便。

On 2026-09-18, the English teacher reported poor overall class performance while observing a marked improvement in QeK's result and asked the parent to share the experience.

This is a meaningful product signal, not proof of causation. English is therefore the first learning subject because it has the strongest real-world usage and teacher signal, not because it is technically easier.

---

## 3. 核心產品原則：學習控制權在孩子 / Core Principle: The Student Controls the Learning Flow

孩子可以：

- 答錯後直接繼續下一題；
- 選擇立即再試一次；
- 選擇先去複習；
- 暫停；
- 中途離開；
- 選擇做更多題；
- 做出大人認為不合理的學習選擇。

系統的責任不是阻止這些行為，而是：

- 清楚呈現結果；
- 保留第一次作答的事實；
- 告訴他錯在哪一類；
- 告訴他去哪裡找；
- 讓選擇與後果可見；
- 在他願意修正時提供路徑。

A student may continue after a mistake, retry immediately, review first, pause, leave, or choose more practice.

The system should inform rather than coerce. It should make outcomes visible and provide a path to correction when the student chooses it.

### 邊界 / Boundary

「孩子有控制權」是**學習流程自主權**，不是無限制的系統權限。

孩子不能因為自主而：

- 修改家庭零用金規則；
- 任意修改已記錄結果；
- 操作其他家庭資料；
- 繞過家庭權限。

Student autonomy applies to learning choices, not to family money controls, record integrity, or authorization boundaries.

---

## 4. 單元不是終點，只是這次練習的起點 / A Unit Is the Starting Point, Not the Boundary

QeKStudy 的練習不應長期停留在：

`選單元 → 只考這個單元`

比較接近產品目標的是：

`目前正在學的內容`
→ `練現在內容`
+ `穿插以前學過的內容`
+ `加入符合目前已學範圍的會考題`

因此「單元」是本次練習的主題或入口，但題組可以包含跨時間的舊知識與整合題。

A selected unit is the main context for a practice round, but the round may also revisit previously learned material and include integrated CAP questions.

---

## 5. 會考題的資格不是「年級標籤」 / CAP Eligibility Is Based on Required Knowledge, Not Just Grade Labels

一題會考考古題是否可以現在出現，不應只看：

`question.grade <= student.grade`

真正的問題是：

> **這一題解題所需要的知識點，學生是否都已經學過？**

例如一題需要：

- 國一已學單字；
- 過去式；
- because / so 因果關係；
- 上下文閱讀判斷；

只要這些 prerequisite 都已經學過，就有資格成為目前練習的一部分。

如果其中包含尚未正式學過的知識，就不應拿來當正式測驗題，即使題目表面看起來適合該年級。

Whether a CAP question is eligible should be determined by its prerequisite knowledge points and the student's learned scope, not simply by a grade label.

### BDD-005 的範圍控制 / Scope Control for BDD-005

第一版**不需要做自動選題演算法**。

可以人工挑選少量 Demo 題，並明確記錄：

- 這題需要哪些知識；
- 為什麼目前學生已具備這些知識；
- 答錯後應回哪裡複習。

The first version can use manually curated demo questions. Automatic selection can come later.

---

## 6. 零用金不是附加功能 / Allowance Is Not an Add-on

這是目前最重要的產品修正之一。

如果把零用金拿掉，QeKStudy 很容易退化成市場上已有的普通練習網站。

TeenageStudyTool 的實際使用顯示，零用金與：

- 願不願意開始；
- 願不願意多做；
- 挑戰程度；
- 對結果的在意程度；

會互相影響。

因此在真正拿給孩子驗證的最小學習閉環中，**不能完全移除零用金機制**。

Allowance is part of the real engagement loop. A minimal learning demo that omits it may test a product behavior that the student would not actually use.

### 控制權分工 / Control Split

- **學生控制學習行為**：要不要做、要不要重試、要不要複習、要不要繼續。
- **家庭控制零用金**：規則、核准、調整與實際發放。

Student controls learning choices. The family controls allowance rules, approval, corrections, and actual payout.

### 尚未決定 / Not Yet Decided

BDD-005 尚未決定：

- 完成一輪是否有固定獎勵；
- 第一次答對是否按題計酬；
- retry 後答對如何計算；
- 會考題是否有不同獎勵；
- 每日上限；
- 是否沿用 TeenageStudyTool 現有公式。

**不要在 SDD 或 coding 階段自行發明金額規則。**

Do not invent allowance formulas during SDD or implementation. The behavioral rule must be discussed and confirmed first.

---

## 7. 第一次作答是重要資料 / The First Attempt Matters

TeenageStudyTool 已經出現「第一次答對」與「第二次才答對」價值不同的設計。

QeKStudy 應保留這個產品概念：

> 後來答對，不代表第一次就會。

因此未來即使允許 retry：

- 第一次錯誤不能被後來答對覆蓋；
- 結果摘要不應把 retry 成功偽裝成 first-try success；
- 後續弱點分析才有意義。

A later correct retry must not erase the fact that the first attempt was wrong.

---

## 8. BDD-005 目前應驗證的最小閉環 / Current Minimum Loop to Validate in BDD-005

目前產品討論形成的方向：

**英文優先 / English first**

`英文目前進度`
→ `一小輪測驗`
→ `包含目前內容`
+ `以前已學內容`
+ `符合已學範圍的會考考古題`
→ `學生作答`
→ `看到對/錯`
→ `答錯時得到可實際採取行動的複習位置`
→ `學生自己選擇繼續 / 再試 / 回去複習`
→ `完成一輪`
→ `看到本輪學習結果`
→ `看到本輪零用金結果與原因`

English current progress
→ small practice round
→ current content
+ previously learned content
+ eligible CAP past-exam questions
→ answer
→ correct/incorrect feedback
→ actionable review target after mistakes
→ student chooses continue / retry / review
→ complete round
→ learning summary
→ allowance result with an understandable reason.

---

## 9. BDD-005 現在不應偷渡的工程範圍 / Engineering Scope That Must Not Sneak Into BDD-005

目前不要因為想把架構做完整而順便加入：

- AI 自動出題；
- adaptive difficulty；
- 完整 knowledge graph；
- 自動會考選題演算法；
- 大型題庫管理工具；
- 老師後台；
- 跨家庭正式使用；
- 完整長期學習歷程；
- 未經討論的新零用金公式。

First prove the student-facing learning loop with a small manually curated English demo.

---

## 10. Authentication 邊界 / Authentication Boundary

目前 BDD-004 仍為 `DEFERRED · TRIGGER-BASED`。

老師請家長分享經驗，**本身不等於**必須立刻做 Authentication。

但是一旦發生下列任何事情，必須依 `docs/STATUS.md` 重新 review BDD-004：

- 第二個真實家庭開始使用；
- 其他家長要自行輸入真實資料；
- 要保存真實姓名、學習紀錄或獎勵資料；
- 要公開 Admin 修改 / 刪除 UI；
- Demo 轉為外部使用者可自行加入的 pilot。

在此之前可以展示 Demo，但不要把 Demo identity 當正式安全登入。

---

## 11. 尚未確認、下一個 session 要繼續討論的問題 / Open Questions for the Next Session

以下仍是產品問題，不要直接進 SDD：

1. **一輪英文練習到底有幾題？**
2. **目前內容 / 舊知識 / 會考題的比例怎麼安排？**
3. **學生答錯後 UI 要提供哪些選項？**
4. **「去哪裡複習」要細到什麼程度才真的有用？**
5. **本輪結果頁要呈現哪些事實，不要變成評判學生的成績單？**
6. **BDD-005 的最小零用金規則是什麼？**
7. **retry 後答對如何影響學習結果與零用金？**
8. **第一批 Demo 英文題目要對應謙恩目前哪個課堂進度？**
9. **第一批符合目前已學內容的會考考古題怎麼挑？**

These questions should be settled in product/BDD discussion before SDD.

---

## 12. 給下一個 Session 的接手方式 / Next-session Handoff

下一個 session 不需要重新詢問產品歷史。

請依序讀：

1. `docs/STATUS.md`
2. `README.md`
3. `GptThinking/PRODUCT_ORIGIN.md`
4. **`GptThinking/BDD-005_PRODUCT_DIRECTION.md`**
5. 現有 `docs/bdd/BDD-005-core-practice-review-guidance.feature`

然後從 **BDD-005 的產品行為討論**繼續。

不要：

- 重新規劃整個產品；
- 撿回 BDD-004，除非 trigger 已發生；
- 在 BDD 確認前進 SDD；
- 因工程方便而刪掉零用金；
- 把「孩子自主」做成強制 remediation flow。

---

## English Summary

BDD-005 should be the first authentic QeKStudy learning loop, beginning with English.

It should combine current curriculum, previously learned knowledge, and manually curated CAP past-exam questions whose prerequisites are already learned. When the student is wrong, the system should provide a concrete review direction but keep control with the student: continue, retry, review, or leave.

Allowance is a core part of the product's engagement loop, not a detachable future feature. Student autonomy governs learning choices; family authority governs money.

The first version should remain small and manually curated. The exact round composition, review UI, and allowance formula are still product questions and must be resolved in BDD discussion before SDD.
