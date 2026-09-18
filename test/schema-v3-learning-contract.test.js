import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const code = await readFile(
  new URL('../apps-script/Code.gs', import.meta.url),
  'utf8',
);

test('TDD-005-SCHEMA-01 Apps Script application expects schema version 3', () => {
  assert.match(code, /QEK_SCHEMA_VERSION\s*=\s*3/);
});

test('TDD-005-SCHEMA-02 schema v3 defines learning_events worksheet', () => {
  assert.match(code, /learning_events/);
  assert.match(code, /learning_event_id/);
  assert.match(code, /family_id/);
  assert.match(code, /student_id/);
  assert.match(code, /reward_amount/);
});

test('TDD-005-SCHEMA-03 controlled student binding comes from server Script Properties', () => {
  assert.match(code, /PropertiesService/);
  assert.match(code, /QEK_CONTROLLED_STUDENT_ID/);
});

test('TDD-005-SCHEMA-04 Apps Script exposes server learning-event persistence operations', () => {
  assert.match(code, /appendLearningEvent_/);
  assert.match(code, /listLearningEventsForStudent_/);
  assert.match(code, /calculateSavingPool_/);
});

test('TDD-005-SCHEMA-05 English view is routed by Apps Script rather than replacing family demo', () => {
  assert.match(code, /view/);
  assert.match(code, /english/i);
  assert.match(code, /English/);
});
