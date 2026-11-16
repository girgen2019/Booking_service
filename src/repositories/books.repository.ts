import { Pool } from 'pg';
import chalk from 'chalk';
import logger from '../../utils/logger';
import { Book, BookData } from '../../Interfases/interfaces';

export interface BooksRepository {
  findAll(): Promise<Book[]>;
  findById(id: number): Promise<Book | null>;
  create(data: BookData): Promise<Book>;
  update(id: number, data: BookData): Promise<Book | null>;
  delete(id: number): Promise<Book | null>;
}

// Книги в PostgreSQL. Только SQL: никаких проверок и HTTP-статусов
export class PgBooksRepository implements BooksRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<Book[]> {
    const { rows } = await this.pool.query('SELECT * FROM books ORDER BY id ASC');
    return rows;
  }

  async findById(id: number): Promise<Book | null> {
    const { rows } = await this.pool.query('SELECT * FROM books WHERE id = $1', [id]);
    return rows[0] ?? null;
  }

  async create(data: BookData): Promise<Book> {
    const { title, author, year, price } = data;
    const { rows } = await this.pool.query(
      `INSERT INTO books (title, author, year, price)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, author, year ?? null, price ?? null]
    );
    logger.info(chalk.bgBlue(`Book ${rows[0].id} created`));
    return rows[0];
  }

  // year и price не переданы — остаются прежними
  async update(id: number, data: BookData): Promise<Book | null> {
    const { title, author, year, price } = data;
    const { rows } = await this.pool.query(
      `UPDATE books
       SET title = $1, author = $2, year = COALESCE($3, year), price = COALESCE($4, price)
       WHERE id = $5
       RETURNING *`,
      [title, author, year ?? null, price ?? null, id]
    );
    if (rows[0]) logger.info(chalk.bgBlue(`Book ${id} updated`));
    return rows[0] ?? null;
  }

  // Брони книги удаляет сама база (ON DELETE CASCADE)
  async delete(id: number): Promise<Book | null> {
    const { rows } = await this.pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [id]);
    if (rows[0]) logger.info(chalk.bgBlue(`Book ${id} deleted`));
    return rows[0] ?? null;
  }
}
