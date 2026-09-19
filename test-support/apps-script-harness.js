// Node harness that runs the real Apps Script sources (Code.gs, EnglishLogic.gs,
// EnglishRewardConfig.gs) against in-memory fakes of the Google services.
//
// Each call to `execute()` builds a fresh vm context, like a new Apps Script
// execution: script globals do not survive between executions, while the
// backend (Sheets, CacheService, LockService, Script Properties) is shared.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SOURCES = ['Code.gs', 'EnglishLogic.gs', 'EnglishRewardConfig.gs'].map((file) => {
  const url = new URL(`../apps-script/${file}`, import.meta.url);
  return new vm.Script(readFileSync(url, 'utf8'), { filename: file });
});

export const CATALOG_URL = 'https://yuhsuanyhtu.github.io/QeKStudy/data/english/catalog.json';

export const LEARNING_HEADERS = [
  'learning_event_id', 'occurred_at', 'family_id', 'student_id', 'subject',
  'session_id', 'event_type', 'lesson_id', 'content_id', 'question_source_type',
  'attempt_no', 'correct', 'first_attempt_correct', 'reward_amount',
  'review_target', 'source_ref', 'note',
];

// Test fixture values only — not product reward amounts.
export const FIXTURE_REWARD_CONFIG = {
  configured: true,
  dailyCap: 100,
  flashcardLessonCompletion: 3,
  difficultyBase: { 1: 10, 2: 20 },
  retryFactor: 0.5,
  repeatFactors: [1, 0.5, 0.25],
};

export function fixtureCatalog() {
  const source = { type: 'PROJECT_AUTHORED_DEMO', name: 'fixture', licenseOrLegalBasis: 'fixture' };
  return {
    catalogVersion: 'fixture.1',
    subject: 'ENGLISH',
    lesson: {
      lessonId: 'lesson-1',
      revision: 1,
      displayName: 'Fixture lesson',
      source,
      words: [
        { wordId: 'w-apple', revision: 1, english: 'apple', chinese: '蘋果', reviewTarget: 'L1 / apple', source },
        { wordId: 'w-book', revision: 1, english: 'book', chinese: '書', reviewTarget: 'L1 / book', source },
      ],
    },
    questions: [
      {
        questionId: 'q-apple', revision: 1, active: true, kind: 'ZH_TO_EN', sourceType: 'CURRENT',
        prompt: '蘋果', acceptedAnswers: ['apple'], difficulty: 1, reviewTarget: 'L1 / apple', source,
      },
      {
        questionId: 'q-cap', revision: 1, active: true, kind: 'MULTIPLE_CHOICE', sourceType: 'CAP',
        prompt: 'CAP fixture', choices: [{ choiceId: 'a', label: 'A' }, { choiceId: 'b', label: 'B' }],
        correctChoiceId: 'a', difficulty: 2, reviewTarget: 'because / so',
        source: { type: 'CAP', name: 'fixture CAP', year: 2020, questionNumber: 7 },
      },
    ],
  };
}

class FakeSheet {
  constructor(name, rows, backend) {
    this.name = name;
    this.rows = rows;
    this.backend = backend;
  }

  getDataRange() {
    return {
      getValues: () => {
        this.backend.count(`read:${this.name}`);
        const snapshot = this.rows.map((row) => row.slice());
        this.backend.fireHook(`afterRead:${this.name}`);
        return snapshot;
      },
    };
  }

  getLastColumn() {
    return this.rows[0].length;
  }

  getRange(row, column, numRows, numColumns) {
    return {
      getValues: () => this.rows.slice(row - 1, row - 1 + numRows)
        .map((r) => r.slice(column - 1, column - 1 + numColumns)),
      setValues: (values) => {
        values.forEach((value, index) => {
          this.rows[row - 1 + index] = value.slice();
        });
      },
    };
  }

  appendRow(values) {
    this.backend.count(`append:${this.name}`);
    const failure = this.backend.appendFailures[this.name];
    if (failure) throw failure;
    this.rows.push(values.slice());
  }
}

