# language: zh-TW
# QeKStudy BDD-001
# 中文：家長建立家庭並綁定孩子
# English: Parent creates a family and links a child

功能: 家庭與孩子綁定
  為了讓每個家庭能獨立管理孩子的學習與零用金
  作為一位家長
  我希望建立自己的家庭並綁定孩子
  以便只有被授權的家長可以管理該孩子的家庭設定

  背景:
    假設 家長已登入 QeKStudy

  場景: 家長建立一個新家庭
    當 家長建立家庭並輸入家庭顯示名稱
    那麼 系統應建立一個新的家庭
    而且 該家長應成為此家庭的管理家長
    而且 其他家庭不得存取此家庭的私人資料

  場景: 家長在自己的家庭建立孩子
    假設 家長已建立自己的家庭
    當 家長新增一位孩子並輸入孩子的顯示名稱
    那麼 系統應建立該孩子的學生身分
    而且 該孩子應綁定至這個家庭
    而且 該家長應可管理該孩子的家庭設定

  場景: 家長不得管理其他家庭的孩子
    假設 另一個家庭中存在一位孩子
    當 家長嘗試修改該孩子的家庭設定
    那麼 系統應拒絕該操作
    而且 不得變更任何該孩子或其家庭的資料

# Acceptance notes / 驗收補充
# 1. 此需求只定義「家庭歸屬與管理權」，不包含登入技術、資料庫或 UI 實作。
#    This requirement defines family ownership and authorization only; it does not prescribe authentication technology, database, or UI.
# 2. 零用金規則、班級加入、老師權限將各自拆成後續獨立 BDD。
#    Allowance rules, class membership, and teacher permissions will be separate BDD items.
# 3. 孩子可否同時被兩位家長管理，尚未在本需求中定義。
#    Whether a child can be managed by multiple parents is intentionally not defined in this requirement.
