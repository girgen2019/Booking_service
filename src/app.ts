/** @format */

import express from 'express';
import logger from '../utils/logger';
import chalk from 'chalk';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import cors from 'cors';
import { createPool } from './db/pool';
import { errorHandler } from './middleware/error-handler';
import { PgBooksRepository } from './repositories/books.repository';
import { PgReservationsRepository } from './repositories/reservations.repository';
import { booksRouter } from './routes/books.routes';
import { reservationsRouter } from './routes/reservations.routes';
import { BooksService } from './services/books.service';
import { ReservationsService } from './services/reservations.service';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors())
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

const pool = createPool();

(async () => {
  await pool.query('SELECT 1');
  logger.info(chalk.green('Data Base was connect'));
})();

const booksRepository = new PgBooksRepository(pool);
app.use(booksRouter(new BooksService(booksRepository)));
app.use(reservationsRouter(new ReservationsService(new PgReservationsRepository(pool), booksRepository)));

app.use(errorHandler);

export default app;
