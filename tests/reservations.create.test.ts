import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ReservationsService } from '../src/services/reservations.service';
import { ConflictError, NotFoundError } from '../src/errors/app-errors';
import { book, FakeBooksRepository, FakeReservationsRepository, reservation } from './fakes';

// Книга 1 уже забронирована на 1–5 декабря
function setup() {
  const reservations = new FakeReservationsRepository([reservation(1, 1, '2026-12-01', '2026-12-05')]);
  const service = new ReservationsService(reservations, new FakeBooksRepository([book(1)]), () => '2026-11-20');
  return { service, reservations };
}

const request = (startDate: string, endDate: string, bookId = 1) => ({ bookId, customerName: 'Henadzi', startDate, endDate });

test('a book that does not exist cannot be reserved', async () => {
  const { service } = setup();
  await assert.rejects(service.create(request('2026-12-10', '2026-12-11', 99)), NotFoundError);
});

test('overlapping dates are rejected with 409 and the conflicting reservation', async () => {
  const { service } = setup();
  for (const [start, end] of [['2026-12-02', '2026-12-03'], ['2026-12-05', '2026-12-07'], ['2026-11-28', '2026-12-10']]) {
    await assert.rejects(service.create(request(start, end)), (error: unknown) => {
      assert.ok(error instanceof ConflictError);
      assert.equal(error.status, 409);
      assert.deepEqual((error.body as { conflicts: { id: number }[] }).conflicts.map((c) => c.id), [1]);
      return true;
    });
  }
});

test('the next day after a reservation is free', async () => {
  const { service } = setup();
  const created = await service.create(request('2026-12-06', '2026-12-06'));
  assert.equal(created.status, 'active');
});

test('a cancelled reservation frees its dates', async () => {
  const { service } = setup();
  await service.cancel(1);
  const created = await service.create(request('2026-12-01', '2026-12-05'));
  assert.equal(created.start_date, '2026-12-01');
});

test('availability shows whether the book is free and what blocks it', async () => {
  const { service } = setup();
  const busy = await service.availability(1, '2026-12-04', '2026-12-08');
  assert.equal(busy.available, false);
  assert.equal(busy.conflicts.length, 1);
  assert.equal((await service.availability(1, '2026-12-06', '2026-12-08')).available, true);
  await assert.rejects(service.availability(99, '2026-12-06', '2026-12-08'), NotFoundError);
});