export function createBackend({
  catalog = fixtureCatalog(),
  controlledStudentId = 'stu_1',
  learningRows = [],
} = {}) {
  const backend = {
    counts: {},
    hooks: {},
    appendFailures: {},
    cache: new Map(),
    lockHeld: false,
    catalog,
    catalogStatus: 200,
    properties: { QEK_CONTROLLED_STUDENT_ID: controlledStudentId },
    rewardConfig: null,
    now: null,
    logs: [],
    count(key) {
      this.counts[key] = (this.counts[key] || 0) + 1;
    },
    fireHook(key) {
      const hook = this.hooks[key];
      if (hook) {
        delete this.hooks[key];
        hook();
      }
    },
  };

  backend.sheets = {
    schema_meta: new FakeSheet('schema_meta', [['key', 'value'], ['schema_version', 3]], backend),
    families: new FakeSheet('families', [
      ['family_id', 'display_name', 'owner_parent_id', 'created_at', 'updated_at', 'status',
        'deleted_at', 'deleted_by_actor_id', 'deleted_by_role'],
      ['fam_1', 'Family', 'parent-a', '', '', 'active', '', '', ''],
    ], backend),
    students: new FakeSheet('students', [
      ['student_id', 'family_id', 'display_name', 'created_at', 'updated_at', 'status',
        'deleted_at', 'deleted_by_actor_id', 'deleted_by_role'],
      ['stu_1', 'fam_1', 'Student', '', '', 'active', '', '', ''],
      ['stu_other', 'fam_2', 'Other', '', '', 'active', '', '', ''],
    ], backend),
    audit_log: new FakeSheet('audit_log', [['audit_id']], backend),
    learning_events: new FakeSheet('learning_events', [LEARNING_HEADERS, ...learningRows], backend),
  };

  return backend;
}

function formatDate(date, timeZone, pattern) {
  if (pattern !== 'yyyy-MM-dd') throw new Error(`unsupported pattern ${pattern}`);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

function createGlobals(backend) {
  let uuid = 0;
  const FixedDate = backend.now
    ? class extends Date {
      constructor(...args) {
        if (args.length === 0) super(backend.now);
        else super(...args);
      }
    }
    : Date;

  return {
    Date: FixedDate,
    console: {
      log: (...args) => backend.logs.push(['log', ...args]),
      error: (...args) => backend.logs.push(['error', ...args]),
      warn: (...args) => backend.logs.push(['warn', ...args]),
    },
    SpreadsheetApp: {
      openById: () => {
        backend.count('openById');
        return {
          getSheetByName: (name) => backend.sheets[name] || null,
        };
      },
      flush: () => backend.count('flush'),
    },
    LockService: {
      getScriptLock: () => {
        let mine = false;
        const acquire = () => {
          if (backend.lockHeld) return false;
          backend.lockHeld = true;
          mine = true;
          backend.count('lock');
          return true;
        };
        return {
          tryLock: () => acquire(),
          waitLock: () => {
            if (!acquire()) throw new Error('Lock timeout: another process was holding the lock for too long.');
          },
          releaseLock: () => {
            if (mine) {
              backend.lockHeld = false;
              mine = false;
            }
          },
          hasLock: () => mine,
        };
      },
    },
    CacheService: {
      getScriptCache: () => ({
        get: (key) => (backend.cache.has(key) ? backend.cache.get(key) : null),
        put: (key, value) => {
          backend.cache.set(key, String(value));
        },
        remove: (key) => backend.cache.delete(key),
      }),
    },
    UrlFetchApp: {
      fetch: (url) => {
        backend.count('urlFetch');
        if (backend.catalogStatus === 'NETWORK_ERROR') {
          throw new Error('Address unavailable');
        }
        const body = JSON.stringify(backend.catalog);
        return {
          getResponseCode: () => (url === CATALOG_URL ? backend.catalogStatus : 404),
          getContentText: () => body,
          getHeaders: () => ({ 'Content-Type': 'application/json' }),
        };
      },
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => backend.properties[key] || null,
      }),
    },
    Utilities: {
      getUuid: () => `uuid-${++uuid}-${Math.random().toString(36).slice(2, 8)}`,
      formatDate,
    },
    HtmlService: {},
  };
}

// Runs `fnName(...args)` as one Apps Script execution.
export function execute(backend, fnName, ...args) {
  const context = vm.createContext(createGlobals(backend));
  for (const script of SOURCES) script.runInContext(context);
  if (backend.rewardConfig) {
    context.__fixtureRewardConfig = backend.rewardConfig;
    vm.runInContext(
      'getEnglishRewardConfig_ = function() { return JSON.parse(JSON.stringify(__fixtureRewardConfig)); };',
      context,
    );
  }
  // Return plain objects so node:assert deepEqual works across realms.
  return JSON.parse(JSON.stringify(context[fnName](...args)));
}

// Runs an arbitrary expression inside a fresh execution context (for helper-level checks).
export function evaluate(backend, source) {
  const context = vm.createContext(createGlobals(backend));
  for (const script of SOURCES) script.runInContext(context);
  return vm.runInContext(source, context);
}

export function learningEvents(backend) {
  const [headers, ...rows] = backend.sheets.learning_events.rows;
  return rows.map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i]])));
}
