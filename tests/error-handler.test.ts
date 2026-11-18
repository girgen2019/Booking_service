import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextFunction, Request, Response } from 'express';
import { errorHandler } from '../src/middleware/error-handler';
import { ConflictError, NotFoundError, ValidationError } from '../src/errors/app-errors';

// Минимальный res: запоминает статус и тело ответа
function run(error: unknown) {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(body: unknown) { this.body = body; return this; },
  };
  const req = { method: 'GET', originalUrl: '/test' } as Request;
  errorHandler(error, req, res as unknown as Response, (() => {}) as NextFunction);
  return { status: res.statusCode, body: res.body };
}

test('AppError subclasses become their status and { message }', () => {
  assert.deepEqual(run(new ValidationError('bad id')), { status: 400, body: { message: 'bad id' } });
  assert.deepEqual(run(new NotFoundError('Reservation not found')), { status: 404, body: { message: 'Reservation not found' } });
});

test('a custom body is sent as is', () => {
  const conflicts = [{ id: 1 }];
  assert.deepEqual(run(new ConflictError('busy', { message: 'busy', conflicts })), { status: 409, body: { message: 'busy', conflicts } });
  assert.deepEqual(run(new NotFoundError('404 Not Found', '404 Not Found')), { status: 404, body: '404 Not Found' });
});

test('broken JSON from express.json() is 400', () => {
  assert.deepEqual(run({ type: 'entity.parse.failed' }), { status: 400, body: { message: 'Request body is not valid JSON' } });
});

test('any other error is 500 without details', () => {
  assert.deepEqual(run(new Error('connection refused')), { status: 500, body: { message: 'Internal server error' } });
  assert.deepEqual(run(null), { status: 500, body: { message: 'Internal server error' } });
});
