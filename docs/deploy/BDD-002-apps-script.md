# BDD-002 Apps Script Deployment / Apps Script 部署

日期 Date: 2026-09-18

> 這是目前 BDD-002 唯一需要人工完成的步驟。
>
> This is the only manual step currently required for BDD-002.

## 前置狀態 / Prerequisites

已完成：

- Google Sheet Demo DB 已建立
- Spreadsheet ID 已寫入 `apps-script/Code.gs`
- `families` / `students` / `schema_meta` 已建立
- `schema_version = 1`
- Regression 28/28 PASS

Demo DB:

`QeKStudy Database (Demo)`

Spreadsheet ID:

`16GjrllU2rRgUBXH7evGQCFqOTHQbhtJRFX6CjkvKBA8`

---

## 第一次部署 / First Deployment

### 1. 建立 Apps Script 專案

開啟：

`https://script.google.com/`

選：

**New project / 新專案**

專案名稱建議：

`QeKStudy Demo`

### 2. 貼入 server code

Repository 檔案：

`apps-script/Code.gs`

把 Apps Script 預設的 `Code.gs` 全部替換成此檔內容。

### 3. 建立 HTML file

在 Apps Script 左側 Files：

**+ → HTML**

名稱輸入：

`Index`

Repository 檔案：

`apps-script/Index.html`

把內容完整貼入。

### 4. 設定專案時區

Project Settings：

Timezone:

`(GMT+08:00) Taipei`

### 5. 部署 Web App

右上角：

**Deploy → New deployment**

Type:

**Web app**

設定：

- Execute as: **Me**
- Who has access: **Anyone**

然後：

**Deploy**

第一次會要求 Google 授權，完成授權。

### 6. 保存 Web App URL

部署完成後會取得：

`https://script.google.com/macros/s/.../exec`

請把這個 URL 貼回目前 ChatGPT 對話。

我會接著：

1. 驗證 deployed UI
2. 驗證 Family 建立後 refresh 仍存在
3. 驗證 Student refresh 後仍存在
4. 驗證 Parent A / Parent B 隔離
5. 檢查 Google Sheet 實際寫入
6. 跑最後 regression
7. 更新 Acceptance-002
8. BDD-002 Done

---

## 安全提醒 / Safety

這個 iteration 還沒有正式 Authentication。

目前 Parent A / Parent B 只是 Demo identity。

因此：

**請只輸入假的測試資料。不要輸入真實學生姓名、家庭資訊或零用金資料。**

**Use demo data only. Do not enter real student names, family information, or allowance data.**

正式 Authentication 完成後，才會開放真實資料使用。


---

## Current Deployment / 目前部署

Web App URL:

https://script.google.com/macros/s/AKfycbwaGdC88YUhlRjYmM1znhMqs4fpEYhnJ2cNkQhEa-EsKccjPzb7PshR2STbqZ6z5IUh2w/exec

Status:

- Deployment URL received
- Google Sheet schema verified
- Demo DB currently contains headers only; no family/student rows yet
- GitHub Actions regression: 28/28 PASS
- Manual UI acceptance pending

目前 deployment 已建立，但因 ChatGPT 的一般網頁讀取工具無法直接執行 Apps Script HTML Service 的互動式 UI，因此仍需要一次人工 UI 驗收。

The deployment exists, but one manual UI acceptance pass is still required because the standard ChatGPT web fetch cannot execute the interactive Apps Script HTML Service UI.
