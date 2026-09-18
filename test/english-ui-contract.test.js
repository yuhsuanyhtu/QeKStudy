import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function readEnglishHtml() {
  return readFile(
    new URL('../apps-script/English.html', import.meta.url),
    'utf8',
  );
}

test('TDD-005-UI-01 English student page exists and offers flashcards plus quiz', async () => {
  const html = await readEnglishHtml();
  assert.match(html, /單字閃卡/);
  assert.match(html, /中翻英|測驗/);
});

test('TDD-005-UI-02 English page shows today earned and saving pool', async () => {
  const html = await readEnglishHtml();
  assert.match(html, /今日英文|今天英文/);
  assert.match(html, /saving pool|待領零用金/i);
});

test('TDD-005-UI-03 wrong-answer UI exposes both retry and continue choices', async () => {
  const html = await readEnglishHtml();
  assert.match(html, /再試一次/);
  assert.match(html, /繼續下一題/);
});

test('TDD-005-UI-04 result UI includes first-try, retry, unresolved and review information', async () => {
  const html = await readEnglishHtml();
  assert.match(html, /第一次.*答對/);
  assert.match(html, /重試.*答對/);
  assert.match(html, /還沒解決|未解決/);
  assert.match(html, /複習/);
});

test('TDD-005-UI-05 English page does not expose a student-id selector', async () => {
  const html = await readEnglishHtml();
  assert.equal(/name=["']studentId["']|id=["']student-id["']|data-student-id/i.test(html), false);
});
