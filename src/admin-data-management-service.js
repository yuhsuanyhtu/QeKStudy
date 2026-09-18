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

function mapRepositoryError(error) {
  if (error?.code === 'PERSISTENCE_BUSY') return fail('PERSISTENCE_BUSY');
  return fail('PERSISTENCE_FAILED');
}

function isAdmin(principal) {
  return principal?.role === 'ADMIN' && Boolean(principal.actorId);
}

function isParent(principal) {
  return (
    principal?.role === 'PARENT' &&
    Boolean(principal.actorId) &&
    Boolean(principal.parentId)
  );
}

export function createAdminDataManagementService({
  repository,
  expectedSchemaVersion = 2,
  now = () => new Date().toISOString(),
  idFactory = () => crypto.randomUUID(),
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

  function auditEvent({
    principal,
    action,
    targetType,
    targetId,
    familyId,
    beforeValue,
    afterValue,
    occurredAt,
  }) {
    return {
      auditId: idFactory('audit'),
      occurredAt,
      actorId: principal.actorId,
      actorRole: principal.role,
      action,
      targetType,
      targetId,
      familyId,
      beforeValue,
      afterValue,
    };
  }

  function canManageFamily(principal, family) {
    if (!family || family.status !== 'active') return false;
    if (isAdmin(principal)) return true;
    return isParent(principal) && family.ownerParentId === principal.parentId;
  }

  async function renameFamily({
    trustedPrincipal,
    familyId,
    newDisplayName,
  }) {
    const name = cleanName(newDisplayName, 'EMPTY_FAMILY_NAME');
    if (!name.ok) return name;

    const schemaError = await ensureSchema();
    if (schemaError) return schemaError;

    try {
      const family = await repository.readFamilyRaw(familyId);
      if (!canManageFamily(trustedPrincipal, family)) {
        return fail('RESOURCE_NOT_AVAILABLE');
      }

      const occurredAt = now();
      const audit = auditEvent({
        principal: trustedPrincipal,
        action: 'RENAME_FAMILY',
        targetType: 'FAMILY',
        targetId: family.familyId,
        familyId: family.familyId,
        beforeValue: family.displayName,
        afterValue: name.value,
        occurredAt,
      });

      const updated = await repository.renameFamilyWithAudit({
        familyId: family.familyId,
        newDisplayName: name.value,
        updatedAt: occurredAt,
        audit,
      });

      return success({ family: updated });
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function renameStudent({
    trustedPrincipal,
    studentId,
    newDisplayName,
  }) {
    const name = cleanName(newDisplayName, 'EMPTY_CHILD_NAME');
    if (!name.ok) return name;

    const schemaError = await ensureSchema();
    if (schemaError) return schemaError;

    try {
      const student = await repository.readStudentRaw(studentId);
      if (!student || student.status !== 'active') {
        return fail('RESOURCE_NOT_AVAILABLE');
      }

      const family = await repository.readFamilyRaw(student.familyId);
      if (!canManageFamily(trustedPrincipal, family)) {
        return fail('RESOURCE_NOT_AVAILABLE');
      }

      const occurredAt = now();
      const audit = auditEvent({
        principal: trustedPrincipal,
        action: 'RENAME_STUDENT',
        targetType: 'STUDENT',
        targetId: student.studentId,
        familyId: student.familyId,
        beforeValue: student.displayName,
        afterValue: name.value,
        occurredAt,
      });

      const updated = await repository.renameStudentWithAudit({
        studentId: student.studentId,
        newDisplayName: name.value,
        updatedAt: occurredAt,
        audit,
      });

      return success({ student: updated });
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function deleteStudent({
    trustedPrincipal,
    studentId,
    confirmed,
  }) {
    if (!isAdmin(trustedPrincipal)) {
      return fail('RESOURCE_NOT_AVAILABLE');
    }
    if (confirmed !== true) {
      return fail('DELETE_CONFIRMATION_REQUIRED');
    }

    const schemaError = await ensureSchema();
    if (schemaError) return schemaError;

    try {
      const student = await repository.readStudentRaw(studentId);
      if (!student || student.status !== 'active') {
        return fail('RESOURCE_NOT_AVAILABLE');
      }

      const occurredAt = now();
      const audit = auditEvent({
        principal: trustedPrincipal,
        action: 'DELETE_STUDENT',
        targetType: 'STUDENT',
        targetId: student.studentId,
        familyId: student.familyId,
        beforeValue: student.displayName,
        afterValue: 'deleted',
        occurredAt,
      });

      const updated = await repository.softDeleteStudentWithAudit({
        studentId: student.studentId,
        deletedAt: occurredAt,
        actorId: trustedPrincipal.actorId,
        actorRole: trustedPrincipal.role,
        audit,
      });

      return success({ student: updated });
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function deleteFamily({
    trustedPrincipal,
    familyId,
    confirmed,
  }) {
    if (!isAdmin(trustedPrincipal)) {
      return fail('RESOURCE_NOT_AVAILABLE');
    }
    if (confirmed !== true) {
      return fail('DELETE_CONFIRMATION_REQUIRED');
    }

    const schemaError = await ensureSchema();
    if (schemaError) return schemaError;

    try {
      const family = await repository.readFamilyRaw(familyId);
      if (!family || family.status !== 'active') {
        return fail('RESOURCE_NOT_AVAILABLE');
      }

      const students = await repository.listStudents(familyId);
      const occurredAt = now();
      const auditEvents = [
        auditEvent({
          principal: trustedPrincipal,
          action: 'DELETE_FAMILY',
          targetType: 'FAMILY',
          targetId: family.familyId,
          familyId: family.familyId,
          beforeValue: family.displayName,
          afterValue: 'deleted',
          occurredAt,
        }),
        ...students.map((student) =>
          auditEvent({
            principal: trustedPrincipal,
            action: 'DELETE_STUDENT',
            targetType: 'STUDENT',
            targetId: student.studentId,
            familyId: family.familyId,
            beforeValue: student.displayName,
            afterValue: 'deleted',
            occurredAt,
          }),
        ),
      ];

      const result = await repository.softDeleteFamilyCascadeWithAudit({
        familyId: family.familyId,
        deletedAt: occurredAt,
        actorId: trustedPrincipal.actorId,
        actorRole: trustedPrincipal.role,
        auditEvents,
      });

      return success(result);
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  return {
    renameFamily,
    renameStudent,
    deleteStudent,
    deleteFamily,
  };
}
