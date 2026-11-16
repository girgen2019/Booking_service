import { Router } from 'express';
import { reservationsController } from '../controllers/reservations.controller';
import { ReservationsService } from '../services/reservations.service';

// Пути броней и их Swagger-описание. Логики здесь нет: путь → метод контроллера
export function reservationsRouter(service: ReservationsService): Router {
  const reservations = reservationsController(service);
  const router = Router();

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
   *       409:
   *         description: Книга уже забронирована на пересекающиеся даты (conflicts — эти брони)
   *       500:
   *         description: Внутренняя ошибка сервера
   */
  router.post('/books/:id/reservations', reservations.create);

  /**
   * @swagger
   * /books/{id}/availability:
   *   get:
   *     summary: Свободна ли книга на даты
   *     tags: [Reservations]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: query
   *         name: from
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *         example: "2026-12-01"
   *       - in: query
   *         name: to
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *         example: "2026-12-05"
   *     responses:
   *       200:
   *         description: available — свободна ли книга; conflicts — активные брони на эти даты
   *       400:
   *         description: Неверный ID или даты
   *       404:
   *         description: Книга не найдена
   *       500:
   *         description: Внутренняя ошибка сервера
   */
  router.get('/books/:id/availability', reservations.availability);

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
  router.get('/reservations', reservations.list);

  // /overdue объявлен раньше /:id, иначе Express примет "overdue" за id
  /**
   * @swagger
   * /reservations/overdue:
   *   get:
   *     summary: Просроченные брони — книгу выдали и не вернули к end_date
   *     tags: [Reservations]
   *     responses:
   *       200:
   *         description: Список просрочек, самые давние сверху; days_overdue — на сколько дней просрочено
   *       500:
   *         description: Внутренняя ошибка сервера
   */
  router.get('/reservations/overdue', reservations.overdue);

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
  router.get('/reservations/:id', reservations.get);

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
   *         description: Бронь уже отменена, книга уже выдана или возвращена
   *       500:
   *         description: Внутренняя ошибка сервера
   */
  router.patch('/reservations/:id/cancel', reservations.cancel);

  /**
   * @swagger
   * /reservations/{id}/issue:
   *   patch:
   *     summary: Выдать книгу по брони (active → issued)
   *     description: Выдать можно только действующую бронь и только в её даты (start_date ≤ сегодня ≤ end_date).
   *     tags: [Reservations]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Книга выдана (status = issued, issued_at = время выдачи)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Reservation'
   *       400:
   *         description: ID не положительное целое
   *       404:
   *         description: Бронь не найдена
   *       409:
   *         description: Бронь отменена, книга уже выдана, срок брони ещё не начался или уже закончился
   *       500:
   *         description: Внутренняя ошибка сервера
   */
  router.patch('/reservations/:id/issue', reservations.issue);

  /**
   * @swagger
   * /reservations/{id}/return:
   *   patch:
   *     summary: Вернуть книгу (issued → returned)
   *     description: Вернуть можно только выданную книгу. Возврат освобождает даты брони.
   *     tags: [Reservations]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Книга возвращена (status = returned, returned_at = время возврата, late — вернули позже end_date)
   *       400:
   *         description: ID не положительное целое
   *       404:
   *         description: Бронь не найдена
   *       409:
   *         description: Книгу не выдавали (active, cancelled) или уже вернули
   *       500:
   *         description: Внутренняя ошибка сервера
   */
  router.patch('/reservations/:id/return', reservations.returnBook);

  return router;
}
