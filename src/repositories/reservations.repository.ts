import { Pool } from 'pg';
import chalk from 'chalk';
import logger from '../../utils/logger';
import { ConflictError } from '../errors/app-errors';
import { OverdueReservation, Reservation, ReservationData } from '../../Interfases/interfaces';

const PG_EXCLUSION_VIOLATION = '23P01'; // код ошибки Postgres: нарушено ограничение EXCLUDE (двойная бронь)

export interface ReservationsRepository {
  create(data: ReservationData): Promise<Reservation>;
  findAll(bookId?: number): Promise<Reservation[]>;
  findById(id: number): Promise<Reservation | null>;
  findOverlapping(bookId: number, startDate: string, endDate: string): Promise<Reservation[]>;
  findOverdue(today: string): Promise<OverdueReservation[]>;
  markCancelled(id: number): Promise<Reservation | null>;
  markIssued(id: number): Promise<Reservation | null>;
  markReturned(id: number): Promise<Reservation | null>;
}

// Брони в PostgreSQL. Смена статуса — условный UPDATE: если статус уже другой, вернётся null.
// Так два одновременных запроса не выдадут, не вернут и не отменят одну бронь дважды
export class PgReservationsRepository implements ReservationsRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: ReservationData): Promise<Reservation> {
    const { bookId, customerName, startDate, endDate } = data;
    try {
      const { rows } = await this.pool.query(
        `INSERT INTO reservations (book_id, customer_name, start_date, end_date)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [bookId, customerName, startDate, endDate]
      );
      logger.info(chalk.bgBlue(`Book ${bookId} reserved: ${startDate} - ${endDate}`));
      return rows[0];
    } catch (error: any) {
      // Два одновременных запроса прошли проверку в сервисе, второй остановило ограничение reservations_no_overlap
      if (error?.code === PG_EXCLUSION_VIOLATION) {
        throw new ConflictError('Book is already reserved for these dates');
      }
      throw error;
    }
  }

  async findAll(bookId?: number): Promise<Reservation[]> {
    const { rows } = bookId === undefined
      ? await this.pool.query('SELECT * FROM reservations ORDER BY start_date, id')
      : await this.pool.query('SELECT * FROM reservations WHERE book_id = $1 ORDER BY start_date, id', [bookId]);
    return rows;
  }

  async findById(id: number): Promise<Reservation | null> {
    const { rows } = await this.pool.query('SELECT * FROM reservations WHERE id = $1', [id]);
    return rows[0] ?? null;
  }

  // Действующие брони книги (active или issued), которые пересекаются с датами [startDate, endDate]
  async findOverlapping(bookId: number, startDate: string, endDate: string): Promise<Reservation[]> {
    const { rows } = await this.pool.query(
      `SELECT * FROM reservations
       WHERE book_id = $1 AND status IN ('active', 'issued')
         AND daterange(start_date, end_date, '[]') && daterange($2::date, $3::date, '[]')
       ORDER BY start_date`,
      [bookId, startDate, endDate]
    );
    return rows;
  }

  // Выданные книги, у которых последний день брони уже прошёл; самые давние сверху
  async findOverdue(today: string): Promise<OverdueReservation[]> {
    const { rows } = await this.pool.query(
      `SELECT *, ($1::date - end_date) AS days_overdue
       FROM reservations
       WHERE status = 'issued' AND end_date < $1::date
       ORDER BY end_date, id`,
      [today]
    );
    return rows;
  }

  markCancelled(id: number): Promise<Reservation | null> {
    return this.changeStatus(id, 'active', `status = 'cancelled'`, 'cancelled');
  }

  markIssued(id: number): Promise<Reservation | null> {
    return this.changeStatus(id, 'active', `status = 'issued', issued_at = NOW()`, 'issued');
  }

  markReturned(id: number): Promise<Reservation | null> {
    return this.changeStatus(id, 'issued', `status = 'returned', returned_at = NOW()`, 'returned');
  }

  // set — константа из методов выше, не данные пользователя
  private async changeStatus(id: number, from: string, set: string, action: string): Promise<Reservation | null> {
    const { rows } = await this.pool.query(
      `UPDATE reservations SET ${set} WHERE id = $1 AND status = $2 RETURNING *`,
      [id, from]
    );
    if (rows.length === 0) {
      logger.warn(chalk.yellow(`Reservation ${id} was not ${action}: it is not ${from}`));
      return null;
    }
    logger.info(chalk.bgBlue(`Reservation ${id} ${action}`));
    return rows[0];
  }
}
