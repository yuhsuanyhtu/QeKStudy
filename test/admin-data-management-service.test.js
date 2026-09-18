import test from 'node:test';
import assert from 'node:assert/strict';

import { createPersistentFamilyService } from '../src/persistent-family-service.js';
import { createAdminDataManagementService } from '../src/admin-data-management-service.js';

function makeRepository({
  schemaVersion = 2,
  failAction = null,
  busyAction = null,
} = {}) {
  const state = {
    schemaVersion,
    families: [
      {
        familyId: 'fam-a',
        displayName: 'Family A',
        ownerParentId: 'parent-a',
        createdAt: '2026-09-18T00:00:00.000Z',
        updatedAt: '2026-09-18T00:00:00.000Z',
        status: 'active',
        deletedAt: '',
        deletedByActorId: '',
        deletedByRole: '',
      },
      {
        familyId: 'fam-b',
        displayName: 'Family B',
        ownerParentId: 'parent-b',
        createdAt: '2026-09-18T00:00:00.000Z',
        updatedAt: '2026-09-18T00:00:00.000Z',
        status: 'active',
        deletedAt: '',
        deletedByActorId: '',
        deletedByRole: '',
      },
    ],
    students: [
      {
        studentId: 'stu-a',
        familyId: 'fam-a',
        displayName: 'Student A',
        createdAt: '2026-09-18T00:00:00.000Z',
        updatedAt: '2026-09-18T00:00:00.000Z',
        status: 'active',
        deletedAt: '',
        deletedByActorId: '',
        deletedByRole: '',
      },
      {
        studentId: 'stu-b',
        familyId: 'fam-b',
        displayName: 'Student B',
        createdAt: '2026-09-18T00:00:00.000Z',
        updatedAt: '2026-09-18T00:00:00.000Z',
        status: 'active',
        deletedAt: '',
        deletedByActorId: '',
        deletedByRole: '',
      },
    ],
    audit: [],
  };

  function maybeFail(action) {
    if (busyAction === action) {
      const error = new Error('busy');
      error.code = 'PERSISTENCE_BUSY';
      throw error;
    }
    if (failAction === action) throw new Error('write failed');
  }

  return {
    state,

    async getSchemaVersion() {
      return state.schemaVersion;
    },

    async readFamilyRaw(familyId) {
      const found = state.families.find((item) => item.familyId === familyId);
      return found ? { ...found } : null;
    },

    async readStudentRaw(studentId) {
      const found = state.students.find((item) => item.studentId === studentId);
      return found ? { ...found } : null;
    },

    async renameFamilyWithAudit({ familyId, newDisplayName, updatedAt, audit }) {
      maybeFail('renameFamily');
      const family = state.families.find((item) => item.familyId === familyId);
      family.displayName = newDisplayName;
      family.updatedAt = updatedAt;
      state.audit.push({ ...audit });
      return { ...family };
    },

    async renameStudentWithAudit({ studentId, newDisplayName, updatedAt, audit }) {
      maybeFail('renameStudent');
      const student = state.students.find((item) => item.studentId === studentId);
      student.displayName = newDisplayName;
      student.updatedAt = updatedAt;
      state.audit.push({ ...audit });
      return { ...student };
    },

    async softDeleteStudentWithAudit({ studentId, deletedAt, actorId, actorRole, audit }) {
      maybeFail('deleteStudent');
      const student = state.students.find((item) => item.studentId === studentId);
      student.status = 'deleted';
      student.deletedAt = deletedAt;
      student.deletedByActorId = actorId;
      student.deletedByRole = actorRole;
      student.updatedAt = deletedAt;
      state.audit.push({ ...audit });
      return { ...student };
    },

    async softDeleteFamilyCascadeWithAudit({ familyId, deletedAt, actorId, actorRole, auditEvents }) {
      maybeFail('deleteFamily');
      const family = state.families.find((item) => item.familyId === familyId);
      const students = state.students.filter(
        (item) => item.familyId === familyId && item.status === 'active',
      );

      family.status = 'deleted';
      family.deletedAt = deletedAt;
      family.deletedByActorId = actorId;
      family.deletedByRole = actorRole;
      family.updatedAt = deletedAt;

      for (const student of students) {
        student.status = 'deleted';
        student.deletedAt = deletedAt;
        student.deletedByActorId = actorId;
        student.deletedByRole = actorRole;
        student.updatedAt = deletedAt;
      }

      state.audit.push(...auditEvents.map((event) => ({ ...event })));
      return {
        family: { ...family },
        students: students.map((student) => ({ ...student })),
      };
    },

    // Existing persistence interface: only active data is visible.
    async listFamilies(parentId) {
      return state.families
        .filter(
          (family) =>
            family.ownerParentId === parentId && family.status === 'active',
        )
        .map((family) => ({ ...family }));
    },

    async readFamily(familyId) {
      const family = state.families.find(
        (item) => item.familyId === familyId && item.status === 'active',
      );
      return family ? { ...family } : null;
    },

    async listStudents(familyId) {
      return state.students
        .filter(
          (student) =>
            student.familyId === familyId && student.status === 'active',
        )
        .map((student) => ({ ...student }));
    },

    async createFamily() {
      throw new Error('not needed');
    },

    async addStudent() {
      throw new Error('not needed');
    },
  };
}

