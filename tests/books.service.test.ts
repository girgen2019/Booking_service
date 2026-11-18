import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BooksService } from '../src/services/books.service';
import { NotFoundError } from '../src/errors/app-errors';
import { book, FakeBooksRepository } from './fakes';

const isNotFound = (error: unknown) => error instanceof NotFoundError && error.status === 404;

test('list and get return books', async () => {
  const service = new BooksService(new FakeBooksRepository([book(1), book(2)]));
  assert.equal((await service.list()).length, 2);
  assert.equal((await service.get(2)).title, 'Book 2');
});

test('get, update and remove of a missing book throw NotFoundError', async () => {
  const service = new BooksService(new FakeBooksRepository([book(1)]));
  await assert.rejects(service.get(99), isNotFound);
  await assert.rejects(service.update(99, { title: 'T', author: 'A', year: 2000 }), isNotFound);
  await assert.rejects(service.remove(99), isNotFound);
});

test('create, update and remove change the catalog', async () => {
  const repo = new FakeBooksRepository();
  const service = new BooksService(repo);

  const created = await service.create({ title: '1984', author: 'George Orwell', year: 1949 });
  assert.equal(created.id, 1);

  const updated = await service.update(1, { title: 'Animal Farm', author: 'George Orwell', year: 1945 });
  assert.equal(updated.title, 'Animal Farm');

  await service.remove(1);
  assert.equal(repo.books.length, 0);
});
