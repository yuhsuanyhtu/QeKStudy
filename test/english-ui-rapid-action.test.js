// TDD-005 performance / rapid-action follow-up: English page behaviour under
// slow responses, fast clicks and failures. Runs the real inline script.
import test from 'node:test';
import assert from 'node:assert/strict';
import { bootstrapData, openEnglishPage } from '../test-support/english-page-harness.js';

function loadedPage() {
  const page = openEnglishPage();
  page.respond(page.pending('apiEnglishBootstrap')[0], { ok: true, data: bootstrapData() });
  return page;
}

function answerResult(overrides = {}) {
  return {
    ok: true,
    data: {
      correct: false,
      attemptNo: 1,
      firstAttemptCorrect: false,
      rewardAmount: 0,
      reviewTarget: 'L1 / apple',
      rewardConfigured: true,
      savingPool: 0,
      todayEnglishEarned: 0,
      ...overrides,
    },
  };
}

function type(page, value) {
  page.el('answer-input').value = value;
}

test('TDD-005-UI-08 learning actions wait for bootstrap instead of opening an empty quiz', () => {
  const page = openEnglishPage();

  assert.equal(page.click('start-quiz'), false);
  assert.equal(page.click('start-flashcards'), false);
  assert.ok(page.el('quiz').classList.contains('hidden'));
  assert.match(page.el('status').textContent, /載入/);

  page.respond(page.pending('apiEnglishBootstrap')[0], { ok: true, data: bootstrapData() });
  assert.equal(page.click('start-quiz'), true);
  assert.equal(page.el('question-text').textContent, '蘋果');
});

test('TDD-005-UI-09 a pending answer blocks double submit and continue, and a late response never lands on another question', () => {
  const page = loadedPage();
  page.click('start-quiz');
  type(page, 'aple');
  page.click('submit-answer');
  page.click('submit-answer');
  assert.equal(page.callsTo('apiEnglishSubmitAnswer').length, 1);

  page.respond(page.pending('apiEnglishSubmitAnswer')[0], answerResult());
  type(page, 'apple');
  page.click('submit-answer');
  page.click('continue-question');
  page.click('retry-answer');
  assert.equal(page.callsTo('apiEnglishSubmitAnswer').length, 2);
  assert.equal(page.el('question-text').textContent, '蘋果');

  // Student leaves and starts a new round before the slow response arrives.
  page.click('quiz-back');
  page.click('start-quiz');
  page.respond(page.pending('apiEnglishSubmitAnswer')[0], answerResult({
    correct: true, attemptNo: 2, rewardAmount: 5, reviewTarget: '', savingPool: 5, todayEnglishEarned: 5,
  }));

  assert.equal(page.el('retry-correct-count').textContent, '0');
  assert.equal(page.el('first-try-count').textContent, '0');
  assert.ok(!page.el('submit-answer').classList.contains('hidden'));
  assert.equal(page.el('answer-result').textContent, '');
  assert.match(page.el('saving-pool').textContent, /\$5/);
});

test('TDD-005-UI-10 submits carry clientAttemptNo so a resend after a lost response replays instead of adding an attempt', () => {
  const page = loadedPage();
  page.click('start-quiz');
  type(page, 'aple');
  page.click('submit-answer');
  const sent = () => page.callsTo('apiEnglishSubmitAnswer').map((call) => call.args[0].clientAttemptNo);

  page.respond(page.pending('apiEnglishSubmitAnswer')[0], answerResult());
  page.click('retry-answer');
  type(page, 'apple');
  page.click('submit-answer');
  page.fail(page.pending('apiEnglishSubmitAnswer')[0]);
  page.click('submit-answer');
  page.respond(page.pending('apiEnglishSubmitAnswer')[0], answerResult({
    correct: true, attemptNo: 2, rewardAmount: 5, reviewTarget: '',
  }));
  page.click('continue-question');
  type(page, 'book');
  page.click('submit-answer');

  assert.deepEqual(sent(), [1, 2, 2, 1]);
  assert.ok(page.callsTo('apiEnglishSubmitAnswer').every((call) => !('studentId' in call.args[0])));
});

test('TDD-005-UI-11 transport, busy, persistence and content failures show different messages, none faked as PERSISTENCE_FAILED', () => {
  const messages = {};
  const scenarios = {
    transport: (page, call) => page.fail(call),
    busy: (page, call) => page.respond(call, { ok: false, error: { code: 'PERSISTENCE_BUSY', category: 'SERVER_BUSY' } }),
    persistence: (page, call) => page.respond(call, { ok: false, error: { code: 'PERSISTENCE_FAILED', category: 'PERSISTENCE' } }),
    content: (page, call) => page.respond(call, { ok: false, error: { code: 'CONTENT_HTTP_500', category: 'CONTENT' } }),
  };

  for (const [name, settle] of Object.entries(scenarios)) {
    const page = loadedPage();
    page.click('start-quiz');
    type(page, 'apple');
    page.click('submit-answer');
    settle(page, page.pending('apiEnglishSubmitAnswer')[0]);
    messages[name] = page.el('status').textContent;
    assert.ok(messages[name].length > 0, name);
    assert.equal(page.el('submit-answer').disabled, false, `${name}: student can resend`);
  }

  assert.doesNotMatch(messages.transport, /PERSISTENCE_FAILED/);
  assert.match(messages.busy, /PERSISTENCE_BUSY/);
  assert.match(messages.persistence, /PERSISTENCE_FAILED/);
  assert.match(messages.content, /CONTENT_HTTP_500/);
  assert.equal(new Set(Object.values(messages)).size, 4);
});

test('TDD-005-UI-12 a failed flashcard save is not resent on every tick; the student retries it explicitly in the same session', () => {
  const page = loadedPage();
  page.click('start-flashcards');
  for (let i = 0; i < 6; i += 1) page.tick(200);
  page.click('flashcard-next');
  for (let i = 0; i < 6; i += 1) page.tick(200);

  assert.equal(page.callsTo('apiEnglishCompleteFlashcards').length, 1);
  page.fail(page.pending('apiEnglishCompleteFlashcards')[0]);
  for (let i = 0; i < 10; i += 1) page.tick(200);
  assert.equal(page.callsTo('apiEnglishCompleteFlashcards').length, 1);

  assert.equal(page.click('flashcard-save-retry'), true);
  const calls = page.callsTo('apiEnglishCompleteFlashcards');
  assert.equal(calls.length, 2);
  assert.equal(calls[1].args[0].sessionId, calls[0].args[0].sessionId);

  page.respond(calls[1], { ok: true, data: { complete: true, rewardAmount: 3, rewardConfigured: true, savingPool: 3, todayEnglishEarned: 3 } });
  assert.match(page.el('flashcard-result').textContent, /\+\$3/);
  assert.ok(page.el('flashcard-save-retry').classList.contains('hidden'));
});
