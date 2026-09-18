# language: zh-TW
# QeKStudy BDD-004
# 中文：使用者登入與角色辨識
# English: User authentication and role recognition
# Status: DEFERRED / TRIGGER-BASED BACKLOG
# Deferred reason: prioritize controlled demo learning-value validation before full authentication.
# Pickup triggers are tracked in docs/STATUS.md.

功能: 使用者登入與角色辨識
  為了讓家庭資料與管理員功能只被正確的人使用
  作為 QeKStudy 使用者
  我希望系統能可靠辨識我的身份與角色
  以便我只能取得被授權的家庭資料與操作能力

  場景: 未登入使用者不能存取家庭私人資料
    假設 使用者尚未登入
    當 使用者開啟 QeKStudy
    那麼 系統應要求使用者登入
    而且 不應顯示任何家庭私人資料
    而且 不應允許建立、修改或刪除家庭與孩子資料

  場景: 已登記家長登入後取得自己的家長身份
    假設 某個登入帳號已被 QeKStudy 登記為家長 A
    當 該帳號成功登入
    那麼 系統應辨識目前使用者為家長 A
    而且 角色應為 PARENT
    而且 系統只能載入家長 A 被授權的家庭資料

  場景: 已登記管理員登入後取得管理員身份
    假設 某個登入帳號已被 QeKStudy 登記為管理員
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

  場景: 同一帳號重新開啟或換裝置登入後身份保持一致
    假設 某帳號已被登記為家長 A
    當 該帳號在另一個瀏覽器或裝置成功登入
    那麼 系統仍應辨識為同一個家長 A
    而且 角色仍應為 PARENT
    而且 應載入相同的被授權家庭資料

  場景: 未登記帳號登入後不能取得家庭或管理員權限
    假設 某個登入帳號尚未被 QeKStudy 登記
    當 該帳號成功完成外部登入
    那麼 QeKStudy 不應自動賦予 PARENT 或 ADMIN 權限
    而且 不應顯示任何家庭私人資料
    而且 應清楚告知此帳號尚未被授權使用

  場景: 登出後私人操作立即失效
    假設 使用者已登入並可存取家庭資料
    當 使用者登出
    那麼 系統應清除目前登入狀態
    而且 後續家庭私人資料讀寫應要求重新登入
    而且 不應沿用登出前的 PARENT 或 ADMIN 權限

  場景: Authentication 失敗時不得建立半登入狀態
    當 登入流程失敗或身份驗證結果無法確認
    那麼 系統不應把使用者視為已登入
    而且 不應載入私人家庭資料
    而且 不應提供 PARENT 或 ADMIN 專用功能

# Acceptance notes / 驗收補充
# 1. BDD-004 定義「登入身份與角色授權行為」，不在此需求綁定 Google OAuth、
#    Apps Script Session、Firebase Auth 或其他特定技術。
#    BDD-004 defines authentication/authorization behavior without choosing a provider.
# 2. role / parentId / adminId 必須由可信任的 server-side identity mapping 決定，
#    不得相信 browser 自行提供的值。
#    Roles and internal actor IDs must come from trusted server-side identity mapping.
# 3. BDD-001 的家庭隔離、BDD-002 的持久化、BDD-003 的 Parent/Admin 權限都必須繼續成立。
#    BDD-001 isolation, BDD-002 persistence, and BDD-003 permissions remain mandatory.
# 4. 未登記帳號不自動註冊成家長；帳號註冊/邀請流程若需要，另開 Story。
#    Unknown accounts are not auto-promoted to parents; registration/invitation is a separate story.
# 5. 一個登入帳號是否可對應多個家庭或多個角色，若未來需要再由獨立 Story 擴充。
#    Multi-family or multi-role account behavior is intentionally deferred.
