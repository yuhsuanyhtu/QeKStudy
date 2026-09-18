import test from 'node:test';
import assert from 'node:assert/strict';

async function load(path) {
  return import(new URL(path, import.meta.url));
}

test('TDD-005-01 單字累積可見時間滿 1000ms 才算完成', async () => {
  const { createFlashcardExposureTracker } = await load('../src/learning/flashcard-exposure.js');
  const tracker = createFlashcardExposureTracker({ wordIds: ['w1'], thresholdMs: 1000 });

  tracker.record('w1', 600, { pageVisible: true });
  assert.equal(tracker.getProgress().qualifiedCount, 0);

  tracker.record('w1', 500, { pageVisible: true });
  assert.equal(tracker.getProgress().qualifiedCount, 1);
});

test('TDD-005-02 背景分頁時間不能算進單字 1 秒', async () => {
  const { createFlashcardExposureTracker } = await load('../src/learning/flashcard-exposure.js');
  const tracker = createFlashcardExposureTracker({ wordIds: ['w1'], thresholdMs: 1000 });

  tracker.record('w1', 1200, { pageVisible: false });

  assert.equal(tracker.getProgress().qualifiedCount, 0);
});

test('TDD-005-03 每一個單字都達標才算整課完成', async () => {
  const { createFlashcardExposureTracker } = await load('../src/learning/flashcard-exposure.js');
  const tracker = createFlashcardExposureTracker({ wordIds: ['w1', 'w2'], thresholdMs: 1000 });

  tracker.record('w1', 1000, { pageVisible: true });
  assert.equal(tracker.getProgress().complete, false);

  tracker.record('w2', 1000, { pageVisible: true });
  assert.equal(tracker.getProgress().complete, true);
});

test('TDD-005-04 停在一張卡不會讓其他單字一起完成', async () => {
  const { createFlashcardExposureTracker } = await load('../src/learning/flashcard-exposure.js');
  const tracker = createFlashcardExposureTracker({ wordIds: ['w1', 'w2'], thresholdMs: 1000 });

  tracker.record('w1', 5000, { pageVisible: true });

  const progress = tracker.getProgress();
  assert.equal(progress.qualifiedCount, 1);
  assert.equal(progress.complete, false);
});

test('TDD-005-05 中翻英忽略前後空白與大小寫', async () => {
  const { evaluateZhToEn } = await load('../src/learning/answer-evaluator.js');

  assert.equal(
    evaluateZhToEn({ answer: '  APPLE ', acceptedAnswers: ['apple'] }).correct,
    true,
  );
});

test('TDD-005-06 中翻英可以接受老師事先設定的多個答案', async () => {
  const { evaluateZhToEn } = await load('../src/learning/answer-evaluator.js');

  assert.equal(
    evaluateZhToEn({
      answer: 'years old',
      acceptedAnswers: ['year old', 'years old'],
    }).correct,
    true,
  );
});

test('TDD-005-07 選擇題用固定 choiceId 判斷答案', async () => {
  const { evaluateMultipleChoice } = await load('../src/learning/answer-evaluator.js');

  assert.equal(
    evaluateMultipleChoice({
      selectedChoiceId: 'choice-b',
      correctChoiceId: 'choice-b',
    }).correct,
    true,
  );
});

test('TDD-005-08 會考題所有必要知識都學過才可以出', async () => {
  const { isQuestionEligible } = await load('../src/learning/quiz-composer.js');
  const question = {
    sourceType: 'CAP',
    prerequisiteKnowledgePointIds: ['past-tense', 'because-so'],
  };

  assert.equal(
    isQuestionEligible({
      question,
      learnedKnowledgePointIds: ['past-tense', 'because-so', 'weather-vocab'],
    }),
    true,
  );
});

test('TDD-005-09 會考題只要有一個必要知識沒學過就不能出', async () => {
  const { isQuestionEligible } = await load('../src/learning/quiz-composer.js');
  const question = {
    sourceType: 'CAP',
    prerequisiteKnowledgePointIds: ['past-tense', 'because-so'],
  };

  assert.equal(
    isQuestionEligible({
      question,
      learnedKnowledgePointIds: ['past-tense'],
    }),
    false,
  );
});

