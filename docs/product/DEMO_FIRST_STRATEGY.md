# Product Decision — Demo-first Learning Value Before Full Authentication
# 產品決策：先驗證學習價值，再做完整 Authentication

日期 Date: 2026-09-18

## Decision / 決策

QeKStudy 暫時不把 BDD-004 Authentication 當成下一個 Active Story。

BDD-004 保留為 `DEFERRED · TRIGGER-BASED`，目前產品先維持受控的 single-family / demo 模式，把開發優先順序轉回學生與家長可以直接感受到的學習價值。

QeKStudy will defer full authentication and continue as a controlled single-family/demo product while validating the core learning experience.

## Why / 原因

完整 Authentication 很重要，但在目前階段：

- 它增加安全性與工程完整性；
- 卻不直接證明學生是否願意使用 QeKStudy；
- 也不直接證明「答錯後知道去哪裡複習」是否真的有幫助。

目前更重要的是驗證：

1. 學生是否願意開始一組練習。
2. 題目難度與內容是否對目前程度有用。
3. 答錯後給出的複習方向是否能促成下一步學習。
4. 完成一次練習後，學生與家長是否覺得系統值得再用。

## Safety Boundary / 安全邊界

BDD-004 Deferred 期間：

- Demo identity 不是正式登入。
- Public URL 不視為 production multi-family security boundary。
- 不開放公開 Admin destructive UI。
- 不使用真實敏感學生/家庭資料。
- 不製作「半套登入」來營造錯誤安全感。

一旦進入真實 multi-family / real-data pilot，就必須重新撿回 BDD-004。

## Pickup Triggers / Authentication 撿回條件

任一成立就重新 review BDD-004：

1. 第二個真實家庭開始使用。
2. 班上其他家長要自行輸入真實資料。
3. 要保存真實姓名、學習紀錄、獎勵資料。
4. 要公開 Admin 修改或刪除 UI。
5. 系統從受控 Demo 變成外部使用者可自行加入的 pilot。

## Product Sequence / 產品順序

Current sequence:

```text
Controlled family demo
↓
Core learning loop
↓
Learning-value validation
↓
More practice / review / retention features
↓
Controlled pilot trigger
↓
BDD-004 Authentication
↓
Multi-family expansion
```

此決策不是降低 Authentication 的重要性，而是把它放到真正需要它的產品階段。

This does not reduce the importance of authentication; it moves it to the stage where its cost is justified by real product usage.