const parentA = {
  actorId: 'parent-a',
  role: 'PARENT',
  parentId: 'parent-a',
};

const parentB = {
  actorId: 'parent-b',
  role: 'PARENT',
  parentId: 'parent-b',
};

const admin = {
  actorId: 'admin-1',
  role: 'ADMIN',
};

function service(repository) {
  return createAdminDataManagementService({
    repository,
    expectedSchemaVersion: 2,
    now: () => '2026-09-18T06:00:00.000Z',
    idFactory: () => 'audit-1',
  });
}

test('TDD-003-01 parent can rename own family', async () => {
  const repository = makeRepository();
  const result = await service(repository).renameFamily({
    trustedPrincipal: parentA,
    familyId: 'fam-a',
    newDisplayName: 'Renamed A',
  });

  assert.equal(result.ok, true);
  assert.equal(repository.state.families[0].displayName, 'Renamed A');
});

test('TDD-003-02 family rename keeps familyId and ownership unchanged', async () => {
  const repository = makeRepository();
  await service(repository).renameFamily({
    trustedPrincipal: parentA,
    familyId: 'fam-a',
    newDisplayName: 'Renamed A',
  });

  const family = repository.state.families[0];
  assert.equal(family.familyId, 'fam-a');
  assert.equal(family.ownerParentId, 'parent-a');
});

test('TDD-003-03 parent can rename own student', async () => {
  const repository = makeRepository();
  const result = await service(repository).renameStudent({
    trustedPrincipal: parentA,
    studentId: 'stu-a',
    newDisplayName: 'Renamed Student A',
  });

  assert.equal(result.ok, true);
  assert.equal(repository.state.students[0].displayName, 'Renamed Student A');
});

test('TDD-003-04 student rename keeps studentId and familyId unchanged', async () => {
  const repository = makeRepository();
  await service(repository).renameStudent({
    trustedPrincipal: parentA,
    studentId: 'stu-a',
    newDisplayName: 'Renamed Student A',
  });

  const student = repository.state.students[0];
  assert.equal(student.studentId, 'stu-a');
  assert.equal(student.familyId, 'fam-a');
});

