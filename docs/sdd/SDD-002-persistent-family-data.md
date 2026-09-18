# SDD-002 — 家庭與孩子資料持久化 / Persistent Family & Child Data

狀態 Status: Draft for TDD  
對應需求 Requirement: BDD-002  
日期 Date: 2026-09-18

## 1. 目的 / Purpose

本設計讓 BDD-001 已建立的 Family / Student 資料不再只存在瀏覽器記憶體，而能跨重新整理、關閉瀏覽器與不同裝置取回。

This design moves BDD-001 Family / Student data from browser-only memory into durable shared storage so it survives reloads, browser restarts, and device changes.

本 iteration 選擇：

- Google Sheet：持久資料儲存
- Google Apps Script：server-side application / persistence layer
- Apps Script HTML Service：BDD-002 的可操作驗收 UI
- GitHub：原始碼與規格的 source of truth

This iteration uses:

- Google Sheets for durable storage
- Google Apps Script as the server-side application/persistence layer
- Apps Script HTML Service for the BDD-002 acceptance UI
- GitHub as the source of truth for code and specifications

---

## 2. 為什麼不讓 GitHub Pages 直接讀寫 Google Sheet / Why the browser does not access Sheets directly

前端不得直接取得 Google Sheet 編輯權限，也不直接使用 Google Sheets API key/token。

The frontend must not receive direct edit access to the spreadsheet or a Sheets API credential.

資料路徑：

```text
Browser UI
   ↓
Apps Script server function
   ↓
Authorization boundary
   ↓
Persistence service
   ↓
Google Sheet
```

BDD-002 的 UI 預計由 Apps Script HTML Service 提供，並用 `google.script.run` 呼叫 server function。這可以避免在 GitHub Pages 與 Apps Script 之間另外建立一層跨來源 API transport，同時讓 Sheet 權限留在 server side。

The BDD-002 UI is planned to run through Apps Script HTML Service and call server functions with `google.script.run`, keeping spreadsheet permissions on the server side.

GitHub Pages 可以繼續作為固定入口 / launcher；正式實作時可連到目前 Apps Script deployment URL。

GitHub Pages may remain the stable launcher while the persisted application runs at the current Apps Script deployment.

---

## 3. 重要安全邊界 / Important Security Boundary

BDD-002 **不定義正式 Authentication**。

BDD-002 does **not** define production authentication.

因此：

> 在 Authentication Story 完成以前，只允許使用 development/demo principals 測試持久化，不得把真實班級家庭、孩子或零用金資料放進這個公開測試流程。

Until the authentication story is complete, only development/demo principals may be used. Real class-family, child, or allowance data must not be stored through the public demo flow.

原因：

如果 browser 可以自行宣告 `parentId=parent-a`，那不是 Authentication；任何人都能冒用該 ID。

If the browser can simply declare `parentId=parent-a`, that is not authentication; anyone could impersonate that principal.

因此 Apps Script persistence service 的介面會接收 **trusted principal**，但「如何得到 trusted principal」保留給後續 Authentication Story。

The persistence service accepts a **trusted principal**, while the mechanism that establishes that principal belongs to a later authentication story.

---

## 4. Google Sheet Schema / Google Sheet 資料表

BDD-002 先使用一個 Spreadsheet，至少三個 worksheet。

One spreadsheet will contain at least three worksheets.

### 4.1 `families`

| Column | 說明 / Meaning |
|---|---|
| family_id | 不變的唯一 ID / immutable unique ID |
| display_name | 家庭顯示名稱 / family display name |
| owner_parent_id | 本 Story 的管理家長 / managing parent for this story |
| created_at | 建立時間 / created timestamp |
| updated_at | 更新時間 / updated timestamp |
| status | `active` / future soft-delete support |

在 BDD-002 中，`owner_parent_id` 暫時承載 BDD-001 的單一 `MANAGING_PARENT` 關係。

For BDD-002, `owner_parent_id` persists the current single `MANAGING_PARENT` relationship.

當未來 Story 加入第二位家長時，再新增正式 `family_memberships` worksheet，而不在本 Story 預先複雜化。

A future multi-parent story can introduce a normalized `family_memberships` worksheet.

### 4.2 `students`

