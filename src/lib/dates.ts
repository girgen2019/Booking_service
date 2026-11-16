// Сегодня по UTC в формате YYYY-MM-DD
export const today = (): string => new Date().toISOString().slice(0, 10);

// Настоящая дата в формате YYYY-MM-DD (2026-02-31 не пройдёт)
export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
