# language: zh-TW
# QeKStudy BDD-005
# 中文：核心練習與錯題複習指引
# English: Core practice and wrong-answer review guidance
# Status: ACTIVE / DRAFT

功能: 核心練習與錯題複習指引
  為了讓學生不只是做題，而是在答錯後知道應該回哪裡學
  作為 Demo 學生
  我希望可以選擇科目與單元完成一組練習
  並在答錯時得到明確的複習方向

  背景:
    假設 系統目前運作在受控 Demo 模式
    而且 Demo 學生已被選定
    而且 系統至少有一個可練習的科目、單元與題組

  場景: 學生可以選擇科目與單元開始練習
    當 學生開啟練習頁面
    那麼 系統應顯示可用的科目
    當 學生選擇一個科目
    那麼 系統應顯示該科目可用的單元
    當 學生選擇一個單元並開始練習
    那麼 系統應載入該單元的練習題組

  場景: 學生可以提交答案並得到正確或錯誤回饋
    假設 學生正在進行一組練習
    當 學生對目前題目提交答案
    那麼 系統應判定答案正確或錯誤
    而且 應記錄該題的作答結果
    而且 不應因單題答錯而清除已完成的練習進度

  場景: 答錯時系統必須指出應該回哪裡複習
    假設 題目 A 對應到一個已設定的知識點
    當 學生答錯題目 A
    那麼 系統應顯示該題的複習指引
    而且 複習指引至少應包含科目、單元與知識點
    而且 應提供學生下一步要回去找什麼的方向
    而且 不應只顯示「答錯」而沒有學習方向

  場景: 答對時不強迫學生進入複習流程
    假設 學生答對目前題目
    當 系統顯示作答結果
    那麼 系統應清楚告知答對
    而且 學生可以繼續下一題

  場景: 完成題組後學生看到本次練習摘要
    假設 學生已提交題組中的所有題目
    當 練習結束
    那麼 系統應顯示本次完成題數
    而且 應顯示答對與答錯題數
    而且 應列出本次答錯題目的複習知識點
    而且 學生可以從摘要知道下一步優先複習什麼

  場景: 每一題都必須有可追溯的學習位置
    假設 題目將被加入可用練習題組
    當 系統檢查題目資料
    那麼 題目必須對應科目
    而且 必須對應單元
    而且 必須對應至少一個知識點
    如果 缺少必要的學習位置資訊
    那麼 該題不應進入可供學生作答的正式題組

  場景: 重新整理前已提交的本次作答不應被誤顯示為未作答
    假設 學生已提交至少一題
    當 畫面重新載入可恢復的本次練習狀態
    那麼 已成功保存的作答結果應保持一致
    而且 不應把已提交題目誤顯示為尚未作答

# Acceptance notes / 驗收補充
# 1. 本 Story 只驗證最小核心學習迴圈：
#    subject/unit → practice → answer → wrong-answer review target → summary.
# 2. 題目來源、題庫管理工具與大量內容匯入不屬於本 Story；首版可使用少量人工設定 Demo 題目。
# 3. 獎勵/零用金、streak、CAP/會考整合題、跨單元混題、間隔複習留給後續 Story。
# 4. 本 Story 不依賴正式 Authentication；仍遵守受控 Demo safety boundary。
# 5. 複習指引的目標是告訴學生「去哪裡找、要複習什麼」，不是只公布答案。
# 6. 題目必須具備可追溯 knowledge point metadata，這是之後累積錯題與跨年級複習的基礎。
# 7. 每個 iteration Done 仍必須有可操作 UI。
#
# English:
# This Story validates only the minimum learning loop:
# subject/unit → practice → answer → wrong-answer review target → summary.
# Rewards, CAP-style integration, cross-unit mixing, spaced review, and large-scale question-bank tooling are deferred.
