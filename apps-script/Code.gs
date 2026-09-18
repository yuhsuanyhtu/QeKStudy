const QEK_SPREADSHEET_ID = '16GjrllU2rRgUBXH7evGQCFqOTHQbhtJRFX6CjkvKBA8';
const QEK_SCHEMA_VERSION = 1;
const QEK_SHEETS = {
  families: 'families',
  students: 'students',
  meta: 'schema_meta',
};

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('QeKStudy · Persistence Demo');
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
    };

    withScriptLock_(function() {
      appendRow_(QEK_SHEETS.families, [
        family.familyId,
        family.displayName,
        family.ownerParentId,
        family.createdAt,
        family.updatedAt,
        family.status,
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
    };

    withScriptLock_(function() {
      appendRow_(QEK_SHEETS.students, [
        student.studentId,
        student.familyId,
        student.displayName,
        student.createdAt,
        student.updatedAt,
        student.status,
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
  return { parentId: parentId };
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
  const row = readObjects_(QEK_SHEETS.families).find(function(item) {
    return item.family_id === familyId;
  });
  return row ? familyFromRow_(row) : null;
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
  return values.slice(1).filter(function(row) {
    return row.some(function(cell) { return cell !== ''; });
  }).map(function(row) {
    const result = {};
    headers.forEach(function(header, index) {
      result[header] = row[index];
    });
    return result;
  });
}

function appendRow_(sheetName, values) {
  sheet_(sheetName).appendRow(values);
  SpreadsheetApp.flush();
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
  const sheet = SpreadsheetApp.openById(QEK_SPREADSHEET_ID).getSheetByName(name);
  if (!sheet) throw qekError_('SCHEMA_MISMATCH');
  return sheet;
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
