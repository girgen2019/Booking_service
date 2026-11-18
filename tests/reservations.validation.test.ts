import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_CUSTOMER_NAME, validatePeriod, validateReservation } from '../src/validation/reservations.validation';

// Даты далеко в будущем, чтобы тест не устарел
const valid = { customerName: 'Henadzi', startDate: '2099-01-01', endDate: '2099-01-05' };

test('a reservation with name and future dates is valid, one-day reservation too', () => {
  assert.equal(validateReservation(valid), null);
  assert.equal(validateReservation({ ...valid, endDate: valid.startDate }), null);
});

test('customerName is required and limited in length', () => {
  assert.equal(validateReservation({ ...valid, customerName: '   ' }), 'customerName is required');
  assert.equal(validateReservation({ ...valid, customerName: 42 }), 'customerName is required');
  assert.equal(validateReservation({ ...valid, customerName: 'x'.repeat(MAX_CUSTOMER_NAME) }), null);
  assert.equal(
    validateReservation({ ...valid, customerName: 'x'.repeat(MAX_CUSTOMER_NAME + 1) }),
    `customerName is longer than ${MAX_CUSTOMER_NAME} characters`
  );
});

test('dates must be real, not in the past, end not before start', () => {
  assert.equal(validateReservation({ ...valid, startDate: '2099-02-30' }), 'startDate must be a real date in YYYY-MM-DD format');
  assert.equal(validateReservation({ ...valid, endDate: '05.01.2099' }), 'endDate must be a real date in YYYY-MM-DD format');
  assert.equal(validateReservation({ ...valid, startDate: '2000-01-01' }), 'startDate cannot be in the past');
  assert.equal(validateReservation({ ...valid, endDate: '2098-12-31' }), 'endDate cannot be before startDate');
});

test('availability period: both dates real, to not before from', () => {
  assert.equal(validatePeriod('2099-01-01', '2099-01-01'), null);
  assert.equal(validatePeriod('2099-01-01', undefined), 'from and to must be real dates in YYYY-MM-DD format');
  assert.equal(validatePeriod('2099-01-05', '2099-01-01'), 'to cannot be before from');
});