test('TDD-003-05 parent cannot rename another family', async () => {
  const repository = makeRepository();
  const result = await service(repository).renameFamily({
    trustedPrincipal: parentA,
    familyId: 'fam-b',
    newDisplayName: 'Hacked',
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'RESOURCE_NOT_AVAILABLE');
  assert.equal(repository.state.families[1].displayName, 'Family B');
});

test('TDD-003-06 parent cannot rename another family student', async () => {
  const repository = makeRepository();
  const result = await service(repository).renameStudent({
    trustedPrincipal: parentA,
    studentId: 'stu-b',
    newDisplayName: 'Hacked',
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'RESOURCE_NOT_AVAILABLE');
  assert.equal(repository.state.students[1].displayName, 'Student B');
});

test('TDD-003-07 blank family rename is rejected', async () => {
  const repository = makeRepository();
  const result = await service(repository).renameFamily({
    trustedPrincipal: parentA,
    familyId: 'fam-a',
    newDisplayName: '   ',
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'EMPTY_FAMILY_NAME');
});

test('TDD-003-08 blank student rename is rejected', async () => {
  const repository = makeRepository();
  const result = await service(repository).renameStudent({
    trustedPrincipal: parentA,
    studentId: 'stu-a',
    newDisplayName: '   ',
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'EMPTY_CHILD_NAME');
});

test('TDD-003-09 normal parent cannot delete student', async () => {
  const repository = makeRepository();
  const result = await service(repository).deleteStudent({
    trustedPrincipal: parentA,
    studentId: 'stu-a',
    confirmed: true,
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'RESOURCE_NOT_AVAILABLE');
  assert.equal(repository.state.students[0].status, 'active');
});

test('TDD-003-10 normal parent cannot delete family', async () => {
  const repository = makeRepository();
  const result = await service(repository).deleteFamily({
    trustedPrincipal: parentA,
    familyId: 'fam-a',
    confirmed: true,
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'RESOURCE_NOT_AVAILABLE');
  assert.equal(repository.state.families[0].status, 'active');
});

test('TDD-003-11 admin can rename any family', async () => {
  const repository = makeRepository();
  const result = await service(repository).renameFamily({
    trustedPrincipal: admin,
    familyId: 'fam-b',
    newDisplayName: 'Admin Renamed B',
  });

  assert.equal(result.ok, true);
  assert.equal(repository.state.families[1].displayName, 'Admin Renamed B');
});

test('TDD-003-12 admin can rename any student', async () => {
  const repository = makeRepository();
  const result = await service(repository).renameStudent({
    trustedPrincipal: admin,
    studentId: 'stu-b',
    newDisplayName: 'Admin Renamed Student B',
  });

  assert.equal(result.ok, true);
  assert.equal(repository.state.students[1].displayName, 'Admin Renamed Student B');
});

test('TDD-003-13 delete requires explicit confirmation', async () => {
  const repository = makeRepository();
  const result = await service(repository).deleteStudent({
    trustedPrincipal: admin,
    studentId: 'stu-a',
    confirmed: false,
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'DELETE_CONFIRMATION_REQUIRED');
  assert.equal(repository.state.students[0].status, 'active');
});

test('TDD-003-14 admin soft-deletes student with metadata', async () => {
  const repository = makeRepository();
  const result = await service(repository).deleteStudent({
    trustedPrincipal: admin,
    studentId: 'stu-a',
    confirmed: true,
  });

  const student = repository.state.students[0];
  assert.equal(result.ok, true);
  assert.equal(student.status, 'deleted');
  assert.equal(student.deletedByActorId, 'admin-1');
  assert.equal(student.deletedByRole, 'ADMIN');
  assert.equal(student.deletedAt, '2026-09-18T06:00:00.000Z');
});

test('TDD-003-15 deleted student disappears from normal family read', async () => {
  const repository = makeRepository();
  await service(repository).deleteStudent({
    trustedPrincipal: admin,
    studentId: 'stu-a',
    confirmed: true,
  });

  const persistent = createPersistentFamilyService({
    repository,
    idFactory: () => 'unused',
    expectedSchemaVersion: 2,
  });

  const result = await persistent.readFamily(
    { parentId: 'parent-a' },
    'fam-a',
  );

  assert.equal(result.ok, true);
  assert.deepEqual(result.data.family.students, []);
});

test('TDD-003-16 admin deleting family soft-deletes all active students', async () => {
  const repository = makeRepository();
  const result = await service(repository).deleteFamily({
    trustedPrincipal: admin,
    familyId: 'fam-a',
    confirmed: true,
  });

  assert.equal(result.ok, true);
  assert.equal(repository.state.families[0].status, 'deleted');
  assert.equal(repository.state.students[0].status, 'deleted');
});

test('TDD-003-17 deleted family disappears from normal parent list', async () => {
  const repository = makeRepository();
  await service(repository).deleteFamily({
    trustedPrincipal: admin,
    familyId: 'fam-a',
    confirmed: true,
  });

  const persistent = createPersistentFamilyService({
    repository,
    idFactory: () => 'unused',
    expectedSchemaVersion: 2,
  });

  const result = await persistent.listFamilies({ parentId: 'parent-a' });
  assert.deepEqual(result.data.families, []);
});

test('TDD-003-18 rename writes audit record', async () => {
  const repository = makeRepository();
  await service(repository).renameFamily({
    trustedPrincipal: parentA,
    familyId: 'fam-a',
    newDisplayName: 'Renamed A',
  });

  assert.equal(repository.state.audit.length, 1);
  assert.equal(repository.state.audit[0].action, 'RENAME_FAMILY');
  assert.equal(repository.state.audit[0].actorId, 'parent-a');
  assert.equal(repository.state.audit[0].targetId, 'fam-a');
});

test('TDD-003-19 delete writes administrator audit record', async () => {
  const repository = makeRepository();
  await service(repository).deleteStudent({
    trustedPrincipal: admin,
    studentId: 'stu-a',
    confirmed: true,
  });

  assert.equal(repository.state.audit.length, 1);
  assert.equal(repository.state.audit[0].action, 'DELETE_STUDENT');
  assert.equal(repository.state.audit[0].actorRole, 'ADMIN');
});

test('TDD-003-20 persistence failure never reports successful delete', async () => {
  const repository = makeRepository({ failAction: 'deleteStudent' });
  const result = await service(repository).deleteStudent({
    trustedPrincipal: admin,
    studentId: 'stu-a',
    confirmed: true,
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'PERSISTENCE_FAILED');
  assert.equal(repository.state.students[0].status, 'active');
});

test('TDD-003-21 busy lock maps to PERSISTENCE_BUSY', async () => {
  const repository = makeRepository({ busyAction: 'deleteFamily' });
  const result = await service(repository).deleteFamily({
    trustedPrincipal: admin,
    familyId: 'fam-a',
    confirmed: true,
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'PERSISTENCE_BUSY');
});

test('TDD-003-22 schema v1 is rejected by v2 management service', async () => {
  const repository = makeRepository({ schemaVersion: 1 });
  const result = await service(repository).renameFamily({
    trustedPrincipal: parentA,
    familyId: 'fam-a',
    newDisplayName: 'Renamed A',
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'SCHEMA_MISMATCH');
});

test('TDD-003-23 pretending to be admin without trusted admin role is denied', async () => {
  const repository = makeRepository();
  const result = await service(repository).deleteFamily({
    trustedPrincipal: parentB,
    familyId: 'fam-a',
    confirmed: true,
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'RESOURCE_NOT_AVAILABLE');
  assert.equal(repository.state.families[0].status, 'active');
});
