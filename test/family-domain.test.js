import test from 'node:test';
import assert from 'node:assert/strict';

import { createFamilyDomain } from '../src/family-domain.js';

const PARENT_A = 'parent-a';
const PARENT_B = 'parent-b';

function expectDomainError(code, fn) {
  assert.throws(fn, (error) => {
    assert.equal(error?.code, code);
    return true;
  });
}

test('TDD-001-01 建立家庭後，建立者具有管理權', () => {
  const domain = createFamilyDomain();

  const { familyId } = domain.createFamily({
    actorParentId: PARENT_A,
    displayName: 'QeK Family',
  });

  assert.equal(domain.canManageFamily(PARENT_A, familyId), true);
});

test('TDD-001-02 新建立的家庭會出現在建立者的可見家庭清單', () => {
  const domain = createFamilyDomain();

  const { familyId } = domain.createFamily({
    actorParentId: PARENT_A,
    displayName: 'QeK Family',
  });

  const visible = domain.listVisibleFamilies({ actorParentId: PARENT_A });
  assert.deepEqual(visible.map((family) => family.familyId), [familyId]);
});

test('TDD-001-03 家長的家庭清單不包含其他家庭', () => {
  const domain = createFamilyDomain();

  const own = domain.createFamily({
    actorParentId: PARENT_A,
    displayName: 'Family A',
  });
  domain.createFamily({
    actorParentId: PARENT_B,
    displayName: 'Family B',
  });

  const visible = domain.listVisibleFamilies({ actorParentId: PARENT_A });

  assert.deepEqual(visible.map((family) => family.familyId), [own.familyId]);
});

test('TDD-001-04 家庭清單不洩漏其他家庭的名稱、成員或資料', () => {
  const domain = createFamilyDomain();

  domain.createFamily({
    actorParentId: PARENT_A,
    displayName: 'Family A',
  });
  const other = domain.createFamily({
    actorParentId: PARENT_B,
    displayName: 'Secret Family B',
  });
  domain.addChildToFamily({
    actorParentId: PARENT_B,
    familyId: other.familyId,
    childDisplayName: 'Secret Child',
  });

  const serialized = JSON.stringify(
    domain.listVisibleFamilies({ actorParentId: PARENT_A }),
  );

  assert.equal(serialized.includes('Secret Family B'), false);
  assert.equal(serialized.includes('Secret Child'), false);
});

test('TDD-001-05 家長可以在自己的家庭建立孩子', () => {
  const domain = createFamilyDomain();
  const { familyId } = domain.createFamily({
    actorParentId: PARENT_A,
    displayName: 'Family A',
  });

  const { studentId } = domain.addChildToFamily({
    actorParentId: PARENT_A,
    familyId,
    childDisplayName: 'QeK',
  });

  const family = domain.readFamilyPrivateData({
    actorParentId: PARENT_A,
    familyId,
  });

  assert.equal(
    family.students.some((student) => student.studentId === studentId),
    true,
  );
});

test('TDD-001-06 建立的孩子只屬於指定家庭', () => {
  const domain = createFamilyDomain();
  const familyA = domain.createFamily({
    actorParentId: PARENT_A,
    displayName: 'Family A',
  });
  const familyB = domain.createFamily({
    actorParentId: PARENT_A,
    displayName: 'Family B',
  });

  const { studentId } = domain.addChildToFamily({
    actorParentId: PARENT_A,
    familyId: familyA.familyId,
    childDisplayName: 'QeK',
  });

  const a = domain.readFamilyPrivateData({
    actorParentId: PARENT_A,
    familyId: familyA.familyId,
  });
  const b = domain.readFamilyPrivateData({
    actorParentId: PARENT_A,
    familyId: familyB.familyId,
  });

  assert.equal(a.students.some((s) => s.studentId === studentId), true);
  assert.equal(b.students.some((s) => s.studentId === studentId), false);
});

