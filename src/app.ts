/** @format */

import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import { errorHandler } from './middleware/error-handler';
import { healthRouter } from './routes/health.routes';
import { booksRouter } from './routes/books.routes';
import { reservationsRouter } from './routes/reservations.routes';
import { BooksService } from './services/books.service';
import { ReservationsService } from './services/reservations.service';

export interface AppServices {
  books: BooksService;
  reservations: ReservationsService;
}

// Собирает HTTP-приложение из готовых сервисов. Базу здесь не создаём:
// рабочие сервисы собирает server.ts, а тест может передать сервисы с подменёнными репозиториями
export function createApp(services: AppServices) {
  const app = express();
  app.use(express.json());
  app.use(cors());
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(healthRouter());

  app.use(booksRouter(services.books));
  app.use(reservationsRouter(services.reservations));

  app.use(errorHandler);
  return app;
}
