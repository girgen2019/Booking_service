import { OverdueReservation, Reservation, ReservationData } from '../../Interfases/interfaces';
import { ConflictError, NotFoundError } from '../errors/app-errors';
import { BooksRepository } from '../repositories/books.repository';
import { ReservationsRepository } from '../repositories/reservations.repository';
import { today } from '../lib/dates';

export interface Availability {
  bookId: number;
  from: string;
  to: string;
  available: boolean;
  conflicts: Reservation[];
}

export type ReturnedReservation = Reservation & { late: boolean };

// Правила брони: даты одной книги не пересекаются; выдать можно только active и только в её даты;
// вернуть — только issued; отменить — только active.
// clock — откуда брать «сегодня»; в тестах подставляется любой день
export class ReservationsService {
  constructor(
    private readonly reservations: ReservationsRepository,
    private readonly books: BooksRepository,
    private readonly clock: () => string = today
  ) {}

  async create(data: ReservationData): Promise<Reservation> {
    await this.requireBook(data.bookId);
    // Понятный ответ, с какой бронью пересеклись. Окончательно двойную бронь запрещает база (миграция 005)
    const conflicts = await this.reservations.findOverlapping(data.bookId, data.startDate, data.endDate);
    if (conflicts.length > 0) {
      const message = 'Book is already reserved for these dates';
      throw new ConflictError(message, { message, conflicts });
    }
    return this.reservations.create(data);
  }

  async availability(bookId: number, from: string, to: string): Promise<Availability> {
    await this.requireBook(bookId);
    const conflicts = await this.reservations.findOverlapping(bookId, from, to);
    return { bookId, from, to, available: conflicts.length === 0, conflicts };
  }

  list(bookId?: number): Promise<Reservation[]> {
    return this.reservations.findAll(bookId);
  }

  overdue(): Promise<OverdueReservation[]> {
    return this.reservations.findOverdue(this.clock());
  }

  async get(id: number): Promise<Reservation> {
    const reservation = await this.reservations.findById(id);
    if (!reservation) throw new NotFoundError('Reservation not found');
    return reservation;
  }

  async cancel(id: number): Promise<Reservation> {
    const { status } = await this.get(id);
    if (status === 'cancelled') throw new ConflictError('Reservation is already cancelled');
    // Книга уже у читателя: бронь нельзя просто отменить
    if (status === 'issued') throw new ConflictError('Book is already issued, the reservation cannot be cancelled');
    if (status === 'returned') throw new ConflictError('Book is already returned');

    const cancelled = await this.reservations.markCancelled(id);
    // Между проверкой и отменой бронь успели выдать или отменить другим запросом
    if (!cancelled) throw new ConflictError('Reservation is no longer active');
    return cancelled;
  }

  async issue(id: number): Promise<Reservation> {
    const existing = await this.get(id);
    if (existing.status === 'cancelled') throw new ConflictError('Reservation is cancelled');
    if (existing.status === 'issued') throw new ConflictError('Book is already issued');
    if (existing.status === 'returned') throw new ConflictError('Book is already returned');
    const now = this.clock();
    if (now < existing.start_date) throw new ConflictError(`Reservation starts on ${existing.start_date}`);
    if (now > existing.end_date) throw new ConflictError(`Reservation ended on ${existing.end_date}`);

    const issued = await this.reservations.markIssued(id);
    // Между проверкой и выдачей бронь успели выдать или отменить другим запросом
    if (!issued) throw new ConflictError('Reservation is no longer active');
    return issued;
  }

  async returnBook(id: number): Promise<ReturnedReservation> {
    const { status } = await this.get(id);
    if (status === 'returned') throw new ConflictError('Book is already returned');
    if (status !== 'issued') throw new ConflictError(`Book was not issued (reservation is ${status})`);

    const returned = await this.reservations.markReturned(id);
    // Между проверкой и возвратом книгу успели вернуть другим запросом
    if (!returned) throw new ConflictError('Book is already returned');
    // Вернули позже последнего дня брони — просрочка
    return { ...returned, late: this.clock() > returned.end_date };
  }

  private async requireBook(bookId: number): Promise<void> {
    if (!(await this.books.findById(bookId))) throw new NotFoundError('Book not found');
  }
}
