import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-errors';
import logger from '../../utils/logger';

// Единственное место, где ошибка превращается в HTTP-ответ.
// Express 5 сам передаёт сюда ошибки из async-обработчиков, поэтому try/catch в маршрутах не нужен
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json(err.body);
    return;
  }
  // express.json() не смог разобрать тело запроса
  if ((err as { type?: string } | null)?.type === 'entity.parse.failed') {
    res.status(400).json({ message: 'Request body is not valid JSON' });
    return;
  }
  logger.error(`[${req.method} ${req.originalUrl}] ${err}`);
  res.status(500).json({ message: 'Internal server error' });
}
