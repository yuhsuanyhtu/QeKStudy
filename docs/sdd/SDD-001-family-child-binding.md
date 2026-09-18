# SDD-001 — 家庭可見性、家庭與孩子綁定 / Family Visibility & Child Binding

狀態 Status: Draft for TDD  
對應需求 Requirement: BDD-001  
日期 Date: 2026-09-18

## 1. 目的 / Purpose

本設計只處理 BDD-001：建立家庭、將建立者設為該家庭的管理家長、讓家長只能看到自己被授權的家庭群組、在自己的家庭內建立孩子，以及阻止任何跨家庭存取或修改。

This design covers only BDD-001: creating a family, making the creator its managing parent, limiting family visibility to authorized families, creating a child inside an authorized family, and preventing all cross-family access or modification.

---

## 2. 範圍 / Scope

本 Story 需要支援四個行為：

1. 已登入的家長建立家庭。
2. 家長查看家庭群組時，只能取得自己被授權的家庭。
3. 管理家長可在自己的家庭內建立孩子。
4. 家長不能讀取或操作其他家庭及其孩子的家庭資料。

This story supports exactly four behaviors:

1. An authenticated parent creates a family.
2. A parent can list only families they are authorized to access.
3. A managing parent can create a child inside their own family.
4. A parent cannot read or operate on another family's private data.

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

### Family / 家庭

家庭是 QeKStudy 的私人資料與授權邊界。

A Family is the privacy and authorization boundary for household-owned QeKStudy data.

必要資訊：

- `familyId`
- `displayName`
- `createdByParentId`
- `createdAt`

### FamilyParentMembership / 家庭家長關係

表示某位家長被授權存取哪個家庭，以及在該家庭具備的角色。

Represents which family a parent is authorized to access and the parent's role within that family.

BDD-001 只需要：

- 家庭建立者
- role = `MANAGING_PARENT`

此 relation 同時決定：

- 家庭是否對此家長可見
- 此家長是否可執行管理操作

For BDD-001, the creator receives `MANAGING_PARENT`, which determines both visibility and management authority.

### Student / 學生

必要資訊：

- `studentId`
- `familyId`
- `displayName`
- `createdAt`

Invariant：

> 每一個由本 Story 建立的 Student 必須且只能屬於一個 Family。

---

## 5. Queries & Commands / 查詢與操作

### 5.1 CreateFamily

輸入：

- `actorParentId`
- `displayName`

前置條件：

- `actorParentId` 已通過 Authentication
- `displayName` trim 後不可為空

行為：

1. 建立 `Family`
2. `createdByParentId = actorParentId`
3. 建立 `FamilyParentMembership(actorParentId, familyId, MANAGING_PARENT)`

輸出：

- `familyId`

結果：

新家庭立即成為此家長的「可見家庭」。

The new family immediately becomes visible to the creating parent.

### 5.2 ListVisibleFamilies

輸入：

- `actorParentId`

行為：

1. 取得此家長的家庭 membership
2. 只回傳 membership 所指向的 Family
3. 不回傳任何未授權 Family 的名稱、成員、識別資訊或私人資料

輸出：

- `VisibleFamily[]`

核心規則：

> Family visibility 必須在資料查詢層就被過濾，而不是先取得所有 Family 再由 UI 隱藏。

Core rule:

> Family visibility must be filtered at the authorization/query boundary, not by fetching all families and hiding them in the UI.

### 5.3 AddChildToFamily

輸入：

- `actorParentId`
- `familyId`
- `childDisplayName`

前置條件：

- 指定 Family 對 actor 可見且 actor 具 `MANAGING_PARENT` 權限
- `childDisplayName` trim 後不可為空

行為：

1. 建立 `Student`
2. `Student.familyId = familyId`

輸出：

- `studentId`

### 5.4 ReadFamilyPrivateData

代表所有家庭私人資料讀取行為的共同授權規則。

Represents the common authorization rule for all family-private reads.

輸入：

- `actorParentId`
- `familyId`

規則：

- 只有具有該 Family membership 的家長可讀取
- 未授權時不得回傳家庭名稱、成員、孩子或其他私人資料

### 5.5 UpdateChildFamilySettings

此 command 只定義授權邊界，不定義具體設定欄位。

輸入：

- `actorParentId`
- `studentId`
- `changes`

授權：

1. 找到 Student 所屬 `familyId`
2. 驗證該 Family 是否屬於 actor 可見且可管理範圍
3. 若否，拒絕整個操作
4. 拒絕時不可寫入任何 Student 或 Family 資料

