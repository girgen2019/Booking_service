import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_PRICE, validateBook } from '../src/validation/books.validation';

test('a book with title and author is valid, price is optional', () => {
  assert.equal(validateBook({ title: '1984', author: 'George Orwell' }), null);
  assert.equal(validateBook({ title: '1984', author: 'George Orwell', year: 1949, price: 0 }), null);
  assert.equal(validateBook({ title: '1984', author: 'George Orwell', price: MAX_PRICE }), null);
});

test('title and author are required', () => {
  assert.equal(validateBook({ author: 'George Orwell' }), 'Names book need necessary');
  assert.equal(validateBook({ title: '1984' }), 'Names book need necessary');
  assert.equal(validateBook(undefined), 'Names book need necessary');
});

test('price must be a whole number from 0 to MAX_PRICE', () => {
  const book = { title: '1984', author: 'George Orwell' };
  assert.equal(validateBook({ ...book, price: '500' }), 'Price not a number');
  assert.equal(validateBook({ ...book, price: null }), 'Price not a number');
  assert.equal(validateBook({ ...book, price: 9.99 }), "Price of book isn't integer");
  assert.equal(validateBook({ ...book, price: -1 }), 'Price cannot be negative');
  assert.equal(validateBook({ ...book, price: MAX_PRICE + 1 }), 'Price out of range');
});
