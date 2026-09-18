# TDD-001 — Family Visibility & Child Binding

狀態 Status: RED  
對應 BDD: BDD-001  
對應 SDD: SDD-001  
日期 Date: 2026-09-18

## 測試策略 / Test Strategy

使用 Node.js 內建 `node:test` 與 `node:assert`。

Uses Node.js built-in `node:test` and `node:assert`.

不加入第三方測試框架或套件，避免在目前階段增加不必要依賴。

No third-party testing framework or dependency is introduced at this stage.

## Red Phase

目前測試刻意指向尚未存在的：

`src/family-domain.js`

因此執行：

`npm test`

必須失敗。這是 TDD 的 Red 狀態，不代表 regression failure。

The tests intentionally reference the not-yet-implemented `src/family-domain.js`, so `npm test` must currently fail. This is the expected TDD Red phase.

## Contract Under Test / 待實作介面

預期 module 匯出：

`createFamilyDomain()`

回傳物件至少提供：

- `createFamily({ actorParentId, displayName })`
- `listVisibleFamilies({ actorParentId })`
- `canManageFamily(parentId, familyId)`
- `addChildToFamily({ actorParentId, familyId, childDisplayName })`
- `readFamilyPrivateData({ actorParentId, familyId })`
- `updateChildFamilySettings({ actorParentId, studentId, changes })`

## 13 個測試 / 13 Tests

1. 建立家庭後，建立者具有管理權。
2. 新建立的家庭會出現在建立者的可見家庭清單。
3. 家長的家庭清單不包含其他家庭。
4. 家庭清單不洩漏其他家庭名稱、成員或資料。
5. 家長可以在自己的家庭建立孩子。
6. 建立的孩子只屬於指定家庭。
7. 家長不能在沒有管理權的家庭建立孩子。
8. 家長不能讀取其他家庭私人資料。
9. 家長不能修改另一家庭孩子設定。
10. 知道其他 familyId/studentId 也不能繞過授權。
11. 被拒絕的跨家庭修改不能留下任何資料變更。
12. 空白家庭名稱被拒絕。
13. 空白孩子名稱被拒絕。

## 下一步 / Next Step

只有在確認 Red 測試確實失敗後，才進入 Implementation / Green。

Implementation begins only after the Red state is confirmed.
