# language: zh-TW
# QeKStudy BDD-002
# 中文：家庭與孩子資料持久化
# English: Persistent family and child data

功能: 家庭與孩子資料持久化
  為了讓 QeKStudy 可以被不同家庭、不同裝置長期使用
  作為一位家長
  我希望我建立的家庭與孩子資料在離開網站後仍然存在
  以便重新整理、關閉瀏覽器或換裝置後仍能繼續使用

  背景:
    假設 家長已登入 QeKStudy
    而且 家長只能存取自己被授權的家庭群組

  場景: 建立家庭後重新整理仍看得到
    假設 家長建立了一個家庭「QeK 的家庭」
    當 家長重新整理網站
    那麼 系統仍應顯示「QeK 的家庭」
    而且 不應要求家長重新建立家庭

  場景: 建立孩子後重新整理仍看得到
    假設 家長的家庭中已建立孩子「QeK」
    當 家長重新整理網站
    那麼 系統仍應顯示孩子「QeK」
    而且 孩子仍應屬於原本的家庭

  場景: 同一位家長換裝置後仍看得到自己的家庭
    假設 家長已在裝置 A 建立家庭與孩子
    當 同一位家長在裝置 B 登入 QeKStudy
    那麼 系統應載入該家長被授權的家庭
    而且 應載入該家庭中的孩子
    而且 不應依賴裝置 A 的本機資料

  場景: 持久化後仍維持家庭隔離
    假設 家長 A 與家長 B 各自擁有不同家庭
    而且 兩個家庭資料都已被永久保存
    當 家長 A 重新登入或換裝置
    那麼 系統只能載入家長 A 被授權的家庭
    而且 不得載入家長 B 的家庭名稱、成員或私人資料

  場景: 儲存失敗時不得假裝成功
    當 家長建立家庭或孩子
    而且 永久儲存失敗
    那麼 系統應明確告知儲存失敗
    而且 不得讓家長誤以為資料已永久保存

# Acceptance notes / 驗收補充
# 1. 本需求定義的是「跨重新整理、跨裝置的持久資料行為」。
#    This requirement defines persistence across reloads and devices.
# 2. Google Sheet / Apps Script 是目前預定的實作方向，但屬於 SDD，不寫死在 BDD 行為中。
#    Google Sheets / Apps Script is the intended implementation direction, but belongs in SDD rather than behavioral requirements.
# 3. BDD-001 的家庭可見性與權限隔離仍然必須成立。
#    BDD-001 family visibility and authorization isolation must remain valid.
# 4. 正式 Authentication 如何辨識「同一位家長」仍是獨立 Story；BDD-002 只要求資料層支援跨裝置恢復。
#    Production authentication is a separate story; BDD-002 only requires the data layer to support cross-device restoration.
