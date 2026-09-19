// TDD-005 performance / rapid-action follow-up.
// Runs the real Apps Script sources against in-memory Google service fakes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FIXTURE_REWARD_CONFIG,
  LEARNING_HEADERS,
  createBackend,
  evaluate,
  execute,
  learningEvents,
} from '../test-support/apps-script-harness.js';

function rewardedBackend(options) {
  const backend = createBackend(options);
  backend.rewardConfig = FIXTURE_REWARD_CONFIG;
  return backend;
}

function answer(overrides = {}) {
  return {
    sessionId: 'quiz-s1',
    questionId: 'q-apple',
    revision: 1,
    answer: 'apple',
    clientAttemptNo: 1,
    ...overrides,
  };
}

function flashcards(overrides = {}) {
  return {
    sessionId: 'flash-s1',
    lessonId: 'lesson-1',
    revision: 1,
    exposureByWordId: { 'w-apple': 1200, 'w-book': 1000 },
    ...overrides,
  };
}

function row(values) {
  return LEARNING_HEADERS.map((header) => (header in values ? values[header] : ''));
}

test('TDD-005-PERF-01 overlapping answer executions cannot both take attempt 1 or both earn the reward', () => {
  const backend = rewardedBackend();
  let overlapping = null;
  // While execution A is between reading history and writing, execution B runs.
  backend.hooks['afterRead:learning_events'] = () => {
    overlapping = execute(backend, 'apiEnglishSubmitAnswer', answer());
  };

  const first = execute(backend, 'apiEnglishSubmitAnswer', answer());
  const events = learningEvents(backend);
  const attemptNos = events.map((event) => event.attempt_no);

  assert.equal(first.ok, true);
  assert.equal(new Set(attemptNos).size, attemptNos.length, 'attempt_no must be unique per session/content');
  assert.equal(events.filter((event) => Number(event.reward_amount) > 0).length, 1);
  assert.ok(overlapping, 'the overlapping execution must have run');
  if (!overlapping.ok) {
    assert.equal(overlapping.error.category, 'SERVER_BUSY');
  }
});

test('TDD-005-PERF-02 resending the same attempt (double submit / lost response) replays instead of writing again', () => {
  const backend = rewardedBackend();
  const first = execute(backend, 'apiEnglishSubmitAnswer', answer());
  const resent = execute(backend, 'apiEnglishSubmitAnswer', answer());

  assert.equal(learningEvents(backend).length, 1);
  assert.equal(resent.ok, true);
  assert.equal(resent.data.replayed, true);
  assert.equal(resent.data.attemptNo, 1);
  assert.equal(resent.data.correct, true);
  assert.equal(resent.data.rewardAmount, first.data.rewardAmount);
  assert.equal(resent.data.savingPool, 10);
});

test('TDD-005-PERF-03 retry after a wrong answer keeps first-attempt truth, even when attempt 1 is resent', () => {
  const backend = rewardedBackend();
  const wrong = execute(backend, 'apiEnglishSubmitAnswer', answer({ answer: 'aple' }));
  const resentWrong = execute(backend, 'apiEnglishSubmitAnswer', answer({ answer: 'aple' }));
  const retry = execute(backend, 'apiEnglishSubmitAnswer', answer({ clientAttemptNo: 2 }));
  const events = learningEvents(backend);

  assert.equal(wrong.data.correct, false);
  assert.equal(wrong.data.reviewTarget, 'L1 / apple');
  assert.equal(resentWrong.data.replayed, true);
  assert.equal(events.length, 2);
  assert.equal(retry.data.attemptNo, 2);
  assert.equal(retry.data.correct, true);
  assert.equal(retry.data.firstAttemptCorrect, false);
  assert.equal(retry.data.rewardAmount, 5);
  assert.deepEqual(events.map((event) => event.first_attempt_correct), [false, false]);
});

test('TDD-005-PERF-04 a question earns at most one successful reward per session', () => {
  const backend = rewardedBackend();
  execute(backend, 'apiEnglishSubmitAnswer', answer());
  const again = execute(backend, 'apiEnglishSubmitAnswer', answer({ clientAttemptNo: 2 }));

  assert.equal(again.data.attemptNo, 2);
  assert.equal(again.data.rewardAmount, 0);
  assert.equal(again.data.savingPool, 10);
});

test('TDD-005-PERF-05 browser-supplied correct / reward / identity fields are ignored', () => {
  const backend = rewardedBackend();
  const result = execute(backend, 'apiEnglishSubmitAnswer', answer({
    answer: 'wrong',
    correct: true,
    rewardAmount: 999,
    studentId: 'stu_other',
    familyId: 'fam_2',
  }));
  const [event] = learningEvents(backend);

  assert.equal(result.data.correct, false);
  assert.equal(event.correct, false);
  assert.equal(event.reward_amount, 0);
  assert.equal(event.student_id, 'stu_1');
  assert.equal(event.family_id, 'fam_1');
});

test('TDD-005-PERF-06 overlapping flashcard completions write one FLASHCARD_COMPLETE and replay its reward', () => {
  const backend = rewardedBackend();
  let overlapping = null;
  backend.hooks['afterRead:learning_events'] = () => {
    overlapping = execute(backend, 'apiEnglishCompleteFlashcards', flashcards());
  };

  const first = execute(backend, 'apiEnglishCompleteFlashcards', flashcards());
  const resent = execute(backend, 'apiEnglishCompleteFlashcards', flashcards());
  const completions = learningEvents(backend).filter((event) => event.event_type === 'FLASHCARD_COMPLETE');

  assert.equal(first.ok, true);
  assert.equal(completions.length, 1);
  assert.equal(Number(completions[0].reward_amount), 3);
  assert.equal(resent.data.replayed, true);
  assert.equal(resent.data.rewardAmount, 3);
  assert.equal(resent.data.savingPool, 3);
  assert.ok(overlapping, 'the overlapping execution must have run');
  if (!overlapping.ok) {
    assert.equal(overlapping.error.category, 'SERVER_BUSY');
  }
});

