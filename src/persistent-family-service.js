function fail(code, message = code) {
  return { ok: false, error: { code, message } };
}

function success(data) {
  return { ok: true, data };
}

function cleanName(value, code) {
  const cleaned = String(value ?? '').trim();
  return cleaned ? { ok: true, value: cleaned } : fail(code);
}

function validPrincipal(principal) {
  return Boolean(principal && typeof principal.parentId === 'string' && principal.parentId.trim());
}

function mapRepositoryError(error) {
  if (error?.code === 'PERSISTENCE_BUSY') {
    return fail('PERSISTENCE_BUSY');
  }
  return fail('PERSISTENCE_FAILED');
}

export function createPersistentFamilyService({
  repository,
  idFactory,
  expectedSchemaVersion = 1,
  now = () => new Date().toISOString(),
}) {
  async function ensureSchema() {
    try {
      const version = await repository.getSchemaVersion();
      return Number(version) === Number(expectedSchemaVersion)
        ? null
        : fail('SCHEMA_MISMATCH');
    } catch {
      return fail('PERSISTENCE_FAILED');
    }
  }

  async function createFamily(principal, displayName) {
    if (!validPrincipal(principal)) return fail('RESOURCE_NOT_AVAILABLE');

    const name = cleanName(displayName, 'EMPTY_FAMILY_NAME');
    if (!name.ok) return name;

    const schemaError = await ensureSchema();
    if (schemaError) return schemaError;

    const timestamp = now();
    const family = {
      familyId: idFactory('family'),
      displayName: name.value,
      ownerParentId: principal.parentId,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: 'active',
    };

    try {
      await repository.createFamily(family);
      return success({ family: { ...family } });
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function listFamilies(principal) {
    if (!validPrincipal(principal)) return fail('RESOURCE_NOT_AVAILABLE');

    const schemaError = await ensureSchema();
    if (schemaError) return schemaError;

    try {
      const families = await repository.listFamilies(principal.parentId);
      return success({ families: families.map((family) => ({ ...family })) });
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function readFamily(principal, familyId) {
    if (!validPrincipal(principal)) return fail('RESOURCE_NOT_AVAILABLE');

    const schemaError = await ensureSchema();
    if (schemaError) return schemaError;

    try {
      const family = await repository.readFamily(familyId);
      if (!family || family.ownerParentId !== principal.parentId || family.status !== 'active') {
        return fail('RESOURCE_NOT_AVAILABLE');
      }

      const students = await repository.listStudents(familyId);
      return success({
        family: {
          ...family,
          students: students.map((student) => ({ ...student })),
        },
      });
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function addStudent(principal, familyId, childDisplayName) {
    if (!validPrincipal(principal)) return fail('RESOURCE_NOT_AVAILABLE');

    const name = cleanName(childDisplayName, 'EMPTY_CHILD_NAME');
    if (!name.ok) return name;

    const schemaError = await ensureSchema();
    if (schemaError) return schemaError;

    try {
      const family = await repository.readFamily(familyId);
      if (!family || family.ownerParentId !== principal.parentId || family.status !== 'active') {
        return fail('RESOURCE_NOT_AVAILABLE');
      }

      const timestamp = now();
      const student = {
        studentId: idFactory('student'),
        familyId,
        displayName: name.value,
        createdAt: timestamp,
        updatedAt: timestamp,
        status: 'active',
      };

      await repository.addStudent(student);
      return success({ student: { ...student } });
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  return {
    createFamily,
    listFamilies,
    readFamily,
    addStudent,
  };
}
