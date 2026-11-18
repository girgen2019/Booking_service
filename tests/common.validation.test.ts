import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseId, requireId } from '../src/validation/common';
import { ValidationError } from '../src/errors/app-errors';

test('parseId returns positive integers', () => {
  assert.equal(parseId('5'), 5);
  assert.equal(parseId(12), 12);
});

test('parseId returns null for anything else', () => {
  for (const value of ['0', '-1', '1.5', 'abc', '', undefined, null]) {
    assert.equal(parseId(value), null, `${value} should not be an id`);
  }
});

test('requireId throws a 400 ValidationError with the given message', () => {
  assert.equal(requireId('3', 'bad id'), 3);
  assert.throws(
    () => requireId('abc', 'bad id'),
    (error: unknown) => error instanceof ValidationError && error.status === 400 && error.message === 'bad id'
  );
});
