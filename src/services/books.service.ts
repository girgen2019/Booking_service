import { Book, BookData } from '../../Interfases/interfaces';
import { NotFoundError } from '../errors/app-errors';
import { BooksRepository } from '../repositories/books.repository';

// Ответ на ненайденную книгу оставлен прежним, чтобы не сломать клиентов
const BOOK_NOT_FOUND = '404 Not Found';

// Правила для книг. Не знает ни про HTTP-запросы, ни про SQL
export class BooksService {
  constructor(private readonly books: BooksRepository) {}

  list(): Promise<Book[]> {
    return this.books.findAll();
  }

  async get(id: number): Promise<Book> {
    return this.found(await this.books.findById(id));
  }

  create(data: BookData): Promise<Book> {
    return this.books.create(data);
  }

  async update(id: number, data: BookData): Promise<Book> {
    return this.found(await this.books.update(id, data));
  }

  async remove(id: number): Promise<Book> {
    return this.found(await this.books.delete(id));
  }

  private found(book: Book | null): Book {
    if (!book) throw new NotFoundError(BOOK_NOT_FOUND, BOOK_NOT_FOUND);
    return book;
  }
}
