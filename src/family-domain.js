function domainError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function cleanName(value, errorCode) {
  const cleaned = String(value ?? '').trim();
  if (!cleaned) throw domainError(errorCode);
  return cleaned;
}

export function createFamilyDomain() {
  const families = new Map();
  const students = new Map();
  const memberships = new Map();
  let familySeq = 0;
  let studentSeq = 0;

  const membershipKey = (parentId, familyId) => `${parentId}:${familyId}`;

  function hasMembership(parentId, familyId) {
    return memberships.has(membershipKey(parentId, familyId));
  }

  function canManageFamily(parentId, familyId) {
    return memberships.get(membershipKey(parentId, familyId))?.role === 'MANAGING_PARENT';
  }

  function requireVisibleFamily(parentId, familyId) {
    const family = families.get(familyId);
    if (!family || !hasMembership(parentId, familyId)) {
      throw domainError('RESOURCE_NOT_AVAILABLE');
    }
    return family;
  }

  function requireManagingFamily(parentId, familyId) {
    const family = families.get(familyId);
    if (!family || !canManageFamily(parentId, familyId)) {
      throw domainError('RESOURCE_NOT_AVAILABLE');
    }
    return family;
  }

  function createFamily({ actorParentId, displayName }) {
    const name = cleanName(displayName, 'EMPTY_FAMILY_NAME');
    const familyId = `family-${++familySeq}`;
    const family = {
      familyId,
      displayName: name,
      createdByParentId: actorParentId,
      createdAt: new Date().toISOString(),
    };
    families.set(familyId, family);
    memberships.set(membershipKey(actorParentId, familyId), {
      parentId: actorParentId,
      familyId,
      role: 'MANAGING_PARENT',
    });
    return { familyId };
  }

  function listVisibleFamilies({ actorParentId }) {
    return [...families.values()]
      .filter((family) => hasMembership(actorParentId, family.familyId))
      .map((family) => ({ ...family }));
  }

  function addChildToFamily({ actorParentId, familyId, childDisplayName }) {
    requireManagingFamily(actorParentId, familyId);
    const displayName = cleanName(childDisplayName, 'EMPTY_CHILD_NAME');
    const studentId = `student-${++studentSeq}`;
    students.set(studentId, {
      studentId,
      familyId,
      displayName,
      createdAt: new Date().toISOString(),
    });
    return { studentId };
  }

  function readFamilyPrivateData({ actorParentId, familyId }) {
    const family = requireVisibleFamily(actorParentId, familyId);
    return {
      ...family,
      students: [...students.values()]
        .filter((student) => student.familyId === familyId)
        .map((student) => ({ ...student })),
    };
  }

  function updateChildFamilySettings({ actorParentId, studentId, changes }) {
    const student = students.get(studentId);
    if (!student || !canManageFamily(actorParentId, student.familyId)) {
      throw domainError('RESOURCE_NOT_AVAILABLE');
    }

    const next = {
      ...student,
      ...(changes ?? {}),
      studentId: student.studentId,
      familyId: student.familyId,
    };

    if ('displayName' in (changes ?? {})) {
      next.displayName = cleanName(changes.displayName, 'EMPTY_CHILD_NAME');
    }

    students.set(studentId, next);
    return { studentId };
  }

  return {
    createFamily,
    listVisibleFamilies,
    canManageFamily,
    addChildToFamily,
    readFamilyPrivateData,
    updateChildFamilySettings,
  };
}
