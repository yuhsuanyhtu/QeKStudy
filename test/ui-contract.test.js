import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');

test('UI-001 提供建立家庭與新增孩子的可操作 UI', () => {
  assert.match(html, /id="family-form"/);
  assert.match(html, /id="child-form"/);
  assert.match(html, /建立家庭/);
  assert.match(html, /新增孩子/);
});

test('UI-002 驗收 UI 可切換兩個模擬家長以觀察家庭隔離', () => {
  assert.match(html, /data-parent="parent-a"/);
  assert.match(html, /data-parent="parent-b"/);
  assert.match(app, /listVisibleFamilies/);
});

test('UI-003 UI 使用同一份 family domain，而不是另做一套規則', () => {
  assert.match(app, /from '\.\/src\/family-domain\.js'/);
  assert.match(app, /createFamilyDomain\(\)/);
});
