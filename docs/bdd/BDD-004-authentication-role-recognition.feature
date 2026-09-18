# language: zh-TW
# QeKStudy BDD-004
# 中文：使用者登入、學生身分與角色辨識
# English: Authentication, learner identity, and role recognition
# Status: DEFERRED / REVIEWED / TRIGGER-BASED
#
# 2026-09-18 重新撿回原因：
# BDD-005 已確認要把真實學習紀錄與學習產生的零用金獎勵寫入 Google Sheet。
# 這符合原本的 BDD-004 pickup trigger，因此不能再維持 Deferred。
# 真正的零用金發放屬於另一個家長頁流程，不在 BDD-005。
#
# 2026-09-18 再次決策：
# 需求與安全邊界已 review，但產品決定不在此階段實作完整 Authentication。
# BDD-005 先以「單一家庭 / 單一學生 / 受控使用」繼續，
# 資料表仍用 family_id / student_id 清楚分割，之後 Authentication 再接上。
# 公開 URL 仍不得被視為安全的多人使用邊界。
#
# 新 pickup triggers：
# 1. 第二個真實家庭開始留下學習或獎勵資料。
# 2. 班上其他學生 / 家長要直接使用同一套系統。
# 3. 系統要讓外部使用者自行加入。
# 4. 要公開家長提領或 Admin 破壞性操作。
# 5. 任何情況要求「使用者不能冒用別人」成為正式安全保證。
#
# 舊版本保留在 Git history。

功能: 使用者登入、學生身分與角色辨識
  為了讓學習紀錄、家庭資料和零用金只被正確的人使用
  作為 QeKStudy 使用者
  我希望系統能可靠知道我是誰、我是家長還是學生
  讓每個人只能看到與操作自己被授權的資料

  場景: 未登入使用者不能讀寫私人資料
    假設 使用者尚未登入
    當 使用者開啟需要私人資料的功能
    那麼 系統應要求登入
    而且 不應顯示家庭私人資料
    而且 不應顯示真實學生的學習紀錄或零用金資料
    而且 不應允許修改家庭、學習紀錄或零用金資料

  場景: 家長登入後系統知道是哪一位家長
    假設 某個登入帳號已被登記為家長 A
    當 該帳號成功登入
    那麼 系統應辨識目前使用者為家長 A
    而且 角色應為 PARENT
    而且 只能載入家長 A 被授權的家庭與孩子資料

  場景: 學生使用系統時必須能對應到正確的學生
    假設 某個已授權的登入身份對應到學生 A
    當 學生 A 進入學習功能
    那麼 系統應知道目前正在學習的是學生 A
    而且 學習紀錄應寫入學生 A
    而且 不應寫入其他學生

  場景: 學生不能冒用其他學生
    假設 系統目前辨識正在學習的是學生 A
    而且 學生 B 的 studentId 已被知道或猜到
    當 瀏覽器嘗試把 studentId 改成學生 B
    那麼 系統仍應以可信任的登入身分判定目前學生
    而且 不應讀取或寫入學生 B 的私人學習紀錄

  場景: 學生不能自行變成家長或管理員
    假設 系統目前辨識使用者為 STUDENT
    當 瀏覽器傳入 PARENT、ADMIN、parentId、adminId 或其他角色參數
    那麼 系統仍應把該使用者視為 STUDENT
    而且 不應提供家長或管理員專用權限

  場景: 家長只能看到自己家庭孩子的學習與零用金資料
    假設 家長 A 已登入
    當 家長 A 查看孩子的學習與零用金資料
    那麼 系統只能回傳家長 A 被授權家庭中的孩子資料
    而且 不應回傳其他家庭孩子的資料

  場景: 家長專用的零用金操作只能由正確家庭的家長使用
    假設 系統提供家長專用的零用金管理功能
    當 使用者嘗試操作某位學生的零用金
    那麼 系統應確認目前登入者是該學生所屬家庭中有權限的家長
    而且 STUDENT 不應取得家長專用操作權限
    而且 其他家庭的家長不應操作這位學生的零用金

  場景: 已登記管理員登入後取得管理員身份
    假設 某個登入帳號已被登記為管理員
    當 該帳號成功登入
    那麼 系統應辨識目前使用者為該管理員
    而且 角色應為 ADMIN
    而且 系統可以提供管理員專用功能

  場景: 瀏覽器不能自行把家長升級成管理員
    假設 家長 A 已登入
    當 瀏覽器直接傳入 ADMIN、adminId 或其他管理員參數
    那麼 系統仍應把該使用者辨識為 PARENT
    而且 不應提供管理員修改或刪除權限

  場景: 知道其他 parentId 也不能冒用其他家長
    假設 家長 A 已登入
    而且 家長 B 的 parentId 已被家長 A 知道或猜到
    當 家長 A 嘗試用家長 B 的 parentId 存取資料
    那麼 系統仍應以登入身份辨識家長 A
    而且 不應回傳家長 B 的家庭私人資料
    而且 不應允許家長 A 操作家長 B 的家庭

  場景: 同一帳號換裝置登入後身份保持一致
    假設 某帳號已被登記為特定家長、學生或管理員
    當 該帳號在另一個瀏覽器或裝置成功登入
    那麼 系統仍應辨識為同一個內部身份
    而且 應取得相同的角色與授權範圍

  場景: 未登記帳號登入後不能取得私人權限
    假設 某個登入帳號尚未被 QeKStudy 登記
    當 該帳號成功完成外部登入
    那麼 QeKStudy 不應自動賦予 PARENT、STUDENT 或 ADMIN 權限
    而且 不應顯示任何家庭、學習或零用金私人資料
    而且 應清楚告知此帳號尚未被授權使用

  場景: 登出後私人操作立即失效
    假設 使用者已登入
    當 使用者登出
    那麼 系統應清除目前登入狀態
    而且 後續私人資料讀寫應要求重新登入
    而且 不應沿用登出前的角色與權限

  場景: 登入失敗時不得建立半登入狀態
    當 登入流程失敗或身份驗證結果無法確認
    那麼 系統不應把使用者視為已登入
    而且 不應載入家庭、學習或零用金私人資料
    而且 不應提供 PARENT、STUDENT 或 ADMIN 專用功能

# 驗收補充 / Acceptance notes
#
# 1. BDD-004 只定義「系統必須可靠知道目前是誰、角色是什麼、可以操作哪些資料」。
#    Google OAuth、Firebase Auth、Apps Script 身分等技術留到 SDD-004 決定。
#
# 2. PARENT / STUDENT / ADMIN、parentId / studentId / adminId
#    都必須由可信任的 server-side identity mapping 決定，
#    不能相信 browser 自己送上來的角色或 ID。
#
# 3. BDD-001 的家庭隔離、BDD-002 的持久化、BDD-003 的 Parent/Admin 權限仍要成立。
#
# 4. BDD-004 只負責保證「誰可以操作哪個家庭/學生的零用金」。
#    實際的家長發放流程（例如每次 $100、扣 saving pool、寫 payout 紀錄）
#    應由獨立 Story 定義，不塞進 Authentication Story。
#
# 5. 帳號怎麼註冊、邀請學生與家長、是否一個帳號可對應多個角色，
#    如果需要更複雜行為，再另開 Story。
#
# English summary:
# BDD-004 is re-opened because BDD-005 now requires real persisted learning/reward data and
# parent-confirmed allowance payout. The trusted identity model must now cover STUDENT as well as
# PARENT and ADMIN, and browser-supplied IDs/roles must never grant access.
