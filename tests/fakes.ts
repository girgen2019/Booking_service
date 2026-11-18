import { Book, BookData, OverdueReservation, Reservation, ReservationData, ReservationStatus } from '../Interfases/interfaces';
import { BooksRepository } from '../src/repositories/books.repository';
import { ReservationsRepository } from '../src/repositories/reservations.repository';

// Репозитории в памяти вместо PostgreSQL: сервисы и API проверяются без базы.
// Наружу отдаются копии, как из настоящей базы, чтобы тест не менял данные «за спиной» сервиса

export function book(id: number, title = `Book ${id}`): Book {
  return { id, title, author: 'Author', year: 2000, price: 100, created_at: '2026-01-01T00:00:00Z' };
}

export function reservation(id: number, bookId: number, start: string, end: string, status: ReservationStatus = 'active'): Reservation {
  return {
    id, book_id: bookId, customer_name: 'Reader', start_date: start, end_date: end, status,
    created_at: '2026-01-01T00:00:00Z', issued_at: null, returned_at: null,
  };
}

export class FakeBooksRepository implements BooksRepository {
  private nextId: number;
  constructor(public books: Book[] = []) {
    this.nextId = books.length + 1;
  }

  async findAll(): Promise<Book[]> {
    return this.books.map((b) => ({ ...b }));
  }

  async findById(id: number): Promise<Book | null> {
    const found = this.books.find((b) => b.id === id);
    return found ? { ...found } : null;
  }

  async create(data: BookData): Promise<Book> {
    const created = { ...data, id: this.nextId++, created_at: '2026-01-01T00:00:00Z' };
    this.books.push(created);
    return { ...created };
  }

  async update(id: number, data: BookData): Promise<Book | null> {
    const found = this.books.find((b) => b.id === id);
    if (!found) return null;
    Object.assign(found, { title: data.title, author: data.author, year: data.year ?? found.year, price: data.price ?? found.price });
    return { ...found };
  }

  async delete(id: number): Promise<Book | null> {
    const found = this.books.find((b) => b.id === id);
    if (!found) return null;
    this.books = this.books.filter((b) => b !== found);
    return { ...found };
  }
}

export class FakeReservationsRepository implements ReservationsRepository {
  private nextId: number;
  constructor(public reservations: Reservation[] = []) {
    this.nextId = reservations.length + 1;
  }

  async create(data: ReservationData): Promise<Reservation> {
    const created = reservation(this.nextId++, data.bookId, data.startDate, data.endDate);
    created.customer_name = data.customerName;
    this.reservations.push(created);
    return { ...created };
  }

  async findAll(bookId?: number): Promise<Reservation[]> {
    return this.reservations.filter((r) => bookId === undefined || r.book_id === bookId).map((r) => ({ ...r }));
  }

  async findById(id: number): Promise<Reservation | null> {
    const found = this.reservations.find((r) => r.id === id);
    return found ? { ...found } : null;
  }

  async findOverlapping(bookId: number, startDate: string, endDate: string): Promise<Reservation[]> {
    return this.reservations
      .filter((r) => r.book_id === bookId && (r.status === 'active' || r.status === 'issued'))
      .filter((r) => r.start_date <= endDate && startDate <= r.end_date)
      .map((r) => ({ ...r }));
  }

  async findOverdue(today: string): Promise<OverdueReservation[]> {
    const day = 24 * 60 * 60 * 1000;
    return this.reservations
      .filter((r) => r.status === 'issued' && r.end_date < today)
      .map((r) => ({ ...r, days_overdue: (Date.parse(today) - Date.parse(r.end_date)) / day }));
  }

  markCancelled(id: number): Promise<Reservation | null> {
    return this.move(id, 'active', 'cancelled');
  }

  markIssued(id: number): Promise<Reservation | null> {
    return this.move(id, 'active', 'issued');
  }

  markReturned(id: number): Promise<Reservation | null> {
    return this.move(id, 'issued', 'returned');
  }

  // Как условный UPDATE в базе: статус меняется, только если он сейчас from
  private async move(id: number, from: ReservationStatus, to: ReservationStatus): Promise<Reservation | null> {
    const found = this.reservations.find((r) => r.id === id);
    if (!found || found.status !== from) return null;
    found.status = to;
    if (to === 'issued') found.issued_at = '2026-01-01T00:00:00Z';
    if (to === 'returned') found.returned_at = '2026-01-01T00:00:00Z';
    return { ...found };
  }
}
