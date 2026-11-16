import { ValidationError } from '../errors/app-errors';

// Положительное целое из пути или query (?bookId=), иначе null → 400 вместо падения базы на NaN
export function parseId(value: unknown): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// То же для контроллеров: вместо null сразу 400 с понятным текстом
export function requireId(value: unknown, message: string): number {
  const id = parseId(value);
  if (id === null) throw new ValidationError(message);
  return id;
}
