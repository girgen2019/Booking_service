import { Request, Response } from 'express';
import { BookData } from '../../Interfases/interfaces';
import { ValidationError } from '../errors/app-errors';
import { BooksService } from '../services/books.service';
import { validateBook } from '../validation/books.validation';
import { requireId } from '../validation/common';

const BAD_ID = 'Book id must be a positive integer';

// HTTP ⇄ сервис: достать данные из запроса, проверить формат, выбрать статус ответа.
// Ошибки не ловим — их переводит в ответ errorHandler
export function booksController(service: BooksService) {
  return {
    async list(_req: Request, res: Response): Promise<void> {
      res.status(200).json(await service.list());
    },

    async get(req: Request, res: Response): Promise<void> {
      res.status(200).json(await service.get(requireId(req.params.id, BAD_ID)));
    },

    async create(req: Request, res: Response): Promise<void> {
      res.status(201).json(await service.create(bookFrom(req.body)));
    },

    async update(req: Request, res: Response): Promise<void> {
      const book = await service.update(requireId(req.params.id, BAD_ID), bookFrom(req.body));
      res.status(200).json(`"${book.title}" was updated`);
    },

    async remove(req: Request, res: Response): Promise<void> {
      const book = await service.remove(requireId(req.params.id, BAD_ID));
      res.status(200).json(`${book.author} "${book.title}" was deleted`);
    },
  };
}

function bookFrom(body: any): BookData {
  const error = validateBook(body);
  if (error) throw new ValidationError(error);
  const { title, author, year, price } = body;
  return { title, author, year, price };
}
