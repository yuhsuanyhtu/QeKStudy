import test from 'node:test';
import assert from 'node:assert/strict';

async function load(path) {
  return import(new URL(path, import.meta.url));
}

function makeRepository({ failAppend = false } = {}) {
  const events = [];
  return {
    events,
    async appendLearningEvent(event) {
      if (failAppend) throw new Error('write failed');
      events.push({ ...event });
      return { ...event };
    },
    async listLearningEvents({ studentId }) {
      return events.filter((event) => event.studentId === studentId).map((event) => ({ ...event }));
    },
  };
}

const controlledStudent = {
  studentId: 'stu-controlled',
  familyId: 'fam-controlled',
};

test('TDD-005-17 learning event 一律使用 server 控制的 family_id / student_id', async () => {
  const { createLearningEventService } = await load('../src/learning/learning-event-service.js');
  const repository = makeRepository();
  const service = createLearningEventService({
    repository,
    resolveControlledStudent: async () => ({ ...controlledStudent }),
    idFactory: () => 'evt-1',
    now: () => '2026-09-18T12:00:00.000Z',
  });

  const result = await service.recordLearningEvent({
    studentId: 'stu-malicious',
    familyId: 'fam-malicious',
    eventType: 'ANSWER_ATTEMPT',
    subject: 'ENGLISH',
    sessionId: 'sess-1',
    contentId: 'q1',
    attemptNo: 1,
    correct: true,
    firstAttemptCorrect: true,
    rewardAmount: 5,
  });

  assert.equal(result.ok, true);
  assert.equal(repository.events[0].studentId, 'stu-controlled');
  assert.equal(repository.events[0].familyId, 'fam-controlled');
});

test('TDD-005-18 每次作答都可以寫入 learning_events', async () => {
  const { createLearningEventService } = await load('../src/learning/learning-event-service.js');
  const repository = makeRepository();
  let n = 0;
  const service = createLearningEventService({
    repository,
    resolveControlledStudent: async () => ({ ...controlledStudent }),
    idFactory: () => `evt-${++n}`,
    now: () => '2026-09-18T12:00:00.000Z',
  });

  await service.recordLearningEvent({
    eventType: 'ANSWER_ATTEMPT',
    subject: 'ENGLISH',
    sessionId: 'sess-1',
    contentId: 'q1',
    attemptNo: 1,
    correct: false,
    firstAttemptCorrect: false,
    rewardAmount: 0,
    reviewTarget: '二上 Unit 2 / irregular verbs',
  });
  await service.recordLearningEvent({
    eventType: 'ANSWER_ATTEMPT',
    subject: 'ENGLISH',
    sessionId: 'sess-1',
    contentId: 'q1',
    attemptNo: 2,
    correct: true,
    firstAttemptCorrect: false,
    rewardAmount: 2,
  });

  assert.equal(repository.events.length, 2);
  assert.equal(repository.events[0].correct, false);
  assert.equal(repository.events[1].correct, true);
  assert.equal(repository.events[1].firstAttemptCorrect, false);
});

test('TDD-005-19 persistence 失敗不能回報學習紀錄成功', async () => {
  const { createLearningEventService } = await load('../src/learning/learning-event-service.js');
  const service = createLearningEventService({
    repository: makeRepository({ failAppend: true }),
    resolveControlledStudent: async () => ({ ...controlledStudent }),
    idFactory: () => 'evt-1',
    now: () => '2026-09-18T12:00:00.000Z',
  });

  const result = await service.recordLearningEvent({
    eventType: 'ANSWER_ATTEMPT',
    subject: 'ENGLISH',
    sessionId: 'sess-1',
    contentId: 'q1',
    attemptNo: 1,
    correct: true,
    firstAttemptCorrect: true,
    rewardAmount: 5,
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'PERSISTENCE_FAILED');
});

test('TDD-005-20 saving pool 可以從 learning_events 的 reward_amount 重算', async () => {
  const { calculateSavingPool } = await load('../src/learning/learning-event-service.js');

  const savingPool = calculateSavingPool([
    { rewardAmount: 5 },
    { rewardAmount: 0 },
    { rewardAmount: 3 },
  ]);

  assert.equal(savingPool, 8);
});

test('TDD-005-21 每日英文已賺金額只計同學生、同日、英文的 reward_amount', async () => {
  const { calculateDailySubjectEarned } = await load('../src/learning/learning-event-service.js');

  const total = calculateDailySubjectEarned({
    events: [
      { studentId: 'stu-a', subject: 'ENGLISH', occurredAt: '2026-09-18T01:00:00.000Z', rewardAmount: 5 },
      { studentId: 'stu-a', subject: 'ENGLISH', occurredAt: '2026-09-18T02:00:00.000Z', rewardAmount: 3 },
      { studentId: 'stu-a', subject: 'MATH', occurredAt: '2026-09-18T03:00:00.000Z', rewardAmount: 20 },
      { studentId: 'stu-b', subject: 'ENGLISH', occurredAt: '2026-09-18T04:00:00.000Z', rewardAmount: 99 },
      { studentId: 'stu-a', subject: 'ENGLISH', occurredAt: '2026-09-17T23:00:00.000Z', rewardAmount: 10 },
    ],
    studentId: 'stu-a',
    subject: 'ENGLISH',
    date: '2026-09-18',
  });

  assert.equal(total, 8);
});

test('TDD-005-22 歷史成功次數可以依 student_id + content_id 重算', async () => {
  const { countSuccessfulHistory } = await load('../src/learning/learning-event-service.js');

  const count = countSuccessfulHistory({
    events: [
      { studentId: 'stu-a', contentId: 'q1', correct: true },
      { studentId: 'stu-a', contentId: 'q1', correct: false },
      { studentId: 'stu-a', contentId: 'q1', correct: true },
      { studentId: 'stu-a', contentId: 'q2', correct: true },
      { studentId: 'stu-b', contentId: 'q1', correct: true },
    ],
    studentId: 'stu-a',
    contentId: 'q1',
  });

  assert.equal(count, 2);
});

test('TDD-005-23 learning event 需要可追溯的會考來源與複習方向', async () => {
  const { createLearningEventService } = await load('../src/learning/learning-event-service.js');
  const repository = makeRepository();
  const service = createLearningEventService({
    repository,
    resolveControlledStudent: async () => ({ ...controlledStudent }),
    idFactory: () => 'evt-cap',
    now: () => '2026-09-18T12:00:00.000Z',
  });

  await service.recordLearningEvent({
    eventType: 'ANSWER_ATTEMPT',
    subject: 'ENGLISH',
    sessionId: 'sess-cap',
    contentId: 'cap-113-21',
    questionSourceType: 'CAP',
    attemptNo: 1,
    correct: false,
    firstAttemptCorrect: false,
    rewardAmount: 0,
    reviewTarget: '過去式 / irregular verbs',
    sourceRef: '113 年國中教育會考英語第 21 題',
  });

  assert.equal(repository.events[0].reviewTarget, '過去式 / irregular verbs');
  assert.match(repository.events[0].sourceRef, /113/);
  assert.match(repository.events[0].sourceRef, /21/);
});