test('TDD-005-PERF-07 catalog is fetched once across executions and history is not re-read after writing', () => {
  const backend = rewardedBackend();
  execute(backend, 'apiEnglishBootstrap');
  const beforeSubmit = { ...backend.counts };
  execute(backend, 'apiEnglishSubmitAnswer', answer());

  assert.equal(backend.counts.urlFetch, 1);
  assert.equal(backend.counts['read:learning_events'] - beforeSubmit['read:learning_events'], 1);
  assert.equal(backend.counts.openById - beforeSubmit.openById, 1);

  execute(backend, 'apiEnglishSubmitAnswer', answer({ questionId: 'q-cap', answer: undefined, selectedChoiceId: 'a' }));
  assert.equal(backend.counts.urlFetch, 1);
});

test('TDD-005-PERF-08 a revision missing from the cached catalog triggers one fresh fetch', () => {
  const backend = rewardedBackend();
  execute(backend, 'apiEnglishBootstrap');

  const updated = structuredClone(backend.catalog);
  updated.catalogVersion = 'fixture.2';
  updated.questions[0].active = false;
  updated.questions.push({ ...updated.questions[0], revision: 2, active: true, acceptedAnswers: ['apple', 'an apple'] });
  backend.catalog = updated;

  const result = execute(backend, 'apiEnglishSubmitAnswer', answer({ revision: 2, answer: 'an apple' }));

  assert.equal(result.ok, true);
  assert.equal(result.data.correct, true);
  assert.equal(backend.counts.urlFetch, 2);
  assert.equal(learningEvents(backend)[0].content_id, 'q-apple@r2');
});

test('TDD-005-PERF-09 errors are categorised as content / server busy / persistence / request instead of one PERSISTENCE_FAILED', () => {
  const httpDown = rewardedBackend();
  httpDown.catalogStatus = 500;
  const content = execute(httpDown, 'apiEnglishBootstrap');
  assert.equal(content.error.code, 'CONTENT_HTTP_500');
  assert.equal(content.error.category, 'CONTENT');

  const offline = rewardedBackend();
  offline.catalogStatus = 'NETWORK_ERROR';
  assert.equal(execute(offline, 'apiEnglishBootstrap').error.category, 'CONTENT');

  const busy = rewardedBackend();
  busy.lockHeld = true;
  const busyResult = execute(busy, 'apiEnglishSubmitAnswer', answer());
  assert.equal(busyResult.ok, false);
  assert.equal(busyResult.error.category, 'SERVER_BUSY');
  assert.equal(learningEvents(busy).length, 0);

  const writeFails = rewardedBackend();
  writeFails.appendFailures.learning_events = new Error('Service Spreadsheets failed while accessing document');
  const persistence = execute(writeFails, 'apiEnglishSubmitAnswer', answer());
  assert.equal(persistence.error.code, 'PERSISTENCE_FAILED');
  assert.equal(persistence.error.category, 'PERSISTENCE');
  assert.equal(learningEvents(writeFails).length, 0);

  const quota = rewardedBackend();
  quota.hooks['afterRead:students'] = () => {
    throw new Error('Exception: Too many simultaneous invocations: Spreadsheets');
  };
  assert.equal(execute(quota, 'apiEnglishBootstrap').error.category, 'SERVER_BUSY');

  const unexpected = rewardedBackend();
  unexpected.hooks['afterRead:students'] = () => {
    throw new TypeError('Cannot read properties of undefined');
  };
  const internal = execute(unexpected, 'apiEnglishBootstrap');
  assert.notEqual(internal.error.code, 'PERSISTENCE_FAILED');
  assert.equal(internal.error.category, 'SERVER');

  const incomplete = rewardedBackend();
  const notDone = execute(incomplete, 'apiEnglishCompleteFlashcards', flashcards({ exposureByWordId: { 'w-apple': 1200 } }));
  assert.equal(notDone.error.code, 'FLASHCARD_NOT_COMPLETE');
  assert.equal(notDone.error.category, 'REQUEST');
});

test('TDD-005-PERF-10 daily English cap counts by Asia/Taipei calendar day, including early-morning events', () => {
  // 2026-09-19 08:30 in Taipei; an earlier event at 07:00 Taipei is stored as 2026-09-18T23:00Z.
  const backend = rewardedBackend({
    learningRows: [row({
      learning_event_id: 'learn_old',
      occurred_at: '2026-09-18T23:00:00.000Z',
      family_id: 'fam_1',
      student_id: 'stu_1',
      subject: 'ENGLISH',
      session_id: 'quiz-earlier',
      event_type: 'ANSWER_ATTEMPT',
      content_id: 'q-other@r1',
      attempt_no: 1,
      correct: true,
      first_attempt_correct: true,
      reward_amount: 95,
    })],
  });
  backend.now = '2026-09-19T00:30:00.000Z';

  const result = execute(backend, 'apiEnglishSubmitAnswer', answer());
  assert.equal(result.data.rewardAmount, 5);
  assert.equal(result.data.todayEnglishEarned, 100);

  // Sheets may hand back a Date object instead of the ISO text.
  const earned = evaluate(backend, `calculateDailySubjectEarned_([
    { subject: 'ENGLISH', occurredAt: new Date('2026-09-18T23:00:00.000Z'), rewardAmount: 4 },
    { subject: 'ENGLISH', occurredAt: '2026-09-18T15:59:00.000Z', rewardAmount: 50 }
  ], 'ENGLISH', '2026-09-19')`);
  assert.equal(earned, 4);
});
