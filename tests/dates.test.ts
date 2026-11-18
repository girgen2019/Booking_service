import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidDate, today } from '../src/lib/dates';

test('isValidDate accepts real YYYY-MM-DD dates', () => {
  assert.equal(isValidDate('2026-12-01'), true);
  assert.equal(isValidDate('2028-02-29'), true); // високосный год
});

test('isValidDate rejects impossible dates and other formats', () => {
  for (const value of ['2026-02-31', '2027-02-29', '2026-13-01', '01.12.2026', '2026-1-1', '', 20261201, null, undefined]) {
    assert.equal(isValidDate(value), false, `${value} should be invalid`);
  }
});

test('today returns the date in YYYY-MM-DD', () => {
  assert.match(today(), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(isValidDate(today()), true);
});
