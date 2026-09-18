# BDD-003 Apps Script Update / Apps Script 更新部署

日期 Date: 2026-09-18

目前 Google Sheet 已升級為 schema v2，因此現有 Apps Script deployment 需要更新到 repo 最新版本。

Current Sheet schema is v2, so the existing Apps Script deployment must be updated.

## 不需要建立新專案 / No New Project Needed

使用 BDD-002 時建立的同一個 Apps Script project。

Use the same Apps Script project created for BDD-002.

## 1. 更新 Code.gs

Repository:

`apps-script/Code.gs`

把 Apps Script project 內的 `Code.gs` 全部替換成 repo 最新內容。

重要變更：

- `QEK_SCHEMA_VERSION = 2`
- parent family rename
- parent student rename
- audit_log
- deletion metadata support
- private administrator soft-delete helpers

## 2. 更新 Index.html

Repository:

`apps-script/Index.html`

把 Apps Script project 裡的 `Index.html` 全部替換成 repo 最新內容。

UI 新增：

- 修改家庭名稱
- 修改孩子名稱

Public UI **沒有** administrator delete controls。

## 3. Save / 儲存

Apps Script editor:

**Save project**

## 4. Update Deployment / 更新既有部署

Apps Script:

**Deploy → Manage deployments**

找到目前 Web App deployment。

點 Edit / 鉛筆圖示。

Version:

**New version**

然後按：

**Deploy**

請保留原本設定：

- Execute as: Me
- Who has access: Anyone

通常更新同一 deployment 後，原本 `/exec` URL 會維持不變。

## 5. Manual Acceptance / 人工驗收

開啟原本的 Web App URL。

只使用 Demo data。

### Parent A

1. 確認能正常載入，不再出現 `SCHEMA_MISMATCH`。
2. 點「修改家庭名稱」。
3. 修改一個 Parent A 的家庭名稱。
4. Reload。
5. 確認新名稱仍存在。
6. 修改一個 Parent A 孩子的名稱。
7. Reload。
8. 確認新名稱仍存在。

### Parent B

1. 切換 Parent B。
2. 確認看不到 Parent A 的家庭。
3. 確認只能修改 Parent B 自己的資料。

### Admin safety

畫面上不應出現管理員刪除按鈕。

## 6. Reply / 回覆

完成後回覆：

`更新完成，改名正常`

我會接著檢查 Google Sheet：

- stable IDs 是否保持不變
- display names 是否已更新
- `audit_log` 是否出現 rename events
- owner/family relationships 是否保持
- schema_version 是否仍為 2
- final GitHub Actions regression

然後完成 BDD-003 Acceptance。