test('TDD-001-07 家長不能在沒有管理權的家庭建立孩子', () => {
  const domain = createFamilyDomain();
  const other = domain.createFamily({
    actorParentId: PARENT_B,
    displayName: 'Family B',
  });

  expectDomainError('RESOURCE_NOT_AVAILABLE', () =>
    domain.addChildToFamily({
      actorParentId: PARENT_A,
      familyId: other.familyId,
      childDisplayName: 'Unauthorized Child',
    }),
  );
});

test('TDD-001-08 家長不能讀取其他家庭的私人資料', () => {
  const domain = createFamilyDomain();
  const other = domain.createFamily({
    actorParentId: PARENT_B,
    displayName: 'Family B',
  });

  expectDomainError('RESOURCE_NOT_AVAILABLE', () =>
    domain.readFamilyPrivateData({
      actorParentId: PARENT_A,
      familyId: other.familyId,
    }),
  );
});

test('TDD-001-09 家長不能修改另一家庭孩子的設定', () => {
  const domain = createFamilyDomain();
  const other = domain.createFamily({
    actorParentId: PARENT_B,
    displayName: 'Family B',
  });
  const { studentId } = domain.addChildToFamily({
    actorParentId: PARENT_B,
    familyId: other.familyId,
    childDisplayName: 'Child B',
  });

  expectDomainError('RESOURCE_NOT_AVAILABLE', () =>
    domain.updateChildFamilySettings({
      actorParentId: PARENT_A,
      studentId,
      changes: { displayName: 'Hacked' },
    }),
  );
});

test('TDD-001-10 即使直接提供其他家庭或學生 ID，也不能繞過授權', () => {
  const domain = createFamilyDomain();
  const other = domain.createFamily({
    actorParentId: PARENT_B,
    displayName: 'Family B',
  });
  const { studentId } = domain.addChildToFamily({
    actorParentId: PARENT_B,
    familyId: other.familyId,
    childDisplayName: 'Child B',
  });

  expectDomainError('RESOURCE_NOT_AVAILABLE', () =>
    domain.readFamilyPrivateData({
      actorParentId: PARENT_A,
      familyId: other.familyId,
    }),
  );

  expectDomainError('RESOURCE_NOT_AVAILABLE', () =>
    domain.updateChildFamilySettings({
      actorParentId: PARENT_A,
      studentId,
      changes: { displayName: 'Hacked' },
    }),
  );
});

test('TDD-001-11 被拒絕的跨家庭修改不能留下任何資料變更', () => {
  const domain = createFamilyDomain();
  const other = domain.createFamily({
    actorParentId: PARENT_B,
    displayName: 'Family B',
  });
  const { studentId } = domain.addChildToFamily({
    actorParentId: PARENT_B,
    familyId: other.familyId,
    childDisplayName: 'Original Name',
  });

  expectDomainError('RESOURCE_NOT_AVAILABLE', () =>
    domain.updateChildFamilySettings({
      actorParentId: PARENT_A,
      studentId,
      changes: { displayName: 'Hacked' },
    }),
  );

  const family = domain.readFamilyPrivateData({
    actorParentId: PARENT_B,
    familyId: other.familyId,
  });
  const student = family.students.find((item) => item.studentId === studentId);

  assert.equal(student.displayName, 'Original Name');
});

test('TDD-001-12 空白家庭名稱被拒絕', () => {
  const domain = createFamilyDomain();

  expectDomainError('EMPTY_FAMILY_NAME', () =>
    domain.createFamily({
      actorParentId: PARENT_A,
      displayName: '   ',
    }),
  );
});

test('TDD-001-13 空白孩子名稱被拒絕', () => {
  const domain = createFamilyDomain();
  const { familyId } = domain.createFamily({
    actorParentId: PARENT_A,
    displayName: 'Family A',
  });

  expectDomainError('EMPTY_CHILD_NAME', () =>
    domain.addChildToFamily({
      actorParentId: PARENT_A,
      familyId,
      childDisplayName: '   ',
    }),
  );
});