| Column | 說明 / Meaning |
|---|---|
| student_id | 不變的唯一 ID |
| family_id | 所屬家庭 |
| display_name | 顯示名稱 |
| created_at | 建立時間 |
| updated_at | 更新時間 |
| status | `active` |

### 4.3 `schema_meta`

| Column | 說明 / Meaning |
|---|---|
| key | metadata key |
| value | metadata value |

首版至少保存：

`schema_version = 1`

This sheet starts with `schema_version = 1`.

---

## 5. ID 規則 / ID Rules

Family / Student ID 必須由 server side 產生，不能由 browser 自行決定。

Family / Student IDs must be generated server-side.

預計使用 Apps Script `Utilities.getUuid()`，並加可讀 prefix：

- `fam_<uuid>`
- `stu_<uuid>`

IDs are immutable and are never derived from display names.

顯示名稱可以重複；ID 不可以。

Display names may duplicate; IDs may not.

---

## 6. Persistence Interface / 持久層介面

Domain logic 不直接操作 Spreadsheet。

The domain layer does not directly manipulate spreadsheet cells.

新增 persistence abstraction：

```text
FamilyRepository
  createFamily(trustedPrincipal, displayName)
  listFamilies(trustedPrincipal)
  readFamily(trustedPrincipal, familyId)
  addStudent(trustedPrincipal, familyId, childDisplayName)
```

Apps Script 提供 `GoogleSheetFamilyRepository`。

Tests may use an in-memory fake repository.

這樣 BDD-001 的 domain rule 可以繼續獨立測試，Google Sheet 只是 adapter。

---

## 7. Server Operations / Server-side Operations

### 7.1 createFamily

輸入：

- trusted principal
- displayName

流程：

1. 驗證 principal 存在。
2. trim / validate displayName。
3. server 產生 familyId。
4. 取得 Apps Script script lock。
5. append 一筆 `families` row。
6. flush Sheet write。
7. release lock。
8. 寫入成功後才回傳 `ok: true`。

如果任何寫入失敗：

- 回傳 `PERSISTENCE_FAILED`
- UI 不得把家庭顯示成已永久儲存

### 7.2 listFamilies

輸入：

- trusted principal

流程：

1. 一次讀取 `families` 所需 range。
2. 在 server side 只留下 `owner_parent_id == principal.parentId` 的 active rows。
3. 不回傳其他家庭 metadata。

### 7.3 addStudent

輸入：

- trusted principal
- familyId
- childDisplayName

流程：

1. server side 查 family。
2. 驗證 `family.owner_parent_id == principal.parentId`。
3. 驗證 childDisplayName。
4. server 產生 studentId。
5. 取得 script lock。
6. append `students` row。
7. flush。
8. 成功後才回傳 `ok: true`。

### 7.4 readFamily

輸入：

- trusted principal
- familyId

流程：

1. server side 先查 family owner。
2. 不符合 principal 時回 `RESOURCE_NOT_AVAILABLE`。
3. 符合後才讀 / 回傳該 family 的 students。

---

## 8. Concurrency / 並行寫入

Google Sheet 是共享資源，多位家長可能同時建立家庭或孩子。

Google Sheets is shared storage, so multiple users may write concurrently.

所有 create/update operation 使用 Apps Script `LockService.getScriptLock()` 包住產生 ID 後的寫入 critical section，避免同時間操作互相踩資料。

All writes use an Apps Script script lock around the shared-resource write section.

Lock 無法取得時：

- 不 retry 到無限
- 回 `PERSISTENCE_BUSY`
- UI 顯示「目前多人同時操作，請再試一次」

---

## 9. Read/Write Strategy / 讀寫策略

初期規模是班級層級，因此採取簡單且可驗證的策略：

- 不一格一格讀
- 一次 `getValues()` 取得需要的範圍
- 在 Apps Script 記憶體中 filter
- 寫入採單筆 row append / batched range write
- 不在 Sheet 使用大量 QUERY / IMPORTRANGE / 複雜公式

Google 官方建議 Apps Script 盡量減少對外部服務的呼叫，並批次讀寫；本設計遵循這個方向。

---

## 10. UI State Rule / UI 狀態規則

BDD-002 不做 optimistic persistence。

BDD-002 does not use optimistic persistence.

也就是：

