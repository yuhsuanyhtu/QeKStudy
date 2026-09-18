import test from 'node:test';
import assert from 'node:assert/strict';

import { createPersistentFamilyService } from '../src/persistent-family-service.js';

function sharedRepository({
  schemaVersion = 1,
  failCreateFamily = false,
  failAddStudent = false,
  busy = false,
} = {}) {
  const state = { families: [], students: [], schemaVersion };

  return {
    state,
    createSession() {
      return {
        async getSchemaVersion() {
          return state.schemaVersion;
        },

        async createFamily(record) {
          if (busy) {
            const error = new Error('busy');
            error.code = 'PERSISTENCE_BUSY';
            throw error;
          }
          if (failCreateFamily) throw new Error('write failed');
          state.families.push({ ...record });
          return { ...record };
        },

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

        async addStudent(record) {
          if (busy) {
            const error = new Error('busy');
            error.code = 'PERSISTENCE_BUSY';
            throw error;
          }
          if (failAddStudent) throw new Error('write failed');
          state.students.push({ ...record });
          return { ...record };
        },

        async listStudents(familyId) {
          return state.students
            .filter(
              (student) =>
                student.familyId === familyId && student.status === 'active',
            )
            .map((student) => ({ ...student }));
        },
      };
    },
  };
}

const principal = (parentId) => ({ parentId });

test('TDD-002-01 family persists across application sessions', async () => {
  const shared = sharedRepository();

  const firstSession = createPersistentFamilyService({
    repository: shared.createSession(),
    idFactory: () => 'fam-1',
  });

  const created = await firstSession.createFamily(
    principal('parent-a'),
    'QeK Family',
  );
  assert.equal(created.ok, true);

  const secondSession = createPersistentFamilyService({
    repository: shared.createSession(),
    idFactory: () => 'unused',
  });

  const result = await secondSession.listFamilies(principal('parent-a'));

  assert.equal(result.ok, true);
  assert.equal(result.data.families[0].displayName, 'QeK Family');
});

test('TDD-002-02 student persists and remains in original family', async () => {
  const shared = sharedRepository();

  const firstSession = createPersistentFamilyService({
    repository: shared.createSession(),
    idFactory: (kind) => (kind === 'family' ? 'fam-1' : 'stu-1'),
  });

  await firstSession.createFamily(principal('parent-a'), 'Family A');
  await firstSession.addStudent(principal('parent-a'), 'fam-1', 'QeK');

  const secondSession = createPersistentFamilyService({
    repository: shared.createSession(),
    idFactory: () => 'unused',
  });

  const result = await secondSession.readFamily(
    principal('parent-a'),
    'fam-1',
  );

  assert.equal(result.ok, true);
  assert.equal(result.data.family.students[0].studentId, 'stu-1');
  assert.equal(result.data.family.students[0].familyId, 'fam-1');
});

test('TDD-002-03 same principal on another session sees same durable data', async () => {
  const shared = sharedRepository();

  const firstSession = createPersistentFamilyService({
    repository: shared.createSession(),
    idFactory: () => 'fam-1',
  });
  await firstSession.createFamily(principal('parent-a'), 'Family A');

  const secondSession = createPersistentFamilyService({
    repository: shared.createSession(),
    idFactory: () => 'unused',
  });
  const result = await secondSession.listFamilies(principal('parent-a'));

  assert.deepEqual(
    result.data.families.map((family) => family.familyId),
    ['fam-1'],
  );
});

test('TDD-002-04 parent A list does not return parent B family', async () => {
  const shared = sharedRepository();
  let sequence = 0;

  const service = createPersistentFamilyService({
    repository: shared.createSession(),
    idFactory: () => `fam-${++sequence}`,
  });

  await service.createFamily(principal('parent-a'), 'Family A');
  await service.createFamily(principal('parent-b'), 'Family B');

  const result = await service.listFamilies(principal('parent-a'));

  assert.deepEqual(
    result.data.families.map((family) => family.displayName),
    ['Family A'],
  );
});

test('TDD-002-05 direct read of another parent family is denied', async () => {
  const shared = sharedRepository();

  const service = createPersistentFamilyService({
    repository: shared.createSession(),
    idFactory: () => 'fam-b',
  });

  await service.createFamily(principal('parent-b'), 'Family B');

  const result = await service.readFamily(
    principal('parent-a'),
    'fam-b',
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'RESOURCE_NOT_AVAILABLE');
});

test('TDD-002-06 createFamily write failure never returns success', async () => {
  const shared = sharedRepository({ failCreateFamily: true });

  const service = createPersistentFamilyService({
    repository: shared.createSession(),
    idFactory: () => 'fam-1',
  });

  const result = await service.createFamily(
    principal('parent-a'),
    'Family A',
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'PERSISTENCE_FAILED');
  assert.equal(shared.state.families.length, 0);
});

test('TDD-002-07 addStudent write failure never returns success', async () => {
  const shared = sharedRepository();

  const firstSession = createPersistentFamilyService({
    repository: shared.createSession(),
    idFactory: () => 'fam-1',
  });
  await firstSession.createFamily(principal('parent-a'), 'Family A');

  const failingRepository = {
    ...shared.createSession(),
    async addStudent() {
      throw new Error('write failed');
    },
  };

  const secondSession = createPersistentFamilyService({
    repository: failingRepository,
    idFactory: () => 'stu-1',
  });

  const result = await secondSession.addStudent(
    principal('parent-a'),
    'fam-1',
    'QeK',
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'PERSISTENCE_FAILED');
  assert.equal(shared.state.students.length, 0);
});

test('TDD-002-08 schema mismatch rejects operations', async () => {
  const shared = sharedRepository({ schemaVersion: 99 });

  const service = createPersistentFamilyService({
    repository: shared.createSession(),
    idFactory: () => 'fam-1',
    expectedSchemaVersion: 1,
  });

  const result = await service.listFamilies(principal('parent-a'));

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'SCHEMA_MISMATCH');
});

test('TDD-002-09 repository busy maps to PERSISTENCE_BUSY', async () => {
  const shared = sharedRepository({ busy: true });

  const service = createPersistentFamilyService({
    repository: shared.createSession(),
    idFactory: () => 'fam-1',
  });

  const result = await service.createFamily(
    principal('parent-a'),
    'Family A',
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'PERSISTENCE_BUSY');
});
