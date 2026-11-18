import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ReservationsService } from '../src/services/reservations.service';
import { ConflictError } from '../src/errors/app-errors';
import { ReservationStatus } from '../Interfases/interfaces';
import { book, FakeBooksRepository, FakeReservationsRepository, reservation } from './fakes';

// Бронь 1 на 1–5 декабря в заданном статусе; «сегодня» — clock
function setup(today: string, status: ReservationStatus = 'active') {
  const reservations = new FakeReservationsRepository([reservation(1, 1, '2026-12-01', '2026-12-05', status)]);
  return new ReservationsService(reservations, new FakeBooksRepository([book(1)]), () => today);
}

const conflict = (message: string) => (error: unknown) =>
  error instanceof ConflictError && error.status === 409 && error.message === message;

test('an active reservation is issued within its dates', async () => {
  const issued = await setup('2026-12-03').issue(1);
  assert.equal(issued.status, 'issued');
  assert.ok(issued.issued_at);
});

test('a book cannot be issued before or after the reservation dates', async () => {
  await assert.rejects(setup('2026-11-30').issue(1), conflict('Reservation starts on 2026-12-01'));
  await assert.rejects(setup('2026-12-06').issue(1), conflict('Reservation ended on 2026-12-05'));
});

test('issue is refused for cancelled, issued and returned reservations', async () => {
  await assert.rejects(setup('2026-12-03', 'cancelled').issue(1), conflict('Reservation is cancelled'));
  await assert.rejects(setup('2026-12-03', 'issued').issue(1), conflict('Book is already issued'));
  await assert.rejects(setup('2026-12-03', 'returned').issue(1), conflict('Book is already returned'));
});

test('two parallel issues of the same reservation: exactly one succeeds', async () => {
  const service = setup('2026-12-03');
  const results = await Promise.allSettled([service.issue(1), service.issue(1)]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(results.filter((r) => r.status === 'rejected' && r.reason instanceof ConflictError).length, 1);
});

test('only an active reservation can be cancelled', async () => {
  assert.equal((await setup('2026-11-20').cancel(1)).status, 'cancelled');
  await assert.rejects(setup('2026-11-20', 'cancelled').cancel(1), conflict('Reservation is already cancelled'));
  await assert.rejects(setup('2026-12-03', 'issued').cancel(1), conflict('Book is already issued, the reservation cannot be cancelled'));
});

test('return: on time is not late, after end_date is late', async () => {
  assert.equal((await setup('2026-12-05', 'issued').returnBook(1)).late, false);
  const lateReturn = await setup('2026-12-08', 'issued').returnBook(1);
  assert.equal(lateReturn.status, 'returned');
  assert.equal(lateReturn.late, true);
});

test('a book that was not issued or is already returned cannot be returned', async () => {
  await assert.rejects(setup('2026-12-03').returnBook(1), conflict('Book was not issued (reservation is active)'));
  await assert.rejects(setup('2026-12-03', 'returned').returnBook(1), conflict('Book is already returned'));
});

test('overdue lists issued books after end_date with days_overdue', async () => {
  assert.deepEqual(await setup('2026-12-05', 'issued').overdue(), []);
  const overdue = await setup('2026-12-08', 'issued').overdue();
  assert.equal(overdue.length, 1);
  assert.equal(overdue[0].days_overdue, 3);
});
