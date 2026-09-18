const QEK_SPREADSHEET_ID = '16GjrllU2rRgUBXH7evGQCFqOTHQbhtJRFX6CjkvKBA8';
const QEK_SCHEMA_VERSION = 3;
const QEK_SHEETS = {
  families: 'families',
  students: 'students',
  meta: 'schema_meta',
  audit: 'audit_log',
  learning: 'learning_events',
};

function doGet(e) {
  const view = e && e.parameter ? String(e.parameter.view || '') : '';
  const isEnglish = view.toLowerCase() === 'english';
  return HtmlService.createTemplateFromFile(isEnglish ? 'English' : 'Index')
    .evaluate()
    .setTitle(isEnglish ? 'QeKStudy · English' : 'QeKStudy · Persistence Demo');
}

function apiBootstrap(parentId) {
  return apiResult_(function() {
    const principal = demoPrincipal_(parentId);
    ensureSchema_();

    const families = listFamiliesForParent_(principal.parentId).map(function(family) {
      family.students = listStudentsForFamily_(family.familyId);
      return family;
    });

    return { families: families };
  });
}

function apiCreateFamily(parentId, displayName) {
  return apiResult_(function() {
    const principal = demoPrincipal_(parentId);
    ensureSchema_();

    const name = cleanName_(displayName, 'EMPTY_FAMILY_NAME');
    const now = new Date().toISOString();
    const family = {
      familyId: 'fam_' + Utilities.getUuid(),
      displayName: name,
      ownerParentId: principal.parentId,
      createdAt: now,
      updatedAt: now,
      status: 'active',
      deletedAt: '',
      deletedByActorId: '',
      deletedByRole: '',
    };

    withScriptLock_(function() {
      appendRow_(QEK_SHEETS.families, [
        family.familyId,
        family.displayName,
        family.ownerParentId,
        family.createdAt,
        family.updatedAt,
        family.status,
        family.deletedAt,
        family.deletedByActorId,
        family.deletedByRole,
      ]);
    });

    return { family: family };
  });
}

function apiAddStudent(parentId, familyId, displayName) {
  return apiResult_(function() {
    const principal = demoPrincipal_(parentId);
    ensureSchema_();

    const family = findFamily_(familyId);
    if (!family || family.ownerParentId !== principal.parentId || family.status !== 'active') {
      throw qekError_('RESOURCE_NOT_AVAILABLE');
    }

    const name = cleanName_(displayName, 'EMPTY_CHILD_NAME');
    const now = new Date().toISOString();
    const student = {
      studentId: 'stu_' + Utilities.getUuid(),
      familyId: familyId,
      displayName: name,
      createdAt: now,
      updatedAt: now,
      status: 'active',
      deletedAt: '',
      deletedByActorId: '',
      deletedByRole: '',
    };

    withScriptLock_(function() {
      appendRow_(QEK_SHEETS.students, [
        student.studentId,
        student.familyId,
        student.displayName,
        student.createdAt,
        student.updatedAt,
        student.status,
        student.deletedAt,
        student.deletedByActorId,
        student.deletedByRole,
      ]);
    });

    return { student: student };
  });
}

function apiReadFamily(parentId, familyId) {
  return apiResult_(function() {
    const principal = demoPrincipal_(parentId);
    ensureSchema_();

    const family = findFamily_(familyId);
    if (!family || family.ownerParentId !== principal.parentId || family.status !== 'active') {
      throw qekError_('RESOURCE_NOT_AVAILABLE');
    }

    family.students = listStudentsForFamily_(family.familyId);
    return { family: family };
  });
}

