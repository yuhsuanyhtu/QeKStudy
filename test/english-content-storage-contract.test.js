import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const catalogText = await readFile(
  new URL('../data/english/catalog.json', import.meta.url),
  'utf8',
);
const catalog = JSON.parse(catalogText);
const logic = await readFile(
  new URL('../apps-script/EnglishLogic.gs', import.meta.url),
  'utf8',
);
const code = await readFile(
  new URL('../apps-script/Code.gs', import.meta.url),
  'utf8',
);
const rewardConfig = await readFile(
  new URL('../apps-script/EnglishRewardConfig.gs', import.meta.url),
  'utf8',
);

test('TDD-005-CONTENT-01 English learning content lives in repo JSON', () => {
  assert.ok(catalog.catalogVersion);
  assert.ok(catalog.lesson);
  assert.ok(Array.isArray(catalog.questions));
});

test('TDD-005-CONTENT-02 every lesson/question revision is explicit for historical traceability', () => {
  assert.ok(catalog.lesson.lessonId);
  assert.ok(Number(catalog.lesson.revision) >= 1);
  for (const word of catalog.lesson.words) {
    assert.ok(word.wordId);
    assert.ok(Number(word.revision) >= 1);
  }
  for (const question of catalog.questions) {
    assert.ok(question.questionId);
    assert.ok(Number(question.revision) >= 1);
  }
});

test('TDD-005-CONTENT-03 unfinished CAP placeholder cannot enter active student quiz', () => {
  const placeholder = catalog.questions.find((q) => q.source?.type === 'PLACEHOLDER');
  assert.ok(placeholder);
  assert.equal(placeholder.active, false);
});

test('TDD-005-CONTENT-04 Apps Script fetches catalog from repo instead of hardcoding questions', () => {
  assert.match(logic, /raw\.githubusercontent\.com\/yuhsuanyhtu\/QeKStudy\/main\/data\/english\/catalog\.json/);
  assert.match(logic, /UrlFetchApp\.fetch/);
  assert.match(logic, /catalogVersion/);
});

test('TDD-005-CONTENT-05 browser cannot call a generic API that chooses rewardAmount', async () => {
  assert.doesNotMatch(code + logic, /function\s+apiEnglishRecordLearningEvent\s*\(/);
  assert.match(logic, /function\s+apiEnglishSubmitAnswer\s*\(/);
  assert.match(logic, /function\s+apiEnglishCompleteFlashcards\s*\(/);

  await assert.rejects(
    access(new URL('../apps-script/EnglishContent.gs', import.meta.url)),
  );
});


test('TDD-005-CONTENT-06 active quiz filters inactive revisions but server lookup keeps exact old revisions available', () => {
  assert.match(logic, /function\s+activeEnglishQuestions_/);
  assert.match(logic, /question\.active\s*!==\s*false/);
  assert.match(logic, /function\s+findEnglishQuestionRevision_/);
  assert.match(logic, /question\.questionId\s*===\s*questionId/);
  assert.match(logic, /Number\(question\.revision\)\s*===\s*Number\(revision\)/);
});


test('TDD-005-CONTENT-07 unapproved allowance amounts are not enabled in deployed config', () => {
  assert.match(rewardConfig, /configured:\s*false/);
  assert.match(rewardConfig, /dailyCap:\s*null/);
  assert.match(rewardConfig, /flashcardLessonCompletion:\s*null/);
});


test('TDD-005-CONTENT-08 catalog URL is not a top-level const that can collide in Apps Script global scope', () => {
  assert.doesNotMatch(logic, /const\s+QEK_ENGLISH_CATALOG_URL/);
  assert.match(logic, /function\s+englishCatalogUrl_\s*\(/);
});
