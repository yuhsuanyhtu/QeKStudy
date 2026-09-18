import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const code = await readFile(
  new URL('../apps-script/Code.gs', import.meta.url),
  'utf8',
);

test('TDD-003-SCHEMA-01 Apps Script application expects schema version 2', () => {
  assert.match(code, /QEK_SCHEMA_VERSION\s*=\s*2/);
});

test('TDD-003-SCHEMA-02 Apps Script defines audit_log and deletion metadata', () => {
  assert.match(code, /audit_log/);
  assert.match(code, /deleted_at/);
  assert.match(code, /deleted_by_actor_id/);
  assert.match(code, /deleted_by_role/);
});

test('TDD-003-SCHEMA-03 Apps Script contains rename and confirmed-delete operations', () => {
  assert.match(code, /apiRenameFamily/);
  assert.match(code, /apiRenameStudent/);
  assert.match(code, /DELETE_CONFIRMATION_REQUIRED/);
});
