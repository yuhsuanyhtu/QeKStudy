# SDD-001 — 家庭與孩子綁定 / Family–Child Binding

狀態 Status: Draft for TDD  
對應需求 Requirement: BDD-001  
日期 Date: 2026-09-18

## 1. 目的 / Purpose

本設計只處理 BDD-001：建立家庭、將建立者設為該家庭的管理家長、在家庭內建立孩子，以及阻止跨家庭管理。

This design covers only BDD-001: creating a family, making the creator its managing parent, creating a child inside that family, and preventing cross-family management.

---

## 2. 範圍 / Scope

本 Story 需要支援三個行為：

1. 已登入的家長建立家庭。
2. 該家庭的管理家長在家庭內建立孩子。
3. 家長不能修改其他家庭孩子的家庭設定。

This story supports exactly three behaviors:

1. An authenticated parent creates a family.
2. The managing parent creates a child inside that family.
3. A parent cannot modify family settings for a child in another family.

---

## 3. 明確不在本 Story 的內容 / Explicit Non-goals

SDD-001 不決定：

- 登入方式、Email、密碼、OAuth 或其他 Authentication 技術
- 前端畫面或 UX
- 實際資料庫產品或資料表語法
- 班級、老師與同學關係
- 零用金規則
- 第二位家長如何加入家庭
- 一個孩子是否可由多位家長管理
- 家長移除、監護權或家庭轉移
- 孩子自己的登入方式

SDD-001 does not define:

- authentication technology,
- UI/UX,
- database product or physical schema,
- class/teacher relationships,
- allowance rules,
- how a second parent joins,
- whether a child can be managed by multiple parents,
- guardianship/family transfer,
- student login.

---

## 4. Domain Model / 領域模型

### ParentIdentity / 家長身分

代表已由系統外層確認身分的家長。

Represents a parent whose identity has already been authenticated by the surrounding system.

必要資訊：

- `parentId`：系統內唯一識別碼

Required information:

- `parentId`: unique internal identifier

> SDD-001 假設「家長已登入」，但不定義如何登入。
>
> SDD-001 assumes the parent is authenticated but does not define how.

### Family / 家庭

家庭是 QeKStudy 的私人資料邊界。

A Family is the privacy boundary for household-owned QeKStudy data.

必要資訊：

- `familyId`：唯一識別碼
- `displayName`：家庭顯示名稱
- `createdByParentId`：建立此家庭的家長
- `createdAt`：建立時間

Required information:

- `familyId`
- `displayName`
- `createdByParentId`
- `createdAt`

### FamilyParentMembership / 家庭家長關係

表示某位家長是否有權管理某個家庭。

Represents whether a parent is authorized to manage a family.

BDD-001 只需要產生一筆關係：

- 家庭建立者
- role = `MANAGING_PARENT`

BDD-001 creates only one membership:

- the family creator
- role = `MANAGING_PARENT`

此 relation 保留未來擴充可能，但本 Story 不提供新增第二位家長的行為。

The relation allows future extension, but this story exposes no behavior for adding a second parent.

### Student / 學生

代表 QeKStudy 中的學生身分。

Represents a student identity in QeKStudy.

必要資訊：

- `studentId`：唯一識別碼
- `familyId`：所屬家庭
- `displayName`：學生顯示名稱
- `createdAt`：建立時間

Required information:

- `studentId`
- `familyId`
- `displayName`
- `createdAt`

BDD-001 的 invariant：

> 每一個由本 Story 建立的 Student 必須且只能屬於一個 Family。

Invariant for BDD-001:

> Every Student created by this story belongs to exactly one Family.

這不代表永久禁止未來的監護或家庭轉移功能；只是 SDD-001 不提供該行為。

This does not permanently forbid future guardianship or transfer features; they are simply outside SDD-001.

---

## 5. Commands / 系統操作

### 5.1 CreateFamily

輸入 Input:

- `actorParentId`
- `displayName`

前置條件 Preconditions:

- `actorParentId` 已通過 Authentication
- `displayName` 經 trim 後不可為空

行為 Behavior:

1. 建立新的 `Family`
2. `createdByParentId = actorParentId`
3. 建立 `FamilyParentMembership(actorParentId, familyId, MANAGING_PARENT)`

