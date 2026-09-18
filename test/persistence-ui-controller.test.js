import test from 'node:test';
import assert from 'node:assert/strict';

import { createPersistenceUiController } from '../src/persistence-ui-controller.js';

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

test('TDD-002-10 UI stays saving until server acknowledgement', async () => {
  const request = deferred();
  const calls = [];

  const controller = createPersistenceUiController({
    service: {
      createFamily: () => request.promise,
    },
    view: {
      setSaving: (value) => calls.push(['saving', value]),
      showFamily: (family) => calls.push(['family', family]),
      showError: (error) => calls.push(['error', error]),
    },
  });

  const pending = controller.createFamily({
    principal: { parentId: 'parent-a' },
    displayName: 'Family A',
  });

  assert.deepEqual(calls, [['saving', true]]);

  request.resolve({
    ok: true,
    data: {
      family: {
        familyId: 'fam-1',
        displayName: 'Family A',
      },
    },
  });

  await pending;

  assert.deepEqual(calls, [
    ['saving', true],
    ['family', { familyId: 'fam-1', displayName: 'Family A' }],
    ['saving', false],
  ]);
});

test('TDD-002-11 UI failure shows error and does not add family', async () => {
  const calls = [];

  const controller = createPersistenceUiController({
    service: {
      async createFamily() {
        return {
          ok: false,
          error: { code: 'PERSISTENCE_FAILED' },
        };
      },
    },
    view: {
      setSaving: (value) => calls.push(['saving', value]),
      showFamily: (family) => calls.push(['family', family]),
      showError: (error) => calls.push(['error', error.code]),
    },
  });

  await controller.createFamily({
    principal: { parentId: 'parent-a' },
    displayName: 'Family A',
  });

  assert.deepEqual(calls, [
    ['saving', true],
    ['error', 'PERSISTENCE_FAILED'],
    ['saving', false],
  ]);
});
