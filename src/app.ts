/** @format */

import express, { Request, Response } from 'express';
import logger from '../utils/logger';
import chalk from 'chalk';
import { PostgresDB } from './DataBase/bd';
import { DBConnection, DBBaseCRUD, BookData, DBReservationCRUD } from '../Interfases/interfaces';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import cors from 'cors';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors())
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

const postgreDB: DBConnection & DBBaseCRUD & DBReservationCRUD = new PostgresDB();

(async () => {
  await postgreDB.connect();
  logger.info(chalk.green('Data Base was connect'));
})();

/**
 * @swagger
 * /books:
 *   get:
 *     summary: Получить все книги
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: Список всех книг
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 *       500:
 *         description: Внутренняя ошибка сервера
 */
app.get('/books', async (req: Request, res: Response) => {
  try {
    postgreDB.print();
    const allBooks = await postgreDB.readAll();
    return res.status(200).json(allBooks);
  } catch (error) {
    return res.status(500).json('Internal server error');
  }
});

/**
 * @swagger
 * /book/{id}:
 *   get:
 *     summary: Получить книгу по ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID книги
 *     responses:
 *       200:
 *         description: Книга найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: Книга не найдена
 *       500:
 *         description: Внутренняя ошибка сервера
 */
app.get('/book/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await postgreDB.readByID(id);

    if (rows.length === 0) {
      return res.status(404).json('404 Not Found');
    }
    return res.status(200).json(rows[0]);
  } catch (error) {
    return res.status(500).json('Internal server error');
  }
});

/**
 * @swagger
 * /create/book:
 *   post:
 *     summary: Создать новую книгу
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *             properties:
 *               title:
 *                 type: string
 *                 description: Название книги
 *                 example: "example"
 *               author:
 *                 type: string
 *                 description: Автор книги
 *                 example: "author example"
 *               year:
 *                 type: integer
 *                 description: Год издания
 *                 example: year
 *               price:
 *                 type: integer
 *                 nullable: true
 *                 minimum: 0
 *                 maximum: 1000000
 *                 description: Цена книги (целое число, опционально)
 *                 example: price
 *     responses:
 *       201:
 *         description: Книга успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Внутренняя ошибка сервера
 */
app.post('/create/book', async (req, res) => {
  const { title, author, year, price } = req.body;
  const MAX_VALUE = 1000000;

  if (!title || !author) {
    return res.status(400).json({ message: 'Names book need necessary' });
  }

  try {
    if (price !== undefined && typeof price !== 'number') {
      return res.status(400).json({ message: 'Price not a number' });
    }
    if (price !== undefined && !Number.isInteger(price)) {
      return res.status(400).json({ message: 'Price of book isn\'t integer' });
    }
    if (price !== undefined && price < 0) {
      return res.status(400).json({ message: 'Price cannot be negative' });
    }
    if (price !== undefined && price > MAX_VALUE) {
      return res.status(400).json({ message: 'Price out of range' });
    }

    const bookData = { title, author, year, price }
    const request = await postgreDB.create(bookData);
    return res.status(201).json(request);
  } catch (error) {
    console.error('[POST /books] error:', error);
    return res
      .status(500)
      .json({ message: 'Internal server error', error });
  }
});

/**
 * @swagger
 * /delete/book/{id}:
 *   delete:
 *     summary: Удалить книгу по ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID книги для удаления
 *     responses:
 *       200:
 *         description: Книга успешно удалена
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "George Orwell \"1984\" was deleted"
 *       404:
 *         description: Книга не найдена
 *       500:
 *         description: Внутренняя ошибка сервера
 */
app.delete('/delete/book/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { deleteBook } = await postgreDB.delete(id);

    if (!deleteBook) {
      return res.status(404).json("404 Not Found");
    }

    logger.info(chalk.bgGreen(deleteBook));
    return res.status(200).json(`${deleteBook.author} "${deleteBook.title}" was deleted`);
  } catch (error) {
    return res.status(500).json('Internal server error');
  }
});

/**
 * @swagger
 * /book/{id}:
 *   put:
 *     summary: Обновить книгу по ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID книги для обновления
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Название книги
 *                 example: "1984"
 *               author:
 *                 type: string
 *                 description: Автор книги
 *                 example: "George Orwell"
 *               year:
 *                 type: integer
 *                 description: Год издания
 *                 example: 1949
 *               price:
 *                 type: integer
 *                 nullable: true
 *                 minimum: 0
 *                 maximum: 1000000
 *                 description: Цена книги (целое число, опционально)
 *                 example: 500
 *     responses:
 *       200:
 *         description: Книга успешно обновлена
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "George Orwell \"1984\" was updated"
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Книга не найдена
 *       500:
 *         description: Внутренняя ошибка сервера
 */
app.put('/book/:id', async (req, res) => {
  const { title, author, year, price } = req.body;
  if (!title || !author) {
    return res.status(400).json({ message: 'Names book need necessary' });
  }

  try {

    const id = Number(req.params.id);
    if (price !== undefined && typeof price !== 'number') {
      return res.status(400).json({ message: 'Price not a number' });
    }
    if (price !== undefined && !Number.isInteger(price)) {
      return res.status(400).json({ message: 'Price of book isn\'t integer' });
    }
    if (price !== undefined && price < 0) {
      return res.status(400).json({ message: 'Price cannot be negative' });
    }

    const { updateBook } = await postgreDB.update(id, title)
    if (!updateBook) {
      return res.status(404).json("404 Not Found");
    }
    logger.info(chalk.bgGreen(updateBook));
    return res.status(200).json(`"${updateBook.title}" was updated`);
  } catch (error) {
    return res.status(500).json('Internal server error');

  }

})

