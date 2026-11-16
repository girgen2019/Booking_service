/** @format */
import 'dotenv/config';
import chalk from 'chalk';
import logger from '../utils/logger';
import { createApp } from './app';
import { createPool } from './db/pool';
import { PgBooksRepository } from './repositories/books.repository';
import { PgReservationsRepository } from './repositories/reservations.repository';
import { BooksService } from './services/books.service';
import { ReservationsService } from './services/reservations.service';

// Точка сборки (composition root): только здесь создаются база, репозитории и сервисы
async function main() {
  const pool = createPool();
  await pool.query('SELECT 1');
  logger.info(chalk.green('Data Base was connect'));

  const booksRepository = new PgBooksRepository(pool);
  const app = createApp({
    books: new BooksService(booksRepository),
    reservations: new ReservationsService(new PgReservationsRepository(pool), booksRepository),
  });

  const port = process.env.SERVER_PORT;
  app.listen(port, () => {
    logger.info(chalk.bold.yellow(`Server is running on port ${port}`));
  });
}

// Без базы сервер не стартует, а не падает позже на первом запросе
main().catch((error) => {
  logger.error(`Server failed to start: ${error}`);
  process.exit(1);
});
