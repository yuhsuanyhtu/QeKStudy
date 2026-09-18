import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('TDD-002-12 Apps Script adapter owns Sheet schema and lock boundary', async () => {
  const code = await readFile(
    new URL('../apps-script/Code.gs', import.meta.url),
    'utf8',
  );

  assert.match(code, /SpreadsheetApp/);
  assert.match(code, /LockService\.getScriptLock/);
  assert.match(code, /families/);
  assert.match(code, /students/);
  assert.match(code, /schema_meta/);
  assert.match(code, /schema_version/);
});