// ================ RESERVATIONS

const MAX_CUSTOMER_NAME = 100;

// Положительное целое из пути или query (?bookId=), иначе null → 400 вместо падения базы на NaN
function parseId(value: unknown): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Настоящая дата в формате YYYY-MM-DD (2026-02-31 не пройдёт)
function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const today = () => new Date().toISOString().slice(0, 10);

function validateReservation(body: any): string | null {
  const { customerName, startDate, endDate } = body ?? {};
  if (typeof customerName !== 'string' || !customerName.trim()) return 'customerName is required';
  if (customerName.trim().length > MAX_CUSTOMER_NAME) return `customerName is longer than ${MAX_CUSTOMER_NAME} characters`;
  if (!isValidDate(startDate)) return 'startDate must be a real date in YYYY-MM-DD format';
  if (!isValidDate(endDate)) return 'endDate must be a real date in YYYY-MM-DD format';
  if (startDate < today()) return 'startDate cannot be in the past';
  if (endDate < startDate) return 'endDate cannot be before startDate';
  return null;
}

/**
 * @swagger
 * /books/{id}/reservations:
 *   post:
 *     summary: Забронировать книгу на даты
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID книги
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerName
 *               - startDate
 *               - endDate
 *             properties:
 *               customerName:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Henadzi"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Первый день брони, не в прошлом
 *                 example: "2026-12-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Последний день брони (включительно), не раньше startDate
 *                 example: "2026-12-05"
 *     responses:
 *       201:
 *         description: Бронь создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Ошибка валидации (ID, имя, даты)
 *       404:
 *         description: Книга не найдена
 *       500:
 *         description: Внутренняя ошибка сервера
 */
app.post('/books/:id/reservations', async (req, res) => {
  const bookId = parseId(req.params.id);
  if (bookId === null) {
    return res.status(400).json({ message: 'Book id must be a positive integer' });
  }
  const error = validateReservation(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  try {
    const { rows } = await postgreDB.readByID(bookId);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const { customerName, startDate, endDate } = req.body;
    const reservation = await postgreDB.createReservation({
      bookId,
      customerName: customerName.trim(),
      startDate,
      endDate,
    });
    return res.status(201).json(reservation);
  } catch (error) {
    logger.error(`[POST /books/${bookId}/reservations] ${error}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /reservations:
 *   get:
 *     summary: Список броней (все или по одной книге)
 *     tags: [Reservations]
 *     parameters:
 *       - in: query
 *         name: bookId
 *         required: false
 *         schema:
 *           type: integer
 *         description: Только брони этой книги
 *     responses:
 *       200:
 *         description: Список броней по дате начала
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: bookId не положительное целое
 *       500:
 *         description: Внутренняя ошибка сервера
 */
app.get('/reservations', async (req, res) => {
  let bookId: number | undefined;
  if (req.query.bookId !== undefined) {
    const parsed = parseId(req.query.bookId);
    if (parsed === null) {
      return res.status(400).json({ message: 'bookId must be a positive integer' });
    }
    bookId = parsed;
  }

  try {
    return res.status(200).json(await postgreDB.readReservations(bookId));
  } catch (error) {
    logger.error(`[GET /reservations] ${error}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /reservations/{id}:
 *   get:
 *     summary: Получить бронь по ID
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Бронь найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: ID не положительное целое
 *       404:
 *         description: Бронь не найдена
 *       500:
 *         description: Внутренняя ошибка сервера
 */
app.get('/reservations/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ message: 'Reservation id must be a positive integer' });
  }

  try {
    const reservation = await postgreDB.readReservationByID(id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    return res.status(200).json(reservation);
  } catch (error) {
    logger.error(`[GET /reservations/${id}] ${error}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /reservations/{id}/cancel:
 *   patch:
 *     summary: Отменить бронь
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Бронь отменена (status = cancelled), даты снова свободны
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: ID не положительное целое
 *       404:
 *         description: Бронь не найдена
 *       409:
 *         description: Бронь уже отменена
 *       500:
 *         description: Внутренняя ошибка сервера
 */
app.patch('/reservations/:id/cancel', async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ message: 'Reservation id must be a positive integer' });
  }

  try {
    const existing = await postgreDB.readReservationByID(id);
    if (!existing) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    if (existing.status === 'cancelled') {
      return res.status(409).json({ message: 'Reservation is already cancelled' });
    }
    return res.status(200).json(await postgreDB.cancelReservation(id));
  } catch (error) {
    logger.error(`[PATCH /reservations/${id}/cancel] ${error}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default app;

// 4 роута (в каждом из них, указать строку)
//  придумать боди, что будет у книги (айди, тайтл, автор, год), это гет
// утановить логгер
// исправить чалк
// перенести листенер
//  создать БД постгре, пг админ,
// миграция БД
// исполняющий файл миграция
// придумать одно поле в табл
// метод креэйт в интерфейсе у себя в параметре должен принимать, что то двугое (body)

// Почитать про архитектуру проекта Контроллер - Сервис - Репозиторий
// 1.Добавить цену в бд при миграции(с валидацией, цена с минусом, на ноль и др)
// 2.сделать СВАГГЕР
// 3.сделать put
// 4.поднять всю прилагу в ДОКЕРЕ