```text
家長按「建立家庭」
        ↓
UI 顯示「儲存中」
        ↓
server + Sheet 成功
        ↓
UI 才顯示「已建立」
```

如果 server 回失敗：

```text
儲存失敗
↓
畫面保留輸入
↓
顯示可重試訊息
↓
不得讓使用者誤以為已保存
```

這直接對應 BDD-002「儲存失敗不得假裝成功」。

---

## 11. Reload / Cross-device Bootstrap

每次 UI 啟動：

```text
取得 trusted principal
        ↓
server.listFamilies(principal)
        ↓
回傳 family + child durable data
        ↓
render UI
```

Browser localStorage 不是 source of truth。

Browser localStorage is not the source of truth.

可以未來加入 cache，但 cache 不得凌駕 Sheet 的 durable state。

A future cache may improve speed, but durable server state remains authoritative.

---

## 12. Failure Contract / 失敗契約

Server 對 UI 回傳統一結果：

成功：

```json
{
  "ok": true,
  "data": {}
}
```

失敗：

```json
{
  "ok": false,
  "error": {
    "code": "PERSISTENCE_FAILED",
    "message": "..."
  }
}
```

首版 error codes：

- `EMPTY_FAMILY_NAME`
- `EMPTY_CHILD_NAME`
- `RESOURCE_NOT_AVAILABLE`
- `PERSISTENCE_FAILED`
- `PERSISTENCE_BUSY`
- `SCHEMA_MISMATCH`

UI 顯示人類可讀訊息，不直接顯示 internal exception stack。

---

## 13. Zero-cost / Capacity Decision

本 Story 使用 Apps Script built-in Spreadsheet service，而不是 browser 直接呼叫 Google Sheets API。

This story uses Apps Script's built-in Spreadsheet service rather than direct browser access to the Google Sheets API.

Apps Script 官方目前列出的限制包含單次執行 6 分鐘、每位使用者同時 30 executions、每個 script 同時 1,000 executions；超過限制會發生 exception。這符合我們的原則：超額時失敗，不自動產生主機帳單。

This is suitable for the initial class-sized deployment, provided we batch reads/writes and monitor execution health.

---

## 14. BDD → SDD Traceability

### Scenario 1 — 家庭 reload 後仍存在

- `families` worksheet
- `createFamily`
- boot `listFamilies`

### Scenario 2 — 孩子 reload 後仍存在

- `students` worksheet
- `addStudent`
- `readFamily`

### Scenario 3 — 換裝置仍能取回

- Sheet is source of truth
- browser local state is non-authoritative
- trusted principal resolves the same parent across devices

### Scenario 4 — 持久化後仍家庭隔離

- server-side filtering by trusted principal
- server-side family authorization
- no direct Sheet access from browser

### Scenario 5 — 儲存失敗不得假裝成功

- no optimistic persistence
- structured failure result
- UI only commits visible success after server ACK

---

## 15. TDD-002 Boundary / 下一階段測試邊界

TDD-002 至少需覆蓋：

1. family 寫入 repository 後，重新建立 application session 仍可讀到。
2. student 寫入後，重新建立 application session 仍屬於原 family。
3. 相同 trusted principal 在另一 session 能讀到相同資料。
4. Parent A 的 repository query 不回 Parent B family。
5. 使用 Parent A 直接要求 Parent B familyId 時被拒絕。
6. persistence write failure 時 createFamily 不回成功。
7. persistence write failure 時 addStudent 不回成功。
8. UI 顯示「儲存中」直到 server ACK。
9. UI server failure 時顯示失敗，不加入成功清單。
10. schema version 不相容時拒絕操作。
11. concurrent write lock 失敗時回 `PERSISTENCE_BUSY`。
12. BDD-001 全套 regression 必須繼續通過。

---

## 16. UI Acceptance Plan

依新的 Definition of Done，BDD-002 必須有 UI。

驗收 UI 至少要能：

1. 以 Demo Parent A 建立家庭與孩子。
2. 重新整理頁面，資料仍存在。
3. 重新開啟應用，資料仍存在。
4. Demo Parent B 看不到 Parent A 資料。
5. 模擬 storage failure 時看到清楚失敗訊息。

在正式 Authentication 完成以前，UI 必須清楚標示：

**DEMO DATA — 不要輸入真實學生資料**

**DEMO DATA — Do not enter real student data.**