---

## 6. Authorization & Visibility Rules / 授權與可見性規則

### Rule A — 可見家庭

> 家長只能看到自己具有 Family membership 的家庭。

> A parent can see only families for which they have a Family membership.

### Rule B — 管理家庭

> 家長只有具備該 Family 的 `MANAGING_PARENT` 權限時，才能執行家庭管理操作。

> A parent may perform family-management operations only when they hold `MANAGING_PARENT` authority for that Family.

### Rule C — 孩子權限沿用家庭邊界

> 家長能讀取或管理 Student，必須先通過 Student 所屬 Family 的授權。

> Access to a Student inherits authorization from the Student's Family.

概念函式：

```text
visibleFamilies(parentId)
  return families joined through FamilyParentMembership(parentId)

canManageFamily(parentId, familyId)
  return membership(parentId, familyId).role == MANAGING_PARENT

canManageStudent(parentId, studentId)
  student = findStudent(studentId)
  return canManageFamily(parentId, student.familyId)
```

### Rule D — 不可利用 ID 繞過

即使家長知道或猜到其他 `familyId` / `studentId`，仍必須套用相同授權檢查。

Knowing or guessing another `familyId` or `studentId` must never bypass authorization.

---

## 7. Failure Rules / 失敗規則

### EMPTY_FAMILY_NAME

家庭名稱為空白時拒絕建立。

### EMPTY_CHILD_NAME

孩子名稱為空白時拒絕建立。

### RESOURCE_NOT_AVAILABLE

當 Family / Student 不存在，或存在但 actor 無權存取時，對外不得揭露其私人資料。

When a Family/Student does not exist or exists but the actor is unauthorized, no private data may be revealed.

實作可在內部區分 not-found 與 access-denied，但對外行為不得讓未授權家長取得其他家庭資料。

The implementation may distinguish not-found and access-denied internally, but external behavior must not expose another family's private information.

重要 invariant：

> Authorization 失敗時必須 atomic：不得留下任何部分資料修改。

---

## 8. BDD → SDD Traceability / 需求追溯

### Scenario 1：家長建立新家庭

- `CreateFamily`
- `FamilyParentMembership`
- 建立者自動成為 `MANAGING_PARENT`
- 新家庭進入 `ListVisibleFamilies`

### Scenario 2：家長只看得到自己的家庭群組

- `ListVisibleFamilies`
- Rule A
- 查詢層權限過濾
- 未授權家庭 metadata 不回傳

### Scenario 3：家長在自己的家庭建立孩子

- `AddChildToFamily`
- `Student.familyId`
- Rule B

### Scenario 4：家長不得操作其他家庭

- `ReadFamilyPrivateData`
- `UpdateChildFamilySettings`
- Rule C / Rule D
- `RESOURCE_NOT_AVAILABLE`
- atomic no-mutation rule

---

## 9. TDD Boundary / 下一階段測試邊界

TDD-001 至少需要覆蓋：

1. 建立家庭後，建立者具有管理權。
2. 新建立的家庭會出現在建立者的可見家庭清單。
3. 家長的家庭清單不包含其他家庭。
4. 家庭清單不洩漏其他家庭的名稱、成員或資料。
5. 家長可以在自己的家庭建立孩子。
6. 建立的孩子只屬於指定家庭。
7. 家長不能在沒有管理權的家庭建立孩子。
8. 家長不能讀取其他家庭的私人資料。
9. 家長不能修改另一家庭孩子的設定。
10. 即使直接提供其他家庭或學生 ID，仍不能繞過授權。
11. 被拒絕的跨家庭修改不能留下任何資料變更。
12. 空白家庭名稱被拒絕。
13. 空白孩子名稱被拒絕。

---

## 10. Design Decision / 設計決策

本 SDD 將「家庭」定義為資料、可見性與管理權的主要邊界，而不是「班級」。

This SDD defines the Family, not the Class, as the primary boundary for privacy, visibility, and management authority.

因此未來即使 QeK 與同學加入同一班級：

- 家長登入後只看到自己的家庭群組
- 班級可以共享學習內容
- 家長不能因此看到其他學生的家庭群組
- 家長不能對其他家庭做任何家庭層級操作
- 零用金與其他家庭私人設定仍保持隔離

Therefore, future class membership may share learning content, but it will not grant visibility into or control over another family's private group or settings.