function apiRenameFamily(parentId, familyId, displayName) {
  return apiResult_(function() {
    const principal = demoPrincipal_(parentId);
    ensureSchema_();
    const name = cleanName_(displayName, 'EMPTY_FAMILY_NAME');

    return withScriptLock_(function() {
      const row = findFamilyRow_(familyId);
      if (!row || row.owner_parent_id !== principal.parentId || row.status !== 'active') {
        throw qekError_('RESOURCE_NOT_AVAILABLE');
      }

      const now = new Date().toISOString();
      const before = String(row.display_name);
      row.display_name = name;
      row.updated_at = now;
      writeObjectRow_(QEK_SHEETS.families, row);
      appendAudit_({
        actorId: principal.actorId,
        actorRole: principal.role,
        action: 'RENAME_FAMILY',
        targetType: 'FAMILY',
        targetId: familyId,
        familyId: familyId,
        beforeValue: before,
        afterValue: name,
        occurredAt: now,
      });
      SpreadsheetApp.flush();
      return { family: familyFromRow_(row) };
    });
  });
}

function apiRenameStudent(parentId, studentId, displayName) {
  return apiResult_(function() {
    const principal = demoPrincipal_(parentId);
    ensureSchema_();
    const name = cleanName_(displayName, 'EMPTY_CHILD_NAME');

    return withScriptLock_(function() {
      const student = findStudentRow_(studentId);
      if (!student || student.status !== 'active') {
        throw qekError_('RESOURCE_NOT_AVAILABLE');
      }

      const family = findFamilyRow_(student.family_id);
      if (!family || family.status !== 'active' || family.owner_parent_id !== principal.parentId) {
        throw qekError_('RESOURCE_NOT_AVAILABLE');
      }

      const now = new Date().toISOString();
      const before = String(student.display_name);
      student.display_name = name;
      student.updated_at = now;
      writeObjectRow_(QEK_SHEETS.students, student);
      appendAudit_({
        actorId: principal.actorId,
        actorRole: principal.role,
        action: 'RENAME_STUDENT',
        targetType: 'STUDENT',
        targetId: studentId,
        familyId: String(student.family_id),
        beforeValue: before,
        afterValue: name,
        occurredAt: now,
      });
      SpreadsheetApp.flush();
      return { student: studentFromRow_(student) };
    });
  });
}

// Private server-only helpers for future authenticated administrator flows.
// The trailing underscore prevents these functions from being called via google.script.run.
function adminDeleteStudent_(trustedPrincipal, studentId, confirmed) {
  ensureAdmin_(trustedPrincipal);
  if (confirmed !== true) throw qekError_('DELETE_CONFIRMATION_REQUIRED');
  ensureSchema_();

  return withScriptLock_(function() {
    const student = findStudentRow_(studentId);
    if (!student || student.status !== 'active') {
      throw qekError_('RESOURCE_NOT_AVAILABLE');
    }
    const now = new Date().toISOString();
    student.status = 'deleted';
    student.deleted_at = now;
    student.deleted_by_actor_id = trustedPrincipal.actorId;
    student.deleted_by_role = 'ADMIN';
    student.updated_at = now;
    writeObjectRow_(QEK_SHEETS.students, student);
    appendAudit_({
      actorId: trustedPrincipal.actorId,
      actorRole: 'ADMIN',
      action: 'DELETE_STUDENT',
      targetType: 'STUDENT',
      targetId: studentId,
      familyId: String(student.family_id),
      beforeValue: String(student.display_name),
      afterValue: 'deleted',
      occurredAt: now,
    });
    SpreadsheetApp.flush();
    return { student: studentFromRow_(student) };
  });
}