test('TDD-005-10 Demo 題組同時包含現在、舊內容與合格會考題', async () => {
  const { composeQuiz } = await load('../src/learning/quiz-composer.js');
  const questions = [
    { questionId: 'q-current', sourceType: 'CURRENT', prerequisiteKnowledgePointIds: [] },
    { questionId: 'q-prior', sourceType: 'PRIOR', prerequisiteKnowledgePointIds: [] },
    { questionId: 'q-cap', sourceType: 'CAP', prerequisiteKnowledgePointIds: ['past-tense'] },
  ];

  const result = composeQuiz({
    questions,
    learnedKnowledgePointIds: ['past-tense'],
  });

  assert.deepEqual(
    new Set(result.questions.map((q) => q.sourceType)),
    new Set(['CURRENT', 'PRIOR', 'CAP']),
  );
});

test('TDD-005-11 第一次答錯、第二次答對仍保留 firstAttemptCorrect=false', async () => {
  const { createAttemptState } = await load('../src/learning/attempt-state.js');
  const state = createAttemptState({ questionId: 'q1' });

  state.recordAttempt({ answer: 'wrong', correct: false });
  state.recordAttempt({ answer: 'right', correct: true });

  const snapshot = state.snapshot();
  assert.equal(snapshot.firstAttemptCorrect, false);
  assert.equal(snapshot.resolved, true);
  assert.equal(snapshot.attempts.length, 2);
});

test('TDD-005-12 同一題同一輪最多只會發一次答對獎勵', async () => {
  const { createAttemptState } = await load('../src/learning/attempt-state.js');
  const state = createAttemptState({ questionId: 'q1' });

  state.recordAttempt({ answer: 'right', correct: true });
  assert.equal(state.consumeRewardEligibility(), true);
  assert.equal(state.consumeRewardEligibility(), false);
});

test('TDD-005-13 難度較高可以得到較高基本獎勵', async () => {
  const { calculateReward } = await load('../src/learning/reward-engine.js');

  const easy = calculateReward({
    baseAmount: 2,
    attemptNo: 1,
    previousSuccessCount: 0,
    retryFactor: 0.5,
    repeatFactors: [1, 0.5, 0.25],
    todayEarned: 0,
    dailyCap: 100,
  });
  const hard = calculateReward({
    baseAmount: 5,
    attemptNo: 1,
    previousSuccessCount: 0,
    retryFactor: 0.5,
    repeatFactors: [1, 0.5, 0.25],
    todayEarned: 0,
    dailyCap: 100,
  });

  assert.ok(hard.awardedAmount > easy.awardedAmount);
});

test('TDD-005-14 重試答對可以比第一次答對少', async () => {
  const { calculateReward } = await load('../src/learning/reward-engine.js');

  const firstTry = calculateReward({
    baseAmount: 10,
    attemptNo: 1,
    previousSuccessCount: 0,
    retryFactor: 0.5,
    repeatFactors: [1, 0.5, 0.25],
    todayEarned: 0,
    dailyCap: 100,
  });
  const retry = calculateReward({
    baseAmount: 10,
    attemptNo: 2,
    previousSuccessCount: 0,
    retryFactor: 0.5,
    repeatFactors: [1, 0.5, 0.25],
    todayEarned: 0,
    dailyCap: 100,
  });

  assert.ok(retry.awardedAmount < firstTry.awardedAmount);
});

test('TDD-005-15 已答對過的內容重複複習獎勵遞減', async () => {
  const { calculateReward } = await load('../src/learning/reward-engine.js');

  const first = calculateReward({
    baseAmount: 10,
    attemptNo: 1,
    previousSuccessCount: 0,
    retryFactor: 0.5,
    repeatFactors: [1, 0.5, 0.25],
    todayEarned: 0,
    dailyCap: 100,
  });
  const second = calculateReward({
    baseAmount: 10,
    attemptNo: 1,
    previousSuccessCount: 1,
    retryFactor: 0.5,
    repeatFactors: [1, 0.5, 0.25],
    todayEarned: 0,
    dailyCap: 100,
  });

  assert.ok(second.awardedAmount < first.awardedAmount);
});

test('TDD-005-16 每日上限只限制獎勵，不阻止繼續學習', async () => {
  const { calculateReward } = await load('../src/learning/reward-engine.js');

  const result = calculateReward({
    baseAmount: 10,
    attemptNo: 1,
    previousSuccessCount: 0,
    retryFactor: 0.5,
    repeatFactors: [1, 0.5, 0.25],
    todayEarned: 100,
    dailyCap: 100,
  });

  assert.equal(result.awardedAmount, 0);
  assert.equal(result.learningAllowed, true);
  assert.equal(result.capReached, true);
});
