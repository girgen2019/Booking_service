import { Pool, types } from 'pg';

// DATE отдаём как есть ('2026-12-01'), иначе pg превращает его в Date и сдвигает на часовой пояс
types.setTypeParser(1082, (value: string) => value);
// BIGINT/BIGSERIAL (id, book_id) pg отдаёт строкой '1'; id здесь далеко от 2^53, поэтому отдаём числом
types.setTypeParser(20, (value: string) => Number(value));

// Один пул подключений на всё приложение, настройки из .env
export function createPool(): Pool {
  return new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
  });
}
