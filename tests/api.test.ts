import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { createApp } from '../src/app';
import { BooksService } from '../src/services/books.service';
import { ReservationsService } from '../src/services/reservations.service';
import { book, FakeBooksRepository, FakeReservationsRepository } from './fakes';

// Настоящий Express (маршруты, контроллеры, errorHandler) поверх репозиториев в памяти
let server: Server;
let base: string;

before(async () => {
  const books = new FakeBooksRepository([book(1, '1984')]);
  const app = createApp({
    books: new BooksService(books),
    reservations: new ReservationsService(new FakeReservationsRepository(), books),
  });
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://localhost:${(server.address() as AddressInfo).port}`;
});

after(() => server.close());

async function call(method: string, path: string, body?: unknown, raw?: string) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
  return { status: res.status, body: await res.json() };
}

test('GET /books and GET /book/:id', async () => {
  assert.equal((await call('GET', '/books')).body.length, 1);
  assert.deepEqual(await call('GET', '/book/1').then((r) => [r.status, r.body.title]), [200, '1984']);
});

test('invalid id is 400, missing book is 404', async () => {
  assert.deepEqual(await call('GET', '/book/abc'), { status: 400, body: { message: 'Book id must be a positive integer' } });
  assert.deepEqual(await call('GET', '/book/99'), { status: 404, body: '404 Not Found' });
  assert.equal((await call('DELETE', '/delete/book/abc')).status, 400);
});

test('broken JSON body is 400, not 500', async () => {
  assert.deepEqual(await call('POST', '/create/book', undefined, '{broken'), {
    status: 400,
    body: { message: 'Request body is not valid JSON' },
  });
});

test('reserve: 201, the same dates again: 409 with conflicts', async () => {
  const body = { customerName: 'Henadzi', startDate: '2099-01-01', endDate: '2099-01-05' };
  const first = await call('POST', '/books/1/reservations', body);
  assert.equal(first.status, 201);

  const second = await call('POST', '/books/1/reservations', { ...body, startDate: '2099-01-03' });
  assert.equal(second.status, 409);
  assert.deepEqual(second.body.conflicts.map((c: { id: number }) => c.id), [first.body.id]);
});

test('/reservations/overdue is not taken for /reservations/:id', async () => {
  assert.deepEqual(await call('GET', '/reservations/overdue'), { status: 200, body: [] });
  assert.equal((await call('GET', '/reservations/abc')).status, 400);
});

test('GET /health answers ok', async () => {
  const res = await call('GET', '/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

test('create, update and delete a book', async () => {
  const created = await call('POST', '/create/book', { title: 'Dune', author: 'Frank Herbert', year: 1965, price: 300 });
  assert.equal(created.status, 201);
  const id = created.body.id;

  assert.deepEqual(await call('PUT', `/book/${id}`, { title: 'Dune Messiah', author: 'Frank Herbert' }), {
    status: 200,
    body: '"Dune Messiah" was updated',
  });
  assert.equal((await call('GET', `/book/${id}`)).body.price, 300); // цена не передана — осталась прежней

  assert.deepEqual(await call('DELETE', `/delete/book/${id}`), { status: 200, body: 'Frank Herbert "Dune Messiah" was deleted' });
  assert.equal((await call('GET', `/book/${id}`)).status, 404);
});

test('invalid book body is 400 for create and update', async () => {
  assert.deepEqual(await call('POST', '/create/book', { title: 'Dune' }), { status: 400, body: { message: 'Names book need necessary' } });
  assert.deepEqual(await call('PUT', '/book/1', { title: 'T', author: 'A', price: -1 }), {
    status: 400,
    body: { message: 'Price cannot be negative' },
  });
});

test('GET /reservations filters by bookId and rejects a bad bookId', async () => {
  const forBook1 = await call('GET', '/reservations?bookId=1');
  assert.equal(forBook1.status, 200);
  assert.ok(forBook1.body.length > 0);
  assert.ok(forBook1.body.every((r: { book_id: number }) => r.book_id === 1));
  assert.deepEqual(await call('GET', '/reservations?bookId=2'), { status: 200, body: [] });
  assert.deepEqual(await call('GET', '/reservations?bookId=x'), {
    status: 400,
    body: { message: 'bookId must be a positive integer' },
  });
});

test('GET /books/:id/availability: free dates, wrong period is 400, missing book is 404', async () => {
  const free = await call('GET', '/books/1/availability?from=2099-06-01&to=2099-06-02');
  assert.equal(free.status, 200);
  assert.equal(free.body.available, true);
  assert.deepEqual(await call('GET', '/books/1/availability?from=2099-06-02&to=2099-06-01'), {
    status: 400,
    body: { message: 'to cannot be before from' },
  });
  assert.equal((await call('GET', '/books/1/availability?from=bad&to=2099-06-01')).status, 400);
  assert.equal((await call('GET', '/books/99/availability?from=2099-06-01&to=2099-06-02')).status, 404);
});
