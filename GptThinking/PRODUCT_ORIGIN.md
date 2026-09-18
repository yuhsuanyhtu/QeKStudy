# QeKStudy Product Origin / 產品起源

日期 Date: 2026-09-18

## 為什麼重寫 / Why QeKStudy Is Being Rewritten

QeKStudy 不是單純把 TeenageStudyTool 換名字，也不是只為了換技術架構。  
這次重寫的原因來自實際使用後，使用情境已經從「單一家庭、單一孩子」變成「班級、多家庭、多科目、長期學習」。

QeKStudy is not simply a renamed TeenageStudyTool, nor is the rewrite primarily about technology.  
The rewrite is driven by a real change in scope: from one child in one household to a class-wide, multi-family, multi-subject, long-term learning system.

### 1. 系統已經在班級群組曝光
### 1. The system has been exposed to the class group

TeenageStudyTool 原本是為 QeK 個人與家庭使用而做。  
現在同班同學與其他家長已經知道這套系統，因此新的系統需要從一開始就把「多人、多家庭、權限隔離」當成正式需求，而不是後補功能。

TeenageStudyTool began as a personal/family tool for QeK.  
Now that classmates and other parents are aware of it, the new system must treat multi-user, multi-family, and permission boundaries as first-class product requirements.

---

### 2. 老師建議刷題，QeK 自己也希望題目更多
### 2. The teacher recommends more practice, and QeK himself wants more questions

老師的教學經驗支持增加刷題量，而 QeK 也主動提出希望有更多題目、更有挑戰。  
這表示系統不應只做少量練習或固定題量，而應能逐步增加練習量、題型與挑戰。

The teacher recommends more practice volume, and QeK has independently asked for more questions and more challenge.  
Therefore, the system should support progressively richer practice volume, question types, and difficulty rather than a small fixed exercise set.

重要原則：
- 題量增加不能只是「把同一種題目拉長」。
- 要避免造成做不完就直接退出的情況。
- 應保留可完成的小單位，同時提供更多可選練習。

Key principles:
- More practice should not simply mean making every session longer.
- The system should avoid increasing the risk of quitting mid-session.
- Practice should remain completable in small units while offering more optional volume.

---

### 3. 面對會考，需要長期複習、統整與回頭找答案
### 3. Preparing for the Comprehensive Assessment Program requires cumulative review and synthesis

老師的經驗是：學生到後期常會忘記前面學過的內容，也缺乏跨單元統整。  
因此 QeKStudy 應加入會考型題目，但不能一次把所有內容丟給學生，而要依學生目前年級與已學進度逐步加入。

Teacher experience indicates that students often forget earlier material and struggle to integrate knowledge across units later on.  
QeKStudy should therefore include CAP-style questions progressively, based on the student's current grade and learned content.

核心要求：
- 依年級、學期、已學內容逐步開放。
- 向下相容：高年級題目可以整合先前學過的內容。
- 不應要求學生回答尚未學過的正式課程內容。
- 錯題回饋不只是顯示正解。
- 答錯時應提供「回去哪裡找」的方向，例如章節、概念、課文、單字、公式或知識點。
- 目的是引導學生回去讀書、查找、重新理解，再回來作答。

Core requirements:
- Unlock content progressively by grade, semester, and learned material.
- Maintain backward compatibility: later-grade questions may integrate earlier knowledge.
- Do not formally assess curriculum content that has not yet been learned.
- Wrong-answer feedback must go beyond showing the correct answer.
- When a student is wrong, provide a direction for where to review: chapter, concept, text, vocabulary, formula, or related knowledge point.
- The intended behavior is: go back, study, locate the answer, understand it, and try again.

---

### 4. 不再只有英文
### 4. The system is no longer English-only

TeenageStudyTool 最早以英文學習為中心，後來才逐步加入國文與閱讀。  
QeKStudy 從一開始就應定位成跨科學習系統，而不是「英文 App 加其他科目」。

TeenageStudyTool started as an English-focused learning tool and later added Chinese and reading.  
QeKStudy should be designed from the beginning as a multi-subject learning system, not as an English app with add-ons.

這表示未來需求應能容納：
- 英文
- 國文
- 數學
- 自然
- 社會
- 閱讀理解
- 跨科與會考型整合題

This means future requirements should be able to support:
- English
- Chinese
- Mathematics
- Science
- Social Studies
- Reading comprehension
- Cross-subject and CAP-style integrated questions

---

## 從 TeenageStudyTool 保留下來的產品原則
## Product Principles Carried Forward from TeenageStudyTool

1. **記錄的不只是成功，也包括嘗試與中途放棄。**  
   Record not only success, but also attempts and abandonment.

2. **不要只有「答對 / 答錯」，要告訴學生差在哪裡、下一步去哪裡找。**  
   Feedback should explain what is missing and where to review next.

3. **零用金是家庭獎勵機制，不是支付平台。**  
   Allowance is a family-controlled reward mechanism, not a payment platform.

4. **家長保有最終調整與核准權。**  
   Parents retain final approval and adjustment authority.

5. **老師負責學習內容與教學方向，不控制其他家庭的零用金。**  
   Teachers guide learning content and pedagogy, but do not control another family's allowance.

6. **系統不能因技術問題讓學生誤以為努力成果消失。**  
   Technical behavior must not make students believe their progress has disappeared.

7. **需求應優先來自真實使用行為、學生回饋、家長觀察與老師經驗。**  
   Requirements should be grounded in real usage, student feedback, parent observation, and teacher experience.

---

## QeKStudy 的核心目的
## Core Purpose of QeKStudy

QeKStudy 的目的不是單純讓學生「做更多題」。

它要幫助學生：

- 願意開始
- 願意持續
- 願意增加練習量
- 知道自己錯在哪裡
- 知道該回去哪裡讀
- 把舊知識重新撿回來
- 隨年級累積並統整知識
- 在家庭可控的前提下，讓努力與零用金獎勵產生連結

QeKStudy is not simply about making students answer more questions.

It should help students:

- start willingly,
- continue practicing,
- increase practice volume,
- understand what they got wrong,
- know where to review,
- recover forgotten knowledge,
- accumulate and integrate learning across grade levels,
- and connect effort with family-controlled allowance incentives.

---

## 對後續 BDD 的影響
## Implications for Future BDD

後續每一條 BDD 都應至少能回答：

1. 這個需求解決哪個真實學習問題？
2. 學生做錯時會得到什麼「下一步方向」？
3. 是否支援不同年級與已學進度？
4. 是否能擴展到不同科目？
5. 是否維持家庭之間的資料與零用金隔離？
6. 是否避免增加不必要的挫折或退出風險？

Each future BDD item should be able to answer:

1. What real learning problem does this requirement solve?
2. What actionable next step does a student receive after a mistake?
3. Does it support different grades and learned-progress levels?
4. Can it generalize across subjects?
5. Does it preserve data and allowance isolation between families?
6. Does it avoid unnecessary frustration or increased abandonment risk?
