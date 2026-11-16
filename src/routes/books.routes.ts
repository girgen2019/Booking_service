import { Router } from 'express';
import { booksController } from '../controllers/books.controller';
import { BooksService } from '../services/books.service';

// Пути книг и их Swagger-описание. Логики здесь нет: путь → метод контроллера
export function booksRouter(service: BooksService): Router {
  const books = booksController(service);
  const router = Router();

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
  router.get('/books', books.list);

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
  router.get('/book/:id', books.get);

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
  router.post('/create/book', books.create);

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
  router.delete('/delete/book/:id', books.remove);

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
  router.put('/book/:id', books.update);

  return router;
}
