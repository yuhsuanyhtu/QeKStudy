# language: zh-TW
# QeKStudy BDD-003
# 中文：名稱維護與管理員資料管理
# English: Rename and administrator data management

功能: 名稱維護與管理員資料管理
  為了讓家庭資料可以被正確維護，同時避免一般家長誤刪資料
  作為家長或管理員
  我希望系統依角色限制修改名稱與刪除資料的權限

  背景:
    假設 使用者已被系統辨識為家長或管理員
    而且 BDD-001 的家庭資料隔離仍然有效

  場景: 家長修改自己家庭的顯示名稱
    假設 家長 A 管理家庭 A
    當 家長 A 修改家庭 A 的顯示名稱
    那麼 系統應保存新的家庭顯示名稱
    而且 familyId 不得改變

  場景: 家長修改自己家庭中孩子的顯示名稱
    假設 孩子 A 屬於家長 A 可管理的家庭 A
    當 家長 A 修改孩子 A 的顯示名稱
    那麼 系統應保存新的孩子顯示名稱
    而且 studentId 與 familyId 不得改變

  場景: 家長不能修改其他家庭的名稱
    假設 家長 A 與家長 B 管理不同家庭
    當 家長 A 嘗試修改家長 B 的家庭或孩子顯示名稱
    那麼 系統應拒絕操作
    而且 不得洩漏其他家庭的私人資料
    而且 原資料不得被改變

  場景: 一般家長不能刪除資料
    假設 家長 A 管理家庭 A
    當 家長 A 嘗試刪除家庭或孩子資料
    那麼 系統應拒絕刪除
    而且 原資料仍應存在

  場景: 管理員可協助修改任何家庭或孩子的顯示名稱
    假設 管理員已被授權
    而且 家庭 A 與孩子 A 已存在
    當 管理員修改家庭 A 或孩子 A 的顯示名稱
    那麼 系統應保存新的顯示名稱
    而且 familyId、studentId 與家庭歸屬不得改變

  場景: 管理員可刪除孩子資料
    假設 管理員已被授權
    而且 孩子 A 已存在
    當 管理員確認刪除孩子 A
    那麼 孩子 A 不應再出現在一般使用流程
    而且 一般家長不得再透過 studentId 存取孩子 A

  場景: 管理員可刪除家庭資料
    假設 管理員已被授權
    而且 家庭 A 與其孩子資料已存在
    當 管理員確認刪除家庭 A
    那麼 家庭 A 不應再出現在一般使用流程
    而且 該家庭底下的孩子不得成為仍可被一般使用者存取的孤兒資料

  場景: 未授權身分不能取得管理員能力
    假設 使用者不是管理員
    當 使用者直接提供 familyId 或 studentId 嘗試呼叫管理員修改或刪除操作
    那麼 系統應拒絕操作
    而且 資料不得被改變

# Acceptance notes / 驗收補充
# 1. 「改名」只改 display name；stable IDs 永遠不因改名而改變。
#    Renaming changes display names only; stable IDs do not change.
# 2. 本 Story 明確規定一般家長可以改自己家庭/孩子名稱，但沒有刪除權限。
#    Parents may rename records within their own family but may not delete records.
# 3. 管理員是跨家庭的受信任角色，可協助改名與刪除。
#    Administrator is a trusted cross-family role that may rename and delete.
# 4. 刪除採 hard delete、soft delete 或可復原機制，由 SDD 決定；
#    BDD 只要求刪除後一般流程不可再看見或存取，且不得留下可存取的孤兒資料。
#    Hard delete vs soft delete/recovery is an SDD decision. Behaviorally, deleted data
#    must disappear from normal flows and must not leave accessible orphan records.
# 5. 刪除屬破壞性操作，UI 必須有明確確認步驟。
#    Destructive deletion requires explicit UI confirmation.
# 6. 正式 Authentication / Admin identity mechanism 尚未定義；在完成前只可使用 Demo data。
#    Production authentication/admin identity is not defined yet; demo data only until then.
