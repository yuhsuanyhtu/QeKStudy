import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(
  new URL('../apps-script/Index.html', import.meta.url),
  'utf8',
);

test('TDD-003-UI-01 parent demo UI exposes family rename control', () => {
  assert.match(html, /修改家庭名稱|rename family/i);
  assert.match(html, /apiRenameFamily/);
});

test('TDD-003-UI-02 parent demo UI exposes student rename control', () => {
  assert.match(html, /修改名稱|rename student/i);
  assert.match(html, /apiRenameStudent/);
});

test('TDD-003-UI-03 public demo does not expose administrator delete control before auth', () => {
  assert.doesNotMatch(html, /apiAdminDeleteFamily/);
  assert.doesNotMatch(html, /apiAdminDeleteStudent/);
});
