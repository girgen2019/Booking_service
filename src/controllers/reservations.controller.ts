import { Request, Response } from 'express';
import { ValidationError } from '../errors/app-errors';
import { ReservationsService } from '../services/reservations.service';
import { requireId } from '../validation/common';
import { validatePeriod, validateReservation } from '../validation/reservations.validation';

const BAD_BOOK_ID = 'Book id must be a positive integer';
const BAD_ID = 'Reservation id must be a positive integer';

// HTTP ⇄ сервис: достать данные из запроса, проверить формат, выбрать статус ответа.
// Ошибки не ловим — их переводит в ответ errorHandler
export function reservationsController(service: ReservationsService) {
  return {
    async create(req: Request, res: Response): Promise<void> {
      const bookId = requireId(req.params.id, BAD_BOOK_ID);
      const error = validateReservation(req.body);
      if (error) throw new ValidationError(error);
      const { customerName, startDate, endDate } = req.body;
      const reservation = await service.create({ bookId, customerName: customerName.trim(), startDate, endDate });
      res.status(201).json(reservation);
    },

    async availability(req: Request, res: Response): Promise<void> {
      const bookId = requireId(req.params.id, BAD_BOOK_ID);
      const { from, to } = req.query;
      const error = validatePeriod(from, to);
      if (error) throw new ValidationError(error);
      res.status(200).json(await service.availability(bookId, from as string, to as string));
    },

    async list(req: Request, res: Response): Promise<void> {
      const bookId = req.query.bookId === undefined
        ? undefined
        : requireId(req.query.bookId, 'bookId must be a positive integer');
      res.status(200).json(await service.list(bookId));
    },

    async overdue(_req: Request, res: Response): Promise<void> {
      res.status(200).json(await service.overdue());
    },

    async get(req: Request, res: Response): Promise<void> {
      res.status(200).json(await service.get(requireId(req.params.id, BAD_ID)));
    },

    async cancel(req: Request, res: Response): Promise<void> {
      res.status(200).json(await service.cancel(requireId(req.params.id, BAD_ID)));
    },

    async issue(req: Request, res: Response): Promise<void> {
      res.status(200).json(await service.issue(requireId(req.params.id, BAD_ID)));
    },

    async returnBook(req: Request, res: Response): Promise<void> {
      res.status(200).json(await service.returnBook(requireId(req.params.id, BAD_ID)));
    },
  };
}
