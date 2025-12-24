/** @format */

import express, { Request, Response } from 'express';
import logger from '../utils/logger';
import chalk from 'chalk';
import { PostgresDB } from './DataBase/bd';
import { DBConnection, DBBaseCRUD, BookData } from '../Interfases/interfaces';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import cors from 'cors';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors())
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

const postgreDB: DBConnection & DBBaseCRUD = new PostgresDB();

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