輸出 Output:

- `familyId`

### 5.2 AddChildToFamily

輸入 Input:

- `actorParentId`
- `familyId`
- `childDisplayName`

前置條件 Preconditions:

- 家庭存在
- `actorParentId` 是此家庭的 `MANAGING_PARENT`
- `childDisplayName` 經 trim 後不可為空

行為 Behavior:

1. 建立 `Student`
2. `Student.familyId = familyId`

輸出 Output:

- `studentId`

### 5.3 UpdateChildFamilySettings

此 command 在 BDD-001 中只需要定義授權邊界，不需要定義具體有哪些設定欄位。

For BDD-001, this command exists only to define the authorization boundary; specific settings are not defined yet.

輸入 Input:

- `actorParentId`
- `studentId`
- `changes`

授權 Authorization:

1. 找到 Student
2. 取得 `student.familyId`
3. 驗證 `actorParentId` 是否為該 Family 的 `MANAGING_PARENT`
4. 若不是，拒絕整個操作
5. 拒絕時不可寫入任何 Student 或 Family 資料

---

## 6. Authorization Rule / 授權規則

唯一的核心規則：

> 家長能管理 Student，當且僅當該家長具有 Student 所屬 Family 的管理權。

Core rule:

> A parent may manage a Student if and only if that parent has managing authority for the Student's Family.

概念函式：

```text
canManageStudent(parentId, studentId)
  student = findStudent(studentId)
  return hasManagingMembership(parentId, student.familyId)
```

所有家庭私有資料的存取都應先通過 Family boundary 驗證。

All access to family-private data must pass the Family boundary authorization check first.

---

## 7. Failure Rules / 失敗規則

### EMPTY_FAMILY_NAME

家庭名稱為空白時拒絕建立。

Reject family creation when the display name is blank.

### EMPTY_CHILD_NAME

孩子名稱為空白時拒絕建立。

Reject child creation when the display name is blank.

### FAMILY_NOT_FOUND

指定家庭不存在。

The requested family does not exist.

### FAMILY_ACCESS_DENIED

家長沒有該家庭的管理權。

The parent does not have managing authority for that family.

### STUDENT_NOT_FOUND

指定學生不存在。

The requested student does not exist.

重要 invariant：

> Authorization 失敗時必須是 atomic failure：不得留下部分修改。

Important invariant:

> Authorization failure must be atomic: no partial mutation may remain.

---

## 8. BDD → SDD Traceability / 需求追溯

### BDD Scenario 1：家長建立新家庭

由以下設計滿足：

- `CreateFamily`
- `Family`
- `FamilyParentMembership`
- 建立者自動成為 `MANAGING_PARENT`

### BDD Scenario 2：家長在自己的家庭建立孩子

由以下設計滿足：

- `AddChildToFamily`
- `Student.familyId`
- `MANAGING_PARENT` authorization

### BDD Scenario 3：不得管理其他家庭的孩子

由以下設計滿足：

- `canManageStudent`
- `FAMILY_ACCESS_DENIED`
- atomic no-mutation rule

---

## 9. TDD Boundary / 下一階段測試邊界

TDD-001 至少需要覆蓋：

1. 建立家庭後，建立者具有管理權。
2. 家長可以在自己的家庭建立孩子。
3. 建立的孩子只屬於指定家庭。
4. 家長不能在沒有管理權的家庭建立孩子。
5. 家長不能修改另一家庭孩子的設定。
6. 被拒絕的跨家庭修改不能留下任何資料變更。
7. 空白家庭名稱被拒絕。
8. 空白孩子名稱被拒絕。

TDD-001 must cover at least the same eight behaviors above.

---

## 10. Design Decision / 設計決策

本 SDD 將「家庭」定義為資料與權限的主要邊界，而不是「班級」。

This SDD defines the Family, not the Class, as the primary privacy and authorization boundary.

因此未來即使 QeK 與同學加入同一班級：

- 可以共享班級學習內容
- 不代表彼此家長可以讀取或修改家庭私人資料
- 零用金資料仍可保持家庭隔離

Therefore, even when QeK and classmates later share one class:

- learning content may be shared,
- family-private data remains isolated,
- allowance data can remain household-specific.