function adminDeleteFamily_(trustedPrincipal, familyId, confirmed) {
  ensureAdmin_(trustedPrincipal);
  if (confirmed !== true) throw qekError_('DELETE_CONFIRMATION_REQUIRED');
  ensureSchema_();

  return withScriptLock_(function() {
    const family = findFamilyRow_(familyId);
    if (!family || family.status !== 'active') {
      throw qekError_('RESOURCE_NOT_AVAILABLE');
    }

    const now = new Date().toISOString();
    const children = readObjects_(QEK_SHEETS.students).filter(function(row) {
      return row.family_id === familyId && row.status === 'active';
    });

    family.status = 'deleted';
    family.deleted_at = now;
    family.deleted_by_actor_id = trustedPrincipal.actorId;
    family.deleted_by_role = 'ADMIN';
    family.updated_at = now;
    writeObjectRow_(QEK_SHEETS.families, family);

    children.forEach(function(student) {
      student.status = 'deleted';
      student.deleted_at = now;
      student.deleted_by_actor_id = trustedPrincipal.actorId;
      student.deleted_by_role = 'ADMIN';
      student.updated_at = now;
      writeObjectRow_(QEK_SHEETS.students, student);
      appendAudit_({
        actorId: trustedPrincipal.actorId,
        actorRole: 'ADMIN',
        action: 'DELETE_STUDENT',
        targetType: 'STUDENT',
        targetId: String(student.student_id),
        familyId: familyId,
        beforeValue: String(student.display_name),
        afterValue: 'deleted',
        occurredAt: now,
      });
    });

    appendAudit_({
      actorId: trustedPrincipal.actorId,
      actorRole: 'ADMIN',
      action: 'DELETE_FAMILY',
      targetType: 'FAMILY',
      targetId: familyId,
      familyId: familyId,
      beforeValue: String(family.display_name),
      afterValue: 'deleted',
      occurredAt: now,
    });

    SpreadsheetApp.flush();
    return { family: familyFromRow_(family) };
  });
}

function apiResult_(work) {
  try {
    return { ok: true, data: work() };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: error && error.code ? error.code : 'PERSISTENCE_FAILED',
        message: error && error.message ? error.message : 'PERSISTENCE_FAILED',
      },
    };
  }
}

function demoPrincipal_(parentId) {
  if (parentId !== 'parent-a' && parentId !== 'parent-b') {
    throw qekError_('RESOURCE_NOT_AVAILABLE');
  }
  return {
    actorId: parentId,
    role: 'PARENT',
    parentId: parentId,
  };
}

function ensureAdmin_(principal) {
  if (!principal || principal.role !== 'ADMIN' || !principal.actorId) {
    throw qekError_('RESOURCE_NOT_AVAILABLE');
  }
}

function ensureSchema_() {
  const values = sheet_(QEK_SHEETS.meta).getDataRange().getValues();
  const row = values.find(function(item) {
    return item[0] === 'schema_version';
  });
  if (!row || Number(row[1]) !== QEK_SCHEMA_VERSION) {
    throw qekError_('SCHEMA_MISMATCH');
  }
}

function listFamiliesForParent_(parentId) {
  return readObjects_(QEK_SHEETS.families)
    .filter(function(row) {
      return row.owner_parent_id === parentId && row.status === 'active';
    })
    .map(familyFromRow_);
}

function findFamily_(familyId) {
  const row = findFamilyRow_(familyId);
  return row ? familyFromRow_(row) : null;
}

function findFamilyRow_(familyId) {
  return readObjects_(QEK_SHEETS.families).find(function(item) {
    return item.family_id === familyId;
  }) || null;
}

function findStudentRow_(studentId) {
  return readObjects_(QEK_SHEETS.students).find(function(item) {
    return item.student_id === studentId;
  }) || null;
}

function listStudentsForFamily_(familyId) {
  return readObjects_(QEK_SHEETS.students)
    .filter(function(row) {
      return row.family_id === familyId && row.status === 'active';
    })
    .map(studentFromRow_);
}

function familyFromRow_(row) {
  return {
    familyId: String(row.family_id),
    displayName: String(row.display_name),
    ownerParentId: String(row.owner_parent_id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    status: String(row.status),
  };
}

function studentFromRow_(row) {
  return {
    studentId: String(row.student_id),
    familyId: String(row.family_id),
    displayName: String(row.display_name),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    status: String(row.status),
  };
}

function readObjects_(sheetName) {
  const values = sheet_(sheetName).getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0].map(String);
  return values.slice(1).map(function(row, index) {
    const result = { _rowNumber: index + 2 };
    headers.forEach(function(header, columnIndex) {
      result[header] = row[columnIndex];
    });
    return result;
  }).filter(function(row) {
    return headers.some(function(header) { return row[header] !== ''; });
  });
}

