import { isValidDate, today } from '../lib/dates';

export const MAX_CUSTOMER_NAME = 100;

// Тело запроса на бронь. null — всё в порядке, иначе текст ошибки
export function validateReservation(body: any): string | null {
  const { customerName, startDate, endDate } = body ?? {};
  if (typeof customerName !== 'string' || !customerName.trim()) return 'customerName is required';
  if (customerName.trim().length > MAX_CUSTOMER_NAME) return `customerName is longer than ${MAX_CUSTOMER_NAME} characters`;
  if (!isValidDate(startDate)) return 'startDate must be a real date in YYYY-MM-DD format';
  if (!isValidDate(endDate)) return 'endDate must be a real date in YYYY-MM-DD format';
  if (startDate < today()) return 'startDate cannot be in the past';
  if (endDate < startDate) return 'endDate cannot be before startDate';
  return null;
}

// Период ?from=&to= для проверки, свободна ли книга
export function validatePeriod(from: unknown, to: unknown): string | null {
  if (!isValidDate(from) || !isValidDate(to)) return 'from and to must be real dates in YYYY-MM-DD format';
  if (to < from) return 'to cannot be before from';
  return null;
}
