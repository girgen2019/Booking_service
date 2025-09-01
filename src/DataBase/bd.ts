/** @format */

import { Pool, PoolConfig } from 'pg';
import { DBBaseCRUD, DBConnection, BookData } from '../../Interfases/interfaces';
import logger from '../../utils/logger';
import chalk from 'chalk';

export class PostgresDB implements DBConnection, DBBaseCRUD {
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

  print() {
    console.log(this.password);
  }

  async connect() {
    await this.pool.connect();
  }

  async create(bookData:BookData) {
    const {title, author, year} = bookData
     const { rows } = await this.pool.query(
      `INSERT INTO public.books (title, autor, year)
       VALUES ($1, $2, $3)
       RETURNING id, title, autor, year`,
      [title, author, year ?? null])
  }

  async readByID(id:number) {
  const { rows } = await this.pool.query('SELECT * FROM books WHERE id = $1', [id]);
  }

  async readAll() {
    const allBooks = await this.pool.query(
      'SELECT * FROM books ORDER BY id ASC'
    );
    logger.info(chalk.greenBright(JSON.stringify(allBooks.rows)))
    return JSON.stringify(allBooks.rows);
  }

  async update() {}

  async delete(id:number) {
    const { rows } = await this.pool.query('DELETE FROM books WHERE id = $1 RETURNING *',[id]);
    if (rows.length === 0) {
      logger.warn(chalk.yellow(`Book with id ${id} not found for deletion.`));
      return null;
    }
    return JSON.stringify(rows[0]);
  }
}
