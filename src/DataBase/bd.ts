/** @format */

import { Pool, PoolConfig, types } from 'pg';
import {
  DBBaseCRUD,
  DBConnection,
  BookData,
  DBReservationCRUD,
  Reservation,
  ReservationData,
} from '../../Interfases/interfaces';
import logger from '../../utils/logger';
import chalk from 'chalk';

// DATE отдаём как есть ('2026-12-01'), иначе pg превращает его в Date и сдвигает на часовой пояс
types.setTypeParser(1082, (value: string) => value);

export class PostgresDB implements DBConnection, DBBaseCRUD, DBReservationCRUD {
  private pool: Pool;
  constructor(
    private user = process.env.DB_USER,
    private host = process.env.DB_HOST,
    private database = process.env.DB_NAME,
    private password = process.env.DB_PASSWORD,
    private port = parseInt(process.env.DB_PORT || '5432')
  ) {
    const dbConfig: PoolConfig = {
      user: this.user,
      host: this.host,
      database: this.database,
      password: this.password,
      port: this.port,
    };
    this.pool = new Pool(dbConfig);
  }

  print(): void {
    console.log(this.password);
    console.log(this.user);
    console.log(this.database);
    console.log(this.port);
    console.log(this.host);
  }

  async connect() {
    await this.pool.connect();
  }

  async create(bookData: BookData) {
    const { title, author, year, price } = bookData
    console.log('bookData', bookData);

    const { rows } = await this.pool.query(
      `INSERT INTO public.books (title, author, year, price)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, author, year, price`,
      [title, author, year ?? null, price ?? null])
    logger.info(chalk.bgBlue(title, author, year))
    return rows[0]
  }

  async readByID(id: number) {
    const { rows } = await this.pool.query('SELECT * FROM books WHERE id = $1', [id]);
    return { rows };
  }

  async readAll() {
    const allBooks = await this.pool.query(
      'SELECT * FROM books ORDER BY id ASC'
    );
    logger.info(chalk.greenBright(JSON.stringify(allBooks.rows)))
    return allBooks.rows;
  }

  async update(id: number, newTitle: string) {
    const { rows } = await this.pool.query('UPDATE books SET title = $1 WHERE id = $2 RETURNING *', [newTitle, id])
    if (rows.length === 0) {
      logger.warn(chalk.yellow(`Book with id ${id} not found for updating.`));
      return { updateBook: null };
    }
    logger.info(chalk.bgBlue(id))
    return { updateBook: rows[0] };
  }

  async delete(id: number) {
    const { rows } = await this.pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [id]);
    if (rows.length === 0) {
      logger.warn(chalk.yellow(`Book with id ${id} not found for deletion.`));
      return { deleteBook: null };
    }
    logger.info(chalk.bgBlue(id))
    return { deleteBook: rows[0] };
  }

  async createReservation(data: ReservationData): Promise<Reservation> {
    const { bookId, customerName, startDate, endDate } = data;
    const { rows } = await this.pool.query(
      `INSERT INTO reservations (book_id, customer_name, start_date, end_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [bookId, customerName, startDate, endDate]
    );
    logger.info(chalk.bgBlue(`Book ${bookId} reserved: ${startDate} - ${endDate}`));
    return rows[0];
  }

  async readReservations(bookId?: number): Promise<Reservation[]> {
    const { rows } = bookId === undefined
      ? await this.pool.query('SELECT * FROM reservations ORDER BY start_date, id')
      : await this.pool.query('SELECT * FROM reservations WHERE book_id = $1 ORDER BY start_date, id', [bookId]);
    return rows;
  }

  async readReservationByID(id: number): Promise<Reservation | null> {
    const { rows } = await this.pool.query('SELECT * FROM reservations WHERE id = $1', [id]);
    return rows[0] ?? null;
  }

  async cancelReservation(id: number): Promise<Reservation | null> {
    const { rows } = await this.pool.query(
      `UPDATE reservations SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [id]
    );
    if (rows.length === 0) {
      logger.warn(chalk.yellow(`Reservation with id ${id} not found for cancelling.`));
      return null;
    }
    logger.info(chalk.bgBlue(`Reservation ${id} cancelled`));
    return rows[0];
  }
}