function writeObjectRow_(sheetName, row) {
  const target = sheet_(sheetName);
  const headers = target.getRange(1, 1, 1, target.getLastColumn()).getValues()[0].map(String);
  const values = headers.map(function(header) {
    return row[header] == null ? '' : row[header];
  });
  target.getRange(row._rowNumber, 1, 1, headers.length).setValues([values]);
}

function appendAudit_(event) {
  appendRow_(QEK_SHEETS.audit, [
    'audit_' + Utilities.getUuid(),
    event.occurredAt,
    event.actorId,
    event.actorRole,
    event.action,
    event.targetType,
    event.targetId,
    event.familyId,
    event.beforeValue,
    event.afterValue,
  ]);
}

function appendRow_(sheetName, values) {
  sheet_(sheetName).appendRow(values);
}

function withScriptLock_(work) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    throw qekError_('PERSISTENCE_BUSY');
  }
  try {
    return work();
  } finally {
    lock.releaseLock();
  }
}

function sheet_(name) {
  const target = SpreadsheetApp.openById(QEK_SPREADSHEET_ID).getSheetByName(name);
  if (!target) throw qekError_('SCHEMA_MISMATCH');
  return target;
}

function cleanName_(value, code) {
  const cleaned = String(value == null ? '' : value).trim();
  if (!cleaned) throw qekError_(code);
  return cleaned;
}

function qekError_(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}


function controlledStudent_() {
  const studentId = PropertiesService.getScriptProperties()
    .getProperty('QEK_CONTROLLED_STUDENT_ID');
  if (!studentId) throw qekError_('CONTROLLED_STUDENT_NOT_CONFIGURED');

  const row = findStudentRow_(studentId);
  if (!row || row.status !== 'active') {
    throw qekError_('RESOURCE_NOT_AVAILABLE');
  }

  return {
    studentId: String(row.student_id),
    familyId: String(row.family_id),
    displayName: String(row.display_name),
  };
}

function listLearningEventsForStudent_(studentId) {
  return readObjects_(QEK_SHEETS.learning)
    .filter(function(row) {
      return String(row.student_id) === String(studentId);
    })
    .map(function(row) {
      return {
        learningEventId: String(row.learning_event_id),
        occurredAt: String(row.occurred_at),
        familyId: String(row.family_id),
        studentId: String(row.student_id),
        subject: String(row.subject),
        sessionId: String(row.session_id),
        eventType: String(row.event_type),
        lessonId: String(row.lesson_id),
        contentId: String(row.content_id),
        questionSourceType: String(row.question_source_type),
        attemptNo: row.attempt_no === '' ? '' : Number(row.attempt_no),
        correct: row.correct === '' ? '' : String(row.correct).toLowerCase() === 'true',
        firstAttemptCorrect: row.first_attempt_correct === '' ? '' : String(row.first_attempt_correct).toLowerCase() === 'true',
        rewardAmount: Number(row.reward_amount) || 0,
        reviewTarget: String(row.review_target || ''),
        sourceRef: String(row.source_ref || ''),
        note: String(row.note || ''),
      };
    });
}

function calculateSavingPool_(events) {
  return (events || []).reduce(function(sum, event) {
    return sum + Math.max(0, Number(event.rewardAmount) || 0);
  }, 0);
}

function calculateDailySubjectEarned_(events, subject, dateString) {
  return (events || []).reduce(function(sum, event) {
    const eventDate = String(event.occurredAt || '').slice(0, 10);
    if (event.subject === subject && eventDate === dateString) {
      return sum + Math.max(0, Number(event.rewardAmount) || 0);
    }
    return sum;
  }, 0);
}

function appendLearningEvent_(event) {
  appendRow_(QEK_SHEETS.learning, [
    event.learningEventId,
    event.occurredAt,
    event.familyId,
    event.studentId,
    event.subject,
    event.sessionId,
    event.eventType,
    event.lessonId,
    event.contentId,
    event.questionSourceType,
    event.attemptNo,
    event.correct,
    event.firstAttemptCorrect,
    event.rewardAmount,
    event.reviewTarget,
    event.sourceRef,
    event.note,
  ]);
}
