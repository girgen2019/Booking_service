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
